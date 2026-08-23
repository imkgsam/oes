# Permission Code Scope Eligibility

> 本 Feature Packet 只记录 `permission-code-scope-eligibility` 的当前执行状态。稳定语义以 [Permission Code Source](../../architecture/platforms/permission-code-source.md)、[Role Based Permission Resolution](../../architecture/platforms/role-based-permission-resolution.md)、[Gateway And BFF](../../architecture/platforms/gateway-and-bff.md) 与 [Tenant Target Binding Contract](../../contracts/api-gateway/tenant-target-binding.md) 为准。

## 1. Binding

- featureKey: `permission-code-scope-eligibility`
- owner task: `01a018eb-c18d-7072-a9f2-e1b3f10328d8`
- direct parent / callback: `01a018ca-2756-7643-9f5e-2765d9245473`
- stageKey: `gateway-tenant-target-binding-delivery`
- transitionId: `sl-assign:gateway-tenant-target-binding-delivery:permission-code-scope-eligibility:75b66c30753ba533`
- canonical truth baseline: `bb3a1b9c26accb2c95089addddf90ca6d0dd1d4d`
- integration branch: `codex/feature/permission-code-scope-eligibility`
- current state: `PR_READY + READY_FOR_STAGE_REVIEW`
- stop point: `PR_READY + READY_FOR_STAGE_REVIEW`

## 2. Objective

将 Permission Code `allowedScopeLevels` 从静态源码贯通到生成契约、持久化、catalog sync、读取与 Gateway Permission 决策，使 `TENANT`、`SYSTEM` 和双 scope eligibility 可确定执行，并对缺失、非法或陈旧 metadata fail closed；该 eligibility 不创建 tenant target authority。

## 3. Allowed Scope

- `src/common/src/authorization/permission-codes/**`
- `src/common/src/contracts/permission_service/**` 及仅由仓库生成器产生的必要输出
- `src/services/system/permission-service/**` 中 Permission Code metadata、catalog、持久化/sync/migration、eligibility 与聚焦测试
- API Gateway 中消费 effective `allowedScopeLevels` 所必需的 Permission decision/guard 文件及聚焦测试
- 本 Feature Packet

## 4. Protected Scope

- 已冻结 architecture、ADR 与 contracts
- Execution Token、STS request 与 Token cache key 不增加 target tenant
- 不新增 Gateway targetability decorator、通用 route opt-in 或 fine-grained SYSTEM range
- 保持 Site Management P1 binding-stage 的精确 SYSTEM deny
- 不进入 tenant-target carrier、route migration、Tenant Org/Common admission
- 不修改无关 domain/schema/frontend/service 或任何既有 Feature Packet，特别是 `authorization-layering-rollout.md`
- 不修改或接管任何既有 task、branch 或 worktree

## 5. Slices

| Slice | Scope | Acceptance | Status |
| --- | --- | --- | --- |
| `permission-code-metadata` | source definitions, generated contract, persistence, catalog sync/read, deterministic migration/backfill | metadata round-trips without widening authority; missing/invalid/stale data fails closed | completed |
| `gateway-permission-eligibility` | exact Gateway Permission decision/guard consumer and focused tests | missing route Code/grant/current scope excluded -> `403`; Permission unavailable/malformed/stale -> `503`; zero downstream/side effect | completed |
| `feature-validation-review` | builds, proto checks, focused L1/L2, migration/catalog tests, Global RI | exact candidate and review bundle ready for Stage Review | completed |

## 6. Validation Matrix

- `pnpm proto:lint`
- `pnpm proto:breaking` when generated contracts change
- `pnpm --filter @oes/common build`
- Permission Service focused L1/L2, catalog/migration tests and build
- focused API Gateway Permission tests and build
- protected-scope diff audit, generated-output audit, and exact candidate Global RI

## 7. Delivery State

- Baseline/ref/worktree/owner/path audit: passed at `bb3a1b9c26accb2c95089addddf90ca6d0dd1d4d`
- Latest `origin/main`: `5566a5fa77fbce76a321e2dcaca670af8730ca21`, merged with `--no-ff` as `ac70f8a02de81c15811f217ab1d7f84c8b2127c4`
- Dependency: `DEPENDENCY_READY`
- Accepted metadata slice: `f534f258b501dd0026963d82b87999af4db0c6ca`
- Accepted Gateway slice: `64e42161bf2f92bdaf6d19fd5de16b6687426729`
- Refreshed reviewed code candidate: `ac70f8a02de81c15811f217ab1d7f84c8b2127c4`
- The previous Stage Review on `1e40f0d02b3f4d5aae316cb6dd0cf3aea37b8846` was invalidated when Admission PR #12 advanced `main`; this refreshed candidate requires a new exact Stage Review.
- Global RI: `RI_PASS` on the refreshed reviewed code candidate with no code findings; Admission and Permission parent path intersection is empty, guard ordering remains compatible, and the prior seed validator finding remains closed
- Pull request: [#13](https://github.com/imkgsam/oes/pull/13), base `main`
- Refreshed validation:
  - `pnpm proto:lint`, `pnpm proto:breaking`, `pnpm proto:gen`: exit `0`
  - Prisma generate and isolated PostgreSQL schema push: exit `0`
  - `pnpm --filter @oes/common build`: exit `0`
  - affected Admission/Common focused validation: `3` suites / `93` tests passed, exit `0`
  - Permission Service build: exit `0`
  - Permission L1: `76` suites / `328` tests passed, exit `0`
  - focused Permission L2: `1` suite / `7` tests passed, exit `0`
  - isolated database catalog `--apply` followed by seed validation: `validationErrors: []`, exit `0`
  - focused Gateway Permission: `1` suite / `22` tests passed, exit `0`
  - API Gateway build and protected-scope/diff audits: exit `0`
- Merge and cleanup: not authorized by this assignment

## 8. Risks And Rollback

- Risk: stale database metadata could silently widen or narrow eligibility. Mitigation: deterministic sync/version comparison and fail-closed reads.
- Risk: Gateway could confuse scope eligibility with target authority. Mitigation: eligibility only filters current granted Codes and does not alter target, Token, STS, cache, or downstream method declaration.
- Remaining operational risk: migrated rows intentionally remain fail closed until the deterministic catalog sync writes current metadata and fingerprints.
- Rollback before merge: revert only this feature branch commits; preserve all protected refs/worktrees and pre-existing Feature Packets.
