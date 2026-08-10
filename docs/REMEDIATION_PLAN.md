# Vectair Flite Pre-V1 Remediation Plan

Status: ACTIVE
Established: 10 August 2026
Audit baseline completed at: cd01c9c
Remediation register added at: 3f19b7a

## 1. Purpose

The twelve-audit Pre-V1 investigation programme is complete.

This document converts that evidence into an ordered engineering programme.

The objective is not to fix findings sequentially by audit number.

The objective is to correct systemic root causes in dependency order, verify the resulting behaviour, close the affected findings with evidence, and produce one accepted immutable V1 release candidate.

## 2. Controlling evidence

The remediation programme uses four complementary records:

- `docs/audit.md` — audit programme summary;
- `docs/audit_findings.md` — detailed findings and acceptance specifications;
- `docs/vectair_flite_remediation_register.xlsx` — remediation control register;
- this file — ordered implementation strategy.

The audit documents remain historical evidence.

Do not delete or rewrite findings because they have subsequently been remediated.

## 3. Closure model

Every finding must eventually have one disposition:

- Remediated
- Accepted for V1
- Deferred post-V1
- Requires further evidence

A remediation ticket is complete only when the relevant failure mode has been verified as closed.

Required evidence may include:

- implementation commit;
- automated regression;
- failure-injection result;
- restart-level verification;
- installed-Tauri verification;
- packaged installer/update verification;
- operator/manual acceptance.

## 4. Engineering rules

For each ticket:

1. inspect current `main`;
2. identify the exact audit findings/register rows addressed;
3. identify the root cause;
4. make the smallest coherent architectural change;
5. specify non-goals;
6. preserve unrelated behaviour;
7. add or update automated tests where practical;
8. perform required manual/package acceptance;
9. record the implementation commit;
10. update remediation status only after verification.

Do not hand the complete audit document to an implementer with a broad instruction to "fix the audit."

## 5. Phase 0 — Baseline and control

Before each remediation wave:

- confirm current `main`;
- preserve unrelated dirty local files;
- use the remediation register as the control ledger;
- do not redistribute another installer under version `0.9.4`;
- avoid new feature work unless it is required to complete remediation.

## 6. Phase 1A — Runtime resource profiling

### Objective

Investigate reports that leaving Flite open noticeably slows some workstations.

This is an evidence-gathering workstream and may run in parallel with Phase 1B.

### Measure

- parent Flite process CPU;
- WebView2 child-process CPU;
- private working set / RAM;
- process count;
- memory growth over time;
- idle CPU over a sustained period;
- periodic CPU spikes;
- JavaScript long tasks;
- render frequency;
- localStorage write frequency;
- Live Board versus other tabs;
- representative small and mature datasets;
- foreground versus minimised behaviour;
- startup cost.

### Output

Produce:

- reproducible test procedure;
- representative machine specification;
- baseline measurements;
- ranked hotspots;
- evidence linking hotspots to source pathways where possible;
- separate optimisation tickets based on measured results.

Do not optimise based only on static audit suspicion.

## 7. Phase 1B — Result-bearing persistence contract

### Objective

Make the persistence boundary distinguish durable success from failure.

The current architecture frequently treats in-memory mutation as evidence that data was saved.

### Required outcome

Storage writes and removals return explicit structured results.

Callers must be able to distinguish at least:

- success;
- storage unavailable;
- quota/write failure;
- serialization failure where applicable;
- verification failure where verification is required.

### Acceptance

Failure injection must prove that:

- callers receive failure;
- false-success UI acknowledgement can be prevented;
- valid durable state is not silently replaced by an empty/in-memory-only version;
- the result contract is usable by later domain-command work.

This is the foundation of the principal architectural remediation chain.

## 8. Phase 2 — Degraded-storage mode

Once storage failure is detectable, Flite must not continue behaving as though it is a healthy writable operational system.

Introduce an explicit application storage-health state.

