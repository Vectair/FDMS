# STATE.md — Vectair Flite

Last updated: 2026-07-14 (Europe/London, rev 25 — Phase 1 Item 3 complete and merged: backup validation, metadata, restore preview/summary, compatibility enforcement and backup/restore audit events)

This file is the shared source of truth for the Vectair Flite Manager–Worker workflow.

* **Product Owner / SME:** Stuart
* **Solutions Architect & QA Lead:** ChatGPT
* **Production Engineer:** Claude Code

ChatGPT investigates the repository, diagnoses problems, determines architecture, writes precise implementation tickets, reviews implementation and maintains the documentation/continuity layer.

Claude Code implements precise tickets. Claude should not be asked to independently infer product direction, reopen settled product decisions or perform broad exploratory implementation without a defined scope.

The working rule is:

> Investigate first. Define the smallest correct change. Implement narrowly. Verify against the repository rather than trusting documentation or summaries alone.

---

## 0. Current headline status

* **Main branch is the authoritative baseline.**
* **Current confirmed `main`:** `143ab12 Merge pull request #157 from Vectair/claude/wizardly-einstein-l5752h`
* **Current released version:** `0.9.4`
* **Vectair Flite** (“Flite”) is the current product name.
* Legacy references to **FDMS**, **FDMS Lite**, **Vectair FDMS**, or **Vectair FDMS Lite** refer to the same product unless explicitly stated otherwise.
* Flite is approaching its first V1 operational deployment at EGOW.
* Major feature development is sufficiently mature that current work is focused on resilience, auditability, maintainability, operational robustness and final UX closeout.
* The current programme is the **Pre-V1 resilience and robustness roadmap**.
* The recent V1 snag list is cleared.
* **Known V1 snags remaining from the cleared snag list:** `0`
* Completed work must not be reopened without evidence that implementation has changed or a regression has occurred.

### Current Pre-V1 programme status

```text
Phase 1 — Data Safety, Persistence and Audit Foundations

✅ Item 1 — Backup / Restore Completeness
✅ Item 2 — Canonical Data Inventory
✅ Item 3 — Backup Validation & Restore Summary
▶ Next — continue with the next defined Pre-V1 roadmap item
```

### Immediate engineering baseline

The following are now proven or complete:

```text
Windows updater                     Proven
Signed update pipeline              Proven
In-app update from 0.9.3 to 0.9.4   Proven
Check for updates on launch         Implemented
Backup / Restore completeness       Proven
Canonical persistence inventory     Complete
Backup validation                   Complete
Restore preview and summary         Complete
Backup/restore audit events          Complete
History improvements                Proven
Formation system                    Proven
PIC/VKB fixes                       Proven
```

### Current project rule

Do not resume broad feature expansion before the outstanding Pre-V1 resilience, audit, maintainability and UX closeout work is complete.

---

## 1. Product identity and naming

The product is branded:

```text
Vectair Flite
```

Short form:

```text
Flite
```

Older development material may refer to:

```text
FDMS
FDMS Lite
Vectair FDMS
Vectair FDMS Lite
```

These are legacy names for the same product unless context explicitly distinguishes them.

New tickets, documentation, releases and architecture material should use **Vectair Flite** or **Flite** by default.

Do not casually reintroduce legacy FDMS naming into new user-facing material.

---

## 2. Repository, ownership and branch model

### 2.1 Repository

Local repository:

```text
C:\Users\dmshs\FDMS
```

GitHub repository:

```text
Vectair/FDMS
```

### 2.2 Authoritative branch

```text
main
```

`main` is the authoritative working baseline unless explicitly stated otherwise.

Before beginning new implementation:

1. Confirm the relevant previous work has been merged.
2. Inspect the current `main` implementation.
3. Do not rely only on handovers, `STATE.md`, roadmap text or Claude summaries.
4. Use repository implementation as the final source of truth for actual behaviour.

### 2.3 Current main anchor

At this revision:

```text
143ab12 Merge pull request #157 from Vectair/claude/wizardly-einstein-l5752h
```

This merge contains Phase 1 Item 3:

```text
1004abd Add backup validation, richer metadata, and restore summaries (Phase 1 Item 3)
c7e23b0 Fix backup-validation edge cases found in review
```

The preceding Phase 1 Item 2 baseline was merged as:

```text
18e3813 Merge pull request #156 from Vectair/claude/data-inventory-persistence-audit-ddb01v
```

### 2.4 Historical anchors

The following branches/tags may exist as intentional history or fallback points:

```text
legacy/pre-desktop-main
baseline/pre-desktop-productization
flite-pre-desktop-baseline-2026-03
```

Do not delete or reinterpret historical anchors casually.

---

## 3. Version and release model

### 3.1 Current version

```text
0.9.4
```

Pre-launch development uses `0.x.x`.

```text
1.0.0
```

is reserved for actual V1 launch.

Do not use `1.x.x` for further internal pre-launch builds.

### 3.2 Version alignment

Release version changes must remain aligned across the applicable project files, including:

```text
package.json
src-tauri/Cargo.toml
src-tauri/tauri.conf.json
```

### 3.3 Current updater/release baseline

The Windows Tauri updater is implemented and proven.

The successful release/update sequence includes:

