# Tenant Target Admission Foundation

featureKey: `tenant-target-admission-foundation`
truthCommit: `bb3a1b9c26accb2c95089addddf90ca6d0dd1d4d`
baseSha: `bb3a1b9c26accb2c95089addddf90ca6d0dd1d4d`
integrationBranch: `codex/feature/tenant-target-admission-foundation`
worktreeKey: `11c0`
pullRequest: `pending`
mergeSha: `pending`
cleanup: `HOLD`
state: `RUNNING`

## Objective

Provide Common target-service tenant-selector admission primitives that enforce exact TENANT equality and allow tenantless SYSTEM execution only on explicitly dedicated target-owned methods with exact Gateway workload, canonical Permission Code, and current `ALL` range.

## Slices

### tenant-target-declaration-and-admission-core

state: `RUNNING`
candidate: `pending`
review: `global-ri`

- Scope: Common canonical tenant-selector parsing; immutable target-owned TENANT/SYSTEM method declarations; selector admission and audit-binding result primitives; focused unit tests and Common barrel exports.
- Protected scope: frozen architecture/ADR/contracts; Execution Token, STS request and Token cache-key shapes; Gateway targetability and route behavior; Site Management P1 denial; every pre-existing Feature Packet; unrelated services, schemas, frontends and domains.
- Dependencies: exact canonical truth `bb3a1b9c26accb2c95089addddf90ca6d0dd1d4d`; none among stage features.
- Acceptance: TENANT exact equality succeeds; mismatch fails 403 semantics. SYSTEM is tenantless; ordinary or explicit-deny methods reject. Dedicated SYSTEM admission requires exact Gateway workload, one canonical Code and `ALL`; every mismatch and malformed declaration/context/selector/audit binding fails closed before resource access.

### trusted-execution-guard-integration

state: `READY`
candidate: `pending`
review: `global-ri`

- Scope: integrate target-service selector admission into Common trusted-execution guard ordering and verified request context; focused guard tests for zero attachment/resource-access on failure; narrowly required Common exports and fixtures.
- Protected scope: frozen architecture/ADR/contracts; Execution Token, STS request and Token cache-key shapes; Gateway targetability and route behavior; Site Management P1 denial; every pre-existing Feature Packet; unrelated services, schemas, frontends and domains.
- Dependencies: accepted `tenant-target-declaration-and-admission-core` candidate.
- Acceptance: token/workload/Permission/method admission precedes selector authorization; only an admitted normalized selector and audit binding reach verified request context; unknown scope, ambiguous provenance, missing/invalid declaration/context or audit binding failure rejects with 403 semantics and no request attachment or later access.

## Feature acceptance

- Focused Common unit/integration tests cover TENANT equality/mismatch plus SYSTEM ordinary-method/explicit-deny, exact workload, same canonical Code and `ALL` range success/failure cases.
- Selector remains business input and is absent from credentials, trusted metadata, Execution Token claims, STS fields and Token cache keys.
- `pnpm --filter @oes/common build` passes; proto lint/breaking run only if executable contract expression changes.
- Exact slice candidates remain feature candidate ancestors; Global RI reviews the exact integrated candidate; push and PR target `main`, then stop at `PR_READY + READY_FOR_STAGE_REVIEW` before merge.
