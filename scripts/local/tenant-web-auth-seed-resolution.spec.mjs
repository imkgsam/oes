import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SEEDED_COMPANIES,
  buildSeedAccountRoleBindings,
  buildSeedAccounts,
  buildSeedContactAssets,
  buildSeedTenantOrgRootUnits,
  buildSeedTenantOrgTenants,
  buildSeedTenantRoles,
} from './tenant-web-auth-test-fixtures.mjs';
import {
  buildConflictingIdentityUserIds,
  resolveTenantWebAuthSeedState,
} from './tenant-web-auth-seed-resolution.mjs';

// Verifies local auth seeding reuses pre-existing tenant ids keyed by stable business code instead of failing on duplicate codes.
test('resolveTenantWebAuthSeedState remaps managed tenant-scoped rows to existing tenant ids by code', () => {
  const existingTenantId = '00000000-0000-4000-8000-000000000001';
  const existingRootOrgId = '00000000-0000-4000-8000-000000000101';
  const existingTenantAdminRoleId = '00000000-0000-4000-8000-000000001001';

  const seedState = resolveTenantWebAuthSeedState({
    existingIdentityTenants: [
      {
        code: 'meilong-ceramics',
        id: existingTenantId,
      },
    ],
    existingTenantOrgTenants: [
      {
        code: 'meilong-ceramics',
        id: existingTenantId,
        rootOrgId: existingRootOrgId,
      },
    ],
    existingPermissionRoles: [
      {
        code: 'tenant.admin',
        id: existingTenantAdminRoleId,
        kind: 'TENANT_INSTANCE',
        scopeKey: existingTenantId,
      },
    ],
    seededAccountRoleBindings: buildSeedAccountRoleBindings(),
    seededAccounts: buildSeedAccounts(),
    seededCompanies: SEEDED_COMPANIES,
    seededContactAssets: buildSeedContactAssets(),
    seededTenantOrgRootUnits: buildSeedTenantOrgRootUnits(),
    seededTenantOrgTenants: buildSeedTenantOrgTenants(),
    seededTenantRoles: buildSeedTenantRoles(),
  });

  const meilongCompany = seedState.seededCompanies.find(
    (company) => company.code === 'meilong-ceramics',
  );
  assert.equal(meilongCompany?.id, existingTenantId);
  assert.equal(meilongCompany?.rootOrgId, existingRootOrgId);

  const meilongAccountIds = [
    'cb3f1d5d-1406-4fb0-8d53-75a144093001',
    '5e9774b0-cd66-4658-b2b8-74558ceab004',
  ];

  for (const accountId of meilongAccountIds) {
    const account = seedState.seededAccounts.find((item) => item.id === accountId);
    assert.equal(account?.tenantId, existingTenantId);
    assert.equal(account?.contextKey, existingTenantId);
  }

  const meilongRoles = seedState.seededTenantRoles.filter(
    (role) => role.code === 'tenant.admin' || role.code === 'foreign-trade.manager' || role.code === 'foreign-trade.sales',
  );
  assert.ok(
    meilongRoles.some((role) => role.tenantId === existingTenantId),
    'company-1 tenant roles should point at the existing tenant id',
  );
  assert.equal(
    meilongRoles.find((role) => role.code === 'tenant.admin')?.id,
    existingTenantAdminRoleId,
  );

  const meilongTenant = seedState.seededTenantOrgTenants.find(
    (tenant) => tenant.code === 'meilong-ceramics',
  );
  assert.equal(meilongTenant?.id, existingTenantId);
  assert.equal(meilongTenant?.rootOrgId, existingRootOrgId);

  const meilongRoot = seedState.seededTenantOrgRootUnits.find(
    (orgUnit) => orgUnit.tenantId === existingTenantId,
  );
  assert.equal(meilongRoot?.id, existingRootOrgId);
  assert.equal(meilongRoot?.path, `/${existingRootOrgId}`);

  const meilongRoleBindings = seedState.seededAccountRoleBindings.filter(
    (binding) => binding.accountId === 'cb3f1d5d-1406-4fb0-8d53-75a144093001' || binding.accountId === '5e9774b0-cd66-4658-b2b8-74558ceab004',
  );
  assert.ok(
    meilongRoleBindings.every((binding) => binding.tenantId === existingTenantId),
    'company-1 account-role bindings should point at the existing tenant id',
  );
  assert.equal(
    meilongRoleBindings.find((binding) => binding.accountId === 'cb3f1d5d-1406-4fb0-8d53-75a144093001' && binding.tenantId === existingTenantId)?.roleId,
    existingTenantAdminRoleId,
  );
});

// Verifies the seed only purges identity rows that collide on managed login identifiers but do not already belong to the current managed ids.
test('buildConflictingIdentityUserIds returns only drifted identity users that collide on managed unique identifiers', () => {
  const conflictingUserIds = buildConflictingIdentityUserIds({
    existingUsers: [
      {
        email: 'chen.shuangpeng@meilong.local',
        id: '00000000-0000-4000-8000-000000000801',
        phone: '+8613900000101',
        username: 'chen.shuangpeng',
      },
      {
        email: 'zhan.jiani@meilong-ceramics.com',
        id: '93e0b3fa-9e86-4a8d-84f2-40a18bbf1002',
        phone: '+8613900000002',
        username: 'zhan.jiani',
      },
      {
        email: 'other@example.com',
        id: '11111111-1111-1111-1111-111111111111',
        phone: '',
        username: 'other-user',
      },
    ],
    managedUserIds: [
      '7df29e8e-f2f4-4ca3-8c17-bfe3bba0f111',
      '93e0b3fa-9e86-4a8d-84f2-40a18bbf1002',
    ],
    seededUsers: [
      {
        email: 'chen.shuangpeng@meilong-ceramics.com',
        phone: '+8613900000001',
        username: 'chen.shuangpeng',
      },
      {
        email: 'zhan.jiani@meilong-ceramics.com',
        phone: '+8613900000002',
        username: 'zhan.jiani',
      },
    ],
  });

  assert.deepEqual(conflictingUserIds, ['00000000-0000-4000-8000-000000000801']);
});
