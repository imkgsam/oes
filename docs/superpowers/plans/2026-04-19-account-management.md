# Account Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the standalone account-role management entry with an account-management workflow where administrators land on a paged account directory and open role configuration from row actions.

**Architecture:** Tenant-web keeps account-role assignment as an internal account-management action. Navigation visibility remains driven by permission-service seeded entries and BFF visible entries; the frontend does not hardcode roles.

**Tech Stack:** Vue 3, Ant Design Vue, Vitest, NestJS permission-service seed tests.

---

### Task 1: Lock Account Management Behavior With Tests

**Files:**
- Create: `app/web/apps/tenant-web/src/views/admin/account-management.helpers.spec.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/account-management.spec.ts`
- Modify: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`

- [x] Add helper tests for flattening user search results into account rows, tenant visibility scoping, and scope filtering.
- [x] Add page test for keyword search, account table rendering, row `角色配置`, role selection loading, and save.
- [x] Change navigation seed expectations from `admin.account-role-management` to `admin.account-management`.
- [x] Run tests and confirm they fail before implementation.

### Task 2: Implement Tenant-Web Account Management Page

**Files:**
- Create: `app/web/apps/tenant-web/src/views/admin/account-management.helpers.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/account-management.vue`
- Delete: `app/web/apps/tenant-web/src/views/admin/account-role-management.vue`
- Delete: `app/web/apps/tenant-web/src/views/admin/account-role-management.helpers.ts`
- Delete: `app/web/apps/tenant-web/src/views/admin/account-role-management.spec.ts`
- Delete: `app/web/apps/tenant-web/src/views/admin/account-role-management.helpers.spec.ts`

- [x] Implement `buildAccountRows` to flatten `searchAdminUsersApi` results into account rows.
- [x] Implement a page with keyword and scope filters, an account table, and row-level `角色配置`.
- [x] Implement the role configuration drawer using `getAccountRoleSelectionApi` and `setAccountRolesApi`.
- [x] Keep action enablement tied to `actionCodes`.

### Task 3: Move Navigation Entry To Account Management

**Files:**
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
- Modify: `app/web/apps/tenant-web/src/store/auth-context.ts`
- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`

- [x] Route `/admin/account-management` to `account-management.vue`.
- [x] Replace entry key `admin.account-role-management` with `admin.account-management`.
- [x] Keep entry visibility seeded for system admin and tenant admin roles.

### Task 4: Verification

**Files:**
- Modify: `docs/plans/features/account-management.md`

- [x] Run tenant-web account management tests.
- [x] Run permission-service navigation foundation seed test.
- [x] Run account-role API client test.
- [x] Run tenant-web typecheck and build.
- [x] Run permission-service build.
- [x] Sync permission-service seed data.

### Task 5: Upgrade To A Real Account Directory

**Files:**
- Modify: `src/common/src/contracts/identity_service/identity_query.proto`
- Modify: `src/common/src/generated/identity_service/identity_query.ts`
- Modify: `src/services/system/identity-service/src/domain/repositories/account.repository.ts`
- Modify: `src/services/system/identity-service/src/infrastructure/repositories/prisma/prisma.account.repository.ts`
- Modify: `src/services/system/identity-service/src/application/queries/account/**`
- Modify: `src/services/system/identity-service/src/interfaces/grpc/identity-query.grpc.controller.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/identity-service/identity-query-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/account-management.vue`
- Modify: `docs/plans/features/account-management.md`

- [x] Add an identity-service `ListAccounts` query with keyword, scope, status, page, and page size.
- [x] Add an auth-bff `GET /auth/admin/accounts` endpoint guarded by account-role read permission.
- [x] Move tenant-web account management from keyword-required search mode to default-loaded paged table mode.
- [x] Align the page layout with navigation-management table/filter structure.
- [ ] Re-run proto generation, backend/frontend tests, typecheck, build, and seed sync.
