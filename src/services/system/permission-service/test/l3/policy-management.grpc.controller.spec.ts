import { CreatePolicyCommand } from '../../src/application/commands/policy/create-policy.command'
import { UpdatePolicyCommand } from '../../src/application/commands/policy/update-policy.command'
import { ListPoliciesPagedQuery } from '../../src/application/queries/policy/list-policies-paged.query'
import { Policy } from '../../src/domain/aggregates/policy.aggregate'
import { PolicyEffect } from '../../src/domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../src/domain/enums/policy-subject-type.enum'
import { PolicyManagementGrpcController } from '../../src/interfaces/grpc/policy-management.grpc.controller'

describe('PolicyManagementGrpcController L3', () => {
  const createBuses = () => ({
    commandBus: {
      execute: jest.fn()
    },
    queryBus: {
      execute: jest.fn()
    }
  })

  it('gRPC 创建策略 / 当请求使用 proto 枚举值时 / 应映射为 domain 枚举并返回 PolicyResponse', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(
      buses.commandBus as any,
      buses.queryBus as any
    )
    const policy = new Policy(
      'policy-id',
      'allow-admin',
      PolicyEffect.ALLOW,
      10,
      PolicySubjectType.ROLE,
      'ADMIN',
      'permission.read',
      'document',
      'tenant-1',
      true,
      null,
      'policy description'
    )

    buses.commandBus.execute.mockResolvedValue(policy)

    const result = await controller.createPolicy({
      name: 'allow-admin',
      effect: 1,
      description: 'policy description',
      tenantId: 'tenant-1',
      subjectType: 1,
      subjectId: 'ADMIN',
      permissionCode: 'permission.read',
      resourceType: 'document',
      priority: 10
    } as any)

    expect(buses.commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<CreatePolicyCommand>({
        name: 'allow-admin',
        effect: PolicyEffect.ALLOW,
        subjectType: PolicySubjectType.ROLE,
        subjectId: 'ADMIN',
        permissionCode: 'permission.read',
        resourceType: 'document',
        priority: 10
      })
    )
    expect(result).toEqual({
      id: 'policy-id',
      name: 'allow-admin',
      effect: PolicyEffect.ALLOW,
      description: 'policy description',
      tenantId: 'tenant-1',
      subjectType: PolicySubjectType.ROLE,
      subjectId: 'ADMIN',
      permissionCode: 'permission.read',
      resourceType: 'document',
      priority: 10,
      isEnabled: true,
      conditionAstJson: ''
    })
  })

  it('gRPC 更新策略 / 当请求字段未显式提供时 / 应保持 undefined 并只映射显式字段', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(
      buses.commandBus as any,
      buses.queryBus as any
    )
    const policy = new Policy(
      'policy-id',
      'updated-policy',
      PolicyEffect.DENY,
      20,
      PolicySubjectType.ACCOUNT,
      'account-1',
      'permission.write',
      null,
      null,
      true
    )

    buses.commandBus.execute.mockResolvedValue(policy)

    const result = await controller.updatePolicy({
      id: 'policy-id',
      effect: 2,
      permissionCode: 'permission.write',
      priority: 20
    } as any)

    expect(buses.commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<UpdatePolicyCommand>({
        id: 'policy-id',
        effect: PolicyEffect.DENY,
        permissionCode: 'permission.write',
        priority: 20,
        name: undefined,
        subjectType: undefined
      })
    )
    expect(result.effect).toBe(PolicyEffect.DENY)
    expect(result.permissionCode).toBe('permission.write')
  })

  it('gRPC 分页查询策略 / 当请求包含过滤条件时 / 应映射为 ListPoliciesPagedQuery 并返回分页结构', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(
      buses.commandBus as any,
      buses.queryBus as any
    )

    buses.queryBus.execute.mockResolvedValue({
      policies: [
        new Policy(
          'policy-id',
          'allow-admin',
          PolicyEffect.ALLOW,
          5,
          PolicySubjectType.ANY,
          null,
          'permission.read',
          null,
          null,
          true
        )
      ],
      total: 1,
      page: 1,
      pageSize: 10
    })

    const result = await controller.listPoliciesPaged({
      page: 1,
      pageSize: 10,
      tenantId: 'tenant-1',
      permissionCode: 'permission.read',
      isEnabled: true,
      keyword: 'allow',
      subjectType: 2,
      subjectId: 'account-1'
    } as any)

    expect(buses.queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining<ListPoliciesPagedQuery>({
        page: 1,
        pageSize: 10,
        tenantId: 'tenant-1',
        permissionCode: 'permission.read',
        isEnabled: true,
        keyword: 'allow',
        subjectType: PolicySubjectType.ACCOUNT,
        subjectId: 'account-1'
      })
    )
    expect(result).toEqual({
      policies: [
        {
          id: 'policy-id',
          name: 'allow-admin',
          effect: PolicyEffect.ALLOW,
          description: '',
          tenantId: '',
          subjectType: PolicySubjectType.ANY,
          subjectId: '',
          permissionCode: 'permission.read',
          resourceType: '',
          priority: 5,
          isEnabled: true,
          conditionAstJson: ''
        }
      ],
      total: 1,
      page: 1,
      pageSize: 10
    })
  })
})
