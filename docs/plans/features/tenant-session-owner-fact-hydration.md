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
- Product candidate: `52d47952ad921bf96b5d76d1d02ea261e3daae30`
- Draft PR: `#48`
- Status: independently reviewed and runtime-verified; waiting for Human merge decision

## Acceptance evidence

- Gateway focused unit: 15/15 passed, including TENANT success and Identity/session tenant mismatch rejection.
- Auth continuation units: 10/10 passed, including token/session tenant mismatch, inactive tenant, and owner projection unavailable.
- Owner-fact transport checks: 3/3 passed for exact target audience, Auth runtime binding, INTERNAL resolver, and Code.
- Auth BFF HTTP integration: 17/17 passed; TENANT session context returned 200 and observed zero `GetTenantById` calls.
- `api-gateway` and `auth-service` builds passed; both spec typechecks passed after standard Proto/Prisma generation.
- Independent Feature RI task `01a052cc-cb52-7113-afd7-42db435e443d` returned PASS with no findings for the exact product candidate.
- Draft PR `#48` Baseline Checks completed successfully; the PR remains Draft and unmerged.
- Changed-file ESLint is currently blocked before rule execution by the repository configuration combining `project` and `projectService`; this does not affect build, typecheck, or executed tests.

## Runtime regression

- Runtime owner task `01a05265-f658-7331-a403-c23ba803a895` returned PASS for the exact product candidate; verification record SHA-256: `7e93d5252b59f2296a55fa4bbe900ecf76db404e03368880f4211c174c3e981b`.
- Baseline login/account-selection/context returned `201/201/500`; the candidate returned `201/201/200`, and access-summary returned `200` with 119 actions and 6 roles.
- The candidate context trace observed zero `GetTenantById` calls and retained `ResolveAuthSessionTenantLifecycle` plus the exact Permission INTERNAL lifecycle evidence.
- Real Chrome reached `/workbench/home` with TENANT shell, navigation, and account display; no new browser warning or error was emitted.
- Account-claim and tenant-claim mismatches each returned `401 APP_AUTH_004`; TenantOrg unavailability returned controlled `500 INFRA_INTERNAL_DEPENDENCY_UNAVALABLE`; a suspended tenant returned `412 AUTH_TENANT_NOT_ACTIVE`.
- Tenant state, services, sessions, token-bearing temporary files, and the main runtime were restored; the recovered context and access-summary both returned `200`.
