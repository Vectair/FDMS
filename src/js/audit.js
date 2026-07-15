// audit.js
// Central append-only cross-cutting audit ledger for Vectair Flite.
//
// Scope (Phase 1 Item 5): this is the ONE canonical audit-event stream for
// VKB reference-data changes, system/backup events, and core operational
// mutations (movements, formations, bookings). It is additional to, and does
// NOT replace, existing dataset-specific history mechanisms:
//   - movement.changeLog
//   - vectair_fdms_cancelled_sorties_v1
//   - vectair_fdms_deleted_strips_v1
//   - booking createdAtUtc / updatedAtUtc
// Those remain the authoritative recovery/history data for their domains.
// This ledger is a compact, cross-domain "what happened" record layered on
// top, not a replacement for any of them.
//
// ─── Canonical audit-event envelope ─────────────────────────────────────────
// Every event appended via appendAuditEvent() is normalised to this shape.
// Not every field must carry substantive data for every event (e.g. `before`/
// `after` are legitimately {} for a creation or a system event), but the
// envelope shape itself is always the same — no per-domain parallel schema.
//
//   {
//     schemaVersion,       // number — envelope schema version (see SCHEMA_VERSION)
//     id,                  // string — unique event id
//     changedAt,           // ISO timestamp — when the event was recorded
//     correlationId,       // string — links multiple events from one user action
//
//     actor: {
//       type,               // e.g. "local-user" (placeholder until Item 9.1 operator identity)
//       displayName
//     },
//
//     app: {
//       name,               // "Vectair Flite"
//       version,            // real running app version where known, else "dev"
//       build
//     },
//
//     source: {
//       module,             // owning module, e.g. "movements", "bookings", "admin-vkb-editor"
//       uiAction            // the user/system action that triggered this event
//     },
//
//     entity: {
//       domain,             // e.g. "movements", "bookings", "vkb", "system"
//       dataset,            // storage key or logical dataset name
//       type,               // e.g. "movement", "booking", "reference-record"
//       id,                 // entity id
//       label               // human-readable label (callsign, registration, etc.)
//     },
//
//     action,               // e.g. "movement-created", "booking-updated", "vkb.edit"
//
//     before,               // compact changed-field values only — never a full snapshot
//     after,                // compact changed-field values only — never a full snapshot
//     changedFields,        // array of field names that actually changed
//
//     reason: {
//       code,
//       note
//     },
//
//     reversible,           // boolean — best-effort hint, not enforced
//     metadata              // small, domain-specific extra context
//   }
//
// Domain-specific top-level extensions (e.g. VKB's `effectiveFrom`/
// `effectiveTo`) may sit alongside this envelope where an existing domain
// already relies on them — that is an additive extension, not a competing
// schema, and is preserved unchanged here.
//
// ─── Helper responsibilities in this module ─────────────────────────────────
//   - normalise/complete an event envelope   → appendAuditEvent()
//   - validate required core event fields    → validateAuditEventCore() (advisory only)
//   - append an event                        → appendAuditEvent()
//   - generate event id                      → generateId()
//   - generate correlation id                → generateCorrelationId()
//   - build compact field differences        → buildFieldDiff()
//   - retrieve events                        → getAuditEventsForEntity()
//   - summarise events                       → getAuditSummary()
//
// This module is intentionally small and dependency-light. It is not a
// framework: callers construct their own domain-shaped `entity`/`source`/
// `reason` blocks and call appendAuditEvent() (or the auditEntityChange()
// convenience wrapper for the VKB "did any field change" pattern).

import { readJSON, writeJSON } from './storage.js';

export const AUDIT_LOG_KEY = "vectair_flite_audit_log_v1";

const SCHEMA_VERSION = 1;

function nowISO() {
  return new Date().toISOString();
}

function generateId() {
  const ts = nowISO().replace(/\D/g, '').slice(0, 17);
  const rand = Math.random().toString(36).slice(2, 8);
  return `audit_${ts}_${rand}`;
}

/**
 * Generate a correlation id used to link multiple audit events that result
 * from a single user action (e.g. a cancellation that produces both a
 * movement status change and a formation cascade). Exported so call sites
 * that need to tie several appendAuditEvent() calls together can generate
 * one id up front and pass it through explicitly.
 */
export function generateCorrelationId() {
  const ts = nowISO().replace(/\D/g, '').slice(0, 17);
  const rand = Math.random().toString(36).slice(2, 6);
  return `op_${ts}_${rand}`;
}

/**
 * Advisory-only check for the core fields every event should carry.
 * Never blocks or throws — an audit event with a missing optional field must
 * never prevent an already-successful operational mutation from being
 * considered complete. Logs to console.error so gaps are visible in
 * diagnostics without building dedicated error-persistence UX (out of scope
 * for this ticket).
 */
function validateAuditEventCore(event) {
  if (!event || typeof event.action !== 'string' || !event.action.trim()) {
    console.error("FDMS audit: event missing required 'action' field", event);
    return;
  }
  if (!event.entity || typeof event.entity !== 'object' || event.entity.domain === undefined || event.entity.id === undefined) {
    console.error("FDMS audit: event missing required 'entity.domain'/'entity.id' fields", event);
  }
}