```text
0.9.2 — updater validation work
0.9.3 — PIC/autofill and retrospective dropdown work
0.9.4 — published updater release successfully installed through Flite
```

The `0.9.4` GitHub release contained the expected updater assets, including:

```text
latest.json
NSIS installer
installer signature
MSI package where produced
```

The installed application successfully updated through the in-app updater.

### 3.4 Update UX

Implemented:

* Admin → System Status → Updates.
* Manual update check.
* Download/install workflow.
* Inline confirmation rather than unsupported native `confirm()`.
* Update-install teardown error suppression.
* Fallback recovery if Windows installer handoff does not close the application as expected.
* Optional check for updates on application launch.
* Last update-check timestamp display.

The current updater is a regression baseline. Do not modify it casually.

### 3.5 Signing

The updater signing public key is embedded in project configuration.

The signing private key must never be committed.

Signing-key rotation is planned later as post-launch preparation and is not a blocker for the current Pre-V1 engineering sequence unless circumstances change.

---

## 4. Runtime and delivery model

### 4.1 Product definition

Vectair Flite is:

```text
a local, offline-first, installable desktop flight-data management application
```

It is not a hosted web service.

It currently uses:

```text
HTML
CSS
JavaScript
Tauri v2 desktop shell
```

### 4.2 Desktop requirement

Normal operational use must not depend on:

```text
a browser
a Python development server
internet connectivity for core operation
a hosted backend
cloud storage
```

### 4.3 Development environment

Primary development OS:

```text
Windows
```

Local repository:

```powershell
cd C:\Users\dmshs\FDMS
```

Browser development harness:

```powershell
python -m http.server 8000 --directory src
```

Browser URL:

```text
http://localhost:8000/
```

Tauri development:

```powershell
npm run tauri:dev
```

Equivalent direct command:

```powershell
cargo tauri dev
```

The Python server is a development convenience only. It is not an acceptable V1 runtime dependency.

### 4.4 Internal development installer workflow

The internal script:

```text
scripts/install-latest-dev-build.ps1
```

pulls the current code, builds the Tauri application, locates the latest NSIS installer and launches it.

This is an internal development convenience. It is separate from the published updater release workflow.

---

## 5. Persistence architecture

### 5.1 Authoritative reference

The authoritative persistence reference is:

```text
docs/architecture/DATA_INVENTORY.md
```

That document was produced under Phase 1 Item 2 and corrected under Item 2A.

It should be treated as the definitive reference for:

* persisted datasets;
* ownership;
* storage classes;
* lifecycle;
* backup coverage;
* restore coverage;
* integrity coverage;
* migration stores;
* persistence relationships;
* future SQLite planning;
* future diagnostic/integrity work.

### 5.2 Current persistence model

All current application state is stored in browser/WebView:

```text
localStorage
```

There is currently:

* no backend server;
* no hosted/cloud storage;
* no SQL database;
* no multi-user concurrency model;
* no Tauri-side application-data persistence layer;
* no plugin-store persistence;
* no application-managed filesystem database.

### 5.3 Storage inventory

The canonical inventory identifies:

```text
16 localStorage keys/key-families
```

Reconciliation:

```text
10 static backup keys
1 dynamic generic-overflight key family
3 intentionally excluded current keys
2 legacy migration-only keys
---------------------------------------
16 total keys/key-families
```

### 5.4 Static backup keys

The approved `SESSION_BACKUP_KEYS` baseline is:

