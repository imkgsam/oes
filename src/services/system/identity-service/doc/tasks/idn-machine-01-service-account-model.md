# 4.6.1 机器身份主体模型任务

更新时间：2026-03-23 15:20:00 +08:00

## 上游设计文档

- [../design/identity-center.md](../design/identity-center.md)
- [../design/machine-identity.md](../design/machine-identity.md)

## 当前承接范围

- 建立 `ServiceAccount` 主体模型

## 功能编号

- `4.6.1`

## 当前状态

- 未开始

## 最小闭环范围

- schema：定义 `ServiceAccount`
- domain：机器身份状态规则
- application：基础查询与管理入口
- infra：Repository 实现
- interface：gRPC 管理与查询接口
- doc：同步状态与验收结果

## 不包含范围

- `APIKey`
- 机器认证
- delegation token

## 验收要求

- 可表达租户级和系统级机器主体
- 可区分内部服务、外部客户端、AI、自动化服务
- build 通过

## 关联设计文档

- [../design/machine-identity.md](../design/machine-identity.md)

## 阻塞项

- Phase 3 任务，当前不优先开发
## Status Update 2026-03-25

### Task reinterpretation

`IDN-MACHINE-01` should no longer be treated as an isolated local `ServiceAccount` table task.

It is now interpreted as the first step of the OES machine principal foundation.

Within `identity-service`, the scope of this task is:

- establish governed machine principal identity truth
- use `ServiceAccount` as the first concrete machine-principal form
- prepare for later delegation and machine-auth consumption by other services

### In-scope meaning of `ServiceAccount`

At this stage, `ServiceAccount` is the concrete persistence model, but the design intent is broader:

- it represents a governed machine principal
- it may later back AI agents, internal services, automation bots, and external integrations
- it must not be treated as an API-key-only local table

### Out-of-scope remains unchanged

- `APIKey`
- machine authentication
- delegation token issuance

These still belong to later work, but `IDN-MACHINE-01` must leave a reusable foundation for them.

### Updated delivery expectation

The preferred output of `IDN-MACHINE-01` is:

- a machine-principal-ready schema foundation in `identity-service`
- explicit type, scope-level, and status semantics
- minimal query and management entry points
- documentation aligned with project-level AI platform design

### Cross-service alignment requirement

Before implementation starts, `IDN-MACHINE-01` should be aligned with:

- how `auth-service` will authenticate or consume the machine principal
- how `permission-service` will evaluate machine upper-bound permissions
- how AI or automation scenarios will reuse the principal through profile and execution-context layers

Project-level alignment reference:

- [../../../../../docs/plans/machine-principal-foundation-alignment.md](../../../../../docs/plans/machine-principal-foundation-alignment.md)

### Minimum delivery breakdown

For `IDN-MACHINE-01`, the preferred minimum delivery inside `identity-service` is:

- schema
  - principal-only `ServiceAccount` foundation
  - no `APIKey` implementation inside this task
- domain
  - explicit scope-level, type, and status semantics
- application query
  - `getServiceAccountById`
  - `listServiceAccounts`
- application management
  - `createServiceAccount`
  - `setServiceAccountEnabled`
- interface
  - minimal gRPC query and management entry points
- tests
  - L1 for scope/type/status rules
  - build pass

Tenant binding decision for this task:

- `scopeLevel = SYSTEM` -> `tenantId = null`
- `scopeLevel = TENANT` -> `tenantId != null`

### Repository note

The current Prisma schema already contains a historical `ServiceAccount / APIKey` draft.

That draft should be treated as a pre-alignment sketch, not as the accepted implementation target for this task.

The final `6.1` implementation should first align with the machine-principal foundation interpretation before touching code.

Schema alignment draft:

- [../../../../../docs/plans/machine-principal-schema-alignment-draft.md](../../../../../docs/plans/machine-principal-schema-alignment-draft.md)

## Implementation Update 2026-03-25

Current implementation status for `IDN-MACHINE-01`:

- Prisma schema aligned to principal-only `ServiceAccount`
- historical `APIKey` draft removed from the active `6.1` target schema
- new machine-principal enums added:
  - `MachinePrincipalScopeLevel`
  - `MachinePrincipalType`
  - `MachinePrincipalStatus`
- minimum CQRS surface added:
  - `getServiceAccountById`
  - `listServiceAccounts`
  - `createServiceAccount`
  - `setServiceAccountEnabled`
- gRPC query and management endpoints added for the same minimum surface
- L1 tests added for:
  - scope and tenant binding rules
  - not-found guard on enable/disable
  - validating command/query input

Current non-goals remain unchanged:

- no `APIKey`
- no machine authentication
- no delegation issuance

## Verification Update 2026-03-26

Additional verification progress for `IDN-MACHINE-01`:

- added L2 repository test coverage for `ServiceAccount`
- added L2 database constraint checks for machine-principal enums
- used `prisma db push` to align the local test database with the current `identity-service` schema for verification only

Current L2 status:

- `prisma.service-account.repository.spec.ts` passed
- `service-account-database-constraints.spec.ts` passed
- existing contact and org repository L2 suites also became executable again after the schema sync

Current open item:

- one legacy org-membership database-constraint test is still failing because the partial unique index for primary org membership is not expressed in Prisma schema and was not restored by `db push`

Interpretation:

- `IDN-MACHINE-01` itself is not blocked by this remaining failure
- the remaining issue belongs to legacy database-constraint restoration for Phase 2 test coverage
