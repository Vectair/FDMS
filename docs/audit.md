1. Form-state and validation audit - COMPLETED 28 July 2026

Status: Complete.

The audit traced the full state lifecycle of the principal operator forms and controls, including initial values, autofill, manual editing, validation failure, reset, save, cancel, reopen, duplicate, restore and lifecycle actions.

Covered:

movement creation and editing for DEP, ARR, LOC and OVR;
formation creation and element editing;
movement duplication, retrospective entry and Create From workflows;
Booking and Booking Profiles;
Calendar event creation/editing;
cancellation, soft deletion and related recovery stores;
Admin configuration forms;
METAR Builder and Admin Weather;
backup/restore controls.

Principal findings:

Save & Complete uses divergent, weaker validation and field mapping than ordinary movement save;
cancellation and deletion write recovery records before proving the underlying mutation succeeded;
formation-element invalid actual times can silently clear valid values;
Booking Reset changes the CUIW charging state;
several forms report success without a reliable durable-persistence result;
Calendar exposes recurrence, date-span and notification behaviour that is not implemented;
configuration-dependent controls can silently reset or reinterpret values.

Detailed findings are recorded in docs/audit_findings.md.

Priority: Complete - findings require disposition before final regression.

2. Persistence-result and partial-operation audit - COMPLETED 28 July 2026

Status: Complete.

The audit traced persistence results, mutation ordering, corruption handling and partial-operation behaviour across the shared storage wrapper and all principal local datasets.

Covered:

movement and formation persistence;
booking, linked-strip and Booking Profile operations;
Calendar events;
configuration and METAR state;
VKB overrides;
Hours Log;
audit and diagnostic logs;
cancelled-sortie and Deleted Strips recovery stores;
generic-overflight counters;
backup export and restore;
multi-record lifecycle operations.

Consolidated severity:

Critical: 2
High: 14
Medium-high: 10
Medium: 8
Low-medium: 3
Total: 37

Principal findings:

the shared storage boundary cannot reliably report durable success;
most stores mutate live memory before persistence and return success-shaped values after failure;
legacy movement migration can delete the only durable dataset before its replacement is confirmed;
booking plus strip creation is non-atomic and can leave either side missing;
backup restore is non-transactional and overlays rather than faithfully replaces the installation;
multi-record cancellation, deletion and booking operations lack rollback and result verification;
corrupt operational, audit and recovery datasets are often replaced with empty state rather than preserved;
audit and recovery records can contradict the primary durable datasets;
storage-unavailable mode is not treated as a blocking or read-only application state.

Detailed findings are recorded in docs/audit_findings.md.

Priority: Complete - the systemic persistence architecture requires remediation before final regression.
3. Cross-dataset integrity audit - COMPLETED 30 July 2026

Status: Complete.

The audit examined identity, reference and lifecycle consistency across movements, formations, bookings, Cancelled Sorties, Deleted Strips, Calendar, Booking Profiles, VKB/configuration, the central audit ledger, diagnostics, backup/restore and startup reconciliation.

Passes completed:

primary identity and reference relationships;
movement, booking and formation lifecycle integrity;
secondary stores and semantic references;
audit identity and causality;
diagnostic and recovery evidence;
backup, restore and movement replacement;
startup reconciliation coverage;
consolidation, deduplication and final severity review.

Consolidated severity:

Critical: 1
High: 12
Medium-high: 11
Medium: 8
Low-medium: 1
Total: 33

Principal findings:

reusable numeric IDs do not identify a specific entity incarnation;
audit, cancellation and deletion histories can attach to a later unrelated entity after ID reuse;
normal booking creation leaves its reciprocal movement link incomplete until startup reconciliation;
duplicate movements claiming one booking remain operationally live;
some deterministic booking-link repairs require a second startup;
formation editing reconstructs elements and can erase lifecycle status and actuals;
booking-originated cancellation bypasses the canonical movement cancellation, formation cascade and recovery path;
booking deletion and unlinking can leave stale one-sided references;
Cancelled Sorties and Deleted Strips resolve source movements by reusable numeric ID alone;
restoration and reinstatement can preserve stale booking references or intentionally divergent lifecycle state;
Calendar suppression trusts one-sided movement booking references;
audit correlation stops at service boundaries and automatic reconciliation is attributed to the local user;
nested audit changes are detected but do not retain useful before/after evidence;
diagnostic and reconciliation summaries are not durable enough for post-restart investigation;
full and legacy restore can create hybrid cross-dataset states;
startup reconciliation checks only movement-booking links and planned activation;
duplicate primary IDs, secondary-store conflicts and ambiguous recovery references are not checked at startup;
corrupt primary and recovery stores can be overwritten with empty state during startup.

