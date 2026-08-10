Audits completed so far
1. Static operator-facing UX and production-copy audit

This reviewed the visible structure and wording across the principal Flite screens and Admin sections.

Covered:

Live Board
Weather / METAR
Calendar
Booking
History
Reports
Cancelled
VKB Lookup
Admin navigation and static content
visible placeholder, prototype, roadmap and future-tense wording
initial checks that principal controls had real handlers

Main findings:

The Booking page still says booking-to-strip integration is a prototype and future work, despite it already being implemented.
Admin â†’ Calendar is only a roadmap placeholder.
Admin â†’ Reports is only a roadmap placeholder.
Admin â†’ Cancelled is only a roadmap placeholder.
Admin â†’ Booking combines real Booking Profile management with a future â€œBooking Rules & Chargesâ€ panel.
Danger Zone lists future destructive actions that do not exist.
Clear Diagnostic Error History always reports success, even when clearing fails.
Admin Overview exposes some developer-oriented storage/runtime information that may belong in Developer.
Reports uses native alert() and confirm() while newer workflows use Flite dialogs and toasts.

General conclusion:

The main issue was not widespread dead UI. It was production screens exposing internal roadmap material and occasionally reporting outcomes inaccurately.

2. Dynamic operator-facing UX and action-path audit

This reviewed JavaScript-generated content and followed the principal dynamic controls into their handlers.

Covered:

Booking submission and reset behaviour
Booking Profile rendering and actions
Calendar month, week and year rendering
Calendar booking drawer
History empty states and row menus
Cancelled Sorties lifecycle view
Deleted Strips retention view
timeline empty state
dynamically generated action menus and empty-state messages

Main findings:

High or near-blocking
Booking Reset changes the CUIW default.
Initial page load sets â€œHas CUIWâ€ to unchecked, but Reset changes it to checked. This can remove the Â£25 waiver charge without deliberate operator action.
Calendar recurrence is exposed but not implemented.
The form offers daily, weekly, monthly and annual repeat options, but events are displayed only on their original date.
Calendar End Date is exposed but not implemented.
Multi-day events appear only on the start date.
Calendar notifications appear to be storage-only.
A notification value is saved, but no notification mechanism was identified.
Medium severity
Calendar Year view omits movement entries from its item count, even though those movements appear in month and week views.
Booking Profile save and delete can show success after storage failure.
Calendar create, edit and delete can similarly appear successful without durable persistence.
Booking creation reports both the booking and strip as successfully created without proving that both records were durably stored and linked.
Booking Profile export uses the obsolete filename prefix fdms_.
Low severity
Booking Profile empty states do not distinguish between no saved profiles and no search matches.
Booking Profile empty rows use the wrong colspan.
Deleted Strips empty rows use the wrong colspan.
Timeline empty-state wording is slightly imprecise.
Cancelled and Deleted empty states are accurate but could explain lifecycle behaviour more clearly.

Confirmed sound areas:

History empty states correctly distinguish filters from selected periods.
Cancelled row actions are all wired.
Deleted Strip restore and detail controls are wired.
Principal Booking, Calendar and Reports controls are generally functional rather than dead placeholders.
Consolidated audit findings by workstream
Booking correctness
Reset changes the CUIW default and therefore the calculated charge.
The Booking prototype notice is obsolete.
Booking/Profile persistence failures can still produce success messages.
Booking plus linked-strip creation is not verified as a complete durable operation.
Booking Profile export still uses legacy product naming.
Calendar truthfulness
Repeat options do not recur.
End Date does not create a date span.
Notification appears non-functional.
Year-view counts are inconsistent with month/week content.
Calendar persistence failures can be hidden behind success-shaped behaviour.
Admin production readiness
Calendar, Reports and Cancelled Admin destinations are roadmap placeholders.
Booking Admin includes a future configuration panel.
Danger Zone lists unimplemented future actions.
Overview contains some content better suited to Developer.
General UX integrity
Diagnostic clear can falsely report success.
Reports uses inconsistent native dialogs.
Several minor empty-state and table-layout issues remain.
3. Form-state and validation audit

Completed 28 July 2026.

This audit traced the complete state lifecycle of the principal operational forms and lifecycle controls, including defaults, autofill, manual edits, validation failures, resets, ordinary saves, Save & Complete, duplication, retrospective entry, cancellation, deletion, configuration changes, METAR handling and backup restoration.

Severity summary:

High: 6
Medium-high: 1
Medium: 14
Low-medium: 1

High-severity findings

1. New movement Save & Complete bypasses the canonical movement builder.

The normal new-movement save path uses the central movement-building and validation routine. Save & Complete separately reconstructs the movement and therefore applies weaker rules.

Confirmed differences include:

invalid time results are not reliably rejected;
POB and T&G range validation is absent;
ZZZZ companion-description validation is absent;
formation data is discarded;
PIC/captain data is discarded;
manual WTC selection is ignored and recalculated;
outcome and companion fields are incompletely mapped.

This can produce a completed movement that could not have been saved through the ordinary path and can silently discard valid operator-entered data.

2. Edit Save & Complete duplicates and weakens ordinary edit validation.

The edit-completion path reconstructs its own patch rather than invoking the ordinary edit-save function.

Confirmed differences include:

DOF validation is omitted;
invalid time results are not reliably rejected;
POB and T&G range validation is absent.

ZZZZ and formation checks are retained, but the path is still materially weaker than ordinary Save.

3. Booking Reset changes the CUIW charging state.

The initial Booking form and Reset path do not restore the same defaults. Reset checks both Parking Required and Has CUIW, whereas the initial form leaves Has CUIW unchecked.

Because CUIW affects the calculated charge, Reset can remove the GBP 25 waiver charge without a deliberate operator decision.

4. Cancellation writes its recovery record before proving cancellation succeeded.

The workflow appends the cancelled-sortie snapshot before confirming that the movement status update, formation cascade and booking synchronization succeeded.

Possible inconsistent outcomes include:

a cancellation-log entry exists while the movement remains active;
the parent movement is cancelled but formation elements are not;
booking status changes while cancellation fails;
the UI reports success despite a durable-write failure.

5. Soft deletion writes its recovery snapshot before proving deletion succeeded.

The workflow appends the Deleted Strips snapshot, may clear the booking link, then calls the movement deletion routine without checking each result.

Possible inconsistent outcomes include:

the movement exists in both active and deleted stores;
the booking link is cleared although deletion fails;
the movement is deleted but no recoverable snapshot persists;
the UI reports recoverable deletion when recovery data was not stored.

6. Formation-element actual-time validation can silently erase valid data.

Invalid per-element DEP or ARR actual times are converted to empty strings and the update proceeds. The operator receives no validation error.

Entering an invalid value can therefore clear an existing valid actual time.

Medium-high finding

7. Booking Profile import mutates the in-memory profile collection before persistence is confirmed.

The imported profile set replaces the current in-memory collection before the storage write completes. Storage failures are suppressed and the import can still report success.

Medium-severity findings

8. Movement duplication omits ZZZZ companion-description fields.

The duplicate form does not preserve departure description, arrival description or aircraft-type description companion data. A source movement using ZZZZ can therefore be duplicated with incomplete location information.

9. Movement duplication permits a flight-type change without reconciling type-dependent fields.

The duplicate workflow allows DEP, ARR, LOC or OVR to be changed while retaining source EGOW code, unit code, captain, route and clearance data. Those values may no longer be appropriate for the new movement type.

10. Booking Profile autofill directly overwrites selected fields.

MTOW unit and CUIW are assigned directly from the profile rather than using the anti-stomp mechanism applied to most text fields. Existing manual input can therefore be overwritten.

11. Calendar Add Event defaults to a 45-minute notification although no notification mechanism was identified.

The form presents notifications as operational behaviour, but the saved value appears to be storage-only.

12. Booking Profile save and delete report success without durable confirmation.

The in-memory collection is mutated before persistence and the UI proceeds as though the save or delete succeeded.

13. Calendar create, update and delete report success without durable confirmation.

Calendar state is mutated in memory and storage errors can be suppressed, allowing the current session to look correct while reload reverts the change.

14. Movement, booking and retrospective submissions lack a reliable submission guard.

Rapid repeated activation can invoke the create path more than once. This creates a duplicate-record risk where handlers are synchronous or persistence is delayed.

15. Formation-element movement counts are insufficiently constrained.

T&G, O/S and FIS values are clamped only to a minimum of zero. Very large values are accepted, decimals are silently truncated and malformed values become zero.

16. Formation elements cannot fully represent ZZZZ locations.

ZZZZ is accepted as a valid four-character AD code, but per-element departure and arrival description companions are unavailable.

17. Admin Weather always reports Saved.

The configuration update result is not checked before the Saved status is shown and the live Weather tab is updated.

18. METAR Copy persists the previous observation before clipboard success is known.

The observation is saved first. Clipboard fallback does not verify the return value of execCommand, yet Copied can still be shown.

19. Admin configuration loading uses logical-OR defaults where zero may be valid.

Several values use configuredValue || defaultValue. Valid zero values can therefore be replaced by defaults when the form opens.

20. Changing WTC system can silently reset the alert threshold.

If the previous threshold is not valid for the newly selected WTC system, rebuilding the options leaves the threshold at Off without explicitly warning the operator.

21. A full backup restore leaves the application in a partially refreshed state.

Several views are rerendered immediately, but the operator is then told to reload so all restored subsystems and configuration values are applied. Until reload, the application may contain a mixture of restored storage and stale module-level state.

Low-medium finding

22. METAR Reset does not clear the saved previous observation.

Reset clears the current form but Recall Previous can immediately restore the last copied observation. This may be intended, but the UI does not make the distinction explicit.

Confirmed-sound areas

The ordinary new-movement path has substantial centralized validation.
The ordinary edit path validates ZZZZ companion fields and formation data.
Retrospective entry has strong movement-type-specific timing, range and ICAO validation.
Retrospective AD/FIS defaults and PIC/attribution autofill are non-destructive.
Duplicate movements correctly clear actual times, outcomes and completed state.
Duplicate formation elements are reset to PLANNED with actual values removed.
Most Booking Profile text-field autofill uses anti-stomp behaviour.
The METAR Builder separates blocking errors from warnings and disables Copy while blocking errors exist.
Backup restore preflight uses a shared inspection path, blocks unrecognised/non-restorable files, displays record counts and catches import errors.

4. Persistence-result and partial-operation audit

Completed 28 July 2026.

This audit examined whether operational and administrative mutations can distinguish durable success from in-memory success, whether linked multi-record operations are atomic, and whether corruption and storage failures preserve recoverable data.

Severity summary:

Critical: 2
High: 14
Medium-high: 10
Medium: 8
Low-medium: 3
Total: 37

Critical findings

1. Legacy movement migration can permanently delete the only durable dataset.

V1 and V2 migration removes the old storage key before the replacement V3 dataset is confirmed as durably written. A failed V3 write can leave the migrated movements only in memory, so reload or closure permanently loses them.

2. Booking creation and linked-strip creation are not one atomic operation.

The workflow separately writes the booking, movement strip and optional Booking Profile, checks none of the persistence results and provides no rollback. It can leave a booking without a strip, a strip pointing to a missing booking, or a success message after partial or total failure.

High-severity findings

3. The shared persistence wrapper has no reliable success contract.

writeRaw(), writeJSON() and remove() do not return structured results. Storage-unavailable writes may silently do nothing, so callers cannot distinguish durable success from failure or non-operation.

4. Movement CRUD mutates memory first and returns success regardless of durable outcome.

Movement creation, update and deletion change the live collection before saving. The save routine suppresses failures while callers still receive success-shaped values.

5. Booking CRUD has the same false-success behaviour.

Booking creation, update and deletion mutate memory first, suppress persistence failures and may still append audit events.

6. Full backup restore is non-transactional.

Restore writes datasets directly one key at a time with no pre-restore snapshot, staging, rollback, commit marker, write verification or post-restore integrity validation.

7. Full restore overlays data rather than faithfully restoring the backed-up state.

Null or absent backup datasets do not remove current local datasets, and local dated generic-overflight keys absent from the backup remain. Restoring into a populated installation therefore creates a hybrid state.

8. Restore can report keys as restored when no write occurred.

Keys are added to restoredKeys immediately after an unchecked write call. Silent storage unavailability can therefore produce a success result and restored-key count without durable writes.

9. Legacy backup restore can report success after memory-only replacement.

Legacy restore replaces the live movement array, calls the suppressed-error save routine and returns success even when the restored dataset was not persisted.

10. Booking deletion is a non-transactional destructive multi-record operation.

Linked strips may be cancelled or unlinked and the booking then deleted through independent unchecked writes. Partial failure can leave contradictory booking and movement states.

11. New booking and strip relationships are knowingly left incomplete.

The movement receives bookingId, but the booking is not immediately assigned linkedStripId. Startup reconciliation is used to complete a normal creation operation.

12. Booking Profile import can partially mutate live state and still fail.

Entries are merged into the live profile collection before the complete import and persistence succeed. Processing failure leaves earlier changes in memory, while persistence failure can still return success.

13. Corrupt VKB override data can be overwritten by the next edit.

Malformed override data is read as an empty override set. A later edit can then overwrite the raw store and destroy all prior local reference-data changes.

14. Hours Log corruption can be overwritten as an empty history.

A failed Hours Log read returns an empty object. Saving one later date rewrites the entire dataset from that empty state.

15. Audit-log corruption is silently replaced by a new empty ledger.

Malformed or unexpected audit data is treated as an empty log. The next audit append overwrites the original history.

16. Cancelled-sortie and Deleted Strips corruption is automatically destroyed.

Both recovery stores reset malformed or wrongly shaped data to an empty array, destroying the raw value and all potentially recoverable history.

Medium-high findings

17. Storage-unavailable mode is treated as an empty working installation.

Flite can initialise empty in-memory datasets and continue accepting operational input even though its sole persistence layer is unavailable.

18. Configuration changes cannot report durable success.

Configuration is changed in memory and saved through a suppressed-error path, so Admin forms cannot know whether settings persisted.

19. Formation-element updates and status cascades return memory success.

Formation elements, WTC values, metadata and change logs are mutated before persistence, with no durable result.

20. Booking audit history can contradict the booking dataset.

Audit events may be written after a failed primary booking write.

21. Movement audit history can contradict the movement dataset.

Movement audit events may similarly persist even when the primary movement mutation did not.

22. Booking status synchronisation is fire-and-forget.

Movement completion or cancellation patches the linked booking without proving that the booking status was durably updated.

23. Startup reconciliation claims repairs without verifying persistence.

Repair counters are incremented after in-memory mutation calls and can report success even when the repairs will disappear on reload.

24. VKB mutation audit is written before the primary override.

The audit ledger can record a VKB change that never became operationally effective.

25. Generic-overflight counters return calculated values without persistence confirmation.

Increment and decrement return the arithmetic result even when the write did not occur.

26. Recovery-store appends do not prove that recovery data was written.

Cancellation and deletion workflows can continue despite the corresponding recovery snapshot not being durably stored.

Medium-severity findings

27. Calendar create, update and delete report success without durable confirmation.

Calendar state changes in memory first and save failures are suppressed.

28. Booking Profile save and delete report success without durable confirmation.

Profile mutations alter the live collection before storage and the UI proceeds as though persistence succeeded.

29. saveBookings() can replace the store with unchecked caller data.

It accepts and assigns arbitrary caller data without validation, cloning or a persistence result.

30. Store getters expose mutable internal arrays and objects.

Booking and Calendar callers can mutate live state without persistence, timestamps, audit events or validation.

31. Generic-overflight corruption can become NaN.

Malformed stored text is parsed without validation and can propagate through arithmetic into a persisted "NaN" value.

32. Recovery-store purges report removal without durable confirmation.

Deleted-strip expiry purge can return a positive count despite no durable change.

33. Diagnostic clear can report success when no clear occurred.

Silent storage unavailability allows the clear function to return true without writing the empty log.

34. Diagnostic recording can claim persistence when nothing was stored.

The API may return a newly created diagnostic entry despite silent storage unavailability.

Low-medium findings

35. METAR state migration is not persisted until a later Copy.

Legacy saved-state fields are migrated in memory on recall but are not immediately rewritten.

36. Audit validation is advisory only.

Malformed audit events are reported to the console but can still enter the canonical ledger.

37. Export helpers classify unexpected native responses as saved.

Any non-cancelled native result is treated as success rather than accepting only an explicit known saved result.

Systemic conclusions

Memory state and durable state are not distinguished.

Across movements, bookings, Calendar, profiles, configuration and counters, a returned object usually proves only that memory changed, while the UI interprets it as durable persistence.

Multi-record operations have no transaction boundary.

Affected workflows include booking plus strip creation, booking deletion plus strip changes, cancellation, movement deletion, backup restore and VKB audit-plus-override operations.

Corruption handling is inconsistent and often destructive.

Operational and recovery stores need explicit absent, ok, corrupt, unsupported and storage-unavailable states. Mutations should be blocked while a dataset is unsafe unless the operator explicitly exports and resets it.

Audit and recovery records are not causally tied to primary mutations.

History or recovery records may be written before the primary mutation, after a failed mutation, or omitted while the primary operation continues.

Required remediation direction

1. Replace the storage wrapper with explicit result objects and read/write verification.
2. Introduce explicit dataset states for unavailable, corrupt and unsupported storage.
3. Block operational mutation when the primary store is unsafe.
4. Stage domain changes and commit live memory only after durable success.
5. Add transaction, rollback or compensating handling for linked operations.
6. Preserve corrupt raw data rather than automatically overwriting it.
7. Make full restore atomic and define it as replacement or merge; current wording implies replacement.
8. Tie audit and recovery records to confirmed primary-operation outcomes.
9. Add failure-injection tests for every mutation and restore stage.
10. Make UI acknowledgements distinguish durable success, partial success, failure and fallback.

Confirmed-sound controls

Full-backup structures are validated before restore begins.
Unsupported future backup formats are blocked.
Generic-overflight restore keys use a strict allow-list and value validator.
Movement and booking persistence failures are generally recorded diagnostically.
Audit failures are isolated from already-completed operational actions.
Diagnostics are bounded and deduplicated.
Booking updates avoid no-op writes.
Cancelled-sortie append guards against duplicate unreinstated entries.
Exported backup metadata uses the same inspection path as restore.
Native export failures are recorded diagnostically.
5. Date, time and timezone audit

Completed 30 July 2026.

This audit traced date/time behaviour across the operational movement model, movement creation and lifecycle actions, Calendar, History, reporting and exports, and the installed Tauri updater/runtime.

Severity summary:

High: 9
Medium-high: 8
Medium: 7
Total: 24

No Critical finding was assigned. The audit confirmed defects capable of materially misrepresenting operational dates and times, but did not confirm irreversible data loss caused solely by the date/time subsystem.

High-severity findings

1. Operational local/UTC conversion uses a current fixed offset instead of the offset applicable to the movement date.

The conversion model does not resolve Europe/London rules for the entered operational date. A stored or configured offset is applied as though it were valid for every date. Historical and future movements on the opposite side of a BST boundary can therefore be converted by one hour incorrectly.

The same structural weakness means that zero or plus one can be treated as the operational timezone rather than as an explicitly fixed offset, while the UI can imply London civil time.

2. Repeated and missing civil times at BST transitions are not represented safely.

The model cannot distinguish the two occurrences of a local clock time during the repeated hour when BST ends. It also does not identify nonexistent civil times during the spring transition.

A local clock value can therefore resolve to the wrong instant or be accepted even though it did not exist.

3. The movement model cannot represent start and end instants on different dates.

Movements store one DOF plus date-less HH:MM fields. There is no explicit end date or day offset for ATD, ATA, ETD, ETA or overflight entry and leaving times.

A movement from 23:50 to 00:20 cannot be reconstructed deterministically. This affects ordinary, retrospective, duplicated and completed movements and all downstream History, Calendar, reporting and export logic.

4. Save & Complete fabricates actual times from planned times or the current clock.

New and Edit Save & Complete can persist missing actual values using planned values and can fall back to the current clock.

