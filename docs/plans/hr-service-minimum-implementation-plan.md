# HR Service Minimum Implementation Plan

## 1. Purpose

This plan converts the frozen `hr-service` minimum foundation into an implementation-ready execution path.

It covers only the first-phase HR minimum:

- `Employee`
- `Employment`
- `Employment -> OrgUnit`
- HR-owned onboarding orchestration
- identity binding handoff
- permission grant handoff

It does not expand into payroll, attendance, performance, recruiting, complex position management, reporting line governance, or account-org membership truth.

## Status Note 2026-04-23

The first implementation thread has completed the `hr-service minimum contract-realization and service scaffold` slice.

Current landed scope:

- `src/services/system/hr-service`
- `src/common/src/contracts/hr_service/hr.proto`
- HR Prisma models for `Employee`, `Employment`, and onboarding access compensation state
- minimum query / management paths for `Employee` and `Employment`
- `ACCOUNT_BINDING_PENDING` and `ACCESS_GRANT_PENDING` compensation states
- L1 / L2 / L3 tests for the implemented slice

Remaining follow-up items:

- shared-env / multi-service onboarding smoke has been completed and no longer blocks the HR minimum foundation close
- repo-wide `pnpm proto:lint` hygiene has been completed and verified through final governance gate
- HR contract/runtime alignment has been closed via contract-only truth alignment; stronger context guarantees remain future enhancement
- onboarding fail-path business error classification has been fixed and re-verified; HR failureReason and logs now preserve stable business semantics

## Local Shared-Env Note 2026-04-23

- `pnpm backend` / `pnpm dev` now includes `hr-service` in the default local multi-service startup set.
- Default onboarding smoke local must-start services are:
  - `party-service`
  - `hr-service`
  - `identity-service`
  - `permission-service`
  - `tenant-org-service`
  - `api-gateway` / BFF when the flow is entered through gateway
- `identity-service` defaults `GRPC_SERVICE_HR_URL` to `127.0.0.1:50055`, matching the `hr-service` local gRPC listen port.
- If a local override is required, only override `GRPC_SERVICE_HR_URL`; do not reintroduce ad hoc fallback wiring in onboarding call sites.

## 2. Upstream Truth Sources

- [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md)
- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [tenant-org-and-hr.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/tenant-org-and-hr.md)
- [employee-onboarding.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/employee-onboarding.md)
- [hr-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/hr-service-foundation.md)
- [hr-service contracts](/Users/acehood/Documents/GitHub/oes/docs/contracts/hr-service/README.md)
- [identity employee binding contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/identity-service/employee-binding.md)
- [permission onboarding grant contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/permission-service/onboarding-grant.md)

## 3. Current Engineering State

- `src/services/system/hr-service` now exists and follows the intended service shape.
- `src/common/src/contracts/hr_service/hr.proto` now exists.
- The implementation follows the `tenant-org-service` style:
  - NestJS gRPC microservice
  - independent Prisma schema
  - `application / domain / infrastructure / interfaces / modules` structure
  - L1 / L2 / L3 tests
  - generated contracts from `src/common/src/contracts/**`
- `identity-service` now exposes actual proto/schema/runtime support for `UserAccount <-> Employee` binding.
- `permission-service` now exposes actual proto/runtime support for `GrantInitialAccessForEmployeeAccount` with idempotency persistence.
- HR now uses real gRPC adapters for identity binding and onboarding grant handoff.

## 4. Implementation Slices

### 4.1 Service Scaffold

- Create `src/services/system/hr-service`.
- Follow the existing `tenant-org-service` service shape.
- Add package, tsconfig, Jest config, Prisma setup, service entrypoint, app module, and test directories.
- Keep the service isolated from other services' databases.

### 4.2 Common Proto Realization

- Add `src/common/src/contracts/hr_service/hr.proto`.
- Define `HrQueryService` and `HrManagementService`.
- Regenerate common generated types.
- Build `@oes/common`.

Minimum query RPCs:

- `GetEmployeeById`
- `GetEmployeeByTenantPartyId`
- `GetActiveEmployment`
- `ListEmployments`

Minimum management RPCs:

- `CreateEmployee`
- `CreateEmployment`
- `EndEmployment`
- `ChangePrimaryEmployment`

Minimum enums:

- `EmployeeLifecycleStatus`
  - `PREBOARDING`
  - `ACTIVE`
  - `OFFBOARDED`
- `EmploymentStatus`
  - `ACTIVE`
  - `ENDED`

Onboarding RPC note:

- Do not invent a public `OnboardEmployee` or `RetryOnboardingAccess` RPC unless the implementation thread explicitly creates a contract-realization slice for it.
- HR may implement internal application orchestration and ports first.

### 4.3 Persistence

Suggested models:

- `Employee`
  - `id`
  - `tenantId`
  - `tenantPartyId`
  - optional `partyId`
  - `employeeCode`
  - `lifecycleStatus`
  - timestamps
  - unique `tenantId + tenantPartyId`
  - unique `tenantId + employeeCode`
