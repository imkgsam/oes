import { GetRoleTemplateByIdHandler } from '../../src/application/queries/role/get-role-template-by-id.handler'
import { GetRoleTemplateByIdQuery } from '../../src/application/queries/role/get-role-template-by-id.query'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { RoleRepository } from '../../src/domain/repositories/role.repository'

describe('Role Template Read Scope', () => {
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

  it('允许租户操作者读取模板详情用于实例化', async () => {
    const roleRepo = createRoleRepository()
    const handler = new GetRoleTemplateByIdHandler(roleRepo)

    roleRepo.findById.mockResolvedValue(
      new Role(
        'template-1',
        '租户管理员',
        'tenant.admin',
        null,
        RoleKind.SYSTEM_TEMPLATE,
        true,
        'Tenant administrator template',
        null
      )
    )

    await expect(
      handler.execute(
        new GetRoleTemplateByIdQuery('template-1', {
          operatorId: 'tenant-operator',
          tenantId: 'tenant-1',
          isSystemScope: false
        })
      )
    ).resolves.toMatchObject({
      id: 'template-1',
      code: 'tenant.admin',
      kind: RoleKind.SYSTEM_TEMPLATE
    })
  })
})
