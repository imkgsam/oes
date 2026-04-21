# Permission Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first tenant-web Permission Management closed loop and expose the matching navigation entry.

**Architecture:** Reuse the existing Gateway `/permission` HTTP contract and add only a navigation-entry emission to `auth-bff`. Tenant-web owns the route, page, and API client; permission-service remains the permission truth source.

**Tech Stack:** Vue 3, TypeScript, Ant Design Vue, Vben route/menu generation, NestJS/Jest for BFF use-case tests, Vitest for tenant-web API client tests.

---

### Task 1: Auth-BFF Navigation Entry

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-context.use-case.ts`
- Modify: `docs/contracts/api-gateway/navigation-summary.md`

- [ ] **Step 1: Write the failing test**

Add a Jest case that returns `actionCodes: ['permission.list']` and expects `admin.permission-management` in `navigation.visibleEntries`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts --runInBand`

Expected: FAIL because `admin.permission-management` is not emitted yet.

- [ ] **Step 3: Write minimal implementation**

Add `const ADMIN_PERMISSION_MANAGEMENT_ENTRY = 'admin.permission-management'`, check `accessSummary.actionCodes.includes('permission.list')`, and push the entry.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts --runInBand`

Expected: PASS.

### Task 2: Tenant-Web Permission API Client

**Files:**
- Create: `app/web/apps/tenant-web/src/api/bff/permission-management/index.spec.ts`
- Create: `app/web/apps/tenant-web/src/api/bff/permission-management/index.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/index.ts`

- [ ] **Step 1: Write the failing test**

Add Vitest coverage for `listPermissionsApi`, `createPermissionApi`, `updatePermissionApi`, `deletePermissionApi`, and `listPermissionRolesApi`, mocking `requestClient`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/permission-management/index.spec.ts --dom`

Expected: FAIL because the API client module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create typed API functions that call `/permission`, `/permission/id/:id`, `/permission/:id`, and `/permission/:id/roles`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/permission-management/index.spec.ts --dom`

Expected: PASS.

### Task 3: Tenant-Web Route And Page

**Files:**
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
- Create: `app/web/apps/tenant-web/src/router/routes/modules/tenant-admin.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/permission-management.vue`

- [ ] **Step 1: Implement route**

Expose `/admin/permission-management` with route name `AdminPermissionManagement` and `meta.entryKey = 'admin.permission-management'`.

- [ ] **Step 2: Implement page**

Create a Vue page that supports permission list/search/page, create/edit drawer, delete confirmation, detail drawer, and referenced roles drawer.

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm --dir app/web --filter @oes/tenant-web typecheck`

Expected: PASS.

### Task 4: Final Verification And Feature Packet Update

**Files:**
- Modify: `docs/plans/features/permission-management.md`
- Modify: `docs/plans/features/role-management.md` if status changes are needed.

- [ ] **Step 1: Run focused backend test**

Run: `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 2: Run focused frontend test**

Run: `pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/permission-management/index.spec.ts --dom`

Expected: PASS.

- [ ] **Step 3: Run frontend typecheck/build**

Run: `pnpm --dir app/web --filter @oes/tenant-web typecheck`

Expected: PASS.

Run: `pnpm --dir app/web --filter @oes/tenant-web build`

Expected: PASS.

- [ ] **Step 4: Update feature packet**

Mark `permission-management` implementation status and validation evidence in `docs/plans/features/permission-management.md`.
