import {
  BuildQueryScopeRequest,
  CheckResourceRequest,
  PolicyTemplateInstanceAuthorizationService
} from '../../src/application/authorization/resource-policy'
import { ResourceAuthorizationService } from '../../src/application/authorization/resource-authorization.service'

describe('ResourceAuthorizationService', () => {
  const checkResourceRequest: CheckResourceRequest = {
    subject: {
      accountId: 'account-1',
      tenantId: 'tenant-1',
      roleIds: []
    },
    permissionCode: 'procurement.purchase.create',
    resource: {
      tenantId: 'tenant-1',
      resourceType: 'item',
      categoryId: 'raw-material'
    }
  }

  const buildQueryScopeRequest: BuildQueryScopeRequest = {
    subject: {
      accountId: 'account-1',
      tenantId: 'tenant-1',
      roleIds: []
    },
    permissionCode: 'procurement.purchase.create',
    resourceType: 'item'
  }

  /** createService constructs the generic facade with a mocked template-instance evaluator. */
  function createService() {
    const evaluator: jest.Mocked<Pick<
      PolicyTemplateInstanceAuthorizationService,
      'checkResource' | 'buildQueryScope'
    >> = {
      checkResource: jest.fn().mockResolvedValue({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED',
        matchedPolicyIds: ['policy-1'],
        deniedPolicyIds: []
      }),
      buildQueryScope: jest.fn().mockResolvedValue({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED',
        scope: {
          field: 'categoryId',
          op: 'IN',
          value: ['raw-material']
        },
        matchedPolicyIds: ['policy-1'],
        deniedPolicyIds: []
      })
    }

    return {
      evaluator,
      service: new ResourceAuthorizationService(evaluator as PolicyTemplateInstanceAuthorizationService)
    }
  }

  it('checkResource / 应通过通用 facade 委托给 template instance evaluator', async () => {
    const { evaluator, service } = createService()

    const result = await service.checkResource(checkResourceRequest)

    expect(evaluator.checkResource).toHaveBeenCalledWith(checkResourceRequest)
    expect(result).toEqual(
      expect.objectContaining({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED'
      })
    )
  })

  it('buildQueryScope / 应通过通用 facade 返回结构化 scope', async () => {
    const { evaluator, service } = createService()

    const result = await service.buildQueryScope(buildQueryScopeRequest)

    expect(evaluator.buildQueryScope).toHaveBeenCalledWith(buildQueryScopeRequest)
    expect(result.scope).toEqual({
      field: 'categoryId',
      op: 'IN',
      value: ['raw-material']
    })
  })
})
