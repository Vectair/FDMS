// stores/bookingsStore.js
// UI-agnostic booking persistence helpers.
// No imports from ui_booking.js or ui_liveboard.js.

import { readJSON, writeJSON } from '../storage.js';
import { appendAuditEvent, buildFieldDiff } from '../audit.js';
import { getRunningAppVersion } from '../datamodel.js';
import { recordDiagnosticError } from '../diagnostics.js';

const BOOKINGS_STORAGE_KEY = "vectair_fdms_bookings_v1";

/**
 * Append one central audit event for a booking mutation (Phase 1 Item 5).
 * Additional to, and never a replacement for, the booking's own
 * createdAtUtc/updatedAtUtc timestamps. Isolated in its own try/catch: an
 * audit-append failure must never roll back or falsely fail an
 * already-successful booking mutation — only logs to console.error.
 */
function auditBookingEvent(action, booking, { before, after, changedFields, correlationId, metadata } = {}) {
  try {
    appendAuditEvent({
      action,
      correlationId,
      app: { name: 'Vectair Flite', version: getRunningAppVersion(), build: 'unknown' },
      source: { module: 'bookings', uiAction: action },
      entity: {
        domain: 'bookings',
        dataset: BOOKINGS_STORAGE_KEY,
        type: 'booking',
        id: booking.id,
        label: (booking.contact && booking.contact.name) || (booking.aircraft && booking.aircraft.registration) || String(booking.id)
      },
      before: before || {},
      after: after || {},
      changedFields: changedFields || [],
      reason: { code: action, note: '' },
      reversible: action !== 'booking-deleted',
      metadata: metadata || {}
    });
  } catch (e) {
    console.error(`FDMS: failed to record '${action}' audit event for booking`, booking && booking.id, e);
    recordDiagnosticError({
      type: 'audit-append-error',
      message: e.message || String(e),
      stack: e.stack || null,
      context: { action, domain: 'bookings', entityId: booking && booking.id }
    });
  }
}

let bookings = [];
let bookingsInitialised = false;
let nextBookingId = 1;

function ensureInitialised() {
  if (bookingsInitialised) return;
  const loaded = loadFromStorage();
  if (loaded && loaded.bookings) {
    bookings = loaded.bookings;

    // Migration: populate plannedTimeLocalHHMM from arrivalTimeLocalHHMM if missing
    let migrated = false;
    bookings.forEach(b => {
      if (b.schedule && !b.schedule.plannedTimeLocalHHMM && b.schedule.arrivalTimeLocalHHMM) {
        b.schedule.plannedTimeLocalHHMM = b.schedule.arrivalTimeLocalHHMM;
        // Infer kind if possible (default to ARR for backward compatibility)
        if (!b.schedule.plannedTimeKind) {
          b.schedule.plannedTimeKind = 'ARR';
        }
        migrated = true;
      }
    });

    if (migrated) {
      saveToStorage(); // Persist migration
    }

    nextBookingId = bookings.reduce((max, b) => Math.max(max, b.id || 0), 0) + 1;
  } else {
    bookings = [];
    nextBookingId = 1;
  }
  bookingsInitialised = true;
}

function loadFromStorage() {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const parsed = readJSON(BOOKINGS_STORAGE_KEY);
    if (parsed === undefined) return null;
    return (parsed && Array.isArray(parsed.bookings)) ? parsed : null;
  } catch (e) {
    console.warn("FDMS bookingsStore: failed to load", e);
    recordDiagnosticError({
      severity: 'critical',
      type: 'booking-persistence-read-error',
      message: e.message || String(e),
      stack: e.stack || null
    });
    return null;
  }
}

function saveToStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    writeJSON(BOOKINGS_STORAGE_KEY, {
      version: 1,
      timestamp: new Date().toISOString(),
      bookings
    });
  } catch (e) {
    console.warn("FDMS bookingsStore: failed to save", e);
    recordDiagnosticError({
      severity: 'critical',
      type: 'booking-persistence-write-error',
      message: e.message || String(e),
      stack: e.stack || null
    });
  }
}

/**
 * Normalize schedule fields: ensure canonical plannedTimeLocalHHMM is populated.
 * @param {object} booking - Booking object to normalize (mutates in place)
 */
