import { PolicyInstancePreviewService } from '../application/authorization/policy-instance-preview.service'
import { PolicyInstance } from '../application/authorization/resource-policy'

const candidate: PolicyInstance = {
  id: 'preview-policy-1',
  tenantId: 'tenant-1',
  subjectSelector: {
    type: 'ACCOUNT',
    accountId: 'account-1'
  },
  permissionCode: 'procurement.purchase_request.create',
  resourceType: 'item',
  templateCode: 'resource-field-in-set',
  effect: 'ALLOW',
  params: {
    field: 'categoryId',
    allowedValues: ['raw-material', 'packaging']
  },
  enabled: true,
  priority: 100,
  createdBy: 'preview',
  updatedBy: 'preview',
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z'
}

describe('PolicyInstancePreviewService', () => {
  it('evaluateQueryScope / 使用候选 PolicyInstance 返回结构化 QueryScope', async () => {
    const service = new PolicyInstancePreviewService()

    await expect(
      service.evaluateQueryScope({
        policyInstances: [candidate],
        request: {
          subject: {
            accountId: 'account-1',
            tenantId: 'tenant-1',
            roleIds: []
          },
          permissionCode: 'procurement.purchase_request.create',
          resourceType: 'item'
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED',
        matchedPolicyIds: ['preview-policy-1'],
        scope: {
          field: 'categoryId',
          op: 'IN',
          value: ['raw-material', 'packaging']
        }
      })
    )
  })

  it('evaluateResource / 使用候选 PolicyInstance 对资源事实做 allow 与 deny 判定', async () => {
    const service = new PolicyInstancePreviewService()

    const baseRequest = {
      subject: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        roleIds: []
      },
      permissionCode: 'procurement.purchase_request.create',
      resource: {
        tenantId: 'tenant-1',
        resourceType: 'item'
      }
    }

    await expect(
      service.evaluateResource({
        policyInstances: [candidate],
        request: {
          ...baseRequest,
          resource: {
            ...baseRequest.resource,
            categoryId: 'raw-material'
          }
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED',
        matchedPolicyIds: ['preview-policy-1']
      })
    )

    await expect(
      service.evaluateResource({
        policyInstances: [candidate],
        request: {
          ...baseRequest,
          resource: {
            ...baseRequest.resource,
            categoryId: 'finished-goods'
          }
        }
      })
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: false,
        reasonCode: 'POLICY_NO_ALLOW_MATCHED'
      })
    )
  })

  it('evaluateQueryScope / 无效 params / 应拒绝预览而不是执行自由 JSON 策略', async () => {
    const service = new PolicyInstancePreviewService()

    await expect(
      service.evaluateQueryScope({
        policyInstances: [
          {
            ...candidate,
            params: {
              field: 'categoryId'
            }
          }
        ],
        request: {
          subject: {
            accountId: 'account-1',
            tenantId: 'tenant-1',
            roleIds: []
          },
          permissionCode: 'procurement.purchase_request.create',
          resourceType: 'item'
        }
      })
    ).rejects.toThrow('POLICY_TEMPLATE_PARAMS_INVALID')
  })
})
