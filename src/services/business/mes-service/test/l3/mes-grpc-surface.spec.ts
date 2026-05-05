import {
  MoldDesignOutputKind as ProtoMoldDesignOutputKind,
  MoldFunctionRole as ProtoMoldFunctionRole,
  MoldOutputStructureType as ProtoMoldOutputStructureType,
  MoldResourceType as ProtoMoldResourceType,
  MoldUsageMode as ProtoMoldUsageMode,
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

/** createRequestContextStore returns a minimal downstream context store stub for direct controller tests. */
function createRequestContextStore() {
  return {
    run: jest.fn((_context, work: () => Promise<unknown>) => work())
  }
}

describe('mes-service grpc surface L3', () => {
  it('RegisterMoldDesign / should seed downstream request context before invoking management service', async () => {
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
    const requestContextStore = createRequestContextStore()
    const controller = new MesManagementGrpcController(
      {
        registerMoldDesign
      } as never,
      requestContextStore as never
    )

    await controller.registerMoldDesign({
      ...buildManagementContext(),
      designCode: 'wb-a100',
      name: 'Wash Basin A100',
      productFamilyRef: {
        refType: 1,
        refId: 'pf-1'
      },
      materialType: 'GYPSUM',
      functionRole: ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_PRODUCTION,
      outputStructureType: ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_SINGLE,
      outputs: [],
      reason: 'register design'
    })

    expect(requestContextStore.run).toHaveBeenCalledWith(
      expect.objectContaining({
        internalServiceName: 'mes-service',
        requestId: 'request-1',
        traceId: 'trace-1',
        operatorContext: expect.objectContaining({
          operator_id: 'operator-1',
          operator_type: 'HUMAN',
          tenant_id: 'tenant-1',
          org_id: 'org-1',
          issuer: 'mes-service'
        })
      }),
      expect.any(Function)
    )
    expect(registerMoldDesign).toHaveBeenCalled()
  })

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
    const controller = new MesManagementGrpcController(
      {
        registerMoldDesign
      } as never,
      createRequestContextStore() as never
    )

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

  it('RegisterMoldDesign / should preserve selectable output options for casting-time choices', async () => {
    const registerMoldDesign = jest.fn().mockResolvedValue({
      moldDesignId: 'design-1',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      designCode: 'TOILET-HP-001',
      name: '连体马桶高压模具方案',
      revisionCode: 'R1',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: 'pf-toilet'
      },
      manufacturingSpecRefs: [],
      itemRef: null,
      materialType: 'HIGH_PRESSURE_RESIN',
      functionRole: 'PRODUCTION',
      productionMethodTags: ['HIGH_PRESSURE'],
      outputStructureType: 'COMPONENT_COMBINATION',
      outputs: [
        {
          moldDesignOutputId: 'output-body',
          tenantId: 'tenant-1',
          orgId: 'org-1',
          moldDesignId: 'design-1',
          sequenceNo: 1,
          outputCode: 'BODY',
          outputKind: 'MANUFACTURING_SPEC',
          productFamilyRef: null,
          manufacturingSpecRef: {
            refType: 'MANUFACTURING_SPEC',
            refId: 'spec-body-300'
          },
          quantityPerUse: '1',
          componentRole: '主体',
          assemblyHint: null,
          isPrimaryOutput: true,
          options: [
            {
              moldDesignOutputOptionId: 'option-body-300',
              tenantId: 'tenant-1',
              orgId: 'org-1',
              moldDesignId: 'design-1',
              moldDesignOutputId: 'output-body',
              optionCode: 'PIT-300',
              label: '300坑距',
              manufacturingSpecRef: {
                refType: 'MANUFACTURING_SPEC',
                refId: 'spec-body-300'
              },
              productFamilyRef: null,
              quantityPerUse: '1',
              isDefault: true
            }
          ]
        }
      ],
      defaultLifeLimit: '1200',
      defaultLifeUnit: 'USE',
      status: 'ACTIVE',
      createdAt: '2026-05-04T10:00:00.000Z',
      updatedAt: '2026-05-04T10:00:00.000Z'
    })
    const controller = new MesManagementGrpcController(
      {
        registerMoldDesign
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.registerMoldDesign({
      ...buildManagementContext(),
      designCode: 'TOILET-HP-001',
      name: '连体马桶高压模具方案',
      productFamilyRef: {
        refType: 1,
        refId: 'pf-toilet'
      },
      materialType: 'HIGH_PRESSURE_RESIN',
      functionRole: ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_PRODUCTION,
      productionMethodTags: ['HIGH_PRESSURE'],
      outputStructureType: ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_COMPONENT_COMBINATION,
      outputs: [
        {
          sequenceNo: 1,
          outputCode: 'BODY',
          outputKind: ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_MANUFACTURING_SPEC,
          manufacturingSpecRef: {
            refType: 2,
            refId: 'spec-body-300'
          },
          quantityPerUse: '1',
          componentRole: '主体',
          isPrimaryOutput: true,
          options: [
            {
              optionCode: 'PIT-300',
              label: '300坑距',
              manufacturingSpecRef: {
                refType: 2,
                refId: 'spec-body-300'
              },
              quantityPerUse: '1',
              isDefault: true
            }
          ]
        }
      ],
      defaultLifeLimit: '1200',
      defaultLifeUnit: 'USE',
      reason: 'register high pressure design'
    })

    expect(registerMoldDesign).toHaveBeenCalledWith(
      expect.objectContaining({
        outputs: [
          expect.objectContaining({
            outputCode: 'BODY',
            options: [
              expect.objectContaining({
                optionCode: 'PIT-300',
                label: '300坑距',
                manufacturingSpecRef: expect.objectContaining({ refId: 'spec-body-300' })
              })
            ]
          })
        ]
      })
    )
    expect(response.moldDesign?.outputs[0]?.options[0]?.optionCode).toBe('PIT-300')
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
    const controller = new MesManagementGrpcController(
      {
        registerProductionMoldInstance
      } as never,
      createRequestContextStore() as never
    )

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

  it('WorkCenter commands and queries should expose production unit master data without manual position CRUD', async () => {
    const createWorkCenter = jest.fn().mockResolvedValue({
      workCenterId: 'wc-line-1',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      workCenterCode: 'LINE-LT-01',
      name: '连体马桶上线一线',
      workCenterType: 'CASTING_LINE',
      parentWorkCenterId: null,
      relatedMesLocationId: null,
      capacityProfileId: null,
      status: 'ACTIVE',
      createdAt: '2026-05-04T10:00:00.000Z',
      updatedAt: '2026-05-04T10:00:00.000Z'
    })
    const deactivateWorkCenter = jest.fn().mockResolvedValue({
      workCenterId: 'wc-line-1',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      workCenterCode: 'LINE-LT-01',
      name: '连体马桶上线一线',
      workCenterType: 'CASTING_LINE',
      parentWorkCenterId: null,
      relatedMesLocationId: null,
      capacityProfileId: null,
      status: 'INACTIVE',
      createdAt: '2026-05-04T10:00:00.000Z',
      updatedAt: '2026-05-05T10:00:00.000Z'
    })
    const listWorkCenters = jest.fn().mockResolvedValue({
      items: [
        {
          workCenterId: 'wc-line-1',
          workCenterCode: 'LINE-LT-01',
          name: '连体马桶上线一线',
          workCenterType: 'CASTING_LINE',
          parentWorkCenterId: null,
          relatedMesLocationId: null,
          capacityProfileId: null,
          status: 'ACTIVE'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    const managementController = new MesManagementGrpcController(
      {
        createWorkCenter,
        deactivateWorkCenter
      } as never,
      createRequestContextStore() as never
    )
    const queryController = new MesQueryGrpcController({
      listWorkCenters
    } as never)

    const created = await managementController.createWorkCenter({
      ...buildManagementContext(),
      workCenterCode: 'LINE-LT-01',
      name: '连体马桶上线一线',
      workCenterType: 'CASTING_LINE',
      reason: 'create casting line'
    })
    const listed = await queryController.listWorkCenters({
      ...buildQueryContext(),
      keyword: '连体',
      status: 'ACTIVE',
      page: 1,
      pageSize: 20
    })
    const deactivated = await managementController.deactivateWorkCenter({
      ...buildManagementContext(),
      workCenterId: 'wc-line-1',
      reason: 'retire line'
    })

    expect(createWorkCenter).toHaveBeenCalledWith(
      expect.objectContaining({
        workCenterCode: 'LINE-LT-01',
        workCenterType: 'CASTING_LINE'
      })
    )
    expect(listWorkCenters).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: '连体',
        status: 'ACTIVE'
      })
    )
    expect(created.workCenterSummary?.workCenterCode).toBe('LINE-LT-01')
    expect(listed.workCenters).toHaveLength(1)
    expect(deactivated.workCenterSummary?.status).toBe('INACTIVE')
  })

  it('ListProductionMoldInstances / should expose the tenant-wide production mold directory', async () => {
    const listProductionMoldInstances = jest.fn().mockResolvedValue({
      items: [
        {
          productionMoldInstanceId: 'mold-1',
          tenantId: 'tenant-1',
          orgId: 'org-1',
          moldInstanceCode: 'PM-LT-001',
          moldDesignSummary: {
            moldDesignId: 'design-1',
            designCode: 'TOILET-HP-001',
            name: '连体马桶高压模具方案',
            revisionCode: 'R1'
          },
          masterMoldSummary: null,
          supplierRef: null,
          purchaseRef: null,
          receivedAt: null,
          acceptedAt: null,
          currentStatus: 'INSTALLED',
          currentMesLocationSummary: null,
          currentInstallationSummary: null,
          lifeSummary: null,
          warningSummary: null,
          scrappedAt: null,
          createdAt: '2026-05-04T10:00:00.000Z',
          updatedAt: '2026-05-04T10:00:00.000Z'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    const controller = new MesQueryGrpcController({
      listProductionMoldInstances
    } as never)

    const response = await controller.listProductionMoldInstances({
      ...buildQueryContext(),
      status: ProtoProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_INSTALLED,
      page: 1,
      pageSize: 20
    })

    expect(listProductionMoldInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'INSTALLED',
        page: 1,
        pageSize: 20
      })
    )
    expect(response.instances[0]?.moldInstanceCode).toBe('PM-LT-001')
  })

  it('RecordMoldUsage / should preserve the selected output option used by daily casting entry', async () => {
    const recordMoldUsage = jest.fn().mockResolvedValue({
      usageEvent: {
        moldUsageEventId: 'usage-1',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        productionMoldInstanceId: 'mold-1',
        moldInstallationId: 'install-1',
        workCenterId: 'wc-line-1',
        resourcePositionId: 'pos-1',
        usageMode: 'MANUAL_CHECKLIST',
        usedAt: '2026-05-05',
        usageQuantity: '1',
        lifeDelta: '1',
        lifeUnit: 'USE',
        lifeUsedValueAfter: '42',
        productFamilyRef: null,
        manufacturingSpecRef: null,
        moldDesignOutputId: 'output-body',
        moldDesignOutputOptionId: 'option-body-400',
        wipUnitRef: null,
        physicalTraceId: null,
        workOrderRef: null,
        operationTaskRef: null,
        operatorRef: { operatorId: 'operator-1' },
        captureSource: 'WEB_CHECKLIST',
        auditRef: { auditId: 'audit-1', commandId: 'cmd-1', reason: 'test' }
      },
      moldLifeCounter: {
        moldLifeCounterId: 'life-1',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        productionMoldInstanceId: 'mold-1',
        lifeUnit: 'USE',
        usedValue: '42',
        limitValue: '1200',
        warningThresholdValue: '960',
        updatedAt: '2026-05-05T10:00:00.000Z'
      },
      raisedWarning: null
    })
    const controller = new MesManagementGrpcController(
      {
        recordMoldUsage
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.recordMoldUsage({
      ...buildManagementContext(),
      productionMoldInstanceId: 'mold-1',
      moldInstallationId: 'install-1',
      workCenterId: 'wc-line-1',
      resourcePositionId: 'pos-1',
      usageMode: ProtoMoldUsageMode.MOLD_USAGE_MODE_MANUAL_CHECKLIST,
      usedAt: '2026-05-05',
      usageQuantity: '1',
      lifeDelta: '1',
      lifeUnit: 'USE',
      moldDesignOutputId: 'output-body',
      moldDesignOutputOptionId: 'option-body-400',
      captureSource: 'WEB_CHECKLIST',
      reason: 'daily checklist'
    })

    expect(recordMoldUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        moldDesignOutputId: 'output-body',
        moldDesignOutputOptionId: 'option-body-400'
      })
    )
    expect(response.usageEvent?.moldDesignOutputId).toBe('output-body')
    expect(response.usageEvent?.moldDesignOutputOptionId).toBe('option-body-400')
  })
})
