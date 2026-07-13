# DATA_INVENTORY.md — Vectair Flite Canonical Data Inventory & Persistence Audit

Status: **Audit document — not a design proposal.** Produced under Phase 1 Item 2 (Canonical Data Inventory & Persistence Audit); corrected and completed under Phase 1 Item 2A (Canonical Data Inventory Corrections). No runtime behaviour was changed to produce or correct this document.

Audit date: 2026-07-10 (original) · corrected 2026-07-13 (Item 2A)
Audit scope: entire repository (`src/`, `src-tauri/`, `docs/`, root tooling)
Audit method: static code search + manual read-through of every persistence call site. No dynamic/runtime instrumentation was used.

This document is the authoritative reference for:

- Backup / Restore
- Integrity Checker (future)
- Diagnostics
- Future SQLite migration
- Documentation
- Future maintenance

It is the definitive reference for Flite's persistence architecture prior to Phase 1 Item 3 (Backup Validation & Restore Summary).

---

## 1. Overview

Vectair Flite is a single-client, offline-first desktop application (Tauri v2 shell around a static HTML/CSS/JS frontend). It has:

- no backend server
- no hosted/cloud storage
- no multi-user concurrency model
- no SQL database (SQLite migration is a future, not-yet-started item)

**All application state currently lives in browser `localStorage`, inside the Tauri-managed WebView.** There is no Tauri-side filesystem persistence for application data (no `plugin-store`, no `plugin-fs`, no app-data-dir JSON/config files, no log files). The only Rust-side filesystem writes are user-directed **Save As** exports (CSV/XLSX), which are generated output, not application state.

```
Physical storage location (not app-controlled):
  Windows → WebView2 per-app data folder → Local Storage LevelDB/SQLite files
  Linux   → WebKitGTK per-app data folder → Local Storage database file
```

Flite does not configure a Tauri `app_data_dir` and does not use `BaseDirectory` file APIs for its own state. The WebView engine chooses and manages the on-disk location for `localStorage` automatically; the application only ever sees `window.localStorage`, never a file path.

### 1.1 Persistence architecture at a glance

```
┌─────────────────────────────────────────────────────────────┐
│ Tauri Desktop Shell (src-tauri/)                              │
│  - No app-data persistence                                    │
│  - No plugin-store / plugin-fs                                │
│  - save_text_file_with_dialog / save_binary_file_with_dialog  │
│    → user-chosen path, EXPORT ONLY, not read back by the app  │
│  - tauri-plugin-updater: in-memory pending update (Mutex),    │
│    not persisted across restarts                              │
│  - tauri.conf.json: static window geometry, not persisted     │
│    window state (no window-state plugin)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                    (WebView2 / WebKitGTK)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Browser localStorage (per-origin, engine-managed on disk)     │
│  - 10 static keys in SESSION_BACKUP_KEYS                      │
│  - 1 dynamic per-date key family (generic overflights)        │
│  - 3 keys NOT in SESSION_BACKUP_KEYS (metar draft, updater×2) │
│  - 2 legacy keys, migrated-then-deleted on first load (v1/v2) │
│  Total: 10 + 1 + 3 + 2 = 16 localStorage keys/key-families.   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Bundled reference data (src/data/*.csv)                       │
│  - Read-only files shipped with the app                       │
│  - Loaded via fetch() at runtime, never written by the app    │
│  - Mutated indirectly via the VKB overrides localStorage layer│
│  - 8 files. NOT localStorage; counted separately from the 16. │
└─────────────────────────────────────────────────────────────┘
```

There is no `sessionStorage`, `indexedDB`, `window.name`, or cookie usage anywhere in the repository.

### 1.2 Storage-class terminology

The following canonical class terms are used consistently throughout this document (Storage Classes headings in §2, the `Class` column of the Persistence Matrix in §3, and the Gap Analysis in §8). No other class labels are used:

- **Operational Data** — cannot be lost; the live record of flights/bookings/lifecycle state.
- **Supporting Operational Data** — feeds operational reporting but is not itself a live safety/operational record.
- **Configuration** — application-wide behavioural settings.
- **User Preferences** — local/machine convenience settings.
- **Diagnostics** — troubleshooting, audit, and system-status information.
- **Cache** — regenerable, disposable convenience data.
- **Reference Data** — lookup/override data (bundled baseline + mutable override layer).
- **Migration** — legacy, transitional, consumed-then-deleted stores.
- **Export** — generated output, never read back by the application.

(A separate `Canonical?` axis — `Authoritative` / `Migration-only` / `Cache` / `Diagnostic` / `Temporary` / `Export`, per the original Phase 1 Item 2 scope — is used independently in the Persistence Matrix and is not to be confused with the `Class` column above.)

---

## 2. Storage Classes

### 2.1 Operational Data (cannot be lost)

| Key | Owner | Purpose |
|---|---|---|
| `vectair_fdms_movements_v3` | Booking/Live Board/History (movements) | The core operational record: every flight strip (Live Board, History, Cancelled, Formation elements nested inside). |
| `vectair_fdms_cancelled_sorties_v1` | Cancelled Sorties | Append-mostly audit trail of cancelled movements. |
| `vectair_fdms_deleted_strips_v1` | Deleted Strips | 24h soft-delete retention store (full movement snapshots). |
| `vectair_fdms_bookings_v1` | Booking System | Booking records (contact, schedule, aircraft, charges), linked to strips via `bookingId`/`linkedStripId`. |
| `vectair_fdms_calendar_events_v1` | Booking / Calendar | Calendar entries shown in the Booking/Calendar views. |
| `fdms_generic_overflights_${YYYY-MM-DD}` (dynamic family) | Live Board | Per-day counters for "free caller" overflights not on the strip bay. |