```text
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

### 5.5 Dynamic backup family

Generic overflights are persisted by date:

```text
fdms_generic_overflights_YYYY-MM-DD
```

All recognised present dated keys are included dynamically in backup/restore.

### 5.6 Current intentional exclusions

The following are not currently included in session backup:

```text
vectair_fdms_metar_builder_last_v1
vectair_flite_check_updates_on_launch_v1
vectair_flite_last_update_check_v1
```

Do not change this coverage casually.

The METAR Builder draft exclusion is currently treated as an accepted product decision because it is regenerable cache/convenience data rather than critical operational data.

The updater keys are machine-local preference/diagnostic state and are appropriately excluded.

### 5.7 Bundled reference data

Bundled reference CSVs under:

```text
src/data/*.csv
```

are not localStorage and are not included in backup/restore.

They travel with the application bundle.

Locally edited mutable reference data is stored in:

```text
vectair_fdms_vkb_overrides_v1
```

and is backed up.

### 5.8 Future storage direction

SQLite migration remains a future workstream.

Do not introduce SQL casually as an isolated optimisation.

Any future migration should be based on:

* the canonical Data Inventory;
* explicit storage adapters/wrappers;
* migration/version contracts;
* backup compatibility;
* operational data protection;
* rollback/recovery strategy.

---

## 6. Phase 1 — Pre-V1 persistence and data-safety programme

### 6.1 Item 1 — Backup / Restore Completeness

Status:

```text
COMPLETE — MERGED
```

Objective:

Ensure the Admin backup system captures all approved V1 persistent operational/configuration/reference/audit datasets.

Completed outcome:

* `SESSION_BACKUP_KEYS` expanded to the approved 10-key static baseline.
* Dynamic dated generic-overflight keys included.
* Current-format full backup restores approved datasets.
* Arbitrary unknown keys are never restored.
* Legacy movement-only formats remain supported.
* Existing approved coverage was verified against repository persistence.

Merge baseline:

```text
0e7d3fb Merge pull request #154 from Vectair/claude/backup-restore-completeness-dmg7gl
```

### 6.2 Item 2 — Canonical Data Inventory

Status:

```text
COMPLETE — MERGED
```

Produced:

```text
docs/architecture/DATA_INVENTORY.md
```

The inventory covers:

* persistent datasets;
* owners;
* storage classes;
* canonical status;
* backup coverage;
* restore coverage;
* validation;
* regenerability;
* diagnostic-bundle coverage;
* operational/safety significance;
* relationships;
* migration stores;
* gap analysis;
* planned future persistent data.

Corrections completed under Item 2A included:

* localStorage total corrected from 17 to 16 keys/key-families;
* persistence matrix completed;
* Diagnostic Bundle column added;
* Operational / Safety Significance column added;
* Hours Log reclassified as Supporting Operational Data;
* METAR wording softened to avoid treating a product decision as an implementation defect;
* planned future persistence section added;
* terminology standardised.

Merge baseline:

```text
18e3813 Merge pull request #156 from Vectair/claude/data-inventory-persistence-audit-ddb01v
```

### 6.3 Item 3 — Backup Validation & Restore Summary

Status:

```text
COMPLETE — MERGED
```

Merge baseline:

```text
143ab12 Merge pull request #157 from Vectair/claude/wizardly-einstein-l5752h
```

Implementation commits:

```text
1004abd Add backup validation, richer metadata, and restore summaries (Phase 1 Item 3)
c7e23b0 Fix backup-validation edge cases found in review
```

Delivered:

#### Authoritative backup inspection

Added a single read-only inspection path:

```text
inspectSessionBackup()
```

It is used by:

* Admin restore preview;
* `importSessionJSON()` defensive validation;
* export metadata derivation.

The preview and importer therefore use one authoritative interpretation of backup structure.

#### Backup metadata

New full backups include:

```text
app
format
formatVersion
exportedAt
appVersion
includedKeys
recordCounts
storage
```

#### Full-backup validation

Recognised static datasets are validated for:

* valid JSON;
* expected basic top-level shape;
* known supported backup-format version.

A malformed recognised static dataset blocks full restore.

#### No partial full restore

The central safety invariant is:

> No full-backup localStorage mutation begins until the complete recognised static restore payload has passed validation.

#### Compatibility policy

Current supported backup format:

```text
1
```

A backup with a newer unsupported `formatVersion` is blocked.

A present but malformed/non-numeric version is blocked.

Older current-format v1 backups that lack the new optional metadata remain supported.

#### Restore preview

The Admin restore preview shows available:

* filename;
* creation timestamp;
* backup application version;
* backup format version;
* restorable key count;
* per-dataset record counts;
* validation errors;
* warnings.

#### Restore summary

Successful full restore now reports:

* success;
* number of storage keys restored;
* record-count summary;
* clear instruction to reload Flite before operational use so all subsystems and configuration values are refreshed.

#### Backup/restore audit events

Successful operations append:

```text
backup-exported
backup-restored
```

Audit writes occur after the successful operation they describe.

Audit-write failures are isolated and do not falsely report an already-successful backup or restore as failed.

#### Generic-overflight validation

Dynamic dated generic-overflight values must be non-negative integer digit strings within JavaScript safe-integer range.

Malformed dynamic overflight values are skipped with a warning rather than written.

This is an accepted pragmatic exception to strict all-or-nothing full-backup treatment because the malformed daily counter is omitted safely and does not prevent restoration of otherwise valid operational data.

#### Legacy restore support

Preserved:

* legacy envelope format;
* legacy v2 movement object;
* legacy v1 bare movement array.

Legacy formats remain movement-only restores and continue to warn the operator accordingly.

---

## 7. Current active engineering priority

### 7.1 Immediate status

Phase 1 Items 1–3 are complete.

The next task must be taken from the authoritative Pre-V1 roadmap rather than invented from this file.

Likely remaining Pre-V1 work includes:

* storage wrappers / persistence abstraction;
* operational audit schema expansion;
* operator identity where required;
* workstation/session identity where required;
* remaining UX closeout items;
* final installer/release documentation;
* final regression and acceptance work.

Before beginning the next implementation:

1. Inspect the authoritative roadmap item.
2. Inspect current repository implementation.
3. Define the smallest correct ticket.
4. Avoid bundling later phases into the active item.

### 7.2 Known major remaining V1-readiness themes

```text
Storage abstraction / wrappers
Operational audit schema
Error visibility / diagnostic hardening
Remaining operator-facing UX polish
Final installer and release documentation
Final regression and acceptance sweep
```

### 7.3 Post-launch or later preparation

Unless promoted by evidence:

```text
SQLite migration
Signing-key rotation
MAB package filtering
Learned PIC ranking
Advanced historical lifecycle analytics
Broad multi-user concurrency
Hosted/cloud persistence
```

remain later work.

---

## 8. Current source architecture

Known source layout:

```text
src/index.html
src/css/vectair.css
src/js/app.js
src/js/datamodel.js
src/js/ui_liveboard.js
src/js/ui_booking.js
src/js/vkb.js
src/js/audit.js
src/js/reporting.js
src/js/ui_reports.js
src/js/export_utils.js
src/js/metar_builder.js
src/js/services/bookingSync.js
src/js/stores/bookingsStore.js
src/data/*.csv
src-tauri/
docs/
STATE.md
```

### 8.1 Entry-point invariant

`src/index.html` must load:

```text
js/app.js
```

as the application entry point.

Do not regress to a state where the interface renders but behaviour is unwired because the application entry point is missing or broken.

### 8.2 Major responsibilities

#### `src/index.html`

* Application shell.
* Navigation.
* Major panels.
* Admin surfaces.
* Modals and static UI structure.

#### `src/js/app.js`

* Application bootstrap.
* Tab wiring.
* Admin handlers.
* Diagnostics.
* Backup/restore UI orchestration.
* Updater panel orchestration.
* High-level render hooks.

#### `src/js/datamodel.js`

* Movement persistence.
* Configuration.
* Initialization.
* Timing helpers.
* Formation helpers.
* Lifecycle stores.
* Backup/restore payload generation and validation.
* Generic overflight persistence.
* Data counts/storage information.

#### `src/js/ui_liveboard.js`

* Live Board.
* History.
* Strip rendering.
* Lifecycle actions.
* Movement modals.
* Inline editing.
* Formation UI.
* Cancelled/deleted movement UI.

#### `src/js/ui_booking.js`

* Booking UI.
* Calendar UI.
* Booking profiles.

#### `src/js/stores/bookingsStore.js`

* Booking persistence/access layer.

#### `src/js/services/bookingSync.js`

* Booking ↔ movement linkage reconciliation.

#### `src/js/vkb.js`

* Bundled VKB/reference-data loading.
* Lookup helpers.
* Mutable override layer.
* Reference-data admin functions.

#### `src/js/audit.js`

* Append-only audit ledger.
* Audit event generation.
* Field-diff support.
* Reference-data audit history.
* Backup/restore system events.

The current audit ledger was originally VKB-scoped and remains narrower than a future complete operational audit subsystem.

#### `src/js/metar_builder.js`

* METAR/SPECI builder.
* Builder persistence.
* validation and assembly.
* Admin Weather settings.

#### `src/js/reporting.js`

* Reporting classification.
* Official Monthly Return logic.
* Reporting calculations and exports.

#### `src/js/ui_reports.js`

* Reports UI wiring.

#### `src/js/export_utils.js`

* Shared native Save As / browser fallback export helper.

### 8.3 Tauri files

Key desktop files include:

```text
src-tauri/Cargo.toml
src-tauri/Cargo.lock
src-tauri/src/lib.rs
src-tauri/tauri.conf.json
src-tauri/capabilities/default.json
```

---

## 9. Completed / merged product baseline

The following workstreams are treated as complete for current planning unless evidence of regression appears.

| Workstream                                          | Status                    |
| --------------------------------------------------- | ------------------------- |
| Core Live Board strip workflow                      | Complete baseline         |
| Live Board counters and tooltips                    | Complete                  |
| Monthly Return ghost-count fix                      | Complete                  |
| Desktop Productization                              | Complete baseline         |
| Offline SheetJS vendoring                           | Complete                  |
| Tauri identity/build scripts                        | Complete                  |
| CSP enablement/smoke test                           | Complete                  |
| Native Save As export consolidation                 | Complete                  |
| Windows shortcut/icon repair sequence               | Complete                  |
| Windows updater                                     | Complete and proven       |
| Check for updates on launch                         | Complete                  |
| Version reset to pre-launch 0.x                     | Complete                  |
| Internal dev reinstall script                       | Complete                  |
| Backup / Restore Completeness                       | Complete                  |
| Canonical Data Inventory                            | Complete                  |
| Backup Validation & Restore Summary                 | Complete                  |
| EGOW classification precedence                      | Complete                  |
| PIC/VKB autofill precedence fixes                   | Complete                  |
| Duplicate modal timing fixes                        | Complete                  |
| Operational uppercase normalization                 | Complete                  |
| History filter/layout tranche                       | Complete                  |
| Cancelled tab relocation                            | Complete                  |
| Cancellation/deleted-strip lifecycle                | Complete                  |
| Cancellation reporting                              | Complete                  |
| Formation through FR-15                             | Complete for V1           |
| Formation child-strip display                       | Complete                  |
| History Retrieval                                   | Complete                  |
| Aircraft pilot suggestions                          | Complete                  |
| Registration grid paging/performance work           | Complete current baseline |
| METAR Builder 001–004a                              | Complete                  |
| Weather/METAR Builder documentation                 | Complete                  |
| Desktop shell UX expansion                          | Complete                  |
| Flite branding/icon work                            | Complete                  |
| Live Board autoactivation reconciliation            | Complete                  |
| Historic retrospective entry improvements           | Complete                  |
| PIC/autofill stale-data fixes                       | Complete                  |
| V0.9.4 updater release and successful in-app update | Proven                    |

---

## 10. Non-negotiable behaviour invariants

### 10.1 UTC authority

UTC is authoritative.

Stored operational strip times are UTC.

Local time is presentation/input convenience only.

Any local-time input must convert back to UTC before persistence.

Canonical timing fields include:

```text
depPlanned
depActual
arrPlanned
arrActual
depActualExact
```

Operational display/input generally uses:

```text
HH:MM
```

Exact second-bearing WTC anchor time may use:

```text
HH:MM:SS
```

### 10.2 Reporting models are intentionally different

Two movement-counting models coexist.

#### Live Board daily statistics

Event-based / realised:

* DEP counts when departure occurred.
* ARR counts when arrival occurred.
* LOC counts realised departure/arrival events.
* T&G adds 2 runway movements.
* O/S adds 1.
* OVR adds 0 to runway totals.
* OVR remains separately counted.

#### Monthly Return / Dashboard / Insights

Nominal strip-type model:

```text
LOC = 2
DEP = 1
ARR = 1
OVR = 0
T&G = +2
O/S = +1
```

Do not “fix” one system to match the other without an explicit product decision.

### 10.3 Lifecycle current-state truth

Primary operational views use current-state truth.

| Current state    | Appears in                    |
| ---------------- | ----------------------------- |
| PLANNED / ACTIVE | Live Board                    |
| COMPLETED        | History                       |
| CANCELLED        | Cancelled → Cancelled Sorties |
| Soft-deleted     | Cancelled → Deleted Strips    |
| Purged           | Nowhere                       |

Historical audit/lifecycle records must not override current-state operational views.

### 10.4 Deleted-strip retention

Soft-deleted strips are retained for:

```text
24 hours
```

unless a future product decision changes this.

### 10.5 Reinstatement

Cancelled movement reinstatement target state:

```text
PLANNED
```

Planned timing follows the established reinstatement logic and must not casually be rewritten.

### 10.6 ARR activation

ARR activation must not fabricate an ATD.

### 10.7 Past-time inline editing

Past inline arrival-side ETA edits on ARR/LOC strips write to ATA where current established behaviour requires it, preserving ETA and promoting PLANNED strips to ACTIVE as implemented.

Existing DEP/LOC historical ETD → ATD behaviour must be preserved.

### 10.8 Operational text normalisation

Operational identifiers are normalised to uppercase at the save boundary where applicable.

Human-name fields must not be forcibly uppercased.

### 10.9 Native export architecture

Use:

```text
src/js/export_utils.js
```

and registered Tauri invoke commands.

Do not reintroduce direct frontend imports from unsupported Tauri plugin packages such as:

```text
@tauri-apps/plugin-dialog
@tauri-apps/plugin-fs
```

Browser Blob/download fallback remains valid outside the Tauri environment.

### 10.10 VKB mutability and historical truth

VKB/reference data is mutable.

Historical movement records must not be retroactively reinterpreted because a later reference-data edit changes:

* pilot assignment;
* aircraft association;
* callsign allocation;
* registration data;
* EGOW code/unit mapping.

Example:

```text
April: UAM10 = Pilot A
May:   UAM10 = Pilot B
```

April movements must continue to show Pilot A.

---

## 11. Timing and movement lifecycle baseline

### 11.1 Timing model

Settled model:

* one timing model per movement;
* inline and modal edits should use the same semantics;
* Timeline is a projection of movement timing, not an independent timing engine.

### 11.2 Activate semantics

| Movement type | Activate behaviour                                   |
| ------------- | ---------------------------------------------------- |
| DEP           | stamps ATD if absent                                 |
| LOC           | stamps ATD if absent                                 |
| OVR           | stamps actual on-frequency/start-side time if absent |
| ARR           | status-only; no ATD fabrication                      |

### 11.3 Complete semantics

| Movement type | Complete behaviour                    |
| ------------- | ------------------------------------- |
| DEP           | no new end-side time                  |
| LOC           | stamps ATA if absent                  |
| ARR           | stamps ATA if absent                  |
| OVR           | stamps actual end-side time if absent |

### 11.4 Automatic stamping

Auto-stamped operational times use established nearest-minute rounding:

```text
00–29 seconds → round down
30–59 seconds → round up
```

Exact second-bearing WTC anchor data is preserved separately where relevant.

### 11.5 Autoactivation

Planned-movement activation reconciliation is app-level and must not depend solely on Live Board rendering.

Current triggers include:

* startup;
* periodic app-level tick;
* window focus return;
* document visibility return;
* Live Board tab return.

ARR/OVR catch-up behaviour and overdue warning logic should not be changed without explicit investigation.

---

## 12. EGOW attribution and PIC/VKB baseline

### 12.1 General state

The EGOW / LOC / timing regression cluster is resolved.

Later PIC/autofill precedence fixes are also complete.

This is a regression baseline, not an active speculative refactor target.

### 12.2 Callsign and registration precedence

The settled PIC/autofill rule is:

* callsign/EGOW attribution wins where valid;
* registration-based pilot attribution applies only where callsign attribution is absent or not visiting-category;
* stale visiting code must not suppress a valid registration-only PIC when that code is merely tracked autofill residue;
* empty callsign must clear stale callsign-derived PIC where appropriate.

### 12.3 Tracked autofill

System-filled values use tracked provenance.

Manual operator overrides must not be overwritten casually.

Stale autofill should clear when attribution becomes unresolved while preserving genuine manual input.

### 12.4 EGOW schema

Current expanded EGOW attribution is based on:

```text
CALLSIGN_BASE,APPROVED_CONTRACTION,FLIGHT_NUMBER,EGOW_CODE,UNIT,UNIT_CODE,NAME,POSITION,NOTES
```

Stored/displayed callsigns must not be rewritten by lookup normalisation.

### 12.5 UAM leading-zero rule

Single-aircraft UAM callsigns require leading zero:

```text
UAM01
UAM02
UAM03
```

Malformed single-digit forms such as:

```text
UAM1
UAM2
UAM3
```

must not silently resolve as valid pilot callsigns.

Formation element callsigns such as:

```text
MERSY1
MERSY2
CNNCT1
```

follow their separate formation convention.

### 12.6 Aircraft pilot data

Aircraft pilot suggestions use:

```text
FDMS_AIRCRAFT_PILOTS.csv
```

with fields:

```text
REGISTRATION,FIXED_CALLSIGN,PILOT_NAME_LAST,PILOT_NAME_FIRST
```

Single-match autofill uses tracked behaviour.

Learned PIC ranking is post-launch.

---

## 13. Formation baseline

Formation implementation through FR-15 is complete for V1 launch purposes.

Further polish is post-launch unless a specific blocking defect is found.

### 13.1 Formation master

The master strip is a summary shell containing top-level movement data and:

```text
formation.label
formation.wtcCurrent
formation.wtcMax
formation.shared
formation.elements[]
```

The master must not flatten away element-level truth.

### 13.2 Formation elements

Each element represents an independently trackable aircraft.

Elements may contain:

```text
callsign
reg
type
wtc
status
depAd
arrAd
depActual
arrActual
tngCount
osCount
fisCount
outcomeStatus
actualDestinationAd
actualDestinationText
outcomeTime
outcomeReason
underlyingCallsign
pilotName
overrides
ordinal
```

### 13.3 Shared/default model

`formation.shared` provides shared/default values.

Elements inherit unless an override is present.

### 13.4 WTC

```text
wtcCurrent
```

is the highest WTC among current PLANNED/ACTIVE elements.

```text
wtcMax
```

is the maximum across all elements and must not decrease merely because lifecycle state changes.

### 13.5 Master cascade

Preserve established rules:

* master → COMPLETED cascades PLANNED/ACTIVE children to COMPLETED; CANCELLED preserved;
* master → CANCELLED cascades PLANNED/ACTIVE children to CANCELLED; COMPLETED preserved;
* no activation cascade unless explicitly designed otherwise.

---

## 14. History, Cancelled and retrospective entries

### 14.1 Current navigation

Primary navigation includes:

```text
Live Board
Calendar
Booking
History
Reports
Cancelled
VKB Lookup
Admin
```

### 14.2 History

History contains completed movement history views:

```text
History
├─ Strip Board
├─ Calendar
└─ Search / Table
```

### 14.3 Cancelled

Lifecycle exception/recovery views are under:

```text
Cancelled
├─ Cancelled Sorties
└─ Deleted Strips
```

Do not move these back into History without an explicit IA decision.

### 14.4 Retrospective movement entry

History → Calendar supports retrospective movement creation.

Current retrospective entry supports the defined strip-type options and remains intentionally simpler than ordinary prospective strip creation.

Do not over-expand it without an explicit requirement.

---

## 15. METAR Builder baseline

METAR Builder implementation is complete through:

```text
METAR-BUILDER-001
METAR-BUILDER-002
METAR-BUILDER-002a
METAR-BUILDER-003
METAR-BUILDER-003a
METAR-BUILDER-003b
METAR-BUILDER-003c
METAR-BUILDER-004
METAR-BUILDER-004a
```

Implemented capabilities include:

* structured METAR/SPECI creation;
* CAP 746-guided validation;
* Civilian/Military reporting mode;
* Admin-configurable section visibility;
* colour-state support;
* multiple present-weather groups;
* blocking illegal weather combinations;
* mixed-precipitation grouping;
* TS requiring CB;
* temperature M-prefix handling;
* compact accordion-based form;
* immediate application of Admin Weather settings.

Documentation is complete under:

```text
DOCS-FLITE-001
```

The METAR Builder draft key:

```text
vectair_fdms_metar_builder_last_v1
```

is currently excluded from backup as regenerable convenience/cache data.

---

## 16. Audit and diagnostics baseline

### 16.1 Current audit ledger

Persistent audit store:

```text
vectair_flite_audit_log_v1
```

Originally implemented for VKB reference-data changes.

Current additional system audit actions include:

```text
backup-exported
backup-restored
```

The audit ledger is not yet a complete unified operational audit system.

Movement, booking and lifecycle history remain distributed across current movement change logs and dedicated lifecycle stores.

A future operational audit-schema workstream should consolidate deliberately rather than accidentally overloading the existing VKB-ledger design.

### 16.2 Diagnostics

Current diagnostics include application/runtime state such as:

* bootstrap stage log;
* recent errors;
* rendering counters;
* storage estimate;
* selected dataset counts;
* generated diagnostic report.

Diagnostics are currently largely in-memory and reset on reload.

### 16.3 Integrity Checker

No dedicated full Integrity Checker subsystem exists yet.

Phase 1 Item 2 is the canonical discovery baseline for future integrity work.

Phase 1 Item 3 is specifically backup-validation work and must not be mistaken for a general whole-application integrity checker.

---

## 17. Known architecture concerns and deferred findings

The following are known and should not be forgotten.

### 17.1 Generic-overflight key growth

Dated generic-overflight keys accumulate over time.

There is currently no proactive retention/purge policy.

This is not currently proven to be causing failure, but growth is unbounded.

### 17.2 Most datasets lack uniform schema versioning

Only some datasets have explicit/enforced schema versioning.

Future migrations must not assume a universal schema contract already exists.

### 17.3 Configuration blob mixes concerns

```text
vectair_fdms_config
```

contains a mixture of:

* operational behaviour;
* display preferences;
* compatibility fields;
* UI configuration.

Future storage decomposition may separate these concerns.

Do not perform this as an unrelated cleanup.

### 17.4 Audit scope is incomplete

The central audit ledger is not yet a complete application-wide audit trail.

This is known and planned for later work.

### 17.5 `docs/js/` drift

The Data Inventory identified stale duplicated frontend code under `docs/js/`.

This should be treated cautiously in any future persistence/code-search work.

### 17.6 Booking prototype copy

The Data Inventory identified stale prototype wording in the live Booking UI.

This is a UX/documentation gap rather than a core functional defect.

---

## 18. UX closeout baseline

A broad user-facing review identified remaining UX and workflow work beyond core functionality.

Important principles:

* remove placeholder/inaccurate copy;
* ensure Admin screens explain what operators can actually do;
* do not expose implementation concepts unnecessarily;
* make operational consequences explicit;
* destructive actions must be clearly described;
* save/apply state must be unambiguous;
* avoid hidden behaviour;
* preserve compact, information-dense desktop operation appropriate to ATC use.

The final UX closeout list should remain in the roadmap/task source rather than being duplicated incompletely here.

---

## 19. Release and installer baseline

Proven:

* Tauri desktop build;
* Windows NSIS installer;
* updater signing;
* GitHub Releases update assets;
* in-app update check;
* in-app installation;
* application restart/update success;
* startup update-check option.

Current released version:

```text
0.9.4
```

Final V1 work still includes appropriate release/installer documentation and acceptance validation.

Do not reopen the completed Windows shortcut/icon repair sequence unless a real regression is demonstrated.

---

## 20. Testing and verification principles

### 20.1 Evidence hierarchy

Use, in order:

1. actual current repository code;
2. targeted automated/static tests;
3. current branch diff;
4. manual operational smoke tests;
5. authoritative architecture docs;
6. handovers and summaries.

Do not trust a summary over contradictory implementation evidence.

### 20.2 Manual testing role

Stuart is the Product Owner, operational SME and primary manual acceptance tester.

When implementation affects operational workflow, provide exact test steps.

Do not claim operational proof merely because syntax checks pass.

### 20.3 Regression discipline

Completed areas should not be reopened casually.

When changing an established area:

* identify the previous baseline;
* preserve known invariants;
* run the relevant smoke tests;
* verify no stale autofill/state remains;
* verify no historical records are reinterpreted.

---

## 21. Key smoke-test areas

Future changes should consider the relevant tests from this set.

### 21.1 Core movement lifecycle

Test:

* create;
* activate;
* complete;
* cancel;
* reinstate;
* delete;
* restore deleted strip.

### 21.2 Timing

Verify:

* DEP ATD stamping;
* LOC ATD/ATA behaviour;
* ARR activation does not fabricate ATD;
* ARR completion stamps ATA where appropriate;
* OVR start/end semantics;
* UTC/local conversion;
* historical inline edit promotion behaviour.

### 21.3 EGOW/PIC

Verify:

* exact callsign attribution;
* UAM leading-zero handling;
* malformed UAM callsign rejection;
* formation contraction lookup;
* registration-only PIC fallback;
* stale autofill clearing;
* manual override preservation.

### 21.4 Formation

Verify:

* element creation;
* shared/default inheritance;
* overrides;
* child status divergence;
* master cascade;
* WTC current/max;
* per-element movement counting;
* outcome/diversion fields.

### 21.5 Booking linkage

Verify:

* booking creation;
* strip creation/linking;
* duplicate-link reconciliation;
* missing-pointer repair;
* current-state linkage after restore.

### 21.6 Backup/restore

Verify:

* valid current full backup;
* old current-format v1 backup without new metadata;
* malformed top-level JSON;
* unrecognised file;
* malformed static dataset JSON;
* wrong static dataset shape;
* unsupported future `formatVersion`;
* malformed `formatVersion`;
* generic-overflight malformed value warning/skip;
* arbitrary unknown key rejection;
* no localStorage write before full static validation succeeds;
* legacy envelope restore;
* legacy v2 restore;
* legacy bare-array restore;
* post-restore reload recommendation;
* backup-exported audit event after successful export;
* backup-restored audit event after successful restore;
* cancel/failure not recorded as success.

### 21.7 Updater

Verify:

* manual check;
* no-update state;
* available-update state;
* first-click confirmation;
* install handoff;
* app restart;
* startup check enabled;
* startup check disabled;
* last-check timestamp;
* teardown error suppression.

### 21.8 Final V1 acceptance

Final acceptance should include:

* fresh install;
* upgrade from previous release;
* backup before update;
* restore after update where appropriate;
* core movement lifecycle;
* reporting;
* bookings/calendar;
* History;
* formations;
* VKB/reference edits;
* METAR Builder;
* diagnostics;
* updater;
* release documentation.

---

## 22. Working method for new engineering tasks

For each new item:

### Step 1 — Investigate

ChatGPT inspects:

* relevant repository code;
* architecture docs;
* existing tests;
* merged branch state;
* related historical implementation.

### Step 2 — Define

ChatGPT determines:

* actual current behaviour;
* defect/gap;
* smallest correct architecture;
* explicit non-goals;
* acceptance criteria.

### Step 3 — Ticket

Claude receives a precise implementation ticket.

Avoid:

* broad exploratory tickets;
* “investigate and fix whatever you find” tasks;
* unnecessary refactors;
* reopening product decisions without evidence.

### Step 4 — Implement

Claude implements the defined ticket.

### Step 5 — Review

ChatGPT independently checks:

* actual branch diff;
* correctness;
* regressions;
* scope discipline;
* acceptance criteria.

### Step 6 — Test

Stuart performs manual acceptance where operational interaction matters.

### Step 7 — Merge

Only after the work passes review and required testing.

### Step 8 — Update continuity

Update:

* `STATE.md` where materially needed;
* authoritative roadmap status;
* handover when moving to a new thread.

---

## 23. Documentation anchors

Primary continuity/state file:

```text
STATE.md
```

Authoritative persistence reference:

```text
docs/architecture/DATA_INVENTORY.md
```

Important user documentation:

```text
docs/quick-start.md
docs/user-guide.md
docs/install-update-backup-troubleshooting.md
```

Other architecture/audit documentation should be inspected as relevant rather than assumed current globally.

---

## 24. Before V1 — current known themes

Still to complete before V1, subject to authoritative roadmap ordering:

```text
Storage wrappers / persistence abstraction
Operational audit schema
Remaining resilience/integrity foundations
Remaining UX polish items
Final installer/release documentation
Final regression and acceptance sweep
```

Potential later preparation:

```text
Signing-key rotation
```

Potential post-launch:

```text
SQLite migration
MAB package filtering
Learned PIC ranking
Advanced historical lifecycle analytics
Broader multi-workstation/multi-user architecture
```

---

## 25. Current handover baseline for a new thread

A new thread should begin from:

```text
Repository: Vectair/FDMS
Local path: C:\Users\dmshs\FDMS
Authoritative branch: main
Current released version: 0.9.4
Current confirmed main: 143ab12
```

Current Pre-V1 state:

```text
✅ Phase 1 Item 1 — Backup / Restore Completeness
✅ Phase 1 Item 2 — Canonical Data Inventory
✅ Phase 1 Item 3 — Backup Validation & Restore Summary
```

Do not revisit those items unless code has changed or evidence of a defect appears.

Immediate next action:

> Inspect the authoritative Pre-V1 roadmap, identify the next incomplete item, inspect the current implementation relevant to that item, and determine the smallest correct next engineering change before writing a Claude ticket.

---

## 26. Continuity rules

The following rules are mandatory for future project continuity:

1. `main` is authoritative.
2. Repository implementation outranks summaries.
3. `docs/architecture/DATA_INVENTORY.md` is authoritative for persistence inventory.
4. Completed work should not be reopened without evidence.
5. Product decisions should not be relabelled as defects merely because an alternative design exists.
6. Prefer the smallest correct change.
7. Avoid speculative refactors.
8. Do not allow Claude to choose product architecture independently.
9. Manual testing should reflect real operator workflows.
10. Update handovers concisely but comprehensively enough that future threads do not drift.
11. Preserve historical truth in operational records.
12. User-entered operational data belongs to the user and must be protected accordingly.
13. Backup/restore behaviour must remain explicit, inspectable and operator-friendly.
14. Unknown arbitrary backup keys must never be restored.
15. Full static backup validation must complete before full restore begins writing recognised static datasets.
16. Future persistence changes must update the canonical inventory.
17. Future data stores must be classified deliberately rather than introduced ad hoc.
18. Do not widen V1 scope without evidence that the additional work is necessary for safe or responsible launch.

---

## 27. Final current-state summary

Vectair Flite is a mature pre-V1 operational desktop application approaching deployment at EGOW.

Major functionality is in place, including:

* movement-strip lifecycle;
* Live Board;
* History;
* Calendar;
* Bookings;
* reporting;
* cancellations/deleted-strip recovery;
* formation handling;
* VKB/reference data;
* aircraft/pilot attribution;
* METAR Builder;
* diagnostics;
* backup/restore;
* signed in-app Windows updating.

The current engineering emphasis is no longer major feature creation.

The priority is:

```text
data safety
resilience
auditability
maintainability
operator clarity
release robustness
final V1 acceptance
```

Phase 1 Items 1–3 of the Pre-V1 data-safety programme are complete and merged.

The next engineering work should continue from the authoritative roadmap without reopening completed work unless repository evidence requires it.
