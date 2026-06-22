import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'
import { RoleRepository } from '../../src/domain/repositories/role.repository'
import { AccountAuthorizationService } from '../../src/domain/services/account-authorization.service'
import { RolePermission } from '../../src/domain/vo/role-permission.value-object'

describe('AccountAuthorizationService', () => {
  const createPermissionRepository = (): jest.Mocked<PermissionRepository> => ({
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    findByModule: jest.fn(),
    findPaged: jest.fn(),
    findByCodes: jest.fn(),
    hasAssignedRoles: jest.fn(),
    hasAttachedPolicies: jest.fn(),
    hasAttachedPolicyInstances: jest.fn(),
    createMany: jest.fn(),
    save: jest.fn(),
    delete: jest.fn()
  })

  const createRoleRepository = (): jest.Mocked<RoleRepository> => ({
    findById: jest.fn(),
    findByCode: jest.fn(),
    findByScopeAndCode: jest.fn(),
    findByScopeKindAndCode: jest.fn(),
    findAll: jest.fn(),
    findRoleInstances: jest.fn(),
    findRoleTemplates: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    hasAssignedAccounts: jest.fn(),
    hasAssignedPermissions: jest.fn(),
    hasTemplateInstances: jest.fn(),
    findOwnPermissions: jest.fn(),
    findRolesByPermissionId: jest.fn(),
    findRolesForAccountId: jest.fn(),
    assignAccountRole: jest.fn(),
    revokeAccountRole: jest.fn(),
    findAccountRoles: jest.fn(),
    findRoleAccounts: jest.fn(),
    findTenantRoles: jest.fn(),
    findSystemRoles: jest.fn(),
    findRoleTemplateById: jest.fn(),
    replaceAccountRoles: jest.fn()
  })

  const createRoleWithPermission = (permissionCode: string, permissionId = 'permission-id') =>
    new Role(
      'role-id',
      'Admin',
      'ADMIN',
      null,
      RoleKind.SYSTEM_TEMPLATE,
      true,
      undefined,
      null,
      [new RolePermission('role-id', permissionId, permissionCode)]
    )

  it('权限判断 / 当权限不存在时 / 应返回 false', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const service = new AccountAuthorizationService(roleRepo, permissionRepo)

    permissionRepo.findByCode.mockResolvedValue(null)

    const result = await service.checkPermission('account-id', 'permission.read')

    expect(result).toBe(false)
    expect(roleRepo.findRolesForAccountId).not.toHaveBeenCalled()
  })

  it('权限判断 / 当角色拥有权限时 / 应返回 true', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const service = new AccountAuthorizationService(roleRepo, permissionRepo)

    permissionRepo.findByCode.mockResolvedValue(
      new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
    )
    roleRepo.findRolesForAccountId.mockResolvedValue([createRoleWithPermission('permission.read')])

    const result = await service.checkPermission('account-id', 'permission.read')

    expect(result).toBe(true)
  })
})
