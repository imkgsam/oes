import { ListPoliciesPagedQuery } from '../../src/application/queries/policy/list-policies-paged.query'
import { Policy } from '../../src/domain/aggregates/policy.aggregate'
import { PolicyEffect } from '../../src/domain/enums/policy-effect.enum'
import { PolicySubjectType } from '../../src/domain/enums/policy-subject-type.enum'
import { PolicyManagementGrpcController } from '../../src/interfaces/grpc/policy-management.grpc.controller'

describe('PolicyManagementGrpcController Contract', () => {
  const createBuses = () => ({
    queryBus: {
      execute: jest.fn()
    }
  })

  it('gRPC 分页查询策略 / 当请求包含过滤条件时 / 应映射为 ListPoliciesPagedQuery 并返回分页结构', async () => {
    const buses = createBuses()
    const controller = new PolicyManagementGrpcController(buses.queryBus as any)

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