This changes an estimate into an asserted actual operational event without an operator-entered or observed actual time. A historical DOF can also be combined with today's clock time.

5. Booking local times are copied directly into UTC movement fields.

Booking records explicitly store local planned times. Linked movement creation and subsequent Booking edits copy the same digits into movement planned-time fields that are otherwise treated as UTC.

During BST, a Booking for 11:00 local can therefore create or overwrite a strip as 11:00 UTC rather than 10:00 UTC.

6. Primary Calendar month, week and year date keys shift backwards during BST.

Calendar cells are constructed at browser-local midnight and then converted through toISOString(). During BST, local midnight is the previous UTC date.

A visible 1 July cell can therefore query 30 June. Week views can be displaced by one day, and year-view counts can assign records to the wrong date.

7. Multi-day and recurring Calendar events are exposed but not rendered.

Calendar events persist end dates, recurrence and repeat-end dates, but retrieval checks only the original start date.

Multi-day events appear only on day one, and daily, weekly, monthly and annual events do not generate subsequent occurrences. Notifications are also offered and stored without an identified notification mechanism.

8. Monthly Return midnight allocation fabricates event distribution and is incomplete by movement type.

Only LOC movements are detected as crossing midnight. DEP, ARR and OVR movements remain assigned to one DOF.

For a midnight-crossing LOC, T&G and overshoot counts are split approximately in half and all FIS is assigned to the departure date. The data model contains no event timestamps supporting that allocation, so the report presents an inferred distribution as factual.

9. Workstation-clock corrections can leave a movement incorrectly activated.

Startup, interval, focus and visibility reconciliation recover missed forward activation transitions.

However, when an incorrect workstation clock is later corrected backwards, an automatically activated movement is not returned to PLANNED when it falls outside the activation window. A transient clock error can therefore create a lasting lifecycle error.

Medium-high findings

10. Autoactivation combines governing HH:MM values with movement DOF and relies on the single-date model.

Activation checks attach a date-less governing time to DOF. Overnight or incorrectly retained DOF values can therefore activate on the wrong operational date.

The stale-age calculation also derives age from DOF midnight rather than from a complete movement instant.

11. Duration inference treats equal times as 24 hours and reversed clock values as overnight.

Without an explicit date boundary, equal start and end times can be interpreted as a full day, while any end time earlier than the start can be interpreted as next-day.

These are guesses that can silently convert corrections or malformed input into plausible but false durations.

12. Completed formations can contain elements with no actual times.

Completion cascades status to formation elements without enforcing corresponding actual-time invariants for each element.

A parent can contain actual times while one or more elements are marked COMPLETED with blank actual values.

13. Duplication, reinstatement and Deleted Strip restoration wrap clock time without advancing DOF.

Offset calculations produce an HH:MM value modulo 24 hours. They do not carry a day offset or update DOF when crossing midnight.

Reinstating or restoring an old strip can also calculate a current-day planned time while retaining the original historical DOF.

14. Reinstatement uses browser-local time in the UTC movement model.

The reinstatement helper uses browser-local hours and minutes and writes the result directly into movement planned fields.

During BST this can persist a value one hour later than the corresponding UTC operational time. Other workstation timezones can create larger differences.

15. History rolling-period filters interpret UTC movement times as browser-local and use inconsistent event semantics.

Today, 24-hour, 48-hour and 7-day views construct browser-local Date objects from DOF plus operational HH:MM. During BST, the resulting instant is one hour early.

DEP is filtered by departure, ARR by arrival, LOC by departure first and OVR by frequency-entry time. One period selector therefore does not represent one common completion or activity window.

16. Monthly Return summary and XLSX detail evidence can disagree at month boundaries.

The official grid can include a generated next-month portion of an overnight LOC.

The XLSX detail sheet contains only source movements whose original DOF belongs to the selected month and writes those movements unsplit. A total can therefore contain activity with no matching detail row.

17. Cancellation reports group by UTC date while the date controls appear local.

Cancellation timestamps are stored as UTC instants, and the report derives the date from the UTC timestamp. Default range values are generated from browser-local dates.

A cancellation at 00:30 BST can therefore be grouped under the previous UTC date and omitted from a filter for the local civil date on which it was performed.

Medium findings

18. Save & Complete time validation is weaker than ordinary Save.

Invalid time-normalisation results are not consistently treated as blocking in New, Edit and LOC Save & Complete paths.

Malformed values can therefore reach completion persistence and fallback logic.

19. Current-day markers and rollover use inconsistent UTC and local definitions.

The primary Calendar, Historic Calendar, Live Board counters, History Today filter and Reports do not use one canonical operational-day definition.

During BST, several UTC-derived Today markers and rollover checks remain on the previous date until 01:00 local, while other views use browser-local dates.

20. Open-session day rollover refreshes only selected views.

The 45-second tick updates counters, activation, Live Board and timeline. It does not automatically rerender Calendar, History, Historic Calendar, Search/Table or Reports.

If Flite remains open across midnight, different views can refer to different current days until an operator action causes rerendering.

21. Calendar event ranges are not validated and extended properties cannot be edited.

Creation does not reject end dates before start dates, repeat-end dates before start, or same-day end times before start.

The edit modal cannot modify end date/time, all-day state, recurrence, notification or event type.

22. Main History CSV ignores visible Historic Strip Board filters.

The Historic Strip Board can be limited by period, selected Calendar date and structured filters, but the primary History CSV exports every completed movement.

The separate History Search/Table export correctly reapplies its own filters.

23. Movement exports omit timezone and day-offset semantics.

CSV and XLSX files contain DOF plus clock fields but do not state whether times are UTC or local, which offset applied, whether an end time belongs to DOF plus one, or whether an actual value was generated from a planned fallback.

The exported data cannot deterministically reconstruct overnight or DST-boundary operations.

24. Administrative timestamps and filenames are insufficiently explicit.

Updater Last checked is generated at the start of an attempt and overwritten for offline and error results, so it does not mean the last successful check.

It is displayed in workstation-local time without an offset label. History export filenames use the UTC date and can contain yesterday's date during the first hour after local midnight in BST. Undated cancellations bypass report date limits instead of being separated as undated.

Confirmed-sound areas

Native updater timestamps are generated as absolute UTC ISO values.
The updater Gregorian leap-year rule is correct.
Update checks do not install automatically.
Startup, focus and visibility reconciliation correctly recover missed forward transitions after closure, sleep or timer throttling.
Lifecycle timestamps such as cancellation, deletion, expiry, reinstatement and retrospective-entry time are generally stored as ISO UTC instants.
Deleted-strip expiry uses elapsed duration rather than civil-day arithmetic.
History Search/Table date ranges use inclusive lexical comparisons of canonical YYYY-MM-DD strings.
The Historic Movement Calendar constructs its date grid consistently using UTC arithmetic and does not suffer the primary Calendar's local-midnight toISOString shift.
Monthly Return row keys and next-date calculation avoid browser-local DST arithmetic.
Cancellation CSV explicitly labels the absolute timestamp as UTC.

Systemic conclusions

Flite has no single canonical operational-time model.

The application alternates between browser-local Date objects, UTC ISO instants, plain YYYY-MM-DD operational keys, date-less HH:MM values, configured fixed offsets and inferred next-day behaviour.

DOF plus HH:MM is insufficient for operational lifecycle events.

The model cannot distinguish same-day from next-day arrival, the two repeated local times at the end of BST, an impossible spring-transition time, an operator-entered actual from a generated fallback, or the date on which each event in a multi-event movement occurred.

User-facing local time and persisted UTC time are not consistently separated.

Booking and reinstatement write local clocks into UTC fields. History reads UTC clocks as local. Calendar converts local date constructors into UTC date keys. These are inverse forms of the same missing conversion boundary.

Required remediation direction

1. Define one canonical operational-timezone policy, expected to be Europe/London with date-aware timezone rules rather than a current fixed offset.
2. Represent operational event instants with an explicit date plus time or absolute instant, while retaining DOF separately where operationally required.
3. Add explicit day-offset or end-date support for movements spanning midnight.
4. Remove planned and current-clock fallbacks from actual-time persistence unless clearly identified as estimated or system-derived metadata.
5. Route Booking and reinstatement local values through the same date-aware conversion boundary as movement forms.
6. Replace local Date plus toISOString Calendar-key generation with direct civil-date string construction.
7. Implement or remove Calendar recurrence, multi-day rendering and notifications.
8. Define a factual reporting policy for midnight activity and do not invent per-event allocation where event timestamps are unavailable.
9. Make History period semantics explicit and consistent across movement types.
10. Include timezone, day-offset and provenance metadata in operational exports.
11. Refresh every date-sensitive view on operational-day rollover and detect significant workstation-clock changes.
12. Add deterministic tests covering GMT/BST boundaries, repeated and missing civil times, month and year rollover, overnight movement types, historical entry and clock correction.

Audit status

The Date, time and timezone audit is complete as an investigation. Its findings require disposition and remediation planning before final regression and release acceptance.
6. Cross-dataset integrity audit

Completed 30 July 2026.

This audit traced identity, references, lifecycle propagation, secondary-store semantics, audit causality, technical diagnostics, backup/restore effects and startup reconciliation across the complete local data model.

Severity summary:

Critical: 1
High: 12
Medium-high: 11
Medium: 8
Low-medium: 1
Total: 33

The 33 findings below are the final consolidated set. Repeated manifestations found in more than one pass have been merged into one finding.

Critical finding

1. Corrupt movement storage can be overwritten with an empty movement dataset during startup.

A movement read or parse failure returns the same null-shaped result used for an absent dataset. Startup then initialises an empty movement array and saves it. Opening the application can therefore destroy the original malformed but potentially recoverable movement payload.

High-severity findings

2. Reusable numeric IDs do not identify one durable entity incarnation.

Movement and booking IDs are generated from the current maximum numeric ID. After deletion or replacement, the highest ID can be reused. Secondary stores and audit retrieval use the numeric ID without a UUID, creation identity or dataset incarnation.

3. Audit history can merge unrelated entities after ID reuse.

Audit event retrieval filters principally by entity domain and numeric ID. A later movement or booking that reuses an old ID can inherit the earlier entity's displayed history.

4. Cancelled Sorties can attach cancellation history to the wrong current movement.

Cancellation records identify the source by reusable movement ID. After deletion, restore, replacement or ID reuse, an old cancellation record can appear to describe a different current movement.

5. Deleted Strips can collide with a later movement using the same ID.

Deleted snapshots retain the old movement ID and can coexist with a new live movement bearing that ID. Restore and operator interpretation cannot distinguish the two entity incarnations reliably.

6. Normal booking creation leaves the reciprocal relationship incomplete.

The created movement receives bookingId, but the booking is not immediately assigned linkedStripId. A standard successful workflow depends on a later startup reconciliation to complete its ordinary relationship.

7. Multiple movements claiming one booking remain operationally live.

Startup reconciliation reports the conflict but does not clear, quarantine or disable the contradictory movement bookingId values. Each movement can continue to synchronise against the same booking.

8. Formation editing can erase element lifecycle state and actual values.

Editing a formation reconstructs its elements as newly planned records. Existing completed, cancelled or active element states and actual times can be lost even when the operator intended only a structural or descriptive edit.

9. Booking deletion with linked-strip cancellation leaves stale movement booking references.

The booking can be deleted while affected movements remain cancelled with bookingId still pointing to the removed booking.

10. Booking-originated strip cancellation bypasses the canonical movement cancellation path.

The booking workflow can directly set movement status to CANCELLED without using the lifecycle path that creates the cancellation snapshot, cascades formation state, synchronises the booking consistently and correlates audit events.

11. Restoring a Deleted Strip preserves a potentially stale booking reference.

The stored movement snapshot can be recreated with its old bookingId even when that booking is missing, reused or now linked to another movement.

12. Legacy movement-only restore leaves every secondary dataset untouched.

Replacing the complete movement collection through a legacy backup does not clear or reconcile bookings, Cancelled Sorties, Deleted Strips, Calendar semantics or audit entity references. The restored movements can therefore collide with the current installation's unrelated secondary records.

13. Full restore can expose a mixed pre-restore and post-restore application state.

Restore writes several datasets but reloads only the movement cache immediately. Bookings, configuration, Calendar, Booking Profiles and VKB can continue using pre-restore memory until application reload, and a mutation in that interval can overwrite restored storage with stale cached data.

Medium-high findings

14. Some deterministic movement-booking repairs require a second startup.

Reconciliation can clear an invalid booking linkedStripId without then assigning the one valid movement claimant during the same run. A second startup is needed to finish a repair that was already deterministically available.

15. Booking-originated cancellation can create no Cancelled Sortie recovery record.

Because it bypasses the canonical cancellation path, a movement can be cancelled without the immutable cancellation snapshot required for later reinstatement and investigation.

16. Reinstatement intentionally leaves the booking lifecycle divergent.

A cancelled movement can be reinstated while the linked booking remains cancelled. The relationship remains attached but the two lifecycle states no longer agree.

17. Multiple Deleted Strip snapshots can remain live for one movement ID.

The recovery store can contain more than one unexpired deletion record for the same reusable movement ID. Restore selection and historical interpretation become ambiguous.

18. Calendar suppression trusts only the movement-side booking pointer.

Movement-derived Calendar entries are hidden where movement.bookingId exists, even when the booking is missing or does not reciprocally link to that movement. One stale pointer can therefore remove the movement from Calendar without a valid booking entry replacing it.

19. One lifecycle operation is not correlated across movement, formation and booking.

Movement cancellation can correlate its parent and formation cascade, but the subsequent booking update receives a separate correlation ID. Completion, editing, creation and reconciliation similarly fragment one causal operation into unrelated audit events.

20. Automatic startup reconciliation is recorded as local-user activity.

Generic audit defaults are used for reconciliation repairs. The ledger therefore attributes system-generated repairs to the operator and does not distinguish detected corruption from deliberate editing.

21. Nested audit changes retain inadequate before/after evidence.

Object and array changes are detected, but compact values such as [object] and [array:N] can be identical before and after. Schedule and formation changes can therefore be recorded without evidence of what actually changed.

22. Diagnostic deduplication can merge distinct failures.

The deduplication key uses type, message and source but ignores severity, stack, context, entity and storage key. Two different dataset failures within the window can collapse into one entry retaining only the first context.

23. Full-backup validation checks top-level dataset shape rather than cross-dataset integrity.

A backup can pass validation while containing duplicate IDs, contradictory movement-booking links, malformed record internals, stale recovery references or audit identity ambiguity.

24. Startup does not detect duplicate movement or booking IDs.

Next-ID calculation uses the maximum value but does not validate uniqueness. Relationship lookups then resolve duplicate IDs by array order.

Medium-severity findings

25. Audit validation is advisory and event IDs are collision-unchecked.

Structurally incomplete events can still be appended. Event and correlation IDs are generated probabilistically or accepted from callers without a uniqueness check.

26. Central audit coverage is incomplete for bulk and secondary mutations.

Bulk booking replacement, configuration changes and some recovery-store operations can alter meaningful persisted state without a corresponding central audit event.

27. The diagnostic report omits stored stack traces and context.

Persistent diagnostic entries retain stack and bounded context, but the principal generated report and Developer display show mainly time, type, message and source. The evidence most useful for identifying the affected dataset or entity is omitted.

28. Bootstrap-stage and reconciliation summaries are session-only.

Detailed startup stages and the consolidated reconciliation result disappear after restart or banner dismissal. There is no durable record of the checks executed, repairs made or conflicts left unresolved.

29. Diagnostic-log corruption is treated as an empty log.

Malformed diagnostic storage returns an empty logical store. The next diagnostic event can overwrite the corrupt payload, removing the evidence of earlier failures.

30. Booking Profile startup does not canonicalise stored keys or report collisions.

Profiles are loaded under literal object keys. Hyphenated, spaced and canonical variants that normalise to the same registration can coexist, leaving some entries hidden or unreachable.

31. Local startup migrations persist changes without migration provenance.

Movement normalisation, booking schedule migration, configuration compatibility and VKB migration can rewrite stored state merely by launching a newer version, without a durable system migration event identifying affected records.

32. Calendar year totals omit movement-derived entries.

Month and week views include movements, but year totals count stored Calendar events and bookings without equivalent movement-derived items, producing inconsistent summaries.

Low-medium finding

33. Standalone Calendar events are semantic records rather than relational records.

Calendar events carry no durable movement or booking entity reference. Their operational relationship is inferred only from human-readable content, so startup cannot validate or reconcile them against primary datasets.

Systemic conclusions

Stable identity is missing.

Numeric IDs are suitable display identifiers but not sufficient durable identity. Every primary entity needs an immutable UUID or incarnation identifier, and all secondary stores and audit events must reference it.

Lifecycle authority is fragmented.

Movements, bookings, formations and recovery stores do not share one canonical lifecycle service. UI-specific paths can bypass cancellation, completion, synchronisation and recovery behaviour.

Integrity checking is too narrow.

Startup checks only movement-booking pointers and planned activation. Duplicate IDs, recovery references, audit identity, Calendar suppression, profile collisions and formation lifecycle invariants are not checked.

Restore is not an integrity boundary.

Full restore can overlay rather than recreate a snapshot, legacy restore replaces only movements, and module caches can remain stale. Restore must be transactional, verified and followed by complete cache reload and integrity validation.

Evidence is not sufficiently causal or durable.

Audit events do not consistently identify the real actor, operation or entity incarnation. Diagnostic and reconciliation summaries do not preserve enough post-restart evidence.

Required remediation direction

1. Add immutable entity UUIDs/incarnation IDs to movements and bookings and propagate them to every reference-bearing secondary store.
2. Retain numeric IDs only as operator-facing sequence numbers.
3. Introduce one canonical lifecycle service for movement, formation and booking changes.
4. Make relationship changes transactional or provide verified compensating rollback.
5. Expand startup integrity into a registry of bounded checks with safe automatic repair only for deterministic cases.
6. Quarantine ambiguous conflicts and unsafe datasets instead of leaving them operationally live.
7. Preserve corrupt raw payloads and block mutation until recovery or explicit reset.
8. Make restore an atomic snapshot operation with pre-restore recovery point, write verification, rollback and complete cache reload.
9. Give audit and diagnostic events operation IDs, entity-incarnation IDs, explicit actor/source identity and useful bounded nested diffs.
10. Persist startup migration and reconciliation summaries.
11. Add failure-injection and contradictory-dataset tests covering every relationship family.

Manual-test requirements

1. Delete the highest movement ID, create another movement and inspect audit, cancellation and deletion histories.
2. Create a booking-linked movement and verify whether both reciprocal pointers exist before restart.
3. Seed two movements claiming one booking and test editing, cancellation and Calendar visibility.
4. Edit a formation containing active, completed and cancelled elements.
5. Delete a booking using each linked-strip option and inspect both directions of the relationship.
6. Cancel a linked strip from the booking workflow and inspect Cancelled Sorties and formation elements.
7. Restore Deleted Strips with missing, reused and conflicting booking IDs.
8. Restore a legacy movement-only backup into a populated installation.
9. Restore a full backup and mutate bookings or configuration before reload.
10. Seed duplicate movement and booking IDs and launch the application.
11. Trigger startup reconciliation and compare actor, source and correlation IDs across resulting events.
12. Edit a booking schedule and same-size formation and inspect before/after audit evidence.
13. Generate same-message diagnostic errors for different datasets within five seconds.
14. Corrupt the movement, cancellation, deletion and diagnostic stores independently and launch.
15. Seed Booking Profiles under multiple keys that normalise to the same registration.
16. Dismiss the reconciliation banner, restart and inspect retained evidence.

Confirmed-sound controls

The ordinary movement and booking relationship repair clears pointers to missing primary records.
A single unambiguous movement claimant can repair a missing booking-side pointer.
Booking update no-ops are generally suppressed.
Canonical movement cancellation correlates parent and formation events.
Canonical movement completion and cancellation synchronise the linked booking.
Cancelled Sorties guards against duplicate unreinstated records in the ordinary canonical path.
Deleted Strip expiry uses elapsed-duration retention.
Booking Profiles copy reusable template data rather than retaining live references to created records.
Global JavaScript errors and unhandled promise rejections are captured persistently when storage functions.
Diagnostic entries are bounded, retained and deduplicated.
Backup preview and import share one inspection path.
Unsupported future backup versions are blocked.
Unknown backup storage keys are not restored.
Startup reconciliation and activation catch-up run before the first operational render.

