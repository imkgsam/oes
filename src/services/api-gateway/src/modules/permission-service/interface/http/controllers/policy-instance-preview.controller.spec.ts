import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { PolicyInstancePreviewController } from './policy-instance-preview.controller'

describe('PolicyInstancePreviewController', () => {
  const permissionService = {
    evaluatePolicyInstancePreview: jest.fn()
  }

  const controller = new PolicyInstancePreviewController(permissionService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares policy read permission on evaluate preview endpoint', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        PolicyInstancePreviewController.prototype.evaluatePreview
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards evaluate preview payload to the permission proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    const body = {
      mode: 'QUERY_SCOPE',
      subject: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        roleIds: []
      },
      permissionCode: 'procurement.purchase_request.create',
      resourceType: 'item',
      policyInstances: [
        {
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
          priority: 100
        }
      ]
    }

    permissionService.evaluatePolicyInstancePreview.mockResolvedValue({
      allowed: true,
      reasonCode: 'POLICY_ALLOW_MATCHED',
      scope: {
        field: 'categoryId',
        op: 'IN',
        value: ['raw-material', 'packaging']
      }
    })

    await expect(controller.evaluatePreview(body as any, source as any)).resolves.toEqual({
      allowed: true,
      reasonCode: 'POLICY_ALLOW_MATCHED',
      scope: {
        field: 'categoryId',
        op: 'IN',
        value: ['raw-material', 'packaging']
      }
    })

    expect(permissionService.evaluatePolicyInstancePreview).toHaveBeenCalledWith(body, source)
  })
})