- `Employment`
  - `id`
  - `tenantId`
  - `employeeId`
  - `orgUnitId`
  - `status`
  - `effectiveFrom`
  - optional `effectiveTo`
  - optional `endedReason`
  - timestamps
  - index `tenantId + employeeId`
  - index `tenantId + orgUnitId`
- `EmployeeOnboardingProcess` or equivalent compensation process
  - stores HR orchestration status only
  - may reference `employeeId`, `employmentId`, optional `accountId`, and grant idempotency key
  - must not become account binding truth
  - must not become role / grant truth

Active employment uniqueness must be protected by database-level or transaction-level constraints.

If Prisma `db push` cannot express the preferred Postgres partial unique index, the implementation must document and test the chosen replacement, such as a transaction-guarded invariant with L2 coverage.

### 4.4 Domain And Application

Domain rules:

- `Employee` uses independent `employeeId`.
- `tenantPartyId` is the HR upstream primary reference.
- `partyId` is optional integrity shadow only.
- `CreateEmployee` creates `PREBOARDING`.
- `CreateEmployment` creates immediate `ACTIVE` employment only.
- One employee can have at most one current active employment.
- `EndEmployment` ends active employment and may move employee to `OFFBOARDED`.
- `ChangePrimaryEmployment` is an HR-local atomic command that ends the old employment and creates the new active employment.
- HR never derives formal org membership from account-org membership.

Recommended command handlers:

- `CreateEmployeeHandler`
- `CreateEmploymentHandler`
- `EndEmploymentHandler`
- `ChangePrimaryEmploymentHandler`
- `RetryOnboardingAccessHandler`, only if onboarding access retry is explicitly realized

Recommended query handlers:

- `GetEmployeeByIdHandler`
- `GetEmployeeByTenantPartyIdHandler`
- `GetActiveEmploymentHandler`
- `ListEmploymentsHandler`

### 4.5 Downstream Ports And Adapters

Define ports before concrete adapters:

- `PartyPort`
- `TenantOrgPort`
- `IdentityEmployeeBindingPort`
- `PermissionOnboardingGrantPort`

Handoff note:

- The initial scaffold was allowed to use mocks / fakes.
- Current repository state has moved past that stage: identity binding and permission onboarding grant now have actual handoff implementations.

Forbidden:

- Calling legacy `AddAccountOrgMembership`
- Calling legacy `SetAccountPrimaryOrg`
- Writing permission account-role tables directly
- Persisting account binding truth inside HR

### 4.6 Interfaces And Modules

- `HrQueryGrpcController`
- `HrManagementGrpcController`
- `HrQueryModule`
- `HrManagementModule`
- `HrOnboardingModule`, only if onboarding command scope is explicitly included
- `PrismaModule`
- `AppModule`

Controllers must only map protocols to application commands / queries.

Core business rules must stay out of controllers, DTOs, and Prisma schema.

Domain must not depend on NestJS, Prisma, or gRPC.

All new classes, functions, handlers, services, repositories, guards, or interceptors must include a short responsibility summary comment.

## 5. Test Plan

### L1

- Employee starts as `PREBOARDING`.
- Duplicate `tenantId + tenantPartyId` is rejected.
- `CreateEmployment` rejects future-dated minimum employment.
- A second active employment is rejected.
- `EndEmployment` can move Employee to `OFFBOARDED`.
- `ChangePrimaryEmployment` atomically ends old employment and creates a new one.
- Binding failure keeps Employee / Employment and enters `ACCOUNT_BINDING_PENDING`.
- Grant failure keeps binding and enters `ACCESS_GRANT_PENDING`.
- Guardrail test proves HR application does not call account-org membership ports.

### L2

- Prisma repositories persist Employee / Employment.
- Unique `tenantId + tenantPartyId` is enforced.
- Active employment invariant is enforced.
- `ChangePrimaryEmployment` transaction does not leave half-written employment state.
- Onboarding process state is retryable.
- Tenant boundary queries cannot leak cross-tenant data.

### L3

- gRPC request / response mapping for query and management RPCs.
- Missing metadata / operator context rejects management writes.
- tenant-org invalid org reference maps to invalid org reference.
- identity / permission failure through real or fake handoff still returns compensation state rather than rolling back HR truth.
- Contract regression proves HR responses do not expose account-org membership as HR truth.

Suggested verification commands:

```bash
pnpm proto:lint
pnpm --filter @oes/common build
pnpm --filter hr-service prisma:generate
pnpm --filter hr-service test:l1
pnpm --filter hr-service test:l2
pnpm --filter hr-service test:l3
pnpm --filter hr-service build
```

## 6. Guardrails

- Do not make `account -> org` formal truth.
- Do not let HR persist `UserAccount <-> Employee` binding truth.
- Do not let HR persist role / grant truth.
- Do not use legacy identity account-org membership APIs for HR onboarding.
- Do not expand into payroll, attendance, performance, recruiting, positions, reporting lines, complex concurrent employment, secondment, temporary attachment, or interval governance.
- Do not expose public onboarding RPCs unless contract realization is included in the implementation slice.
- Do not bypass `api-gateway` / BFF for external entry.

