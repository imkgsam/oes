import { EventBus } from '@nestjs/cqrs'
import { PERMISSION_ALREADY_EXISTS } from '../../src/common/constants/exception-enums'
import { CreatePermissionCommand } from '../../src/application/commands/permission/create-permission.command'
import { CreatePermissionHandler } from '../../src/application/commands/permission/create-permission.handler'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'

describe('CreatePermissionHandler', () => {
  const createRepository = (): jest.Mocked<PermissionRepository> => ({
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

  it('创建权限 / 当 code 不存在时 / 应创建成功', async () => {
    const repo = createRepository()
    const handler = new CreatePermissionHandler(repo, { publish: jest.fn() } as unknown as EventBus)
    const command = new CreatePermissionCommand(
      'permission.create',
      PermissionModule.PERMISSION_SERVICE,
      'create permission'
    )

    repo.findByCode.mockResolvedValue(null)
    repo.save.mockImplementation(async (permission) => permission)

    const result = await handler.execute(command)

    expect(repo.findByCode).toHaveBeenCalledWith('permission.create')
    expect(repo.save).toHaveBeenCalledTimes(1)
    expect(result.code).toBe('permission.create')
    expect(result.module).toBe(PermissionModule.PERMISSION_SERVICE)
    expect(result.description).toBe('create permission')
    expect(result.id).toBeTruthy()
  })

  it('创建权限 / 当 code 已存在时 / 应返回 PERMISSION_ALREADY_EXISTS', async () => {
    const repo = createRepository()
    const handler = new CreatePermissionHandler(repo, { publish: jest.fn() } as unknown as EventBus)
    const command = new CreatePermissionCommand(
      'permission.create',
      PermissionModule.PERMISSION_SERVICE
    )

    repo.findByCode.mockResolvedValue(
      new Permission('permission-id', 'permission.create', PermissionModule.PERMISSION_SERVICE)
    )

    await expect(handler.execute(command)).rejects.toMatchObject({
      definition: {
        code: PERMISSION_ALREADY_EXISTS.code
      }
    })
    expect(repo.save).not.toHaveBeenCalled()
  })
})
