# Public Entry Navigation Entries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move ShortLink and BusinessCard management into a dedicated `公开触点` navigation group while keeping `我的名片` as an authenticated self-service route outside administrator menus.

**Architecture:** Tenant-web owns the concrete route tree and menu grouping; permission-service owns the navigation entry registry and role visibility seed. The management pages get new `public-entry.*` entry keys, while self-view has no admin navigation entry and stays reachable through a hidden authenticated route.

**Tech Stack:** Vue Router route records, Vitest route/access tests, NestJS permission-service TypeScript seed source, Jest seed tests.

---

## File Structure

- Modify `app/web/apps/tenant-web/src/modules/tenant-admin/routes.spec.ts`
  - Update route placement assertions from `TenantAdminGovernance` to a new `TenantPublicEntry` group.
  - Assert `我的名片` is not under the admin/governance menu and remains a hidden self-service route.
- Modify `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
  - Add top-level `TenantPublicEntry` route group.
  - Move `AdminBusinessCards` and `AdminPublicEntryShortLinks` into that group.
  - Change their entry keys to `public-entry.business-cards` and `public-entry.short-links`.
  - Move `EmployeeBusinessCardSelfView` to a hidden authenticated route without `entryKey`.
- Modify `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
  - Add the two `public-entry.*` entries to registry and role visibility expectations.
- Modify `src/services/system/permission-service/test/l1/permission-service-seed.spec.ts`
  - Update seed counts for navigation entries and visibility rows.
- Modify `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
  - Register the two new navigation entries.
  - Add them to `system.admin` and `tenant.admin` built-in visibility.

## Task 1: Tenant-Web Route Tests

**Files:**
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.spec.ts`
- Test: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.spec.ts`

- [ ] **Step 1: Replace the old Public Entry route placement specs with failing expectations**

Replace the current tests named `registers public entry ShortLink management under the tenant admin section` and `registers BusinessCard admin and employee self-view pages under tenant admin` with:

```ts
  it('registers public-entry management pages under the dedicated public touchpoint section', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const publicEntryRoute = tenantAdminRoutes.find((route) => route.name === 'TenantPublicEntry')
    const shortLinkRoute = publicEntryRoute?.children?.find(
      (route) => route.name === 'AdminPublicEntryShortLinks'
    )
    const businessCardAdminRoute = publicEntryRoute?.children?.find(
      (route) => route.name === 'AdminBusinessCards'
    )

    expect(governanceRoute?.children?.some((route) => route.name === 'AdminPublicEntryShortLinks')).toBe(false)
    expect(governanceRoute?.children?.some((route) => route.name === 'AdminBusinessCards')).toBe(false)
    expect(publicEntryRoute?.path).toBe('/public-entry')
    expect(publicEntryRoute?.meta?.title).toBe('公开触点')
    expect(publicEntryRoute?.meta?.icon).toBe('lucide:radio-tower')
    expect(shortLinkRoute?.path).toBe('/public-entry/short-links')
    expect(shortLinkRoute?.alias).toBe('/admin/public-entry-short-links')
    expect(shortLinkRoute?.meta?.entryKey).toBe('public-entry.short-links')
    expect(shortLinkRoute?.meta?.title).toBe('公开短链')
    expect(shortLinkRoute?.component).toBeTypeOf('function')
    expect(businessCardAdminRoute?.path).toBe('/public-entry/business-cards')
    expect(businessCardAdminRoute?.alias).toBe('/admin/business-cards')
    expect(businessCardAdminRoute?.meta?.entryKey).toBe('public-entry.business-cards')
    expect(businessCardAdminRoute?.meta?.title).toBe('员工数字名片')
    expect(businessCardAdminRoute?.component).toBeTypeOf('function')
  })

  it('keeps employee BusinessCard self-view as a hidden authenticated self-service route', () => {
    const governanceRoute = tenantAdminRoutes.find((route) => route.name === 'TenantAdminGovernance')
    const publicEntryRoute = tenantAdminRoutes.find((route) => route.name === 'TenantPublicEntry')
    const businessCardSelfRoute = tenantAdminRoutes.find(
      (route) => route.name === 'EmployeeBusinessCardSelfView'
    )

    expect(governanceRoute?.children?.some((route) => route.name === 'EmployeeBusinessCardSelfView')).toBe(false)
    expect(publicEntryRoute?.children?.some((route) => route.name === 'EmployeeBusinessCardSelfView')).toBe(false)
    expect(businessCardSelfRoute?.path).toBe('/profile/business-card')
    expect(businessCardSelfRoute?.alias).toEqual([
      '/admin/business-card-self-view',
      '/admin/business-card-self'
    ])
    expect(businessCardSelfRoute?.meta?.entryKey).toBeUndefined()
    expect(businessCardSelfRoute?.meta?.hideInMenu).toBe(true)
    expect(businessCardSelfRoute?.meta?.title).toBe('我的名片')
    expect(businessCardSelfRoute?.component).toBeTypeOf('function')
  })
