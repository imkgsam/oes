# Identity Service 路线图

更新时间：2026-03-24 12:40:00 +09:00

## Phase 1：身份查询基线

目标：

- 建立 `identity-service` 的文档、gRPC、CQRS 结构基线
- 先支撑 `auth-service` 当前所需的身份查询闭环

范围：

- gRPC + CQRS 基线
- `User` 查询
- `UserAccount` 查询
- `Tenant` 最小查询

优先任务：

1. `IDN-FOUNDATION-01`
2. `IDN-USER-01`
3. `IDN-USER-02`
4. `IDN-USER-03`
5. `IDN-ACCOUNT-01`
6. `IDN-ACCOUNT-02`
7. `IDN-TENANT-01`

## Phase 2：身份管理与组织结构

目标：

- 补齐账户管理和租户管理基础能力
- 正式落地组织树与账户归属

范围：

- `Org` 查询与管理
- 账户主组织绑定
- 多组织归属
- 企业联系方式资产管理

优先任务：

1. `IDN-ORG-01`
2. `IDN-ORG-02`
3. `IDN-ORG-03`
4. `IDN-CONTACT-01`
5. `IDN-CONTACT-02`

## Phase 3：机器身份

目标：

- 为外部 API、内部服务、AI、自动化服务提供机器身份主数据基础

范围：

- `ServiceAccount`
- `APIKey`
- 后续机器凭据扩展预留

优先任务：

1. `IDN-MACHINE-01`
2. `IDN-MACHINE-02`

## 当前判断

当前进度判断：

- `Phase 1` 已完成
- `Phase 2` 中组织结构分片已完成：
  - `IDN-ORG-01`
  - `IDN-ORG-02`
  - `IDN-ORG-03`
- `Phase 2` 中企业邮箱资产分片已完成：
  - `IDN-CONTACT-01`
- `Phase 2` 中企业手机资产分片已完成：
  - `IDN-CONTACT-02`
- 当前建议下一步进入机器身份分片：
  - `IDN-MACHINE-01`
  - `IDN-MACHINE-02`

当前应优先推进 `IDN-MACHINE-01`。原因：

- 联系方式资产子域最小闭环已经完成
- `identity-service` 已具备继续承接机器身份主数据的空间
- Phase 3 是当前剩余的主线能力缺口
## Status Update 2026-03-24

### Current decision

- `Phase 1` is complete.
- `Phase 2` minimum closure is complete for:
  - org tree query
  - account primary org binding
  - account multi-org membership
  - work email asset management
  - work phone asset management
- `Phase 3` is intentionally deferred.

### Immediate next step

Do not enter `IDN-MACHINE-01` yet.

The current priority is service-internal consolidation for `identity-service`:

1. complete validation coverage for contact queries
2. remove loose controller fallback inputs such as `?? ''`
3. preserve and extend L1 regression protection for Phase 2 behavior

### Rationale

- The current gap is maintainability and input-boundary consistency, not feature coverage.
- `identity-service` already has the minimum feature closure needed for the current stage.
- Entering machine identity before tightening validation and regression coverage would carry Phase 2 debt into Phase 3.

## Status Update 2026-03-25

### Consolidation progress

- Completed contact-query validation coverage.
- Completed controller-side input fallback cleanup for gRPC command/query creation.
- Added targeted L1 regression tests for:
  - validating command path
  - validating query path
  - controller input boundary

### Updated next-step view

- The original internal-tightening checklist for Phase 2 is now largely complete.
- The service can return to the main roadmap after any final documentation sync or minor code-structure cleanup.
- `IDN-MACHINE-01` remains deferred until we explicitly choose to re-enter the Phase 3 track.

## Status Update 2026-03-25 B

### Phase 3 entry refinement

When `IDN-MACHINE-01` is resumed, it should enter as a machine principal foundation task, not as an isolated local `ServiceAccount` task.

This means:

- `ServiceAccount` is the first concrete persistence form
- the real design target is governed machine principal identity
- later AI, automation, and integration scenarios should reuse this foundation without redesigning identity boundaries

### Implication

Before Phase 3 code work starts, `IDN-MACHINE-01` must stay aligned with:

- project-level AI platform design
- future `auth-service` machine-auth consumption
- future `permission-service` machine-permission evaluation

## Status Update 2026-03-25 C

### Phase 3 implementation entry

`IDN-MACHINE-01` has now entered code implementation at the machine-principal foundation level.

Completed in this step:

- principal-only `ServiceAccount` Prisma schema alignment
- minimum repository, query, command, and gRPC entry points
- L1 coverage for scope-level and enable/disable guard rules

Still deferred in Phase 3:

- `APIKey`
- machine authentication
- delegation token/session work
- permission policy integration

## Status Update 2026-03-26

### Phase 3 verification progress

`IDN-MACHINE-01` has now completed:

- build verification
- L1 verification
- L2 repository verification for `ServiceAccount`

Observed during verification:

- local L2 execution required a test-database schema sync
- `prisma db push` was used only as a local test-environment recovery step
- one legacy org-membership constraint test remains open because the primary-org partial unique index is a SQL-level constraint not recoverable from Prisma schema alone

### Current roadmap interpretation

- `6.1` machine-principal foundation remains on the mainline
- the remaining L2 failure should be tracked as test-environment / legacy-constraint restoration work, not as a blocker for `ServiceAccount` mainline progress
