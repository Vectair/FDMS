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
