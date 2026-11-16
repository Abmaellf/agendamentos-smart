# Design

## Context

See proposal.md and the delta specs for the behavioral contract. The codebase
already has a single persisted Appointment model and its creation service
derives the clinic from the authenticated user, validates unit/patient/service/
professional compatibility, serializes creation by clinic, detects overlap and
capacity, and accepts an idempotency key.

The SPEC 01 change is still in progress in both repositories. Its package
definition is therefore a dependency, not evidence that a production contract
is already available. The observed package model contains unit, service,
sessions, price, active status and weekdays, but no professional, time,
operational calendar, holiday or unit-hours source. The current appointment
service has no calendar/holiday API and receives an explicit start instant.

## Goals / Non-Goals

**Goals:**

- Add a patient-specific package contract without duplicating Appointment.
- Reuse one domain path for manual and batch appointment validation/persistence.
- Keep the package's configured weekdays as defaults while snapshotting distinct
  effective weekdays chosen during contracting.
- Make preview non-reserving, confirmation atomic, and repeated confirmation
  idempotent.
- Reuse the existing manual appointment controls for date and time, while
  keeping calendar, holiday and operational-block validation explicitly out of
  scope for this change.

**Non-Goals:**

- Create a holiday provider, unit operating-hours configuration, calendar block
  module or arbitrary default hour in this change.
- Decide replacement, cancellation entitlement, absence consumption,
  reimbursement, transfer to another patient or financial settlement.
- Change the existing manual POST /api/appointments contract, or make
  professional mandatory when the existing appointment policy allows it to be
  optional.
- Make a preview a temporary reservation or silently reschedule a conflict.

## Decisions

### Model a package contract separately and link existing appointments optionally

The API sister will add a PACKAGE_CONTRACT (or project-conventional equivalent)
for the patient-specific transaction. It will reference the source service
package, patient, clinic, unit and creator, and will persist a snapshot of the
selected service, total sessions, total price, effective weekdays, derived
frequency, requested start date, effective first/last dates, scheduling policy
identity and audit/version data.

The effective weekdays belong to the contract, not SERVICE_PACKAGE. A normalized
child collection with uniqueness per contract/day is preferred over a JSON field
because the set must be validated, queried and protected against duplicates. The
contract may additionally retain the source package's original weekday set for
audit, but schedule calculation always uses the effective set.

APPOINTMENT will receive a nullable relationship to the contract. This preserves
every existing appointment and allows one contract to own many normal
appointments. A separate appointment table, copied appointment state, or an
array of appointment ids in the contract is rejected because it would fork the
existing availability/status behavior or weaken referential integrity.

### Reuse appointment creation rules through a shared booking boundary

AppointmentService.create currently combines scope loading, validation,
conflict/capacity checks and persistence. Before batch confirmation, the API
will extract an internal reusable booking boundary that accepts resolved
appointment commands and can run in preview or persistence mode. Manual
creation continues to call that same boundary with one command.

Preview mode calculates all commands and applies the same eligibility/conflict
checks without writing appointments. Confirmation takes the clinic lock once,
rebuilds the commands from authoritative data, runs the shared checks again,
creates the contract and persists all appointments in one transaction.

Calling the public manual create endpoint/service once for each session is
rejected: it would make one package confirmation appear as several independent
operations, misuse one idempotency key on multiple Appointment rows, and make
rollback/error reporting harder to guarantee.

### Reuse the manual appointment flow for date, time and booking rules

Package mode uses the same appointment form controls for patient, unit, service,
minimum date and time. The selected manual time is reused for every generated
session; no default or alternate time is invented. The date generator walks
forward from the minimum local date and includes only the configured effective
weekdays until the exact package session count is reached. It does not consult
or infer holidays, unit operating hours or operational blocks in this change;
those validations are deferred to a future specification.

Creation and preview reuse the existing AppointmentService booking boundary for
duration, price, optional professional, patient/professional conflicts and
capacity. The package flow therefore does not create a second interpretation of
manual appointment rules.

