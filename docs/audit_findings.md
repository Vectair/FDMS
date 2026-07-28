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