Systemic conclusion:

Flite does not yet have stable entity-incarnation identity or a general cross-dataset integrity boundary. Existing reconciliation is narrow, repair and restore are not transactional, and secondary stores can attach historical or recovery evidence to the wrong current record after deletion, restore or ID reuse.

Detailed findings are recorded in docs/audit_findings.md.

Priority: Complete - identity, transactional restore and integrity-state remediation are required before final regression and release acceptance.
4. Date, time and timezone audit - COMPLETED 30 July 2026

Status: Complete.

The audit traced date and time behaviour across the operational movement model, lifecycle actions, Calendar, History, reporting, exports and the installed Tauri runtime.

Covered:

UTC and local-time input and display;
BST transitions, including repeated and missing civil times;
DOF and midnight crossings;
movements spanning more than one date;
ARR/DEP reciprocal calculations;
Save & Complete and retrospective-entry timing;
duplication, reinstatement and restoration;
formation actual times;
Calendar month, week and year generation;
multi-day events, recurrence and notifications;
History cutoffs and Historic Calendar grouping;
Monthly Return and CSV/XLSX exports;
cancellation report date ranges;
updater timestamps and open-session day rollover.

Consolidated severity:

High: 9
Medium-high: 8
Medium: 7
Total: 24

Principal findings:

Flite does not have one canonical operational-time model;
local/UTC conversion uses a current fixed offset rather than date-aware Europe/London rules;
the movement model cannot represent start and end events on different dates;
Save & Complete can fabricate actual times from planned values or the current clock;
Booking and reinstatement paths can write local clock values directly into UTC movement fields;
the primary Calendar shifts visible date keys backwards during BST;
multi-day and recurring Calendar behaviour is exposed but not implemented;
History period filters interpret UTC movement times as browser-local values;
Monthly Return midnight allocation is incomplete and can present invented daily event distribution;
report summaries and exported detail evidence can disagree at month boundaries;
workstation-clock corrections can leave movements incorrectly autoactivated;
exports omit sufficient timezone and next-day semantics.

Detailed findings are recorded in docs/audit_findings.md.

Priority: Complete - the operational time model requires remediation before final regression and release acceptance.
5. Control-to-domain trace audit - COMPLETED 5 August 2026

Status: Complete.

The audit traced consequential visible controls through their complete execution path:

visible control
→ event handler
→ validation
→ domain or service mutation
→ persistence
→ audit event
→ diagnostic failure handling
→ UI acknowledgement

Passes completed:

movement creation, editing, duplication, retrospective entry and Create From;
movement lifecycle and status-transition controls;
cancellation, deletion, reinstatement and restore;
Booking, linked-strip and Calendar controls;
Admin, configuration, backup/restore and import/export controls;
cross-path consistency, duplicate activation, stale state, partial failure and recovery.

Consolidated severity:

Critical: 8
High: 27
Medium-high: 5
Medium: 2
Total: 42

Principal findings:

the shared persistence boundary cannot prove durable success;
storage-unavailable writes can silently do nothing while controls continue to report success;
consequential controls directly orchestrate non-transactional multi-store operations;
completion, activation and cancellation have duplicate pathways with different validation and side effects;
full backup restore is non-atomic, overlays absent datasets and can create a hybrid installation;
restore does not reliably invalidate or reload all module-level state and open editors;
Deleted Strip restoration can remove the only recovery snapshot after an undurable movement insertion;
Booking plus strip creation is not one verified operation and deliberately begins with a one-sided link;
Booking cancellation and deletion bypass canonical movement cancellation and formation cascade;
Booking and recovery local times can be written directly into UTC movement fields;
reinstatement and restoration can create PLANNED movements retaining stale actual times;
cancellation and deletion audit records can claim recovery data that was never durably stored;
configuration, Calendar and Booking Profile controls can acknowledge undurable changes;
audit events can contradict the primary durable datasets and are not a transaction journal;
stale editors, duplicate submissions and multiple application windows are not protected by revision or idempotency controls;
startup reconciliation covers only a narrow subset of possible incomplete or contradictory states;
the UI cannot clearly represent partial completion, degraded persistence or required recovery.

Systemic conclusion:

