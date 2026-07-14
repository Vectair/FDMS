// storage.js
// Shared persistence boundary for Vectair Flite.
//
// This module owns physical access to window.localStorage: environment/
// availability checks, raw string read/write/remove, key enumeration, and
// JSON serialization/parsing where a caller chooses the JSON helpers.
//
// It deliberately owns nothing else. Dataset schema/shape, migrations,
// defaults, corruption recovery, and backup/restore format rules remain
// with the dataset-owning module — this file has no knowledge of any
// specific storage key.

function isAvailable() {
  return typeof window !== "undefined" && !!window.localStorage;
}

/**
 * Whether physical localStorage access is currently available.
 * @returns {boolean}
 */
export function isStorageAvailable() {
  return isAvailable();
}

/**
 * Read a raw string value. Returns null if the key is absent or storage
 * is unavailable. Does not parse or interpret the value in any way.
 * @param {string} key
 * @returns {string|null}
 */
export function readRaw(key) {
  if (!isAvailable()) return null;
  return window.localStorage.getItem(key);
}

/**
 * Write a raw string value.
 * @param {string} key
 * @param {string} value
 */
export function writeRaw(key, value) {
  if (!isAvailable()) return;
  window.localStorage.setItem(key, value);
}

/**
 * Remove a key.
 * @param {string} key
 */
export function remove(key) {
  if (!isAvailable()) return;
  window.localStorage.removeItem(key);
}

/**
 * Read and JSON.parse a stored value.
 * Returns undefined if the key is absent/empty or storage is unavailable,
 * so callers can distinguish "no stored value" from a value that parses
 * to a legitimate null/false/0. A malformed (non-JSON) stored value throws
 * SyntaxError, matching the JSON.parse call it replaces — callers keep
 * whatever try/catch and fallback behaviour they already had.
 * @param {string} key
 * @returns {*|undefined}
 */
export function readJSON(key) {
  const raw = readRaw(key);
  if (!raw) return undefined;
  return JSON.parse(raw);
}

/**
 * JSON.stringify and write a value.
 * @param {string} key
 * @param {*} value
 */
export function writeJSON(key, value) {
  writeRaw(key, JSON.stringify(value));
}

/**
 * Enumerate all keys currently present in localStorage.
 * @returns {string[]}
 */
export function keys() {
  if (!isAvailable()) return [];
  const result = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key !== null) result.push(key);
  }
  return result;
}

/**
 * Total bytes used across all localStorage entries (key + value lengths).
 * Used for quota estimation only.
 * @returns {number}
 */
export function getUsageBytes() {
  if (!isAvailable()) return 0;
  let used = 0;
  for (const key in window.localStorage) {
    if (Object.prototype.hasOwnProperty.call(window.localStorage, key)) {
      used += window.localStorage[key].length + key.length;
    }
  }
  return used;
}
