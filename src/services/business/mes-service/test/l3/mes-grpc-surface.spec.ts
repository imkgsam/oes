import {
  MoldDesignOutputKind as ProtoMoldDesignOutputKind,
  MoldFunctionRole as ProtoMoldFunctionRole,
  MoldOutputStructureType as ProtoMoldOutputStructureType,
  MasterMoldStatus as ProtoMasterMoldStatus,
  ProductionMoldStatus as ProtoProductionMoldStatus,
  ToolingPlacementType as ProtoToolingPlacementType,
  ToolingType as ProtoToolingType
} from '@oes/common/generated/mes_service'
import { MesManagementGrpcController } from '../../src/interfaces/grpc/mes-management.grpc.controller'
import { MesQueryGrpcController } from '../../src/interfaces/grpc/mes-query.grpc.controller'

/** buildQueryContext creates the generated gRPC query context used by Mold / Tooling L3 tests. */
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

/** buildManagementContext creates the generated gRPC command context used by Mold / Tooling L3 tests. */
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

/** moldDesignRecord returns one current application-layer MoldDesign record. */
function moldDesignRecord() {
  return {
    moldDesignId: 'design-1',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    designCode: 'WB-A100',
    name: 'Wash Basin A100',
    revisionCode: 'R1',
    supersedesMoldDesignId: null,
    primaryItemModelRef: {
      itemModelId: 'item-model-1',
      modelCodeSnapshot: 'WB-A100',
      modelNameSnapshot: 'Wash Basin A100'
    },
    productionSpecRefs: [
      {
        productionSpecId: 'spec-1',
        specCodeSnapshot: 'WB-A100-HP',
        displayNameSnapshot: 'Wash Basin A100 High Pressure'
      }
    ],
    materialType: 'GYPSUM',
    functionRole: 'PRODUCTION',
    productionMethodTags: ['HIGH_PRESSURE'],
    outputStructureType: 'SINGLE',
    outputs: [
      {
        moldDesignOutputId: 'output-1',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        moldDesignId: 'design-1',
        sequenceNo: 1,
        outputCode: 'MAIN',
        outputKind: 'PRODUCTION_SPEC',
        productionSpecRef: {
          productionSpecId: 'spec-1'
        },
        itemModelRef: {
          itemModelId: 'item-model-1',
          modelCodeSnapshot: 'WB-A100',
          modelNameSnapshot: 'Wash Basin A100'
        },
        quantityPerUse: '1',
        componentRole: null,
        assemblyHint: null,
        isPrimaryOutput: true,
        options: [
          {
            moldDesignOutputOptionId: 'option-1',
            tenantId: 'tenant-1',
            orgId: 'org-1',
            moldDesignId: 'design-1',
            moldDesignOutputId: 'output-1',
            optionCode: 'DEFAULT',
            label: 'Default',
            productionSpecRef: {
              productionSpecId: 'spec-1'
            },
            quantityPerUse: '1',
            isDefault: true
          }
        ]
      }
    ],
    defaultLifeLimit: '1000',
    defaultLifeUnit: 'CASTING_CYCLE',
    status: 'ACTIVE',
    createdAt: '2026-05-04T10:00:00.000Z',
    updatedAt: '2026-05-04T10:00:00.000Z'
  }
}

/** masterMoldRecord returns one current application-layer MasterMold record. */
function masterMoldRecord() {
  return {
    masterMoldId: 'master-1',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    masterMoldCode: 'MM-001',
    moldDesignId: 'design-1',
    supplierRef: null,
    purchaseRef: null,
    receivedAt: '2026-05-04T10:00:00.000Z',
    currentStatus: 'AVAILABLE',
    currentStorageResourceRef: {
      storageResourceId: 'storage-1',
      resourceCodeSnapshot: 'MASTER-01',
      displayNameSnapshot: 'Master Mold Rack'
    },
    currentCarrierResourceRef: null,
    qualitySummary: null,
    notes: null,
    createdAt: '2026-05-04T10:00:00.000Z',
    updatedAt: '2026-05-04T10:00:00.000Z'
  }
}

