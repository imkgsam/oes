import { PolicyInstancePreviewGrpcController } from '../../src/interfaces/grpc/policy-instance-preview.grpc.controller'

describe('PolicyInstancePreviewGrpcController', () => {
  it('evaluatePolicyInstancePreview / query scope preview / 应映射请求并委托 preview service', async () => {
    const previewService = {
      evaluateQueryScope: jest.fn().mockResolvedValue({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED',
        matchedPolicyIds: ['preview-policy-1'],
        deniedPolicyIds: [],
        scope: {
          field: 'categoryId',
          op: 'IN',
          value: ['raw-material', 'packaging']
        },
        trace: {
          evaluatedPolicyIds: ['preview-policy-1'],
          matchedAllowPolicyIds: ['preview-policy-1'],
          matchedDenyPolicyIds: [],
          reasonCode: 'POLICY_ALLOW_MATCHED'
        }
      })
    }
    const controller = new PolicyInstancePreviewGrpcController(previewService as any)

    await expect(
      controller.evaluatePolicyInstancePreview({
        mode: 2,
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
              type: 1,
              accountId: 'account-1'
            },
            permissionCode: 'procurement.purchase_request.create',
            resourceType: 'item',
            templateCode: 'resource-field-in-set',
            effect: 1,
            params: {
              field: 'categoryId',
              allowedValues: ['raw-material', 'packaging']
            },
            enabled: true,
            priority: 100
          }
        ]
      } as any)
    ).resolves.toEqual(
      expect.objectContaining({
        allowed: true,
        reasonCode: 'POLICY_ALLOW_MATCHED',
        matchedPolicyIds: ['preview-policy-1'],
        scope: {
          field: 'categoryId',
          op: 2,
          values: ['raw-material', 'packaging']
        }
      })
    )

    expect(previewService.evaluateQueryScope).toHaveBeenCalledWith(
      expect.objectContaining({
        policyInstances: [
          expect.objectContaining({
            id: 'preview-policy-1',
            subjectSelector: expect.objectContaining({
              type: 'ACCOUNT',
              accountId: 'account-1'
            }),
            effect: 'ALLOW',
            params: {
              field: 'categoryId',
              allowedValues: ['raw-material', 'packaging']
            }
          })
        ],
        request: expect.objectContaining({
          subject: expect.objectContaining({
            accountId: 'account-1',
            tenantId: 'tenant-1',
            roleIds: []
          }),
          permissionCode: 'procurement.purchase_request.create',
          resourceType: 'item'
        })
      })
    )
  })

  it('evaluatePolicyInstancePreview / 无效 effect enum / 应拒绝而不是默认 ALLOW', async () => {
    const previewService = {
      evaluateQueryScope: jest.fn()
    }
    const controller = new PolicyInstancePreviewGrpcController(previewService as any)

    await expect(
      controller.evaluatePolicyInstancePreview({
        mode: 2,
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
              type: 1,
              accountId: 'account-1'
            },
            permissionCode: 'procurement.purchase_request.create',
            resourceType: 'item',
            templateCode: 'resource-field-in-set',
            effect: 0,
            params: {
              field: 'categoryId',
              allowedValues: ['raw-material']
            },
            enabled: true,
            priority: 100
          }
        ]
      } as any)
    ).rejects.toThrow('POLICY_INSTANCE_PREVIEW_INVALID_EFFECT')
    expect(previewService.evaluateQueryScope).not.toHaveBeenCalled()
  })

  it('evaluatePolicyInstancePreview / 无效 subject selector enum / 应拒绝而不是默认 TENANT_WIDE', async () => {
    const previewService = {
      evaluateQueryScope: jest.fn()
    }
    const controller = new PolicyInstancePreviewGrpcController(previewService as any)

    await expect(
      controller.evaluatePolicyInstancePreview({
        mode: 2,
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
              type: 0
            },
            permissionCode: 'procurement.purchase_request.create',
            resourceType: 'item',
            templateCode: 'resource-field-in-set',
            effect: 1,
            params: {
              field: 'categoryId',
              allowedValues: ['raw-material']
            },
            enabled: true,
            priority: 100
          }
        ]
      } as any)
    ).rejects.toThrow('POLICY_INSTANCE_PREVIEW_INVALID_SUBJECT_SELECTOR')
    expect(previewService.evaluateQueryScope).not.toHaveBeenCalled()
  })
})
