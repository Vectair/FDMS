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
Admin → Calendar is only a roadmap placeholder.
Admin → Reports is only a roadmap placeholder.
Admin → Cancelled is only a roadmap placeholder.
Admin → Booking combines real Booking Profile management with a future “Booking Rules & Charges” panel.
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
Initial page load sets “Has CUIW” to unchecked, but Reset changes it to checked. This can remove the £25 waiver charge without deliberate operator action.
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