/** productionMoldRecord returns one current application-layer ProductionMold record. */
function productionMoldRecord() {
  return {
    productionMoldId: 'mold-1',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    moldCode: 'PM-001',
    moldDesignId: 'design-1',
    sourceMasterMoldId: null,
    supplierRef: null,
    purchaseRef: null,
    receivedAt: null,
    acceptedAt: null,
    currentStatus: 'RECEIVED',
    currentStorageResourceRef: {
      storageResourceId: 'storage-1',
      resourceCodeSnapshot: 'READY-01',
      displayNameSnapshot: 'Ready Rack'
    },
    currentCarrierResourceRef: null,
    currentInstallationSummary: null,
    lifeCounterSummary: {
      moldLifeCounterId: 'life-1',
      lifeUnit: 'CASTING_CYCLE',
      usedValue: '0',
      limitValue: '1000',
      warningThresholdValue: null,
      remainingValue: '1000',
      warningLevel: 'INFO',
      lastUsageRecordId: null,
      lastAdjustedAt: null
    },
    scrappedAt: null,
    createdAt: '2026-05-04T10:00:00.000Z',
    updatedAt: '2026-05-04T10:00:00.000Z'
  }
}

/** toolingInstallationRecord returns one current application-layer ToolingInstallation fact. */
function toolingInstallationRecord() {
  return {
    toolingInstallationId: 'install-1',
    tenantId: 'tenant-1',
    orgId: 'org-1',
    toolingType: 'MOLD',
    toolingId: 'mold-1',
    workCenterRef: {
      workCenterId: 'wc-1',
      workCenterCodeSnapshot: 'WC-01',
      displayNameSnapshot: 'Work Center 01'
    },
    workUnitRef: {
      workUnitId: 'wu-1',
      workUnitCodeSnapshot: 'WU-01',
      displayNameSnapshot: 'Work Unit 01'
    },
    installedAt: '2026-05-05T08:00:00.000Z',
    unmountedAt: null,
    installedByRef: {
      operatorId: 'operator-1',
      displayNameSnapshot: 'operator-1'
    },
    unmountedByRef: null,
    status: 'ACTIVE',
    moldDetail: {
      toolingInstallationId: 'install-1',
      moldPosition: 'A1',
      cavityPosition: 'LEFT',
      cavityMapping: null,
      setupParameters: null
    },
    auditRef: {
      auditId: 'audit-1',
      commandId: 'cmd-1',
      reason: 'test'
    }
  }
}

