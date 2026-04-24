import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_PASSWORD,
  DEFAULT_OTP_CODE,
  EXPECTED_ROLE_CODES,
  buildSeedTenantOrgRootUnits,
  buildSeedTenantOrgTenants,
  SEEDED_COMPANIES,
  SEEDED_USER_MEMBERSHIPS,
  SEEDED_USERS,
} from './tenant-web-auth-test-fixtures.mjs';

// Verifies the local tenant-web auth fixtures match the intended realistic company, account, and role graph.
test('tenant-web auth fixtures expose the requested companies, users, accounts, and roles', () => {
  assert.equal(DEFAULT_PASSWORD, 'Passw0rd!123');
  assert.equal(DEFAULT_OTP_CODE, '123456');

  assert.deepEqual(
    SEEDED_COMPANIES.map((company) => company.name),
    [
      '潮州市美隆陶瓷实业有限公司',
      '潮州市达屋科技有限公司',
      '深圳市乌云科技有限公司',
    ],
  );

  assert.deepEqual(
    SEEDED_COMPANIES.map((company) => company.domain),
    ['meilong-ceramics.com', 'dawu-tech.com', 'wooyun.com'],
  );

  const tenantOrgTenants = buildSeedTenantOrgTenants();
  const tenantOrgRootUnits = buildSeedTenantOrgRootUnits();
  assert.equal(tenantOrgTenants.length, SEEDED_COMPANIES.length);
  assert.equal(tenantOrgRootUnits.length, SEEDED_COMPANIES.length);
  assert.deepEqual(
    tenantOrgTenants.map((tenant) => tenant.rootOrgId),
    tenantOrgRootUnits.map((orgUnit) => orgUnit.id),
  );
  assert.ok(
    tenantOrgRootUnits.every((orgUnit) => orgUnit.type === 'ROOT' && orgUnit.depth === 0),
    'tenant-org seed should keep one deterministic root org per managed tenant',
  );

  assert.equal(SEEDED_USERS.length, 4);

  const userByName = new Map(
    SEEDED_USERS.map((user) => [user.personName, user]),
  );

  assert.deepEqual(
    SEEDED_USER_MEMBERSHIPS.get('陈双鹏'),
    ['system.admin', 'tenant.admin@company-1', 'foreign-trade.manager@company-1', 'cfo@company-3'],
  );
  assert.deepEqual(
    SEEDED_USER_MEMBERSHIPS.get('詹佳妮'),
    ['foreign-trade.sales@company-1'],
  );
  assert.deepEqual(
    SEEDED_USER_MEMBERSHIPS.get('吴浩权'),
    ['domestic.sales@company-2'],
  );
  assert.deepEqual(
    SEEDED_USER_MEMBERSHIPS.get('陈双武'),
    ['tenant.admin@company-2'],
  );

  assert.equal(userByName.get('陈双鹏')?.accounts.length, 3);
  assert.equal(userByName.get('詹佳妮')?.accounts.length, 1);
  assert.equal(userByName.get('吴浩权')?.accounts.length, 1);
  assert.equal(userByName.get('陈双武')?.accounts.length, 1);
  for (const user of SEEDED_USERS) {
    assert.ok(
      user.accounts.every((account) => account.displayName === user.personName),
      `${user.personName} account display names should stay person-only`,
    );
  }

  const avatars = SEEDED_USERS.map((user) => user.avatarUrl);
  assert.equal(new Set(avatars).size, 4);
  assert.ok(avatars.every((avatar) => avatar.startsWith('data:image/svg+xml')));

  assert.deepEqual(
    Array.from(EXPECTED_ROLE_CODES),
    [
      'system.admin',
      'tenant.admin',
      'foreign-trade.manager',
      'foreign-trade.sales',
      'domestic.sales',
      'cfo',
    ],
  );
});
