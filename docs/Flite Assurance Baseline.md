1. System Definition

Defines what Flite is and is not.

Suggested wording:

Flite is a local-first airfield operations support and record-keeping application intended for small aerodrome and Visual Control Room environments. It supports flight-progress recording, booking, METAR composition, reference lookup, reporting, data export and operational audit. It does not provide surveillance, separation assurance, conflict detection, AFTN/AMHS messaging, communications switching, navigation, or automated ATC decision-making.

That sentence is important. It protects you from overclaiming and defines the regulatory boundary.

2. Operational Concept

Describe the Copperchase-style always-on shared-workstation model:

app is started and left running
shared VCR workstation
no mandatory per-user login for V1
used by multiple VCR staff
basic functions must be obvious
advanced functions documented
fallback to existing/manual process if unavailable
data backed up routinely
update procedure controlled

This also explains why mandatory operator identity is not V1.

3. Requirements Register

Write requirements as testable statements:

REQ-LB-001: The system shall allow creation of LOC, DEP, ARR and OVR movement records from the Live Board.

REQ-AUD-001: The system shall record an audit event when a movement record is created, edited, cancelled, deleted, restored or completed.

REQ-LOG-001: The system shall record unhandled JavaScript errors, unhandled promise rejections and failed Tauri command invocations to a persistent diagnostic log.

REQ-BKP-001: The system shall export and restore all operational local data required to reconstruct the current application state.

Every future feature should map back to a requirement.

4. Hazard Log

This is where aviation professionalism starts to show.

Examples:

Hazard	Consequence	Mitigation
Strip lost or not saved	Missing operational record	save confirmation, audit log, backup, data integrity check
Booking created but strip not linked	Booking/ops mismatch	link validation, reconcile logging, visible linked-strip status
Incomplete METAR copied	Incorrect weather report use	disabled copy until valid, validation message, audit event
User deletes instead of cancels	Loss of intended audit record	deleted-strip recovery, clearer wording, confirmation modal
Report count wrong	Incorrect monthly return	defined counting rules, test cases, export review
App crashes during ops	Loss of confidence / incomplete records	persistent logs, autosave, recovery, fallback procedure
Update fails mid-use	Operational interruption	controlled update workflow, no auto-install, rollback installer
5. Verification Matrix

Each requirement gets a test.

Example:

Requirement	Test
REQ-LB-001	Create LOC/DEP/ARR/OVR in packaged app
REQ-AUD-001	Confirm audit entries created for movement lifecycle
REQ-BKP-001	Backup, wipe, restore, compare data counts and linked records
REQ-METAR-001	Attempt to copy incomplete METAR; verify blocked

This is the bridge toward future certification/assurance work.

6. Audit and Logging Specification

This is now central to your professional positioning.

Two tracks:

Operational audit trail: user/business events, data changes, before/after, entity IDs.
Technical diagnostic logs: errors, failures, stack traces, performance, startup, storage, updater, environment.

For V1, operator identity can be shared_vcr_workstation rather than user-specific.

7. Configuration and Release Control

Define:

version numbering
release branches
release notes
build procedure
signing-key handling
updater artefacts
rollback procedure
installer retention
smoke-test evidence
known-issues list
8. Security Baseline

Current app already has some good foundations: restrictive CSP is now present in tauri.conf.json, and the Tauri capability set is relatively minimal from earlier inspection. Current CSP includes self-only script, connect, font and object restrictions, with inline style allowance.

For the baseline, document:

local-first data model
no external dependency for normal operation
update signature process
data backup/export
logging redaction rules
no secrets in repo/chat
restricted Tauri permissions
release signing plan
How to handle operator identity

Your position is reasonable.

For V1:

Operator identity: not mandatory.
Operating model: shared VCR workstation.
Audit attribution: machine/session/action-based, not person-based.

For post-V1:

Optional operator identity module:
- operator initials
- shift handover identity
- PIN/role option
- facility can enable/disable
- admin-only actions can require identity

This is better than forcing a workflow that does not match the real VCR environment.

In the audit trail, record:

{
  "operatorMode": "shared_workstation",
  "operatorId": null,
  "sessionId": "sess_20260709_0812",
  "workstationId": "EGOW-VCR-01"
}

If a facility later wants named attribution, the schema already supports it.

What not to build yet

For V1, do not overbuild:

no full user account system
no role-based access control unless simple/admin-only
no claims of certification
no AFTN/AMHS architecture
no surveillance/control integrations
no ISO audit bureaucracy for its own sake
no DO-178-style artefact burden

The aim is evidence-based professional development, not paperwork theatre.

Product positioning language

I would describe Flite like this:

Flite is a lightweight airfield operations and flight-progress recording system for small aerodromes and Visual Control Room environments. It is designed for facilities that need more structure, traceability and reporting than spreadsheets or ad-hoc Office workflows, but do not require a full airport systems suite or extensive ATS equipment integration.

That fits your Copperchase/Redstone comparison.

For assurance:

Flite is developed under a standards-informed assurance approach, drawing from ISO 9001 quality-management principles, DO-278A/ED-109A-style software assurance concepts for ground aviation systems, and UK ATS safety-case thinking. It is not presented as certified ATS equipment unless and until a specific certification path is undertaken.

That is honest and strong.

Revised strategic target

For V1 EGOW:

Operationally robust local-first VCR tool.

For post-V1 commercial readiness:

Assurance-ready small-aerodrome operations platform.

For later certified/safety-case use:

Traceable, auditable, requirements-tested aviation operations software with a defined system boundary and evidence pack.
