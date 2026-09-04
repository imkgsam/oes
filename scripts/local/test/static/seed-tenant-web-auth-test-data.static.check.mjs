import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
} from '../../tenant-web-auth-test-fixtures.mjs'

const source = readFileSync(new URL('../../seed-tenant-web-auth-test-data.mjs', import.meta.url), 'utf8')

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
  assert.match(source, /passwordRecoveryGrant\.create/)
  assert.match(source, /tenantMfaScenarioPolicy\.upsert/)
  assert.match(source, /tenantMfaFactorPolicy\.upsert/)
  assert.match(source, /AUTH_ACCEPTANCE_TERMINAL_ACCESS_OVERRIDES/)
  assert.match(source, /accountTerminalAccessOverride\.createMany/)
})
test('tenant-web seed upserts bounded policy preview and Item Master page fixtures', () => {
  assert.equal(PAGE_ACCEPTANCE_FIXTURES.itemMaster.item.id, '00000000-0000-4000-8000-000000000999')
  assert.match(source, /policyInstance\.upsert/)
  assert.match(source, /async function seedItemMaster/)
  assert.match(source, /itemCategory\.upsert/)
  assert.match(source, /attributeDefinition\.upsert/)
  assert.match(source, /attributeOption\.upsert/)
  assert.match(source, /itemModel\.upsert/)
  assert.match(source, /itemModelAttributeRule\.upsert/)
  assert.match(source, /item\.upsert/)
})
test('tenant-web seed releases its Permission pool before the second foundation writer', () => {
  const itemMasterSeed = source.indexOf('await seedItemMaster(itemMaster)')
  const release = source.indexOf('await permission.$disconnect()', itemMasterSeed)
  const secondFoundationSync = source.indexOf(
    'syncPermissionFoundationForLocalSystemAccount()',
    release
  )
  const postFoundationClient = source.indexOf(
    'const postFoundationPermission = new PermissionPrismaClient',
    secondFoundationSync
  )
  assert.ok(itemMasterSeed < release)
  assert.ok(release < secondFoundationSync)
  assert.ok(secondFoundationSync < postFoundationClient)
})
test('tenant-web seed gives task-owned transactions one explicit bounded maintenance window', () => {
  assert.match(
    source,
    /SEED_TRANSACTION_OPTIONS = Object\.freeze\(\{ maxWait: 30_000, timeout: 180_000 \}\)/
  )
  assert.equal((source.match(/await runSeedTransaction\(/g) ?? []).length, 9)
  assert.doesNotMatch(source, /\.\$transaction\(async/)
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
