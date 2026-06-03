# Org People UX Data Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `tenant-web` organization-and-people into simpler employee/org tabs with drawer-based details, hydrate employee names from tenant-party summaries, and rebuild local/dev tenant-org + HR demo data for realistic manual testing.

**Architecture:** Keep owner boundaries unchanged: `tenant-org-service` remains org truth, `hr-service` remains employee/employment truth, and account/access remains a bounded summary. Use `api-gateway` read-side aggregation to enrich employee directory rows with tenant-party display names, preserve explicit backend gaps where no stable truth exists, and rebuild local/dev fixtures across `party-service`, `tenant-org-service`, `hr-service`, `identity-service`, and `auth-service`.

**Tech Stack:** Vue 3, Ant Design Vue, Vitest, NestJS, Jest, Prisma, local seed scripts.

---

### Task 1: Add employee display-name read-side aggregation in api-gateway

**Files:**
- Create: `src/services/api-gateway/src/modules/hr-service/adapters/party-tenant-query-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/hr-service/hr-service.module.ts`
- Modify: `src/services/api-gateway/src/modules/hr-service/hr-management.service.ts`
- Modify: `src/services/api-gateway/src/modules/hr-service/hr-management.service.spec.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/hr-management/index.ts`

- [ ] **Step 1: Write the failing gateway service tests**

Add assertions that `listEmployees()` and `getEmployeeDetail()` return `employee.displayName` when `tenantPartyId` resolves through `party-service`, and degrade cleanly when the tenant-party record is missing.

```ts
expect(result.items[0].employee).toEqual(
  expect.objectContaining({
    displayName: '陈双鹏',
    employeeCode: 'EMP-0AF-0001',
  }),
);

expect(result.items[1].employee).toEqual(
  expect.objectContaining({
    displayName: undefined,
    employeeCode: 'EMP-0AF-0002',
  }),
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api-gateway exec jest src/modules/hr-service/hr-management.service.spec.ts --runInBand`
Expected: FAIL because `displayName` is not returned and no tenant-party query adapter exists yet.

- [ ] **Step 3: Add the tenant-party query adapter and wire it into the HR proxy module**

Mirror the existing gRPC metadata propagation style already used in other gateway adapters.

```ts
export interface TenantPartySummary {
  id: string;
  tenantId: string;
  partyId: string;
  localDisplayName?: string;
  localCode?: string;
  status: string;
}

async getTenantPartyById(
  tenantId: string,
  tenantPartyId: string,
  source: DownstreamRequestSource,
): Promise<TenantPartySummary | null> {
  const response = await safeGrpcCall(
    this.svc.getTenantPartyById(
      { tenantId, tenantPartyId },
      this.metadataFactory.createOperatorScopedMetadata(
        toOperatorScopedMetadataInput(source),
      ),
    ),
    this.opts('PartyQueryService.getTenantPartyById'),
  );
  return response.tenantParty?.id
    ? {
        id: response.tenantParty.id,
        tenantId: response.tenantParty.tenantId ?? '',
        partyId: response.tenantParty.partyId ?? '',
        localDisplayName: normalize(response.tenantParty.localDisplayName),
        localCode: normalize(response.tenantParty.localCode),
        status: response.tenantParty.status ?? '',
      }
    : null;
}
```

- [ ] **Step 4: Update `HrManagementService` to attach `displayName`**

Load unique `tenantPartyId`s alongside org-unit hydration, then decorate employee summaries without changing employment owner semantics.

```ts
private async loadTenantPartyNameMap(
  tenantId: string,
  tenantPartyIds: Array<string | undefined>,
  source: DownstreamRequestSource,
) {
  const ids = [...new Set(tenantPartyIds.map(normalize).filter(Boolean))];
  const entries = await Promise.all(
    ids.map(async (tenantPartyId) => {
      const tenantParty = await this.partyTenantQueryAdapter.getTenantPartyById(
        tenantId,
        tenantPartyId!,
        source,
      );
      return tenantParty?.id ? ([tenantPartyId!, tenantParty.localDisplayName] as const) : undefined;
    }),
  );
  return new Map(entries.filter(Boolean) as Array<readonly [string, string | undefined]>);
}

private attachEmployeeDisplayName<TEmployee extends { tenantPartyId?: string }>(
  employee: TEmployee,
  tenantPartyNameMap: Map<string, string | undefined>,
) {
  const tenantPartyId = normalize(employee.tenantPartyId);
  return {
    ...employee,
    displayName: tenantPartyId ? tenantPartyNameMap.get(tenantPartyId) : undefined,
  };
}
```

