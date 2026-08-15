import { GUARDS_METADATA } from '@nestjs/common/constants'
import {
  attachOperatorContext,
  getRpcAuthorizationModeDeclaration
} from '@oes/common/authorization'
import { MANAGEMENT_PERMISSION_CODES } from '../../src/common/constants/authorization'
import { PolicyInstanceManagementGrpcController } from '../../src/interfaces/grpc/policy-instance-management.grpc.controller'
import { PermissionFoundationTrustedExecutionGuard } from '../../src/modules/authorization/permission-trusted-execution.module'

const policyInstance = {
  id: 'instance-1',
  tenantId: 'tenant-1',
  subjectSelector: {
    type: 'ACCOUNT',
    accountId: 'account-1'
  },
  permissionCode: 'procurement.purchase.create',
  resourceType: 'item',
  templateCode: 'resource-field-in-set',
  effect: 'ALLOW',
  params: {
    field: 'categoryId',
    allowedValues: ['raw-material']
  },
  enabled: true,
  priority: 10,
  createdBy: 'operator-1',
  updatedBy: 'operator-1',
  createdAt: '2026-05-16T00:00:00.000Z',
  updatedAt: '2026-05-16T00:00:00.000Z'
}

/** Reads one exact Code only from a frozen BUSINESS execution declaration. */
function businessCode(
  methodName: keyof PolicyInstanceManagementGrpcController
): string | undefined {
  const declaration = getRpcAuthorizationModeDeclaration(
    PolicyInstanceManagementGrpcController.prototype,
    methodName
  )
  expect(declaration?.mode).toBe('BUSINESS')
  return declaration?.mode === 'BUSINESS' && 'all' in declaration.permissions
    ? declaration.permissions.all[0]
    : undefined
}

describe('PolicyInstanceManagementGrpcController', () => {
  const managementService = {
    create: jest.fn(),
    getById: jest.fn(),
    list: jest.fn(),
    setEnabled: jest.fn()
  }

  const controller = new PolicyInstanceManagementGrpcController(managementService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares exact ET BUSINESS Codes on query and mutation endpoints', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, PolicyInstanceManagementGrpcController)).toEqual(
      expect.arrayContaining([PermissionFoundationTrustedExecutionGuard])
    )
    expect(businessCode('listPolicyInstances')).toBe(MANAGEMENT_PERMISSION_CODES.VIEW_POLICY)
    expect(businessCode('getPolicyInstance')).toBe(MANAGEMENT_PERMISSION_CODES.VIEW_POLICY)
    expect(businessCode('createPolicyInstance')).toBe(MANAGEMENT_PERMISSION_CODES.CREATE_POLICY)
    expect(businessCode('setPolicyInstanceEnabled')).toBe(
      MANAGEMENT_PERMISSION_CODES.UPDATE_POLICY
    )
  })

  it('listPolicyInstances / maps filters and returns paged PolicyInstance records', async () => {
    managementService.list.mockResolvedValue({
      items: [policyInstance],
      total: 1,
      page: 2,
      pageSize: 10
    })

    await expect(
      controller.listPolicyInstances({
        tenantId: 'tenant-1',
        permissionCode: 'procurement.purchase.create',
        resourceType: 'item',
        templateCode: 'resource-field-in-set',
        subjectSelectorType: 1,
        subjectSelectorValue: 'account-1',
        hasEnabledFilter: true,
        enabled: true,
        page: 2,
        pageSize: 10
      } as any)
    ).resolves.toEqual({
      policyInstances: [
        {
          id: 'instance-1',
          tenantId: 'tenant-1',
          subjectSelector: {
            type: 1,
            accountId: 'account-1'
          },
          permissionCode: 'procurement.purchase.create',
          resourceType: 'item',
          templateCode: 'resource-field-in-set',
          effect: 1,
          params: {
            field: 'categoryId',
            allowedValues: ['raw-material']
          },
          enabled: true,
          priority: 10,
          createdBy: 'operator-1',
          updatedBy: 'operator-1',
          createdAt: '2026-05-16T00:00:00.000Z',
          updatedAt: '2026-05-16T00:00:00.000Z'
        }
      ],
      total: 1,
      page: 2,
      pageSize: 10
    })

    expect(managementService.list).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      permissionCode: 'procurement.purchase.create',
      resourceType: 'item',
      templateCode: 'resource-field-in-set',
      subjectSelectorType: 'ACCOUNT',
      subjectSelectorValue: 'account-1',
      enabled: true,
      page: 2,
      pageSize: 10
    })
  })

  it('getPolicyInstance / returns one PolicyInstance by stable id', async () => {
    managementService.getById.mockResolvedValue(policyInstance)

    await expect(
      controller.getPolicyInstance({
        id: 'instance-1'
      } as any)
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'instance-1',
        subjectSelector: {
          type: 1,
          accountId: 'account-1'
        },
        effect: 1
      })
    )

    expect(managementService.getById).toHaveBeenCalledWith('instance-1')
  })

  it('createPolicyInstance / maps proto payload and operator audit metadata into the service', async () => {
    managementService.create.mockResolvedValue(policyInstance)
    const request = {
      tenantId: 'tenant-1',
      subjectSelector: {
        type: 1,
        accountId: 'account-1'
      },
      permissionCode: 'procurement.purchase.create',
      resourceType: 'item',
      templateCode: 'resource-field-in-set',
      effect: 1,
      params: {
        field: 'categoryId',
        allowedValues: ['raw-material']
      },
      enabled: true,
      priority: 10
    }
    attachOperatorContext(request, {
      operator_id: 'operator-1',
      tenant_id: 'tenant-1'
    })

    await expect(controller.createPolicyInstance(request as any)).resolves.toEqual(
      expect.objectContaining({
        id: 'instance-1',
        subjectSelector: {
          type: 1,
          accountId: 'account-1'
        },
        effect: 1
      })
    )

    expect(managementService.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      subjectSelector: {
        type: 'ACCOUNT',
        accountId: 'account-1'
      },
      permissionCode: 'procurement.purchase.create',
      resourceType: 'item',
      templateCode: 'resource-field-in-set',
      effect: 'ALLOW',
      params: {
        field: 'categoryId',
        allowedValues: ['raw-material']
      },
      enabled: true,
      priority: 10,
      operatorId: 'operator-1'
    })
  })

  it('setPolicyInstanceEnabled / toggles persisted PolicyInstance state with operator audit metadata', async () => {
    managementService.setEnabled.mockResolvedValue({
      ...policyInstance,
      enabled: false,
      updatedBy: 'operator-2'
    })
    const request = {
      id: 'instance-1',
      enabled: false
    }
    attachOperatorContext(request, {
      operator_id: 'operator-2',
      tenant_id: 'tenant-1'
    })

    await expect(controller.setPolicyInstanceEnabled(request as any)).resolves.toEqual(
      expect.objectContaining({
        id: 'instance-1',
        enabled: false,
        updatedBy: 'operator-2'
      })
    )

    expect(managementService.setEnabled).toHaveBeenCalledWith({
      id: 'instance-1',
      enabled: false,
      operatorId: 'operator-2'
    })
  })
})