Audit status

The Cross-dataset integrity audit is complete as an investigation. Its findings require architecture and remediation planning before final regression and release acceptance.

7. Control-to-domain trace audit

Completed 5 August 2026.

This audit traced consequential visible controls through their complete execution path:

visible control
-> event handler
-> validation
-> domain or service mutation
-> persistence
-> audit event
-> diagnostic failure handling
-> UI acknowledgement

Passes completed:

movement creation, editing, duplication, retrospective entry and Create From;
movement lifecycle and status-transition controls;
cancellation, deletion, reinstatement and restore;
Booking, linked-strip and Calendar controls;
Admin, configuration, backup/restore and import/export controls;
cross-path consistency, duplicate activation, stale state, partial failure and recovery.

Severity summary:

Critical: 8
High: 27
Medium-high: 5
Medium: 2
Total: 42

The 42 findings below are the final consolidated set. Repeated manifestations found across multiple passes have been merged.

Critical findings

1. The persistence boundary cannot prove durable success.

The shared storage functions do not provide a result-bearing contract. A write may succeed, throw, be caught and suppressed by a dataset-owning module, or silently do nothing when localStorage is unavailable.

Controls commonly interpret an in-memory mutation or non-null return value as successful persistence.

The operator can therefore receive a success message and see changed state on screen even though the change will disappear after reload or restart.

This affects movements, bookings, configuration, Booking Profiles, Calendar events, recovery stores, diagnostics and legacy restore.

2. Consequential controls directly orchestrate non-transactional multi-store operations.

The UI directly sequences operations such as:

booking creation plus strip creation;
movement completion plus formation cascade plus Booking update;
cancellation plus cancellation-log append plus formation cascade plus Booking update;
deletion plus recovery snapshot plus Booking unlink plus movement removal;
reinstatement plus timing recalculation plus cancellation-log mutation;
restore plus movement insertion plus timing update plus recovery-entry removal;
Booking edits propagated to one or more strips.

There is no transaction, rollback, compensating command or durable incomplete-operation record.

A failure after any intermediate step can leave contradictory datasets with no automated way to identify which step failed.

3. Lifecycle commands are duplicated and do not enforce one set of invariants.

Completion can occur through:

the canonical Complete lifecycle control;
New Save & Complete;
LOC Save & Complete;
Edit Save & Complete;
retrospective completed entry.

Activation can occur through:

creation-time automatic activation;
the Active control;
inline actual-time entry;
startup or timer reconciliation.

Cancellation can occur through:

the movement cancellation control;
Booking cancellation;
Booking deletion with linked-strip cancellation;
direct status mutation.

These pathways apply different validation, timing, formation, Booking, audit and recovery behaviour.

Movement status therefore does not prove that all required lifecycle side effects occurred.

4. Full backup restore is non-atomic and can create a hybrid installation.

Full restore writes datasets sequentially with no staging, rollback or commit marker.

Datasets absent or null in the backup are retained locally rather than cleared. Existing dated generic-overflight keys absent from the backup are also retained.

A restore can therefore combine some restored datasets, some current datasets, old dynamic keys and partially written data if a later write fails.

The operation is described as a restore but behaves partly as an overlay or merge.

5. Restore does not reliably replace running application state.

After full restore, only the movement store is explicitly reinitialised.

Bookings, Calendar events, Booking Profiles and other module-level caches can continue using pre-restore objects. Open modals and drawers can also retain references to entities from before the restore.

Saving one of those stale editors can write old data back into the restored session.

A complete application restart or explicit invalidation of every store and editor is required.

6. Soft-delete restoration can destroy both the movement and its recovery snapshot.

Restoring a Deleted Strip first inserts the movement into live memory, then removes the recovery entry.

The movement insertion can be reported as successful even if it was not durably persisted. The subsequent Deleted Strips write may succeed.

The resulting failure sequence is:

movement inserted only in memory;
Deleted Strips entry durably removed;
application restarts;
restored movement disappears;
recovery snapshot is also gone.

This is a confirmed complete-data-loss pathway.

7. Booking and linked-strip creation are not one verified operation.

Booking creation writes the Booking and movement independently.

The movement receives bookingId, but the Booking is not immediately assigned linkedStripId. Normal successful creation therefore begins with a one-sided relationship and relies on a later startup reconciliation.

Failure can leave:

a Booking without a strip;
a strip referencing a missing Booking;
duplicate Booking and strip pairs after repeated submission;
or a success message after one or both writes were not durable.

8. Flite has no general integrity or recovery boundary.

Startup reconciliation checks mainly Booking-to-movement pointers and planned activation.

It does not validate or repair:

lifecycle status against required actual times;
missing cancellation records;
movement and formation status divergence;
reinstatement-log state;
live movements coexisting with Deleted Strips snapshots;
Booking and movement lifecycle mismatch;
duplicate IDs;
duplicate submissions;
stale Calendar suppression;
partial restore;
stale module caches;
incomplete multi-store commands.

The system cannot distinguish deliberate unusual state from an interrupted or partially failed command.

High-severity findings

9. Save & Complete controls bypass canonical Save validation and mapping.

New, LOC and Edit Save & Complete reconstruct movement data separately rather than invoking the ordinary validated builder and canonical completion command.

Depending on the path, this can:

accept values rejected by ordinary Save;
omit fields;
discard formation or PIC information;
fail to enforce ZZZZ companion fields;
weaken range and time validation;
fabricate actuals from planned values or the current clock;
bypass Booking completion synchronisation.

10. Ordinary edits can report success after failed or partial updates.

Inline and full Edit paths contain unchecked secondary updates for:

timing recalculation;
status changes;
Booking synchronisation;
follow-up field corrections.

Some handlers continue to rerender, close and report success when the primary movement update returned no movement.

Booking synchronisation can also receive a stale or pre-operation object rather than an explicit verified final state.

11. Status transitions are multi-step and incompletely synchronised.

Planned to Active, Active to Planned and Complete contain separate status and timing writes.

Secondary timing writes are generally unchecked. Returning a movement to PLANNED does not synchronise the linked Booking.

Manual completion performs Booking synchronisation and formation cascade, but these are not atomic with the master status change.

12. ACTIVE status has different evidential meaning depending on the control used.

Creation-time automatic activation can set ACTIVE without recording an actual activation time.

Manual activation records an actual time for DEP, LOC and OVR.

Inline actual-time activation directly patches status and bypasses the lifecycle function.

The same ACTIVE status can therefore represent materially different operational evidence.

13. Booking cancellation and deletion bypass canonical movement cancellation.

Booking-driven linked-strip cancellation directly changes movement status to CANCELLED.

It does not reliably:

append a Cancelled Sorties snapshot;
capture a reason;
emit the dedicated cancellation audit action;
cascade formation elements;
use the established cancellation correlation;
preserve the canonical recovery pathway.

A movement can be CANCELLED without the evidence and side effects expected from movement cancellation.

14. Reinstatement and Deleted Strip restoration use browser-local time in UTC movement fields.

Recovery-time calculation uses browser-local hours and minutes and writes the resulting clock value directly into movement planned-time fields.

During BST this can introduce a one-hour error. A workstation in another timezone can introduce a larger error.

The same calculation compares time-of-day values without complete dates and fails across midnight.

15. Recovery can produce PLANNED movements containing stale actual times.

Cancelled-strip reinstatement and restoration of formerly ACTIVE Deleted Strips preserve the snapshot's actual-time fields while changing status to PLANNED.

This can produce movements with PLANNED status, existing actual times and a new planned start time.

The result conflicts with other replanning pathways and can affect sorting, counters, display and later lifecycle actions.

16. Formation reinstatement can revive independently cancelled aircraft.

Reinstatement converts every currently CANCELLED formation element back to PLANNED.

It does not compare current elements with the immutable pre-cancellation snapshot to distinguish elements cancelled by the master cancellation from elements already independently cancelled beforehand.

An aircraft intentionally removed before the master cancellation can therefore be unintentionally reinstated.

17. Cancellation and deletion logs can claim recovery records that were not stored.

Cancelled-sortie and Deleted Strips append functions do not return durable outcomes.

Subsequent audit events can record the intended recovery-entry ID even if the recovery store was not written.

The ledger can therefore state that a cancellation or deletion is recoverable when no durable recovery record exists.

18. Cancellation reasons can be rewritten without audit history.

Cancellation reason and free-text note edits overwrite mutable fields in the Cancelled Sorties store.

The previous value, editor, change timestamp and before-and-after diff are not recorded in the central audit ledger.

The immutable movement snapshot does not preserve the original cancellation reason.

19. Booking edits can partially propagate and use contradictory relationship cardinality.

A Booking edit is written first and then propagated to every movement whose bookingId matches.

The system therefore treats Booking-to-movement as one-to-many during editing, while the Booking schema has one linkedStripId and startup reconciliation treats multiple movements claiming one Booking as a conflict.

Partial propagation is not detected or rolled back.

20. Booking local time is copied directly into UTC movement fields.

Booking fields are explicitly represented as local time.

Creation and edit propagation copy the same digits directly into movement planned-time fields that the rest of the movement model treats as UTC.

During BST, a Booking for 14:00 local can create or overwrite a movement as 14:00 UTC instead of 13:00 UTC.

21. LOC Booking creation and editing can collapse ETD and ETA to one time.

For LOC Bookings, the Booking arrival time can be assigned to both depPlanned and arrPlanned.

No canonical duration recalculation follows.

A valid LOC can therefore be created or edited into a zero-duration movement.

22. Booking-created strips use a hardcoded wake-turbulence category.

Booking-created strips are assigned L (ICAO) regardless of the aircraft type or configured WTC system.

This bypasses the normal type-to-WTC resolver and can create incorrect operational wake-turbulence information.

23. Calendar suppression trusts one-sided or stale Booking references.

Calendar movement suppression is based on the presence of movement.bookingId, not on a verified reciprocal link.

A stale pointer can hide a movement even when the Booking is missing.

A cancelled Booking is hidden from Calendar, while an active movement retaining that Booking pointer can also be suppressed, causing neither item to appear.

24. Configuration controls can acknowledge undurable changes.

Configuration updates change live configuration and save through a resultless or suppressed-error persistence path.

The UI can report success while reload restores the previous configuration.

This is operationally significant because configuration controls timing behaviour, automatic activation, WTC and display policy.

25. Calendar controls can acknowledge undurable changes.

Calendar-event creation, editing and deletion mutate the live collection before persistence is confirmed.

The UI can display the changed Calendar and report success even though the event will revert after reload.

26. Booking Profile controls can acknowledge undurable changes.

Booking Profile save, delete and import mutate live profile state before durable persistence is confirmed.

Import can report records as imported when they exist only in memory.

27. Audit events can contradict the durable primary datasets.

Movement and Booking audit events may be appended after primary writes that did not durably persist.

Some operations write audit or recovery evidence before the primary mutation. Others omit correlation across service boundaries.

The audit ledger records mutation attempts and diffs, but it is not a verified transaction journal.

28. Restoring the audit dataset can erase recent audit history.

Full restore writes the audit dataset from the backup.

This can replace:

audit events produced after the backup;
evidence relating to the restore process itself if recorded before the audit key is replaced.

The application has no separate immutable installation-level restore journal or archive of the pre-restore ledger.

29. No concurrency or stale-editor protection exists.

Entities have timestamps but update commands do not require an expected revision or updatedAtUtc.

An editor opened against older data can overwrite newer changes made through:

inline editing;
another modal;
Booking synchronisation;
automatic activation;
another application window;
or a restore.

There is no optimistic-concurrency warning.

30. Consequential commands lack idempotency and duplicate-submission protection.

Creation and destructive handlers do not consistently disable their controls or use an operation token.

Rapid repeated activation can create:

duplicate movements;
duplicate Bookings and strips;
repeated cancellation attempts;
repeated recovery snapshots;
repeated imports or restores.

31. Multiple application windows can lose writes and reuse IDs.

Whole-array datasets and in-memory next-ID counters are not protected by cross-window locking, revision comparison or atomic ID reservation.

Two Flite windows can load the same state, generate the same next ID and overwrite each other's subsequent changes.

This requires packaged-runtime confirmation but follows directly from the current persistence and ID-allocation design.

32. Legacy restore can create widespread cross-dataset conflicts.

Legacy restore replaces movements only and retains every current non-movement dataset.

Existing Bookings, Cancelled Sorties, Deleted Strips, Calendar records and audit references may then point to removed movements or collide with imported movement IDs.

No mandatory post-import integrity scan or reconciliation is performed.

33. Restore success is not verified by readback.

Full restore records keys in restoredKeys immediately after calling the write function.

It does not reread each key, compare stored values, verify counts or prove that every module loaded the restored state.

The returned success result therefore represents attempted writes rather than verified restoration.

34. Correlated audit events do not prove command completeness.

Some lifecycle operations use a shared correlation ID, but the audit model does not declare the complete set of expected steps.

A correlation can contain whichever events were successfully emitted without revealing that a recovery snapshot, Booking update or formation cascade is missing.

A command-level started, completed or incomplete record is required.

35. Status alone is insufficient to establish lifecycle completeness.

A COMPLETED movement may lack required actual times, Booking completion or completed formation elements.

A CANCELLED movement may lack a cancellation record, cancellation reason, Booking cancellation or formation cascade.

An ACTIVE movement may lack an actual activation time.

Lifecycle integrity cannot be validated from status alone.

Medium-high findings

36. Partial outcomes cannot be represented clearly to the operator.

The UI generally collapses a multi-step command into one success or failure toast.

It cannot present a structured result such as:

movement cancelled successfully;
formation cascade completed;
Booking update failed;
recovery action required.

Technical diagnostics are recorded separately and are not connected to the initiating control through a visible operation ID.

37. Startup reconciliation reports attempted repairs as completed repairs.

Reconciliation counters are incremented after mutation functions are called even though those functions cannot prove durable persistence.

The integrity banner can therefore report a repaired relationship that will reappear after restart.

38. Calendar and Profile import and export controls have weaker acknowledgement and audit than full backup export.

Booking Profile export directly triggers a browser download and reports success without a detailed save result.

Profile import is merge-only, has permissive structural validation, no conflict preview, no rollback and no batch audit.

Calendar events also lack central create, edit and delete audit events.

39. Deleted Strips expiry purge is silent and unaudited.

Expired recovery entries are removed on initialisation and rendering.

The final destruction of the retained snapshot is not recorded with movement ID, purge time or reason.

Successful purge persistence is also not verified.

40. Developer diagnostics are not reliable restore-verification evidence.

Some diagnostic record counts inspect envelope keys rather than the contained record arrays.

The panel also combines in-memory and storage-derived values, which may refer to different states after restore.

It cannot currently verify that every restored dataset matches the backup and has been reloaded.

Medium findings

41. Calendar year counts omit eligible movement entries.

Month and week views can show eligible movement events, while year-view item counts include only Bookings and general Calendar events.

A month can therefore show zero items in year view despite containing movements visible in month view.

42. Calendar and Booking editors cannot consistently clear values.

Several edit handlers use newValue or existingValue fallback behaviour.

An intentionally blank value is interpreted as retain the old value, while other fields allow clearing.

This creates inconsistent edit semantics and can leave stale Booking notes, times or movement fields.

Confirmed-sound controls

The audit also confirmed several sound design elements:

ordinary New Movement Save has substantial centralised validation;
full-backup preflight blocks unrecognised, malformed and unsupported future formats before writing;
dynamic generic-overflight restore keys are strictly allowlisted and validated;
backup export distinguishes saved, cancelled, browser-download and fallback results;
backup metadata is generated through the same inspection path used for restore;
canonical manual completion does not substitute planned estimates as actuals;
cancellation applies one correlation ID to the master cancellation and formation cascade;
cancellation preserves already-completed formation elements;
Cancelled Sorties current-state filtering separates reinstated and deleted entries;
Deleted Strip restore rejects expired records and active ID collisions;
Booking reconciliation conservatively refuses to choose among multiple claiming movements;
diagnostic-log clearing is intentionally isolated from operational and audit data.

Systemic conclusions

The UI is acting as the domain-command layer.

Visible handlers directly coordinate validation, lifecycle policy, persistence, related-record updates, audit and acknowledgement.

This has caused the same operational action to acquire different semantics depending on the button used.

In-memory state is treated as durable state.

Most controls acknowledge whatever is visible after mutation and rerender.

Because the render reads the same mutated memory, it is not independent verification of persistence.

Audit correlation is not transaction evidence.

A correlation ID links events that were emitted. It does not prove that every expected command step occurred or persisted.

Status is not sufficient lifecycle evidence.

ACTIVE, COMPLETED and CANCELLED do not consistently imply the corresponding actual times, formation state, Booking state, recovery record or canonical audit event.

Startup repair is too narrow.

Booking-pointer reconciliation cannot compensate for incomplete lifecycle commands, recovery conflicts, hybrid restores, duplicate submissions or stale editor state.

Required remediation direction

Phase 1 - Persistence and degraded-mode boundary

1. Make every physical write return or throw an explicit result.
2. Treat unavailable storage as a blocking failure, not an empty installation.
3. Verify persisted values through readback where operationally practical.
4. Distinguish durable success, failure and degraded persistence in the UI.
5. Block further operational writes after a critical persistence failure until integrity is restored.

Phase 2 - Authoritative domain commands

Introduce one command for each consequential operation, including:

create movement;
edit movement;
activate movement;
return movement to planned;
complete movement;
cancel movement;
create Booking with strip;
edit Booking and linked strip;
delete Booking;
delete movement;
reinstate cancelled movement;
restore Deleted Strip;
restore session.

UI handlers should collect input and display the returned outcome. They should not directly sequence stores.

Phase 3 - Transaction and incomplete-operation handling

For commands affecting more than one dataset:

1. generate one operation ID;
2. record the expected steps;
3. stage or snapshot affected state;
4. perform each step;
5. verify results;
6. roll back or persist an explicit incomplete-operation record;
7. expose retry or repair controls;
8. append one command-level completion or failure event.

Phase 4 - Lifecycle and temporal unification

1. Route every completion path through one completion policy.
2. Route every cancellation path through one cancellation policy.
3. Route every activation path through one activation policy.
4. Define required actual-time, formation, Booking and audit invariants for each status.
5. Route Booking and recovery local-time values through the canonical date-aware UTC conversion boundary.
6. Remove zero-duration LOC creation and uncontrolled planned-to-actual substitution.

Phase 5 - Identity, concurrency and idempotency

1. Replace reusable numeric-only identity with stable entity-incarnation IDs.
2. Add entity revisions or expected-update timestamps.
3. Reject stale saves with an operator-visible conflict.
4. Add command idempotency tokens.
5. Prevent duplicate activation of submit and destructive controls.
6. Either prevent multiple operational windows or add cross-window locking and storage-event reconciliation.

Phase 6 - Integrity scanning and recovery

Create a general invariant scanner covering:

unique identities;
Booking pointer reciprocity;
Booking and movement lifecycle compatibility;
movement and formation lifecycle compatibility;
cancellation-record requirements;
Deleted Strips coexistence and restore state;
PLANNED records carrying disallowed actuals;
Calendar suppression references;
dataset schema and parse state;
incomplete command records;
post-restore counts and cache state.

Expose unresolved issues in an operator-facing recovery console rather than only in developer diagnostics.

Mandatory manual-test requirements

The following runtime tests must be completed after remediation:

1. unavailable localStorage and quota-exceeded writes;
2. failure at every step of cancellation, deletion, reinstatement and restore;
3. duplicate clicks on movement and Booking submission;
4. stale modal save after inline edit or automatic activation;
5. Booking cancellation of formations;
6. reinstatement during BST and across midnight;
7. preservation of independently cancelled formation elements;
8. restoration where the primary write fails but recovery-entry removal succeeds;
9. restore interruption after each dataset write;
10. restore into a populated installation with absent optional datasets;
11. complete store reload and restart verification after restore;
12. packaged-Tauri Booking cancellation and deletion confirmation behaviour;
13. two-window creation and whole-array overwrite tests;
14. configuration and Profile-import persistence failure;
15. full invariant scan after every injected failure.