Consequential writes must be blocked or safely constrained when durable persistence is unavailable.

Operators must receive a clear persistent warning.

Existing data should remain readable where safe.

## 9. Phase 3 — Transactional restore

Redesign restore around:

1. complete validation before mutation;
2. pre-restore snapshot/staging;
3. verified writes;
4. replace-versus-overlay semantics defined explicitly;
5. dynamic generic-overflight handling;
6. cross-dataset post-write validation;
7. rollback if required writes fail;
8. explicit cache/application reinitialisation;
9. unambiguous success or failure.

Target contract:

```text
RESTORE SUCCEEDED

or:

RESTORE FAILED — ORIGINAL STATE PRESERVED

A failed restore must not leave an uncontrolled hybrid installation.

10. Phase 4 — Authoritative domain-command layer

Consequential UI handlers must stop coordinating domain policy and multi-store persistence directly.

Introduce commands such as:

createMovement(...)
completeMovement(...)
cancelMovement(...)
deleteMovement(...)
restoreMovement(...)
reinstateMovement(...)
createBookingWithStrip(...)
deleteBooking(...)

Each command owns:

validation;
lifecycle policy;
related-record mutation;
durable persistence;
rollback/incomplete-operation handling;
audit generation;
structured result.

The UI reacts to the result rather than assuming success.

11. Phase 5 — High-risk lifecycle migration

Migrate in controlled order.

Cancellation

Unify:

recovery snapshot;
movement status;
formation cascade;
booking synchronisation;
audit event.
Deletion / Deleted Strips

Guarantee that recoverability is never claimed unless recovery state was durably preserved.

Restoration / reinstatement

Prevent stale actuals, stale booking links and unsafe recovery-record removal.

Booking + Strip

Successful completion must guarantee:

booking exists
movement exists
booking points to movement
movement points to booking

Normal creation must no longer depend on startup reconciliation to finish its reciprocal relationship.

12. Phase 6 — Stable entity identity

Introduce immutable entity-incarnation identity distinct from recyclable/human-facing numeric identifiers.

Historical, audit and recovery records must reference the correct entity incarnation.

Migration and backward compatibility must be explicitly designed.

13. Phase 7 — Cross-dataset integrity scanner

Create one general scanner capable of detecting at least:

duplicate primary identities;
duplicate immutable identities;
one-sided booking links;
multiple movements claiming one booking;
orphaned formation relationships;
ambiguous recovery references;
contradictory lifecycle state;
stale references;
incomplete operations.

Initially prefer detection and operator-visible diagnosis over aggressive automatic repair of ambiguous states.

Run after startup and restore where appropriate.

14. Phase 8 — Canonical operational-time model

Define before implementing:

operational date;
canonical stored time/instant;
local display rules;
Europe/London DST handling;
midnight crossing;
next-day semantics;
retrospective-entry semantics.

Then reconcile:

DEP;
ARR;
LOC;
OVR;
formations;
Booking;
Calendar;
History;
Reports;
Monthly Return;
exports;
autoactivation.

Do not continue adding isolated timezone patches without the canonical model.

15. Phase 9 — Workflow consolidation

After the domain layer exists:

Save / Save & Complete

Use one canonical movement builder and validation model.

Activation

Unify manual and automatic activation lifecycle rules.

Booking lifecycle

Unify Booking-originated cancellation, deletion and unlinking with canonical movement commands.

16. Phase 10 — Security hardening

Address:

bounded import size;
bounded record count/nesting;
record-level schema validation;
spreadsheet-formula-safe CSV/XLSX encoding;
audit-log retention;
audit-corruption preservation;
backup/export privacy warnings;
diagnostic redaction;
native payload limits;
signing-key/release-process hardening.
17. Phase 11 — Accessibility

Implement as a coordinated UI workstream:

global visible keyboard focus;
remove document-level Enter-to-save behaviour;
central accessible modal service;
keyboard access to all consequential controls;
accessible sortable headers and menus;
complete labels and names;
central live-region/status model;
focus preservation after rerender;
contrast and minimum-readable-text corrections;
packaged keyboard/screen-reader acceptance.
18. Phase 12 — Performance optimisation

Generate optimisation tickets from Phase 1A evidence.

Likely candidates identified statically by Audit 8 include:

repeated full-dataset scans;
repeated JSON parsing;
repeated reference-data reconstruction;
Hours Log reparsing;
unnecessary rerendering;
large localStorage rewrites;
unbounded rendering;
recurring alert/reconciliation calculations.

These remain hypotheses until profiling confirms material runtime cost.

19. Phase 13 — Release engineering

Before another installer is distributed:

assign a unique version newer than 0.9.4;
align all version-bearing manifests;
embed/expose immutable source SHA;
build from exact accepted ref/tag;
require clean working tree;
run required tests;
sign accepted artefacts;
retain hashes;
define supported installer technology;
test in-app updater;
test manual NSIS upgrade;
establish uninstall/reinstall data contract;
establish downgrade compatibility policy;
test WebView2 clean-install scenarios;
perform acceptance using artefacts downloaded back from the public release.
20. Phase 14 — Documentation synchronisation

Update documentation after underlying behaviour stabilises.

Priority areas:

restore safety;
updater lifecycle;
backup coverage;
automatic activation;
Booking-to-Strip behaviour;
operational workflow coverage;
Monthly Return claims;
timing specification;
strip lifecycle specification;
install/uninstall/reinstall/downgrade contracts;
release provenance.

Introduce one current-document authority/status index.

Archive or clearly classify obsolete FDMS Lite/demo/planning material.

21. Phase 15 — Full regression

Do not repeat twelve broad exploratory audits.

Execute the acceptance specifications already derived from them.

Regression must cover as applicable:

storage failure injection;
partial-operation failure injection;
restore rollback;
restart-level durability;
relationship integrity;
duplicate/idempotency behaviour;
BST and midnight scenarios;
large-dataset performance;
accessibility/keyboard operation;
hostile imports and spreadsheet-safe exports;
installed-Tauri parity;
clean install;
updater;
manual upgrade;
uninstall/reinstall;
supported downgrade.
## 22. Phase 16 — Release candidate and V1 acceptance
Freeze one immutable candidate.
Assign the intended release version.
Run complete regression.
Build and sign.
Install the packaged artefact.
Perform operator acceptance.
Resolve release-only defects.
Update the remediation register.
Record finding dispositions.
Update final product documentation.
Publish accepted artefacts.
Verify the public-download artefacts.
Release V1 only after acceptance.
23. Initial ticket order

The current intended order is:

T25 — Runtime resource profiling                  parallel evidence work
T1  — Result-bearing persistence contract         architectural start
T2  — Degraded-storage/read-only mode
T3  — Transactional restore core
T5  — Authoritative domain-command framework
T9  — Verified cancel/delete/recovery commands

then:

Atomic Booking + Strip creation
Reinstatement/restore lifecycle
Stable entity-incarnation identity
Cross-dataset integrity scanner
Canonical operational-time model
Save / Save & Complete unification
Activation lifecycle unification
Booking lifecycle consolidation
Security hardening
Accessibility foundation
Measured performance optimisation
Release engineering
Documentation synchronisation
Full regression
Release-candidate acceptance

Ticket numbers already present in the remediation register should remain authoritative where assigned.

## 24. Immediate next action

Start a fresh implementation chat.

The first chat should:

verify current main;
read this plan and the remediation register;
inspect the relevant Audit 8 performance evidence;
define and execute T25 — Runtime Resource Profiling;
make no speculative performance optimisations during the profiling ticket;
preserve the existing unrelated local working-tree files.

T1 — Result-bearing Persistence Contract is the first code-remediation ticket and may be prepared or executed in parallel/sequentially after T25 depending on workflow.
