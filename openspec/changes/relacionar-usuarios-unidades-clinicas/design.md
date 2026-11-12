# Design

## Context

See `proposal.md` for motivation and the delta specs for the behavioral contract. The current frontend obtains the session from `/auth/me`, holds only `tenantId` and `activeUnitId` in its session model, uses a static sidebar brand, and queries patients and appointments through the API. Because authorization and data isolation cannot be trusted to the browser, the backend must be the enforcement point.

## Goals / Non-Goals

**Goals:**

- Establish a durable user-to-clinic-unit association that is valid within the user's clinic.
- Make the session carry sufficient organizational display context for the frontend.
- Enforce scheduling and patient visibility by the authenticated user's unit scope.
- Apply the specified legacy-user backfill safely and repeatably.

**Non-Goals:**

- Adding a unit switcher for basic users.
- Reworking tenant ownership, the existing appointment model, or global clinic/unit administration.
- Treating frontend filtering as an authorization mechanism.

## Decisions

### Represent the operational scope with a clinic-unit association

Persist a `clinic_unit` reference for each user and validate that the referenced unit belongs to the user's clinic. The session response exposes the clinic and unit identifiers plus display names required by the client.

This keeps the data relationship explicit and allows API services to derive the scope from authenticated identity. Relying only on a client-supplied `unitId` was rejected because it permits scope tampering; deriving the unit only from appointments was rejected because it cannot define a user's scope before any appointment exists.

### Keep administrator scope clinic-wide

Authorization resolves all clinic units for an administrator, while a non-administrator resolves only the assigned unit. Administrators may still receive the default association created by the migration, but that association does not narrow their effective scope.

Creating one mandatory row per administrator per unit was rejected because it duplicates clinic-wide privilege and requires synchronization whenever a unit is created. Client-side role checks were rejected because they do not protect the API.

### Enforce unit scope in server-side patient and appointment queries

Patient catalog and appointment listing services derive an effective set of allowed units from the authenticated session. For basic users, the effective set is the single associated unit; a requested different unit must not expose data. For administrators, a requested unit must be verified as belonging to their clinic.

The frontend continues to pass view-selection parameters where the contract requires them, but treats API responses as authoritative. Filtering only after the response was rejected because data would already have reached the browser.

### Backfill legacy users with a versioned, idempotent migration

Create a data migration that assigns each existing user to the `MATRIZ` of that user's clinic while preserving all other values. The migration must fail clearly if a clinic has no matrix unit, and it must be safe to rerun.

An ad hoc production update was rejected because it is not reproducible, reviewable, or reliably ordered with the schema change.

### Render organizational names from the session response

Extend the session/profile representation consumed by the frontend with clinic and unit display names. Profile details and the application brand render only API-provided names and retain an explicit unavailable/loading state when absent.

Hard-coded branding was rejected because it can contradict the active authenticated context.

## Risks / Trade-offs

- [A clinic has no MATRIZ] → validate every clinic before assigning users and abort the migration transaction with a diagnosable error.
- [Existing sessions contain the old shape] → deploy the API/session contract before or atomically with the frontend and ensure the frontend handles temporarily absent display names.
- [A query endpoint accepts a unit parameter] → authorize the parameter server-side against the effective scope; do not use it as proof of access.
- [Users may require membership in multiple specific units later] → retain the policy boundary in authorization services so a future membership model can replace the single basic-user association without placing rules in the UI.

## Migration Plan

1. Add the user-to-unit relationship and its clinic-consistency validation.
2. Confirm every clinic has a valid `MATRIZ` for the legacy user population.
3. Execute the idempotent backfill within the database migration, preserving user attributes and administrator privileges.
4. Deploy server-side authorization and session contract changes, then update frontend models and rendering.
5. Verify with administrator and basic-user identities that cross-unit patient and appointment data is not exposed.

Rollback: restore the prior application version only after confirming it tolerates the added association; retain the new relationship and migrated values rather than deleting production associations, since deletion would remove audit-relevant scope data. If a deployment fails before the migration is applied, roll back the application artifact and correct the migration before retrying.
