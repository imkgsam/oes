import {
  PERMISSION_NOT_FOUND,
  POLICY_NOT_FOUND
} from '../../src/common/constants/exception-enums'
import { CreatePolicyCommand } from '../../src/application/commands/policy/create-policy.command'
import { CreatePolicyHandler } from '../../src/application/commands/policy/create-policy.handler'
import { DeletePolicyCommand } from '../../src/application/commands/policy/delete-policy.command'
import { DeletePolicyHandler } from '../../src/application/commands/policy/delete-policy.handler'
import { TogglePolicyCommand } from '../../src/application/commands/policy/toggle-policy.command'
import { TogglePolicyHandler } from '../../src/application/commands/policy/toggle-policy.handler'
import { UpdatePolicyCommand } from '../../src/application/commands/policy/update-policy.command'
import { UpdatePolicyHandler } from '../../src/application/commands/policy/update-policy.handler'
import { Permission } from '../../src/domain/aggregates/permission.aggregate'
import { Policy } from '../../src/domain/aggregates/policy.aggregate'
import { PermissionModule } from '../../src/domain/enums/permission-module.enum'
import { PolicyEffect } from '../../src/domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../src/domain/enums/policy-subject-type.enum'
import { PermissionRepository } from '../../src/domain/repositories/permission.repository'
import { PolicyRepository } from '../../src/domain/repositories/policy.repository'

describe('Policy Handlers', () => {
  const createPermissionRepository = (): jest.Mocked<PermissionRepository> => ({
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

  const createPolicyRepository = (): jest.Mocked<PolicyRepository> => ({
    findById: jest.fn(),
    findByPermissionCode: jest.fn(),
    findApplicable: jest.fn(),
    findByTenant: jest.fn(),
    findAll: jest.fn(),
    findPaged: jest.fn(),
    save: jest.fn(),
    delete: jest.fn()
  })

  const existingPolicy = () =>
    new Policy(
      'policy-id',
      'allow-admin',
      PolicyEffect.ALLOW,
      1,
      PolicySubjectType.ROLE,
      'ADMIN',
      'permission.read',
      'document',
      'tenant-1',
      true,
      null,
      'policy description'
    )

  it('创建策略 / 当 permission 不存在时 / 应返回 PERMISSION_NOT_FOUND', async () => {
    const policyRepo = createPolicyRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new CreatePolicyHandler(policyRepo, permissionRepo)

    permissionRepo.findByCode.mockResolvedValue(null)

    await expect(
      handler.execute(
        new CreatePolicyCommand({
          name: 'allow-admin',
          effect: PolicyEffect.ALLOW,
          subjectType: PolicySubjectType.ROLE,
          subjectId: 'ADMIN',
          permissionCode: 'permission.read'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: PERMISSION_NOT_FOUND.code
      }
    })
  })

  it('创建策略 / 当请求合法时 / 应创建成功', async () => {
    const policyRepo = createPolicyRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new CreatePolicyHandler(policyRepo, permissionRepo)

    permissionRepo.findByCode.mockResolvedValue(
      new Permission('permission-id', 'permission.read', PermissionModule.PERMISSION_SERVICE)
    )
    policyRepo.save.mockImplementation(async (policy) => policy)

    const result = await handler.execute(
      new CreatePolicyCommand({
        name: 'allow-admin',
        effect: PolicyEffect.ALLOW,
        subjectType: PolicySubjectType.ROLE,
        subjectId: 'ADMIN',
        permissionCode: 'permission.read',
        priority: 10
      })
    )

    expect(policyRepo.save).toHaveBeenCalledTimes(1)
    expect(result.name).toBe('allow-admin')
    expect(result.priority).toBe(10)
    expect(result.isEnabled).toBe(true)
  })

  it('更新策略 / 当策略不存在时 / 应返回 POLICY_NOT_FOUND', async () => {
    const policyRepo = createPolicyRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new UpdatePolicyHandler(policyRepo, permissionRepo)

    policyRepo.findById.mockResolvedValue(null)

    await expect(
      handler.execute(
        new UpdatePolicyCommand({
          id: 'policy-id',
          name: 'new-name'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: POLICY_NOT_FOUND.code
      }
    })
  })

  it('更新策略 / 当 permissionCode 更新为不存在值时 / 应返回 PERMISSION_NOT_FOUND', async () => {
    const policyRepo = createPolicyRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new UpdatePolicyHandler(policyRepo, permissionRepo)

    policyRepo.findById.mockResolvedValue(existingPolicy())
    permissionRepo.findByCode.mockResolvedValue(null)

    await expect(
      handler.execute(
        new UpdatePolicyCommand({
          id: 'policy-id',
          permissionCode: 'permission.write'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        code: PERMISSION_NOT_FOUND.code
      }
    })
  })

  it('更新策略 / 当策略存在且请求合法时 / 应更新成功', async () => {
    const policyRepo = createPolicyRepository()
    const permissionRepo = createPermissionRepository()
    const handler = new UpdatePolicyHandler(policyRepo, permissionRepo)
    const policy = existingPolicy()

    policyRepo.findById.mockResolvedValue(policy)
    permissionRepo.findByCode.mockResolvedValue(
      new Permission('permission-id-2', 'permission.write', PermissionModule.AUTH_SERVICE)
    )
    policyRepo.save.mockImplementation(async (value) => value)

    const result = await handler.execute(
      new UpdatePolicyCommand({
        id: 'policy-id',
        name: 'updated-policy',
        permissionCode: 'permission.write',
        priority: 20
      })
    )

    expect(result.name).toBe('updated-policy')
    expect(result.permissionCode).toBe('permission.write')
    expect(result.priority).toBe(20)
  })

  it('启停策略 / 当策略不存在时 / 应返回 POLICY_NOT_FOUND', async () => {
    const policyRepo = createPolicyRepository()
    const handler = new TogglePolicyHandler(policyRepo)

    policyRepo.findById.mockResolvedValue(null)

    await expect(handler.execute(new TogglePolicyCommand('policy-id', false))).rejects.toMatchObject({
      definition: {
        code: POLICY_NOT_FOUND.code
      }
    })
  })

  it('启停策略 / 当切换为禁用时 / 应更新 isEnabled', async () => {
    const policyRepo = createPolicyRepository()
    const handler = new TogglePolicyHandler(policyRepo)
    const policy = existingPolicy()

    policyRepo.findById.mockResolvedValue(policy)
    policyRepo.save.mockImplementation(async (value) => value)

    const result = await handler.execute(new TogglePolicyCommand('policy-id', false))

    expect(result.isEnabled).toBe(false)
  })

  it('删除策略 / 当策略不存在时 / 应返回 POLICY_NOT_FOUND', async () => {
    const policyRepo = createPolicyRepository()
    const handler = new DeletePolicyHandler(policyRepo)

    policyRepo.findById.mockResolvedValue(null)

    await expect(handler.execute(new DeletePolicyCommand('policy-id'))).rejects.toMatchObject({
      definition: {
        code: POLICY_NOT_FOUND.code
      }
    })
  })

  it('删除策略 / 当策略存在时 / 应删除成功', async () => {
    const policyRepo = createPolicyRepository()
    const handler = new DeletePolicyHandler(policyRepo)

    policyRepo.findById.mockResolvedValue(existingPolicy())
    policyRepo.delete.mockResolvedValue()

    await handler.execute(new DeletePolicyCommand('policy-id'))

    expect(policyRepo.delete).toHaveBeenCalledWith('policy-id')
  })
})
