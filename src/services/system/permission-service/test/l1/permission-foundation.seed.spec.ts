import {
  DEPRECATED_PERMISSION_CODES,
  PERMISSION_CODE_DEFINITIONS,
  getPermissionCodeDefinition,
  permissionDefinitionFingerprint
} from '@oes/common/authorization'
import { PERMISSION_CODE_SEED_ITEMS } from '../../src/scripts/permission-catalog'
import { buildBuiltInRoleSeeds } from '../../src/scripts/role-foundation'

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
  })

  it('keeps every built-in role reference active and scope-compatible', () => {
    for (const role of buildBuiltInRoleSeeds()) {
      const expectedScope = role.kind === 'SYSTEM_INSTANCE' ? 'SYSTEM' : 'TENANT'
      for (const code of role.permissionCodes) {
        expect(getPermissionCodeDefinition(code)?.allowedScopeLevels).toContain(expectedScope)
      }
    }
  })
})
