import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTH_ACCEPTANCE_FIXTURES,
  PAGE_ACCEPTANCE_FIXTURES,
  buildSeedAccounts,
  buildSeedHrEmployees,
  buildSeedIdentityEmployeeBindings,
  buildSeedTenantOrgTenants,
  buildSeedTenantParties,
  buildSeedUsers
} from '../tenant-web-auth-test-fixtures.mjs'

test('tenant-web auth seed baseline stays minimal and tenant scoped', () => {
  const tenants = buildSeedTenantOrgTenants()
  const users = buildSeedUsers()
  const accounts = buildSeedAccounts().filter((account) => account.scopeLevel === 'TENANT')
  const employees = buildSeedHrEmployees()
  const tenantParties = buildSeedTenantParties()

  assert.equal(tenants.length, 3)
  assert.equal(users.length, 7)
  assert.equal(accounts.length, 7)
  assert.equal(employees.length, 4)
  assert.equal(
    tenantParties.filter((party) => party.type === 'ORGANIZATION').length,
    3
  )
  assert.equal(
    tenantParties.filter((party) => party.type === 'PERSON').length,
    4
  )
})
test('tenant-web auth seed defines independent recovery, MFA, and password-setup states', () => {
  const fixtures = AUTH_ACCEPTANCE_FIXTURES
  assert.equal(
    new Set([
      fixtures.passwordRecovery.userId,
      fixtures.passwordSetup.userId,
      fixtures.mfa.userId
    ]).size,
    3
  )
  assert.deepEqual(fixtures.passwordRecovery.expectedChannels, ['EMAIL', 'PHONE'])
  assert.equal(fixtures.passwordRecovery.grant.id, '00000000-0000-4000-8000-000000000820')
  assert.deepEqual(fixtures.mfa.tenantTerminalMfaPolicy, {
    terminal: 'WEB',
    loginMfaRequired: true,
    newDeviceMfaRequired: false,
    allowedFactors: ['TOTP'],
    factorPriority: ['TOTP']
  })
  assert.equal(fixtures.mfa.tenantScenarioPolicy.required, true)
  assert.deepEqual(
    fixtures.mfa.tenantFactorPolicies.map((policy) => [
      policy.factor,
      policy.enabled,
      policy.priority
    ]),
    [
      ['TOTP', true, 1],
      ['EMAIL_OTP', false, 2],
      ['SMS_OTP', false, 3],
      ['BACKUP_CODE', false, 4]
    ]
  )
  assert.equal(fixtures.mfa.binding.type, 'TOTP')
  assert.equal(fixtures.mfa.binding.enabled, true)
  assert.deepEqual(fixtures.passwordSetup.requirement, {
    id: '00000000-0000-4000-8000-000000000821',
    reason: 'FIRST_LOGIN',
    required: true,
    requiredBy: 'seed:tenant-web-auth',
    requiredAt: new Date('2026-04-14T09:00:00.000Z')
  })
})
