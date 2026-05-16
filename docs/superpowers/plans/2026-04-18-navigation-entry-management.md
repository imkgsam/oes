# Navigation Entry Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-stage navigation governance loop: persisted navigation entries, role-level visibility, role-level landing policy, resolver preview, Gateway management APIs, BFF navigation consumption, and tenant-web management surfaces.

**Architecture:** `permission-service` owns the first-stage navigation governance truth and exposes gRPC management/query operations. `api-gateway` remains a thin permission-management HTTP proxy and `auth-bff` consumes downstream navigation facts when building `session/context`. `tenant-web` keeps terminal-specific route/menu/icon/layout mapping and only manages entry registry plus role navigation configuration.

**Tech Stack:** NestJS, CQRS handlers, Prisma, gRPC proto in `@oes/common`, Gateway HTTP controllers/DTOs, Vue tenant-web, Vitest/Jest, pnpm.

---

## File Map

- Modify `src/common/src/contracts/permission_service/permission_management.proto`
  - Add messages and RPCs for navigation entry registry, role navigation config, and resolver preview.
- Modify `src/common/src/authorization/permission-codes/permission/management.permission-codes.ts`
  - Add `permission.navigation.*` management permission codes.
- Modify `src/services/system/permission-service/prisma/schema.prisma`
  - Add persistence for `NavigationEntry`, `RoleNavigationVisibility`, and `RoleLandingPolicy`.
- Create `src/services/system/permission-service/src/domain/aggregates/navigation-entry.aggregate.ts`
  - Defines the navigation entry aggregate and update rules.
- Create `src/services/system/permission-service/src/domain/vo/role-navigation-visibility.value-object.ts`
  - Defines role visibility value object.
- Create `src/services/system/permission-service/src/domain/vo/role-landing-policy.value-object.ts`
  - Defines role landing value object.
- Create `src/services/system/permission-service/src/domain/repositories/navigation.repository.ts`
  - Repository abstraction for navigation governance persistence.
- Create `src/services/system/permission-service/src/infrastructure/repositories/prisma/prisma.navigation.repository.ts`
  - Prisma implementation of the navigation repository.
- Create `src/services/system/permission-service/src/infrastructure/mappers/navigation.mapper.ts`
  - Maps Prisma records to domain objects and query results.
- Create `src/services/system/permission-service/src/application/queries/navigation/list-navigation-entries.query.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/list-navigation-entries.handler.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/get-navigation-entry.query.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/get-navigation-entry.handler.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/get-role-navigation.query.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/get-role-navigation.handler.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/resolve-navigation-preview.query.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/resolve-navigation-preview.handler.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/navigation-query.result.ts`
- Create `src/services/system/permission-service/src/application/queries/navigation/index.ts`
  - Query handlers for entry list/detail, role navigation config, and resolver preview.
- Create `src/services/system/permission-service/src/application/commands/navigation/create-navigation-entry.command.ts`
- Create `src/services/system/permission-service/src/application/commands/navigation/create-navigation-entry.handler.ts`
- Create `src/services/system/permission-service/src/application/commands/navigation/update-navigation-entry.command.ts`
- Create `src/services/system/permission-service/src/application/commands/navigation/update-navigation-entry.handler.ts`
- Create `src/services/system/permission-service/src/application/commands/navigation/set-role-navigation-visibility.command.ts`
- Create `src/services/system/permission-service/src/application/commands/navigation/set-role-navigation-visibility.handler.ts`
- Create `src/services/system/permission-service/src/application/commands/navigation/set-role-landing-policies.command.ts`
- Create `src/services/system/permission-service/src/application/commands/navigation/set-role-landing-policies.handler.ts`
- Create `src/services/system/permission-service/src/application/commands/navigation/index.ts`
  - Command handlers for create/update entry, set role visibility, and set role landing policies.
- Create `src/services/system/permission-service/src/domain/services/navigation-resolver.service.ts`
  - Resolves `visibleEntries` and `defaultEntry` from role navigation configuration.
- Modify `src/services/system/permission-service/src/interfaces/grpc/permission-management.grpc.controller.ts`
  - Add gRPC endpoints for navigation governance.
