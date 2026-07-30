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
5. Control-to-domain trace audit

The current pass traced principal controls, but a more systematic audit can map every consequential visible action to its final domain mutation:

visible control
â†’ event handler
â†’ validation
â†’ domain/service call
â†’ persistence
â†’ audit event
â†’ diagnostic failure path
â†’ UI acknowledgement

This is particularly valuable for:

edit menus;
duplicate actions;
cancellation/reinstatement;
soft delete and restore;
reciprocal strip creation;
formation cascade actions;
profile import/export;
backup/restore;
updater actions;
Danger Zone.

It would reveal handlers that exist but call obsolete or incomplete pathways.

Priority: Medium to high.

6. Security and data-exposure audit

Flite is local-first and does not currently have authentication, but it stores personal and operational information.

A focused audit should examine:

unescaped dynamic HTML and XSS exposure;
imported JSON used in rendered fields;
CSV formula injection in exports;
spreadsheet formula injection;
external links opened with unsafe window.open behaviour;
diagnostic reports exposing personal contact details;
backup files containing contact information;
whether technical errors capture excessive record data;
path/file naming leakage;
clipboard actions;
handling of malformed or hostile import files.

This should be proportionate. Flite does not need enterprise penetration testing before V1, but imported data and generated HTML deserve review.

Priority: Medium to high.

7. Accessibility and keyboard-operation audit

A complete accessibility programme is too large for this phase, but a basic operational audit is prudent:

every modal closable with Escape;
Enter does not trigger unintended actions;
keyboard focus enters and returns from modals;
dropdown menus work without a mouse;
visible controls have useful accessible names;
table actions are reachable;
disabled controls explain why;
colour is not the only status indicator;
text contrast is adequate;
focus is not lost after render.

The existing code contains substantial custom modal and dropdown handling, making keyboard regression plausible.

Priority: Medium.

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