```

- [ ] **Step 2: Run the focused route spec and confirm it fails**

Run:

```bash
pnpm --dir app/web test:unit -- apps/tenant-web/src/modules/tenant-admin/routes.spec.ts
```

Expected: FAIL because `TenantPublicEntry` does not exist, the management routes still use `admin.*` entry keys, and self-view is still under `TenantAdminGovernance`.

## Task 2: Tenant-Web Route Implementation

**Files:**
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
- Test: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.spec.ts`

- [ ] **Step 1: Remove Public Entry management and self-view children from `TenantAdminGovernance`**

In `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`, remove the three existing child objects named:

```ts
AdminPublicEntryShortLinks
AdminBusinessCards
EmployeeBusinessCardSelfView
```

from the `TenantAdminGovernance` children array.

- [ ] **Step 2: Add the dedicated `公开触点` top-level route group**

Insert this top-level route object after `TenantAdminGovernance` and before `TenantSettings`:

```ts
  {
    meta: {
      icon: 'lucide:radio-tower',
      order: 11,
      title: '公开触点',
    },
    name: 'TenantPublicEntry',
    path: '/public-entry',
    children: [
      {
        name: 'AdminBusinessCards',
        path: '/public-entry/business-cards',
        alias: '/admin/business-cards',
        component: () => import('#/views/admin/business-card-management.vue'),
        meta: {
          entryKey: 'public-entry.business-cards',
          icon: 'lucide:contact-round',
          title: '员工数字名片',
        },
      },
      {
        name: 'AdminPublicEntryShortLinks',
        path: '/public-entry/short-links',
        alias: '/admin/public-entry-short-links',
        component: () => import('#/views/admin/public-entry-short-link-management.vue'),
        meta: {
          entryKey: 'public-entry.short-links',
          icon: 'lucide:link',
          title: '公开短链',
        },
      },
    ],
  },
```

Update the existing `TenantSettings` `meta.order` from `11` to `12` so the top-level menu order remains deterministic:

```ts
    meta: {
      icon: 'lucide:settings-2',
      order: 12,
      title: '租户设置',
    },
```

- [ ] **Step 3: Add hidden authenticated self-view route outside admin menus**

Insert this top-level route object after `TenantPublicEntry`:

```ts
  {
    name: 'EmployeeBusinessCardSelfView',
    path: '/profile/business-card',
    alias: ['/admin/business-card-self-view', '/admin/business-card-self'],
    component: () => import('#/views/admin/business-card-self-view.vue'),
    meta: {
      hideInMenu: true,
      icon: 'lucide:badge-check',
      title: '我的名片',
    },
  },
```

Do not set `meta.entryKey` on this route. Routes without `entryKey` survive `visibleEntries` filtering, while `hideInMenu: true` keeps it out of generated menus.

- [ ] **Step 4: Run the route spec and confirm it passes**

Run:

```bash
pnpm --dir app/web test:unit -- apps/tenant-web/src/modules/tenant-admin/routes.spec.ts
```

Expected: PASS.

## Task 3: Permission Navigation Seed Tests

**Files:**
- Modify: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
- Modify: `src/services/system/permission-service/test/l1/permission-service-seed.spec.ts`
- Test: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
- Test: `src/services/system/permission-service/test/l1/permission-service-seed.spec.ts`

- [ ] **Step 1: Add expected Public Entry registry keys**

In `navigation-foundation.seed.spec.ts`, update the expected `DEFAULT_NAVIGATION_ENTRIES.map((item) => item.entryKey)` list by inserting these keys after `admin.navigation-management` and before `collaboration.tasks`:

