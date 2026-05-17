import { PERMISSION_NOT_FOUND } from '../../src/common/constants/exception-enums'
import { UpdatePermissionCommand } from '../../src/application/commands/permission/update-permission.command'
import { UpdatePermissionHandler } from '../../src/application/commands/permission/update-permission.handler'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'

describe('UpdatePermissionHandler', () => {
  const createRepository = (): jest.Mocked<PermissionRepository> => ({
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

  it('更新权限 / 当权限不存在时 / 应返回 PERMISSION_NOT_FOUND', async () => {
    const repo = createRepository()
    const handler = new UpdatePermissionHandler(repo)
    const command = new UpdatePermissionCommand({
      id: 'permission-id',
      module: PermissionModule.AUTH_SERVICE,
      description: 'updated description'
    })

    repo.findById.mockResolvedValue(null)

    await expect(handler.execute(command)).rejects.toMatchObject({
      definition: {
        code: PERMISSION_NOT_FOUND.code
      }
    })
  })

  it('更新权限 / 当权限存在时 / 应更新 module 和 description', async () => {
    const repo = createRepository()
    const handler = new UpdatePermissionHandler(repo)
    const existing = new Permission(
      'permission-id',
      'permission.update',
      PermissionModule.PERMISSION_SERVICE,
      'before update'
    )
    const command = new UpdatePermissionCommand({
      id: 'permission-id',
      module: PermissionModule.AUTH_SERVICE,
      description: 'after update'
    })

    repo.findById.mockResolvedValue(existing)
    repo.save.mockImplementation(async (permission) => permission)

    const result = await handler.execute(command)

    expect(repo.save).toHaveBeenCalledWith(existing)
    expect(result.module).toBe(PermissionModule.AUTH_SERVICE)
    expect(result.description).toBe('after update')
  })
})
