import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTH_ACCEPTANCE_FIXTURES,
  DEFAULT_PASSWORD,
  PAGE_ACCEPTANCE_FIXTURES,
  SEEDED_TENANT_ROLE_PERMISSION_CODES,
  SYSTEM_ADMIN_ACCOUNT_IDS,
  TENANT_SYSTEM_ADMIN_ACCOUNT_ROLE_BINDINGS,
  buildBrowserExtensionDesignerDemoSeed,
  buildSeedAccountRoleBindings,
  buildSeedAccounts,
  buildSeedTenantRoles,
  buildPdaLoginSmokeSeed
} from '../tenant-web-auth-test-fixtures.mjs'

test('auth acceptance fixtures stay dedicated and task-resettable', () => {
  const fixtures = AUTH_ACCEPTANCE_FIXTURES
  assert.equal(
    new Set([
      fixtures.passwordRecovery.userId,
      fixtures.passwordSetup.userId,
      fixtures.mfa.userId
    ]).size,
    3
  )
  assert.equal(
    new Set([
      fixtures.passwordRecovery.accountId,
      fixtures.passwordSetup.accountId,
      fixtures.mfa.accountId
    ]).size,
    3
  )
  assert.equal(fixtures.mfa.tenantTerminalMfaPolicy.loginMfaRequired, true)
  assert.deepEqual(fixtures.mfa.tenantTerminalMfaPolicy.allowedFactors, ['TOTP'])
  assert.equal(fixtures.passwordSetup.requirement.required, true)
  assert.equal(fixtures.passwordRecovery.grant.id, '00000000-0000-4000-8000-000000000820')
  assert.equal(fixtures.passwordRecovery.grant.expiresAt.getUTCFullYear(), 2099)
  assert.deepEqual(
    [
      fixtures.passwordRecovery.accountTerminalAccessOverride,
      fixtures.passwordSetup.accountTerminalAccessOverride,
      fixtures.mfa.accountTerminalAccessOverride
    ].map((override) => ({
      accountId: override.accountId,
      scopeLevel: override.scopeLevel,
      tenantId: override.tenantId,
      allowedTerminals: override.allowedTerminals
    })),
    [
      {
        accountId: fixtures.passwordRecovery.accountId,
        scopeLevel: 'TENANT',
        tenantId: '00000000-0000-4000-8000-000000000001',
        allowedTerminals: ['WEB']
      },
      {
        accountId: fixtures.passwordSetup.accountId,
        scopeLevel: 'TENANT',
        tenantId: '00000000-0000-4000-8000-000000000002',
        allowedTerminals: ['WEB']
      },
      {
        accountId: fixtures.mfa.accountId,
        scopeLevel: 'TENANT',
        tenantId: '00000000-0000-4000-8000-000000000003',
        allowedTerminals: ['WEB']
      }
    ]
  )
  assert.deepEqual(fixtures.mfa.tenantScenarioPolicy, {
    scenario: 'LOGIN',
    required: true,
    updatedBy: 'seed:tenant-web-auth'
  })
  assert.deepEqual(fixtures.mfa.tenantFactorPolicies, [
    { factor: 'TOTP', enabled: true, priority: 1, updatedBy: 'seed:tenant-web-auth' },
    { factor: 'EMAIL_OTP', enabled: false, priority: 2, updatedBy: 'seed:tenant-web-auth' },
    { factor: 'SMS_OTP', enabled: false, priority: 3, updatedBy: 'seed:tenant-web-auth' },
    { factor: 'BACKUP_CODE', enabled: false, priority: 4, updatedBy: 'seed:tenant-web-auth' }
  ])
})

