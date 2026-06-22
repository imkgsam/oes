import { PolicyManagementGrpcController } from '../../src/interfaces/grpc/policy-management.grpc.controller'
import { Policy } from '../../src/domain/aggregates/policy.aggregate'
import { PolicyEffect } from '../../src/domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../src/domain/enums/policy-subject-type.enum'

describe('PolicyManagementGrpcController Additional L3', () => {
  const createBuses = () => ({
    queryBus: {
      execute: jest.fn()
    }
  })

  const createPolicy = (id: string, name: string) =>
    new Policy(
      id,
      name,
      PolicyEffect.ALLOW,
      10,
      PolicySubjectType.ANY,
      null,
      'permission.read',
      null,
      null,
      true,
      null,
      `${name} description`
    )

  it('gRPC 按 id 查询策略 / 当请求合法时 / 应映射为 GetPolicyByIdQuery 并返回 PolicyResponse', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(buses.queryBus as any)
    buses.queryBus.execute.mockResolvedValue(createPolicy('policy-id', 'allow-admin'))

    const result = await controller.getPolicyById({ id: 'policy-id' } as any)

    const query = buses.queryBus.execute.mock.calls[0][0]
    expect(query.constructor.name).toBe('GetPolicyByIdQuery')
    expect(result.id).toBe('policy-id')
  })

  it('gRPC 按权限查询策略列表 / 当请求合法时 / 应映射为 ListPoliciesByPermissionQuery', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(buses.queryBus as any)
    buses.queryBus.execute.mockResolvedValue([createPolicy('policy-id', 'allow-admin')])

    const result = await controller.listPoliciesByPermission({
      permissionCode: 'permission.read',
      tenantId: 'tenant-1'
    } as any)

    const query = buses.queryBus.execute.mock.calls[0][0]
    expect(query.constructor.name).toBe('ListPoliciesByPermissionQuery')
    expect(query.permissionCode).toBe('permission.read')
    expect(result.policies).toHaveLength(1)
  })

  it('gRPC mutation 方法 / 应不再存在', () => {
    const methodNames = Object.getOwnPropertyNames(PolicyManagementGrpcController.prototype)

    expect(methodNames).not.toEqual(
      expect.arrayContaining([
        'deletePolicy',
        'togglePolicy',
        'addPermissionPolicy',
        'removePermissionPolicy'
      ])
    )
  })
})
