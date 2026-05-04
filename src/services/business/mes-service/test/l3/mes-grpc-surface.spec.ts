import {
  MoldFunctionRole as ProtoMoldFunctionRole,
  MoldOutputStructureType as ProtoMoldOutputStructureType,
  MoldResourceType as ProtoMoldResourceType,
  ProductionMoldInstanceStatus as ProtoProductionMoldInstanceStatus
} from '@oes/common/generated/mes_service'
import { MesManagementGrpcController } from '../../src/interfaces/grpc/mes-management.grpc.controller'
import { MesQueryGrpcController } from '../../src/interfaces/grpc/mes-query.grpc.controller'

function buildQueryContext() {
  return {
    tenantId: 'tenant-1',
    orgId: 'org-1',
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId: 'org-1'
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: 'request-1'
    }
  }
}

function buildManagementContext() {
  return {
    ...buildQueryContext(),
    auditContext: {
      auditId: 'audit-1',
      reason: 'test',
      source: 'jest'
    },
    commandId: 'cmd-1'
  }
}

describe('mes-service grpc surface L3', () => {
  it('RegisterMoldDesign / should map the management payload and present the design response', async () => {
    const registerMoldDesign = jest.fn().mockResolvedValue({
      moldDesignId: 'design-1',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      designCode: 'WB-A100',
      name: 'Wash Basin A100',
      revisionCode: 'R1',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: 'pf-1'
      },
      manufacturingSpecRefs: [],
      itemRef: null,
      materialType: 'GYPSUM',
      functionRole: 'PRODUCTION',
      productionMethodTags: [],
      outputStructureType: 'SINGLE',
      outputs: [],
      defaultLifeLimit: '100',
      defaultLifeUnit: 'USE',
      status: 'ACTIVE',
      createdAt: '2026-05-04T10:00:00.000Z',
      updatedAt: '2026-05-04T10:00:00.000Z'
    })
    const controller = new MesManagementGrpcController({
      registerMoldDesign
    } as never)

    const response = await controller.registerMoldDesign({
      ...buildManagementContext(),
      designCode: 'wb-a100',
      name: 'Wash Basin A100',
      revisionCode: 'R1',
      productFamilyRef: {
        refType: 1,
        refId: 'pf-1'
      },
      materialType: 'GYPSUM',
      functionRole: ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_PRODUCTION,
      outputStructureType: ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_SINGLE,
      outputs: [],
      defaultLifeLimit: '100',
      defaultLifeUnit: 'USE',
      reason: 'register design'
    })

    expect(registerMoldDesign).toHaveBeenCalledWith(
      expect.objectContaining({
        designCode: 'wb-a100',
        functionRole: 'PRODUCTION',
        outputStructureType: 'SINGLE'
      })
    )
    expect(response.moldDesign?.designCode).toBe('WB-A100')
    expect(response.moldDesign?.functionRole).toBe(ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_PRODUCTION)
  })

  it('GetMoldCurrentLocation / should map resource type and present current location', async () => {
    const getMoldCurrentLocation = jest.fn().mockResolvedValue({
      moldResourceType: 'PRODUCTION_MOLD_INSTANCE',
      moldResourceId: 'mold-1',
      moldCode: 'PM-001',
      currentStatus: 'PENDING_INSTALLATION',
      currentMesLocationSummary: {
        mesLocationId: 'loc-1',
        locationCode: 'READY-01',
        name: 'Ready Rack',
        locationType: 'AVAILABLE',
        status: 'ACTIVE'
      },
      currentInstallationSummary: null,
      lastMovementEventId: 'move-1',
      lastMovedAt: '2026-05-04T10:00:00.000Z'
    })
    const controller = new MesQueryGrpcController({
      getMoldCurrentLocation
    } as never)

    const response = await controller.getMoldCurrentLocation({
      ...buildQueryContext(),
      moldResourceType: ProtoMoldResourceType.MOLD_RESOURCE_TYPE_PRODUCTION_MOLD_INSTANCE,
      moldResourceId: 'mold-1'
    })

    expect(getMoldCurrentLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        moldResourceType: 'PRODUCTION_MOLD_INSTANCE',
        moldResourceId: 'mold-1'
      })
    )
    expect(response.currentLocation?.moldResourceType).toBe(
      ProtoMoldResourceType.MOLD_RESOURCE_TYPE_PRODUCTION_MOLD_INSTANCE
    )
    expect(response.currentLocation?.currentStatus).toBe('PENDING_INSTALLATION')
  })

  it('RegisterProductionMoldInstance / should present the lifecycle status without IN_USE', async () => {
    const registerProductionMoldInstance = jest.fn().mockResolvedValue({
      productionMoldInstance: {
        productionMoldInstanceId: 'mold-1',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        moldInstanceCode: 'PM-001',
        moldDesignSummary: {
          moldDesignId: 'design-1',
          designCode: 'WB-A100',
          name: 'Wash Basin A100',
          revisionCode: 'R1'
        },
        masterMoldSummary: null,
        supplierRef: null,
        purchaseRef: null,
        receivedAt: null,
        acceptedAt: null,
        currentStatus: 'PENDING_INSTALLATION',
        currentMesLocationSummary: null,
        currentInstallationSummary: null,
        lifeSummary: {
          lifeUnit: 'USE',
          usedValue: '0',
          limitValue: '100',
          warningThresholdValue: '80',
          remainingValue: '100',
          warningLevel: 'INFO',
          lastUsageEventId: null,
          lastAdjustedAt: null
        },
        warningSummary: null,
        scrappedAt: null,
        createdAt: '2026-05-04T10:00:00.000Z',
        updatedAt: '2026-05-04T10:00:00.000Z'
      },
      moldLifeCounter: {
        moldLifeCounterId: 'life-1',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        productionMoldInstanceId: 'mold-1',
        lifeUnit: 'USE',
        usedValue: '0',
        limitValue: '100',
        warningThresholdValue: '80',
        updatedAt: '2026-05-04T10:00:00.000Z'
      }
    })
    const controller = new MesManagementGrpcController({
      registerProductionMoldInstance
    } as never)

    const response = await controller.registerProductionMoldInstance({
      ...buildManagementContext(),
      moldInstanceCode: 'PM-001',
      moldDesignId: 'design-1',
      initialStatus: ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_INSTALLATION,
      lifeLimitValue: '100',
      lifeUnit: 'USE',
      warningThresholdValue: '80',
      reason: 'register mold'
    })

    expect(response.productionMoldInstance?.currentStatus).toBe(
      ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_INSTALLATION
    )
  })
})
