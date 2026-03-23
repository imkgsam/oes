import { PERMISSION_NOT_FOUND } from '../../src/common/constants/exception-enums'
import { GetPermissionByIdHandler } from '../../src/application/queries/permission/get-permission-by-id.handler'
import { GetPermissionByIdQuery } from '../../src/application/queries/permission/get-permission-by-id.query'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'

describe('GetPermissionByIdHandler', () => {
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

  it('查询权限 / 当按 id 查询且存在时 / 应返回权限详情', async () => {
    const repo = createRepository()
    const handler = new GetPermissionByIdHandler(repo)
    const permission = new Permission(
      'permission-id',
      'permission.read',
      PermissionModule.PERMISSION_SERVICE,
      'read permission'
    )

    repo.findById.mockResolvedValue(permission)

    const result = await handler.execute(new GetPermissionByIdQuery('permission-id'))

    expect(repo.findById).toHaveBeenCalledWith('permission-id')
    expect(result).toBe(permission)
  })

  it('查询权限 / 当按 id 查询但不存在时 / 应返回 PERMISSION_NOT_FOUND', async () => {
    const repo = createRepository()
    const handler = new GetPermissionByIdHandler(repo)

    repo.findById.mockResolvedValue(null)

    await expect(handler.execute(new GetPermissionByIdQuery('permission-id'))).rejects.toMatchObject({
      definition: {
        code: PERMISSION_NOT_FOUND.code
      }
    })
  })
})
