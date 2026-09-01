import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AUTH_ACCEPTANCE_FIXTURES,
  buildSeedAccounts,
  buildSeedHrEmployees,
  buildSeedIdentityEmployeeBindings,
  buildSeedTenantOrgTenants,
  buildSeedTenantParties,
  buildSeedUsers
} from './tenant-web-auth-test-fixtures.mjs'

const source = readFileSync(new URL('./seed-tenant-web-auth-test-data.mjs', import.meta.url), 'utf8')

test('tenant-web auth seed clears party registration idempotency records before deleting tenant parties', () => {
  const idempotencyCleanupIndex = source.indexOf('partyRegistrationIdempotency.deleteMany')
  const tenantPartyDeleteIndex = source.indexOf('tenantParty.deleteMany')

  assert.notEqual(idempotencyCleanupIndex, -1)
  assert.notEqual(tenantPartyDeleteIndex, -1)
  assert.ok(idempotencyCleanupIndex < tenantPartyDeleteIndex)
})

test('tenant-web auth seed writes tenant-scoped TenantParty display fields directly', () => {
  assert.match(source, /legalName:\s*seed\.legalName/)
  assert.match(source, /displayName:\s*seed\.displayName/)
})

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
  assert.deepEqual(fixtures.mfa.tenantTerminalMfaPolicy, {
    terminal: 'WEB',
    loginMfaRequired: true,
    newDeviceMfaRequired: false,
    allowedFactors: ['TOTP'],
    factorPriority: ['TOTP']
  })
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

test('tenant-web auth seed resets stale grants before rebuilding dedicated acceptance state', () => {
  const grantCleanup = source.indexOf('passwordRecoveryGrant.deleteMany')
  const loginMethodCleanup = source.indexOf('loginMethod.deleteMany')
  assert.notEqual(grantCleanup, -1)
  assert.ok(grantCleanup < loginMethodCleanup)
  assert.match(source, /mfaBinding\.deleteMany/)
  assert.match(source, /mfaBinding\.create/)
  assert.match(source, /passwordSetupRequirement\.deleteMany/)
  assert.match(source, /passwordSetupRequirement\.create/)
  assert.match(source, /tenantTerminalMfaPolicy\.upsert/)
})

test('tenant-web auth seed keeps identity account and HR employee tenantPartyId aligned', () => {
  const accountsById = new Map(buildSeedAccounts().map((account) => [account.id, account]))
  const employeesById = new Map(buildSeedHrEmployees().map((employee) => [employee.id, employee]))

  for (const binding of buildSeedIdentityEmployeeBindings()) {
    const account = accountsById.get(binding.accountId)
    const employee = employeesById.get(binding.employeeId)

    assert.ok(account, `missing account ${binding.accountId}`)
    assert.ok(employee, `missing employee ${binding.employeeId}`)
    assert.equal(account.tenantId, employee.tenantId)
    assert.equal(account.tenantPartyId, employee.tenantPartyId)
  }
})

test('tenant-web auth seed writes only exact managed HUMAN principal bindings', () => {
  assert.doesNotMatch(source, /tx\.accountRole/)
  assert.match(source, /tx\.principalRoleBinding\.deleteMany/)
  assert.match(source, /principalType:\s*PrincipalType\.HUMAN/)
  assert.match(source, /principalId:\s*\{ in: managedHumanPrincipalIds \}/)
  assert.doesNotMatch(source, /\{ scopeLevel: ScopeLevel\.TENANT \}/)
})

test('tenant-web auth seed never prints login identifiers, passwords, OTPs, or database URLs', () => {
  assert.doesNotMatch(source, /summary\.loginUsers\.(?:join|at)|summary\.loginUsers\[/)
  assert.doesNotMatch(source, /PDA_LOGIN_SMOKE_SEED\.identifier/)
  assert.doesNotMatch(source, /BROWSER_EXTENSION_DESIGNER_DEMO_SEED\.identifier/)
  assert.doesNotMatch(source, /`Password: \$\{DEFAULT_PASSWORD\}`/)
  assert.doesNotMatch(source, /`OTP: \$\{DEFAULT_OTP_CODE\}`/)
  assert.match(source, /sanitizeTenantWebAuthSeedMessage/)
})