### 2.2 Supporting Operational Data (Reporting)

Data that is not itself a live operational safety record, but directly supports operational reporting outputs (the Monthly Return) and is materially different from a display/behaviour preference.

| Key | Owner | Purpose |
|---|---|---|
| `vectair_fdms_hours_v1` | Reports | Map of `YYYY-MM-DD → hours flown`, manually entered and consumed by the Official Monthly Return. Reclassified out of User Preferences under Item 2A: it is operational reporting input, not a display/behaviour preference, and is not scoped to a machine or a UI convenience the way §2.4 entries are. |

### 2.3 Configuration (application behaviour)

| Key | Owner | Purpose |
|---|---|---|
| `vectair_fdms_config` | Admin / app-wide | Single JSON blob of ~50 behavioural settings (offsets, auto-activate rules, timeline display, History filter defaults, WTC alert thresholds, etc.). No per-user vs per-machine separation — one config object governs the whole app. |

### 2.4 User Preferences (local/machine convenience)

| Key | Owner | Purpose |
|---|---|---|
| `fdms_booking_profiles_v1` | Booking System | Saved contact/aircraft info per registration, for repeat visitors. Precedence: profile > VKB registration DB. |
| `vectair_flite_check_updates_on_launch_v1` | Admin / Updater | Boolean: whether to auto-check for updates on launch. |
| `vectair_flite_last_update_check_v1` | Admin / Updater | Timestamp of the last update check (display only). |
| `vectair_fdms_metar_builder_last_v1` | Weather / METAR Builder | Last-entered METAR Builder draft state (recalled on next visit to the Weather tab). Class is best described as `Cache` in the Persistence Matrix (§3) — listed here because it is user/session convenience data, not because it behaves like a preference. |

### 2.5 Reference Data

| Item | Owner | Type |
|---|---|---|
| `src/data/*.csv` (8 files: aircraft types, standard/non-standard callsigns, locations, registrations, EGOW codes, callsign key, aircraft pilots) | VKB | **Bundled, read-only baseline.** Loaded via `fetch()` in `vkb.js`. Never written by the app. |
| `vectair_fdms_vkb_overrides_v1` | VKB | **Mutable override layer** on top of the bundled CSV baseline. Local edits (EGOW codes, registrations, aircraft-pilot links) are stored here and merged over the baseline at lookup time. Does not modify the CSV files themselves. |

### 2.6 Diagnostics

| Item | Owner | Type |
|---|---|---|
| `vectair_flite_audit_log_v1` | Admin / VKB | Append-only ledger of VKB reference-data changes (who/what/when/before/after). Scope is explicitly VKB only — movements and bookings are **not** audited here. |
| `diagnostics` object (`app.js`) | Admin / System Status | **In-memory only, not persisted.** Bootstrap stage log, error log, timing. Reset on every reload. Surfaced via `generateDiagnosticReport()` as a generated text report (Export, not storage). |
| `window.__fdmsDiag` counters (`bookingSync.js`) | Dev diagnostics | **In-memory only.** Optional counters gated behind `window.__FDMS_DIAGNOSTICS__`. |

### 2.7 Migration Stores (legacy, transitional)

| Key | Status |
|---|---|
| `vectair_fdms_movements_v1` | Legacy bare-array schema. Read once by `migrateFromV1()`, migrated into v3 in memory, then `removeItem()`'d. Not present after first successful load on any given profile. |
| `vectair_fdms_movements_v2` | Legacy `{version:2, movements:[]}` schema. Read once by `migrateFromV2()`, migrated into v3, then `removeItem()`'d. |

### 2.8 Exports (generated output — NOT authoritative storage)

None of the following are read back by the application. They are one-way generated artifacts.

| Export | Generator | Format |
|---|---|---|
| Full session backup | `exportSessionJSON()` (`datamodel.js`) via Admin → System Status | `vectair-flite-backup-YYYYMMDD-HHMMSS.json` |
| Movements/History CSV | `exportHistoryCSV()` (`ui_liveboard.js`) | `fdms-movement-history-YYYY-MM-DD.csv` |
| Search/Table filtered CSV | `exportHistorySearchCSV()` (`ui_liveboard.js`) | `flite-history-search-YYYY-MM-DD.csv` |
| Cancelled Sorties CSV | `exportCancelledSortiesCSV()` (`ui_liveboard.js`) | `fdms-cancelled-sorties-YYYY-MM-DD.csv` |
| Monthly Return CSV | `exportMovementsToCSV()` (`reporting.js`) | `movements.csv` (caller-supplied name) |
| Monthly Return XLSX | `exportMonthlyReturnToXLSX()` (`reporting.js`) | `monthly_return.xlsx` |
| Cancellation report CSV | `exportCancellationsToCSV()` (`reporting.js`) | caller-supplied name |
| Diagnostic report | `generateDiagnosticReport()` (`app.js`) | Plain text, copy/save from Admin → System Status |