Flite does not yet have an authoritative command layer between visible controls and domain persistence. UI handlers directly coordinate validation, lifecycle policy, related-record mutation, persistence, audit and acknowledgement. In-memory state is routinely treated as durable state, while status and audit events do not prove that all required lifecycle side effects completed.

Required remediation direction:

introduce a result-bearing persistence boundary and explicit degraded-storage mode;
move consequential operations into authoritative domain commands;
add transaction, rollback or durable incomplete-operation handling for multi-store actions;
unify completion, activation and cancellation policies;
add stable entity-incarnation identity, revisions and idempotency;
implement a general cross-dataset invariant scanner and operator-facing recovery controls;
complete the defined failure-injection, concurrency, packaged-runtime and restart-level manual tests.

Detailed findings are recorded in docs/audit_findings.md.

Priority: Complete - architectural remediation is required before final regression and release acceptance.

6. Security and data-exposure audit - COMPLETED 6 August 2026

Status: Complete.

The audit examined Flite’s local security boundaries and the ways operational or personal data can enter, leave, persist within or cross trust contexts in the application.

Passes completed:

rendering and DOM injection;
import and deserialisation security;
CSV, XLSX, file-export and clipboard exposure;
diagnostics, operational audit records, backups and privacy;
Tauri capabilities, native commands, updater and external-navigation boundaries;
secrets, signing-key handling, abuse cases and final consolidation.

Consolidated findings:

Confirmed findings: 21
Inferred risks: 10
Manual-test requirements: 3
Confirmed-sound controls: 26

Confirmed-finding severity:

Medium-high: 1
Medium: 13
Low-medium: 3
Low: 4
High: 0
Critical: 0
Total: 21

Principal findings:

full-session backup validation checks dataset containers but not nested record integrity;
legacy movement restore and Booking Profile import accept insufficiently constrained objects;
import size, nesting, field length and record counts are not bounded;
full restore is non-transactional and can leave a partially replaced installation after quota failure;
movement and cancellation CSV exports are vulnerable to spreadsheet-formula injection;
CSV safety logic is duplicated and inconsistent;
native text-save failure can redirect sensitive data to Downloads without prior consent;
METAR clipboard fallback can report success without proving that the clipboard changed;
full-session backups contain readable personal and operational data;
the operational audit ledger is unbounded and retains unrestricted scalar values;
corrupt audit storage is silently treated as an empty ledger and can later be overwritten;
diagnostic output can expose local paths, workstation identity and implementation details;
native save commands accept unbounded renderer payloads;
application restart is directly callable from the renderer;
automatic update checking creates an outbound GitHub request by default;
the repository does not ignore common secret and signing-key file patterns;
the local signing workflow does not explicitly zero the unmanaged password buffer;
production signing can be performed from a deliberately dirty working tree;
release provenance appears dependent on a manual local process.

Confirmed strengths:

no committed private signing key or credential was identified;
the packaged updater contains only the public verification key;
the Content Security Policy is restrictive;
Tauri capabilities do not grant shell, process, broad filesystem or generic network access;
native file destinations require operator selection;
updater endpoint and signing verification key are fixed;
update installation requires a prior successful native check;
release notes are rendered as text;
unknown backup storage keys are not restored;
malformed current-format datasets block restore before mutation;
technical diagnostics are bounded, deduplicated and excluded from normal backups;
principal rendering pathways generally encode dynamic HTML values.

Systemic conclusion:

Flite’s desktop privilege boundary is comparatively narrow, and no direct remote-code-execution or committed-secret finding was confirmed. The principal risks arise when data crosses formats or persistence boundaries: hostile or oversized imports, non-transactional restore, spreadsheet interpretation of exported strings, plaintext backup distribution, audit-ledger corruption and growth, and manually controlled release signing.

Required remediation direction:

implement bounded record-level import validation and transactional restore;
centralise spreadsheet-safe export encoding;
protect corrupt audit evidence and define ledger retention;
add sensitive-data warnings and explicit fallback consent for backups and exports;
redact diagnostic workstation information;
limit native command payloads and renderer restart authority;
strengthen signing-key exclusions, custody, clean-tree enforcement and release provenance;
complete the hostile-data, packaged-runtime, signing and restart-level manual tests.

Detailed findings are recorded in docs/audit_findings.md.

Priority: Complete - the confirmed Medium and Medium-high findings require disposition before final regression and release acceptance.

7. Accessibility and keyboard-operation audit - COMPLETED 7 August 2026

Status: Complete.

The audit examined Flite's principal keyboard, focus, semantic, dynamic-feedback and visual-accessibility behaviour across the operational interface.