test('page acceptance fixtures preserve exact route ids and Item Master dependencies', () => {
  const fixtures = PAGE_ACCEPTANCE_FIXTURES
  assert.equal(fixtures.policyPreview.tenantId, '00000000-0000-4000-8000-000000000001')
  assert.equal(fixtures.policyPreview.accountId, '00000000-0000-4000-8000-000000000901')
  assert.equal(fixtures.policyPreview.policyInstance.id, '00000000-0000-4000-8000-000000000999')
  assert.deepEqual(fixtures.policyPreview.policyInstance.params.allowedValues, [
    fixtures.itemMaster.category.id
  ])
  assert.equal(
    fixtures.itemMaster.attributeOption.attributeDefinitionId,
    fixtures.itemMaster.attributeDefinition.id
  )
  assert.equal(fixtures.itemMaster.itemModel.primaryCategoryId, fixtures.itemMaster.category.id)
  assert.equal(
    fixtures.itemMaster.itemModelAttributeRule.itemModelId,
    fixtures.itemMaster.itemModel.id
  )
  assert.deepEqual(fixtures.itemMaster.item.lockedAttributeOptionIds, [
    fixtures.itemMaster.attributeOption.id
  ])
  assert.equal(fixtures.itemMaster.item.itemModelId, fixtures.itemMaster.itemModel.id)
})

test('full-page acceptance account receives only the canonical MES navigation role addition', () => {
  const roles = buildSeedTenantRoles()
  const bindings = buildSeedAccountRoleBindings()
  const mesRole = roles.find(
    (role) =>
      role.tenantId === '00000000-0000-4000-8000-000000000001' &&
      role.code === 'mes.forming_workshop.supervisor'
  )

  assert.deepEqual(
    roles.filter((role) => role.code === 'mes.forming_workshop.supervisor').map((role) => role.tenantId),
    ['00000000-0000-4000-8000-000000000001']
  )
  assert.equal(mesRole.id, '00000000-0000-4000-8000-000000001050')
  assert.ok(
    bindings.some(
      (binding) =>
        binding.accountId === '00000000-0000-4000-8000-000000000901' &&
        binding.roleId === mesRole.id
    )
  )
  assert.deepEqual(SEEDED_TENANT_ROLE_PERMISSION_CODES.get(mesRole.code), [
    'mes.production_spec.read',
    'mes.production_spec.manage',
    'mes.mold_design.read',
    'mes.mold_design.manage',
    'mes.production_mold.read',
    'mes.production_mold.manage',
    'mes.tooling_installation.read',
    'mes.tooling_installation.manage',
    'mes.mold_usage.record',
    'mes.mold_life.manage'
  ])
})