/**
 * Read the audit log from localStorage.
 * Returns a safe default if absent or malformed.
 */
export function getAuditLog() {
  try {
    const parsed = readJSON(AUDIT_LOG_KEY);
    if (parsed === undefined || !parsed || typeof parsed !== 'object' || !Array.isArray(parsed.events)) {
      return { version: 1, updatedAt: null, events: [] };
    }
    return parsed;
  } catch (_) {
    return { version: 1, updatedAt: null, events: [] };
  }
}

/**
 * Write the audit log to localStorage, stamping updatedAt.
 */
export function saveAuditLog(log) {
  writeJSON(AUDIT_LOG_KEY, { ...log, updatedAt: nowISO() });
}

/**
 * Append one event to the audit log.
 * Generates id, changedAt, schemaVersion, actor, correlationId if not supplied.
 * This is the single normalisation point for the canonical envelope — every
 * domain (VKB, system/backup, movements, formations, bookings) funnels
 * through here rather than writing to AUDIT_LOG_KEY directly.
 */
export function appendAuditEvent(event) {
  validateAuditEventCore(event);
  const log = getAuditLog();
  const now = nowISO();
  const completed = {
    ...event,
    schemaVersion: SCHEMA_VERSION,
    id: event.id || generateId(),
    changedAt: event.changedAt || now,
    correlationId: event.correlationId || generateCorrelationId(),
    actor: event.actor || { type: 'local-user', displayName: 'local user' },
    app: event.app || { name: 'Vectair Flite', version: 'dev', build: 'unknown' },
  };
  log.events.push(completed);
  saveAuditLog(log);
  return completed;
}

/**
 * Compare before/after field values and return only changed fields.
 * Normalises using string conversion for comparison but preserves actual
 * stored scalar values in the returned before/after objects. Object/array
 * values are replaced with a compact placeholder so no caller can
 * accidentally embed a full large snapshot (a movement, a formation, a
 * booking) into every audit event — see canonical envelope note above.
 *
 * @param {Object} before
 * @param {Object} after
 * @param {string[]|null} fields - limit comparison to these fields; null = all fields from both objects
 * @returns {{ before: Object, after: Object, changedFields: string[] }}
 */
export function buildFieldDiff(before, after, fields = null) {
  const b = before || {};
  const a = after || {};
  const allFields = fields || [...new Set([...Object.keys(b), ...Object.keys(a)])];
  const changedFields = [];
  const beforeDiff = {};
  const afterDiff = {};

  for (const field of allFields) {
    const bVal = b[field] !== undefined ? b[field] : null;
    const aVal = a[field] !== undefined ? a[field] : null;
    const bStr = bVal === null ? '' : String(bVal);
    const aStr = aVal === null ? '' : String(aVal);
    if (bStr !== aStr) {
      changedFields.push(field);
      beforeDiff[field] = compactAuditValue(bVal);
      afterDiff[field] = compactAuditValue(aVal);
    }
  }

  return { before: beforeDiff, after: afterDiff, changedFields };
}

/**
 * Reduce a field value to something safe to store verbatim in a compact
 * audit event. Scalars pass through unchanged (this covers every VKB field
 * today, so existing VKB audit behaviour is unaffected). Arrays/objects
 * (e.g. a movement's `formation`, a booking's `charges`) are reduced to a
 * short descriptive placeholder instead of being duplicated in full.
 */
function compactAuditValue(v) {
  if (v === null || v === undefined) return v;
  const t = typeof v;
  if (t === 'string' || t === 'number' || t === 'boolean') return v;
  if (Array.isArray(v)) return `[array:${v.length}]`;
  if (t === 'object') return '[object]';
  return String(v);
}

/**
 * Convenience wrapper: compute field diff and append an audit event.
 * Returns null if no fields changed.
 */
export function auditEntityChange({
  domain,
  dataset,
  entityType = 'reference-record',
  entityId,
  label,
  action,
  before = {},
  after = {},
  source,
  reason,
  effectiveFrom = new Date().toISOString().slice(0, 10),
  effectiveTo = null,
  correlationId,
  reversible = true
}) {
  const diff = buildFieldDiff(before, after);
  if (diff.changedFields.length === 0) return null;

  return appendAuditEvent({
    effectiveFrom,
    effectiveTo,
    source: source || { module: 'admin-vkb-editor', uiAction: 'save-local-override' },
    entity: {
      domain,
      dataset,
      type: entityType,
      id: entityId,
      label: label || entityId
    },
    action,
    before: diff.before,
    after: diff.after,
    changedFields: diff.changedFields,
    reason: reason || { code: 'operational-reference-update', note: '' },
    ...(correlationId ? { correlationId } : {}),
    reversible
  });
}

/**
 * Return all audit events for a specific entity (domain + id).
 */
export function getAuditEventsForEntity(domain, entityId) {
  const log = getAuditLog();
  return log.events.filter(e =>
    e.entity && e.entity.domain === domain && e.entity.id === entityId
  );
}

/**
 * Return top-level summary stats.
 */
export function getAuditSummary() {
  const log = getAuditLog();
  return {
    totalEvents: log.events.length,
    updatedAt: log.updatedAt
  };
}