describe('mes-service mold/tooling grpc surface L3', () => {
  it('RegisterMoldDesign / should seed downstream request context before invoking management service', async () => {
    const registerMoldDesign = jest.fn().mockResolvedValue(moldDesignRecord())
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
      primaryItemModelRef: { itemModelId: 'item-model-1' },
      productionSpecRefs: [{ productionSpecId: 'spec-1' }],
      materialType: 'GYPSUM',
      functionRole: ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_PRODUCTION,
      outputStructureType: ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_SINGLE,
      outputs: [
        {
          sequenceNo: 1,
          outputCode: 'MAIN',
          outputKind: ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_PRODUCTION_SPEC,
          productionSpecRef: { productionSpecId: 'spec-1' },
          itemModelRef: { itemModelId: 'item-model-1' },
          quantityPerUse: '1',
          isPrimaryOutput: true
        }
      ]
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

  it('RegisterMoldDesign / should map current ProductionSpec refs and output options', async () => {
    const registerMoldDesign = jest.fn().mockResolvedValue(moldDesignRecord())
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
      primaryItemModelRef: { itemModelId: 'item-model-1' },
      productionSpecRefs: [{ productionSpecId: 'spec-1' }],
      materialType: 'GYPSUM',
      functionRole: ProtoMoldFunctionRole.MOLD_FUNCTION_ROLE_PRODUCTION,
      outputStructureType: ProtoMoldOutputStructureType.MOLD_OUTPUT_STRUCTURE_TYPE_SINGLE,
      outputs: [
        {
          sequenceNo: 1,
          outputCode: 'MAIN',
          outputKind: ProtoMoldDesignOutputKind.MOLD_DESIGN_OUTPUT_KIND_PRODUCTION_SPEC,
          productionSpecRef: { productionSpecId: 'spec-1' },
          itemModelRef: { itemModelId: 'item-model-1' },
          quantityPerUse: '1',
          isPrimaryOutput: true,
          options: [
            {
              optionCode: 'DEFAULT',
              label: 'Default',
              productionSpecRef: { productionSpecId: 'spec-1' },
              quantityPerUse: '1',
              isDefault: true
            }
          ]
        }
      ]
    })

    expect(registerMoldDesign).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryItemModelRef: expect.objectContaining({ itemModelId: 'item-model-1' }),
        productionSpecRefs: [expect.objectContaining({ productionSpecId: 'spec-1' })],
        outputs: [
          expect.objectContaining({
            outputKind: 'PRODUCTION_SPEC',
            productionSpecRef: expect.objectContaining({ productionSpecId: 'spec-1' }),
            itemModelRef: expect.objectContaining({ itemModelId: 'item-model-1' }),
            options: [expect.objectContaining({ optionCode: 'DEFAULT' })]
          })
        ]
      })
    )
    expect(response.moldDesign?.primaryItemModelRef?.itemModelId).toBe('item-model-1')
    expect(response.moldDesign?.productionSpecRefs?.[0]?.productionSpecId).toBe('spec-1')
    expect(response.moldDesign?.outputs?.[0]?.options?.[0]?.optionCode).toBe('DEFAULT')
  })

  it('RegisterMasterMold and ListMasterMolds / should map the first-slice master mold result object', async () => {
    const registerMasterMold = jest.fn().mockResolvedValue(masterMoldRecord())
    const listMasterMolds = jest.fn().mockResolvedValue({
      masterMolds: [
        {
          masterMoldId: 'master-1',
          masterMoldCode: 'MM-001',
          moldDesignSummary: {
            moldDesignId: 'design-1',
            designCode: 'WB-A100',
            name: 'Wash Basin A100',
            revisionCode: 'R1',
            status: 'ACTIVE',
            primaryItemModelRef: { itemModelId: 'item-model-1' }
          },
          currentStatus: 'AVAILABLE',
          currentPlacementSummary: {
            placementType: 'STORAGE_RESOURCE',
            storageResourceRef: {
              storageResourceId: 'storage-1'
            }
          }
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    const managementController = new MesManagementGrpcController(
      {
        registerMasterMold
      } as never,
      createRequestContextStore() as never
    )
    const queryController = new MesQueryGrpcController({
      listMasterMolds
    } as never)

    const registered = await managementController.registerMasterMold({
      ...buildManagementContext(),
      masterMoldCode: 'MM-001',
      moldDesignId: 'design-1',
      initialStorageResourceRef: { storageResourceId: 'storage-1' }
    })
    const listed = await queryController.listMasterMolds({
      ...buildQueryContext(),
      status: ProtoMasterMoldStatus.MASTER_MOLD_STATUS_AVAILABLE,
      moldDesignId: 'design-1',
      page: 1,
      pageSize: 20
    })

    expect(registerMasterMold).toHaveBeenCalledWith(
      expect.objectContaining({
        masterMoldCode: 'MM-001',
        initialStorageResourceRef: expect.objectContaining({ storageResourceId: 'storage-1' })
      })
    )
    expect(listMasterMolds).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'AVAILABLE',
        moldDesignId: 'design-1'
      })
    )
    expect(registered.masterMold?.currentStatus).toBe(ProtoMasterMoldStatus.MASTER_MOLD_STATUS_AVAILABLE)
    expect(listed.masterMolds?.[0]?.masterMoldCode).toBe('MM-001')
  })

  it('RegisterProductionMold / should expose ProductionMold without old instance naming', async () => {
    const registerProductionMold = jest.fn().mockResolvedValue(productionMoldRecord())
    const controller = new MesManagementGrpcController(
      {
        registerProductionMold
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.registerProductionMold({
      ...buildManagementContext(),
      moldCode: 'PM-001',
      moldDesignId: 'design-1',
      initialStorageResourceRef: {
        storageResourceId: 'storage-1'
      }
    })

    expect(registerProductionMold).toHaveBeenCalledWith(
      expect.objectContaining({
        moldCode: 'PM-001',
        initialStorageResourceRef: expect.objectContaining({ storageResourceId: 'storage-1' })
      })
    )
    expect(response.productionMold?.productionMoldId).toBe('mold-1')
    expect(response.productionMold?.currentStatus).toBe(ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_RECEIVED)
  })

  it('AcceptProductionMold / should expose the RECEIVED to AVAILABLE acceptance command', async () => {
    const acceptProductionMold = jest.fn().mockResolvedValue({
      productionMold: {
        ...productionMoldRecord(),
        currentStatus: 'AVAILABLE',
        acceptedAt: '2026-05-05T08:00:00.000Z'
      }
    })
    const controller = new MesManagementGrpcController(
      {
        acceptProductionMold
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.acceptProductionMold({
      ...buildManagementContext(),
      productionMoldId: 'mold-1',
      acceptedAt: '2026-05-05T08:00:00.000Z'
    })

    expect(acceptProductionMold).toHaveBeenCalledWith(
      expect.objectContaining({
        productionMoldId: 'mold-1',
        acceptedAt: '2026-05-05T08:00:00.000Z'
      })
    )
    expect(response.productionMold?.currentStatus).toBe(ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_AVAILABLE)
  })

  it('InstallTooling / should map work refs and present ToolingInstallation with mold detail position', async () => {
    const installTooling = jest.fn().mockResolvedValue({
      toolingInstallation: toolingInstallationRecord()
    })
    const controller = new MesManagementGrpcController(
      {
        installTooling
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.installTooling({
      ...buildManagementContext(),
      toolingType: ProtoToolingType.TOOLING_TYPE_MOLD,
      toolingId: 'mold-1',
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      workUnitRef: {
        workUnitId: 'wu-1'
      },
      moldPosition: 'A1',
      cavityPosition: 'LEFT'
    })

    expect(installTooling).toHaveBeenCalledWith(
      expect.objectContaining({
        toolingType: 'MOLD',
        toolingId: 'mold-1',
        workCenterRef: expect.objectContaining({ workCenterId: 'wc-1' }),
        workUnitRef: expect.objectContaining({ workUnitId: 'wu-1' }),
        moldPosition: 'A1'
      })
    )
    expect(response.toolingInstallation?.moldDetail?.moldPosition).toBe('A1')
  })

  it('MoveTooling and GetToolingCurrentPlacement / should use storage or carrier resource refs', async () => {
    const placement = {
      placementType: 'CARRIER_RESOURCE',
      carrierResourceRef: {
        carrierResourceId: 'carrier-1',
        resourceCodeSnapshot: 'CART-01',
        displayNameSnapshot: 'Cart 01'
      }
    }
    const moveTooling = jest.fn().mockResolvedValue({ placement })
    const getToolingCurrentPlacement = jest.fn().mockResolvedValue({ placement })
    const managementController = new MesManagementGrpcController(
      {
        moveTooling
      } as never,
      createRequestContextStore() as never
    )
    const queryController = new MesQueryGrpcController({
      getToolingCurrentPlacement
    } as never)

    const moved = await managementController.moveTooling({
      ...buildManagementContext(),
      toolingType: ProtoToolingType.TOOLING_TYPE_MOLD,
      toolingId: 'mold-1',
      toCarrierResourceRef: {
        carrierResourceId: 'carrier-1'
      }
    })
    const queried = await queryController.getToolingCurrentPlacement({
      ...buildQueryContext(),
      toolingType: ProtoToolingType.TOOLING_TYPE_MOLD,
      toolingId: 'mold-1'
    })

    expect(moveTooling).toHaveBeenCalledWith(
      expect.objectContaining({
        toCarrierResourceRef: expect.objectContaining({ carrierResourceId: 'carrier-1' })
      })
    )
    expect(moved.placement?.placementType).toBe(ProtoToolingPlacementType.TOOLING_PLACEMENT_TYPE_CARRIER_RESOURCE)
    expect(queried.placement?.carrierResourceRef?.carrierResourceId).toBe('carrier-1')
  })

  it('RecordMoldUsage / should preserve ProductionSpec and trace subject refs', async () => {
    const recordMoldUsage = jest.fn().mockResolvedValue({
      moldUsageRecord: {
        moldUsageRecordId: 'usage-1',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        productionMoldId: 'mold-1',
        toolingInstallationId: 'install-1',
        workCenterRef: {
          workCenterId: 'wc-1'
        },
        workUnitRef: null,
        usedAt: '2026-05-05T10:00:00.000Z',
        usageQuantity: '1',
        lifeDelta: '1',
        lifeUnit: 'CASTING_CYCLE',
        productionSpecRef: {
          productionSpecId: 'spec-1'
        },
        productionUnitRef: null,
        traceSubjectRef: {
          traceSubjectId: 'trace-subject-1'
        },
        operatorRef: {
          operatorId: 'operator-1'
        },
        captureSource: 'manual',
        auditRef: {
          auditId: 'audit-1',
          commandId: 'cmd-1',
          reason: 'test'
        },
        moldDesignOutputId: 'output-1',
        moldDesignOutputOptionId: 'option-1'
      },
      moldLifeCounter: {
        moldLifeCounterId: 'life-1',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        productionMoldId: 'mold-1',
        lifeUnit: 'CASTING_CYCLE',
        usedValue: '1',
        limitValue: '1000',
        warningThresholdValue: null,
        lastUsageRecordId: 'usage-1',
        lastAdjustedAt: null,
        lastAdjustedByRef: null,
        adjustmentReason: null,
        updatedAt: '2026-05-05T10:00:00.000Z'
      }
    })
    const controller = new MesManagementGrpcController(
      {
        recordMoldUsage
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.recordMoldUsage({
      ...buildManagementContext(),
      productionMoldId: 'mold-1',
      toolingInstallationId: 'install-1',
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      usageQuantity: '1',
      lifeUnit: 'CASTING_CYCLE',
      productionSpecRef: {
        productionSpecId: 'spec-1'
      },
      traceSubjectRef: {
        traceSubjectId: 'trace-subject-1'
      },
      moldDesignOutputId: 'output-1',
      moldDesignOutputOptionId: 'option-1'
    })

    expect(recordMoldUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        productionMoldId: 'mold-1',
        productionSpecRef: expect.objectContaining({ productionSpecId: 'spec-1' }),
        traceSubjectRef: expect.objectContaining({ traceSubjectId: 'trace-subject-1' })
      })
    )
    expect(response.moldUsageRecord?.moldDesignOutputOptionId).toBe('option-1')
  })

  it('RecordMoldUsageBatch / should forward one transactional WorkCenter usage batch', async () => {
    const recordMoldUsageBatch = jest.fn().mockResolvedValue({
      moldUsageRecords: [
        {
          moldUsageRecordId: 'usage-1',
          tenantId: 'tenant-1',
          orgId: 'org-1',
          productionMoldId: 'mold-1',
          toolingInstallationId: 'install-1',
          workCenterRef: {
            workCenterId: 'wc-1'
          },
          workUnitRef: null,
          usedAt: '2026-05-05T10:00:00.000Z',
          usageQuantity: '3',
          lifeDelta: '3',
          lifeUnit: 'CASTING_CYCLE',
          productionSpecRef: null,
          productionUnitRef: null,
          traceSubjectRef: null,
          operatorRef: {
            operatorId: 'operator-1'
          },
          captureSource: 'web',
          auditRef: {
            auditId: 'audit-1',
            commandId: 'cmd-1',
            reason: 'test'
          },
          moldDesignOutputId: null,
          moldDesignOutputOptionId: null
        }
      ],
      moldLifeCounters: [
        {
          moldLifeCounterId: 'life-1',
          tenantId: 'tenant-1',
          orgId: 'org-1',
          productionMoldId: 'mold-1',
          lifeUnit: 'CASTING_CYCLE',
          usedValue: '3',
          limitValue: '1000',
          warningThresholdValue: null,
          lastUsageRecordId: 'usage-1',
          lastAdjustedAt: null,
          lastAdjustedByRef: null,
          adjustmentReason: null,
          updatedAt: '2026-05-05T10:00:00.000Z'
        }
      ]
    })
    const controller = new MesManagementGrpcController(
      {
        recordMoldUsageBatch
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.recordMoldUsageBatch({
      ...buildManagementContext(),
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      usedAt: '2026-05-05T10:00:00.000Z',
      lifeUnit: 'CASTING_CYCLE',
      captureSource: 'web',
      lines: [
        {
          isSubmitted: true,
          productionMoldId: 'mold-1',
          toolingInstallationId: 'install-1',
          usageQuantity: '3'
        },
        {
          isSubmitted: false,
          productionMoldId: 'mold-2',
          toolingInstallationId: 'install-2',
          usageQuantity: ''
        }
      ]
    })

    expect(recordMoldUsageBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        workCenterRef: expect.objectContaining({ workCenterId: 'wc-1' }),
        lines: [
          expect.objectContaining({
            isSubmitted: true,
            productionMoldId: 'mold-1',
            toolingInstallationId: 'install-1',
            usageQuantity: '3'
          }),
          expect.objectContaining({ isSubmitted: false })
        ]
      })
    )
    expect(response.moldUsageRecords?.[0]?.lifeDelta).toBe('3')
  })

  it('MarkProductionMoldForScrap / should expose the two-step scrap command', async () => {
    const markProductionMoldForScrap = jest.fn().mockResolvedValue({
      productionMold: {
        ...productionMoldRecord(),
        currentStatus: 'SCRAP_PENDING',
        currentInstallationSummary: toolingInstallationRecord()
      }
    })
    const controller = new MesManagementGrpcController(
      {
        markProductionMoldForScrap
      } as never,
      createRequestContextStore() as never
    )

    const response = await controller.markProductionMoldForScrap({
      ...buildManagementContext(),
      productionMoldId: 'mold-1',
      markedAt: '2026-05-05T11:00:00.000Z'
    })

    expect(markProductionMoldForScrap).toHaveBeenCalledWith(
      expect.objectContaining({
        productionMoldId: 'mold-1',
        markedAt: '2026-05-05T11:00:00.000Z'
      })
    )
    expect(response.productionMold?.currentStatus).toBe(ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_SCRAP_PENDING)
  })

  it('ListProductionMolds / should expose the tenant-wide production mold directory', async () => {
    const listProductionMolds = jest.fn().mockResolvedValue({
      productionMolds: [
        {
          productionMoldId: 'mold-1',
          moldCode: 'PM-001',
          moldDesignSummary: {
            moldDesignId: 'design-1',
            designCode: 'WB-A100',
            name: 'Wash Basin A100',
            revisionCode: 'R1',
            status: 'ACTIVE'
          },
          currentStatus: 'INSTALLED',
          currentPlacementSummary: {
            placementType: 'WORK_CENTER',
            workCenterRef: {
              workCenterId: 'wc-1'
            },
            toolingInstallationId: 'install-1'
          },
          lifeCounterSummary: null
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    const controller = new MesQueryGrpcController({
      listProductionMolds
    } as never)

    const response = await controller.listProductionMolds({
      ...buildQueryContext(),
      status: ProtoProductionMoldStatus.PRODUCTION_MOLD_STATUS_INSTALLED,
      page: 1,
      pageSize: 20
    })

    expect(listProductionMolds).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'INSTALLED',
        page: 1,
        pageSize: 20
      })
    )
    expect(response.productionMolds?.[0]?.productionMoldId).toBe('mold-1')
  })
})