function normalizeScheduleFields(booking) {
  if (!booking.schedule) return;

  const schedule = booking.schedule;

  // If arrivalTimeLocalHHMM is provided but plannedTimeLocalHHMM is missing, populate it
  if (schedule.arrivalTimeLocalHHMM && !schedule.plannedTimeLocalHHMM) {
    schedule.plannedTimeLocalHHMM = schedule.arrivalTimeLocalHHMM;

    // Infer plannedTimeKind if not already set
    if (!schedule.plannedTimeKind) {
      // Try to infer from booking's flight type field if available
      // Default to 'ARR' for backward compatibility
      schedule.plannedTimeKind = 'ARR';
    }
  }

  // If plannedTimeLocalHHMM exists and plannedTimeKind exists,
  // ensure arrivalTimeLocalHHMM is NOT overwritten for DEP types
  if (schedule.plannedTimeKind === 'DEP' && schedule.plannedTimeLocalHHMM && !schedule.arrivalTimeLocalHHMM) {
    // DEP booking: do not create arrivalTimeLocalHHMM from plannedTime
    // (keep it undefined/null)
  } else if (schedule.plannedTimeLocalHHMM && (schedule.plannedTimeKind === 'ARR' || schedule.plannedTimeKind === 'LOC')) {
    // ARR/LOC: ensure arrivalTimeLocalHHMM matches for backward compatibility
    if (!schedule.arrivalTimeLocalHHMM) {
      schedule.arrivalTimeLocalHHMM = schedule.plannedTimeLocalHHMM;
    }
  }
}

export function loadBookings() {
  ensureInitialised();
  return bookings;
}

export function saveBookings(newBookings) {
  ensureInitialised();
  bookings = newBookings;
  saveToStorage();
}

export function getBookingById(id) {
  ensureInitialised();
  return bookings.find(b => b.id === id) || null;
}

/**
 * Update a booking by ID with a patch object.
 * Deep-merges known nested keys, then shallow-assigns the rest.
 * @param {number} id – Booking ID
 * @param {object} patch – Partial booking update
 * @param {string} [correlationId] – links this update's audit event to a
 *   related event recorded by the caller (e.g. clearing linkedStripId as
 *   part of a strip soft-delete).
 * @returns {object|null} Updated booking or null if not found
 */
export function updateBookingById(id, patch, correlationId) {
  ensureInitialised();
  const booking = bookings.find(b => b.id === id);
  if (!booking) return null;

  // Snapshot before changes for no-op detection (excluding updatedAtUtc)
  const beforeSnapshotObj = { ...booking, updatedAtUtc: null };
  const before = JSON.stringify(beforeSnapshotObj);

  // Deep-merge nested objects
  const nestedKeys = ['contact', 'schedule', 'aircraft', 'movement', 'ops', 'charges'];
  const flatPatch = { ...patch };
  for (const key of nestedKeys) {
    if (flatPatch[key] && typeof flatPatch[key] === 'object' && booking[key] && typeof booking[key] === 'object') {
      booking[key] = { ...booking[key], ...flatPatch[key] };
      delete flatPatch[key];
    }
  }
  Object.assign(booking, flatPatch);

  // Normalize schedule fields to ensure canonical planned time is populated
  normalizeScheduleFields(booking);

  // No-op optimization: only save if actual changes were made (excluding updatedAtUtc)
  const afterSnapshotObj = { ...booking, updatedAtUtc: null };
  const after = JSON.stringify(afterSnapshotObj);
  if (before === after) {
    return booking; // No changes, skip save — and no central audit event either.
  }

  booking.updatedAtUtc = new Date().toISOString();
  saveToStorage();

  const diff = buildFieldDiff(beforeSnapshotObj, afterSnapshotObj);
  auditBookingEvent('booking-updated', booking, {
    before: diff.before,
    after: diff.after,
    changedFields: diff.changedFields,
    correlationId
  });

  return booking;
}

export function deleteBookingById(id, correlationId) {
  ensureInitialised();
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) return false;
  const booking = bookings[index];
  bookings.splice(index, 1);
  saveToStorage();

  auditBookingEvent('booking-deleted', booking, {
    before: {
      id: booking.id,
      contactName: booking.contact && booking.contact.name,
      registration: booking.aircraft && booking.aircraft.registration
    },
    changedFields: ['id'],
    correlationId
  });

  return true;
}

export function createBooking(data) {
  ensureInitialised();
  const now = new Date().toISOString();
  const booking = {
    id: nextBookingId++,
    createdAtUtc: now,
    updatedAtUtc: now,
    ...data
  };

  // Normalize schedule fields to ensure canonical planned time is populated
  normalizeScheduleFields(booking);

  bookings.push(booking);
  saveToStorage();

  auditBookingEvent('booking-created', booking, {
    after: {
      id: booking.id,
      contactName: booking.contact && booking.contact.name,
      registration: booking.aircraft && booking.aircraft.registration,
      dateISO: booking.schedule && booking.schedule.dateISO
    },
    changedFields: ['id', 'contactName', 'registration', 'dateISO']
  });

  return booking;
}