Audit status

The Control-to-domain trace audit is complete as an investigation.

Its findings require architectural remediation planning before final regression and release acceptance.

8. Security and data-exposure audit

Completed 6 August 2026.

This audit examined rendering safety, hostile imports, spreadsheet and clipboard boundaries, diagnostic and backup privacy, the Tauri desktop boundary, updater trust, signing-key handling and security abuse cases.

Severity summary for confirmed findings:

Medium-high: 1
Medium: 13
Low-medium: 3
Low: 4
High: 0
Critical: 0
Total: 21

Additional classifications:

Inferred risks: 10
Manual-test requirements: 3
Confirmed-sound controls: 26

Medium-high finding

1. Full backup restore can leave a partially replaced installation after storage failure.

Current-format backups are structurally inspected before writes begin, but accepted datasets are then written sequentially to localStorage without transaction, staging, rollback or complete capacity verification. If a later write exceeds quota or otherwise fails, earlier datasets remain replaced while later datasets remain from the previous installation.

Medium findings

2. Full-session backup validation does not validate nested record integrity.

The inspector checks expected outer objects and arrays but does not validate individual movements, bookings, profiles, Calendar events, cancellation records, deleted snapshots, audit events or nested formation structures.

3. Legacy movement backups accept arbitrary movement objects.

Bare arrays, versioned movement envelopes and legacy backup envelopes are accepted without movement-level field validation, duplicate-ID checks, field allowlisting or nested-formation validation.

4. Booking Profile import has no effective record schema.

Any object-valued entry is merged into the live profile collection. Unknown fields, nested values, invalid types and conflicting normalised registrations are not adequately controlled.

5. Imported file size, record count, text length and nesting depth are unbounded.

FileReader and JSON.parse receive the complete selected file. Dataset and field limits are not applied before parsing, persistence or later rendering.

6. Movement CSV export permits spreadsheet-formula injection.

Operator or imported values beginning with formula markers are CSV-quoted for delimiters but are not neutralised for Excel interpretation.

7. Cancellation CSV export permits spreadsheet-formula injection.

Cancellation reason text, callsign, registration, aircraft type, captain and aerodrome values can become active spreadsheet formulas when the CSV is opened.

8. Full-session backups contain personal and operational data in plaintext.

Backups include movements, bookings, Booking Profiles, Calendar events, cancelled sorties, deleted snapshots, configuration, VKB overrides, hours and the operational audit ledger. The JSON can be read with an ordinary text editor.

9. The operational audit ledger is unbounded.

Every audit append reads, extends, serialises and rewrites the complete event array. No event-count, byte, age, archival or segmentation boundary is enforced.

10. Audit scalar values have no length or sensitivity limit.

Objects and arrays are compacted, but scalar strings pass through unchanged and can preserve long remarks, reasons, routes, corrections and personal values indefinitely.

11. Corrupt operational audit storage is silently treated as an empty ledger.

Malformed audit JSON returns an empty event set. A later append can overwrite the corrupt raw evidence with a new ledger without an operator-facing integrity warning.

12. Native save commands accept unbounded renderer payloads.

Text content and Base64 workbook content are passed through Tauri IPC without maximum size. The binary path holds the Base64 representation and decoded bytes in memory.

13. The repository does not ignore common credential and private-key patterns.

The current .gitignore does not exclude .env files, private-key extensions or common certificate containers, increasing accidental-commit risk.

14. Production signing can occur from a dirty working tree.

The internal build script normally blocks a dirty tree but permits bypass through -AllowDirty while production signing credentials may be loaded.

Low-medium findings

15. Native text-save failure automatically falls back to browser Downloads.

Sensitive movement or cancellation exports can be written to an unintended default location after native save failure without prior operator consent.

16. Diagnostic logs and reports can expose local paths and workstation details.

Persisted errors may contain source paths, usernames embedded in paths, installation directories, native command details and stack traces.

17. Signing-password unmanaged memory is not explicitly zeroed.

The PowerShell workflow converts SecureString to a BSTR and managed plaintext value but does not explicitly zero and free the unmanaged BSTR immediately after conversion.

Low findings

18. CSV safety logic is duplicated and inconsistent.

Movement and cancellation exports use separate quoting, BOM and line-ending policies, increasing the risk of divergent security fixes.

19. METAR clipboard fallback can falsely report success.

The return value from document.execCommand('copy') is ignored before the interface reports Copied.

20. Application restart is directly callable from renderer code.

The native restart command does not require a completed update state or native confirmation.

21. Update checking contacts GitHub automatically by default.

Unless disabled in local settings, Flite checks the configured GitHub release endpoint shortly after application startup.

Inferred risks

1. The large, decentralised innerHTML rendering surface remains omission-prone despite generally sound encoding in inspected paths.
2. Pilot datalist attribute encoding is inconsistent with the stronger shared HTML encoders.
3. Inline-edit restoration can preserve markup that entered the cell through an earlier unsafe pathway.
4. Full-session exports lack a concise pre-export data-scope preview.
5. Diagnostic context is size-bounded but not restricted by a permitted-field schema.
6. Audit core validation is advisory and malformed events can still be appended.
7. Global Tauri bindings increase the consequence of a future renderer compromise.
8. Native save filters do not independently enforce the final extension.
9. Native updater errors can expose low-level path or implementation details.
10. Release provenance appears dependent on a manual local build and publication process.

Manual-test requirements

1. Run stored-data injection tests across every movement, formation, Booking, Profile, Calendar, cancellation, VKB and restored-data rendering surface.
2. Test prototype-related keys and hostile nested structures through every supported import format.
3. Verify History CSV and packaged SheetJS behaviour with formula-leading values in the supported Microsoft Excel environment.

Confirmed-sound controls

Principal movement, Booking, Calendar, toast and updater rendering paths generally encode dynamic values or use textContent.
No directly exploitable stored script-injection route was confirmed.
Current-format backup restore uses a fixed storage-key allowlist.
Unknown storage keys are ignored.
Dynamic generic-overflight keys use strict key and integer-value validation.
Malformed present datasets block current-format restore before the first write.
Unsupported future backup formats are blocked.
The XLSX exporter supplies operator values as typed string data rather than explicit formula objects.
Browser Blob URLs are revoked after export.
Suggested export filenames are derived from fixed prefixes and internal dates.
METAR clipboard content is copied from textContent.
Technical diagnostics are capped at 100 events and apply message, stack, source and context limits.
Rapid identical diagnostic events are deduplicated.
Diagnostic-recording failure is isolated from operational actions.
Technical diagnostics are excluded from normal session backups.
Diagnostic clearing is deliberate and does not remove operational audit records.
The Tauri capability grants only core defaults and Save dialog permission.
No shell, broad filesystem, process or generic HTTP capability was identified.
The packaged Content Security Policy blocks remote scripts, inline scripts, eval, objects and browser-network destinations.
Native save commands require an operator-selected path.
The updater endpoint and public verification key are fixed in packaged configuration.
Update installation requires a prior successful native check.
Updater release notes are rendered as plain text.
No committed updater private key, password, API key or access token was identified.
The signing key defaults to a user-local path outside the repository.
Signing credentials set by the development script are removed in a finally block.

Systemic conclusion

Flite’s desktop privilege boundary is narrow and no direct remote-code-execution or committed-secret defect was confirmed. Its primary security risks occur at data and lifecycle boundaries rather than through broad native privilege.

Hostile or malformed imports can enter insufficiently validated operational structures. A structurally accepted restore can fail partway and create a hybrid installation. Inert operator strings can become spreadsheet formulas after CSV export. Full backups carry readable personal and operational history. The audit ledger can grow indefinitely or silently lose corrupt evidence. Release signing is protected from repository disclosure but remains dependent on local process discipline.

Required remediation

Introduce bounded record-level validators for every imported dataset.
Make restore staged, capacity-checked, transactional and reversible.
Add a shared spreadsheet-safe CSV encoder.
Require explicit consent before export fallback to Downloads.
Present backup and row-level export sensitivity before file creation.
Protect and surface corrupt audit evidence.
Define operational audit retention and scalar-value limits.
Redact workstation paths and personal data from diagnostic output.
Limit Tauri IPC payload sizes and restart authority.
Disable global Tauri bindings unless specifically required.
Expand secret-file exclusions and add secret scanning.
Separate development and production signing.
Block production signing from dirty source trees.
Record commit, hashes, signer and metadata provenance for each release.
Complete the documented hostile-import, spreadsheet, diagnostic, Tauri, updater and signing manual tests.
7. Accessibility and keyboard-operation audit

Completed 7 August 2026.

This audit examined the static accessibility and keyboard-operation model of the principal Flite operator interface. It traced semantic structure, accessible naming, modal behaviour, keyboard activation, dropdowns, inline editing, dynamic rendering, focus retention, status announcements, visual focus, colour dependence and static contrast risks.

The audit was source-based. Runtime behaviour that cannot be proved from static evidence remains explicitly classified as an inferred risk or manual-test requirement.

Severity summary:

High: 2
Medium-high: 5
Medium: 13
Low-medium: 3
Critical: 0
Total confirmed findings: 23

High-severity findings

1. Shared button and field styling suppresses visible keyboard focus.

Classification: Confirmed finding.
Severity: High.

The shared .btn and .field rule explicitly sets outline: none. Fields receive only a border-colour change on focus and there is no equivalent application-wide .btn:focus or .btn:focus-visible treatment. Some formation controls independently provide a 2px outline, proving that focus treatment is inconsistent rather than intentionally delegated to the browser.

Impact:

Keyboard focus can move onto consequential controls without a dependable visible indication of the current control. This affects movement creation, modal actions, Booking, Calendar, Reports, METAR, Admin and updater workflows.

Remediation direction:

Introduce one strong application-wide :focus-visible treatment and do not suppress browser focus unless an equal or stronger replacement exists.

2. The shared movement-modal Enter handler can trigger unintended Save actions.

Classification: Confirmed finding.
Severity: High.

The shared modal mechanism installs a document-level keydown handler. An unmodified Enter press triggers the modal's primary save control unless focus is in a textarea or inline-edit input. Other interactive controls are not excluded.

Impact:

Enter intended to operate a select, checkbox, radio, secondary action, lookup or other control can also submit the complete movement form. Because these operations create or alter operational movement records, unintended submission is operationally significant.

Remediation direction:

Remove document-wide Enter-to-save behaviour. Use semantic form submission with an explicit submit event and deliberately define where Enter is permitted to submit.

Medium-high findings

3. Modal focus lifecycle is incomplete.

Classification: Confirmed finding.
Severity: Medium-high.

Custom modal implementations do not consistently move focus into the opened dialog, contain Tab and Shift+Tab within it, make the underlying application inert, remember the opening control or restore focus after closure.

Impact:

Keyboard users can remain in visually obscured background content, tab outside the apparent modal or lose their position after closing it.

Remediation direction:

A shared dialog service should own initial focus, focus containment, background inertness and focus restoration.

4. Booking and Calendar dialogs bypass the shared Escape mechanism.

Classification: Confirmed finding.
Severity: Medium-high.

Edit Booking, Edit Calendar Event, Booking Profile create/edit and Add Calendar Event directly populate modalRoot and bind click handlers rather than using the shared openModal keyboard pathway.

Impact:

Escape behaviour differs according to which Flite subsystem opened the dialog.

Remediation direction:

Route all custom dialogs through the same accessible dialog service.

5. Live Board inline editing cannot be initiated using the keyboard.

Classification: Confirmed finding.
Severity: Medium-high.

Editable cells initiate startInlineEdit through dblclick. The original cells are not keyboard focusable and provide no Enter or Space equivalent.

Once editing has started, the implementation is comparatively strong: Enter commits, Escape cancels, Tab and Shift+Tab commit and advance through an explicit field order, and failed validation prevents advancement.

Impact:

A keyboard-only operator cannot begin editing many principal movement fields.

Remediation direction:

Provide an explicit native Edit control or make each editable location focusable with a defined keyboard activation model.

6. Live Board Edit menus do not implement a complete keyboard menu pattern.

Classification: Confirmed finding.
Severity: Medium-high.

The Edit trigger is a native button and aria-expanded is maintained, but the menu lacks a complete menu-button model. Opening does not move focus to an item, arrow navigation is absent, Escape does not explicitly restore trigger focus, and menu versus ordinary-button semantics are mixed.

Impact:

Users must discover actions through sequential Tab rather than a predictable menu interaction model and can lose focus context when the menu closes.

Remediation direction:

Either implement a complete menu-button pattern or simplify the UI to an ordinary disclosure containing native buttons.

7. The Create From submenu lacks standard keyboard submenu behaviour.

Classification: Confirmed finding.
Severity: Medium-high.

The trigger exposes aria-haspopup and aria-expanded and child options use menuitem roles, but no complete Right Arrow, Left Arrow, Up Arrow, Down Arrow, focus-entry or parent-focus-return model was identified.

Impact:

Keyboard interaction with the submenu is non-standard and difficult to predict.

Remediation direction:

Implement the complete submenu keyboard contract or replace the menu semantics with a simpler disclosure interface.

Medium findings

8. Custom modals do not expose complete dialog semantics.

Classification: Confirmed finding.
Severity: Medium.

Inspected custom dialogs use generic modal containers rather than native dialog elements and do not consistently expose role=dialog, aria-modal, aria-labelledby or equivalent programmatic title relationships.

Impact:

Assistive technology may not identify newly displayed content as a modal dialog or announce its purpose.

9. History sortable table headers are mouse-only.

Classification: Confirmed finding.
Severity: Medium.

Sorting is attached directly to clickable th[data-sort] elements. Those headers are not made keyboard focusable and no Enter or Space activation is supplied.

Impact:

Keyboard operators cannot sort History through these controls.

Remediation direction:

Place a native button in each sortable heading and maintain aria-sort.

10. Top navigation declares tablist semantics without the complete tab keyboard model.

Classification: Confirmed finding.
Severity: Medium.

The primary navigation container declares role=tablist, but the controls do not implement the corresponding complete ARIA tab pattern and initTabs binds ordinary click activation rather than Left/Right/Home/End keyboard navigation.

Impact:

The semantics announced by assistive technology do not match actual keyboard behaviour.

Remediation direction:

Either implement a complete ARIA tabs pattern or remove tab semantics and retain ordinary navigation buttons.

11. Many visible form labels are not programmatically associated with their controls.

Classification: Confirmed finding.
Severity: Medium.

Multiple movement, Booking and METAR labels are visually adjacent to their controls but lack a for/id relationship and do not contain the input. Other checkbox/radio patterns correctly use nested labels, showing inconsistent implementation.

Impact:

Screen readers may announce the field type and value without the visible field purpose.

12. Several filters, searches and table headings lack sufficiently clear accessible names.

Classification: Confirmed finding.
Severity: Medium.

Affected examples include Reports selectors and date controls, VKB global search, blank or incompletely scoped table headings and repeated row actions with insufficient row identity.

Impact:

Users navigating through lists of controls or table structures can lose the context of what a control or column affects.

13. Toast notifications are not exposed as live status messages.

Classification: Confirmed finding.
Severity: Medium.

The shared toast service inserts ordinary visual DOM without role=status, role=alert or aria-live.

Toast messages are used for consequential success, warning, failure, export and fallback outcomes.

Impact:

An assistive-technology user can complete an operation without hearing whether it succeeded or failed.

Remediation direction:

Centralise severity-appropriate live-region semantics inside the toast service.

14. METAR validation and Copy feedback are not announced.

Classification: Confirmed finding.
Severity: Medium.

METAR validation dynamically rewrites textual error, warning and valid-state content and controls whether Copy is enabled, but the validation container is not a live region. Temporary Copy feedback similarly changes visually without status semantics.

Impact:

A screen-reader operator can remain unaware that validation changed, the report became valid or Copy completed.

15. Updater state changes are not announced.

Classification: Confirmed finding.
Severity: Medium.

Updater status is updated through textContent and inline colour changes but no live-region mechanism was identified.

Impact:

An operator initiating a check may receive no accessible indication when an update becomes available, confirmation becomes required or the state changes asynchronously.

16. Calendar rerendering can destroy keyboard focus.

Classification: Confirmed finding.
Severity: Medium.

Month, week and year Calendar views replace the complete grid using innerHTML. No semantic focus capture and restoration mechanism was identified.

Impact:

A focused date, booking, event or month can be destroyed during rendering, causing the operator to lose their keyboard position.

17. Live Board rerender protection applies only to inline editing.

Classification: Confirmed finding.
Severity: Medium.

Flite deliberately defers fdms:data-changed rerenders while an inline-edit session is active. When no inline editor is active, Live Board and timeline rerenders proceed without an equivalent focus-preservation mechanism for row buttons, expanded controls, menus or formation controls.

Impact:

Background data changes can replace the currently focused operational control.

18. Booking Details drawer opens without deliberate focus transfer or announcement.

Classification: Confirmed finding.
Severity: Medium.

Opening the Booking Details drawer rewrites its content, exposes the drawer and binds its actions without moving focus or announcing the newly displayed region.

Impact:

Keyboard and screen-reader users may not know where the new content appeared or how to reach it efficiently.

19. Several static foreground/background combinations fail normal-text contrast targets.

Classification: Confirmed finding.
Severity: Medium.

Declared stylesheet values produce approximately:

white on header #5f858e: 4.01:1;
secondary header text #e5eff1 on #5f858e: 3.43:1;
FIS-total green #8bc990 on white: 1.93:1.

The affected header and FIS content is normal-sized text.

Impact:

Persistent information is unnecessarily difficult to read for operators with reduced contrast sensitivity or in bright environments.

20. Some persistent operational text is extremely small.

Classification: Confirmed finding.
Severity: Medium.

The stylesheet includes navigation statistic labels at 8px, other statistic labels at 9px and several supporting operational labels and controls around 10px.

Impact:

Persistent operational information can be difficult to read at normal scaling and places increased reliance on zoom behaviour.

Low-medium findings

21. Dynamically disabled controls do not consistently explain why they are unavailable.

Classification: Confirmed finding.
Severity: Low-medium.

METAR Copy has useful visible validation and incomplete-report text, but the disabled button is not programmatically associated with that explanation. Other disabled controls commonly rely on grey styling, opacity or cursor changes.

Impact:

Assistive-technology users can encounter an unavailable action without learning the prerequisite needed to enable it.

22. Icon-only modal close controls have weak accessible naming.

Classification: Confirmed finding.
Severity: Low-medium.

Several custom modal headers use a cross glyph with title="Close" but no explicit aria-label.

Impact:

The control can be announced inconsistently by assistive technology.

23. The timeline lacks a sufficiently explicit alternative semantic representation.

Classification: Confirmed finding.
Severity: Low-medium.

The timeline is primarily a visual arrangement of generic elements and does not expose a clear equivalent labelled structure or summary. The Live Board contains overlapping underlying movement information, so this is not a complete denial of the data.

Impact:

The timeline's spatial representation is not independently understandable to non-visual users.

Consolidated inferred risks

1. Timeline PLANNED versus ACTIVE distinction may rely too strongly on opacity.
2. Admin dirty versus clean state may rely too strongly on orange versus green unless accompanying text changes.
3. Booking Profile/VKB autofill can alter fields without announcing which values changed.
4. Modal minimise behaviour may retain unexpected keyboard/focus state.
5. Replacing one modal with another has no explicit dialog-stack focus-return model.
6. Portal menus closed by scroll or resize may strand focus on a hidden or removed item.
7. Repeated row actions such as Edit and Details may be ambiguous in screen-reader button lists because names often omit movement identity.
8. Essential information may exist only in title/hover tooltips.
9. Additional innerHTML-based table renders may destroy focused controls in the same way confirmed for Calendar.
10. Computed contrast in tinted, disabled, hovered and color-mix states may reveal additional packaged-runtime failures.