### Make preview reproducible but never a reservation

POST /api/package-appointments/preview will accept package id, patient id,
unit context when allowed, minimum start date and effective weekdays. Its
response contains all sessions, local dates/times, availability/conflicts,
first/last effective date and a server-generated previewFingerprint.

The fingerprint represents the authoritative inputs and relevant package/
calendar/scheduling-policy revisions used for the simulation. Confirmation
includes it and an Idempotency-Key. The server must recompute and compare it,
then revalidate availability under the clinic lock. A mismatch yields an
explicit stale-preview response; a conflict that appeared after preview yields
a conflict response. Neither result creates a partial contract.

Persisting preview rows or holding database locks between preview and confirmation
is rejected because previews must not reserve capacity and long-lived locks would
harm availability.

### Separate eligibility reads from administrative package management

SPEC 01's observed package controller is administrator-only and exposes
administrative data. The API should add a dedicated eligibility read under the
package-appointment resource (for example,
GET /api/package-appointments/eligible-packages?unitId&serviceId) rather than
broadening the administrative list implicitly. The resource derives clinic/user
scope on the server and returns only fields needed to choose an active package.

The exact external naming must follow the API sister's conventions during
implementation, but the contracts below are the semantic target:

| Operation | Conceptual contract | Key guarantees |
| --- | --- | --- |
| List eligible packages | GET /api/package-appointments/eligible-packages?unitId&serviceId | Active, authorized, minimal read model |
| Generate preview | POST /api/package-appointments/preview | No persistence/reservation; returns all sessions and fingerprint |
| Confirm contract | POST /api/package-appointments + Idempotency-Key | Atomic creation, revalidation and duplicate protection |
| Read contract | GET /api/package-contracts/{id} | Snapshot plus linked appointment states in authorized scope |

### Preserve source-package immutability and contract history

The new contract is the concrete usage relation that SPEC 01's
ServicePackageUsageService must query. Once confirmation persists a contract
and its appointment links, later updates or status changes of the source package
are refused according to SPEC 01. The contract's snapshot remains authoritative
for its existing sessions even if future product policy later permits package
revisions.

## Risks / Trade-offs

- [SPEC 01 is not yet completed or integration-tested] → do not begin this
  implementation until its API contract, migration and authorization behavior
  are delivered and validated in the API sister.
- [No holiday, unit-hours or calendar-block source was found] → keep those
  validations out of this change and record them as a follow-up specification;
  do not infer a calendar result.
- [No automatic hour policy was found] → require the explicit time selected in
  the existing manual appointment flow; do not use a guessed default.
- [Current validation is embedded in AppointmentService.create] → extract and
  cover a shared boundary with regression tests before using it for the batch.
- [Preview can become stale] → include fingerprint, recompute at confirmation
  and revalidate under the same clinic lock used to prevent manual-booking
  races.
- [One clinic-wide pessimistic lock can limit parallelism] → retain the existing
  correctness model first; profile batch duration and consider narrower locking
  only in a separately validated scalability change.
- [Cancellation/replacement policies are undecided] → snapshot and expose
  linked status only; do not infer financial/session-consumption effects.

## Migration Plan

1. Complete and validate SPEC 01 in the API sister, including the package usage
   lookup boundary and authorization contract.
2. Reuse the manual appointment date/time controls and defer operational-calendar,
   holiday and block validation to a future specification.
3. Add contract and effective-weekday persistence plus a nullable foreign key
   from appointments, with indexes and uniqueness for contract idempotency.
   Existing appointments receive NULL and remain unchanged.
4. Refactor appointment validation into the shared booking boundary, then add
   preview and atomic confirmation endpoints behind integration tests.
5. Add the frontend flow and replace the temporary topbar action only after the
   API contract is available; retain the manual dialog untouched.
6. Deploy the database migration before application code that writes contracts.
   If rollback is needed after data exists, disable the package-scheduling entry
   and writes; do not delete contracts or linked appointments. Keep the nullable
   relationship and migration in place to preserve historical integrity.
