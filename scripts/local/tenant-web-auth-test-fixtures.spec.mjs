import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_PASSWORD,
  buildSeedAccountRoleBindings,
  buildSeedTenantRoles,
  buildPdaLoginSmokeSeed
} from './tenant-web-auth-test-fixtures.mjs'

test('pda login smoke seed targets one tenant account with PDA terminal access and home navigation', () => {
  const seed = buildPdaLoginSmokeSeed()

  assert.equal(seed.tenantKey, 'meilong')
  assert.equal(seed.tenantId, '00000000-0000-4000-8000-000000000001')
  assert.equal(seed.accountId, '00000000-0000-4000-8000-000000000901')
  assert.equal(seed.identifier, 'chen.shuangpeng@meilong.local')
  assert.equal(seed.password, DEFAULT_PASSWORD)

  assert.deepEqual(seed.accountTerminalAccessOverride, {
    accountId: '00000000-0000-4000-8000-000000000901',
    scopeLevel: 'TENANT',
    tenantId: '00000000-0000-4000-8000-000000000001',
    allowedTerminals: ['WEB', 'PDA']
  })

  assert.deepEqual(seed.roleNavigationVisibility, {
    roleId: '00000000-0000-4000-8000-000000001003',
    entryKey: 'pda.home',
    terminal: 'PDA',
    enabled: true
  })
  assert.deepEqual(seed.roleLandingPolicy, {
    roleId: '00000000-0000-4000-8000-000000001003',
    terminal: 'PDA',
    defaultEntryKey: 'pda.home',
    priority: 1000,
    enabled: true
  })
  assert.deepEqual(seed.terminalLoginPolicy, {
    terminal: 'PDA',
    enabledLoginFlows: ['PASSWORD', 'EMAIL_PASSWORD']
  })
  assert.deepEqual(seed.tenantTerminalMfaPolicy, {
    tenantId: '00000000-0000-4000-8000-000000000001',
    terminal: 'PDA',
    loginMfaRequired: false,
    newDeviceMfaRequired: false,
    allowedFactors: ['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE'],
    factorPriority: ['EMAIL_OTP', 'SMS_OTP', 'TOTP', 'BACKUP_CODE']
  })
})

test('tenant admin demo accounts also receive item master product data permissions', () => {
  const roles = buildSeedTenantRoles()
  const bindings = buildSeedAccountRoleBindings()
  const meilongProductDataManager = roles.find(
    (role) =>
      role.code === 'item_master.product_data_manager' &&
      role.tenantId === '00000000-0000-4000-8000-000000000001'
  )

  assert.ok(meilongProductDataManager)
  assert.equal(meilongProductDataManager.id, '00000000-0000-4000-8000-000000001004')
  assert.ok(
    bindings.some(
      (binding) =>
        binding.accountId === '00000000-0000-4000-8000-000000000901' &&
        binding.roleId === meilongProductDataManager.id
    )
  )
})