Confirmed-sound controls and patterns

The audit identified the following controls and behaviours that should be preserved during remediation:

native buttons, inputs and selects are used extensively;
principal native buttons receive browser Enter and Space activation;
shared movement modals support Escape;
shared modal key handlers are deliberately removed on close;
closed row menus use display:none and therefore do not leave hidden descendants in sequential focus;
inline editors move focus into the created input;
inline editors support Enter commit;
inline editors support Escape cancel;
inline editors provide deliberate Tab and Shift+Tab field traversal;
inline traversal skips fields not applicable to the movement;
inline traversal re-resolves the DOM after save-triggered rerender;
failed inline validation prevents automatic navigation to another field;
background Live Board rerenders are deferred while an inline editor is active;
formation controls provide explicit 2px focus outlines;
reconciliation uses role=alert;
reconciliation Details maintains aria-expanded and aria-controls;
METAR provides textual validation rather than relying solely on colour;
METAR Copy is genuinely disabled while blocking errors remain;
updater states use descriptive text rather than colour alone;
exports distinguish saved, cancelled, downloaded, fallback and failed outcomes textually;
top-level active navigation uses font weight, borders and background in addition to colour;
flight-type controls explicitly identify LOC, DEP, ARR and OVR;
formation divergence includes textual DIVERGED and per-status information;
Booking Profile search rerenders the table body rather than destroying the search input;
Reports rendering generally leaves its initiating selectors outside the replaced report-content region.

Manual-test programme

The following packaged-runtime tests remain required because static inspection cannot prove the relevant runtime behaviour.

Keyboard-only operational test:

complete a representative workflow without using a mouse, including movement creation, Live Board editing, activation/completion, Details, Create From, cancellation/deletion/recovery, Booking, Calendar, History sorting/filtering, Reports, METAR, VKB, Admin and updater controls.

Modal keyboard test:

for every custom dialog verify initial focus, visible focus, Tab and Shift+Tab containment, Escape, Cancel, Save, invalid-field focus, background inaccessibility and focus return.

Enter safety test:

press Enter while focused on every significant control type inside movement dialogs and confirm that no unintended Save or duplicate action occurs.

Screen-reader announcement test:

verify dialog opening and title, toast success/warning/error, METAR validation, Copy feedback, updater state, reconciliation alerts, Booking autofill, disabled-action explanations and Booking Details drawer behaviour.

Rerender-focus test:

maintain focus while triggering movement updates, fdms:data-changed, Booking synchronisation, filters, Calendar rerenders, History sorting and other dynamic replacement paths.

Visual runtime test:

measure actual computed contrast and test 200% zoom, 400% zoom, Windows high-contrast/forced-colours mode, disabled-state readability, focus visibility and greyscale/non-colour comprehension.

Systemic conclusion

Flite is not currently fully keyboard-accessible or assistive-technology accessible, but the underlying interface already uses native controls extensively and contains several strong isolated accessibility mechanisms.

The principal architectural problem is inconsistent behaviour at custom-interaction boundaries. Modal systems, inline-edit entry, dropdown menus, rerendered interfaces and dynamic feedback do not share one coherent accessibility layer.

Recommended remediation order

1. Restore strong application-wide visible keyboard focus.
2. Remove the document-level Enter-to-save mechanism.
3. Centralise all custom dialogs behind one accessible modal service.
4. Make inline-edit entry, History sorting and row menus fully keyboard operable.
5. Resolve the top-navigation semantic/keyboard mismatch.
6. Centralise live status and alert announcements.
7. Add semantic focus preservation across rerenders.
8. Complete accessible names, labels and table relationships.
9. Correct confirmed contrast and very-small-text issues.
10. Run the defined packaged-runtime keyboard, screen-reader, zoom, forced-colours and rerender-focus test programme.

Overall disposition

Audit 7 is complete.

The two High-severity findings and the broader Medium-high keyboard/focus defects require disposition before final regression and release acceptance.

8. Performance and scale audit

Completed 7 August 2026.

This audit examined startup, rendering, searching, persistence, retained logs, Calendar behaviour, VKB operations, reporting, exports, backup and restore-preflight behaviour under increasing data volume.

The audit was source-based. No runtime timings are claimed. Where source behaviour proves an algorithmic or architectural scaling problem it is recorded as a confirmed finding; where practical impact depends on runtime size or memory behaviour it remains an inferred risk or benchmark requirement.

Consolidated confirmed-finding severity:

High: 6
Medium-high: 12
Medium: 1
Critical: 0
Total confirmed findings: 19

Additional consolidated inferred risks: 2

High-severity findings

1. Live Board alert generation is algorithmically quadratic.

Classification: Confirmed finding.
Severity: High.

Each Live Board render processes visible/current movements, while per-movement alert generation performs additional searches across the movement collection and relevant conflict candidates.

As current movement volume rises, alert-generation work therefore grows faster than the number of rendered strips.

Impact:

A high-current-workload period can degrade the responsiveness of the principal operational screen even when historical storage remains unchanged.

Remediation direction:

Precompute the data required for cross-movement alerts once per render. Build callsign/conflict indexes before row generation rather than rescanning the movement array independently for each strip.

2. Routine movement mutations synchronously rewrite the complete retained movement store.

Classification: Confirmed finding.
Severity: High.

Movement create, update, delete, formation-element update and several lifecycle operations serialise the complete movements array and synchronously write it through localStorage.

Individual movements also retain their own changeLog arrays, so the serialised object becomes larger both as more movements accumulate and as individual records are repeatedly edited.

Impact:

Changing one current scalar field becomes progressively more expensive as unrelated historical movement data accumulates.

Remediation direction:

Move operational movement persistence toward record-oriented or partitioned storage. At minimum, avoid making the complete lifetime history the persistence unit for every current mutation.

3. The central operational audit ledger has an unbounded lifetime append cost.

Classification: Confirmed finding.
Severity: High.

Every append reads and parses the complete audit-log document, pushes one event, serialises the complete event array and synchronously rewrites the whole ledger.

There is no event-count, age, byte-size, archival or segmentation boundary.

Impact:

The cost of one future audit append grows with every previous audit event. Because movements, bookings, VKB and system actions all feed this ledger, the cost is cross-cutting.

Cumulative work across a long installation trends towards quadratic growth in event count even though each logical operation appends only one small record.

Remediation direction:

Use genuinely append-oriented or segmented persistence for the operational audit stream. Preserve the logical append-only audit model while changing the physical representation.

4. Booking Calendar repeatedly rescans full datasets once for every displayed date.

Classification: Confirmed finding.
Severity: High.

Calendar helpers obtain bookings, movements and Calendar events for one date by filtering the respective complete collection.

Month rendering invokes these date queries repeatedly for every displayed day. Year rendering repeats booking and Calendar-event filtering across roughly 365 dates.

Impact:

Calendar cost grows with both retained dataset size and number of dates rendered.

Remediation direction:

Build date-indexed Maps once per Calendar render and use direct date lookup for each cell. Historic Movement Calendar already demonstrates this more scalable pattern.

5. Historic Strip Board filtering performs a complete history render for every text-input keystroke.

Classification: Confirmed finding.
Severity: High.

The Historic Strip Board search/filter controls trigger immediate rerendering without debounce.

Each rerender filters completed history, applies structured filters, sorts results and reconstructs the corresponding DOM.

Impact:

Typing responsiveness becomes coupled to complete retained movement history.

Remediation direction:

Debounce text input, cache normalised searchable values where appropriate and paginate or otherwise bound the amount of history that must be sorted and rendered interactively.

6. Aircraft Registrations Last Updated resolution can repeatedly parse and scan the complete audit ledger per visible row.

Classification: Confirmed finding.
Severity: High.

When a registration row has no direct override updatedAt value, Last Updated is derived from central audit events for that entity.

The entity-audit lookup reads and parses the complete audit ledger and filters it. Registration Admin can perform this separately for each visible row.

Impact:

A 100-row page can cause approximately 100 complete audit-ledger reads/parses/scans; a 250-row page can approach 250.

The cost grows with both selected page size and lifetime audit history.

Remediation direction:

Build an audit-summary/index Map once and reuse it for all visible rows, or persist a direct last-updated value alongside each effective VKB record.

Medium-high findings

7. Startup booking reconciliation contains a bookings-by-movements relationship scan.

Classification: Confirmed finding.
Severity: Medium-high.

Startup reconciliation examines retained bookings and movements through nested relationship searches.

Impact:

Startup cost grows with the product of both datasets rather than only unresolved links.

Remediation direction:

Build movement-by-booking and booking-by-ID Maps before reconciliation.

8. Startup eagerly and redundantly renders data-heavy views.

Classification: Confirmed finding.
Severity: Medium-high.

Initialisation invokes render work in individual subsystem initialisers and then performs an explicit first-render stage that includes Live Board, Timeline, History, Reports and Calendar.

Some data-heavy views are therefore constructed before the operator opens them, and Live Board/Timeline work can be duplicated.

Impact:

All downstream rendering inefficiencies are amplified during startup.

Remediation direction:

Make initialisers bind controls and initialise lightweight state only. Lazily render non-visible views on first activation and eliminate duplicate first-render paths.

9. Formation presence can force a complete movement-store rewrite during startup.

Classification: Confirmed finding.
Severity: Medium-high.

Startup normalisation treats movements containing formations as requiring persistence after normalisation, which can cause a complete movement-store serialisation even where the retained formation was already effectively valid.

Impact:

A mature installation can perform a large synchronous write simply because historical formations exist.

Remediation direction:

Only mark normalised records dirty when the normalised representation differs from the persisted representation.

10. The 45-second maintenance tick repeats scans and board/timeline reconstruction.

Classification: Confirmed finding.
Severity: Medium-high.

The periodic maintenance cycle updates counters, performs planned-activation reconciliation and conditionally rerenders the Live Board and Timeline.

Impact:

Large current movement sets can create recurring main-thread work even when the operator is not actively editing data.

Remediation direction:

Benchmark the tick separately, avoid rebuilding unchanged UI and maintain indexes/derived state needed by recurring calculations.

11. History Search Table limits DOM size only after complete filtering and sorting.

Classification: Confirmed finding.
Severity: Medium-high.

The table has a 500-row visible-result limit, but the complete retained movement collection is filtered and the full matching result is sorted before the 500-row slice is applied.

Text input also triggers immediate recalculation.

Impact:

The DOM ceiling protects rendering size but does not bound CPU cost.

Remediation direction:

Debounce input and introduce indexed/paginated history querying so the complete result set does not have to be sorted before retrieving one visible page.

12. Cancelled Sorties current-state rendering contains repeated movement-array searches.

Classification: Confirmed finding.
Severity: Medium-high.

Cancellation rendering repeatedly searches the movement collection while counting, filtering and searching cancellation entries.

Impact:

Cancellation-history rendering can approach cancellations-by-movements scaling.

Remediation direction:

Build a movement-by-ID Map once before processing cancellation rows.

13. Cancelled Sorties persistence is an unbounded full-log rewrite.

Classification: Confirmed finding.
Severity: Medium-high.

Appending a cancellation reads and parses the complete retained cancellation log, scans it for an existing active entry, appends the new entry and serialises/writes the complete log.

Unlike Deleted Strips, the cancellation log has no short retention boundary.

Impact:

Cancellation operations become increasingly expensive over installation lifetime.

Remediation direction:

Use record-oriented or append-oriented persistence for cancellation history.

14. Backup generation repeatedly processes the complete persisted installation and creates transient duplication.

Classification: Confirmed finding.
Severity: Medium-high.

Backup generation copies every recognised localStorage value into the backup object as raw strings, then runs the restore-inspection path to parse and validate each embedded JSON dataset for metadata, and finally serialises the entire outer backup for export.

Impact:

Backup generation duration and peak JavaScript memory grow with total installation storage. Multiple representations of the same large movement and audit datasets can coexist.

Remediation direction:

Benchmark both time and peak heap. Longer term, avoid JSON-inside-JSON duplication and consider a native/streamed backup architecture.

15. Successful restore performs the full validation pass twice.

Classification: Confirmed finding.
Severity: Medium-high.

The restore UI parses the selected backup and runs inspectSessionBackup for preflight.

After the operator confirms, importSessionJSON defensively runs inspectSessionBackup over the same parsed backup again before the first write.

Impact:

Large backup datasets are reparsed and revalidated twice before restoration.

Remediation direction:

Preserve pre-write whole-backup validation, but pass an immutable validated representation or validation token into the importer rather than reparsing unchanged material.

16. One-month reporting remains coupled to complete retained movement history.

Classification: Confirmed finding.
Severity: Medium-high.

Official Monthly Return receives the complete movement collection and scans it to locate records relevant to the selected month.

Dashboard and Insights begin by filtering the complete retained movement collection for the selected month.

Impact:

Keeping the selected month constant while adding unrelated years of history increases report cost.

Remediation direction:

Maintain a movement date/month index or partition completed historical movements by operational period.

17. Official Return and Dashboard repeatedly reload and parse the complete Hours Log.

Classification: Confirmed finding.
Severity: Medium-high.

Reporting functions accept an already-loaded hoursMap but then call getHoursForDate for individual dates.

getHoursForDate independently reloads and JSON-parses the complete Hours Log.

Official Return can therefore reparse the lifetime Hours Log once for every day of the selected month. Dashboard similarly repeats parsing for distinct dates represented in its movement set.

Impact:

A small keyed lookup becomes repeated whole-store parsing.

Remediation direction:

Use the supplied hoursMap directly throughout report calculation.

18. Registration autocomplete and registration lookup rebuild the complete effective registration dataset before searching.

Classification: Confirmed finding.
Severity: Medium-high.

VKB already retains vkbData.registrations as the effective post-override registration dataset.

Despite this, searchRegistrations calls getEffectiveRegistrations before each search. getEffectiveRegistrations reconstructs baseline registrations plus overrides.

lookupRegistration and fixed-callsign registration resolution follow the same reconstruction-before-search pattern.

Impact:

Per-keystroke registration autocomplete performs unnecessary full-dataset reconstruction before the actual linear search.

This is particularly relevant with the full production registration dataset.

Remediation direction:

Use vkbData.registrations as the current effective array and rebuild it only when baseline or overrides change. Add registration and fixed-callsign lookup Maps for direct identity searches.

Medium finding

19. Several secondary tables perform complete work despite visible pagination or result limits.

Classification: Confirmed finding.
Severity: Medium.

Examples include:

Aircraft Registrations Admin filtering and sorting the complete result before slicing the current page;
Booking Profile search regenerating the complete matching table on each keystroke;
Cancellation Report rendering all detail rows for the selected range without pagination.

Impact:

Visible pagination or small headline tables can create an impression that processing is bounded when the expensive work has already occurred.

Remediation direction:

Apply pagination/query boundaries before expensive sorting or DOM generation, and debounce unbounded text-driven table rebuilds.

Consolidated inferred risks

1. XLSX export can produce material peak-memory amplification.

Severity: Medium.

The exporter constructs sheet arrays and SheetJS workbook objects, produces a complete Base64 XLSX representation and passes that through Tauri IPC.

The native command receives the Base64 String and decodes a second complete binary buffer before writing the file.

The source behaviour is confirmed; the practical memory consequence must be measured.

2. Years of dated generic-overflight keys and complete CSV materialisation create secondary linear growth.

Severity: Low to low-medium.

Generic-overflight backup handling enumerates one localStorage key per retained operational date.

CSV exporters construct complete row collections, complete line collections and a final complete output string before the save handoff.

These are not currently comparable to the movement/audit persistence defects but belong in stress testing.

Confirmed-sound controls

The audit identified the following existing scale controls that should be preserved:

VKB CSV files are loaded in parallel;
VKB data remains cached in module-level memory after loading;
technical diagnostic persistence is capped at 100 events;
rapid duplicate diagnostic errors are deduplicated;
Deleted Strips has a 24-hour retention boundary;
Live Board global search uses debounce;
History Search Table limits rendered output to 500 rows;
Aircraft Registrations Admin provides 50, 100 and 250 row page sizes;
Aircraft Registrations Admin caches normalised search text;
Aircraft Registrations Admin uses search debounce;
Aircraft Registrations Admin delegates row actions rather than binding separate top-level listeners indefinitely;
Historic Movement Calendar builds a date map once rather than rescanning movements for every displayed date;
Booking Profiles use direct keyed registration lookup for ordinary profile retrieval;
report classification uses a cached registration Map;
booking updates perform no-op detection before persistence and audit;
current-format restore validates all recognised standard datasets before beginning writes;
backup restore uses an explicit standard-key allowlist and strict dynamic generic-overflight-key validation.

Systemic conclusion

Flite's principal performance risk is installation-age coupling.

Today's movement, search, save, report and administrative workload should ideally depend on today's relevant working set. In the current architecture, retained historical movements, bookings, cancellations, hours and especially the central audit ledger increasingly participate in current operations.

The four principal architectural causes are:

1. monolithic synchronous localStorage persistence;
2. missing indexes for repeated relationship and date joins;
3. complete reconstruction rendering;
4. lifetime historical data sharing current operational execution paths.

No Critical finding was confirmed from static source inspection.

The six High findings require either remediation or explicit benchmark evidence that realistic mature installations remain within acceptable operational latency.

Benchmark specification

Three installation profiles should be maintained.

Fresh profile:

250 lifetime movements;
20 current Live movements;
100 bookings;
50 Booking Profiles;
100 Calendar events;
50 cancellation-log entries;
10 currently cancelled movements;
500 audit events;
90 Hours Log dates;
90 generic-overflight date keys.

Mature profile:

10,000 lifetime movements;
100 current Live movements;
2,000 bookings;
1,000 Booking Profiles;
2,000 Calendar events;
2,000 cancellation-log entries;
250 currently cancelled movements;
20,000 audit events;
5 years of Hours Log entries;
approximately 1,825 generic-overflight date keys;
full production registration VKB.

Stress profile:

25,000 lifetime movements;
250 to 500 current Live movements;
5,000 bookings;
5,000 Booking Profiles;
10,000 Calendar events;
10,000 cancellation-log entries;
1,000 currently cancelled movements;
50,000 or more audit events;
10 years of Hours Log entries;
approximately 3,650 generic-overflight date keys;
full production registration VKB.

Required benchmark operations

Measure:

cold startup to usable Live Board;
VKB fetch, parse and effective-data construction;
startup movement migration/normalisation;
booking/movement reconciliation;
first Live Board render;
first Timeline render;
first History, Reports and Calendar render;
Live Board scaling at 10, 25, 50, 100, 250 and 500 current movements;
callsign-conflict-heavy Live Board fixtures;
inline movement save;
movement activation and completion;
ordinary counter updates;
45-second maintenance tick;
Timeline low-overlap and high-overlap fixtures;
Historic Strip Board search keystroke-to-paint;
History Search Table search keystroke-to-paint;
Booking Calendar month render;
Booking Calendar year render;
Booking Profile search;
registration autocomplete;
Aircraft Registrations page navigation at 50, 100 and 250 row sizes;
Aircraft Registrations Last Updated work with small and mature audit ledgers;
Cancellation Report with independent scaling of current cancellations and lifetime cancellation history;
Official Monthly Return with constant selected-month volume and increasing lifetime movement history;
Dashboard and Insights with the same controlled-history fixture;
reporting with one, five and ten years of Hours Log entries;
CSV generation at increasing row counts;
XLSX generation at increasing detail-sheet sizes;
peak JavaScript and native-process memory during XLSX export;
backup generation duration, output size and peak memory;
restore outer JSON parse;
restore first inspectSessionBackup pass;
confirmed restore second inspection pass;
restore storage-write phase;
complete restore preflight-to-completion time;
tab switching between all principal views;
main-thread long-task duration throughout the benchmark.

Indicative mature-installation acceptance budgets

These targets are proposed benchmark criteria, not measurements of current Flite performance.

