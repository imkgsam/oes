import { PolicyInstanceManagementGrpcAdapter } from './policy-instance-management-grpc.adapter'
import { of } from 'rxjs'

describe('PolicyInstanceManagementGrpcAdapter', () => {
  const grpcService = {
    createPolicyInstance: jest.fn(),
    getPolicyInstance: jest.fn(),
    listPolicyInstances: jest.fn(),
    setPolicyInstanceEnabled: jest.fn()
  }
  const grpcClient = {
    getService: jest.fn(() => grpcService)
  }
  const client = {
    getClient: jest.fn(() => grpcClient)
  }
  const metadata = { metadata: true }
  const metadataFactory = {
    forBusinessCall: jest.fn(async () => metadata)
  }
  const adapter = new PolicyInstanceManagementGrpcAdapter(client as any, metadataFactory as any)
  const source = {
    requestId: 'req-1',
    traceId: 'trace-1',
    user: {
      aid: 'operator-1',
      tid: 'tenant-1',
      oid: 'org-1'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    grpcClient.getService.mockReturnValue(grpcService)
    adapter.onModuleInit()
  })

  it('listPolicyInstances / maps filters and normalizes PolicyInstance records', async () => {
    grpcService.listPolicyInstances.mockReturnValue(of({
      policyInstances: [
        {
          id: 'instance-1',
          tenantId: 'tenant-1',
          subjectSelector: {
            type: 1,
            accountId: 'account-1'
          },
          permissionCode: 'wms.inventory.view',
          resourceType: 'inventory',
          templateCode: 'resource-field-in-set',
          effect: 1,
          params: {
            field: 'warehouseId',
            allowedValues: ['W1', 'W2']
          },
          enabled: true,
          priority: 10
        }
      ],
      total: 1,
      page: 2,
      pageSize: 10
    }))

    await expect(
      adapter.listPolicyInstances(
        {
          hasEnabledFilter: true,
          enabled: true,
          page: 2,
          pageSize: 10,
          permissionCode: 'wms.inventory.view',
          resourceType: 'inventory',
          subjectSelectorType: 'ACCOUNT',
          subjectSelectorValue: 'account-1',
          templateCode: 'resource-field-in-set',
          tenantId: 'tenant-1'
        },
        source as any
      )
    ).resolves.toEqual({
      policyInstances: [
        {
          id: 'instance-1',
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
      ],
      total: 1,
      page: 2,
      pageSize: 10
    })

    expect(grpcService.listPolicyInstances).toHaveBeenCalledWith(
      {
        hasEnabledFilter: true,
        enabled: true,
        page: 2,
        pageSize: 10,
        permissionCode: 'wms.inventory.view',
        resourceType: 'inventory',
        subjectSelectorType: 1,
        subjectSelectorValue: 'account-1',
        templateCode: 'resource-field-in-set',
        tenantId: 'tenant-1'
      },
      metadata
    )
  })

  it('getPolicyInstanceById / forwards stable id and normalizes one record', async () => {
    grpcService.getPolicyInstance.mockReturnValue(of({
      id: 'instance-1',
      subjectSelector: {
        type: 2,
        roleId: 'role-1'
      },
      effect: 2
    }))

    await expect(
      adapter.getPolicyInstanceById({ id: 'instance-1' }, source as any)
    ).resolves.toEqual({
      id: 'instance-1',
      subjectSelector: {
        type: 'ROLE',
        roleId: 'role-1'
      },
      effect: 'DENY'
    })

    expect(grpcService.getPolicyInstance).toHaveBeenCalledWith(
      { id: 'instance-1' },
      metadata
    )
  })

  it('createPolicyInstance / maps HTTP shape into template-based gRPC payload', async () => {
    grpcService.createPolicyInstance.mockReturnValue(of({
      id: 'instance-1',
      subjectSelector: {
        type: 1,
        accountId: 'account-1'
      },
      effect: 1
    }))

    await expect(
      adapter.createPolicyInstance(
        {
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
        },
        source as any
      )
    ).resolves.toEqual({
      id: 'instance-1',
      subjectSelector: {
        type: 'ACCOUNT',
        accountId: 'account-1'
      },
      effect: 'ALLOW'
    })

    expect(grpcService.createPolicyInstance).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        subjectSelector: {
          type: 1,
          accountId: 'account-1'
        },
        permissionCode: 'wms.inventory.view',
        resourceType: 'inventory',
        templateCode: 'resource-field-in-set',
        effect: 1,
        params: {
          field: 'warehouseId',
          allowedValues: ['W1', 'W2']
        },
        enabled: true,
        priority: 10
      },
      metadata
    )
  })

  it('setPolicyInstanceEnabled / forwards enable state changes to permission-service', async () => {
    grpcService.setPolicyInstanceEnabled.mockReturnValue(of({
      id: 'instance-1',
      enabled: false
    }))

    await expect(
      adapter.setPolicyInstanceEnabled(
        {
          id: 'instance-1',
          enabled: false
        },
        source as any
      )
    ).resolves.toEqual({
      id: 'instance-1',
      enabled: false,
      effect: undefined,
      subjectSelector: undefined
    })

    expect(grpcService.setPolicyInstanceEnabled).toHaveBeenCalledWith(
      {
        id: 'instance-1',
        enabled: false
      },
      metadata
    )
  })
})