- Modify `src/services/system/permission-service/src/interfaces/grpc/permission-management.grpc.presenter.ts`
  - Add presenter mapping for navigation responses.
- Modify `src/services/system/permission-service/src/modules/role/role.module.ts`
  - Register navigation repository, resolver, commands, and queries.
- Modify `src/services/api-gateway/src/modules/permission-service/adapters/permission-management-grpc.adapter.ts`
  - Add downstream adapter methods for navigation governance.
- Create `src/services/api-gateway/src/modules/permission-service/interface/http/dtos/navigation-management.dto.ts`
  - HTTP DTOs for entry registry, role navigation, and resolver preview.
- Create `src/services/api-gateway/src/modules/permission-service/interface/http/controllers/navigation-management.controller.ts`
  - HTTP controller for `/navigation/*` and `/roles/:roleId/navigation/*`.
- Modify `src/services/api-gateway/src/modules/permission-service/interface/http/controllers/index.ts`
  - Export the new controller.
- Modify `src/services/api-gateway/src/modules/permission-service/permission-service.module.ts`
  - Register the new controller.
- Modify `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-context.use-case.ts`
  - Consume managed navigation facts when available while preserving current fallback.
- Create `src/services/api-gateway/src/modules/auth-bff/application/ports/permission-navigation.port.ts`
  - Add or extend a permission-service port for navigation resolution.
- Create `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/permission-service/permission-navigation-grpc.adapter.ts`
  - Adapts auth-bff session context to permission-service navigation resolution.
- Create `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/permission-service/permission-navigation-grpc.adapter.spec.ts`
  - Tests auth-bff navigation downstream mapping.
- Modify `app/web/apps/tenant-web/src/api/bff/permission-management/index.ts`
  - Add navigation-management API client methods and types.