- [ ] **Step 5: Extend the tenant-web BFF types**

```ts
export interface EmployeeSummary {
  displayName?: string;
  employeeCode: string;
  id: string;
  lifecycleStatus: EmployeeLifecycleStatus | string;
  partyId?: string;
  tenantId: string;
  tenantPartyId: string;
}
```

- [ ] **Step 6: Run the gateway tests and confirm green**

Run: `pnpm --filter api-gateway exec jest src/modules/hr-service/hr-management.service.spec.ts --runInBand`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/services/api-gateway/src/modules/hr-service/adapters/party-tenant-query-grpc.adapter.ts \
  src/services/api-gateway/src/modules/hr-service/hr-service.module.ts \
  src/services/api-gateway/src/modules/hr-service/hr-management.service.ts \
  src/services/api-gateway/src/modules/hr-service/hr-management.service.spec.ts \
  app/web/apps/tenant-web/src/api/bff/hr-management/index.ts
git commit -m "feat: hydrate employee display names for org people"
```

### Task 2: Refactor tenant-web to tabbed employee/org workspaces with drawer-based details

**Files:**
- Modify: `app/web/apps/tenant-web/src/views/admin/organization-people.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/employee-management-workspace.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/org-management-workspace.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/organization-people.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/employee-management-workspace.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/org-management-workspace.spec.ts`

- [ ] **Step 1: Write the failing UI tests for the new IA**

Cover:
- employee tab renders filters + directory without org tree
- clicking a member opens a drawer with internal tabs
- org tab renders tree and opens a drawer with internal tabs
- org drawer still shows backend gap for missing leader/member summaries

```ts
expect(wrapper.text()).toContain('员工');
expect(wrapper.text()).toContain('组织');
expect(wrapper.find('[data-testid="employee-org-filter-panel"]').exists()).toBe(false);

await wrapper.get('[data-testid="employee-row-employee-1"]').trigger('click');
expect(wrapper.get('[data-testid="employee-detail-drawer"]').text()).toContain('概览');
expect(wrapper.get('[data-testid="employee-detail-drawer"]').text()).toContain('账号与访问');
```

- [ ] **Step 2: Run the tenant-web tests to verify they fail**

Run: `pnpm --dir app/web exec vitest run apps/tenant-web/src/views/admin/organization-people.spec.ts apps/tenant-web/src/views/admin/employee-management-workspace.spec.ts apps/tenant-web/src/views/admin/org-management-workspace.spec.ts`
Expected: FAIL because the current workspaces still render inline detail panes and the employee page still includes the org filter column.

- [ ] **Step 3: Refactor the page shell to simple tab switching**

Keep the page hero, but simplify the workbench copy so the two internal tabs explicitly describe employee and org scopes.

```vue
<a-tabs :active-key="activeTab" @change="switchTab">
  <a-tab-pane key="members" tab="员工" />
  <a-tab-pane key="departments" tab="组织" />
</a-tabs>
```

- [ ] **Step 4: Replace the employee three-column layout with filters + full-width list + drawer**

Key implementation points:
- remove the left org tree column
- keep department filtering through a select or compact filter rail
- use `Drawer` + `Tabs`
- default drawer tab is `overview`
- preserve action buttons and bounded account/access summary

```vue
<Drawer
  v-model:open="detailOpen"
  class="employee-management__drawer"
  data-testid="employee-detail-drawer"
  :width="drawerWidth"
  title="成员详情"
>
  <Tabs v-model:activeKey="detailTab">
    <Tabs.TabPane key="overview" tab="概览" />
    <Tabs.TabPane key="employment" tab="任职" />
    <Tabs.TabPane key="access" tab="账号与访问" />
    <Tabs.TabPane key="profile" tab="档案" />
  </Tabs>