Passes completed:

semantic structure and accessible naming;
modal, dialog and focus-management behaviour;
keyboard activation, Enter/Space and dropdown menus;
dynamic rendering, focus retention and status announcements;
visual accessibility and non-colour cues;
consolidation and manual-test preparation.

Consolidated findings:

Confirmed findings: 23
Inferred risks: 10

Confirmed-finding severity:

High: 2
Medium-high: 5
Medium: 13
Low-medium: 3
Critical: 0
Total: 23

Principal findings:

shared button and field styling removes native focus outlines without a consistent replacement;
the shared movement-modal document-level Enter handler can trigger unintended Save actions;
custom modals lack complete dialog semantics, initial focus, focus containment, background inertness and reliable focus return;
Booking and Calendar dialogs bypass the shared Escape mechanism;
Live Board inline editing cannot be initiated by keyboard even though the editor itself has strong Enter, Escape and Tab handling;
History sortable column headers are mouse-only;
Live Board Edit and Create From menus do not implement a complete keyboard menu/submenu model;
top-level navigation declares tablist semantics without implementing the corresponding ARIA tab keyboard model;
many visible form labels, filters and searches lack reliable programmatic association or accessible naming;
repeated table actions and some table headings provide insufficient context to assistive technology;
toast notifications, METAR validation, METAR Copy feedback and updater state changes are not exposed through appropriate live status semantics;
Calendar and Live Board rerenders can destroy keyboard context outside the specially protected inline-edit workflow;
the Booking Details drawer opens dynamically without focus transfer or announcement;
disabled controls frequently lack a programmatically associated explanation;
some persistent header text and the FIS-total colour fail normal-text contrast targets;
several operational labels are rendered at approximately 8-10px and require packaged-runtime zoom and readability validation;
icon-only modal close controls have weak accessible naming;
the visual timeline lacks a sufficiently explicit alternative semantic representation.

Confirmed strengths:

native buttons, inputs and selects are used extensively;
principal buttons generally retain native Enter and Space activation;
shared movement modals support Escape and deliberately clean up their document key handler;
closed row menus are removed from sequential focus;
inline editors support Enter commit, Escape cancel and deliberate Tab/Shift+Tab traversal;
failed inline validation prevents unintended advancement;
background Live Board rerenders are deferred while inline editing is active;
formation inputs have explicit visible focus outlines;
reconciliation uses alert semantics and exposes expanded state correctly;
METAR, updater, exports and reconciliation generally provide textual information in addition to colour or icons;
active navigation uses weight, borders and background as well as colour;
flight types are explicitly labelled LOC, DEP, ARR and OVR;
formation divergence includes textual DIVERGED and status information.

Systemic conclusion:

Flite is not yet fully keyboard-accessible or assistive-technology accessible. The underlying use of native controls is generally sound, but custom interaction layers do not provide one consistent accessibility model. The principal systemic weaknesses are focus visibility, modal focus lifecycle, keyboard entry into custom interactions, non-standard menu operation, silent dynamic status changes and loss of focus context after rerender.

Required remediation direction:

restore a strong application-wide focus-visible treatment;
remove document-level Enter-to-save and use semantic form submission;
centralise all custom dialogs behind one accessible modal service;
make inline-edit initiation, History sorting and all row menus fully keyboard operable;
either implement complete ARIA tab/menu patterns or simplify those controls to ordinary native disclosure/navigation patterns;
centralise live-region handling for success, warning, error and asynchronous status messages;
preserve logical focus identity across rerenders;
complete form-label, table-heading and repeated-action accessible naming;
correct confirmed contrast and very-small-text problems;
complete the defined packaged-runtime keyboard, screen-reader, rerender-focus, zoom, forced-colours and computed-contrast tests.

Detailed findings are recorded in docs/audit_findings.md.

Priority: Complete - the two High findings and broader keyboard/focus defects require disposition before final regression and release acceptance.
8. Performance and scale audit - COMPLETED 7 August 2026

Status: Complete.

The audit examined how Flite's current browser/Tauri architecture scales as operational and historical datasets grow, with particular attention to whether retained lifetime data increases the cost of current-day operator actions.

Passes completed:

startup, dataset loading and retained state;
Live Board, Timeline and high-frequency rendering;
Search, History, Calendar, VKB and table scaling;
persistence, logs, backup and restore-preflight scaling;
reports, exports and mature-installation workloads;
consolidation and benchmark specification.

Consolidated findings:

