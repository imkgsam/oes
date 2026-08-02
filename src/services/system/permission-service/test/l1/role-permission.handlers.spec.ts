import {
  PERMISSION_NOT_FOUND,
  PERMISSION_NOT_ROLE_ASSIGNABLE,
  ROLE_NOT_ASSIGNABLE,
  ROLE_NOT_FOUND
} from '../../src/common/constants/exception-enums'
import { AssignRolePermissionCommand } from '../../src/application/commands/role/assign-role-permission.command'
import { AssignRolePermissionHandler } from '../../src/application/commands/role/assign-role-permission.handler'
import { RevokeRolePermissionCommand } from '../../src/application/commands/role/revoke-role-permission.command'
import { RevokeRolePermissionHandler } from '../../src/application/commands/role/revoke-role-permission.handler'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PermissionKind } from '../../src/domain/enums/permission-kind.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'
import { RoleRepository } from '../../src/domain/repositories/role.repository'
import { RolePermission } from '../../src/domain/vo/role-permission.value-object'

describe('Role Permission Handlers', () => {
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

  const createRole = () =>
    new Role('role-id', 'Admin', 'ADMIN', 'tenant-1', RoleKind.TENANT_INSTANCE, true)

  it('分配角色权限 / 当角色不存在时 / 应返回 ROLE_NOT_FOUND', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new AssignRolePermissionHandler(roleRepo, permissionRepo)

    roleRepo.findById.mockResolvedValue(null)

    await expect(
      handler.execute(new AssignRolePermissionCommand('role-id', 'permission-id'))
    ).rejects.toMatchObject({
      definition: {
        code: ROLE_NOT_FOUND.code
      }
    })
  })

  it('分配角色权限 / 当权限不存在时 / 应返回 PERMISSION_NOT_FOUND', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new AssignRolePermissionHandler(roleRepo, permissionRepo)

    roleRepo.findById.mockResolvedValue(createRole())
    permissionRepo.findById.mockResolvedValue(null)

    await expect(
      handler.execute(new AssignRolePermissionCommand('role-id', 'permission-id'))
    ).rejects.toMatchObject({
      definition: {
        code: PERMISSION_NOT_FOUND.code
      }
    })
  })

  it('分配角色权限 / 当角色不允许租户覆盖权限时 / 应拒绝修改', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new AssignRolePermissionHandler(roleRepo, permissionRepo)
    const role = new Role(
      'role-id',
      'Tenant Admin',
      'tenant.admin',
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      true,
      undefined,
      null,
      [],
      false,
      true
    )

    roleRepo.findById.mockResolvedValue(role)

    await expect(
      handler.execute(new AssignRolePermissionCommand('role-id', 'permission-id'))
    ).rejects.toMatchObject({
      definition: {
        code: ROLE_NOT_ASSIGNABLE.code
      }
    })
    expect(permissionRepo.findById).not.toHaveBeenCalled()
  })

  it('分配角色权限 / 当角色与权限都存在时 / 应保存角色权限关系', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new AssignRolePermissionHandler(roleRepo, permissionRepo)
    const role = createRole()
    const permission = new Permission(
      'permission-id',
      'permission.read',
      PermissionModule.PERMISSION_SERVICE
    )

    roleRepo.findById.mockResolvedValue(role)
    permissionRepo.findById.mockResolvedValue(permission)
    roleRepo.save.mockImplementation(async (value) => value)

    await handler.execute(new AssignRolePermissionCommand('role-id', 'permission-id'))

    expect(role.permissions).toContainEqual(
      new RolePermission('role-id', 'permission-id', 'permission.read')
    )
    expect(roleRepo.save).toHaveBeenCalledWith(role)
  })

  it('分配角色权限 / 当权限为 INTERNAL 时 / 应拒绝角色授予', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new AssignRolePermissionHandler(roleRepo, permissionRepo)
    const role = createRole()
    const internalPermission = new Permission(
      'permission-id',
      'auth.internal.external_api_key.verifier_version.compromise',
      PermissionModule.AUTH_SERVICE,
      'internal workload-only permission',
      PermissionKind.INTERNAL
    )

    roleRepo.findById.mockResolvedValue(role)
    permissionRepo.findById.mockResolvedValue(internalPermission)

    await expect(
      handler.execute(new AssignRolePermissionCommand('role-id', 'permission-id'))
    ).rejects.toMatchObject({ definition: { code: PERMISSION_NOT_ROLE_ASSIGNABLE.code } })
    expect(roleRepo.save).not.toHaveBeenCalled()
  })

  it('撤销角色权限 / 当角色不存在时 / 应返回 ROLE_NOT_FOUND', async () => {
    const roleRepo = createRoleRepository()
    const handler = new RevokeRolePermissionHandler(roleRepo)

    roleRepo.findById.mockResolvedValue(null)

    await expect(
      handler.execute(new RevokeRolePermissionCommand('role-id', 'permission-id'))
    ).rejects.toMatchObject({
      definition: {
        code: ROLE_NOT_FOUND.code
      }
    })
  })

  it('撤销角色权限 / 当角色存在时 / 应移除权限关系', async () => {
    const roleRepo = createRoleRepository()
    const handler = new RevokeRolePermissionHandler(roleRepo)
    const role = new Role(
      'role-id',
      'Admin',
      'ADMIN',
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      true,
      undefined,
      null,
      [new RolePermission('role-id', 'permission-id', 'permission.read')]
    )

    roleRepo.findById.mockResolvedValue(role)
    roleRepo.save.mockImplementation(async (value) => value)

    await handler.execute(new RevokeRolePermissionCommand('role-id', 'permission-id'))

    expect(role.permissions).toHaveLength(0)
    expect(roleRepo.save).toHaveBeenCalledWith(role)
  })

  it('撤销角色权限 / 当角色不允许租户覆盖权限时 / 应拒绝修改', async () => {
    const roleRepo = createRoleRepository()
    const handler = new RevokeRolePermissionHandler(roleRepo)
    const role = new Role(
      'role-id',
      'Account Basic',
      'account.basic',
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      true,
      undefined,
      null,
      [new RolePermission('role-id', 'permission-id', 'permission.read')],
      false,
      true
    )

    roleRepo.findById.mockResolvedValue(role)

    await expect(
      handler.execute(new RevokeRolePermissionCommand('role-id', 'permission-id'))
    ).rejects.toMatchObject({
      definition: {
        code: ROLE_NOT_ASSIGNABLE.code
      }
    })
    expect(roleRepo.save).not.toHaveBeenCalled()
  })
})