```ts
      'public-entry.business-cards',
      'public-entry.short-links',
```

- [ ] **Step 2: Add expected Public Entry registry names**

In the Chinese name list, insert these names after `导航管理` and before `任务工作台`:

```ts
      '员工数字名片',
      '公开短链',
```

- [ ] **Step 3: Update role visibility expectations**

In the full `expect(visibility).toEqual([...])` assertion, add these rows after each `admin.navigation-management` row for `role-system-admin`, and after `master-data.customer-management` for `template-tenant-admin` and `role-tenant-admin`:

```ts
      {
        roleId: 'role-system-admin',
        entryKey: 'public-entry.business-cards',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-system-admin',
        entryKey: 'public-entry.short-links',
        terminal: 'DEFAULT',
        enabled: true
      },
```

```ts
      {
        roleId: 'template-tenant-admin',
        entryKey: 'public-entry.business-cards',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'template-tenant-admin',
        entryKey: 'public-entry.short-links',
        terminal: 'DEFAULT',
        enabled: true
      },
```

```ts
      {
        roleId: 'role-tenant-admin',
        entryKey: 'public-entry.business-cards',
        terminal: 'DEFAULT',
        enabled: true
      },
      {
        roleId: 'role-tenant-admin',
        entryKey: 'public-entry.short-links',
        terminal: 'DEFAULT',
        enabled: true
      },
```

- [ ] **Step 4: Update seed count expectations**

In `permission-service-seed.spec.ts`, change:

```ts
    expect(seed.navigationEntries).toHaveLength(32)
    expect(seed.roleNavigationVisibility).toHaveLength(36)
```

to:

```ts
    expect(seed.navigationEntries).toHaveLength(34)
    expect(seed.roleNavigationVisibility).toHaveLength(40)
```

and change the dry-run summary expectation:

```ts
      navigationEntryCount: 34,
      roleNavigationVisibilityCount: 40,
```

- [ ] **Step 5: Run focused permission seed tests and confirm they fail**

Run:

```bash
pnpm --filter permission-service test:l1 -- navigation-foundation.seed.spec.ts permission-service-seed.spec.ts
```

Expected: FAIL because the navigation foundation does not yet publish the new entries or visibility rows.

## Task 4: Permission Navigation Seed Implementation

**Files:**
- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
- Test: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
- Test: `src/services/system/permission-service/test/l1/permission-service-seed.spec.ts`

- [ ] **Step 1: Add Public Entry entries to built-in admin role visibility**

In `NAVIGATION_VISIBILITY_ENTRY_KEYS_BY_ROLE_CODE`, add these keys to `system.admin` after `admin.navigation-management` and before `collaboration.tasks`:

```ts
    'public-entry.business-cards',
    'public-entry.short-links',
```

Add the same two keys to `tenant.admin` after `master-data.customer-management`:

```ts
    'public-entry.business-cards',
    'public-entry.short-links'
```

Do not add them to `hr.admin` or `account.basic`.

- [ ] **Step 2: Register the Public Entry navigation entries**

In `DEFAULT_NAVIGATION_ENTRIES`, insert these two entries after `admin.navigation-management`:

```ts
  {
    entryKey: 'public-entry.business-cards',
    name: '员工数字名片',
    description: '租户侧员工数字名片公开展示、主公开入口、二维码与访问摘要管理入口。',
    featureKey: 'public-entry',
    supportedTerminals: ['WEB'],
    registryPriority: 28,
    enabled: true,
    entryType: 'page'
  },
  {
    entryKey: 'public-entry.short-links',
    name: '公开短链',
    description: '租户侧 ShortLink 生命周期、目标迁移、二维码与访问统计治理入口。',
    featureKey: 'public-entry',
    supportedTerminals: ['WEB'],
    registryPriority: 29,
    enabled: true,
    entryType: 'page'
  },
```

Then increment the following existing priorities by `2`:

```ts
collaboration.tasks -> registryPriority: 30
pda.home -> registryPriority: 31
kiosk.home -> registryPriority: 32
extension.designer.workspace -> registryPriority: 33
```

- [ ] **Step 3: Run focused permission seed tests and confirm they pass**

Run:

```bash
pnpm --filter permission-service test:l1 -- navigation-foundation.seed.spec.ts permission-service-seed.spec.ts
```

Expected: PASS.

## Task 5: Cross-Layer Access Verification

**Files:**
- Modify: `app/web/apps/tenant-web/src/router/access.spec.ts`
- Test: `app/web/apps/tenant-web/src/router/access.spec.ts`

- [ ] **Step 1: Add visible-entry filtering coverage for the new public touchpoint group**

Append this test inside `describe('router access visible-entry filtering', () => { ... })`:

```ts
  it('keeps the public touchpoint parent when BusinessCard or ShortLink entries are visible', async () => {
    const { filterRoutesByVisibleEntries } = await import('./access');
    const routes = [
      {
        children: [
          {
            meta: {
              entryKey: 'public-entry.business-cards',
            },
            name: 'AdminBusinessCards',
            path: '/public-entry/business-cards',
          },
          {
            meta: {
              entryKey: 'public-entry.short-links',
            },
            name: 'AdminPublicEntryShortLinks',
            path: '/public-entry/short-links',
          },
        ],
        name: 'TenantPublicEntry',
        path: '/public-entry',
      },
      {
        meta: {
          hideInMenu: true,
        },
        name: 'EmployeeBusinessCardSelfView',
        path: '/profile/business-card',
      },
    ];

    const filtered = filterRoutesByVisibleEntries(routes, ['public-entry.business-cards']);

    expect(filtered).toEqual([
      {
        children: [
          {
            meta: {
              entryKey: 'public-entry.business-cards',
            },
            name: 'AdminBusinessCards',
            path: '/public-entry/business-cards',
          },
        ],
        name: 'TenantPublicEntry',
        path: '/public-entry',
      },
      {
        meta: {
          hideInMenu: true,
        },
        name: 'EmployeeBusinessCardSelfView',
        path: '/profile/business-card',
      },
    ]);
  });
```

- [ ] **Step 2: Run the focused access spec**

Run:

```bash
pnpm --dir app/web test:unit -- apps/tenant-web/src/router/access.spec.ts
```

Expected: PASS. The hidden self-view route remains accessible because it has no `entryKey`.

## Task 6: Final Verification

**Files:**
- No code changes.
- Verify all files touched by Tasks 1-5.

- [ ] **Step 1: Run tenant-web route and access tests**

Run:

```bash
pnpm --dir app/web test:unit -- apps/tenant-web/src/modules/tenant-admin/routes.spec.ts apps/tenant-web/src/router/access.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run permission-service seed tests**

Run:

```bash
pnpm --filter permission-service test:l1 -- navigation-foundation.seed.spec.ts permission-service-seed.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run tenant-web typecheck**

Run:

```bash
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

Expected: PASS.

- [ ] **Step 4: Run permission-service foundation sync after tests pass**

Run:

```bash
pnpm --filter permission-service seed:apply -- --apply
```

Expected: command completes successfully and prints navigation entry/visibility counts including `34` entries and `40` role visibility rows.

- [ ] **Step 5: Manual smoke in tenant-web**

After backend and tenant-web are running, log in as a tenant admin and verify:

```text
公开触点 appears as a top-level menu.
公开触点 -> 员工数字名片 opens /public-entry/business-cards.
公开触点 -> 公开短链 opens /public-entry/short-links.
/admin/business-cards redirects or resolves via alias to the BusinessCard page.
/admin/public-entry-short-links redirects or resolves via alias to the ShortLink page.
/profile/business-card opens 我的名片 but does not appear in administrator menus.
```

## Self-Review

- Spec coverage:
  - Dedicated `公开触点` group: Tasks 1, 2, 3, 4, 5.
  - BusinessCard and ShortLink as management entries: Tasks 1, 2, 3, 4.
  - `我的名片` outside admin navigation: Tasks 1, 2, 5.
  - Employee detail only gets a future status/jump relation: explicitly excluded from this implementation and preserved as follow-up from the design record.
- Completion scan:
  - The plan has no empty markers or unspecified implementation steps.
- Type consistency:
  - Entry keys are consistently `public-entry.business-cards` and `public-entry.short-links`.
  - Route names remain `AdminBusinessCards`, `AdminPublicEntryShortLinks`, and `EmployeeBusinessCardSelfView` to minimize component/test churn.
