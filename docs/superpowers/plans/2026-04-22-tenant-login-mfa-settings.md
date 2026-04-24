# Tenant Login MFA Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move tenant login MFA governance out of policy governance into a dedicated tenant settings menu and replace factor up/down buttons with drag sorting.

**Architecture:** Keep policy governance focused on readonly policy facts, add a separate tenant settings route group for tenant-scoped security settings, and move login MFA management into its own page that owns the admin-security BFF contract. Reuse the existing `@vben/hooks` sortable capability so the new ordering interaction stays consistent with the rest of the web workspace.

**Tech Stack:** Vue 3, Vue Router, Pinia-backed auth context, Ant Design Vue, Vitest, sortablejs via `@vben/hooks`

---

### Task 1: Freeze the routing and navigation contract with tests

**Files:**
- Modify: `app/web/apps/tenant-web/src/router/access.spec.ts`
- Modify: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`

- [ ] **Step 1: Write the failing tests**

```ts
expect(DEFAULT_NAVIGATION_ENTRIES.map((item) => item.entryKey)).toContain(
  'tenant-settings.login-mfa',
);

expect(buildNavigationFoundationVisibilitySeeds([
  { code: 'tenant.admin', id: 'role-tenant-admin', kind: RoleKind.TENANT_INSTANCE },
])).toContainEqual({
  enabled: true,
  entryKey: 'tenant-settings.login-mfa',
  roleId: 'role-tenant-admin',
  terminal: 'DEFAULT',
});
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/router/access.spec.ts src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
Expected: FAIL because the new tenant settings entry and route visibility do not exist yet.

- [ ] **Step 3: Implement the minimal navigation seed and route visibility changes**

```ts
{
  entryKey: 'tenant-settings.login-mfa',
  name: '登录 MFA',
  description: '租户登录 MFA 设置入口。',
  featureKey: 'auth',
  supportedTerminals: ['WEB'],
  registryPriority: 58,
  enabled: true,
  entryType: 'page'
}
```

- [ ] **Step 4: Re-run the targeted tests to verify they pass**

Run: `pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/router/access.spec.ts src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
Expected: PASS

### Task 2: Add a dedicated tenant settings MFA page with page-level tests

**Files:**
- Create: `app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.spec.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/login-mfa-settings.vue`
- Create: `app/web/apps/tenant-web/src/views/admin/login-mfa-settings.spec.ts`
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/policy-governance.vue`

- [ ] **Step 1: Write the failing helper and page tests**

```ts
expect(reorderTenantMfaFactors([
  { factor: 'EMAIL_OTP', priority: 1, enabled: true },
  { factor: 'TOTP', priority: 2, enabled: true },
], 0, 1)).toEqual([
  { factor: 'TOTP', priority: 1, enabled: true },
  { factor: 'EMAIL_OTP', priority: 2, enabled: true },
]);

expect(document.body.textContent).toContain('租户设置');
expect(document.body.textContent).toContain('登录 MFA');
expect(document.body.textContent).toContain('拖拽排序');
```

- [ ] **Step 2: Run the new page tests to verify they fail**

Run: `pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/login-mfa-settings.spec.ts app/web/apps/tenant-web/src/views/admin/policy-governance.spec.ts`
Expected: FAIL because the dedicated page and helper do not exist yet.

- [ ] **Step 3: Implement the dedicated page and strip MFA content from policy governance**

```ts
{
  meta: {
    icon: 'lucide:settings-2',
    order: 11,
    title: '租户设置',
  },
  name: 'TenantSettings',
  path: '/settings',
  children: [
    {
      name: 'TenantLoginMfaSettings',
      path: '/settings/login-mfa',
      component: () => import('#/views/admin/login-mfa-settings.vue'),
      meta: {
        entryKey: 'tenant-settings.login-mfa',
        icon: 'lucide:shield-check',
        title: '登录 MFA',
      },
    },
  ],
}
```

- [ ] **Step 4: Re-run the page tests to verify they pass**

Run: `pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/login-mfa-settings.spec.ts app/web/apps/tenant-web/src/views/admin/policy-governance.spec.ts`
Expected: PASS

### Task 3: Replace button ordering with drag sorting

**Files:**
- Modify: `app/web/apps/tenant-web/src/views/admin/login-mfa-settings.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/login-mfa-settings.spec.ts`

- [ ] **Step 1: Write the failing drag-sort tests**

```ts
await vm.handleFactorDragEnd({ newIndex: 0, oldIndex: 2 });
expect(vm.editableFactors.map((item) => item.factor)).toEqual([
  'BACKUP_CODE',
  'EMAIL_OTP',
  'TOTP',
]);
expect(vm.editableFactors.map((item) => item.priority)).toEqual([1, 2, 3]);
```

- [ ] **Step 2: Run the page tests to verify they fail for the drag case**

Run: `pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/login-mfa-settings.spec.ts`
Expected: FAIL because the page still has button ordering or no sortable handler.

- [ ] **Step 3: Implement sortable-based row dragging and remove the up/down buttons**

```ts
const { initializeSortable } = useSortable(container.value, {
  animation: 180,
  handle: '.login-mfa-settings__drag-handle',
  onEnd: ({ oldIndex, newIndex }) => {
    editableFactors.value = reorderTenantMfaFactors(
      editableFactors.value,
      oldIndex ?? 0,
      newIndex ?? 0,
    );
  },
});
```

- [ ] **Step 4: Re-run the drag tests to verify they pass**

Run: `pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/login-mfa-settings.spec.ts`
Expected: PASS

### Task 4: Run end-to-end verification for this slice

**Files:**
- Verify only

- [ ] **Step 1: Run the focused frontend and navigation verification**

Run: `pnpm --dir app/web exec vitest run app/web/apps/tenant-web/src/router/access.spec.ts app/web/apps/tenant-web/src/views/admin/policy-governance.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/policy-governance.spec.ts app/web/apps/tenant-web/src/views/admin/login-mfa-settings.helpers.spec.ts app/web/apps/tenant-web/src/views/admin/login-mfa-settings.spec.ts src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`
Expected: PASS

- [ ] **Step 2: Run tenant-web typecheck**

Run: `pnpm --dir app/web --filter @oes/tenant-web typecheck`
Expected: PASS