Ordinary control/input response: 100 ms preferred.
Search/autocomplete response: 150 ms or less.
Tab/view switch: 250 ms or less.
Calendar/month/report render: 500 ms or less.
Movement or Booking save main-thread blocking: 200 ms or less.
45-second maintenance work: 100 ms or less.
Cold startup to usable Live Board: 2.5 seconds or less.
Backup generation before Save dialog: 1 second or less.
Restore preflight: 1 second or less.
Normal-operation main-thread tasks should preferably remain below 50 ms and should not exceed 250 ms.

Benchmark interpretation

Absolute latency alone is insufficient.

The benchmark must also record scaling curves.

A controlled test should hold the selected/current working set constant while increasing unrelated lifetime history. This is necessary to expose installation-age coupling.

Doubling retained data should not unexpectedly quadruple latency. Where a source-confirmed quadratic path exists, nonlinear runtime growth should be treated as validation of the finding even if the smallest fixture still appears responsive.

Recommended remediation order

1. Live Board alert generation and other current-operation hot paths.
2. Calendar and History indexing/debounce.
3. Aircraft Registrations audit-summary handling and effective-registration lookup.
4. Movement and audit persistence architecture.
5. Booking/cancellation/reconciliation relationship indexes.
6. Report Hours Log reuse and date/month indexing.
7. Backup/restore duplicate processing.
8. XLSX and administrative-table memory/render optimisation.

Overall disposition

Audit 8 is complete as a source investigation.

Runtime performance at mature-installation scale remains unverified until the benchmark programme is executed.

The principal release concern is not simply whether Flite performs acceptably on today's development data. It is whether current operational latency remains stable after months or years of retained operational and audit history.
9. Browser-harness versus installed-Tauri parity audit

Completed 7 August 2026.

Authoritative inspected baseline: ec90865 - Complete performance and scale audit.

This audit examined whether Flite's browser harness provides reliable evidence for the behaviour of the installed Tauri application, and whether environment-specific branches accurately report what happened to the operator.

The central trace model was:

Browser implementation
-> Installed-Tauri implementation
-> capability detection
-> failure
-> fallback
-> operator message
-> diagnostics
-> persistence or data consequence

Passes completed:

environment detection and Tauri capability boundary;
Save As, CSV, XLSX and file-export parity;
clipboard, external navigation and browser-API parity;
updater, restart and installed lifecycle behaviour;
persistence, reload, dialogs and runtime behaviour;
consolidation and packaged-runtime parity-test specification.

Severity summary:

Medium-high: 3
Medium: 8
Critical: 0
High: 0
Total confirmed findings: 11

Inferred risks retained after consolidation: 4

Confirmed findings

1. Installed native-version failure can contaminate provenance with browser-only dev identity. - Medium

The browser harness legitimately uses dev as its running application version.

In installed Tauri, however, initAppVersion() also retains that value if the Tauri bridge exists but flite_get_app_version fails. The failure is silently caught.

The retained value is subsequently available to backup metadata and backup/restore audit provenance.

The updater UI handles the same installed-version failure differently by displaying an unknown version, so one abnormal installed runtime can simultaneously describe itself as unknown in one surface and dev in persisted provenance.

Browser acceptance cannot expose this installed-only failure mode.

2. Full JSON backup uses a native Save As command whose filter is hard-coded to CSV. - Medium-high

Admin Backup creates a filename of the form:

vectair-flite-backup-YYYYMMDD-HHMMSS.json

and sends the JSON text through saveTextFileWithDialogOrDownload().

In installed Tauri that invokes save_text_file_with_dialog.

The Rust implementation of that generic text-save command always configures:

CSV (*.csv)

as the file-dialog filter.

The restore workflow is explicitly presented as Restore from JSON and its file input accepts .json.

The browser path therefore proposes and downloads JSON directly, while the installed path presents a native dialog configured as CSV.

Static source proves the filter mismatch. The exact Windows/Tauri extension result must be established by packaged testing. If the native dialog changes or appends the extension, the primary backup can become difficult or impossible to select through the ordinary Restore from JSON picker.

3. Booking Profile JSON export bypasses native Save As in the installed application. - Medium

Booking Profile export creates a Blob, object URL and anchor with a download attribute.

That same browser-style mechanism is used when Flite is installed under Tauri.

It therefore behaves differently from movement/report CSV exports and full backup, which detect the native bridge and use a Save As command.

The resulting toast says only that profiles were exported and does not identify the destination.

The packaged WebView destination and feedback require installed testing.

4. METAR Copy assumes navigator.clipboard exists. - Medium-high

The METAR Copy handler directly calls navigator.clipboard.writeText().

Its fallback is reached only through rejection of the returned Promise.

If navigator.clipboard itself is absent, the property access/call fails synchronously before a Promise exists and the fallback is never reached.

The Booking code elsewhere in the same application explicitly checks for navigator.clipboard before using it, demonstrating that the safer capability pattern already exists.

This creates a direct browser/WebView capability dependency.

The previously identified security-audit defect whereby the execCommand fallback may report Copied without proving success is not duplicated as a new Audit 9 finding.

5. CAA and FAA registry-copy controls report success before clipboard success is known. - Medium

The Booking registry controls call copyToClipboard(searchKey) and immediately show a toast stating that the value was copied.

copyToClipboard() does not return a success result to its caller.

If the Web Clipboard API rejects, a fallback is attempted asynchronously after the success toast has already been displayed.

The fallback also does not reliably report whether document.execCommand('copy') succeeded.

An installed-WebView clipboard restriction can therefore be masked behind feedback identical to a successful browser copy.

6. External registry navigation is unchecked. - Medium

CAA G-INFO and FAA Registry use window.open(url, '_blank').

The return value is ignored.

The inspected Tauri application does not configure a dedicated opener plugin or custom external-navigation command for these actions.

Flite therefore has no application-level acknowledgement of:

popup blocking;
navigation refusal;
whether the destination opened in the system browser;
whether it opened in another WebView;
whether the current application context was affected.

Browser success does not establish the intended installed behaviour.

7. Failed update installation consumes the pending native update but leaves Install apparently retryable. - Medium-high

A successful native update check stores the Tauri Update object in pending_update.

flite_download_and_install_update removes it with pending.take() before attempting download_and_install().

If download or installation fails, that Update object is not restored to pending state.

The renderer then reports Update failed and re-enables Download and install update.

A second Install attempt therefore cannot retry the failed update and instead encounters the native No pending update state until another Check for Updates is performed.

The visible control state does not accurately represent the native state.

8. Updater Last checked and Status do not truthfully represent automatic startup checks. - Medium

The native updater generates lastChecked before performing the update check and returns it for successful, offline and generic-error results.

The renderer persists that timestamp whenever it is present.

During automatic startup checking, up-to-date, offline and generic-error outcomes can leave the visible Status unchanged as Not checked.

The resulting UI can therefore display a recent Last checked timestamp together with Status: Not checked.

The timestamp can mean:

successfully confirmed current;
offline attempt;
generic updater failure.

The field therefore behaves partly as Last attempted rather than reliably meaning Last successfully checked.

This finding consolidates the two closely related Pass 4 observations rather than recording them twice.

9. Installed-only Restart failure is silently swallowed. - Medium

The Restart Flite control invokes flite_restart_app and attaches an empty rejection handler.

A failed native invocation therefore produces no:

toast;
status change;
diagnostic record;
retry guidance.

The operator can activate an installed-only lifecycle control, observe no restart and receive no explanation.

This finding concerns failure acknowledgement and does not duplicate the security audit's separate renderer restart-authority finding.

10. Storage-capacity reporting uses a fixed 5 MB assumption rather than measured runtime capacity. - Medium

getStorageQuota() calculates current LocalStorage usage but assigns a fixed 5 MB quota.

hasEnoughStorageSpace() relies on that estimated quota.

The browser harness and installed WebView use different storage profiles and are not guaranteed to expose identical effective storage capacity.

The application can therefore show identical apparent quota and availability values in both environments without establishing that the same amount can actually be written.

11. Admin Restore has no explicit FileReader read-error path. - Medium

Restore uses a normal HTML file input and FileReader.

Once FileReader.onload occurs, the same inspection, parsing and restore logic is used in browser and installed Flite.

However, the restore workflow defines no FileReader.onerror handler.

An environment-specific file-read failure can therefore stop the workflow before normal malformed-file or restore-preflight feedback is reached.

Inferred risks

A9-R01. Runtime identity is inferred solely from the existence of window.__TAURI__.core.invoke. - Low-medium

An invoke-compatible browser shim could be treated as native, while an abnormal installed runtime in which the global bridge failed to initialise could be treated as browser.

No evidence was found that the supported current environments actually exhibit either condition.

A9-R02. Installed registry links may have unintended navigation semantics. - Medium

Without an explicit Tauri opener path, static source cannot prove whether the packaged application opens CAA/FAA links in the system browser, another WebView, the current context or nowhere.

A9-R03. Failed native update checks can retain a stale pending-update object. - Low-medium

A successful up-to-date result clears pending_update.

Updater creation, network and other failed-check paths do not.

A pending update from an earlier successful check can therefore remain in native state after a later failed check, although the normal manual UI substantially masks that state.

A9-R04. LocalStorage presence is treated as proof of storage availability. - Low-medium

The shared storage boundary tests whether window.localStorage exists.

It does not perform a write/read/remove capability probe.

Existence therefore does not prove that writes are permitted, quota remains or persistence is durable.

No supported packaged-runtime failure was established, so this remains an inferred risk.

Confirmed-sound controls

Browser updater degradation is explicit.

When the native bridge is absent, Version & Updates identifies the environment as browser/dev and browser harness, states that the updater is unavailable outside the installed desktop app, disables Check on launch and hides or disables installed-only controls.

The renderer and Rust command surfaces inspected by this audit agree.

The custom native commands inspected were:

save_text_file_with_dialog;
save_binary_file_with_dialog;
flite_get_app_version;
flite_check_for_update;
flite_download_and_install_update;
flite_restart_app.

CSV generation is structurally shared.

The CSV string is generated in JavaScript before the browser/native save branch. Browser and Tauri therefore do not use separate reporting algorithms for the inspected CSV exports.

Native Save cancellation is explicitly distinguished.

The native save commands return cancelled and callers inspected by the audit do not claim successful saving after cancellation.

Native text-save fallback is visible to the operator.

Where inspected exports fall back from native text saving to browser download, the UI warns that native Save As failed and directs the operator to Downloads.

The security consequences of placing sensitive exports in Downloads were recorded by the earlier security audit and are not duplicated here.

XLSX fallback handling is explicit.

The installed path serialises the workbook to Base64 and invokes the native binary-save command.

If that route fails, the reporting code attempts XLSX.writeFile() as browser fallback.

If the fallback also fails, a critical export diagnostic is recorded and an error result is returned.

Restore parsing and validation are shared frontend behaviour.

Both browser and installed Flite use the same FileReader, backup inspection and import logic once the selected file has been read.

Restore confirmation is application-owned.

Admin destructive confirmation is an HTML dialog rather than browser/native confirm(), avoiding the known packaged ACL difference for plugin-dialog confirm.

Renderer reload and application restart are deliberately separate.

Reload App uses location.reload().

Restart Flite uses the installed-only native restart command.

Updater install confirmation deliberately avoids an unsupported native dialog.

The install action uses a two-click inline confirmation with a 30-second arming period because the packaged application's ACL does not grant the native confirm route.

Windows updater teardown has previously been validated.

The repository records an end-to-end Windows NSIS update from 0.9.0 to 0.9.1, including application close/relaunch and persistence survival.

Packaged-runtime parity acceptance specification

Environment identity

Before testing feature parity:

confirm navigator/browser harness does not expose the normal Tauri invoke bridge;
confirm installed Flite exposes window.__TAURI__.core.invoke;
confirm browser identifies itself as dev/browser;
confirm installed Flite resolves the package version;
confirm updater controls are unavailable in browser and operational only when installed;
treat browser and installed LocalStorage as deliberately separate persistence identities.

CSV parity

With equivalent source data, compare browser and installed exports for:

filename;
extension;
headers;
row count;
field values;
quoting;
commas and embedded text;
Unicode;
BOM where expected;
newline semantics.

The environment may change the save interaction and destination but should not change report content.

Full JSON backup parity

This is a mandatory packaged-runtime test.

In installed Flite:

open Backup to JSON;
inspect the native Save As filter;
accept the proposed .json filename without manually changing it;
record the exact file created on disk;
verify its extension;
verify the contents parse as JSON;
immediately open Restore from JSON;
confirm the same file is selectable by the normal restore picker.

Also test Save cancellation and native text-write failure fallback.

Booking Profile export

In installed Flite:

export a distinctive profile;
identify the actual output location;
verify filename and JSON contents;
record what WebView feedback is presented.

XLSX parity

Generate an equivalent Official Monthly Return in browser and installed Flite.

Compare:

sheet names;
row counts;
cell values;
key formulas or formats where relevant;
Movement Details content.

Binary identity is not mandatory where SheetJS legitimately serialises workbook metadata differently. Semantic workbook equality is the acceptance requirement.

Also test:

native Save cancellation;
native XLSX failure followed by browser fallback;
fallback failure where practicable.

Clipboard parity

Test METAR, CAA registration and FAA registration copying in browser and installed Flite.

Exercise:

normal Web Clipboard availability;
permission rejection;
Clipboard API absence where reproducible;
legacy fallback.

After every claimed success, independently paste into a neutral field.

Displayed Copied feedback is not sufficient evidence.

External navigation parity

For CAA G-INFO and FAA Registry, establish in the packaged application:

whether the destination opens in the system browser;
whether a new WebView is created;
whether the current Flite window navigates away;
what occurs if navigation is blocked or refused;
whether closing the destination affects Flite.

Updater lifecycle

In installed Flite test:

manual check while current;
manual check while offline;
automatic Check on launch while current;
automatic Check on launch while offline;
Last checked and Status after each case;
available-update detection;
first and second install-confirmation clicks;
successful NSIS installation;
automatic close/relaunch;
new running version after update;
persistence survival;
failed update installation where practicable;
immediate Install retry without another check;
recovery after a fresh update check;
manual Restart path where available;
restart invocation failure where reproducible.

Persistence and reload parity

Use deliberately different marker data in browser and installed Flite.

Verify that each environment keeps its own dataset.

For installed Flite verify persistence across:

location.reload();
normal close and reopen;
update/relaunch where tested.

Browser persistence surviving localhost reload is not evidence of installed persistence.

Storage behaviour

Compare the fixed quota display with actual safe write behaviour in both environments.

Do not treat the displayed 5 MB capacity as independently measured runtime capacity.

Restore file handling

In browser and installed Flite test:

picker cancellation;
valid JSON;
malformed JSON;
recognised but non-restorable backup;
reselecting the same file;
file-read failure where a reproducible case can be constructed.

The destructive semantic correctness of restore remains the scope of Audit 10 rather than Audit 9.

Systemic conclusion

Flite's shared frontend creates substantial parity for ordinary UI and domain logic, but browser regression testing does not exercise or prove several installed-product capabilities.

The required release model is therefore:

browser harness for broad shared regression;
plus a small explicit packaged-Tauri parity gate for native identity, filesystem, clipboard, external navigation, updater, restart and installed persistence behaviour.

Audit 9 is complete.

The three Medium-high findings and the broader installed-runtime truthfulness gaps require remediation disposition and packaged-Tauri acceptance before final regression and release acceptance.
10. Backup and restore destructive-behaviour audit

Completed 10 August 2026.

Authoritative inspected baseline: 2c474f6 - Complete browser and Tauri parity audit.

This audit examined the destructive semantics of backup restoration rather than merely whether a recognised backup can be parsed and imported.

It traced:

backup representation and replacement semantics;
preflight and validation boundaries;
current-format write ordering;
partial persistence failure;
legacy movement-only replacement;
runtime versus durable state;
post-restore module caches;
reload and startup reconciliation;
cross-generation identity;
operator-visible success and failure claims.

Consolidated confirmed-finding severity:

High: 4
Medium-high: 3
Medium: 1
Critical: 0
Total confirmed findings: 8

High-severity findings

1. Current-format restore can fail after destructively replacing only part of the installation.

Classification: Confirmed finding.
Severity: High.

Current-format restore writes supplied fixed datasets sequentially in this order:

1. movements;
2. configuration;
3. cancelled sorties;
4. Deleted Strips;
5. Booking Profiles;
6. Calendar events;
7. Hours Log;
8. VKB overrides;
9. operational Audit Log;
10. Bookings.

Valid dated generic-overflight keys are written afterwards.

Each supplied non-null key is written directly to its live LocalStorage key. There is no staging namespace, pre-restore installation snapshot, transactional commit, rollback or per-key read-back verification.

If a storage write throws after earlier writes have succeeded, later writes are abandoned but the earlier replacements remain.

For example, failure writing Bookings can leave:

movements through Audit Log from the backup;
Bookings from the pre-restore installation;
some or all target-only generic-overflight counters unchanged.

The importer then reports failure.

The accumulated restoredKeys list is local to the successful path and is not returned from the failure result, so the caller cannot report which datasets were already replaced.

Movement storage is the first write. The in-memory movement reload occurs only after all fixed and dynamic writes succeed. A later write failure can therefore leave restored movement LocalStorage under the still-running pre-restore movement array.

Subsequent movement activity before reload can persist that stale pre-restore movement array back over the movement data that had successfully restored.

Impact:

Restore failed does not mean the installation was left unchanged.

A failed restore can create an arbitrary source/target hybrid and can subsequently change again depending on operator activity before reload.

No exact automatic rollback path exists.

Remediation direction:

Stage the complete proposed restored state away from the live keys, verify every write, then commit atomically where possible.

If atomic commit cannot be provided by the storage technology, capture and verify an exact pre-restore rollback set before mutating any live key.

On failure, return the precise successful/failed/not-attempted mutation boundary and prevent normal operation until rollback or safe restart has completed.

2. Successful full restore leaves writable secondary-store caches stale, allowing restored data to be overwritten before reload.

Classification: Confirmed finding.
Severity: High.

Current restore explicitly reloads movement and configuration state after successful writes.

It does not similarly invalidate and reload all other writable module caches.

Bookings retain a module-level bookings array and bookingsInitialised flag.

Calendar retains a module-level calendarEvents array and calendarEventsInitialised flag.

Booking Profiles retain a module-level bookingProfiles object and bookingProfilesInitialised flag.

These stores are normally initialised during application startup before an operator later reaches Admin Restore.

Writing their LocalStorage keys during restore therefore does not replace those already-loaded runtime collections.

The success handler rerenders selected views and instructs the operator to reload Flite, but reload is optional and normal controls remain available.

If the operator edits a Booking before reload, the Booking store mutates the stale pre-restore array and serialises the complete array back to storage.

That can overwrite the newly restored Booking dataset.

Calendar event creation, editing or deletion can perform the same stale-array overwrite against restored Calendar storage.

Saving or deleting a Booking Profile can likewise rewrite restored profile storage from the old pre-restore object.

Impact:

A restore can report success and correctly write backup data, yet normal operator activity during the same session can subsequently erase that restored state.

The reload instruction is therefore not merely cosmetic. It is an un-enforced safety requirement.

Remediation direction:

After successful restore, invalidate and synchronously reload every restored writable subsystem before restoring operator control.

Alternatively force an immediate controlled application reload as part of the restore completion path and prevent mutations until that reload has occurred.

3. Legacy movement restore can report success even when the replacement was never durably persisted.

Classification: Confirmed finding.
Severity: High.

Legacy envelope, legacy v1 and legacy v2 restore all use the same movement-only mutation path.

The importer first replaces the module-level movements array with the imported movement array, recomputes nextId and marks movement state initialised.

Only then does it call the ordinary movement save helper.

The ordinary movement save helper catches persistence exceptions internally and does not rethrow them to the importer.

The importer consequently returns success after saveToStorage() returns, even where the movement write failed.

The immediate state can therefore be:

runtime movements = imported legacy backup;
durable movement store = previous installation;
restore result = success.

Because the Admin success path trusts that result, the normal backup-restored audit event can also be appended.

After restart, the still-durable old movement store can load again and the apparently restored legacy movements disappear.

Impact:

Successful legacy restoration does not prove durable movement replacement.

