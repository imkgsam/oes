import {
  DEPRECATED_PERMISSION_CODES,
  PERMISSION_CODE_DEFINITIONS,
  getPermissionCodeDefinition,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'
import { PERMISSION_CODE_SEED_ITEMS } from '../../src/scripts/permission-catalog'
import { buildBuiltInRoleSeeds } from '../../src/scripts/role-foundation'
import { filterRoleAssignablePermissionItems } from '../../src/scripts/sync-permission-codes'

/** Verifies Common definitions are the exact, complete runtime Permission catalog source. */
describe('permission foundation seed', () => {
  it('round-trips every active Common definition with explicit scope and fingerprint metadata', () => {
    expect(PERMISSION_CODE_SEED_ITEMS).toHaveLength(Object.keys(PERMISSION_CODE_DEFINITIONS).length)
    expect(new Set(PERMISSION_CODE_SEED_ITEMS.map((item) => item.code)).size).toBe(
      PERMISSION_CODE_SEED_ITEMS.length
    )
    for (const item of PERMISSION_CODE_SEED_ITEMS) {
      const definition = getPermissionCodeDefinition(item.code)!
      expect(item.allowedScopeLevels.length).toBeGreaterThan(0)
      expect(item.definitionFingerprint).toBe(permissionDefinitionFingerprint(definition))
      expect(DEPRECATED_PERMISSION_CODES).not.toContain(item.code)
    }
  })

  it('publishes deterministic TENANT, SYSTEM, dual and INTERNAL scope classifications', () => {
    expect(getPermissionCodeDefinition('site.management.read')?.allowedScopeLevels).toEqual([
      'TENANT'
    ])
    expect(getPermissionCodeDefinition('tenant_org.tenant.list')?.allowedScopeLevels).toEqual([
      'SYSTEM'
    ])
    expect(getPermissionCodeDefinition('permission.list')?.allowedScopeLevels).toEqual([
      'SYSTEM',
      'TENANT'
    ])
    expect(getPermissionCodeDefinition('permission.internal.permission.check')).toMatchObject({
      kind: 'INTERNAL',
      assignableTo: ['WORKLOAD_POLICY'],
      allowedScopeLevels: ['SYSTEM']
    })
    expect(getPermissionCodeDefinition('identity.account.self.read')).toMatchObject({
      kind: 'BUSINESS',
      assignableTo: ['HUMAN', 'MACHINE'],
      allowedScopeLevels: ['SYSTEM', 'TENANT']
    })
    for (const code of [
      'identity.contact.asset.assign',
      'identity.contact.asset.release',
      'identity.contact.asset.set_primary',
      'identity.contact.asset.set_status'
    ]) {
      expect(getPermissionCodeDefinition(code)).toMatchObject({
        kind: 'BUSINESS',
        allowedScopeLevels: ['TENANT']
      })
    }
  })

  it('preserves active self-read access in the minimum tenant account role', () => {
    expect(
      buildBuiltInRoleSeeds().find((role) => role.code === 'account.basic')?.permissionCodes
    ).toContain('identity.account.self.read')
  })

  it('preserves personal-center self-read access for the login-capable SYSTEM administrator', () => {
    expect(
      buildBuiltInRoleSeeds().find((role) => role.code === 'system.admin')?.permissionCodes
    ).toContain('identity.account.self.read')
  })

  it('keeps every built-in role reference active and scope-compatible', () => {
    for (const role of buildBuiltInRoleSeeds()) {
      const expectedScope = role.kind === 'SYSTEM_INSTANCE' ? 'SYSTEM' : 'TENANT'
      for (const code of role.permissionCodes) {
        expect(getPermissionCodeDefinition(code)?.allowedScopeLevels).toContain(expectedScope)
      }
    }
  })

  it('keeps SYSTEM admin sync limited to HUMAN-assignable SYSTEM Codes', () => {
    const codes = filterRoleAssignablePermissionItems(PERMISSION_CODE_SEED_ITEMS, {
      assignee: 'HUMAN',
      scopeLevel: 'SYSTEM'
    }).map((item) => item.code)

    expect(codes).not.toContain('collaboration.task.assign')
    expect(codes).not.toContain('crm.internal.object_reference.validate')
    expect(codes).toContain('permission.list')
  })
})
