import { PERMISSION_BATCH_CREATE_CONFLICT } from '../common/constants/exception-enums'
import {
  BatchCreatePermissionItemInput,
  BatchCreatePermissionsCommand
} from '../application/commands/permission/batch-create-permissions.command'
import { BatchCreatePermissionsHandler } from '../application/commands/permission/batch-create-permissions.handler'
import { Permission } from '../domain/aggregates/permission.aggregate'
import { PermissionModule } from '../domain/enums/permission-module.enum'
import { PermissionRepository } from '../domain/repositories/permission.repository'

describe('BatchCreatePermissionsHandler', () => {
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

  const createCommand = (items: BatchCreatePermissionItemInput[]) =>
    new BatchCreatePermissionsCommand({
      permissions: items
    })

  it('批量创建权限 / 当请求内存在重复 code 时 / 应返回 PERMISSION_BATCH_CREATE_CONFLICT', async () => {
    const repo = createRepository()
    const handler = new BatchCreatePermissionsHandler(repo)

    const command = createCommand([
      new BatchCreatePermissionItemInput({
        code: 'permission.read',
        module: PermissionModule.PERMISSION_SERVICE
      }),
      new BatchCreatePermissionItemInput({
        code: 'permission.read',
        module: PermissionModule.PERMISSION_SERVICE
      })
    ])

    await expect(handler.execute(command)).rejects.toMatchObject({
      definition: {
        code: PERMISSION_BATCH_CREATE_CONFLICT.code
      },
      additionalDetails: {
        reason: 'request_duplicate_codes',
        duplicateCodes: ['permission.read']
      }
    })
    expect(repo.findByCodes).not.toHaveBeenCalled()
  })

  it('批量创建权限 / 当数据库已存在相同 code 时 / 应返回 PERMISSION_BATCH_CREATE_CONFLICT', async () => {
    const repo = createRepository()
    const handler = new BatchCreatePermissionsHandler(repo)

    const command = createCommand([
      new BatchCreatePermissionItemInput({
        code: 'permission.read',
        module: PermissionModule.PERMISSION_SERVICE
      })
    ])

    repo.findByCodes.mockResolvedValue([
      new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
    ])

    await expect(handler.execute(command)).rejects.toMatchObject({
      definition: {
        code: PERMISSION_BATCH_CREATE_CONFLICT.code
      },
      additionalDetails: {
        reason: 'existing_codes',
        existingCodes: ['permission.read']
      }
    })
    expect(repo.createMany).not.toHaveBeenCalled()
  })

  it('批量创建权限 / 当 code 均有效且未重复时 / 应创建成功', async () => {
    const repo = createRepository()
    const handler = new BatchCreatePermissionsHandler(repo)

    const command = createCommand([
      new BatchCreatePermissionItemInput({
        code: 'permission.read',
        module: PermissionModule.PERMISSION_SERVICE
      }),
      new BatchCreatePermissionItemInput({
        code: 'permission.write',
        module: PermissionModule.AUTH_SERVICE,
        description: 'write permission'
      })
    ])

    repo.findByCodes.mockResolvedValue([])
    repo.createMany.mockImplementation(async (permissions) => permissions)

    const result = await handler.execute(command)

    expect(repo.findByCodes).toHaveBeenCalledWith(['permission.read', 'permission.write'])
    expect(repo.createMany).toHaveBeenCalledTimes(1)
    expect(result).toHaveLength(2)
    expect(result[0].code).toBe('permission.read')
    expect(result[1].description).toBe('write permission')
  })
})
