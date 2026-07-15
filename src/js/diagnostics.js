// diagnostics.js
// Dedicated technical-diagnostics boundary for Vectair Flite (Phase 1 Item 6).
//
// This module owns the ONE new persistent store this ticket introduces —
// a small, bounded log of technical error events (JS exceptions, failed
// persistence, failed backup/restore, etc.) so they survive reload/restart
// long enough to be copied into a diagnostic report after the fact.
//
// This is NOT the operational audit ledger (see audit.js — movements,
// bookings, VKB reference-data changes, backup-exported/-restored) and NOT
// a general logging framework: no console interception, no telemetry, no
// automatic upload. Callers deliberately call recordDiagnosticError() at
// points that would materially help diagnose a real technical failure.
//
// A recording failure here must never throw or otherwise affect the
// caller's own success/failure — every exported function is self-isolating.

import { readJSON, writeJSON } from './storage.js';

export const DIAGNOSTIC_LOG_KEY = 'vectair_flite_diagnostic_log_v1';

const MAX_DIAGNOSTIC_EVENTS = 100;
const DEDUP_WINDOW_MS = 5000;
const MAX_MESSAGE_LEN = 500;
const MAX_STACK_LEN = 2000;
const MAX_SOURCE_LEN = 300;
const MAX_CONTEXT_JSON_LEN = 1000;

let _idCounter = 0;

function nowISO() {
  return new Date().toISOString();
}

function generateEventId() {
  _idCounter = (_idCounter + 1) % 1000000;
  return `diag_${Date.now().toString(36)}_${_idCounter.toString(36)}`;
}

function truncate(str, maxLen) {
  if (typeof str !== 'string') return str;
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Bound a caller-supplied context object so one oversized/careless call
 * can't grow the persisted log unreasonably. Never a full record dump —
 * callers are expected to pass small, compact context already.
 */
function boundContext(context) {
  if (context === null || context === undefined) return null;
  try {
    const json = JSON.stringify(context);
    if (json.length <= MAX_CONTEXT_JSON_LEN) return context;
    return { truncated: true, preview: json.slice(0, MAX_CONTEXT_JSON_LEN) + '…' };
  } catch (_) {
    return null;
  }
}

function emptyLog() {
  return { version: 1, updatedAt: null, events: [] };
}

function readLog() {
  try {
    const parsed = readJSON(DIAGNOSTIC_LOG_KEY);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.events)) {
      return emptyLog();
    }
    return parsed;
  } catch (_) {
    return emptyLog();
  }
}

function writeLog(log) {
  writeJSON(DIAGNOSTIC_LOG_KEY, { version: 1, updatedAt: nowISO(), events: log.events });
}

/**
 * Record one technical diagnostic error event to the bounded persistent log.
 *
 * Never throws — a diagnostic-recording failure must never surface as, or
 * cause, an operational failure. Returns null (rather than throwing) if
 * persistence itself is unavailable or fails.
 *
 * Deduplication: if the most recently recorded event has the same type,
 * message, and source, and occurred within the last 5 seconds, this call
 * updates that event's time/occurrence count in place instead of appending
 * a new record — a conservative guard against rapid identical-error floods,
 * not general clustering/analytics.
 *
 * @param {{severity?: string, type: string, message: string, source?: string|null,
 *   line?: number|null, column?: number|null, stack?: string|null, context?: object|null}} event
 * @returns {object|null} the recorded/updated entry, or null on failure
 */
export function recordDiagnosticError({
  severity = 'error',
  type = 'error',
  message,
  source = null,
  line = null,
  column = null,
  stack = null,
  context = null
} = {}) {
  try {
    const log = readLog();
    const time = nowISO();
    const boundedMessage = truncate(message || 'unknown', MAX_MESSAGE_LEN);
    const boundedSource = source != null ? truncate(String(source), MAX_SOURCE_LEN) : null;

    const events = log.events;
    const last = events[events.length - 1];
    if (
      last &&
      last.type === type &&
      last.message === boundedMessage &&
      last.source === boundedSource &&
      (Date.parse(time) - Date.parse(last.time)) <= DEDUP_WINDOW_MS
    ) {
      last.time = time;
      last.occurrences = (last.occurrences || 1) + 1;
      writeLog(log);
      return last;
    }

    const entry = {
      id: generateEventId(),
      time,
      severity,
      type,
      message: boundedMessage,
      source: boundedSource,
      line: line != null ? line : null,
      column: column != null ? column : null,
      stack: stack ? truncate(String(stack), MAX_STACK_LEN) : null,
      context: boundContext(context),
      occurrences: 1
    };

    events.push(entry);
    if (events.length > MAX_DIAGNOSTIC_EVENTS) {
      events.splice(0, events.length - MAX_DIAGNOSTIC_EVENTS);
    }
    writeLog(log);
    return entry;
  } catch (_) {
    return null;
  }
}

/**
 * Read persisted diagnostic error events, most recent first.
 * @param {number} [limit] - max events to return (default: all persisted, up to 100)
 * @returns {Array<object>}
 */
export function getRecentDiagnosticErrors(limit = MAX_DIAGNOSTIC_EVENTS) {
  try {
    const log = readLog();
    return log.events.slice(-limit).reverse();
  } catch (_) {
    return [];
  }
}

/**
 * Number of persisted diagnostic events currently stored (0-100).
 * @returns {number}
 */
export function getDiagnosticErrorCount() {
  return readLog().events.length;
}

/**
 * Clear the persistent diagnostic error log. Deliberate operator action only
 * (Admin → System Status → Clear diagnostic error history). Touches only
 * this store — never the operational audit ledger or any operational
 * dataset.
 * @returns {boolean} true if the clear was written successfully
 */
export function clearDiagnosticErrorLog() {
  try {
    writeJSON(DIAGNOSTIC_LOG_KEY, emptyLog());
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Build one bootstrap-stage log entry in the shared shape. The stage log
 * itself remains caller-owned, in-memory, session-scoped state (bootstrap
 * progress does not need to survive reload — only diagnostic errors do);
 * this only centralises the entry shape so callers agree on it.
 * @param {string} label
 * @param {string} status - "started" | "success" | "failed"
 * @param {string|null} [detail]
 * @returns {{time: string, label: string, status: string, detail: string|null}}
 */
export function makeBootstrapStageEntry(label, status, detail = null) {
  return { time: nowISO(), label, status, detail };
}

/**
 * A compact snapshot of the persistent diagnostic store's current state,
 * for callers (e.g. the diagnostic report) that want the persisted side
 * without reaching into storage directly.
 * @returns {{count: number, updatedAt: string|null, recent: Array<object>}}
 */
export function getDiagnosticSnapshot() {
  const log = readLog();
  return {
    count: log.events.length,
    updatedAt: log.updatedAt,
    recent: log.events.slice(-10).reverse()
  };
}