Confirmed findings: 19
Inferred risks retained after consolidation: 2
Critical: 0

Confirmed-finding severity:

High: 6
Medium-high: 12
Medium: 1
Total: 19

Principal findings:

Live Board alert generation is algorithmically quadratic as concurrent movement count rises;
routine movement mutations synchronously serialise and rewrite the complete retained movement store;
the central operational audit ledger is an unbounded read, parse, append, serialise and rewrite document;
Booking Calendar month and year views repeatedly rescan complete booking, movement and event datasets for each displayed date;
Historic Strip Board performs complete history filtering, sorting and DOM reconstruction on every text-input keystroke;
Aircraft Registrations Last Updated resolution can repeatedly parse and scan the complete audit ledger once per visible table row;
startup booking reconciliation contains a bookings-by-movements relationship scan;
startup eagerly and redundantly renders data-heavy views;
formation normalisation can force a complete movement-store rewrite on startup;
the 45-second maintenance tick repeats movement scans and Live Board/Timeline reconstruction;
History Search Table limits rendered rows only after complete matching and sorting work;
Cancelled Sorties rendering and reporting perform repeated joins against retained movement and cancellation history;
Cancelled Sorties persistence rewrites the complete lifetime cancellation log for each append;
backup generation reparses and duplicates the complete persisted installation state before export;
successful restore performs complete backup inspection once for preflight and again before import;
one-month reporting remains coupled to the complete retained movement history;
Official Return and Dashboard hours calculations repeatedly reload and parse the complete lifetime Hours Log despite already receiving a loaded hours map;
registration autocomplete and registration lookup unnecessarily rebuild the complete effective registration dataset before searching;
several administrative and cancellation tables perform complete sorting or DOM reconstruction despite visible pagination or row limits.

Systemic conclusion:

Flite's principal scale risk is not simply the number of movements visible today. Historical retention progressively increases the cost of current operational actions.

The dominant architectural causes are:

monolithic synchronous localStorage datasets;
an unbounded audit ledger stored as one JSON document;
lack of persistent or per-render indexes for common date and relationship joins;
full reconstruction rendering in several high-frequency interfaces;
historical data sharing the same hot execution paths as current operational state.

The current implementation therefore has an installation-age performance ceiling that cannot be established from small development datasets alone.

Confirmed strengths:

VKB source files load in parallel;
technical diagnostics are bounded to 100 retained records;
Deleted Strips has a 24-hour retention limit;
Live Board global search is debounced;
History Search Table caps DOM output at 500 rows;
Aircraft Registrations Admin uses pagination, cached search text, search debounce and delegated actions;
reporting builds a cached registration lookup map rather than scanning the registration dataset for every classification;
restore validates the complete current-format backup before beginning mutation.

Required benchmark programme:

test fresh, mature and stress installation profiles;
hold today's operational workload constant while independently increasing lifetime history;
measure cold startup, reconciliation, Live Board rendering, Timeline rendering and the 45-second maintenance tick;
measure ordinary movement and booking save latency as movement and audit histories grow;
measure History Strip Board and History Search keystroke-to-paint latency;
measure Booking Calendar month and year navigation;
measure registration autocomplete and Aircraft Registrations pagination with the production registration dataset;
measure cancellation reporting with independent growth of current cancellations and lifetime cancellation history;
measure Official Return, Dashboard and Insights against increasing lifetime movement and Hours Log data;
measure CSV and XLSX generation duration and peak memory;
measure backup generation, restore preflight and confirmed restore phases separately;
record main-thread long tasks and scaling curves rather than relying only on absolute elapsed time.

Indicative mature-installation targets:

ordinary control response: 100 ms preferred;
search/autocomplete response: 150 ms or less;
tab or view switch: 250 ms or less;
calendar and report render: 500 ms or less;
movement or booking save main-thread blocking: 200 ms or less;
45-second maintenance work: 100 ms or less;
cold startup to usable Live Board: 2.5 seconds or less;
backup generation before Save dialog: 1 second or less;
restore preflight: 1 second or less;
normal-operation main-thread tasks should preferably remain below 50 ms and should not exceed 250 ms.

Required remediation direction:

optimise Live Board alert generation and other operator hot paths first;
index Calendar, cancellation, reconciliation and report relationships rather than repeatedly rescanning full datasets;
use the already-retained effective VKB registration data instead of reconstructing it for every lookup/search;
remove repeated Hours Log parsing from report calculations;
reduce unnecessary startup rendering and persistence;
move movements and the operational audit stream toward record-oriented, partitioned or append-oriented durable persistence rather than lifetime JSON rewrites;
paginate or virtualise unbounded detail tables;
reduce redundant backup/restore parsing and XLSX memory amplification without weakening restore validation.

