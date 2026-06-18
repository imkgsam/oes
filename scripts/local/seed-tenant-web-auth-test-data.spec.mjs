import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
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

  assert.equal(tenants.length, 2)
  assert.equal(users.length, 4)
  assert.equal(accounts.length, 4)
  assert.equal(employees.length, 4)
  assert.equal(
    tenantParties.filter((party) => party.type === 'ORGANIZATION').length,
    2
  )
  assert.equal(
    tenantParties.filter((party) => party.type === 'PERSON').length,
    4
  )
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
