import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { PolicyInstanceController } from './policy-instance.controller'

describe('PolicyInstanceController', () => {
  const permissionService = {
    createPolicyInstance: jest.fn(),
    getPolicyInstanceById: jest.fn(),
    listPolicyInstances: jest.fn(),
    setPolicyInstanceEnabled: jest.fn()
  }

  const controller = new PolicyInstanceController(permissionService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares policy read permission on readonly PolicyInstance endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        PolicyInstanceController.prototype.listPolicyInstances
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        PolicyInstanceController.prototype.getPolicyInstanceById
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        PolicyInstanceController.prototype.createPolicyInstance
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        PolicyInstanceController.prototype.setPolicyInstanceEnabled
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards readonly list filters to the permission proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.listPolicyInstances.mockResolvedValue({
      policyInstances: [],
      total: 0,
      page: 2,
      pageSize: 10
    })

    await expect(
      controller.listPolicyInstances(
        {
          enabled: false,
          page: 2,
          pageSize: 10,
          permissionCode: 'wms.inventory.view',
          resourceType: 'inventory',
          subjectSelectorType: 'ACCOUNT',
          subjectSelectorValue: 'account-1',
          templateCode: 'resource-field-in-set',
          tenantId: 'tenant-1'
        } as any,
        source as any
      )
    ).resolves.toEqual({
      policyInstances: [],
      total: 0,
      page: 2,
      pageSize: 10
    })

    expect(permissionService.listPolicyInstances).toHaveBeenCalledWith(
      {
        enabled: false,
        hasEnabledFilter: true,
        page: 2,
        pageSize: 10,
        permissionCode: 'wms.inventory.view',
        resourceType: 'inventory',
        subjectSelectorType: 'ACCOUNT',
        subjectSelectorValue: 'account-1',
        templateCode: 'resource-field-in-set',
        tenantId: 'tenant-1'
      },
      source
    )
  })

  it('forwards readonly detail request to the permission proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.getPolicyInstanceById.mockResolvedValue({ id: 'policy-instance-1' })

    await expect(
      controller.getPolicyInstanceById('policy-instance-1', source as any)
    ).resolves.toEqual({ id: 'policy-instance-1' })

    expect(permissionService.getPolicyInstanceById).toHaveBeenCalledWith(
      { id: 'policy-instance-1' },
      source
    )
  })

  it('forwards create request to the permission proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    const body = {
      tenantId: 'tenant-1',
      subjectSelector: {
        type: 'ACCOUNT',
        accountId: 'account-1'
      },
      permissionCode: 'wms.inventory.view',
      resourceType: 'inventory',
      templateCode: 'resource-field-in-set',
      effect: 'ALLOW',
      params: {
        field: 'warehouseId',
        allowedValues: ['W1', 'W2']
      },
      enabled: true,
      priority: 10
    }
    permissionService.createPolicyInstance.mockResolvedValue({ id: 'policy-instance-1' })

    await expect(
      controller.createPolicyInstance(body as any, source as any)
    ).resolves.toEqual({ id: 'policy-instance-1' })

    expect(permissionService.createPolicyInstance).toHaveBeenCalledWith(body, source)
  })

  it('forwards enable state changes to the permission proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }
    permissionService.setPolicyInstanceEnabled.mockResolvedValue({
      id: 'policy-instance-1',
      enabled: false
    })

    await expect(
      controller.setPolicyInstanceEnabled(
        'policy-instance-1',
        { enabled: false } as any,
        source as any
      )
    ).resolves.toEqual({
      id: 'policy-instance-1',
      enabled: false
    })

    expect(permissionService.setPolicyInstanceEnabled).toHaveBeenCalledWith(
      {
        id: 'policy-instance-1',
        enabled: false
      },
      source
    )
  })
})