- Modify `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
  - Add a route for Navigation Entry management.
- Create `app/web/apps/tenant-web/src/views/admin/navigation-entry-management.vue`
  - Entry registry management page.
- Defer role detail `Navigation` tab until the role-management UI page exists; record that deferral in the feature packet after the registry page is complete.

## Task 1: Common Contract And Permission Codes

**Files:**
- Modify: `src/common/src/contracts/permission_service/permission_management.proto`
- Modify: `src/common/src/authorization/permission-codes/permission/management.permission-codes.ts`
- Test: generated common build

- [ ] **Step 1: Add failing contract expectations**

Add a focused compile expectation by referencing the new generated service methods in a temporary test or existing adapter spec once generated. The names to drive toward:

```ts
NavigationEntryResponse
ListNavigationEntriesRequest
GetNavigationEntryRequest
CreateNavigationEntryRequest
UpdateNavigationEntryRequest
GetRoleNavigationRequest
SetRoleNavigationVisibilityRequest
SetRoleLandingPoliciesRequest
ResolveNavigationPreviewRequest
ResolveNavigationPreviewResponse
```

- [ ] **Step 2: Extend proto**

Add RPCs to `PermissionManagementService`:

```proto
rpc ListNavigationEntries(ListNavigationEntriesRequest) returns (ListNavigationEntriesResponse);
rpc GetNavigationEntry(GetNavigationEntryRequest) returns (NavigationEntryResponse);
rpc CreateNavigationEntry(CreateNavigationEntryRequest) returns (NavigationEntryResponse);
rpc UpdateNavigationEntry(UpdateNavigationEntryRequest) returns (NavigationEntryResponse);
rpc GetRoleNavigation(GetRoleNavigationRequest) returns (RoleNavigationResponse);
rpc SetRoleNavigationVisibility(SetRoleNavigationVisibilityRequest) returns (RoleNavigationResponse);
rpc SetRoleLandingPolicies(SetRoleLandingPoliciesRequest) returns (RoleNavigationResponse);
rpc ResolveNavigationPreview(ResolveNavigationPreviewRequest) returns (ResolveNavigationPreviewResponse);
```

Use enum-like strings for first-stage fields:

```proto
message NavigationEntryResponse {
  string entry_key = 1;
  string name = 2;
  string description = 3;
  string feature_key = 4;
  repeated string supported_terminals = 5;
  int32 registry_priority = 6;
  bool enabled = 7;
  string entry_type = 8;
}
```

- [ ] **Step 3: Add permission codes**

Add:

```ts
VIEW_NAVIGATION_ENTRY: 'permission.navigation.entry.list',
VIEW_NAVIGATION_ENTRY_DETAIL: 'permission.navigation.entry.get_by_key',
CREATE_NAVIGATION_ENTRY: 'permission.navigation.entry.create',
UPDATE_NAVIGATION_ENTRY: 'permission.navigation.entry.update',
RESOLVE_NAVIGATION_PREVIEW: 'permission.navigation.resolve_preview',
```

- [ ] **Step 4: Generate common code and verify**

Run:

```bash
pnpm --filter @oes/common build
```

Expected: PASS with generated TypeScript available under `src/common/src/generated/permission_service/permission_management.ts`.

## Task 2: Permission-Service Persistence And Domain

**Files:**
- Modify: `src/services/system/permission-service/prisma/schema.prisma`
- Create: `src/services/system/permission-service/src/domain/aggregates/navigation-entry.aggregate.ts`
- Create: `src/services/system/permission-service/src/domain/vo/role-navigation-visibility.value-object.ts`
- Create: `src/services/system/permission-service/src/domain/vo/role-landing-policy.value-object.ts`
- Create: `src/services/system/permission-service/src/domain/repositories/navigation.repository.ts`
- Create: `src/services/system/permission-service/src/infrastructure/mappers/navigation.mapper.ts`
- Create: `src/services/system/permission-service/src/infrastructure/repositories/prisma/prisma.navigation.repository.ts`
- Test: `src/services/system/permission-service/test/l1/navigation.repository.spec.ts`

- [ ] **Step 1: Write repository behavior tests**

Cover:

```ts
it('stores and lists enabled navigation entries by terminal')
it('replaces role visibility as a full set')
it('rejects landing policy when default entry is not visible for the role')
it('resolves highest-priority visible role landing entry')
```

- [ ] **Step 2: Add Prisma models**

Add models with unique constraints:

```prisma
model NavigationEntry {
  id                 String   @id @default(cuid())
  entryKey           String   @unique
  name               String
  description        String?
  featureKey         String?
  supportedTerminals Json
  registryPriority   Int      @default(0)
  enabled            Boolean  @default(true)
  entryType          String
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  roleVisibilities RoleNavigationVisibility[]
  roleLandingPolicies RoleLandingPolicy[]
}

model RoleNavigationVisibility {
  id         String @id @default(cuid())
  roleId     String
  entryKey   String
  scopeLevel String
  terminal   String
  enabled    Boolean @default(true)

  entry NavigationEntry @relation(fields: [entryKey], references: [entryKey])

  @@unique([roleId, entryKey, scopeLevel, terminal])
  @@index([roleId, scopeLevel, terminal])
}

