# Tenant-Org Service Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable `tenant-org-service` foundation and migrate tenant/org truth ownership out of `identity-service`.

**Architecture:** `tenant-org-service` owns `Tenant`, `OrgUnit`, org tree, org hierarchy, and org reference validation. It does not own account-org membership, employee/employment, HR assignment, or person-to-org truth. It follows the existing `party-service` style: NestJS gRPC service, Prisma persistence, service modules, L1/L2/L3 tests, and shared proto contracts under `src/common`.

**Tech Stack:** NestJS, gRPC, Prisma, PostgreSQL, Jest, TypeScript, `@oes/common`.

---

## 1. Required Reading

- [tenant-org-service foundation packet](/Users/acehood/Documents/GitHub/oes/docs/plans/features/tenant-org-service-foundation.md)
- [tenant-org-service responsibilities](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)
- [tenant-org query contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/query.md)
- [tenant-org management contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/tenant-org-service/management.md)
- [tenant-org migration plan](/Users/acehood/Documents/GitHub/oes/docs/plans/tenant-org-service-migration-plan.md)
- [party-service implementation sample](/Users/acehood/Documents/GitHub/oes/src/services/system/party-service/src/app.module.ts)

## 2. Ownership Guardrails

- Do not implement `AccountOrgMembership`.
- Do not implement `SetAccountPrimaryOrg`.
- Do not implement `Employee`, `Employment`, position, reporting line, or HR assignment.
- Do not keep `identity-service` as a long-term tenant/org truth owner.
- Do not make frontend clients call `tenant-org-service` directly; gateway/BFF remains the external aggregation entry.

## 3. File Structure Map

Create:

- `src/common/src/contracts/tenant_org_service/tenant_org.proto`
- `src/common/src/contracts/tenant_org_service/index.ts`
- `src/services/system/tenant-org-service/package.json`
- `src/services/system/tenant-org-service/tsconfig.json`
- `src/services/system/tenant-org-service/tsconfig.spec.json`
- `src/services/system/tenant-org-service/jest.config.js`
- `src/services/system/tenant-org-service/prisma/schema.prisma`
- `src/services/system/tenant-org-service/src/main.ts`
- `src/services/system/tenant-org-service/src/app.module.ts`
- `src/services/system/tenant-org-service/src/domain/value-objects/tenant-org.enums.ts`
- `src/services/system/tenant-org-service/src/domain/value-objects/index.ts`
- `src/services/system/tenant-org-service/src/domain/repositories/tenant.repository.ts`
- `src/services/system/tenant-org-service/src/domain/repositories/org-unit.repository.ts`
- `src/services/system/tenant-org-service/src/domain/repositories/index.ts`
- `src/services/system/tenant-org-service/src/application/services/tenant-org-query.service.ts`
- `src/services/system/tenant-org-service/src/application/services/tenant-org-management.service.ts`
- `src/services/system/tenant-org-service/src/application/services/index.ts`
- `src/services/system/tenant-org-service/src/infrastructure/prisma/prisma.module.ts`
- `src/services/system/tenant-org-service/src/infrastructure/prisma/prisma.service.ts`
- `src/services/system/tenant-org-service/src/infrastructure/repositories/prisma-tenant.repository.ts`
- `src/services/system/tenant-org-service/src/infrastructure/repositories/prisma-org-unit.repository.ts`
- `src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-query.grpc.controller.ts`
- `src/services/system/tenant-org-service/src/interfaces/grpc/tenant-org-management.grpc.controller.ts`
- `src/services/system/tenant-org-service/src/modules/tenant-org-query/tenant-org-query.module.ts`
- `src/services/system/tenant-org-service/src/modules/tenant-org-management/tenant-org-management.module.ts`
- `src/services/system/tenant-org-service/test/helpers/integration-db.ts`
- `src/services/system/tenant-org-service/test/l1/tenant-org-query.service.spec.ts`
- `src/services/system/tenant-org-service/test/l1/tenant-org-management.service.spec.ts`
- `src/services/system/tenant-org-service/test/l2/prisma.tenant.repository.spec.ts`
- `src/services/system/tenant-org-service/test/l2/prisma.org-unit.repository.spec.ts`
- `src/services/system/tenant-org-service/test/l3/tenant-org-query.grpc.controller.spec.ts`
- `src/services/system/tenant-org-service/test/l3/tenant-org-management.grpc.controller.spec.ts`