The operational Audit Log can contain restore-success provenance for a replacement that did not survive application restart.

Remediation direction:

Legacy restore must use the same verified result-bearing persistence and transactional boundary as current-format restore.

Never replace authoritative runtime movement state before durability has been established.

4. Legacy movement replacement can attach preserved modern bookings to a different restored movement incarnation through numeric ID reuse.

Classification: Confirmed finding.
Severity: High.

Legacy restore intentionally replaces only movements.

Modern Bookings, Cancelled Sorties, Deleted Strips, Booking Profiles, Calendar, Hours, VKB, Audit Log and generic-overflight data survive from the target installation.

Bookings can reference movement IDs through linkedStripId.

Movements can reference booking IDs through bookingId.

Startup reconcileLinks() checks whether those numeric IDs exist and whether pointers reciprocate.

It has no immutable movement-incarnation or generation identifier.

A preserved target Booking can therefore point to movement ID 37.

Legacy restore can replace the original movement 37 with an unrelated historic movement that also uses ID 37.

If the imported movement also carries the reciprocal bookingId, reconciliation considers the relationship valid.

No integrity banner is required because the numeric pointers are internally consistent.

Impact:

A successful legacy restore can silently connect a preserved modern Booking to a different historical movement while passing startup reconciliation.

The same reusable numeric-ID model also creates ambiguity for preserved cancellation, deletion and audit history, although those secondary consequences were retained as manual-test requirements rather than additional confirmed findings.

Remediation direction:

Introduce stable entity-incarnation identity independent of reusable display/numeric IDs.

Relationship reconciliation must verify identity lineage, not only reciprocal numeric pointers.

Medium-high findings

5. Restore preflight does not validate complete record semantics before authorising destructive replacement.

Classification: Confirmed finding.
Severity: Medium-high.

Current-format validation performs conservative top-level dataset checks.

Examples include:

a movement container must be an object with the current schema version and a movements array;
cancelled sorties and Deleted Strips must be arrays;
Bookings must be an object with a bookings array;
Calendar must be an object with an events array;
configuration need only be a non-array object.

The validators do not comprehensively prove the semantic validity of every nested movement, booking, event, profile, audit record or configuration field.

Legacy validation is weaker.

A bare array qualifies as legacy v1 movement data.

Legacy v2 principally requires a numeric version and movements array.

Accepted legacy records become the live movement array and are then serialised inside the current movement-storage envelope.

Impact:

A backup can pass restore preflight and replace valid operational data with records that could not necessarily have been created through normal current application validation.

Legacy records can be promoted into the current canonical movement store without having satisfied current record requirements.

Remediation direction:

Add bounded, record-level semantic validation for every restored dataset.

Validation should enforce required fields, types, ranges, supported enum values, identifier constraints and cross-record integrity before any live mutation.

6. A Full backup restore is an overlay, not a complete replacement of installation state.

Classification: Confirmed finding.
Severity: Medium-high.

Full backup export writes each fixed backup key as either its raw value or null.

Current-format restore writes a fixed dataset only when the storage property exists and its value is not null.

Therefore:

missing source key -> existing target dataset survives;
source value null -> existing target dataset survives;
valid empty source dataset -> existing target dataset is replaced by an empty dataset.

Dated generic-overflight keys are dynamic.

Only recognised valid source keys are written.

Target-only dated generic-overflight keys are not removed.

Malformed dynamic values are warning-and-skip cases, so an existing target value for that date can survive while the rest of the backup is restored.

A structurally recognised current backup can even be restorable with storage:{} or with no meaningful non-null sections.

The confirmation UI describes the format as Full backup and reports a count of restorable keys, but does not present a complete before/after inventory of every target section that will remain.

Impact:

Even a completely successful restore can deliberately produce a hybrid of backup data and pre-existing target data.

The word Full does not mean complete replacement of the installation represented by the backup.

Remediation direction:

Define one explicit restore policy.

If restore means replacement, encode source absence explicitly and remove target-only managed state.

If overlay remains intentional, label it as such and show the complete resulting-state plan before confirmation.

7. Restore success accounting does not prove durable persistence.

Classification: Confirmed finding.
Severity: Medium-high.

The shared writeRaw() storage wrapper returns silently when LocalStorage is considered unavailable and otherwise calls localStorage.setItem().

It returns no result-bearing acknowledgement.

Current restore calls writeRaw() and then immediately adds the key to restoredKeys.

No read-back comparison is performed.

The restore success UI reports the number of restored storage keys from this attempted-key list.

Impact:

restoredKeys means that the importer attempted the key without receiving a propagated exception.

It does not prove that the expected value was durably stored.

Silent storage unavailability can therefore produce success-shaped restored-key accounting without verified persistence.

Remediation direction:

Use structured persistence results.

Every restored key must be read back and compared, or otherwise receive a durable acknowledgement, before it contributes to restoredKeys or overall success.

Medium finding

8. Restored VKB override state is not consistently propagated through all runtime and reporting caches until reload.

Classification: Confirmed finding.
Severity: Medium.

VKB stores bundled baseline rows and effective override-derived rows in module-level memory.

Normal VKB override mutations call a rebuild helper that refreshes effective arrays.

Backup restore directly writes the raw VKB override LocalStorage key and does not call that rebuild helper.

Some VKB lookup paths derive effective data by rereading the override store.

Other paths operate from cached effective arrays.

Reporting additionally maintains a registrationIndex that is built once and reused.

The restore success path calls refreshVkbAdminDisplay() and renderReports(), but does not invalidate every VKB-derived runtime cache.

Impact:

Immediately after restore, different consumers can temporarily use different generations of VKB-derived reference data.

A report rendered before reload can therefore use stale registration-derived classification state even though restored overrides are already present in LocalStorage.

Remediation direction:

Provide one authoritative post-restore VKB reload/invalidation operation that rebuilds every effective array and invalidates downstream reporting indexes before any dependent view is rendered.

Confirmed-sound controls

The following controls were confirmed and should be preserved during remediation:

current-format inspection completes before intended mutation begins;
malformed outer JSON is blocked;
unrecognised backup structures are blocked;
unsupported future current-format versions are blocked;
every present fixed dataset must parse as JSON and satisfy its defined top-level shape;
malformed fixed datasets block current restore rather than being silently skipped;
arbitrary unknown backup storage keys are not restored;
dynamic generic-overflight keys use a strict allowlist;
preview and import use the same inspection routine;
the importer reinspects immediately before mutation;
legacy backups are explicitly identified and warned as movement-only;
successful current restore reloads movement and configuration state;
Hours data is read fresh from storage;
Cancelled Sorties and Deleted Strips do not use the same long-lived module-cache pattern confirmed for Bookings, Calendar and Booking Profiles;
fresh application startup recreates JavaScript module state;
startup booking reconciliation runs after subsystem initialisation;
simple missing or mismatched booking/movement pointers are cleared or repaired;
reconciliation repairs and conflicts are surfaced through a visible integrity banner;
successful current restore appends restore provenance to the restored operational Audit Log;
technical diagnostic history exists independently of the normal backup set and records material persistence failures.

Destructive-restore manual-test specification

The manual tests below use deliberately distinguishable SOURCE backup data and TARGET installation data.

For every destructive, failure-injection or stale-cache case capture:

raw LocalStorage before restore;
raw LocalStorage immediately after restore or failure;
the visible restore result;
the operational Audit Log;
the technical diagnostic log;
raw LocalStorage and visible state after reload or full restart.

DR-01 - Complete current backup over a populated target.

Assert that every supplied fixed dataset becomes SOURCE state and document the treatment of target-only dynamic state.

DR-02 - Omit one fixed dataset from a current backup.

Assert that the omitted TARGET dataset survives unchanged.

DR-03 - Set the same fixed dataset explicitly to null.

Assert that the TARGET dataset survives unchanged.

DR-04 - Supply a valid empty representation for the same dataset.

Assert that the TARGET data is replaced with the valid empty SOURCE state.

DR-05 - Give the target a dated generic-overflight key absent from the source backup.

Assert that the TARGET counter survives.

DR-06 - Put a malformed dated generic-overflight value in the source where the target already has a valid value.

Assert that the warning is shown, the source value is skipped and the TARGET value survives while other restore sections continue.

DR-07 - Restore a recognised current backup whose storage object is empty.

Verify the exact preflight, confirmation, success and mutation behaviour.

DR-08 - Restore a current backup whose fixed keys are all null.

Verify the apparent success/no-op behaviour and resulting summary.

DR-09 - Include an arbitrary unknown LocalStorage-style key.

Assert that it is not restored.

DR-10 - Use an unsupported future current backup formatVersion.

Assert that confirmation is blocked and target storage remains unchanged.

DR-11 - Use malformed outer JSON.

Assert that confirmation is blocked and target storage remains unchanged.

DR-12 - Put malformed JSON inside one fixed current-format dataset.

Assert that the complete current restore is blocked before the first intended write.

DR-13 - Supply a valid movement envelope containing malformed individual movement records.

Determine the runtime, persistence and reload consequences.

DR-14 - Supply a valid Booking envelope containing malformed individual Booking records.

Determine the runtime, persistence and reload consequences.

DR-15 - Restore configuration values that the normal Admin UI would reject.

Determine the effective post-restore and post-reload configuration behaviour.

DR-16 - Inject storage failure on fixed write 1, movements.

Assert that later restore writes are not attempted.

DR-17 - Inject failure on fixed write 2, configuration.

Assert that movements are SOURCE while configuration and later fixed stores remain TARGET.

DR-18 - Inject failure on fixed write 6, Calendar.

Assert that writes 1-5 are SOURCE and write 6 onward remains TARGET.

DR-19 - Inject failure on fixed write 9, Audit Log.

Assert that writes 1-8 are SOURCE while Audit Log and Bookings remain TARGET.

DR-20 - Inject failure on fixed write 10, Bookings.

Assert that writes 1-9 are SOURCE, Bookings remains TARGET and dynamic writes are not attempted.

DR-21 - Inject failure on the first dynamic generic-overflight write.

Assert that applicable fixed stores are SOURCE while dynamic target state remains.

DR-22 - Inject failure on a later dynamic generic-overflight write.

Assert that fixed plus earlier dynamic keys are SOURCE while later dynamic state remains TARGET.

DR-23 - After a partial current-format failure occurring after movement replacement, edit a movement before reload.

Verify whether stale pre-restore movement memory overwrites restored movement LocalStorage.

DR-24 - Repeat the same partial failure but reload immediately without further mutation.

Record the exact persisted hybrid used at startup and any reconciliation changes.

DR-25 - Make the storage wrapper consider LocalStorage unavailable during current restore.

Compare claimed restoredKeys and success feedback with actual persistence.

DR-26 - Complete a successful current restore, do not reload, then edit an existing Booking.

Verify whether the stale TARGET Booking cache overwrites restored SOURCE Booking storage.

DR-27 - Complete a successful current restore, do not reload, then add, edit or delete a Calendar event.

Verify whether the stale TARGET Calendar cache overwrites restored SOURCE Calendar storage.

DR-28 - Complete a successful current restore, do not reload, then save or delete a Booking Profile.

Verify whether the stale TARGET profile cache overwrites restored SOURCE profile storage.

DR-29 - Restore substantially different VKB overrides and inspect lookups, Admin and Reports immediately without reload.

Identify fresh versus stale consumers.

DR-30 - Repeat DR-29 after full reload.

Assert convergence on restored VKB state.

DR-31 - Complete a successful current restore and fully close/reopen the packaged application.

Assert stable durable restoration across restart.

DR-32 - Restore a legacy v1 bare movement array over a populated modern target.

Assert that movements become SOURCE while modern secondary stores remain TARGET.

DR-33 - Repeat with legacy v2.

Assert the same movement-only replacement semantics.

DR-34 - Repeat with the legacy envelope format.

Assert movement-only replacement and expected warning/provenance behaviour.

DR-35 - Inject movement-storage failure during legacy restore.

Assert that runtime movements become SOURCE while durable movement storage remains TARGET and restore still reports success if source behaviour is reproduced.

DR-36 - Reload immediately after DR-35.

Assert whether TARGET movements return and inspect whether a backup-restored operational audit event survives.

DR-37 - Restore legacy v1 containing malformed movement members.

Determine how those members are promoted into current v3 movement storage and behave after reload.

DR-38 - Restore legacy v2 using an unexpected or extreme numeric schema version.

Verify exact preflight and resulting persistence behaviour.

DR-39 - Use a legacy envelope whose metadata schema version disagrees with the payload version.

Determine which value governs restore behaviour.

DR-40 - Preserve a TARGET Booking whose linkedStripId is reused by an unrelated SOURCE legacy movement.

Verify startup reconciliation behaviour.

DR-41 - Construct a fully reciprocal but semantically wrong relationship: preserved TARGET Booking 12 points to restored SOURCE movement 37 and SOURCE movement 37 carries bookingId 12.

Assert whether reconciliation reports the pair as clean despite the entity-incarnation mismatch.

DR-42 - Give a SOURCE movement a bookingId that collides with an unrelated preserved TARGET Booking.

Verify repair or attachment behaviour.

DR-43 - Reuse a TARGET Cancelled Sortie sourceMovementId as a SOURCE restored movement ID.

Inspect cancellation, reinstatement and duplicate-suppression semantics.

DR-44 - Reuse a TARGET Deleted Strip snapshot movement ID as a SOURCE restored movement ID.

Assert that same-ID reinstatement remains blocked and document historic ambiguity.

DR-45 - Reuse a movement ID already present in preserved operational Audit Log history.

Inspect whether historic entity presentation can distinguish the pre-restore and restored incarnations.

DR-46 - Restore a PLANNED movement already inside its configured activation window.

After reload, verify startup activation reconciliation and resulting operational/audit state.

DR-47 - Restore genuinely dangling booking/movement relationships and reload.

Assert that startup reconciliation clears or repairs them and exposes the integrity banner.

DR-48 - Restore the fully reciprocal but semantically wrong ID-reuse case and reload.

Assert whether reconciliation produces no integrity warning despite the incarnation mismatch.

For ID-reuse tests, capture at minimum:

movement id;
movement callsign;
movement registration;
movement DOF;
movement bookingId;
booking id;
booking registration;
booking date;
booking linkedStripId.

Systemic conclusion

The ordinary happy-path restore implementation contains useful preflight controls, but restore itself is not an installation-state transaction.

The dominant release risks are:

partial destructive replacement after failure;
stale runtime state capable of undoing successful restoration;
false-success legacy persistence;
cross-generation numeric identity reuse;
insufficient semantic validation;
ambiguous overlay semantics;
unverified persistence accounting.

Recommended remediation order

1. Introduce transactional or rollback-capable full restore.
2. Make the persistence boundary result-bearing and verify every restore write.
3. Reload or invalidate every restored runtime subsystem before normal operation resumes.
4. Remove legacy memory-first false-success behaviour.
5. Add stable entity-incarnation identity and strengthen relationship reconciliation.
6. Add complete record-level restore validation and input bounds.
7. Define explicit replacement versus overlay semantics and show the resulting-state preview.
8. Rebuild VKB/reporting derived caches as part of restore completion.
9. Execute the 48-case destructive-restore acceptance suite in the packaged runtime.

Overall disposition

Audit 10 is complete.

The four High findings and the three Medium-high findings require remediation before final regression and release acceptance.
11. Release artefact and clean-install audit

Completed 10 August 2026.

Authoritative inspected baseline: 76a20a1 - Complete backup and restore destructive behaviour audit.

This audit examined the complete Windows release lifecycle rather than only whether Tauri can produce an installer.

It traced:

release configuration and artefact contract;
application identity and version metadata;
NSIS Windows integration;
clean-install and first-launch state;
production demo-data behaviour;
updater configuration and operator controls;
packaged updater persistence;
manual installer upgrade;
uninstall and reinstall;
residual WebView application data;
downgrade behaviour;
NSIS versus MSI distribution;
source-to-binary provenance;
semantic-version discipline;
release signing;
release asset hashes;
clean-build controls;
toolchain reproducibility.

Consolidated confirmed-finding severity:

High: 1
Medium-high: 2
Medium: 7
Low-medium: 2
Low: 1
Critical: 0
Total confirmed findings / verification gaps: 13

High-severity findings

1. Materially different source states share the same semantic release version.

Classification: Confirmed finding.
Severity: High.

The public v0.9.4 tag resolves to commit:

41bbeed16f475fb32bd30624a5f9327d70464d7a

The authoritative Audit 11 baseline is:

76a20a1a89f1e3eac3d163ef2f212f62470f5552

The audit baseline is 29 commits ahead of the public v0.9.4 tag.

Those intervening commits include substantial runtime changes while the audited baseline still declares version 0.9.4 in package.json, src-tauri/Cargo.toml and src-tauri/tauri.conf.json.

Impact:

semantic version no longer identifies a unique application state;
support and acceptance evidence labelled only 0.9.4 is ambiguous;
the updater cannot distinguish two materially different builds carrying the same version;
a newer local build can identify itself as already current against the older public release.

Remediation direction:

assign a new unique version before any further distributable build;
make version advancement a hard release prerequisite;
verify all authoritative manifests, Git tag, GitHub release and updater manifest agree before publication.

Medium-high findings

2. Packaged builds do not expose immutable source provenance.

Classification: Confirmed finding.
Severity: Medium-high.

The native version command returns the semantic version and buildSource: unknown.

No Git commit SHA, tag or immutable build identity is exposed by the packaged application.

Remediation direction:

embed the accepted Git commit SHA during release build;
surface it in System Status and diagnostic output.

3. Release production is manually assembled and is not mechanically bound to an exact accepted Git tag.

Classification: Confirmed finding.
Severity: Medium-high.

There is no committed release workflow at the frozen baseline.

scripts/install-latest-dev-build.ps1 is explicitly a development reinstall helper. It builds current main by default, can be run with -SkipGitUpdate or -AllowDirty, and does not create the GitHub Release or publish latest.json.

The public v0.9.4 release was assembled manually, with latest.json uploaded separately after the installer assets.

Remediation direction:

introduce a hardened release workflow or release script;
require clean repository state;
require an exact immutable release ref;
verify version consistency;
run required tests;
build and sign from that ref;
record source SHA and hashes;
publish only the accepted outputs.

Medium findings

4. A clean Windows installation is not guaranteed to be completely offline when WebView2 is absent.

Classification: Confirmed configuration with conditional runtime consequence.
Severity: Medium.

No explicit WebView2 install mode is configured.

Remediation direction:

decide whether fully offline installation is required and either bundle an appropriate WebView2 strategy or document the network prerequisite.

5. Production retains a control capable of populating synthetic operational movements.

Classification: Confirmed finding.
Severity: Medium.

A genuinely fresh installation starts empty.

However, Admin Danger Zone retains Reset to Demo, which persists realistic synthetic movements into the ordinary operational movement store after explicit confirmation.

Remediation direction:

remove or development-gate it, or make synthetic/demo state unmistakable throughout the product.

6. Existing packaged updater-survival evidence does not cover the complete current persistence surface.

Classification: Confirmed verification gap.
Severity: Medium.

The historical Windows updater test covered movements, VKB overrides, audit history, bookings/calendar and settings.

The current application contains additional persistence classes that have not been equivalently verified across a packaged update.

Remediation direction:

populate every current persistence class in an older installed build, update without restore, and verify every value survives.

7. Manual NSIS-over-existing-install upgrade lacks equivalent packaged acceptance evidence.

Classification: Confirmed verification gap.
Severity: Medium.

Documentation supports manual installer upgrade, but current evidence covers the in-app updater rather than the equivalent manual NSIS lifecycle.

Remediation direction:

add a separate fully populated manual NSIS upgrade test.

8. Uninstall/reinstall data retention is undefined and unverified.

Classification: Confirmed lifecycle-assurance gap.
Severity: Medium.

All authoritative application state resides in the WebView localStorage profile.

Flite has no custom uninstall-data policy.

Remediation direction:

test populated uninstall, inspect residual WebView data, reinstall and define the resulting behaviour as the supported contract.

9. Downgrade guidance does not address persisted-schema compatibility.

