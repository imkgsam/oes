import { DeleteRoleCommand } from '../../src/application/commands/role/delete-role.command'
import { DeleteRoleHandler } from '../../src/application/commands/role/delete-role.handler'
import { UpdateRoleCommand } from '../../src/application/commands/role/update-role.command'
import { UpdateRoleHandler } from '../../src/application/commands/role/update-role.handler'
import {
  ROLE_DELETE_FORBIDDEN,
  ROLE_NOT_ASSIGNABLE
} from '../../src/common/constants/exception-enums'
import { Role } from '../../src/domain/aggregates/role.aggregate'
import { RoleKind } from '../../src/domain/enums/role-kind.enum'
import { RoleRepository } from '../../src/domain/repositories/role.repository'

// Verifies protected built-in role instances cannot be deleted or destructively modified by role APIs.
describe('role protection handlers', () => {
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

  const protectedRole = () =>
    new Role(
      'role-id',
      'Tenant Admin',
      'tenant.admin',
      'tenant-1',
      RoleKind.TENANT_INSTANCE,
      true,
      undefined,
      'template-id',
      [],
      false,
      true
    )

  it('拒绝更新 protected role instance', async () => {
    const roleRepo = createRoleRepository()
    const handler = new UpdateRoleHandler(roleRepo)
    roleRepo.findById.mockResolvedValue(protectedRole())

    await expect(
      handler.execute(new UpdateRoleCommand({ id: 'role-id', name: 'Renamed' }))
    ).rejects.toMatchObject({
      definition: {
        code: ROLE_NOT_ASSIGNABLE.code
      }
    })
    expect(roleRepo.save).not.toHaveBeenCalled()
  })

  it('拒绝删除 protected role instance', async () => {
    const roleRepo = createRoleRepository()
    const handler = new DeleteRoleHandler(roleRepo)
    roleRepo.findById.mockResolvedValue(protectedRole())
    roleRepo.hasAssignedAccounts.mockResolvedValue(false)
    roleRepo.hasAssignedPermissions.mockResolvedValue(false)

    await expect(handler.execute(new DeleteRoleCommand('role-id'))).rejects.toMatchObject({
      definition: {
        code: ROLE_DELETE_FORBIDDEN.code
      }
    })
    expect(roleRepo.delete).not.toHaveBeenCalled()
  })
})
