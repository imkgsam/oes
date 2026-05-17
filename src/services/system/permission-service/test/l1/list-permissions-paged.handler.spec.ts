import { ListPermissionsPagedHandler } from '../../src/application/queries/permission/list-permissions-paged.handler'
import { ListPermissionsPagedQuery } from '../../src/application/queries/permission/list-permissions-paged.query'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'

describe('ListPermissionsPagedHandler', () => {
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

  it('权限分页查询 / 当分页参数有效时 / 应返回仓储结果', async () => {
    const repo = createRepository()
    const handler = new ListPermissionsPagedHandler(repo)
    const response = {
      permissions: [
        new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
      ],
      total: 1,
      page: 1,
      pageSize: 10
    }

    repo.findPaged.mockResolvedValue(response)

    const result = await handler.execute(
      new ListPermissionsPagedQuery({
        page: 1,
        pageSize: 10,
        module: PermissionModule.PERMISSION_SERVICE,
        keyword: 'read'
      })
    )

    expect(repo.findPaged).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      module: PermissionModule.PERMISSION_SERVICE,
      keyword: 'read'
    })
    expect(result).toBe(response)
  })
})