Classification: Confirmed release-lifecycle gap.
Severity: Medium.

Uninstalling a higher version and installing a lower one may satisfy Windows installer ordering but does not establish that newer persisted data is compatible with the older application.

Remediation direction:

require backup and define explicitly supported downgrade/schema paths.

10. The clean-build environment is not fully pinned or reproducibly specified.

Classification: Confirmed reproducibility gap.
Severity: Medium.

Cargo.lock pins Rust dependencies, but the repository does not fully pin the external Rust, cargo-tauri, Node/npm and Windows build environment.

Remediation direction:

pin or explicitly document the supported release toolchain.

Low-medium findings

11. The custom NSIS hook forces and can recreate a Desktop shortcut.

Classification: Confirmed finding.
Severity: Low-medium.

The post-install hook creates the Desktop shortcut directly and suppresses the normal finish-page shortcut callback.

Remediation direction:

retain the icon fix while respecting user shortcut choice and update mode.

12. Publishing both MSI and NSIS creates an untested cross-installer lifecycle.

Classification: Confirmed release-process / acceptance gap.
Severity: Low-medium.

The public release exposes both installer technologies while documentation primarily directs users to NSIS.

Remediation direction:

publish only the supported installer technology, or explicitly test both and their transition paths.

Low findings

13. package-lock.json retains stale product/version metadata.

Classification: Confirmed finding.
Severity: Low.

The stale lockfile identity does not appear to control Tauri installer identity but creates avoidable release metadata inconsistency.

Remediation direction:

regenerate or correct the lockfile.

Release invariants established by Audit 11

com.vectair.flite remains stable unless an explicit persisted-data migration is designed;
every materially new distributable build receives a unique monotonically increasing semantic version;
package.json, Cargo.toml and tauri.conf.json agree;
the Git tag, GitHub Release and updater manifest use the same release version;
the packaged application exposes the exact source commit;
release builds originate from the immutable accepted release ref;
updater artefacts remain signed using the external private key;
release hashes are retained;
final acceptance installs the artefact downloaded back from the public release.

Final packaged Windows acceptance specification

RA-01 - First-ever clean profile installation.
RA-02 - Windows application identity, icons, shortcuts and Installed Apps registration.
RA-03 - Authenticode status and publisher identity.
RA-04 - Installation with WebView2 already present.
RA-05 - Installation with WebView2 absent and network available.
RA-06 - Installation with WebView2 absent and no network.
RA-07 - First-launch check-on-launch default.
RA-08 - Check-on-launch disabled across restart.
RA-09 - Manual update check.
RA-10 - Offline update failure and retry.
RA-11 - Populate every persistence class before upgrade.
RA-12 - In-app updater upgrade with complete persistence survival.
RA-13 - Manual NSIS upgrade with complete persistence survival.
RA-14 - Same-version reinstall.
RA-15 - Uninstall populated application and inspect residual state.
RA-16 - Reinstall after uninstall and determine whether old state returns.
RA-17 - Genuine clean profile after explicit residual-data removal.
RA-18 - Explicitly supported downgrade using controlled test data.
RA-19 - MSI lifecycle only if MSI remains a supported release channel.
RA-20 - Reset to Demo production behaviour.
RA-21 - Clean release build from exact tag.
RA-22 - Installed source provenance.
RA-23 - Version/tag/release/latest.json consistency.
RA-24 - Final acceptance using artefacts downloaded back from the public GitHub Release.

Systemic conclusion

Audit 11 found no evidence that the fundamental Tauri packaging or updater architecture is unusable.

The release-blocking issue is provenance discipline.

The repository has evolved materially beyond public v0.9.4 while retaining the same 0.9.4 application identity.

Before any further installer is distributed, Flite needs a unique new version and a release process that binds accepted source, semantic version, immutable tag, tests, build, signing, artefact hashes, updater metadata, public release and installed build identity.

Recommended remediation order

1. Assign a new unique version before any further distributable build.
2. Add immutable source SHA/build provenance to the packaged application.
3. Introduce a tag-bound clean release procedure or workflow.
4. Define the supported Windows installer channel.
5. Execute complete updater and manual-upgrade persistence tests.
6. Establish the uninstall/reinstall residual-data contract.
7. Define safe downgrade policy and schema compatibility.
8. Decide the production disposition of Reset to Demo.
9. Resolve offline WebView2 installation policy.
10. Correct Desktop shortcut lifecycle behaviour.
11. Pin/document the clean-build toolchain.
12. Correct stale package-lock metadata.
13. Execute the final public-download Windows acceptance suite.

Overall disposition

Audit 11 is complete.

One High provenance finding is release-blocking before another installer is distributed.

The Medium-high and Medium lifecycle findings require remediation or explicit release disposition, followed by packaged Windows acceptance before final regression and V1 release.
12. Documentation-to-product audit

Status: Complete.
Frozen baseline: a0dbffe.
Completed: 10 August 2026.

Scope

The audit compared current-facing documentation against the frozen Flite source, current application structure, published release identity and the evidence established by Audits 1-11.

The review covered:

README and project-state documentation;
product identity, branding, version and release references;
architecture and persistence specifications;
operator workflows;
installation and clean-install expectations;
backup and destructive restore instructions;
updater instructions;
troubleshooting;
historical/demo material;
cross-document authority and consistency.

Consolidated severity

Critical: 0
High: 1
Medium-high: 5
Medium: 8
Low-medium: 4
Low: 2
Total: 20

High findings

1. Restore documentation materially understates destructive and partial-failure behaviour.

Classification: Confirmed documentation safety defect.
Severity: High.

Current operator guidance describes restore principally as overwriting current data and recommends taking a backup if the existing state may be required.

Audit 10 established a materially more hazardous contract:

current-format restore is non-atomic;
a failed restore can leave an arbitrary hybrid of restored and pre-restore datasets;
there is no rollback;
successful full restore leaves writable Booking, Calendar and Booking Profile caches stale until reload;
continued operator activity before reload can overwrite successfully restored data;
Full backup restore is overlay-like when datasets are omitted or null;
target-only generic-overflight state can survive;
restoredKeys records attempted rather than verified durable writes;
VKB/reporting state is not comprehensively refreshed until reload.

Remediation direction:

make a verified pre-restore backup a required safety step;
state explicitly that restore is not transactional;
warn that failed restore can leave partial replacement;
prohibit continued operational use until full reload/restart after restore;
describe replace-versus-overlay behaviour accurately;
provide recovery instructions for failed or uncertain restore.

Medium-high findings

2. Published release and current source share semantic version 0.9.4 without adequate documentation provenance.

Classification: Confirmed documentation/release-provenance defect.
Severity: Medium-high.

Public v0.9.4 refers to commit 41bbeed16f475fb32bd30624a5f9327d70464d7a.

The Audit 12 baseline is materially later while package.json, Cargo.toml and tauri.conf.json still identify the product as 0.9.4.

Documentation using "current version 0.9.4" therefore cannot uniquely identify a source state or binary.

Remediation direction:

distinguish current source version, immutable source SHA, latest public release version and release tag/source SHA;
require each distributable source state to have a unique version.

3. Canonical timing documentation states invariants that the audited product does not consistently maintain.

Classification: Confirmed architecture-documentation contradiction.
Severity: Medium-high.

TIMING.md states that movement time fields are stored as UTC HH:MM and that local time is UI-only.

STRIP_LIFECYCLE_AND_COUNTERS.md describes the same time fields as local HH:MM.

Audit 4 established actual pathways in which local clock values can be written into fields otherwise treated as UTC.

Remediation direction:

separate intended canonical timing semantics from current implementation;
do not state a universal UTC invariant until all write paths enforce it;
retire or correct contradictory canonical specifications.

4. Canonical strip-lifecycle documentation describes obsolete cancellation and deletion semantics.

Classification: Confirmed obsolete canonical documentation.
Severity: Medium-high.

The lifecycle document describes cancelled records as History content and deletion as permanent hard deletion with no recovery.

Current Flite instead has separate Cancelled Sorties and Deleted Strips stores, reinstatement and a 24-hour deleted-strip recovery path.

Remediation direction:

rewrite the lifecycle specification against the current cancellation, deletion, retention, reinstatement and restoration architecture.

5. Operator lifecycle documentation omits default automatic ARR and OVR activation.

Classification: Confirmed operator-documentation omission.
Severity: Medium-high.

Quick Start and User Guide present Activate as an operator lifecycle action.

Current default configuration enables:

ARR automatic activation 30 minutes before ETA;
OVR automatic activation 30 minutes before EOFT.

DEP and LOC remain manual by default.

Remediation direction:

document automatic activation, its defaults, governing times, configuration location and interaction with manual activation.

6. Current-facing updater instructions contradict the implemented updater lifecycle.

Classification: Confirmed cross-document contradiction.
Severity: Medium-high.

Quick Start, User Guide and installation guidance retain older wording that describes update checking as manual-only and points to Admin -> System Status.

Current implementation/documentation uses Admin -> Overview -> Version & Updates, supports optional launch checking, requires an inline two-click installation confirmation and may close/relaunch automatically on Windows NSIS.

Remediation direction:

make one updater procedure authoritative and update all operator-facing copies from it.

Medium findings

7. STATE.md presents a stale historical commit as current main.

Classification: Confirmed stale project-state documentation.
Severity: Medium.

STATE.md identifies an old commit as the current confirmed main while also carrying source-of-truth/continuity authority.

Remediation direction:

either keep STATE.md mechanically current or clearly redefine it as historical continuity context rather than current repository truth.

8. Operator backup documentation materially understates actual backup coverage.

Classification: Confirmed backup-documentation mismatch.
Severity: Medium.

README/User Guide/install documentation describe seven principal backed-up categories.

Actual backup coverage contains ten static keys plus dynamic generic-overflight keys.

Documentation omits:

vectair_fdms_bookings_v1;
vectair_fdms_vkb_overrides_v1;
vectair_flite_audit_log_v1;
fdms_generic_overflights_YYYY-MM-DD dynamic state.

Remediation direction:

derive operator backup coverage from the canonical SESSION_BACKUP_KEYS/dynamic-key implementation and keep one authoritative coverage table.

9. Booking UI contains an obsolete prototype statement contradicting current behaviour.

Classification: Confirmed embedded documentation defect.
Severity: Medium.

The Booking page states that wiring into the actual Live Board model is a future step.

Current submission creates a real booking and a real movement record and moves the operator to Live Board.

Remediation direction:

remove the prototype note and replace it with current linked Booking/Strip behaviour.

10. Operator guidance does not adequately document consequential current workflows.

Classification: Confirmed documentation-completeness gap.
Severity: Medium.

Materially under-documented or absent workflows include:

formations;
formation-element lifecycle;
retrospective strip entry;
Manual FIS;
general Calendar events;
Booking Profile management;
Booking-to-Strip creation and linkage;
linked booking cancellation/deletion behaviour.

Remediation direction:

expand the User Guide from a feature overview into a complete operator workflow guide for consequential actions.

11. "Official Monthly Return" wording communicates assurance not supported by the current audited implementation.

Classification: Confirmed assurance/documentation mismatch.
Severity: Medium.

The User Guide describes official movement reporting and the UI labels the view Official Monthly Return.

Audit 4 identified unresolved midnight allocation, timezone and summary/detail consistency defects.

Remediation direction:

qualify the reporting output until the relevant defects are remediated and regression accepted, or explicitly require operator verification.

12. Backup instructions present native JSON Save As as accepted despite a known packaged-runtime defect.

Classification: Confirmed installed-runtime documentation gap.
Severity: Medium.

Audit 9 found that full JSON backup uses a native text-save path whose Save As filter is CSV-oriented and required packaged backup-to-restore interoperability verification.

Remediation direction:

correct the native file filter and complete packaged backup/save/reopen/restore acceptance before representing the installed path as fully accepted.

13. Downgrade guidance addresses Windows installer ordering but not persisted-data compatibility.

Classification: Confirmed lifecycle documentation gap.
Severity: Medium.

The documented uninstall-then-install-older-version procedure solves executable version ordering only.

It does not establish that the older application can safely consume state written by the newer application.

Remediation direction:

define supported downgrade/schema compatibility and require verified backup before destructive downgrade until demonstrated safe.

14. Installation lifecycle guidance omits unresolved clean-install and uninstall/reinstall contracts.

Classification: Confirmed installation-documentation gap.
Severity: Medium.

The current Windows installer may require network access to obtain WebView2 when the runtime is absent.

Uninstall/reinstall WebView localStorage retention has not been established by packaged testing.

Remediation direction:

document the possible clean-install network prerequisite;
test and define uninstall/reinstall data retention;
require backup before uninstall/reinstall until the contract is known.

Low-medium findings

15. Documentation authority is fragmented and insufficiently governed.

Classification: Confirmed documentation-governance defect.
Severity: Low-medium.

STATE.md, DATA_INVENTORY.md, FORMATIONS.md, TIMING.md and STRIP_LIFECYCLE_AND_COUNTERS.md each carry varying authoritative/canonical/source-of-truth implications.

Some are current, some partially obsolete and some mutually contradictory.

Remediation direction:

create one documentation/architecture index recording for each document:

status;
purpose;
current versus historical classification;
version/date;
source baseline inspected;
superseding document if any.

16. Installation guide advertises Linux release artefacts not present in the current public release.

Classification: Confirmed release-documentation mismatch.
Severity: Low-medium.

The guide directs users to download .deb or .rpm packages from the release.

The current public release provides Windows NSIS/MSI artefacts and updater metadata, not Linux packages.

Remediation direction:

document only published/supported release platforms, or publish and accept the Linux artefacts before advertising them.

17. Obsolete runnable FDMS Lite material remains directly under docs/ without adequate historical classification.

Classification: Confirmed obsolete-documentation exposure.
Severity: Low-medium.

docs/index.html is an older runnable FDMS Lite/demo application with obsolete navigation and branding.

Its location under docs/ does not clearly distinguish it from current Flite material.

Remediation direction:

move it under an explicitly historical/archive path, remove it if no longer required, or place unmistakable historical/demo labelling around it.

18. Root README contains accidentally retained authoring instructions and obsolete roadmap material.

Classification: Confirmed documentation hygiene defect.
Severity: Low-medium.

After the actual README product documentation, the file contains an old "STATE.md section 6 replacement" block, obsolete DP-06/DP-07/DP-08 planning material and git add/commit/push instructions.

Remediation direction:

remove the accidentally retained authoring-session material and keep README limited to current product/development documentation.

Low findings

19. Current canonical architecture documents retain obsolete FDMS Lite branding.

Classification: Confirmed branding/documentation inconsistency.
Severity: Low.

Historical naming is acceptable in historical documents, but current canonical specifications should use Vectair Flite or explicitly state that the old title is retained for historical reasons.

Remediation direction:

rebrand current canonical documents when next revised.

20. package-lock.json retains stale FDMS Lite / 1.0.0 metadata.

Classification: Confirmed metadata inconsistency.
Severity: Low.

package.json identifies vectair-flite 0.9.4 while the lockfile retains historical fdms-lite-dev-tooling / 1.0.0 metadata.

Remediation direction:

regenerate or correct package-lock.json as part of release metadata cleanup.

Confirmed documentation strengths

DATA_INVENTORY.md remains substantially accurate for the frozen persistence implementation.

Current application branding and principal manifest identity are coherently Vectair Flite.

updater-validation.md accurately documents the historically validated Windows NSIS update path, inline confirmation and possible automatic close/relaunch.

Weather / METAR operator documentation is substantially aligned with the current UI.

Environment-specific browser/Tauri storage and export distinctions are documented in several current-facing locations.

Historical audit evidence is retained rather than silently rewritten.

Systemic conclusion

Audit 12 found a documentation synchronization and authority problem rather than a simple lack of documentation.

Several generations coexist:

FDMS Lite-era documentation;
desktop-productization documentation;
current Flite operator documentation;
later specialist updater/persistence documentation;
architecture files carrying different canonical claims;
audit evidence recording known deviations from those specifications.

The most serious issue is that destructive recovery and consequential lifecycle behaviour is documented less accurately than lower-risk interface behaviour.

Required remediation order

1. Correct destructive restore guidance.
2. Correct updater procedure and launch-check policy across all operator documentation.
3. Reconcile backup coverage everywhere.
4. Document automatic activation.
5. Remove obsolete Booking prototype guidance.
6. Document missing consequential operator workflows.
7. Qualify Monthly Return assurance until underlying defects are accepted.
8. Establish source/version/release provenance terminology.
9. Define the documentation authority hierarchy.
10. Establish uninstall/reinstall, clean-install and downgrade contracts.
11. Archive or clearly classify obsolete/demo documentation.
12. Remove accidental README authoring material.
13. Complete branding and package metadata cleanup.

Final documentation acceptance specification

DA-01 - Freeze one immutable release-candidate source commit.

DA-02 - Confirm README, Quick Start, User Guide and installation guide identify the same product and supported release version.

DA-03 - Confirm semantic version, source SHA, release tag and public release identity are distinguishable and mutually consistent.

DA-04 - Verify every documented navigation/Admin path in the packaged release.

DA-05 - Verify documented manual activation behaviour.

DA-06 - Verify and document default ARR/OVR automatic activation.

DA-07 - Verify formation creation/edit/lifecycle documentation against the packaged UI.

DA-08 - Verify retrospective-strip documentation against all four movement types.

DA-09 - Verify Manual FIS documentation.

DA-10 - Verify Booking creation creates the documented booking and movement/link state.

DA-11 - Verify Booking Profile create/import/export/delete documentation.

DA-12 - Verify general Calendar-event create/edit/delete documentation.

DA-13 - Verify Cancelled Sorties reinstatement documentation.

DA-14 - Verify Deleted Strips 24-hour retention/restore documentation.

DA-15 - Confirm all backup documentation lists the exact current static datasets plus dynamic generic-overflight coverage.

DA-16 - Prove packaged JSON Backup Save As -> close/reopen -> Restore interoperability.

DA-17 - Verify restore preview documentation for current and legacy formats.

DA-18 - Verify documentation accurately describes omitted/null dataset behaviour.

DA-19 - Verify failed restore instructions against injected partial-write failures.

DA-20 - Verify post-restore reload/restart is mandatory in documentation and acceptance.

DA-21 - Verify updater Admin location.

DA-22 - Verify check-on-launch default, enable/disable persistence and offline behaviour.

DA-23 - Verify updater inline two-click installation confirmation.

DA-24 - Verify Windows automatic close/relaunch wording against packaged NSIS behaviour.

DA-25 - Verify manual Restart fallback wording.

DA-26 - Verify clean install with WebView2 present.

DA-27 - Verify clean install with WebView2 absent and network available.

DA-28 - Verify clean install with WebView2 absent and network unavailable.

DA-29 - Establish and document uninstall/reinstall local-data retention.

DA-30 - Establish and document supported downgrade/schema behaviour.

DA-31 - Verify current release documentation advertises only artefacts actually published and supported.

DA-32 - Re-run Monthly Return acceptance before retaining unqualified "official" documentation.

DA-33 - Ensure each current architecture document has status, date/version and inspected source baseline.

DA-34 - Ensure no two current canonical documents state contradictory core invariants.

DA-35 - Ensure obsolete/demo/planning documents are visibly historical or archived.

DA-36 - Ensure README contains no authoring-session instructions, replacement blocks or obsolete commit commands.

DA-37 - Ensure current canonical documents use Vectair Flite branding.

DA-38 - Ensure package metadata is internally consistent.

DA-39 - Search the repository for obsolete Admin navigation, old backup counts, FDMS Lite current-facing references and manual-only updater wording.

DA-40 - Perform final packaged-application walkthrough using only the operator documentation; every consequential operator task must be executable without relying on undocumented product knowledge.

Overall disposition

Audit 12 is complete.

One High documentation safety finding requires remediation before the restore function can be considered acceptably documented for operational use.

The Medium-high and Medium findings require correction or explicit release disposition before final V1 documentation acceptance.

The planned twelve-audit pre-V1 investigation programme is complete. Remediation, regression and release acceptance remain follow-on work.
