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
8. Performance and scale audit

The earlier Aircraft Registrations delay shows that performance defects can emerge only with realistic data volume.

A targeted scale audit should use:

the full registration dataset;
large movement histories;
several years of generic-overflight keys;
many bookings and profiles;
large audit and diagnostic logs;
History filters and calendar rendering;
report generation and XLSX export;
backup and restore of a mature installation.

Measure:

startup
tab switching
search response
render duration
save duration
backup generation
restore preflight
report export

Priority: Medium, but should occur before final acceptance.

9. Browser-harness versus installed-Tauri parity audit

Some features deliberately differ between browser and installed app:

updater;
native Save As;
filesystem behaviour;
external links;
clipboard;
restart;
installer teardown;
browser download fallback.

A parity audit should identify every environment-specific branch and confirm that the UI accurately reflects capability in both environments.

The browser harness should not be allowed to create false confidence about installed behaviour, and the installed app should not expose browser-only assumptions.

Priority: High before release.

10. Backup and restore destructive-behaviour audit

Items 1â€“3 established coverage and validation, but a final scenario-based audit should still test:

backup with every dataset populated;
restoring into a non-empty installation;
missing optional keys;
legacy movement-only backups;
corrupt JSON;
valid JSON with invalid shapes;
unsupported versions;
restore interruption;
storage failure halfway through restore;
reloading after restore;
backup provenance and version messaging;
restoring older backups into newer versions.

The critical question is not merely whether import succeeds, but whether the operator understands exactly what was replaced.

Priority: High before final acceptance.

11. Release artefact and clean-install audit

Before V1, test from outside the development environment:

clean Windows installation;
upgrade from 0.9.4;
update check on launch enabled and disabled;
manual update;
update failure and retry;
preservation of data across update;
uninstall behaviour;
reinstall behaviour;
application name, icon, publisher and version;
Start Menu shortcut;
installer warnings;
first-launch state;
whether demo data is appropriate on a clean production install.

Priority: Essential, but after the current code corrections.

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