model RoleLandingPolicy {
  id              String @id @default(cuid())
  roleId          String
  scopeLevel      String
  terminal        String
  defaultEntryKey String
  priority        Int    @default(0)
  enabled         Boolean @default(true)

  entry NavigationEntry @relation(fields: [defaultEntryKey], references: [entryKey])

  @@unique([roleId, scopeLevel, terminal, defaultEntryKey])
  @@index([roleId, scopeLevel, terminal])
}
```

- [ ] **Step 3: Implement domain and repository**

Keep comments concise and include a summary comment for each new class.

- [ ] **Step 4: Run repository tests**

Run:

```bash
pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/navigation.repository.spec.ts
```

Expected: PASS.

## Task 3: Permission-Service Application And Resolver

**Files:**
- Create: `src/services/system/permission-service/src/domain/services/navigation-resolver.service.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/list-navigation-entries.query.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/list-navigation-entries.handler.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/get-navigation-entry.query.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/get-navigation-entry.handler.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/get-role-navigation.query.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/get-role-navigation.handler.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/resolve-navigation-preview.query.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/resolve-navigation-preview.handler.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/navigation-query.result.ts`
- Create: `src/services/system/permission-service/src/application/queries/navigation/index.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/create-navigation-entry.command.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/create-navigation-entry.handler.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/update-navigation-entry.command.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/update-navigation-entry.handler.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/set-role-navigation-visibility.command.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/set-role-navigation-visibility.handler.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/set-role-landing-policies.command.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/set-role-landing-policies.handler.ts`
- Create: `src/services/system/permission-service/src/application/commands/navigation/index.ts`
- Modify: `src/services/system/permission-service/src/application/queries/index.ts`
- Modify: `src/services/system/permission-service/src/application/commands/index.ts`
- Modify: `src/services/system/permission-service/src/modules/role/role.module.ts`
- Test: `src/services/system/permission-service/test/l1/navigation-management.handlers.spec.ts`

- [ ] **Step 1: Write handler and resolver tests**

Cover:

```ts
it('lists navigation entries with keyword and terminal filters')
it('returns role navigation config with visibility and landing policies')
it('sets role visibility using full replacement semantics')
it('sets landing policies only when default entries are visible')
it('preview resolves visible entries and default entry for multiple roles')
it('preview falls back to registry priority when no landing candidate is visible')
```

- [ ] **Step 2: Implement resolver order**

Resolver order:

```ts
visibleEntries = enabled entries filtered by terminal + scope + role visibility
landingCandidates = enabled role landing policies filtered by roleIds + scope + terminal
defaultEntry = highest priority landing candidate present in visibleEntries
defaultEntry ??= highest registry priority visible entry
defaultEntry ??= scope fallback
```

- [ ] **Step 3: Implement commands and queries**

Commands:

```ts
CreateNavigationEntryCommand
UpdateNavigationEntryCommand
SetRoleNavigationVisibilityCommand
SetRoleLandingPoliciesCommand
```

Queries:

```ts
ListNavigationEntriesQuery
GetNavigationEntryQuery
GetRoleNavigationQuery
ResolveNavigationPreviewQuery
```

- [ ] **Step 4: Run application tests**

Run:

```bash
pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/navigation-management.handlers.spec.ts
```

Expected: PASS.

## Task 4: Permission-Service gRPC Surface

**Files:**
- Modify: `src/services/system/permission-service/src/interfaces/grpc/permission-management.grpc.controller.ts`
- Modify: `src/services/system/permission-service/src/interfaces/grpc/permission-management.grpc.presenter.ts`
- Test: `src/services/system/permission-service/test/l3/permission-management.grpc.controller.additional.spec.ts`

- [ ] **Step 1: Add controller tests for all navigation RPCs**

Assert controller maps proto requests to application commands/queries and presenter maps response shape.

- [ ] **Step 2: Add gRPC controller methods**

Methods:

```ts
listNavigationEntries()
getNavigationEntry()
createNavigationEntry()
updateNavigationEntry()
getRoleNavigation()
setRoleNavigationVisibility()
setRoleLandingPolicies()
resolveNavigationPreview()
```

- [ ] **Step 3: Run gRPC tests**

Run:

```bash
pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l3/permission-management.grpc.controller.additional.spec.ts
```

Expected: PASS.

## Task 5: API Gateway Management HTTP Surface

**Files:**
- Create: `src/services/api-gateway/src/modules/permission-service/interface/http/dtos/navigation-management.dto.ts`
- Create: `src/services/api-gateway/src/modules/permission-service/interface/http/controllers/navigation-management.controller.ts`
- Modify: `src/services/api-gateway/src/modules/permission-service/interface/http/controllers/index.ts`
- Modify: `src/services/api-gateway/src/modules/permission-service/permission-service.module.ts`
- Modify: `src/services/api-gateway/src/modules/permission-service/adapters/permission-management-grpc.adapter.ts`
- Test: `src/services/api-gateway/src/modules/permission-service/interface/http/controllers/navigation-management.controller.spec.ts`

- [ ] **Step 1: Write controller tests**

Cover endpoints from `docs/contracts/api-gateway/permission-management.md` section 9.

- [ ] **Step 2: Implement DTOs**

DTO classes:

```ts
ListNavigationEntriesDto
CreateNavigationEntryDto
UpdateNavigationEntryDto
SetRoleNavigationVisibilityDto
SetRoleLandingPoliciesDto
ResolveNavigationPreviewDto
```

- [ ] **Step 3: Implement controller and adapter**

Use existing `@RequirePermissions` / Gateway guard pattern from role and permission controllers.

- [ ] **Step 4: Run Gateway tests**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/permission-service/interface/http/controllers/navigation-management.controller.spec.ts --runInBand
```