</Drawer>
```

- [ ] **Step 5: Update the employee directory row rendering to lead with display name**

```vue
<div class="employee-management__row-title">
  {{ item.employee.displayName || item.employee.employeeCode }}
</div>
<div class="employee-management__row-subtitle">
  {{ item.employee.employeeCode }}
</div>
<Tag>{{ formatLifecycleStatus(item.employee.lifecycleStatus) }}</Tag>
<Tag>{{ formatAccountAccessStatus(item.accountAccessStatus) }}</Tag>
```

Note: if fetching per-row access status inline becomes too heavy, compute it from an aggregated list endpoint only if it can be done without changing owner semantics; otherwise keep access status in drawer and leave directory to lifecycle only.

- [ ] **Step 6: Refactor org workspace to tree + drawer**

Keep the tree panel, remove the inline right-side detail card, and move the existing sections into drawer tabs:

```vue
<Drawer
  v-model:open="detailOpen"
  data-testid="org-detail-drawer"
  :width="drawerWidth"
  title="组织详情"
>
  <Tabs v-model:activeKey="detailTab">
    <Tabs.TabPane key="overview" tab="概览" />
    <Tabs.TabPane key="members" tab="成员" />
    <Tabs.TabPane key="technical" tab="技术信息" />
  </Tabs>
</Drawer>
```

For the leader section, keep an explicit gap:

```vue
<div v-if="selectedOrgUnit.leaderName">{{ selectedOrgUnit.leaderName }}</div>
<div v-else class="org-management__detail-placeholder">
  Backend gap：当前读模型尚未提供组织负责人名字。
</div>
```

- [ ] **Step 7: Run tenant-web tests and typecheck**

Run: `pnpm --dir app/web exec vitest run apps/tenant-web/src/views/admin/organization-people.spec.ts apps/tenant-web/src/views/admin/employee-management-workspace.spec.ts apps/tenant-web/src/views/admin/org-management-workspace.spec.ts`
Expected: PASS

Run: `pnpm --dir app/web exec vue-tsc --noEmit -p tsconfig.json`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add app/web/apps/tenant-web/src/views/admin/organization-people.vue \
  app/web/apps/tenant-web/src/views/admin/employee-management-workspace.vue \
  app/web/apps/tenant-web/src/views/admin/org-management-workspace.vue \
  app/web/apps/tenant-web/src/views/admin/organization-people.spec.ts \
  app/web/apps/tenant-web/src/views/admin/employee-management-workspace.spec.ts \
  app/web/apps/tenant-web/src/views/admin/org-management-workspace.spec.ts
git commit -m "feat: simplify organization and people workspaces"
```

### Task 3: Rebuild local/dev tenant-org + HR demo data for realistic manual testing

**Files:**
- Modify: `scripts/local/tenant-web-auth-test-fixtures.mjs`
- Modify: `scripts/local/seed-tenant-web-auth-test-data.mjs`
- Create: `scripts/local/seed-tenant-web-auth-test-data.spec.mjs` or extend the existing fixture spec
- Modify: `app/web/README.md`

- [ ] **Step 1: Write the failing seed fixture assertions**

Add tests that require exactly 3 managed tenants, deeper org trees, and employee scenario coverage for active/preboarding/offboarded/pending access rows.

```js
assert.equal(SEEDED_COMPANIES.length, 3);
assert.ok(buildSeedTenantOrgRootUnits().length === 3);
assert.ok(buildSeedHrEmployees().some((employee) => employee.lifecycleStatus === 'PREBOARDING'));
assert.ok(buildSeedHrOnboardingAccesses().some((process) => process.status === 'ACCESS_GRANT_PENDING'));
```

- [ ] **Step 2: Run the seed fixture spec to verify it fails**

Run: `node --test scripts/local/seed-tenant-web-auth-test-data.spec.mjs`
Expected: FAIL because HR and party fixture builders do not exist yet and tenant/org coverage is too shallow.

- [ ] **Step 3: Extend the fixture file with 3 new tenant profiles and explicit org/employee scenario builders**

Add focused builders rather than embedding large inline arrays inside the seeding script.

