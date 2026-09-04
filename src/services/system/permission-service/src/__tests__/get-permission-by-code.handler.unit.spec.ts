import { PERMISSION_NOT_FOUND } from '../common/constants/exception-enums'
import { GetPermissionByCodeHandler } from '../application/queries/permission/get-permission-by-code.handler'
import { GetPermissionByCodeQuery } from '../application/queries/permission/get-permission-by-code.query'
import { Permission } from '../domain/aggregates/permission.aggregate'
import { PermissionModule } from '../domain/enums/permission-module.enum'
import { PermissionRepository } from '../domain/repositories/permission.repository'

describe('GetPermissionByCodeHandler', () => {
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

  it('查询权限 / 当按 code 查询且存在时 / 应返回权限详情', async () => {
    const repo = createRepository()
    const handler = new GetPermissionByCodeHandler(repo)
    const permission = new Permission(
      'permission-id',
      'permission.read',
      PermissionModule.PERMISSION_SERVICE,
      'read permission'
    )

    repo.findByCode.mockResolvedValue(permission)

    const result = await handler.execute(new GetPermissionByCodeQuery('permission.read'))

    expect(repo.findByCode).toHaveBeenCalledWith('permission.read')
    expect(result).toBe(permission)
  })

  it('查询权限 / 当按 code 查询但不存在时 / 应返回 PERMISSION_NOT_FOUND', async () => {
    const repo = createRepository()
    const handler = new GetPermissionByCodeHandler(repo)

    repo.findByCode.mockResolvedValue(null)

    await expect(handler.execute(new GetPermissionByCodeQuery('permission.read'))).rejects.toMatchObject({
      definition: {
        code: PERMISSION_NOT_FOUND.code
      }
    })
  })
})