Modify:

- `package.json`
- `src/common/src/contracts/index.ts`
- `src/common/src/contracts/contract-path.util.ts` if it requires an allowlist update
- `src/common/src/constants/services/*` if service names are centrally registered
- `src/services/system/identity-service/**` after `tenant-org-service` runtime exists
- `src/services/api-gateway/**` after `tenant-org-service` runtime exists
- `src/services/system/auth-service/**` only if it directly reads tenant/org summaries

## 4. Task 1: Shared gRPC Contract

**Files:**
- Create: `src/common/src/contracts/tenant_org_service/tenant_org.proto`
- Create: `src/common/src/contracts/tenant_org_service/index.ts`
- Modify: `src/common/src/contracts/index.ts`

- [ ] **Step 1: Add proto package and services**

Define package `tenant_org_service` with:

- `TenantOrgQueryService`
- `TenantOrgManagementService`

Required query RPCs:

- `GetTenantById`
- `ListTenants`
- `GetOrgTreeByTenantId`
- `GetOrgUnitById`
- `ValidateOrgReference`
- `GetOrgReferenceSummary`
- `ListAncestorOrgUnits`
- `ListDescendantOrgUnits`

Required management RPCs:

- `CreateTenant`
- `UpdateTenantProfile`
- `SuspendTenant`
- `ReactivateTenant`
- `ArchiveTenant`
- `CreateOrgUnit`
- `UpdateOrgUnit`
- `MoveOrgUnit`
- `ArchiveOrgUnit`

- [ ] **Step 2: Define shared messages**

Include these messages at minimum:

- `TenantSummary`
- `OrgUnitSummary`
- `OrgNode`
- `ValidationResult`
- request / response messages for every RPC above

Use string IDs to align with existing service proto style.

- [ ] **Step 3: Export contract module**

`src/common/src/contracts/tenant_org_service/index.ts` should export generated types from `../../generated/tenant_org_service/tenant_org`.

- [ ] **Step 4: Verify proto**

Run:

```bash
pnpm proto:lint
pnpm proto:regen
pnpm common:build
```

Expected result:

- buf lint passes
- generated tenant-org TypeScript files exist under `src/common/src/generated/tenant_org_service`
- `@oes/common` builds

## 5. Task 2: Service Skeleton

**Files:**
- Create all `src/services/system/tenant-org-service/**` skeleton files listed in the file map
- Modify: root `package.json`

- [ ] **Step 1: Add workspace package**

Create `src/services/system/tenant-org-service/package.json` using `party-service` as the direct template, with package name `tenant-org-service`.

- [ ] **Step 2: Add TypeScript and Jest config**

Copy the structure from `party-service`, adjusting paths and service name only.

- [ ] **Step 3: Add app module**

`AppModule` should import:

- `LoggingModule.forRoot({ serviceName: 'tenant-org-service' })`
- `ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] })`
- `PrismaModule`
- `TenantOrgQueryModule`
- `TenantOrgManagementModule`

- [ ] **Step 4: Add gRPC bootstrap**

`main.ts` should:

- initialize OTel with `tenant-org-service`
- load `tenant_org_service/tenant_org.proto`
- listen on a new service port, for example `50054`, unless a port registry says otherwise

- [ ] **Step 5: Add root script**

Add a root package script:

```json
"tos": "pnpm --filter tenant-org-service dev"
```

- [ ] **Step 6: Verify skeleton**

Run:

```bash
pnpm --filter tenant-org-service build
```

Expected result:

- TypeScript build passes before business logic is filled in with repository implementations and controllers.

