import { PolicyManagementGrpcController } from '../../src/interfaces/grpc/policy-management.grpc.controller'
import { Policy } from '../../src/domain/aggregates/policy.aggregate'
import { PolicyEffect } from '../../src/domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../src/domain/enums/policy-subject-type.enum'

describe('PolicyManagementGrpcController Additional L3', () => {
  const createBuses = () => ({
    commandBus: {
      execute: jest.fn()
    },
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

  it('gRPC 删除和启停策略 / 当请求合法时 / 应映射为对应命令', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue(createPolicy('policy-id', 'allow-admin'))

    await controller.deletePolicy({ id: 'policy-id' } as any)
    await controller.togglePolicy({ id: 'policy-id', isEnabled: false } as any)

    expect(buses.commandBus.execute.mock.calls[0][0].constructor.name).toBe('DeletePolicyCommand')
    expect(buses.commandBus.execute.mock.calls[1][0].constructor.name).toBe('TogglePolicyCommand')
  })

  it('gRPC 按 id 查询策略 / 当请求合法时 / 应映射为 GetPolicyByIdQuery 并返回 PolicyResponse', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.queryBus.execute.mockResolvedValue(createPolicy('policy-id', 'allow-admin'))

    const result = await controller.getPolicyById({ id: 'policy-id' } as any)

    const query = buses.queryBus.execute.mock.calls[0][0]
    expect(query.constructor.name).toBe('GetPolicyByIdQuery')
    expect(result.id).toBe('policy-id')
  })

  it('gRPC 按权限查询策略列表 / 当请求合法时 / 应映射为 ListPoliciesByPermissionQuery', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
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

  it('gRPC 为权限新增策略 / 当请求使用 proto 枚举值时 / 应映射为 AddPermissionPolicyCommand', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(buses.commandBus as any, buses.queryBus as any)
    buses.commandBus.execute.mockResolvedValue(createPolicy('policy-id', 'allow-admin'))

    await controller.addPermissionPolicy({
      permissionCode: 'permission.read',
      name: 'allow-admin',
      effect: 1,
      subjectType: 3,
      priority: 10
    } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('AddPermissionPolicyCommand')
    expect(command.effect).toBe(PolicyEffect.ALLOW)
    expect(command.subjectType).toBe(PolicySubjectType.ANY)
  })

  it('gRPC 移除权限策略 / 当请求合法时 / 应映射为 RemovePermissionPolicyCommand', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(buses.commandBus as any, buses.queryBus as any)

    await controller.removePermissionPolicy({
      permissionCode: 'permission.read',
      policyId: 'policy-id'
    } as any)

    const command = buses.commandBus.execute.mock.calls[0][0]
    expect(command.constructor.name).toBe('RemovePermissionPolicyCommand')
    expect(command.permissionCode).toBe('permission.read')
    expect(command.policyId).toBe('policy-id')
  })
})