Detailed findings and the benchmark specification are recorded in docs/audit_findings.md.

Priority: Complete - the six High findings and systemic installation-age scaling risks require benchmarking and remediation disposition before final regression and release acceptance.

9. Browser-harness versus installed-Tauri parity audit - COMPLETED 7 August 2026

Status: Complete.

The audit compared Flite's browser harness with the installed Tauri runtime and traced environment-specific capability branches through operator feedback, diagnostics and persistence consequences.

Passes completed:

environment detection and the Tauri capability boundary;
Save As, CSV, XLSX and file-export parity;
clipboard, external navigation and browser-API parity;
updater, restart and installed lifecycle behaviour;
persistence, reload, dialogs and runtime behaviour;
consolidation and packaged-runtime parity-test specification.

Consolidated findings:

Confirmed findings: 11
Inferred risks retained after consolidation: 4
Critical: 0
High: 0

Confirmed-finding severity:

Medium-high: 3
Medium: 8
Total: 11

Principal findings:

installed native-version IPC failure can leave browser-only dev identity in backup and audit provenance;
full JSON backup uses the generic native text-save command even though that command exposes a CSV-only Save As filter;
Booking Profile JSON export bypasses the native Save As path and retains browser/WebView download behaviour in the installed application;
METAR Copy assumes navigator.clipboard exists and can fail before its fallback is reached;
CAA and FAA registry-copy controls report Copied before asynchronous clipboard success is known;
CAA and FAA external navigation relies on unchecked window.open behaviour rather than an explicit installed-app opener path;
failed update installation consumes the native pending-update object but re-enables an Install control that cannot actually retry without another update check;
automatic updater checks can refresh Last checked while Status remains Not checked, and failed or offline attempts are recorded as checked timestamps;
failure of the installed-only Restart action is silently discarded;
storage-capacity reporting and preflight use a fixed 5 MB localStorage assumption rather than measured runtime capacity;
Admin Restore has no explicit FileReader read-error path.

Confirmed strengths:

browser mode explicitly identifies itself as browser/dev and disables or hides installed-only updater controls;
renderer command names inspected by the audit match the registered Rust command surface;
CSV generation occurs before the browser/native save split, reducing content divergence;
native Save cancellation is distinguished from successful saving;
native-save fallback paths inspected by the audit tell the operator when Downloads fallback is used;
XLSX native failure proceeds to an explicit browser fallback and records critical failure if that fallback also fails;
restore parsing and validation are shared frontend logic once the selected file is readable;
destructive restore confirmation uses an application-owned HTML dialog rather than browser/native confirm semantics;
ordinary renderer reload and native application restart are deliberately separate operations;
updater installation confirmation deliberately avoids the unsupported native-confirm ACL path;
the Windows NSIS updater close/relaunch lifecycle has previously been validated end to end.

Systemic conclusion:

The browser harness remains useful for shared UI, validation and domain behaviour, but it cannot be treated as acceptance evidence for installed-product capabilities. Filesystem operations, application identity, clipboard availability, external navigation, updater lifecycle, process restart and installed persistence characteristics require an explicit packaged-Tauri parity gate.

Required remediation direction:

correct the native JSON Save As filter and verify backup-to-restore interoperability in the packaged application;
use an explicit installed-runtime identity state rather than retaining dev provenance after native version failure;
centralise clipboard operations behind a result-bearing capability wrapper;
define and test the intended installed external-navigation mechanism;
make updater pending-state, Last checked, Status and retry behaviour accurately reflect native state;
report restart invocation failure;
replace assumed storage availability/capacity checks with result-bearing runtime checks where feasible;
add explicit restore file-read failure handling;
retain a small mandatory packaged-Tauri acceptance suite alongside browser regression testing.

Detailed findings and the packaged-runtime parity test specification are recorded in docs/audit_findings.md.

Priority: Complete - the three Medium-high findings and installed-runtime truthfulness gaps require remediation disposition and packaged-Tauri acceptance before final regression and release acceptance.
10. Backup and restore destructive-behaviour audit - COMPLETED 10 August 2026

Status: Complete.

The audit examined the destructive semantics of full and legacy backup restoration, including what happens to an existing installation when a restore is partial, older, malformed, incomplete, interrupted, only partly writable or followed by continued operation before reload.