## 6. Task 3: Prisma Schema And Repository Layer

**Files:**
- Create: `src/services/system/tenant-org-service/prisma/schema.prisma`
- Create: `src/services/system/tenant-org-service/src/infrastructure/prisma/*`
- Create: repository interfaces and Prisma implementations

- [ ] **Step 1: Add enums**

Minimum enums:

- `TenantStatus`: `ACTIVE`, `SUSPENDED`, `ARCHIVED`
- `OrgUnitStatus`: `ACTIVE`, `ARCHIVED`
- `OrgUnitType`: `ROOT`, `DEPARTMENT`, `TEAM`, `BRANCH`, `OTHER`

- [ ] **Step 2: Add `Tenant` model**

Minimum fields:

- `id`
- `code`
- `name`
- `status`
- `rootOrgId`
- `createdAt`
- `updatedAt`

Constraints:

- `code` unique
- `rootOrgId` nullable during create transaction, then set once root org is created

- [ ] **Step 3: Add `OrgUnit` model**

Minimum fields:

- `id`
- `tenantId`
- `parentOrgId`
- `name`
- `type`
- `status`
- `path`
- `depth`
- `sortOrder`
- `organizationPartyId`
- `createdAt`
- `updatedAt`

Constraints:

- index `tenantId`
- index `parentOrgId`
- index `path`
- unique active sibling name should be considered if current repository patterns allow it

- [ ] **Step 4: Add repository interfaces**

`TenantRepository` must support:

- create tenant with root org transaction support
- find by id
- list
- update profile
- set status

`OrgUnitRepository` must support:

- create
- find by id
- list tree by tenant
- update
- move with path recalculation
- archive
- list ancestors
- list descendants

- [ ] **Step 5: Add repository tests**

L2 tests must verify:

- tenant code uniqueness
- tenant create creates root org
- org move rejects cycles
- archive does not physically delete org units
- descendant query respects tenant boundary

- [ ] **Step 6: Verify persistence**

Run:

```bash
pnpm --filter tenant-org-service prisma:generate
pnpm --filter tenant-org-service test:l2
```

Expected result:

- Prisma client generated
- L2 repository tests pass

## 7. Task 4: Application Services

**Files:**
- Create: `tenant-org-query.service.ts`
- Create: `tenant-org-management.service.ts`
- Create: L1 service tests

- [ ] **Step 1: Implement query service**

Methods:

- `getTenantById`
- `listTenants`
- `getOrgTreeByTenantId`
- `getOrgUnitById`
- `validateOrgReference`
- `getOrgReferenceSummary`
- `listAncestorOrgUnits`
- `listDescendantOrgUnits`

Rules:

- missing query result returns empty response shape at controller level
- validation failures remain explicit
- no employee/account membership behavior

- [ ] **Step 2: Implement management service**

Methods:

- `createTenant`
- `updateTenantProfile`
- `suspendTenant`
- `reactivateTenant`
- `archiveTenant`
- `createOrgUnit`
- `updateOrgUnit`
- `moveOrgUnit`
- `archiveOrgUnit`

Rules:

- creating tenant also creates root org
- root org cannot be moved below its descendant
- archive is not physical delete
- move recalculates path and depth for affected subtree

- [ ] **Step 3: Add L1 tests**

Verify:

- create tenant returns tenant + root org
- inactive / archived tenant cannot receive new org units
- org reference validation returns false for wrong tenant
- move rejects cycles
- no API exposes account-org membership

- [ ] **Step 4: Verify application layer**

Run:

```bash
pnpm --filter tenant-org-service test:l1
```

Expected result:

- all application service tests pass

## 8. Task 5: gRPC Interfaces And Modules

**Files:**
- Create: `tenant-org-query.grpc.controller.ts`
- Create: `tenant-org-management.grpc.controller.ts`
- Create: module wiring files
- Create: L3 controller tests

- [ ] **Step 1: Add query controller**

Map generated gRPC requests to application query service calls.

- [ ] **Step 2: Add management controller**