## 7.1 Status After Handoff Realization

- `identity-service` employee binding actual handoff: landed
- `permission-service` onboarding grant actual handoff: landed
- `hr-service` onboarding adapters: switched from unavailable adapters to real gRPC adapters
- `hr-service minimum foundation`: no longer blocked by mock-only handoff
- `onboarding` shared-env smoke: success path, binding fail path, and grant fail path all verified

## 7. Implementation Thread Readiness

`hr-service minimum implementation` may start with a first slice named:

`hr-service minimum contract-realization and service scaffold`

That first slice may:

- create `hr-service`
- create HR proto
- create HR Prisma schema
- implement documented HR query / management RPCs
- define application ports for identity binding and permission grant
- use mocks / fakes for identity and permission handoff until actual proto support exists

It must stop and escalate back to architecture control if it needs to:

- expose a new public onboarding RPC
- change identity binding proto / schema
- change permission onboarding grant proto / schema
- make access package semantics concrete
- consume party merge / tenant party deactivate repair events

This implementation plan remains useful as the execution record for the first-phase HR minimum build, but it is no longer the blocker list for closing `hr-service minimum foundation`.
The remaining follow-up scope is governance-quality work rather than foundation delivery.

## 8. Next Thread Prompt

This prompt is the historical implementation-entry prompt for the first HR minimum build slice.
It is preserved as execution history.

After identity / permission handoff realization landed, this prompt is no longer the recommended next-step thread for architecture control.
Follow-up work should move to:

- future HR context-hardening / tenant-aware query enhancement
- future party / HR collaboration governance

The original prompt is retained below for traceability:

```text
你是 OES 的 hr-service minimum implementation thread。

第一阶段只执行：hr-service minimum contract-realization and service scaffold。

必读：
- docs/architecture/services/hr-service.md
- docs/architecture/services/party-service.md
- docs/architecture/services/tenant-org-service.md
- docs/architecture/services/identity-service.md
- docs/architecture/services/permission-service.md
- docs/architecture/collaborations/tenant-org-and-hr.md
- docs/architecture/collaborations/employee-onboarding.md
- docs/plans/features/hr-service-foundation.md
- docs/plans/hr-service-minimum-implementation-plan.md
- docs/contracts/hr-service/README.md
- docs/contracts/hr-service/query.md
- docs/contracts/hr-service/management.md
- docs/contracts/identity-service/employee-binding.md
- docs/contracts/permission-service/onboarding-grant.md

目标：
1. 在 src/services/system/hr-service 落地 NestJS gRPC microservice。
2. 按 existing tenant-org-service / party-service 工程风格建立 application/domain/infrastructure/interfaces/modules/prisma/test。
3. 新增 hr_service proto，并生成 @oes/common generated 类型。
4. 实现 Employee / Employment minimum：
   - Employee 独立 employeeId
   - tenantPartyId 是 HR 上游主引用
   - partyId 只能是完整性影子
   - CreateEmployee 初始 PREBOARDING
   - CreateEmployment 立即 ACTIVE
   - 第一阶段同一 Employee 只能有一个 ACTIVE employment
   - EndEmployment 可使 Employee OFFBOARDED
   - ChangePrimaryEmployment 必须本地事务原子完成
5. 实现 onboarding access 段补偿状态：
   - account binding / grant 失败不回滚 Party / Employee / Employment
   - binding 失败进入 ACCOUNT_BINDING_PENDING
   - grant 失败进入 ACCESS_GRANT_PENDING
   - identity binding 与 permission grant 若 actual proto 未落地，先通过 application port + mock/fake 测试，不得调用 legacy account-org membership 或直接写角色绑定。
6. 建立 L1/L2/L3 测试，覆盖状态机、事务、外部 mock、gRPC mapping 与 guardrails。

强制 guardrails：
- 不允许把 account -> org 定义成正式真相。
- 不允许 HR 持久化 UserAccount <-> Employee binding 真相。
- 不允许 HR 持久化 role / grant 真相。
- 不允许调用 identity-service legacy AddAccountOrgMembership / SetAccountPrimaryOrg 完成 HR onboarding。
- 不允许直接调用 permission-service AccountRole repository 或自行展开 role owner 语义。
- 不允许在 controller、DTO、Prisma schema 中写核心业务规则。
- domain 不依赖 NestJS、Prisma、gRPC。
- 所有新增 class/function/handler/repository 都加一句职责总结注释。

验证：
- pnpm proto:lint
- pnpm --filter @oes/common build
- pnpm --filter hr-service prisma:generate
- pnpm --filter hr-service test:l1
- pnpm --filter hr-service test:l2
- pnpm --filter hr-service test:l3
- pnpm --filter hr-service build

完成输出必须说明：
- 本次范围
- 修改文件
- 行为影响
- 契约或数据影响
- 验证结果
- 剩余风险
- 是否存在 identity/permission handoff proto 尚未落地的 mock-only 部分
```