test('pda login smoke seed targets one tenant account with PDA terminal access and home navigation', () => {
  const seed = buildPdaLoginSmokeSeed()

  assert.equal(seed.tenantKey, 'meilong')
  assert.equal(seed.tenantId, '00000000-0000-4000-8000-000000000001')
  assert.equal(seed.accountId, '00000000-0000-4000-8000-000000000901')
  assert.equal(seed.identifier, 'csp@ml.lc')
  assert.equal(seed.password, DEFAULT_PASSWORD)
  assert.equal(seed.password, 'imkgsam6593')

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
    enabledLoginFlows: ['PASSWORD']
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

test('tenant admin demo role includes Annotation P1 collaboration permissions', () => {
  const permissionCodes = SEEDED_TENANT_ROLE_PERMISSION_CODES.get('tenant.admin')

  assert.ok(permissionCodes.includes('collaboration.annotation.create'))
  assert.ok(permissionCodes.includes('collaboration.annotation.manage'))
})

test('browser extension designer demo seed targets one tenant account with plugin workspace access', () => {
  const seed = buildBrowserExtensionDesignerDemoSeed()
  const bindings = buildSeedAccountRoleBindings()
  const roles = buildSeedTenantRoles()
  const meilongCrmSales = roles.find(
    (role) =>
      role.code === 'crm.sales' &&
      role.tenantId === '00000000-0000-4000-8000-000000000001'
  )

  assert.equal(seed.tenantKey, 'meilong')
  assert.equal(seed.tenantId, '00000000-0000-4000-8000-000000000001')
  assert.equal(seed.accountId, '00000000-0000-4000-8000-000000000901')
  assert.equal(seed.identifier, 'csp@ml.lc')
  assert.equal(seed.password, DEFAULT_PASSWORD)
  assert.equal(seed.password, 'imkgsam6593')

  assert.deepEqual(seed.accountTerminalAccessOverride, {
    accountId: '00000000-0000-4000-8000-000000000901',
    scopeLevel: 'TENANT',
    tenantId: '00000000-0000-4000-8000-000000000001',
    allowedTerminals: ['WEB', 'PDA', 'BROWSER_EXTENSION']
  })
  assert.deepEqual(seed.roleTerminalAccess, {
    roleId: '00000000-0000-4000-8000-000000001005',
    allowedTerminals: ['WEB', 'BROWSER_EXTENSION']
  })
  assert.deepEqual(seed.roleNavigationVisibility, {
    roleId: '00000000-0000-4000-8000-000000001005',
    entryKey: 'extension.designer.workspace',
    terminal: 'BROWSER_EXTENSION',
    enabled: true
  })
  assert.deepEqual(seed.roleLandingPolicy, {
    roleId: '00000000-0000-4000-8000-000000001005',
    terminal: 'BROWSER_EXTENSION',
    defaultEntryKey: 'extension.designer.workspace',
    priority: 1000,
    enabled: true
  })
  assert.deepEqual(seed.terminalLoginPolicy, {
    terminal: 'BROWSER_EXTENSION',
    enabledLoginFlows: ['PASSWORD']
  })
  assert.ok(
    bindings.some(
      (binding) =>
        binding.accountId === '00000000-0000-4000-8000-000000000901' &&
        binding.roleId === seed.roleTerminalAccess.roleId
    )
  )
  assert.ok(meilongCrmSales)
  assert.equal(meilongCrmSales.id, '00000000-0000-4000-8000-000000001006')
  assert.ok(
    bindings.some(
      (binding) =>
        binding.accountId === '00000000-0000-4000-8000-000000000901' &&
        binding.roleId === meilongCrmSales.id
    )
  )
})

test('csp demo account receives default system admin binding ids for the dedicated system context', () => {
  assert.deepEqual(SYSTEM_ADMIN_ACCOUNT_IDS, [
    '00000000-0000-4000-8000-000000000902',
  ])
})

test('csp dedicated system account is seeded into identity accounts', () => {
  const accounts = buildSeedAccounts()

  assert.deepEqual(
    accounts.find((account) => account.id === '00000000-0000-4000-8000-000000000902'),
    {
      id: '00000000-0000-4000-8000-000000000902',
      avatarUrl: accounts.find((account) => account.id === '00000000-0000-4000-8000-000000000901')?.avatarUrl,
      contextKey: 'SYSTEM',
      displayName: '陈双鹏',
      scopeLevel: 'SYSTEM',
      tenantId: null,
      tenantPartyId: null,
      userId: '00000000-0000-4000-8000-000000000801',
      workEmail: null,
    },
  )
})

test('csp tenant demo account does not receive system admin in the selected tenant context', () => {
  assert.deepEqual(TENANT_SYSTEM_ADMIN_ACCOUNT_ROLE_BINDINGS, [])
})

test('tenant role fixtures never grant inactive permission catalog entries', () => {
  const inactiveCodes = new Set([
    'auth.login_method.self.list',
    'auth.login_method.self.manage',
    'auth.session.self.list',
    'auth.session.self.revoke',
    'crm.activity.create',
    'crm.contact.manage',
    'crm.duplicate.viewRestricted',
    'crm.opportunity.manage',
    'crm.source.manage',
    'extension.designer.product.collect',
    'extension.designer.project.create',
    'extension.designer.submit_to_oes',
    'identity.account.self.update_profile',
    'item_master.item.set_composition',
    'permission.account.self.get_roles'
  ])

  for (const [roleCode, permissionCodes] of SEEDED_TENANT_ROLE_PERMISSION_CODES) {
    for (const permissionCode of permissionCodes) {
      assert.equal(
        inactiveCodes.has(permissionCode),
        false,
        `${roleCode} includes inactive permission ${permissionCode}`
      )
    }
  }
})
