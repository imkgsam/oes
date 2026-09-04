import { PolicyInstanceManagementService } from '../application/authorization/policy-instance-management.service'

const baseInput = {
  tenantId: 'tenant-1',
  subjectSelector: {
    type: 'ACCOUNT' as const,
    accountId: 'account-1'
  },
  permissionCode: 'wms.inventory.view',
  resourceType: 'inventory',
  templateCode: 'resource-field-in-set',
  effect: 'ALLOW' as const,
  params: {
    field: 'warehouseId',
    allowedValues: ['W1', 'W2']
  },
  priority: 25
}

const existingPolicyInstance = {
  id: 'policy-instance-1',
  ...baseInput,
  enabled: true,
  createdBy: 'operator-1',
  updatedBy: 'operator-1',
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z'
}

describe('PolicyInstanceManagementService mutation use cases', () => {
  const repository = {
    findById: jest.fn(),
    findEnabledForEvaluation: jest.fn(),
    listForManagement: jest.fn(),
    save: jest.fn()
  }

  const service = new PolicyInstanceManagementService(repository as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('create persists a template-based PolicyInstance with operator audit metadata', async () => {
    repository.save.mockImplementation(async (instance) => instance)

    const result = await service.create({
      ...baseInput,
      operatorId: 'operator-1'
    })

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
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
        priority: 25,
        createdBy: 'operator-1',
        updatedBy: 'operator-1'
      })
    )
    expect(result.id).toEqual(expect.any(String))
    expect(result.createdAt).toEqual(expect.any(String))
    expect(result.updatedAt).toEqual(expect.any(String))
  })

  it('setEnabled updates only enabled state and updated audit metadata', async () => {
    repository.findById.mockResolvedValue(existingPolicyInstance)
    repository.save.mockImplementation(async (instance) => instance)

    await expect(
      service.setEnabled({
        id: 'policy-instance-1',
        enabled: false,
        operatorId: 'operator-2'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'policy-instance-1',
        enabled: false,
        createdBy: 'operator-1',
        updatedBy: 'operator-2',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: expect.any(String)
      })
    )

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'policy-instance-1',
        enabled: false,
        createdBy: 'operator-1',
        updatedBy: 'operator-2'
      })
    )
  })

  it('setEnabled rejects unknown PolicyInstance ids', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(
      service.setEnabled({
        id: 'missing',
        enabled: false,
        operatorId: 'operator-2'
      })
    ).rejects.toThrow('POLICY_INSTANCE_NOT_FOUND')
  })
})
