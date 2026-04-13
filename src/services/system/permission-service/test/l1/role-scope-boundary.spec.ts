import { AUTHORIZATION_DENIED } from '../../src/common/constants/exception-enums'
import { CreateRoleTemplateCommand } from '../../src/application/commands/role/create-role-template.command'
import { CreateRoleTemplateHandler } from '../../src/application/commands/role/create-role-template.handler'
import { AssignRolePermissionCommand } from '../../src/application/commands/role/assign-role-permission.command'
import { AssignRolePermissionHandler } from '../../src/application/commands/role/assign-role-permission.handler'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'
import { RoleRepository } from '../../src/domain/repositories/role.repository'
import {
  buildRoleInstanceQueryScope,
  buildSystemQueryScope,
  buildTenantBoundQueryScope
} from '../../src/application/authorization/operator-scope'

describe('Role Scope Boundary', () => {
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

  const createPermissionRepository = (): jest.Mocked<PermissionRepository> => ({
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    findByModule: jest.fn(),
    findPaged: jest.fn(),
    findByCodes: jest.fn(),
    hasAssignedRoles: jest.fn(),
    hasAttachedPolicies: jest.fn(),
    createMany: jest.fn(),
    save: jest.fn(),
    delete: jest.fn()
  })

  it('模板角色创建 / 当操作者不是系统范围时 / 应拒绝', async () => {
    const roleRepo = createRoleRepository()
    const handler = new CreateRoleTemplateHandler(roleRepo)

    await expect(
      handler.execute(
        new CreateRoleTemplateCommand({
          name: 'Tenant Admin Template',
          code: 'TENANT_ADMIN_TEMPLATE',
          operatorScope: {
            operatorId: 'user-1',
            tenantId: 'tenant-1',
            isSystemScope: false
          }
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: AUTHORIZATION_DENIED.code
      }
    })
  })

  it('角色实例权限授予 / 当操作者越租户时 / 应拒绝', async () => {
    const roleRepo = createRoleRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new AssignRolePermissionHandler(roleRepo, permissionRepo)

    roleRepo.findById.mockResolvedValue(
      new Role('role-id', 'Warehouse Admin', 'WAREHOUSE_ADMIN', 'tenant-2', RoleKind.TENANT_INSTANCE, true)
    )
    permissionRepo.findById.mockResolvedValue(
      new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
    )

    await expect(
      handler.execute(
        new AssignRolePermissionCommand('role-id', 'permission-id', {
          operatorId: 'user-1',
          tenantId: 'tenant-1',
          isSystemScope: false
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: AUTHORIZATION_DENIED.code
      }
    })
  })

  it('buildRoleInstanceQueryScope / 租户操作者请求其他 tenant 时 / 应拒绝', () => {
    expect(() =>
      buildRoleInstanceQueryScope(
        {
          operatorId: 'user-1',
          tenantId: 'tenant-1',
          isSystemScope: false
        },
        'tenant-2'
      )
    ).toThrow()
  })

  it('buildRoleInstanceQueryScope / 租户操作者应被收口到自身 tenant', () => {
    expect(
      buildRoleInstanceQueryScope(
        {
          operatorId: 'user-1',
          tenantId: 'tenant-1',
          isSystemScope: false
        },
        'tenant-1'
      )
    ).toEqual({
      tenantId: 'tenant-1',
      scopeLevel: 'TENANT'
    })
  })

  it('buildTenantBoundQueryScope / 系统操作者应保留请求 tenant', () => {
    expect(
      buildTenantBoundQueryScope(
        {
          operatorId: 'user-1',
          isSystemScope: true
        },
        'tenant-9'
      )
    ).toEqual({
      tenantId: 'tenant-9'
    })
  })

  it('buildSystemQueryScope / 非系统操作者访问模板列表时 / 应拒绝', () => {
    expect(() =>
      buildSystemQueryScope(
        {
          operatorId: 'user-1',
          tenantId: 'tenant-1',
          isSystemScope: false
        },
        'template list requires system scope'
      )
    ).toThrow()
  })
})
