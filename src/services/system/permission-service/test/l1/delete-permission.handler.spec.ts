import {
  PERMISSION_DELETE_FORBIDDEN,
  PERMISSION_NOT_FOUND
} from '../../src/common/constants/exception-enums'
import { DeletePermissionCommand } from '../../src/application/commands/permission/delete-permission.command'
import { DeletePermissionHandler } from '../../src/application/commands/permission/delete-permission.handler'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'

describe('DeletePermissionHandler', () => {
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

  const existingPermission = new Permission(
    'permission-id',
    'permission.delete',
    PermissionModule.PERMISSION_SERVICE,
    'delete permission'
  )

  it('删除权限 / 当权限不存在时 / 应返回 PERMISSION_NOT_FOUND', async () => {
    const repo = createRepository()
    const handler = new DeletePermissionHandler(repo)

    repo.findById.mockResolvedValue(null)

    await expect(handler.execute(new DeletePermissionCommand('permission-id'))).rejects.toMatchObject({
      definition: {
        code: PERMISSION_NOT_FOUND.code
      }
    })
  })

  it('删除权限 / 当权限仍被角色引用时 / 应返回 PERMISSION_DELETE_FORBIDDEN', async () => {
    const repo = createRepository()
    const handler = new DeletePermissionHandler(repo)

    repo.findById.mockResolvedValue(existingPermission)
    repo.hasAssignedRoles.mockResolvedValue(true)
    repo.hasAttachedPolicies.mockResolvedValue(false)

    await expect(handler.execute(new DeletePermissionCommand('permission-id'))).rejects.toMatchObject({
      definition: {
        code: PERMISSION_DELETE_FORBIDDEN.code
      }
    })
    expect(repo.delete).not.toHaveBeenCalled()
  })

  it('删除权限 / 当权限仍被 policy 引用时 / 应返回 PERMISSION_DELETE_FORBIDDEN', async () => {
    const repo = createRepository()
    const handler = new DeletePermissionHandler(repo)

    repo.findById.mockResolvedValue(existingPermission)
    repo.hasAssignedRoles.mockResolvedValue(false)
    repo.hasAttachedPolicies.mockResolvedValue(true)
    repo.hasAttachedPolicyInstances.mockResolvedValue(false)

    await expect(handler.execute(new DeletePermissionCommand('permission-id'))).rejects.toMatchObject({
      definition: {
        code: PERMISSION_DELETE_FORBIDDEN.code
      }
    })
    expect(repo.delete).not.toHaveBeenCalled()
  })

  it('删除权限 / 当权限仍被 PolicyInstance 引用时 / 应返回 PERMISSION_DELETE_FORBIDDEN', async () => {
    const repo = createRepository()
    const handler = new DeletePermissionHandler(repo)

    repo.findById.mockResolvedValue(existingPermission)
    repo.hasAssignedRoles.mockResolvedValue(false)
    repo.hasAttachedPolicies.mockResolvedValue(false)
    repo.hasAttachedPolicyInstances.mockResolvedValue(true)

    await expect(handler.execute(new DeletePermissionCommand('permission-id'))).rejects.toMatchObject({
      definition: {
        code: PERMISSION_DELETE_FORBIDDEN.code
      }
    })
    expect(repo.delete).not.toHaveBeenCalled()
  })

  it('删除权限 / 当未被引用时 / 应删除成功', async () => {
    const repo = createRepository()
    const handler = new DeletePermissionHandler(repo)

    repo.findById.mockResolvedValue(existingPermission)
    repo.hasAssignedRoles.mockResolvedValue(false)
    repo.hasAttachedPolicies.mockResolvedValue(false)
    repo.hasAttachedPolicyInstances.mockResolvedValue(false)
    repo.delete.mockResolvedValue(existingPermission)

    const result = await handler.execute(new DeletePermissionCommand('permission-id'))

    expect(repo.delete).toHaveBeenCalledWith('permission-id')
    expect(result).toBe(existingPermission)
  })
})