Map generated gRPC requests to application management service calls.

- [ ] **Step 3: Add modules**

Use the `party-service` module pattern:

- controller
- service provider
- repository provider
- Prisma module import

- [ ] **Step 4: Add L3 tests**

Verify:

- gRPC controller returns tenant summary
- gRPC controller returns org tree
- gRPC management controller creates tenant with root org
- gRPC management controller rejects invalid org moves

- [ ] **Step 5: Verify interface layer**

Run:

```bash
pnpm --filter tenant-org-service test:l3
pnpm --filter tenant-org-service test
pnpm --filter tenant-org-service build
```

Expected result:

- all tenant-org service tests pass
- build passes

## 9. Task 6: Identity Owner Removal And Caller Migration

**Files:**
- Modify: `src/services/system/identity-service/**`
- Modify: `src/services/api-gateway/**`
- Modify: `src/services/system/auth-service/**` only if direct tenant/org reads exist

- [ ] **Step 1: Inventory old owner surfaces**

Search for:

- `GetTenantById`
- `GetOrgTreeByTenantId`
- `ListAccountOrgMemberships`
- `AddAccountOrgMembership`
- `RemoveAccountOrgMembership`
- `SetAccountPrimaryOrg`

- [ ] **Step 2: Move tenant/org reads to tenant-org-service**

Replace tenant and org tree read callers with `TenantOrgQueryService`.

- [ ] **Step 3: Stop expanding deprecated membership APIs**

Do not migrate `ListAccountOrgMemberships`, `AddAccountOrgMembership`, `RemoveAccountOrgMembership`, or `SetAccountPrimaryOrg` into tenant-org-service.

Mark or remove old identity endpoints according to the migration plan, after callers are no longer using them.

- [ ] **Step 4: Verify caller migration**

Run focused tests for:

- `identity-service`
- `api-gateway`
- `auth-service` if touched

Recommended commands:

```bash
pnpm --filter identity-service test:l2
pnpm --dir src/services/api-gateway exec jest --runInBand
pnpm --filter auth-service test
```

Expected result:

- callers no longer rely on identity as tenant/org truth owner
- no account-org membership logic is recreated in tenant-org-service

## 10. Task 7: Integration Review

**Files:**
- Read-only review by default
- Modify docs only if implementation reveals a necessary clarification

- [ ] **Step 1: Boundary review**

Confirm implementation does not include:

- account-org membership
- employee / employment
- HR position or reporting line
- permission policy truth

- [ ] **Step 2: Contract review**

Confirm proto/runtime behavior matches:

- `docs/contracts/tenant-org-service/query.md`
- `docs/contracts/tenant-org-service/management.md`

- [ ] **Step 3: Migration review**

Confirm:

- `identity-service` no longer owns tenant/org truth
- callers use `tenant-org-service` for tenant/org facts
- any old identity membership APIs are not expanded

- [ ] **Step 4: Final verification**

Run:

```bash
pnpm proto:lint
pnpm common:build
pnpm --filter tenant-org-service test
pnpm --filter tenant-org-service build
```

Expected result:

- verification passes
- review can close the feature packet status

## 11. Recommended Threading

Use four active threads plus this design-control thread:

- Thread A: `tenant-org-service implementation`
- Thread B: `identity/auth/gateway migration`
- Thread C: `integration review`
- Thread D: `party-service foundation design`

Thread A should start first. Thread B can inventory and prepare in parallel, but final caller switch depends on Thread A exposing runnable gRPC contracts. Thread C should start after Thread A and Thread B have implementation output. Thread D can run in parallel because it is design-only unless it starts code migration.

## 12. Thread Launch Prompts

### Thread A: tenant-org-service implementation