Passes completed:

backup format and restore contract;
preflight and validation boundary;
current-format mutation ordering and partial failure;
legacy restore and movement replacement;
post-restore runtime state, reload and reconciliation;
consolidation and destructive-restore manual-test specification.

Consolidated findings:

Confirmed findings: 8
Critical: 0
High: 4
Medium-high: 3
Medium: 1
Total: 8

Principal findings:

current-format restore is non-atomic and a failed restore can leave an arbitrary hybrid of restored and pre-restore datasets with no rollback or exact mutation-boundary report;
successful full restore leaves writable Booking, Calendar and Booking Profile caches on pre-restore state until reload, allowing later operator activity to overwrite successfully restored data;
legacy movement restore can report success after the movement persistence write failed, leaving imported movements only in memory and allowing the old durable movement population to reappear after restart;
legacy movement replacement can combine preserved modern bookings with unrelated restored movements that reuse the same numeric IDs, and reciprocal-ID startup reconciliation cannot distinguish entity incarnations;
restore preflight validates dataset containers rather than complete record semantics, so insufficiently validated current or legacy records can destructively replace valid operational data;
a Full backup restore is an overlay rather than a complete installation-state replacement: omitted or null datasets and target-only dated generic-overflight state survive;
restoredKeys and the success summary record attempted writes rather than verified durable persistence because the shared storage boundary has no write acknowledgement or read-back verification;
restored VKB overrides are not comprehensively propagated through all loaded VKB and reporting caches until reload.

Systemic conclusion:

Restore is implemented as a sequence of ordinary LocalStorage mutations rather than as an installation-state transaction.

The principal destructive risks are:

a failed restore can permanently replace only part of the installation;
a successful restore is not runtime-safe until stale writable module state has been discarded;
legacy restore does not establish durable movement replacement or stable cross-generation entity identity;
the operator cannot infer complete target state merely from a Full backup label or successful restore result.

Confirmed strengths:

current-format inspection runs before intended mutation;
malformed outer JSON and unrecognised structures are blocked;
unsupported future current-format versions are blocked;
present fixed datasets must parse and satisfy defined top-level shapes;
malformed fixed datasets block current restore rather than being silently skipped;
dynamic generic-overflight keys are strictly allowlisted;
unknown arbitrary storage keys are not restored;
preview and import use the same inspection function and import reinspects before mutation;
legacy formats are explicitly identified and warned as movement-only;
current successful restore reloads movements and configuration;
Hours data is read fresh from storage;
fresh startup rebuilds JavaScript module state;
booking reconciliation repairs simple dangling or inconsistent links and exposes detected repairs through an integrity banner;
technical diagnostics provide separate evidence of persistence failures.

Required remediation direction:

make full restore transactional through staging plus verified commit or an exact pre-restore rollback snapshot;
return structured per-key persistence results and verify durable writes before reporting restoration;
on any failed restore, identify exactly which datasets changed and force recovery or safe restart before further operator mutation;
invalidate and reload every restored writable subsystem before declaring success, or force immediate application reload before controls become usable;
strengthen restore validation to record-level semantic validation with bounded inputs;
define explicit replace-versus-overlay semantics and show the resulting target-state plan before confirmation;
give restored entities stable incarnation identity so cross-generation numeric-ID reuse cannot satisfy relationship reconciliation incorrectly;
rebuild VKB and reporting caches deterministically after restore.

The final destructive-restore acceptance specification contains 48 scenario tests covering successful replacement, omitted/null/empty datasets, malformed and future backups, write failure at every significant mutation boundary, stale-cache overwrite, legacy false success, ID reuse, startup reconciliation, reload and packaged restart.

Detailed findings and the destructive-restore test specification are recorded in docs/audit_findings.md.

Priority: Complete - the four High findings require remediation before final regression and release acceptance.
11. Release artefact and clean-install audit - COMPLETED 10 August 2026

Status: Complete.

The audit examined the real Windows release lifecycle from release configuration and installer identity through clean installation, first launch, update, manual upgrade, uninstall/reinstall and release artefact provenance.

Passes completed:

release configuration and artefact contract;
installer identity and Windows integration;
clean install and first-launch state;
upgrade and updater lifecycle;
uninstall, residual-data and reinstall lifecycle;
release artefact provenance and clean-build acceptance.

Consolidated findings:

Confirmed findings / verification gaps: 13
Critical: 0
High: 1
Medium-high: 2
Medium: 7
Low-medium: 2
Low: 1
Total: 13

