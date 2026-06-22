import { ResourceAuthorizationGrpcController } from '../../src/interfaces/grpc/resource-authorization.grpc.controller'

describe('ResourceAuthorizationGrpcController', () => {
  const resourceAuthorization = {
    checkResource: jest.fn(),
    buildQueryScope: jest.fn()
  }

  const controller = new ResourceAuthorizationGrpcController(resourceAuthorization as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('checkResource / maps gRPC facts and delegates to the resource authorization facade', async () => {
    resourceAuthorization.checkResource.mockResolvedValue({
      allowed: true,
      reasonCode: 'POLICY_ALLOW_MATCHED',
      matchedPolicyIds: ['policy-1'],
      deniedPolicyIds: [],
      trace: {
        evaluatedPolicyIds: ['policy-1'],
        matchedAllowPolicyIds: ['policy-1'],
        matchedDenyPolicyIds: [],
        skippedPolicyIds: [],
        reasonCode: 'POLICY_ALLOW_MATCHED'
      }
    })

    await expect(
      controller.checkResource({
        subject: {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          roleIds: ['role-1'],
          roleCodes: ['warehouse-viewer'],
          orgIds: ['org-1'],
          visibleOrgIds: ['org-1', 'org-2']
        },
        permissionCode: 'wms.inventory.view',
        resource: {
          tenantId: 'tenant-1',
          resourceType: 'inventory',
          resourceId: 'inventory-1',
          warehouseId: 'W1',
          storageLocationId: 'L1',
          workCenterId: 'WC1',
          attributes: {
            qualityStatus: 'available'
          }
        },
        environment: {
          clientIp: '10.0.0.10',
          terminal: 'web'
        }
      } as any)
    ).resolves.toEqual({
      allowed: true,
      reasonCode: 'POLICY_ALLOW_MATCHED',
      matchedPolicyIds: ['policy-1'],
      deniedPolicyIds: [],
      trace: {
        evaluatedPolicyIds: ['policy-1'],
        matchedAllowPolicyIds: ['policy-1'],
        matchedDenyPolicyIds: [],
        skippedPolicyIds: [],
        reasonCode: 'POLICY_ALLOW_MATCHED'
      }
    })

    expect(resourceAuthorization.checkResource).toHaveBeenCalledWith({
      subject: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        roleIds: ['role-1'],
        roleCodes: ['warehouse-viewer'],
        orgIds: ['org-1'],
        visibleOrgIds: ['org-1', 'org-2']
      },
      permissionCode: 'wms.inventory.view',
      resource: {
        tenantId: 'tenant-1',
        resourceType: 'inventory',
        resourceId: 'inventory-1',
        warehouseId: 'W1',
        storageLocationId: 'L1',
        workCenterId: 'WC1',
        attributes: {
          qualityStatus: 'available'
        }
      },
      environment: {
        clientIp: '10.0.0.10',
        terminal: 'web'
      }
    })
  })

  it('buildQueryScope / maps structured scope response for list and export flows', async () => {
    resourceAuthorization.buildQueryScope.mockResolvedValue({
      allowed: true,
      reasonCode: 'POLICY_ALLOW_MATCHED',
      matchedPolicyIds: ['policy-2'],
      deniedPolicyIds: [],
      scope: {
        and: [
          {
            field: 'warehouseId',
            op: 'IN',
            value: ['W1', 'W2']
          },
          {
            field: 'workCenterId',
            op: 'EQ',
            value: 'WC1'
          }
        ]
      }
    })

    await expect(
      controller.buildQueryScope({
        subject: {
          accountId: 'account-1',
          tenantId: 'tenant-1',
          roleIds: ['role-1']
        },
        permissionCode: 'mes.work_order.view',
        resourceType: 'work-order'
      } as any)
    ).resolves.toEqual({
      allowed: true,
      reasonCode: 'POLICY_ALLOW_MATCHED',
      matchedPolicyIds: ['policy-2'],
      deniedPolicyIds: [],
      scope: {
        and: [
          {
            field: 'warehouseId',
            op: 2,
            values: ['W1', 'W2']
          },
          {
            field: 'workCenterId',
            op: 1,
            value: 'WC1',
            values: []
          }
        ],
        values: []
      }
    })

    expect(resourceAuthorization.buildQueryScope).toHaveBeenCalledWith({
      subject: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
        roleIds: ['role-1'],
        roleCodes: [],
        orgIds: [],
        visibleOrgIds: []
      },
      permissionCode: 'mes.work_order.view',
      resourceType: 'work-order'
    })
  })
})