```text
你是 OES 的 tenant-org-service implementation thread。只负责实现 tenant-org-service 第一阶段，不要修改业务服务范围。

必读：
- docs/plans/features/tenant-org-service-foundation.md
- docs/architecture/services/tenant-org-service.md
- docs/contracts/tenant-org-service/README.md
- docs/contracts/tenant-org-service/query.md
- docs/contracts/tenant-org-service/management.md
- docs/plans/tenant-org-service-migration-plan.md
- docs/plans/tenant-org-service-foundation-implementation-plan.md

目标：
- 创建 src/services/system/tenant-org-service
- 创建 shared proto: src/common/src/contracts/tenant_org_service/tenant_org.proto
- 实现 Tenant / OrgUnit / org tree / org reference validation
- 建立 L1/L2/L3 测试

禁止：
- 不实现 AccountOrgMembership
- 不实现 employee / employment
- 不实现 HR 任职、岗位、汇报关系
- 不让 tenant-org-service 拥有 UserAccount 或 contact assets

完成后输出：
- 改了哪些文件
- 运行了哪些验证
- 是否发现需要回写设计文档的边界问题
```

### Thread B: identity/auth/gateway migration

```text
你是 OES 的 identity/auth/gateway tenant-org migration thread。目标是把 tenant/org 真相调用从 identity-service 切到 tenant-org-service。

必读：
- docs/architecture/collaborations/tenant-org-and-identity.md
- docs/plans/tenant-org-service-migration-plan.md
- docs/contracts/tenant-org-service/query.md
- docs/contracts/identity-service/query.md
- docs/plans/features/tenant-org-service-foundation.md

第一阶段只做调用面清单和迁移准备；最终切换依赖 tenant-org-service runtime 可用。

重点搜索：
- GetTenantById
- GetOrgTreeByTenantId
- ListAccountOrgMemberships
- AddAccountOrgMembership
- RemoveAccountOrgMembership
- SetAccountPrimaryOrg

禁止：
- 不把 account-org membership 迁到 tenant-org-service
- 不在 identity-service 中继续扩展 tenant/org 真相
- 不让前端绕过 BFF 直接拼装 tenant/org facts

完成后输出：
- 调用点清单
- 可先迁移项
- 必须等待 tenant-org runtime 的项
- 删除或废弃旧接口的建议顺序
```

### Thread C: tenant-org integration review

```text
你是 OES 的 tenant-org integration review thread。只做审查和验证，默认不写实现代码。

必读：
- docs/plans/features/tenant-org-service-foundation.md
- docs/architecture/services/tenant-org-service.md
- docs/architecture/collaborations/tenant-org-and-identity.md
- docs/architecture/collaborations/tenant-org-and-hr.md
- docs/contracts/tenant-org-service/query.md
- docs/contracts/tenant-org-service/management.md
- docs/plans/tenant-org-service-migration-plan.md

审查重点：
- 是否越界实现 account-org membership
- 是否越界实现 employee/employment
- identity-service 是否仍拥有 tenant/org truth
- api-gateway/auth-service 是否改用 tenant-org-service 查询 tenant/org facts
- contracts 与 runtime 是否一致

完成后输出：
- findings，按严重程度排序
- 验证命令和结果
- 是否允许关闭 tenant-org-service foundation slice
```

### Thread D: party-service foundation design

```text
你是 OES 的 party-service foundation design thread。只推进 party-service 设计完善和迁移边界收口，不做代码实现。

必读：
- docs/plans/features/party-service-foundation.md
- docs/architecture/services/party-service.md
- docs/architecture/collaborations/party-identity-and-tenant-org.md
- docs/adr/0003-party-master-service-and-tenant-party-binding.md
- docs/contracts/party-service/README.md

目标：
- 检查 party-service 当前第一阶段是否还缺设计回写
- 收口历史 entity-service -> party-service 迁移边界
- 明确 party-service 与 tenant-org-service 的 organizationPartyId 后续协同是否需要独立 design

禁止：
- 不改代码
- 不把 customer/supplier/employee/contact 语义放进 party-service
- 不改 tenant-org-service 第一阶段范围

完成后输出：
- 设计缺口清单
- 哪些可以当前补文档
- 哪些应后置到 future party/tenant-org collaboration
```