Expected: PASS.

## Task 6: Auth BFF Navigation Consumption

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-context.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/application/ports/permission-navigation.port.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/permission-service/permission-navigation-grpc.adapter.ts`
- Create: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/permission-service/permission-navigation-grpc.adapter.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/auth-bff.module.ts`

- [ ] **Step 1: Write session-context tests**

Cover:

```ts
it('uses managed navigation summary when permission-service returns one')
it('keeps current scope fallback when managed navigation is unavailable')
it('never returns defaultEntry outside visibleEntries')
```

- [ ] **Step 2: Add downstream port method**

Add a method equivalent to:

```ts
resolveNavigationForSession(input: {
  roleIds: string[]
  scopeLevel: 'SYSTEM' | 'TENANT'
  terminal: 'WEB'
}): Promise<{ visibleEntries: string[]; defaultEntry: string }>
```

- [ ] **Step 3: Integrate with existing fallback**

Preserve current stage-one behavior if downstream is not implemented or returns no entries.

- [ ] **Step 4: Run auth-bff tests**

Run:

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts --runInBand
```

Expected: PASS.

## Task 7: Tenant-Web API Client And Entry Page

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/permission-management/index.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/permission-management/index.spec.ts`
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/navigation-entry-management.vue`
- Create: `app/web/apps/tenant-web/src/views/admin/navigation-entry-management.helpers.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/navigation-entry-management.helpers.spec.ts`

- [ ] **Step 1: Write API client tests**

Cover all navigation management endpoints and request mapping.

- [ ] **Step 2: Implement API client**

Export types and functions for:

```ts
listNavigationEntries
createNavigationEntry
getNavigationEntry
updateNavigationEntry
getRoleNavigation
setRoleNavigationVisibility
setRoleLandingPolicies
resolveNavigationPreview
```

- [ ] **Step 3: Add admin route**

Add route metadata:

```ts
meta: {
  entryKey: 'admin.navigation-entry-management'
}
```

- [ ] **Step 4: Implement first registry page**

First page scope:

- entry list
- basic filters
- create/edit form
- enable/disable

Do not implement role `Navigation` tab in this task if role-management UI is not ready.

- [ ] **Step 5: Run frontend tests**

Run:

```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/permission-management/index.spec.ts apps/tenant-web/src/views/admin/navigation-entry-management.helpers.spec.ts --dom
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected: PASS.

## Task 8: Verification And Contract Alignment

**Files:**
- Modify: `docs/contracts/api-gateway/permission-management.md`
- Modify: `docs/contracts/api-gateway/navigation-summary.md`
- Modify: `docs/plans/features/navigation-entry-management.md`

- [ ] **Step 1: Run focused service tests**

```bash
pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/navigation.repository.spec.ts test/l1/navigation-management.handlers.spec.ts test/l3/permission-management.grpc.controller.additional.spec.ts
```

- [ ] **Step 2: Run focused Gateway tests**

```bash
pnpm --dir src/services/api-gateway exec jest src/modules/permission-service/interface/http/controllers/navigation-management.controller.spec.ts src/modules/auth-bff/application/use-cases/session-context.use-case.spec.ts --runInBand
```

- [ ] **Step 3: Run focused frontend tests**

```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/permission-management/index.spec.ts apps/tenant-web/src/views/admin/navigation-entry-management.helpers.spec.ts --dom
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

- [ ] **Step 4: Update feature packet implementation status**

Record implemented endpoints, tests, and remaining deferred work in `docs/plans/features/navigation-entry-management.md`.

## Execution Notes

- Implement backend persistence before Gateway and frontend.
- Keep role `Navigation` tab as a separate UI follow-up if role-management page is not ready.
- Do not add feature/plugin enablement filtering in this implementation.
- Do not add user landing preferences or account-level overrides.
- Do not return Web routes or menu hierarchy from backend navigation contracts.
