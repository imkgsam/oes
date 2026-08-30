# Tenant Session Owner-Fact Hydration

## Scope

Repair TENANT Web `GET /auth/session/context` after successful account selection without granting the fixed Auth workload or Gateway a generic TenantOrg BUSINESS capability.

## Frozen truth

- `auth-service` owns session establishment and continuation decisions.
- TENANT lifecycle validation uses only TenantOrg `ResolveAuthSessionTenantLifecycle`, the exact Auth SYSTEM MACHINE workload, target audience, current certificate binding, and `tenant_org.internal.auth_session_tenant_lifecycle.resolve`.
- `tenant-org-service.GetTenantById` remains a BUSINESS projection and is not part of Auth login/session safety.
- The SYSTEM design-gap lane is protected and excluded.

## Candidate slices

1. Remove the duplicate Gateway `GetTenantById` dependency from authenticated shell hydration and consume the Auth-validated session snapshot.
2. Preserve strict account/session tenant equality and fail closed on missing, mismatched, inactive, or unavailable lifecycle truth through Auth token validation.
3. Add focused unit and HTTP integration coverage proving TENANT success and the protected failure paths.

## Acceptance

- A selected active TENANT session hydrates `/auth/session/context` without a TenantOrg BUSINESS call.
- A token/account tenant mismatch is rejected before shell hydration.
- An inactive tenant is rejected by Auth session continuation.
- TenantOrg lifecycle dependency failure fails closed and no shell payload is returned.
- SYSTEM behavior and its separate design-gap lane are unchanged.
- Focused unit, contract/integration, typecheck/build as applicable, and runtime-owner Chrome regression steps are reproducible.

## Current state

- Owner: `[FL] Tenant Session Owner-Fact Hydration`
- Direct parent: `01a052a5-81d6-7322-a8ba-59b818f8b8fe`
- Base: `origin/main@0c8adcaf382c09fb56d9790b44a02de783a63ea8`
- Branch: `codex/tenant-session-owner-fact-hydration`
- Status: candidate preparation

## Acceptance evidence

- Gateway focused unit: 15/15 passed, including TENANT success and Identity/session tenant mismatch rejection.
- Auth continuation units: 10/10 passed, including token/session tenant mismatch, inactive tenant, and owner projection unavailable.
- Owner-fact transport checks: 3/3 passed for exact target audience, Auth runtime binding, INTERNAL resolver, and Code.
- Auth BFF HTTP integration: 17/17 passed; TENANT session context returned 200 and observed zero `GetTenantById` calls.
- `api-gateway` and `auth-service` builds passed; both spec typechecks passed after standard Proto/Prisma generation.
- Changed-file ESLint is currently blocked before rule execution by the repository configuration combining `project` and `projectService`; this does not affect build, typecheck, or executed tests.

## Runtime regression handoff

The original runtime owner must replay the successful TENANT account-selection flow, then verify `/auth/session/context` and `/auth/session/access-summary` in the task-owned stack and Chrome. It must also exercise tenant mismatch, inactive tenant, and TenantOrg dependency failure, confirming no shell payload is emitted for rejected session continuation.
