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
- current state: `IMPLEMENTING`
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
| `permission-code-metadata` | source definitions, generated contract, persistence, catalog sync/read, deterministic migration/backfill | metadata round-trips without widening authority; missing/invalid/stale data fails closed | in progress |
| `gateway-permission-eligibility` | exact Gateway Permission decision/guard consumer and focused tests | missing route Code/grant/current scope excluded -> `403`; Permission unavailable/malformed/stale -> `503`; zero downstream/side effect | pending |
| `feature-validation-review` | builds, proto checks, focused L1/L2, migration/catalog tests, Global RI | exact candidate and review bundle ready for Stage Review | pending |

## 6. Validation Matrix

- `pnpm proto:lint`
- `pnpm proto:breaking` when generated contracts change
- `pnpm --filter @oes/common build`
- Permission Service focused L1/L2, catalog/migration tests and build
- focused API Gateway Permission tests and build
- protected-scope diff audit, generated-output audit, and exact candidate Global RI

## 7. Delivery State

- Baseline/ref/worktree/owner/path audit: passed at `bb3a1b9c26accb2c95089addddf90ca6d0dd1d4d`
- Dependency: `DEPENDENCY_READY`
- Candidate: pending
- Global RI: pending
- Remote push / PR: pending
- Merge and cleanup: not authorized by this assignment

## 8. Risks And Rollback

- Risk: stale database metadata could silently widen or narrow eligibility. Mitigation: deterministic sync/version comparison and fail-closed reads.
- Risk: Gateway could confuse scope eligibility with target authority. Mitigation: eligibility only filters current granted Codes and does not alter target, Token, STS, cache, or downstream method declaration.
- Rollback before merge: revert only this feature branch commits; preserve all protected refs/worktrees and pre-existing Feature Packets.
