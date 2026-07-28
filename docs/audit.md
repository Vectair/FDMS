1. Form-state and validation audit

This should be next.

The CUIW Reset defect shows that reviewing visible controls is insufficient; each form needs its complete state lifecycle checked:

initial open
default values
autofill
manual editing
validation failure
Reset
successful save
cancel/close
reopen/edit
duplicate
restore from saved data

This should cover:

movement creation and editing for DEP, ARR, LOC and OVR;
formation creation and element editing;
Booking and Booking Profiles;
Calendar event creation/editing;
cancellation and reinstatement dialogs;
Admin configuration forms;
METAR Builder;
VKB override editors.

The objective is to find contradictory defaults, stale hidden fields, reset omissions, fields that overwrite manual input, and forms that claim success despite persistence failure.

Priority: High.

2. Persistence-result and partial-operation audit

Items 4–6 improved the storage architecture, but the UX audit has exposed an important remaining pattern:

write fails internally
→ error is logged
→ caller continues
→ UI reports success

This audit should identify every mutation path where:

an in-memory object changes before persistence;
storage functions suppress errors;
the caller cannot distinguish persisted success from failure;
multiple records must be updated together;
one half of a linked operation can succeed while the other fails.

Particular focus:

booking plus linked movement creation;
booking/profile/calendar saves;
cancellation plus booking status synchronization;
movement deletion plus deleted-strip retention;
restore/reinstate operations;
VKB override saves;
configuration saves;
hours log;
METAR draft persistence.

This does not necessarily require transactions everywhere. It first requires a clear inventory of where the UI lacks a reliable success result.

Priority: High.

3. Cross-dataset integrity audit

The canonical Data Inventory already established that only booking-to-movement links receive active reconciliation.

A targeted audit should check:

bookings whose linked movement no longer exists;
movements referring to missing booking IDs;
cancelled log entries pointing to missing or non-cancelled movements;
deleted-strip snapshots with stale booking IDs;
duplicate movement IDs;
duplicate booking IDs;
malformed formation parent/element relationships;
VKB overrides that no longer correspond to valid datasets;
calendar entries linked to missing bookings or movements;
restored data containing contradictory references.

This audit should initially produce findings, not immediately build a full Integrity Checker.

Priority: High before final regression, although implementation may be deferred if the actual data risks are bounded.

4. Date, time and timezone audit

Flite has unusually extensive date/time logic, and errors here can affect operational interpretation.

The audit should test:

UTC versus local display and input;
BST transitions;
midnight crossings;
DOF boundaries;
movements spanning two dates;
ARR/DEP reciprocal time calculation;
Calendar date generation;
History period cutoffs;
cancellation report local versus UTC dates;
restore/export timestamps;
timeline windows ending at 24:00;
retrospective entries;
updater timestamps.

The Calendar implementation already constructs dates using a mixture of local Date constructors and toISOString(), which warrants deliberate review around timezone boundaries.

Priority: High.

5. Control-to-domain trace audit

The current pass traced principal controls, but a more systematic audit can map every consequential visible action to its final domain mutation:

visible control
→ event handler
→ validation
→ domain/service call
→ persistence
→ audit event
→ diagnostic failure path
→ UI acknowledgement

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

Items 1–3 established coverage and validation, but a final scenario-based audit should still test:

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

1. Complete dynamic UX audit
2. Form-state/default/validation audit
3. Persistence-result and partial-operation audit
4. Date/time/timezone audit
5. Cross-dataset integrity audit
6. Security/data-exposure audit
7. Performance and realistic-scale audit
8. Installed-Tauri parity and clean-install/update audit
9. Final documentation and regression audit