All exports route through `src/js/export_utils.js`, which uses native Tauri Save As (`save_text_file_with_dialog` / `save_binary_file_with_dialog`, both in `src-tauri/src/lib.rs`) when running in the desktop app, falling back to a browser Blob download otherwise.

---

## 3. Persistence Matrix

Storage Type legend: `LS` = browser localStorage. Backup legend: `Included` = covered by `SESSION_BACKUP_KEYS` (static list) or the dynamic generic-overflight sweep in `exportSessionJSON()`/`importSessionJSON()`; `Excluded` = not covered.

`Diagnostic Bundle` (added under Item 2A): whether the dataset's presence/count is currently surfaced by the Admin → System Status diagnostic report (`generateDiagnosticReport()`). One of `Included` / `Excluded` / `Not applicable` (the dataset is not the kind of thing the diagnostic report could meaningfully cover — e.g. bundled files, generated exports) / `Future` (currently excluded but explicitly flagged elsewhere in this audit's Gap Analysis as a candidate for future inclusion).

`Operational / Safety Significance` (added under Item 2A): an engineering-judgement rating — not a formal risk assessment — of how materially the dataset affects live operational or safety-relevant behaviour if it were lost or corrupted. One of `High` / `Medium` / `Low` / `None`.

| Dataset (key) | Owner | Storage | Class | Canonical | Backup | Restore | Validation | Regenerable | Diagnostic Bundle | Op./Safety Significance | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `vectair_fdms_movements_v3` | Live Board / History | LS | Operational Data | Authoritative | Included | Restored (replace) | Schema-version tag (`version:3`); array shape check | No | Included | High | Core record. Wrapped `{version,timestamp,movements}`. |
| `vectair_fdms_movements_v2` | (legacy) | LS | Migration | Migration-only | Excluded | N/A — consumed by migration | `version===2` shape check | N/A | Not applicable | None | Removed via `removeItem()` immediately after migration to v3. |
| `vectair_fdms_movements_v1` | (legacy) | LS | Migration | Migration-only | Excluded | N/A — consumed by migration | `Array.isArray` only | N/A | Not applicable | None | Removed via `removeItem()` immediately after migration to v3. |
| `vectair_fdms_config` | Admin | LS | Configuration | Authoritative | Included | Restored (replace, merged with defaults on load) | Spread over `defaultConfig`; one ad-hoc field migration (`showDepEstimatedTimesOnStrip`) | Partially (defaults) | Excluded | Medium | Single flat object, ~50 fields, no version field. Governs auto-activate/timing/alert behaviour, so incorrect restore has real operational effect even though the object itself is not a live record. |
| `vectair_fdms_cancelled_sorties_v1` | Cancelled Sorties | LS | Operational Data | Authoritative | Included | Restored (replace) | `ensureCancelledSortiesInitialised()` resets to `[]` if corrupt | No (append-only log) | Included | Medium | Guards against duplicate log entries per `sourceMovementId` unless reinstated. |
| `vectair_fdms_deleted_strips_v1` | Deleted Strips | LS | Operational Data | Authoritative (time-boxed) | Included | Restored (replace) | `ensureDeletedStripsInitialised()` resets to `[]` if corrupt | No | Included | Medium | 24h retention (`DELETED_STRIPS_RETENTION_HOURS`); `purgeExpiredDeletedStrips()` deletes entries whose `expiresAt` has passed, on render. Medium: it is the only recovery path for accidentally deleted operational records. |
| `fdms_booking_profiles_v1` | Booking System | LS | User Preferences | Authoritative (convenience) | Included | Restored (replace) | Presence/shape check (`parsed.profiles`) only | No | Included | Low | Keyed by normalized registration. |
| `vectair_fdms_calendar_events_v1` | Booking / Calendar | LS | Operational Data | Authoritative | Included | Restored (replace) | `Array.isArray(parsed.events)` only | No | Included | Medium | No schema version; wrapped `{version,timestamp,events}` but the version field is unchecked on read. |
| `vectair_fdms_hours_v1` | Reports | LS | Supporting Operational Data | Authoritative | Included | Restored (replace) | None beyond JSON parse | No | Included | Low | Map `date → hours`; no schema version. Reclassified from User Preferences under Item 2A — see §2.2. |
| `vectair_fdms_vkb_overrides_v1` | VKB | LS | Reference Data | Authoritative (override layer) | Included | Restored (replace) | Legacy-shape migration (`_migrateOverrides`), registration key re-canonicalisation on every load | No (baseline CSVs are, but overrides aren't) | Excluded | Medium | Sits above bundled CSV baseline; 3 datasets: `egowCodes`, `registrations`, `aircraftPilots`. Affects EGOW/registration/pilot attribution used operationally. |
| `vectair_flite_audit_log_v1` | Admin / VKB | LS | Diagnostics | Diagnostic | Included | Restored (replace) | `Array.isArray(parsed.events)` fallback to empty | No (historical ledger) | Excluded | Medium | VKB-change scope only; movements/bookings not covered. |
| `vectair_fdms_bookings_v1` | Booking System | LS | Operational Data | Authoritative | Included | Restored (replace) | `Array.isArray(parsed.bookings)` only | No | Included | Medium | One in-place migration for `plannedTimeLocalHHMM` runs on every load. |
| `fdms_generic_overflights_${date}` (dynamic) | Live Board | LS | Operational Data | Authoritative | Included (swept by regex, not by static key) | Restored (strict regex allow-list, never arbitrary keys) | Regex `^fdms_generic_overflights_\d{4}-\d{2}-\d{2}$` | No | Excluded | Low | One key per calendar date; never proactively deleted (see Gap Analysis §8.2). |
| `vectair_fdms_metar_builder_last_v1` | Weather / METAR Builder | LS | Cache | Cache (last-draft convenience) | **Excluded** | Ignored (not restored) | Several in-place legacy-shape migrations on load | Yes (user re-enters) | Future | Low | **Intentionally excluded from `SESSION_BACKUP_KEYS` today; product decision should confirm whether this is desired.** See Gap Analysis §8.1. |
| `vectair_flite_check_updates_on_launch_v1` | Admin / Updater | LS | User Preferences | Authoritative (preference) | Excluded | Ignored | None | Yes (defaults to enabled) | Excluded | None | Intentionally machine-local; reasonable exclusion. |
| `vectair_flite_last_update_check_v1` | Admin / Updater | LS | Diagnostics | Diagnostic | Excluded | Ignored | None | Yes | Excluded | None | Display-only timestamp; reasonable exclusion. |
| `src/data/*.csv` (×8) | VKB | Bundled file | Reference Data | Authoritative baseline | N/A (ships with app/installer) | Reinstall/upgrade only | None (no schema check) | Yes, by reinstalling | Not applicable | High | Read-only at runtime; not part of any backup/restore flow. Underpins EGOW/registration/callsign lookups used across operational classification and reporting. |
| Session backup JSON | Admin | Generated file | Export | Export | N/A | Manual (Admin → Restore) | Format/version sniffing (4 formats recognised) | N/A | Not applicable | Medium | See §2.8. The only whole-application disaster-recovery mechanism today. |
| CSV/XLSX report exports | Reports/History/Cancelled | Generated file | Export | Export | N/A | N/A (one-way) | N/A | N/A | Not applicable | Low | See §2.8. |
| Diagnostic report | Admin | Generated text | Export | Export | N/A | N/A | N/A | N/A | Not applicable | None | See §2.8. Troubleshooting output only. |
| `diagnostics` in-memory object | app.js | In-memory (JS variable) | Diagnostics | Temporary | N/A | N/A | N/A | Yes (empty on reload) | Included | None | Never touches localStorage; this is the source object the diagnostic report is generated from. |

**Row-count reconciliation:** 16 `localStorage` rows (10 backed-up static + 1 dynamic family + 3 intentionally excluded static + 2 legacy migration-only) + 5 non-`localStorage` rows (1 bundled CSV set + 4 generated Export/Diagnostics rows) = **21 matrix rows total.** This matches §9 (Audit Report) totals below.

---

## 4. Relationship / Storage Architecture Diagram

```
                              User
                               │
                 ┌─────────────┼──────────────────────────────────────┐
                 ▼             ▼                                      ▼
             Live Board     Booking                                 VKB Lookup
                 │             │                                      │
                 │             ├── vectair_fdms_bookings_v1            ├── src/data/*.csv (baseline, read-only)
                 │             ├── vectair_fdms_calendar_events_v1     └── vectair_fdms_vkb_overrides_v1 (override layer)
                 │             └── fdms_booking_profiles_v1                    │
                 │                     │                                       │
                 │      bookingSync.reconcileLinks()                    used by lookups from:
                 │      (bookingId ⇄ linkedStripId)                     Live Board / Booking / Reports
                 │                     │
                 ▼                     ▼
         vectair_fdms_movements_v3 ◄───┘   (movement.bookingId / booking.linkedStripId)
                 │
      ┌──────────┼───────────────────────────────────────┐
      ▼          ▼                                       ▼
   History    Cancelled                                Reports
      │      ┌────┴─────────────────────┐                 │
      │      ▼                          ▼                 ├── vectair_fdms_hours_v1  (Supporting Operational Data)
      │  vectair_fdms_cancelled_    vectair_fdms_          │
      │  sorties_v1                 deleted_strips_v1      └── (reads movements + cancelled sorties;
      │  (soft/immutable log)       (24h retention,             writes only CSV/XLSX exports —
      │                              purge on render)            no dedicated storage of its own)
      ▼
  fdms_generic_overflights_${date}  (Live Board FIS/overflight counters, one key per day)

  vectair_flite_audit_log_v1  ← independent append-only ledger, fed only by VKB Admin edits
                                  (egowCodes / registrations / aircraftPilots overrides)

  vectair_fdms_config  ← independent, read by nearly every module (offsets, display toggles,
                          History filter defaults); written only from Admin → Configuration

  vectair_fdms_metar_builder_last_v1  ← independent, Weather tab only, no relationship to
                                          movements/bookings/reports

  vectair_flite_check_updates_on_launch_v1 / vectair_flite_last_update_check_v1
    ← independent, Admin → System Status → Updates only

                 │
                 ▼
          Admin → Backup System
       exportSessionJSON() / importSessionJSON()
     (SESSION_BACKUP_KEYS ∪ dynamic generic-overflight keys)
                 │
                 ▼
     vectair-flite-backup-YYYYMMDD-HHMMSS.json
       (generated export file — one-way unless
        explicitly re-imported via Admin → Restore)
```

**Independent (no cross-dataset dependency) datasets:** `vectair_fdms_config`, `vectair_fdms_vkb_overrides_v1` + bundled CSVs, `vectair_flite_audit_log_v1`, `vectair_fdms_metar_builder_last_v1`, `vectair_flite_check_updates_on_launch_v1`, `vectair_flite_last_update_check_v1`.

**Derived-from-movements (no storage of their own):** Reports/Monthly Return/Dashboard/Insights (computed from `vectair_fdms_movements_v3` + `vectair_fdms_cancelled_sorties_v1` + `vectair_fdms_hours_v1` at render time; only their *exports* are written to disk).

**Bidirectionally linked:** Bookings ⇄ Movements, reconciled deterministically on startup by `bookingSync.reconcileLinks()`.

---

## 5. Backup Coverage

Canonical list (`SESSION_BACKUP_KEYS`, `src/js/datamodel.js:21-32`):

```
vectair_fdms_movements_v3
vectair_fdms_config
vectair_fdms_cancelled_sorties_v1
vectair_fdms_deleted_strips_v1
fdms_booking_profiles_v1
vectair_fdms_calendar_events_v1
vectair_fdms_hours_v1
vectair_fdms_vkb_overrides_v1
vectair_flite_audit_log_v1
vectair_fdms_bookings_v1
```

That is 10 static keys.

Plus, swept dynamically by regex at export/import time (not listed statically):

```
fdms_generic_overflights_YYYY-MM-DD   (all present dates)
```

That is 1 dynamic key family.

**Intentionally excluded from backup today** (3 static keys — see Gap Analysis §8 for assessment of each):

```
vectair_fdms_metar_builder_last_v1        (intentionally excluded today — product decision should
                                            confirm whether this is desired; see Gap Analysis §8.1)
vectair_flite_check_updates_on_launch_v1  (reasonable — machine-local preference)
vectair_flite_last_update_check_v1        (reasonable — diagnostic timestamp)
```

Bundled reference CSVs are not part of backup/restore; they travel with the installer/app bundle, not with user data.

**Backup key-count reconciliation:** 10 static + 1 dynamic family + 3 excluded = 14 keys/families currently known to the backup subsystem's scope of consideration (10 actually written into a backup file, 1 dynamic family also written, 3 deliberately not written). Together with the 2 legacy migration-only keys (never eligible for backup — they are deleted before a backup could ever capture them), this accounts for all 16 `localStorage` keys/families catalogued in §1.1 and §3.

## 6. Restore Coverage

`importSessionJSON()` (`datamodel.js:1837`) recognises four formats:

1. **Full backup** (`format:"vectair-flite-session-backup"`) — restores every key in `SESSION_BACKUP_KEYS` that is present and non-null in the file, plus any key matching the generic-overflight date regex (strict allow-list — arbitrary keys in the file are never restored). In-memory movements are then reloaded (`movementsInitialised = false; ensureInitialised()`), but the UI explicitly tells the operator to reload the app to pick up all restored sections (only movements are guaranteed to reflect immediately without a reload).
2. **Legacy envelope** (`{fdmsBackup, payload}`) — movements only.
3. **Legacy v2** (`{version, movements:[]}`) — movements only.
4. **Legacy v1** (bare array) — movements only.

Formats 2–4 explicitly warn the operator in the Admin restore preflight UI that only movement data will be restored — bookings, cancelled sorties, deleted strips, profiles, calendar events, hours, and generic overflights are **not** included in legacy-format restores.

Restore always **replaces** the target key wholesale; there is no field-level merge and no conflict resolution against current in-app data.

## 7. Integrity Coverage

| Mechanism | Coverage |
|---|---|
| Schema versioning | Only `vectair_fdms_movements_v3` carries an explicit `version` field checked on load. `vectair_fdms_config`, bookings, calendar events, hours, cancelled sorties, and deleted strips have no version field — malformed-shape recovery is ad hoc per key (reset to `[]`/`{}` or silently ignored). |
| Corruption handling | `ensureCancelledSortiesInitialised()` / `ensureDeletedStripsInitialised()` reset to `[]` on parse failure or non-array shape. `loadConfig()` falls back to `defaultConfig` on any error. Most other loaders (`bookingsStore`, `ui_booking` profiles/calendar, `reporting` hours, `metar_builder`) just return `null`/`{}`/`[]` on failure — no repair-and-persist step, no user-visible corruption warning. |
| Cross-dataset referential integrity | Only bookings ⇄ movements is actively reconciled (`bookingSync.reconcileLinks()`, run once at startup). No equivalent reconciliation exists for, e.g., cancelled-sorties `sourceMovementId` pointing at a movement that no longer exists, or deleted-strip snapshots referencing stale `bookingId`s. |
| Storage-quota monitoring | `getStorageQuota()` sums all `localStorage` key/value lengths and assumes a flat 5MB quota (not queried from the browser/engine); Admin/diagnostics panel warns at 80% usage. This is an estimate, not a hard integrity guarantee. |
| No checksum/hash validation anywhere | Confirmed — no dataset carries a content hash or CRC. |
| No dedicated Integrity Checker subsystem exists today | This audit is the discovery input for that future subsystem; there is currently no unified validator across all datasets. |

---

## 8. Gap Analysis

Findings only — no fixes applied, per audit constraints.

### 8.1 METAR Builder draft is intentionally excluded from backup/restore today
`vectair_fdms_metar_builder_last_v1` is a real persisted dataset (with its own in-place legacy-shape migrations, indicating it has evolved across releases) but is absent from `SESSION_BACKUP_KEYS`. STATE.md §3.5 documents the "Confirmed V1 localStorage keys covered by Admin backup/restore" list, which predates the METAR Builder feature (METAR-BUILDER-001 onward). The exclusion is treated here as **intentional as currently implemented** — there is no evidence in the code of an attempt to include it that failed, and it is a `Cache`-class, freely regenerable dataset (the operator simply re-enters the draft), which is a defensible reason to leave it out of backup. Whether this reflects deliberate product intent or was simply not considered when `SESSION_BACKUP_KEYS` was defined has not been established either way from the code alone. **Product decision should confirm whether this is desired** before Phase 1 Item 3 (Backup Validation & Restore Summary) treats current backup coverage as final.

### 8.2 Generic overflight keys are never proactively deleted
`fdms_generic_overflights_${date}` keys accumulate forever — one new key per calendar day the app is used, with no purge/retention logic anywhere in the codebase (unlike Deleted Strips, which has an explicit 24h purge). Over years of use this is unbounded key growth contributing to the flat 5MB quota estimate in `getStorageQuota()`. **Orphaned-key growth pattern; not currently causing failures but has no ceiling.**

### 8.3 `docs/js/` is a stale, out-of-sync duplicate of `src/js/` using identical storage key names
`deploy-docs.sh` performs a manual `cp -R src docs` for GitHub Pages. The checked-in `docs/js/` snapshot (`datamodel.js` 942 lines, `app.js` 488 lines, `ui_liveboard.js` 3258 lines) is dramatically behind current `src/js/` (2579 / 2512 / 13278 lines respectively) — it predates Bookings, VKB overrides, the audit log, and most other current features, yet it defines the **same** `localStorage` key constants (`vectair_fdms_movements_v3`, `vectair_fdms_config`, etc.) as the live app. If ever served from the same browser origin as the production app (not the case today, but a latent risk of any future hosting change), the two divergent schemas would read/write the same keys. At minimum this is duplicate, drifted persistence logic that nobody is maintaining in step with `src/`. **Documented nowhere; should be reviewed** (either exclude `docs/js` from persistence-relevant tooling/consideration explicitly, or keep `deploy-docs.sh` current).

### 8.4 Stale prototype copy in the live Booking UI
`src/index.html:441` still renders: *"'Add strip' in this prototype stores the booking in localStorage. Wiring into your actual Live Board data model is the next step."* Bookings have long since been wired through `bookingsStore.js`/`bookingSync.js` into real movements. This user-facing copy is inaccurate leftover prototype text. **Documentation/UI-copy gap, not a functional defect.**

### 8.5 No schema version on most datasets
Only `vectair_fdms_movements_v3` is versioned. `vectair_fdms_config`, `vectair_fdms_bookings_v1`, `vectair_fdms_calendar_events_v1`, `vectair_fdms_hours_v1`, `vectair_fdms_cancelled_sorties_v1`, `vectair_fdms_deleted_strips_v1`, and `vectair_fdms_metar_builder_last_v1` either have no version field or an unenforced one (`bookingsStore` writes `version:1` but never checks it on read). Future format changes to any of these must currently rely on defensive/shape-based migration (as bookings and METAR Builder already do ad hoc) rather than a version check. **Foundational concern for the planned SQLite migration** — there is no uniform versioning contract to migrate *from*.

### 8.6 Audit log scope is narrower than its name suggests
`vectair_flite_audit_log_v1` ("Central append-only audit ledger for Vectair Flite", per its own file header) only ever receives events from VKB Admin edits (`auditEntityChange()` calls, sourced from `admin-vkb-editor`). Movement create/update/delete, booking changes, cancellations, and deletions each maintain their own bespoke `changeLog` (on movements) or dedicated log store (cancelled sorties, deleted strips) rather than feeding the shared audit ledger. This is explicitly acknowledged in the file's own header comment ("movements, bookings etc. are out of scope for this ticket") so it is a known, scoped limitation rather than an accidental gap — but it means there is no single cross-cutting audit trail today. **Worth flagging for the future Integrity Checker / audit consolidation design.**

### 8.7 Configuration and operational-behaviour settings are mixed in one untyped blob
`vectair_fdms_config` mixes true user/machine preference (`showLocalTime`, `timelineSwapUtcLocalRulers`), operational business rules (`depOffsetMinutes`, `autoActivateArrEnabled`), and UI-only display toggles (`historyStripBoardVisibleFilters`) in a single flat, unversioned object with several `// Legacy - kept for backwards compatibility` fields still active (`defaultTimeOffsetMinutes`, `autoActivateEnabled`, `autoActivateMinutesBeforeEta`, `timezoneOffsetHours`). None of these legacy fields have removal criteria or dead-code markers. **Configuration/operational mixing + accumulating legacy fields — a candidate for schema decomposition in the SQLite migration, not for action now.**

### 8.8 No dedicated Integrity Checker or automated corruption reporting exists
Corruption handling today is: reset-to-empty (cancelled sorties, deleted strips), fall back to defaults (config), or silently return empty/null (bookings, calendar events, hours, profiles, METAR draft) — with no user-visible corruption notice in the latter cases and no cross-dataset consistency sweep beyond `bookingSync.reconcileLinks()`. This is expected, since no Integrity Checker subsystem exists yet — recorded here as the discovery baseline that subsystem will need to close.

### 8.9 Diagnostics scope note (not a defect)
`updateDiagnostics()` / `getDataCounts()` surface counts for movements, bookings, cancelled sorties, deleted strips, booking profiles, calendar events, and hours entries — but not for VKB overrides, the audit log, or the METAR Builder draft (see the `Diagnostic Bundle` column in §3). Combined with §8.1, the METAR Builder dataset is currently invisible to both backup coverage and the diagnostics panel — marked `Future` in §3 rather than `Excluded` because this is the one exclusion explicitly flagged here as worth reviewing. VKB overrides and the audit log are marked plain `Excluded` in §3: their absence from the diagnostic report is noted as fact, but this audit found no explicit basis to recommend adding them. **Should be reviewed alongside §8.1.**

---

## 9. Planned Persistent Data

The Pre-V1 roadmap identifies future persistence needs that do not exist in the codebase today. They are recorded here as **planned datasets** so the canonical inventory has a place for them and no future implementation work "invents" persistence that wasn't tracked. This section is documentation only — it does not propose a data model, storage key names, or an implementation approach.

### 9.1 Operator identity

- **Current status:** Not implemented.
- **Intended purpose:** Attribute created/updated/cancelled/deleted actions and audit-log entries to a specific named operator, rather than the current hardcoded placeholder. Today, `datamodel.js` sets `movement.updatedBy = "local user"` unconditionally on every update, and `audit.js` defaults `actor` to `{ type: 'local-user', displayName: 'local user' }` — there is no concept of distinct operators anywhere in the codebase.
- **Expected storage class:** User Preferences (local identity selection) feeding into Diagnostics/Reference Data used by audit and change-log records.
- **Notes:** No authentication or identity model is implied by this entry. Recorded purely because `movement.updatedBy` and `audit.js`'s `actor` field are placeholders that a future feature would need to replace.

### 9.2 Workstation identity

- **Current status:** Not implemented.
- **Intended purpose:** Distinguish which physical machine/install produced a given record or backup — relevant once more than one workstation may run Flite (e.g. multi-position ops rooms), and for backup provenance/traceability.
- **Expected storage class:** Configuration / Diagnostics.
- **Notes:** No hostname, machine ID, or install ID is captured anywhere in the current codebase (including the diagnostic report, which has no machine-identifying field).

### 9.3 Session identity

- **Current status:** Not implemented.
- **Intended purpose:** Distinguish individual app runtime sessions — e.g. for correlating diagnostic bootstrap logs, or grouping audit events across a single working shift — beyond the existing per-event correlation already in place.
- **Expected storage class:** Diagnostics (session-scoped, not necessarily persisted across restarts).
- **Notes:** `audit.js` already generates a per-event `correlationId` (`generateCorrelationId()`), but there is no persistent session-level identifier tying multiple events/records together across a whole app session.

### 9.4 Future operator preferences / settings

- **Current status:** Not implemented.
- **Intended purpose:** Per-operator (rather than per-machine) display/behaviour preferences once Operator Identity (§9.1) exists — e.g. preferred timeline display mode, local-time toggle, or per-operator History filter defaults — distinct from the single shared `vectair_fdms_config` blob used by everyone today.
- **Expected storage class:** User Preferences.
- **Notes:** Today all such settings live in the single shared, unversioned `vectair_fdms_config` object (§2.3, and the mixing concern raised in §8.7), with no per-operator scoping mechanism of any kind.

---

## 10. Audit Report

**Total persistent datasets catalogued:** **16** distinct `localStorage` keys/key-families:

```
10 static backed-up keys
 + 1 dynamic backed-up key family
 + 3 intentionally excluded static keys
 + 2 legacy migration-only keys
 --------------------------------------
 = 16
```

Separately (not `localStorage`, not part of the 16 above): 8 bundled read-only reference CSV files, and the 8 generated-export types listed in §2.8 (rolled up into 4 rows in the Persistence Matrix by output category). See the row-count reconciliation note under §3 for how this maps onto the 21-row Persistence Matrix.

**Total storage mechanisms in use:** 1 (`localStorage`, browser/WebView-engine-managed). No `sessionStorage`, `indexedDB`, Tauri `plugin-store`, Tauri `plugin-fs`, app-data-dir config files, or log files exist anywhere in the repository.

**Dynamic key families:** 1 — `fdms_generic_overflights_${YYYY-MM-DD}` (unbounded growth, no purge; see §8.2).

**Legacy/migration-only stores:** 2 — `vectair_fdms_movements_v1`, `vectair_fdms_movements_v2` (both consumed and deleted on first successful load; will not reappear).

**Migration paths implemented:**
- Movements: v1 → v3 and v2 → v3 (`migrateFromV1`/`migrateFromV2`, destructive — old key removed after migration).
- Config: legacy `showEstimatedTimesOnStrip` → four per-type flags, additive (old field retained).
- VKB overrides: legacy flat `{egowCodes, registrations}` → `{datasets:{...}}` wrapper, plus ongoing registration-key re-canonicalisation on every load.
- Bookings: `arrivalTimeLocalHHMM` → `plannedTimeLocalHHMM`/`plannedTimeKind`, additive, runs on every load.
- METAR Builder: three separate legacy-shape migrations (plain-text WX → structured, single WX group → `wxGroups` array, `phenomenon` → `phenom1/2/3`), all additive, run on every load.

**Backup coverage summary:** 10 of 13 static application keys are covered by `SESSION_BACKUP_KEYS`, plus the dynamic generic-overflight family. 3 static keys are intentionally excluded today — 2 are low-risk machine-local/diagnostic values (updater launch-check preference, updater last-checked timestamp; both `Operational/Safety Significance: None`), and 1 (`vectair_fdms_metar_builder_last_v1`, `Class: Cache`, `Operational/Safety Significance: Low`) has no code-level evidence establishing whether its exclusion was a deliberate product decision — see §8.1 for the recommended follow-up. Bundled reference CSVs and the legacy migration-only keys are correctly out of scope for backup by design.

**Integrity coverage summary:** Only 1 of 13 static application keys (`vectair_fdms_movements_v3`) carries an explicit, checked schema version. Corruption recovery exists for config, cancelled sorties, and deleted strips; is absent (silent empty fallback) for bookings, calendar events, hours, booking profiles, and the METAR Builder draft. Exactly one cross-dataset referential-integrity sweep exists (`bookingSync.reconcileLinks()`, bookings ⇄ movements only). No checksum/hash validation exists on any dataset. No unified Integrity Checker subsystem exists yet.

**Documentation gaps identified:**
- Backup coverage list in STATE.md §3.5 is stale relative to actual `SESSION_BACKUP_KEYS` content drift potential (currently matches code, but has no single source of truth cross-reference — this document now serves that role).
- `docs/js/` duplicate is undocumented as a non-authoritative, drifted snapshot (§8.3).
- Stale prototype copy visible in the live Booking UI (§8.4).
- Audit log's actual (narrow) scope vs. its general-sounding name is documented only in a code comment, not in user-facing or architecture docs (§8.6).
- Planned-but-unimplemented persistence (operator/workstation/session identity, future per-operator preferences) had no canonical record prior to this correction — now tracked in §9.

**Architectural concerns for the future SQLite migration:**
- No uniform schema-versioning contract across datasets (§8.5) — a migration tool will need per-dataset bespoke detection logic mirroring today's ad hoc migrations, not a single version-driven path.
- Configuration mixes preference/operational/UI-toggle concerns in one blob (§8.7) — worth decomposing during migration rather than carrying the mixed shape into SQL tables verbatim.
- Unbounded dynamic key growth (§8.2) has no equivalent problem in a relational schema (a dated row is trivial) but should be explicitly resolved (retention policy decision) rather than silently inherited.
- The audit log's narrow scope (§8.6) is a design decision to revisit if the future Integrity Checker or SQLite migration is expected to provide a full change history.
- Planned identity concepts (§9) currently have no schema footprint anywhere — the SQLite migration is a natural point to decide where operator/workstation/session identity would live, but no such decision has been made and none is proposed here.

---

## 11. Source Index (file → dataset ownership)

| File | Datasets owned |
|---|---|
| `src/js/datamodel.js` | movements (v1/v2/v3), config, cancelled sorties, deleted strips, generic overflights (dynamic), `SESSION_BACKUP_KEYS` definition, `exportSessionJSON`/`importSessionJSON`, `getStorageInfo`/`getDataCounts`/`getStorageQuota` |
| `src/js/vkb.js` | VKB overrides (`vectair_fdms_vkb_overrides_v1`); bundled CSV loading (read-only) |
| `src/js/audit.js` | Audit log (`vectair_flite_audit_log_v1`) |
| `src/js/ui_booking.js` | Booking profiles (`fdms_booking_profiles_v1`), calendar events (`vectair_fdms_calendar_events_v1`) |
| `src/js/stores/bookingsStore.js` | Bookings (`vectair_fdms_bookings_v1`) |
| `src/js/services/bookingSync.js` | No storage of its own; reconciles bookings ⇄ movements |
| `src/js/reporting.js` | Hours log (`vectair_fdms_hours_v1`, Supporting Operational Data); Monthly Return/Cancellation exports (generated files only) |
| `src/js/metar_builder.js` | METAR Builder draft (`vectair_fdms_metar_builder_last_v1`) |
| `src/js/app.js` | Updater preference/timestamp keys; diagnostics (in-memory); Admin backup/restore UI wiring; diagnostic report generation |
| `src/js/ui_liveboard.js` | No storage of its own beyond calling into `datamodel.js`; owns History/Cancelled/Search CSV export functions |
| `src/js/export_utils.js` | No storage; shared Save-As/Blob-download helpers used by all exports |
| `src-tauri/src/lib.rs` | No app-data persistence; `save_text_file_with_dialog`/`save_binary_file_with_dialog` (export-only, user-chosen path); in-memory updater `Mutex` |
| `src-tauri/tauri.conf.json` / `capabilities/default.json` | Static config only (window geometry, CSP, updater endpoint/pubkey, `dialog:allow-save` permission); no storage-plugin permissions granted |
| `docs/js/*.js` | Stale duplicate of an earlier `src/js/` snapshot; same key names, out of sync (see §8.3) |