```js
export function buildSeedHrEmployees() {
  return [
    {
      id: 'employee-meilong-admin',
      tenantId: COMPANY_MEILONG_ID,
      tenantPartyId: 'tenant-party-chen-shuangpeng-meilong',
      partyId: 'party-chen-shuangpeng',
      employeeCode: '0001',
      lifecycleStatus: 'ACTIVE',
    },
  ];
}
```

- [ ] **Step 4: Extend the seed script to clear and rebuild party-service + hr-service data**

Use generated Prisma clients the same way the existing script already manages auth/identity/permission/tenant-org databases.

```js
await hr.$transaction(async (tx) => {
  await tx.employeeOnboardingAccess.deleteMany({ where: { tenantId: { in: managedTenantIds } } });
  await tx.employment.deleteMany({ where: { tenantId: { in: managedTenantIds } } });
  await tx.employee.deleteMany({ where: { tenantId: { in: managedTenantIds } } });
  await tx.employee.createMany({ data: SEEDED_HR_EMPLOYEES });
  await tx.employment.createMany({ data: SEEDED_HR_EMPLOYMENTS });
});
```

Also clear and rebuild the related tenant-party / person-party rows in `partydb`, plus employee bindings in `identitydb`.

- [ ] **Step 5: Update the seed script summary output**

Print the 3 tenant names, their admin accounts, and a compact employee scenario summary so manual testers can tell what was seeded.

```js
console.log('Seeded tenants:');
for (const tenant of SEEDED_COMPANIES) {
  console.log(`- ${tenant.name}`);
}
console.log('Employee scenarios: ACTIVE / PREBOARDING / OFFBOARDED / PENDING access included');
```

- [ ] **Step 6: Run fixture tests, then run the seed script twice**

Run: `node --test scripts/local/seed-tenant-web-auth-test-data.spec.mjs`
Expected: PASS

Run: `pnpm seed:tenant-web-auth`
Expected: PASS with summary output for the 3 rebuilt tenants

Run: `pnpm seed:tenant-web-auth`
Expected: PASS again, proving repeatability

- [ ] **Step 7: Update local README guidance**

Document that `pnpm seed:tenant-web-auth` now rebuilds 3 realistic organization-and-people demo tenants, including HR and party data.

```md
- `pnpm seed:tenant-web-auth` 现在会重建 3 个组织与人员联调租户，并同步刷新 `partydb / hrdb / authdb / identitydb / permissiondb / tenantorgdb` 的本地测试数据。
```

- [ ] **Step 8: Commit**

```bash
git add scripts/local/tenant-web-auth-test-fixtures.mjs \
  scripts/local/seed-tenant-web-auth-test-data.mjs \
  scripts/local/seed-tenant-web-auth-test-data.spec.mjs \
  app/web/README.md
git commit -m "feat: seed realistic org people demo tenants"
```

### Task 4: End-to-end verification and manual testing notes

**Files:**
- Modify: `docs/plans/designs/org-people-ux-data-hardening.md` (only if final writeback notes are needed)

- [ ] **Step 1: Run focused backend and frontend verification**

Run: `pnpm --filter api-gateway exec jest src/modules/hr-service/hr-management.service.spec.ts --runInBand`
Expected: PASS

Run: `pnpm --dir app/web exec vitest run apps/tenant-web/src/views/admin/organization-people.spec.ts apps/tenant-web/src/views/admin/employee-management-workspace.spec.ts apps/tenant-web/src/views/admin/org-management-workspace.spec.ts`
Expected: PASS

Run: `pnpm --dir app/web exec vue-tsc --noEmit -p tsconfig.json`
Expected: PASS

- [ ] **Step 2: Re-run the seed script fresh**

Run: `pnpm seed:tenant-web-auth`
Expected: PASS

- [ ] **Step 3: Record manual smoke path**

Manual path:
- log in as 陈双鹏
- switch into 美隆陶瓷 tenant context
- open `/settings/organization-people`
- verify employee tab filters, directory names, and member drawer tabs
- verify org tab tree, drawer tabs, and explicit backend gap for leader/member summaries when unavailable
- switch into the other 2 tenant contexts and confirm org-tree complexity differences

- [ ] **Step 4: Commit any final test-only adjustments**

```bash
git add -A
git commit -m "test: finalize org people hardening verification"
```