Principal findings:

the audited source baseline is 29 commits beyond the public v0.9.4 tag while package.json, Cargo.toml and tauri.conf.json still identify the application as 0.9.4, allowing materially different binaries to share the same release identity;
the packaged application exposes its semantic version but reports buildSource as unknown, so an installed binary cannot be traced to an immutable source commit;
release production is manually assembled rather than mechanically tied to an exact tested tag;
the clean-build toolchain is not fully pinned or reproducibly specified;
the default Windows NSIS configuration can require network access to obtain WebView2 where the runtime is absent;
the custom NSIS hook forces a Desktop shortcut and can recreate it during later installs or updates;
production retains an explicitly confirmed Danger Zone Reset to Demo control capable of placing synthetic movements into the ordinary operational movement store;
the historical packaged updater-survival test covers only part of the current persistence surface;
the documented manual NSIS upgrade path does not have equivalent packaged acceptance evidence;
the uninstall/reinstall WebView data-retention contract is not defined or demonstrated;
downgrade guidance addresses Windows version ordering but not compatibility of newer persisted schemas with an older application;
publishing both MSI and NSIS exposes an untested cross-installer lifecycle;
package-lock.json retains stale historical product/version metadata.

Systemic conclusion:

The Tauri application-side packaging architecture is broadly coherent, but the release lifecycle around it is insufficiently controlled.

The strongest release risk is source-to-version provenance. Public v0.9.4 refers to commit 41bbeed16f475fb32bd30624a5f9327d70464d7a, while the audited baseline 76a20a1a89f1e3eac3d163ef2f212f62470f5552 is 29 commits later and contains substantial runtime changes while still declaring version 0.9.4.

A clean build from the audited baseline would therefore produce a materially different application carrying the same semantic version as the already-published July release.

Confirmed strengths:

productName Vectair Flite and identifier com.vectair.flite are stable and coherent;
the principal version-bearing manifests are mutually aligned at the frozen baseline;
the Tauri updater public key is committed while private signing material remains external;
createUpdaterArtifacts is enabled and updater artefacts are signed;
the public v0.9.4 release has an exact Git tag;
GitHub records SHA-256 digests for the published release assets;
a real Windows NSIS updater transition from 0.9.0 to 0.9.1 previously preserved significant operational state;
a genuinely fresh application profile starts with no operational movements, bookings, calendar events or booking profiles;
movement persistence includes explicit v1/v2 to v3 migration;
configuration loading preserves existing values while merging newly introduced defaults;
update installation requires explicit operator action;
Rust dependencies are substantially pinned through Cargo.lock;
the local development reinstall helper refuses dirty-tree builds by default.

Required remediation direction:

assign a new unique semantic version before any further distributable build;
make version advancement a mandatory release gate;
embed or expose an immutable Git commit/build identifier in the packaged application;
build releases from an exact accepted tag rather than moving main;
introduce a hardened release script or CI workflow;
define the supported Windows installer channel and remove MSI if it is not intentionally supported;
repeat updater acceptance using every current persistence class;
test manual NSIS-over-existing-install separately from the in-app updater;
establish and document the actual uninstall/reinstall WebView-data contract;
require a verified backup before destructive uninstall/downgrade operations until that contract is proven;
define downgrade schema compatibility;
decide whether Reset to Demo belongs in production;
resolve offline WebView2 installation policy;
respect user Desktop-shortcut choice across install and upgrade;
pin and document the supported clean-build toolchain;
remove stale package-lock identity/version metadata.

Detailed findings and the final release-lifecycle acceptance specification are recorded in docs/audit_findings.md.

Priority: Complete - the High provenance finding and the remaining Medium-high/Medium lifecycle gaps require remediation and packaged Windows acceptance before final regression and V1 release.

12. Documentation-to-product audit

Once UI behaviour settles, compare:

README;
STATE.md;
architecture documentation;
installer/release notes;
operator guidance;
backup/restore instructions;
updater instructions;
screenshots;
version references.

This should identify documentation that describes old storage counts, old branding, obsolete workflows or features that no longer exist.

Priority: Later in this phase.

Recommended sequence

The prudent remaining investigation sequence is:

1. Cross-dataset integrity audit
2. Control-to-domain trace audit
3. Security/data-exposure audit
4. Accessibility and keyboard-operation audit
5. Performance and realistic-scale audit
6. Installed-Tauri parity and clean-install/update audit
7. Final backup/restore scenario audit
8. Final documentation and regression audit
