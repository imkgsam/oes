# Gateway Tenant Target Binding Runtime

> 本 Feature Packet 只记录 `gateway-tenant-target-binding-runtime` 的当前执行状态。稳定语义以 [Gateway And BFF](../../architecture/platforms/gateway-and-bff.md)、[Authorization Layering And Resource Policy](../../architecture/platforms/authorization-layering-and-resource-policy.md)、[Execution Token](../../contracts/auth-service/execution-token.md) 与 [Tenant Target Binding Contract](../../contracts/api-gateway/tenant-target-binding.md) 为准。

## 1. Binding

- featureKey: `gateway-tenant-target-binding-runtime`
- owner task: `01a018f4-9c5e-72f3-a5d7-d9bcd8d54f40`
- direct parent / callback: `01a018ca-2756-7643-9f5e-2765d9245473`
- stageKey: `gateway-tenant-target-binding-delivery`
- transitionId: `sl-provision:gateway-tenant-target-binding-delivery:gateway-tenant-target-binding-runtime:75b66c30753ba533`
- canonical activation baseline: `40db6ceb670f5304de1951e134ae128173837a22`
- dependency evidence: Tenant Org merge `1aa8c97b22a40ff2b6279ce1a9c625497bd99638`; Permission accepted candidate `93d9d1402e4ae668dcb93fc670c0050104967800`, both ancestors of the activation baseline
- integration branch: `codex/feature/gateway-tenant-target-binding-runtime`
- current state: `CANDIDATE_READY`
- stop point: `PR_READY + READY_FOR_STAGE_REVIEW`

## 2. Objective

在 API Gateway 对 canonical route template 中的精确 `:tenantId` 自动执行 tenant-target 识别、规范解析、TENANT/SYSTEM binding、Permission eligibility 排序和 request-private verified target 交接；移除通用 route opt-in，并只迁移已具备 target-owned admission 的 Tenant Org consumer/adapter 边界，同时保持 Site Management P1 的精确 binding-stage SYSTEM deny。

## 3. Allowed Scope

- 本 Feature Packet
- `src/services/api-gateway/src/common/tenant-target/**`
- `src/services/api-gateway/src/security/composition/**` 中 guard composition 与聚焦测试
- `src/services/api-gateway/src/common/guards/gateway-permission.guard.spec.ts` 的组合顺序/失败语义测试
- `src/services/api-gateway/src/modules/tenant-org-service/**` 中 canonical `:tenantId` controller、consumer、adapter 与聚焦测试
- `src/services/api-gateway/src/modules/site-management-bff/**` 中仅删除通用 opt-in、保持精确 P1 deny 与聚焦测试
- `src/site-runtime/meilong-ceramics-site/{scripts,tests}/locale-governance-*` 中仅同步直接依赖 Gateway guard composition 的 acceptance fixture
- 为 real Gateway matrix 所需的最小测试 fixture/artifact；不改变稳定契约

## 4. Protected Scope

- 已冻结 architecture、ADR 与 contracts
- Execution Token、STS request、Token claim 与 Token cache key 不增加 target tenant
- 不新增 targetability decorator、通用 route opt-in 或 fine-grained SYSTEM range
- 不修改 Permission/Tenant Org product implementation、schema、migration 或既有 Feature Packet
- 不修改无关 domain、schema、frontend、service、route 或既有 task/branch/worktree
- Site Management P1 `/site-management/tenants/:tenantId/**` 对 SYSTEM 保持 stage 3 的精确 `403`，且 Permission、handler、Token exchange、selector serialization、downstream 与 side effect 均为零调用
- feature merge、main merge 与 cleanup 均保持独立 Human confirmation

## 5. Frozen Slices

| Slice                           | Scope                                                                                                                           | Acceptance                                                                                                                                                               | Status        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `automatic-binding-and-carrier` | canonical route recognition、shared parser、immutable request-private carrier、duplicate-field equality、generic opt-in removal | 所有 protected `:tenantId` route 自动执行；TENANT mismatch/invalid target/unknown scope fail closed；carrier 不可枚举、不可覆盖、缺失即拒绝                              | `COMPLETE`    |
| `bounded-target-consumers`      | Tenant Org canonical routes/consumers/adapters 与 Site P1 exact exception                                                       | Tenant Org 使用 verified target 序列化 exact selector；SYSTEM 只在 target-owned dedicated RPC 成功；ordinary method 由 downstream 拒绝；Site P1 edge 提前拒绝            | `COMPLETE`    |
| `feature-validation`            | focused unit/integration、Gateway/Common/Permission/Tenant Org build/test、proto、真实组合矩阵                                 | GET/POST/PUT/PATCH/DELETE、malformed/missing/duplicate、Permission unavailable/malformed/stale、downstream admission、error order 与零 side effect 均有 literal evidence | `COMPLETE`    |

