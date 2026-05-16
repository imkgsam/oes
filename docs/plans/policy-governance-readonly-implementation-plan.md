# Policy Governance Readonly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-stage tenant-web policy governance readonly surface so system administrators can inspect policy facts through api-gateway without introducing policy mutation, explain, or rule-builder scope.

**Architecture:** Keep the implementation thin and explicit. `api-gateway` adds a readonly HTTP controller plus a dedicated gRPC adapter over the existing `permission-service` policy query contract, `permission-service` only extends built-in navigation seed coverage, and `tenant-web` adds a readonly management page that consumes BFF APIs and remains fully gated by `navigation.visibleEntries` plus `permission.policy.list`.

**Tech Stack:** NestJS, gRPC, TypeScript, Jest, Vue 3, Vite, Vitest, Ant Design Vue, pnpm workspace.

---

## 1. Scope Guard

This plan is executable only while these upstream documents remain accepted:

- [policy-governance-readonly.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/policy-governance-readonly.md)
- [permission-management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/permission-management.md)
- [15-authorization-layering-and-resource-policy-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/15-authorization-layering-and-resource-policy-architecture.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)

Do not implement:

- Policy create, update, delete, or toggle endpoints in `api-gateway`.
- `conditionAstJson` editing or rule-builder UX.
- Policy explain / impact preview.
- Feature / plugin enablement filtering.
- New permission codes for policy detail or policy-by-permission views.

## 2. Planned File Structure

Gateway backend:

- Create: `src/services/api-gateway/src/modules/permission-service/adapters/policy-management-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/permission-service/interface/http/controllers/policy.controller.ts`
- Create: `src/services/api-gateway/src/modules/permission-service/interface/http/controllers/policy.controller.spec.ts`
- Create: `src/services/api-gateway/src/modules/permission-service/interface/http/dtos/policy-management.dto.ts`
- Modify: `src/services/api-gateway/src/modules/permission-service/interface/http/controllers/index.ts`
- Modify: `src/services/api-gateway/src/modules/permission-service/permission-service.module.ts`
- Modify: `src/services/api-gateway/src/modules/permission-service/permission-service.service.ts`

Permission-service seed coverage:

- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
- Modify: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`

Tenant-web BFF client and route surface:

- Create: `app/web/apps/tenant-web/src/api/bff/policy-governance/index.ts`
- Create: `app/web/apps/tenant-web/src/api/bff/policy-governance/index.spec.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/index.ts`
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
- Modify: `app/web/apps/tenant-web/src/router/access.spec.ts`

Tenant-web page:

- Create: `app/web/apps/tenant-web/src/views/admin/policy-governance.helpers.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/policy-governance.helpers.spec.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/policy-governance.spec.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/policy-governance.vue`

Docs close-out:

- Modify: `docs/plans/features/policy-governance-readonly.md`

## 3. Implementation Slices

### Slice A: Add Gateway Readonly Policy Proxy

**Purpose:** Expose the frozen readonly HTTP contract without mixing policy query wiring into existing permission CRUD paths.

- [ ] Create `policy-management-grpc.adapter.ts`.
- [ ] Inject `SERVICE_NAMES.PERMISSION` gRPC client and bind `PolicyManagementServiceClient` through `POLICY_MANAGEMENT_SERVICE_NAME`.
- [ ] Implement readonly methods only:
  - `listPolicies`
  - `getPolicyById`
  - `listPoliciesByPermission`
- [ ] Reuse `toOperatorScopedMetadataInput(source)` and the same metadata propagation strategy used by `permission-management-grpc.adapter.ts`.
- [ ] Map list defaults explicitly:
  - `page` default `1`
  - `pageSize` default `20`
  - `tenantId`, `permissionCode`, `keyword` pass through when non-empty
  - `isEnabled` only passes when the HTTP DTO carried the field
- [ ] Add a readonly DTO file `policy-management.dto.ts` with:
  - `ListPoliciesDto`
  - `ListPermissionPoliciesDto` if a dedicated query DTO keeps controller signatures clearer
- [ ] Keep DTO validation focused on readonly filters:
  - `page >= 1`
  - `pageSize >= 1`
  - `tenantId`, `permissionCode`, `keyword` as optional strings
  - `isEnabled` parsed from query string
- [ ] Extend `PermissionProxyService` with readonly policy methods that delegate to the new adapter instead of overloading `PermissionManagementGrpcAdapter`.
- [ ] Wire the new adapter in `permission-service.module.ts` and keep `PERMISSION_MANAGEMENT_PORT` unchanged.
- [ ] Create `policy.controller.ts` with exactly three routes:
  - `GET /policy`
  - `GET /policy/:id`
  - `GET /permission/:permissionCode/policies`
- [ ] Guard all three routes with `@RequirePermissions({ all: [PERMISSION_MANAGEMENT_PERMISSION_CODES.VIEW_POLICY] })`.
- [ ] Add succinct controller comments clarifying this controller is readonly governance only.
- [ ] Export the controller from `interface/http/controllers/index.ts`.
- [ ] Add `policy.controller.spec.ts` covering:
  - permission metadata for all three endpoints equals `permission.policy.list`
  - list route forwards normalized filters to `PermissionProxyService`
  - detail route forwards `id`
  - permission-linked list forwards `permissionCode` plus optional `tenantId`
- [ ] Verification:
  - Run `pnpm --dir src/services/api-gateway exec jest src/modules/permission-service/interface/http/controllers/policy.controller.spec.ts`
  - Run `pnpm --filter api-gateway build`

### Slice B: Publish Built-In Navigation Entry

**Purpose:** Make the new governance page visible through the existing navigation registry and keep system-admin-only visibility explicit.

- [ ] Add `admin.policy-governance` to `DEFAULT_NAVIGATION_ENTRIES` in `navigation-foundation.ts`.
- [ ] Use first-stage registry values aligned with other admin entries:
  - `name: 'Policy Governance'`
  - `description: 'Administrative policy governance readonly entry.'`
  - `featureKey: 'permission'`
  - `supportedTerminals: ['WEB']`
  - `enabled: true`
  - `entryType: 'page'`
- [ ] Place the registry priority between permission and navigation management pages so it stays in the same governance cluster.
- [ ] Extend `buildNavigationFoundationVisibilitySeeds()` so only system-level admin roles get `admin.policy-governance`.
- [ ] Do not add the entry to tenant-level admin visibility.
- [ ] Update `navigation-foundation.seed.spec.ts` to cover:
  - the new registry row exists
  - system admin visibility includes `admin.policy-governance`
  - tenant admin visibility still excludes it
- [ ] Verification:
  - Run `pnpm --filter permission-service test:l1 -- --runInBand test/l1/navigation-foundation.seed.spec.ts`

### Slice C: Add Tenant-Web Policy Governance API Client

**Purpose:** Give the frontend a dedicated readonly client so page code does not mix policy contracts into permission CRUD helpers.

- [ ] Create `app/web/apps/tenant-web/src/api/bff/policy-governance/index.ts`.
- [ ] Define stable frontend types:
  - `Policy`
  - `PolicyListQuery`
  - `PolicyListResult`
  - `PermissionPolicyListQuery`
  - `PermissionPolicyListResult`
- [ ] Mirror the readonly contract fields exposed by Gateway:
  - `id`
  - `name`
  - `effect`
  - `description`
  - `tenantId`
  - `subjectType`
  - `subjectId`
  - `permissionCode`
  - `resourceType`
  - `priority`
  - `isEnabled`
  - `conditionAstJson`
- [ ] Implement request helpers:
  - `listPoliciesApi(params)`
  - `getPolicyByIdApi(id)`
  - `listPermissionPoliciesApi(permissionCode, params?)`
- [ ] Keep URL generation explicit:
  - `/policy`
  - `/policy/${encodeURIComponent(id)}`
  - `/permission/${encodeURIComponent(permissionCode)}/policies`
- [ ] Create `index.spec.ts` to lock in path shapes and query forwarding.
- [ ] Export the new API module from `app/web/apps/tenant-web/src/api/bff/index.ts`.
- [ ] Verification:
  - Run `pnpm --dir app/web exec vitest run --dom app/web/apps/tenant-web/src/api/bff/policy-governance/index.spec.ts`

### Slice D: Add Tenant-Web Route And Readonly Page

**Purpose:** Provide the admin-facing readonly governance experience without exposing any policy mutation affordance.

- [ ] Add a new route to `tenant-admin/routes.ts`:
  - `name: 'AdminPolicyGovernance'`
  - `path: '/admin/policy-governance'`
  - `component: () => import('#/views/admin/policy-governance.vue')`
  - `meta.entryKey: 'admin.policy-governance'`
  - `meta.title: '策略治理'`
  - use a policy/security icon that matches the existing admin visual language
- [ ] Update `router/access.spec.ts` with one case that proves the governance parent stays visible when `admin.policy-governance` is the only visible child.
- [ ] Create `policy-governance.helpers.ts` for readonly presentation helpers instead of bloating the page component.
- [ ] Include helpers for:
  - mapping policy effect label / tag color
  - mapping subject type label
  - parsing and pretty-printing `conditionAstJson`
  - building table pagination state
- [ ] Create `policy-governance.helpers.spec.ts` covering label mapping and JSON formatting fallbacks.
- [ ] Create `policy-governance.vue` and keep it readonly:
  - top-level page title `策略治理`
  - filter bar with `keyword`, `permissionCode`, `tenantId`, `isEnabled`
  - paged policy table
  - detail drawer or side panel for one selected policy
  - readonly formatted `conditionAstJson` block
  - permission-linked policy list panel reachable from a row action
- [ ] Reuse `authContextStore.actionCodes` only for readonly gating; the page should not show create/edit/delete/toggle actions even when broader policy permissions exist downstream.
- [ ] Keep request flows minimal:
  - initial page load calls `listPoliciesApi`
  - clicking one row loads `getPolicyByIdApi`
  - clicking a permission-linked action loads `listPermissionPoliciesApi`
- [ ] Do not add mutation buttons, editable forms, inline switches, or AST editors.
- [ ] Create `policy-governance.spec.ts` covering:
  - initial list request on mount
  - filter submit forwards the expected query
  - row action opens readonly detail
  - formatted JSON section renders for non-empty `conditionAstJson`
  - create/edit/delete/toggle text does not appear
- [ ] Verification:
  - Run `pnpm --dir app/web exec vitest run --dom app/web/apps/tenant-web/src/views/admin/policy-governance.helpers.spec.ts`
  - Run `pnpm --dir app/web exec vitest run --dom app/web/apps/tenant-web/src/views/admin/policy-governance.spec.ts app/web/apps/tenant-web/src/router/access.spec.ts`
  - Run `pnpm --dir app/web --filter @oes/tenant-web typecheck`

### Slice E: Integration Verification And Packet Close-Out

**Purpose:** Prove the readonly flow is wired end-to-end and close the feature packet without drifting into adjacent policy work.

- [ ] Run the focused backend and frontend tests from Slices A through D again after integration.
- [ ] Run `pnpm --filter api-gateway build`.
- [ ] Run `pnpm --filter permission-service test:l1 -- --runInBand test/l1/navigation-foundation.seed.spec.ts`.
- [ ] Run `pnpm --dir app/web --filter @oes/tenant-web typecheck`.
- [ ] If the page or API client introduces compile-only regressions, run `pnpm --dir app/web --filter @oes/tenant-web build`.
- [ ] Update `docs/plans/features/policy-governance-readonly.md`:
  - mark producer owner `completed` when Gateway + seed land
  - mark consumer owner `completed` when tenant-web route/page/client land
  - mark review / integration owner `completed` after focused verification
  - move feature `status` from `ready-for-implementation-plan` to the appropriate completed state used by surrounding packets
- [ ] Final review checklist:
  - no new policy mutation route exists in `api-gateway`
  - no new permission code was introduced
  - tenant admins still do not receive `admin.policy-governance`
  - system admins can reach the page through visible entries
  - tenant-web never calls `permission-service` directly
  - `conditionAstJson` remains readonly presentation only

## 4. Review Notes Before Execution

- The key boundary is “readonly governance,” not “partial policy management.” If a task starts needing create, update, delete, toggle, explain, or builder UI, stop and split that into a new packet.
- `permission.policy.list` is the only gateway guard required in this phase. Do not invent detail-specific permission codes unless permission-code truth sources are revised first.
- Keep the new gRPC adapter separate from `PermissionManagementGrpcAdapter` so policy wiring stays explicit and future explain/mutation work can evolve independently.
