import { Role } from '../../src/domain/aggregates/role.aggregate'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { RoleMapper } from '../../src/infrastructure/mappers/role.mapper'

// Verifies protected and permission-override role flags survive domain/persistence mapping.
describe('RoleMapper', () => {
  it('maps protected and tenant permission override flags into the domain role', () => {
    const role = RoleMapper.toDomain({
      id: 'role-id',
      name: 'Tenant Admin',
      code: 'tenant.admin',
      tenantId: 'tenant-1',
      kind: RoleKind.TENANT_INSTANCE,
      isEnabled: true,
      description: 'Tenant admin',
      templateRoleId: 'template-id',
      allowTenantPermissionOverride: false,
      isProtected: true,
      permissions: []
    })

    expect(role.allowTenantPermissionOverride).toBe(false)
    expect(role.isProtected).toBe(true)
  })

  it('persists protected and tenant permission override flags from the domain role', () => {
    const role = new Role(
      'role-id',
      'Tenant Admin',
      'tenant.admin',
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      true,
      'Tenant admin',
      'template-id',
      [],
      false,
      true
    )

    expect(RoleMapper.toPersistent(role)).toMatchObject({
      allowTenantPermissionOverride: false,
      isProtected: true
    })
  })
})