## 6. Validation Contract

- `pnpm proto:lint`
- `pnpm proto:breaking`
- `pnpm --filter @oes/common build`
- Gateway tenant-target、Permission、guard composition、Tenant Org consumer/adapter 与 Site P1 focused tests
- `pnpm --filter api-gateway build`
- Tenant Org target-admission focused tests/build；Permission focused tests/build
- real mTLS + Execution Token + Permission + Gateway matrix，记录 exact inputs、outputs 与 exit statuses
- Global RI 审查 immutable exact candidate SHA；finding 以追加 commit 修复后重新 review
- delivery packaging gate 独立于 validation slice：final candidate patch/archive、inverse rollback 与 artifact verifier 均须在 remote write 前生成并执行

## 7. Rollback

在 merge 前只保留 owner branch 与 immutable candidate；activation baseline `40db6ceb670f5304de1951e134ae128173837a22` 保留为来源证据。pre-push merge latest main 后，可执行 inverse rollback 以 integration base `9c78b4cacc54d3f6824cba69d89f891ac642800b` 为目标，确保不撤销已进入 main 的治理更新。禁止改写历史、force push 或清理未确认资源。

## 8. Current Evidence

- activation `origin/main=40db6ceb670f5304de1951e134ae128173837a22`；pre-push latest `origin/main=9c78b4cacc54d3f6824cba69d89f891ac642800b` 已以 merge commit 集成
- dependency ancestry checks: both exit `0`
- exact local/remote owner ref absent before activation；Feature Packet count `0`
- provisioned worktree clean detached at `bb3a1b9c26accb2c95089addddf90ca6d0dd1d4d`
- owner branch created locally at exact activation baseline with no upstream
- immutable product candidate: `fd94d90f66885d8f0738f8a8c1f66928b9702923`；append-only predecessors: `4811db5eecf8135a9836587c09f2395c98aea03a`、`379b4778bc8f8cef6d25ef477061abc8005d7cf0`
- automatic guard/carrier and bounded Site/Tenant Org consumer implementation complete；production generic opt-in source and repository acceptance references removed
- Global RI exact candidate review: `PASS` on `fd94d90f66885d8f0738f8a8c1f66928b9702923`，no code/protected-scope findings
- latest-main drift Global RI: `PASS` on `cee02dbc3ca44f8f185b8374234df5c7a7b677d8` against `origin/main=9c78b4cacc54d3f6824cba69d89f891ac642800b`；`fd94d90f..cee02dbc -- src` empty
- Gateway focused boundary/consumer/serialization tests: `11 suites / 109 tests` passed，覆盖 exact route/error order、GET/POST/PUT/PATCH/DELETE、Site P1 zero-continuation、Permission deny/unavailable/malformed、guard composition、Party tenant ownership recheck 与 exact Tenant Org RPC selector/Code
- Site real HTTP + Auth gRPC + Permission gRPC integration under non-default `platform/v2`: `1 suite / 14 tests` passed
- Common target/mTLS/ExecutionToken suites: `6 suites / 128 tests` passed
- Permission eligibility/deny/unavailable/malformed/stale focused: `6 suites / 41 tests` passed；Tenant Org target admission/controller: `3 suites / 44 tests` passed
- `pnpm proto:lint` and `pnpm proto:breaking` passed；Common/Gateway/Permission/Tenant Org builds passed
- real combined mTLS + ES256 ExecutionToken + Permission + Gateway + Tenant Org admission matrix: `1 suite / 5 tests` passed；证明 Permission-before-STS、tenantless SYSTEM token/cache across two targets、TENANT exact selector、target-owned exact `403 APP_AUTH_002` 与 malformed early stop
- directly related Site acceptance TypeScript compile and production guard/decorator harness: `34 / 34` passed
- real local SPIFFE/mTLS handshake, wrong-workload rejection, leaf certificate binding and rotation: `trusted gRPC transport smoke passed`
- delivery packaging gate verified：feature/inverse patch 重放、rollback tree、original/modified archive reopen 与 SHA256 manifest 均通过；exact external artifact paths 返回 direct parent
- push/Draft PR/required CI: pending；PR/CI 作为外部 GitHub exact-head evidence 返回 direct parent，避免 Feature Packet 自引用 commit
