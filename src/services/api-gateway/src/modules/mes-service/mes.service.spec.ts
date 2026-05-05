import { ForbiddenException } from '@nestjs/common'
import {
  ManufacturingSpecStatus,
  MoldUsageMode,
  MoldWarningLevel,
  ProductionMoldInstanceStatus
} from '@oes/common/generated/mes_service'
import { MesService } from './mes.service'

// Verifies the MES gateway service preserves tenant scope and only orchestrates the web-stage mold loop over frozen MES gRPC contracts.
describe('MesService', () => {
  const mesQueryAdapter = {
    getManufacturingSpec: jest.fn(),
    listManufacturingSpecs: jest.fn(),
    resolveManufacturingSpecsForMold: jest.fn(),
    getMoldDesign: jest.fn(),
    listMoldDesigns: jest.fn(),
    getProductionMoldInstance: jest.fn(),
    listProductionMoldInstances: jest.fn(),
    listMoldInstancesByDesign: jest.fn(),
    listWorkCenters: jest.fn(),
    listCurrentMoldsByWorkCenter: jest.fn(),
    listMoldLifeWarnings: jest.fn(),
    printDailyMoldChecklist: jest.fn()
  }
  const mesManagementAdapter = {
    createManufacturingSpec: jest.fn(),
    activateManufacturingSpec: jest.fn(),
    retireManufacturingSpec: jest.fn(),
    updateManufacturingSpec: jest.fn(),
    createWorkCenter: jest.fn(),
    deactivateWorkCenter: jest.fn(),
    registerMoldDesign: jest.fn(),
    registerProductionMoldInstance: jest.fn(),
    moveMold: jest.fn(),
    installMold: jest.fn(),
    unmountMold: jest.fn(),
    recordMoldUsage: jest.fn(),
    scrapMold: jest.fn()
  }
  const service = new MesService(mesQueryAdapter as any, mesManagementAdapter as any)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant MES workspace', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.listManufacturingSpecs('tenant-2', { page: 1, pageSize: 20 }, source as any)
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(mesQueryAdapter.listManufacturingSpecs).not.toHaveBeenCalled()
  })

  it('maps ManufacturingSpec list filters into the frozen MES query contract', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }
    mesQueryAdapter.listManufacturingSpecs.mockResolvedValue({
      manufacturingSpecs: [{ manufacturingSpecId: 'spec-1', specCode: 'SPEC-001' }],
      page: 1,
      pageSize: 20,
      total: 1
    })

    await expect(
      service.listManufacturingSpecs(
        'tenant-1',
        {
          itemId: 'item-1',
          keyword: 'spec',
          page: 1,
          pageSize: 20,
          status: 'ACTIVE'
        },
        source as any
      )
    ).resolves.toEqual({
      manufacturingSpecs: [{ manufacturingSpecId: 'spec-1', specCode: 'SPEC-001' }],
      page: 1,
      pageSize: 20,
      total: 1
    })

    expect(mesQueryAdapter.listManufacturingSpecs).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'item-1',
        keyword: 'spec',
        orgId: 'org-1',
        page: 1,
        pageSize: 20,
        status: ManufacturingSpecStatus.MANUFACTURING_SPEC_STATUS_ACTIVE,
        tenantId: 'tenant-1'
      }),
      source
    )
  })

  it('records one checkbox batch as idempotent manual checklist usage commands', async () => {
    const source = {
      requestId: 'req-batch',
      traceId: 'trace-batch',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }
    mesManagementAdapter.recordMoldUsage
      .mockResolvedValueOnce({
        moldLifeCounter: { productionMoldInstanceId: 'mold-1', usedValue: '11' },
        usageEvent: { moldUsageEventId: 'usage-1' }
      })
      .mockResolvedValueOnce({
        moldLifeCounter: { productionMoldInstanceId: 'mold-3', usedValue: '7' },
        usageEvent: { moldUsageEventId: 'usage-3' }
      })

    const result = await service.recordDailyMoldUsageBatch(
      'tenant-1',
      '2026-05-05',
      {
        batchCommandId: 'batch-1',
        items: [
          {
            checked: true,
            lifeDelta: '1',
            lifeUnit: 'USE',
            moldInstallationId: 'install-1',
            moldDesignOutputId: 'output-body',
            moldDesignOutputOptionId: 'option-body-300',
            productionMoldInstanceId: 'mold-1',
            resourcePositionId: 'pos-1',
            usageQuantity: '1',
            workCenterId: 'wc-1'
          },
          {
            checked: false,
            moldInstallationId: 'install-2',
            productionMoldInstanceId: 'mold-2',
            resourcePositionId: 'pos-2',
            workCenterId: 'wc-1'
          },
          {
            checked: true,
            lifeDelta: '1',
            lifeUnit: 'USE',
            moldInstallationId: 'install-3',
            productionMoldInstanceId: 'mold-3',
            resourcePositionId: 'pos-3',
            usageQuantity: '1',
            workCenterId: 'wc-1'
          }
        ],
        reason: 'morning checklist',
        workCenterId: 'wc-1'
      },
      source as any
    )

    expect(result).toEqual({
      acceptedItems: [
        {
          moldLifeCounter: { productionMoldInstanceId: 'mold-1', usedValue: '11' },
          productionMoldInstanceId: 'mold-1',
          usageEventId: 'usage-1'
        },
        {
          moldLifeCounter: { productionMoldInstanceId: 'mold-3', usedValue: '7' },
          productionMoldInstanceId: 'mold-3',
          usageEventId: 'usage-3'
        }
      ],
      checklistDate: '2026-05-05',
      skippedItems: [{ productionMoldInstanceId: 'mold-2', reason: 'unchecked' }],
      workCenterId: 'wc-1'
    })
    expect(mesManagementAdapter.recordMoldUsage).toHaveBeenCalledTimes(2)
    expect(mesManagementAdapter.recordMoldUsage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        captureSource: 'WEB_CHECKLIST',
        commandId: 'batch-1:mold-1:install-1',
        lifeDelta: '1',
        lifeUnit: 'USE',
        moldDesignOutputId: 'output-body',
        moldDesignOutputOptionId: 'option-body-300',
        productionMoldInstanceId: 'mold-1',
        reason: 'morning checklist',
        tenantId: 'tenant-1',
        usageMode: MoldUsageMode.MOLD_USAGE_MODE_MANUAL_CHECKLIST,
        usageQuantity: '1',
        usedAt: '2026-05-05'
      }),
      source
    )
  })

  it('forwards ManufacturingSpec update and retire commands through MES management', async () => {
    const source = {
      requestId: 'req-spec-write',
      traceId: 'trace-spec-write',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }
    mesManagementAdapter.updateManufacturingSpec.mockResolvedValue({
      manufacturingSpec: { manufacturingSpecId: 'spec-1', version: 2 }
    })
    mesManagementAdapter.retireManufacturingSpec.mockResolvedValue({
      manufacturingSpec: { manufacturingSpecId: 'spec-1', status: 'RETIRED' }
    })

    await service.updateManufacturingSpec(
      'tenant-1',
      'spec-1',
      { expectedVersion: 1, name: 'Spec A2', reason: 'rename' },
      source as any
    )
    await service.retireManufacturingSpec(
      'tenant-1',
      'spec-1',
      { expectedVersion: 2, replacementSpecId: 'spec-2', reason: 'obsolete' },
      source as any
    )

    expect(mesManagementAdapter.updateManufacturingSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'req-spec-write',
        expectedVersion: 1,
        manufacturingSpecId: 'spec-1',
        name: 'Spec A2',
        orgId: 'org-1',
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(mesManagementAdapter.retireManufacturingSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'req-spec-write',
        expectedVersion: 2,
        manufacturingSpecId: 'spec-1',
        orgId: 'org-1',
        replacementSpecId: 'spec-2',
        tenantId: 'tenant-1'
      }),
      source
    )
  })

  it('lists production mold instances by design with status and warning filters', async () => {
    const source = {
      requestId: 'req-list-molds',
      traceId: 'trace-list-molds',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }
    mesQueryAdapter.listMoldInstancesByDesign.mockResolvedValue({
      instances: [{ productionMoldInstanceId: 'mold-1' }],
      page: 1,
      pageSize: 20,
      total: 1
    })

    await service.listProductionMoldInstancesByDesign(
      'tenant-1',
      'design-1',
      { status: 'PENDING_INSTALLATION', warningLevel: 'INFO' },
      source as any
    )

    expect(mesQueryAdapter.listMoldInstancesByDesign).toHaveBeenCalledWith(
      expect.objectContaining({
        moldDesignId: 'design-1',
        orgId: 'org-1',
        page: 1,
        pageSize: 20,
        status: ProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_INSTALLATION,
        tenantId: 'tenant-1',
        warningLevel: MoldWarningLevel.MOLD_WARNING_LEVEL_INFO
      }),
      source
    )
  })

  it('lists tenant-wide production mold instances for the mold workspace directory', async () => {
    const source = {
      requestId: 'req-list-all-molds',
      traceId: 'trace-list-all-molds',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }
    mesQueryAdapter.listProductionMoldInstances.mockResolvedValue({
      instances: [{ productionMoldInstanceId: 'mold-1' }],
      page: 1,
      pageSize: 20,
      total: 1
    })

    await service.listProductionMoldInstances(
      'tenant-1',
      { status: 'INSTALLED', warningLevel: 'INFO', moldDesignId: 'design-1' },
      source as any
    )

    expect(mesQueryAdapter.listProductionMoldInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        moldDesignId: 'design-1',
        orgId: 'org-1',
        page: 1,
        pageSize: 20,
        status: ProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_INSTALLED,
        tenantId: 'tenant-1',
        warningLevel: MoldWarningLevel.MOLD_WARNING_LEVEL_INFO
      }),
      source
    )
  })

  it('creates, lists, and deactivates work centers through the MES BFF surface', async () => {
    const source = {
      requestId: 'req-work-center',
      traceId: 'trace-work-center',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }
    mesManagementAdapter.createWorkCenter.mockResolvedValue({
      workCenterSummary: { workCenterId: 'wc-1', workCenterCode: 'LINE-LT-01' }
    })
    mesQueryAdapter.listWorkCenters.mockResolvedValue({
      workCenters: [{ workCenterId: 'wc-1', workCenterCode: 'LINE-LT-01' }],
      page: 1,
      pageSize: 20,
      total: 1
    })
    mesManagementAdapter.deactivateWorkCenter.mockResolvedValue({
      workCenterSummary: { workCenterId: 'wc-1', status: 'INACTIVE' }
    })

    await service.createWorkCenter(
      'tenant-1',
      { commandId: 'cmd-create-wc', workCenterCode: 'LINE-LT-01', name: '连体马桶上线一线', workCenterType: 'CASTING_LINE' },
      source as any
    )
    await service.listWorkCenters('tenant-1', { keyword: '连体', status: 'ACTIVE' }, source as any)
    await service.deactivateWorkCenter(
      'tenant-1',
      'wc-1',
      { commandId: 'cmd-deactivate-wc', reason: 'retire line' },
      source as any
    )

    expect(mesManagementAdapter.createWorkCenter).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'cmd-create-wc',
        orgId: 'org-1',
        tenantId: 'tenant-1',
        workCenterCode: 'LINE-LT-01',
        workCenterType: 'CASTING_LINE'
      }),
      source
    )
    expect(mesQueryAdapter.listWorkCenters).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: '连体',
        orgId: 'org-1',
        status: 'ACTIVE',
        tenantId: 'tenant-1'
      }),
      source
    )
    expect(mesManagementAdapter.deactivateWorkCenter).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'cmd-deactivate-wc',
        tenantId: 'tenant-1',
        workCenterId: 'wc-1'
      }),
      source
    )
  })

  it('forwards production mold movement, installation, and unmount commands through MES management', async () => {
    const source = {
      requestId: 'req-move',
      traceId: 'trace-move',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }
    mesManagementAdapter.moveMold.mockResolvedValue({
      movementEvent: { moldMovementEventId: 'move-1' }
    })
    mesManagementAdapter.installMold.mockResolvedValue({
      moldInstallation: { moldInstallationId: 'install-1' }
    })
    mesManagementAdapter.unmountMold.mockResolvedValue({
      moldInstallation: { moldInstallationId: 'install-1', installationStatus: 2 }
    })

    await service.moveProductionMoldInstance(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-move', toMesLocationId: 'loc-ready' },
      source as any
    )
    await service.installProductionMoldInstance(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-install', resourcePositionId: 'pos-1', workCenterId: 'wc-1' },
      source as any
    )
    await service.unmountProductionMoldInstance(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-unmount', moldInstallationId: 'install-1', nextStatus: 'PENDING_INSTALLATION' },
      source as any
    )

    expect(mesManagementAdapter.moveMold).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'cmd-move',
        moldResourceId: 'mold-1',
        moldResourceType: 2,
        tenantId: 'tenant-1',
        toMesLocationId: 'loc-ready'
      }),
      source
    )
    expect(mesManagementAdapter.installMold).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'cmd-install',
        productionMoldInstanceId: 'mold-1',
        resourcePositionId: 'pos-1',
        tenantId: 'tenant-1',
        workCenterId: 'wc-1'
      }),
      source
    )
    expect(mesManagementAdapter.unmountMold).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'cmd-unmount',
        moldInstallationId: 'install-1',
        nextStatus: ProductionMoldInstanceStatus.PRODUCTION_MOLD_INSTANCE_STATUS_PENDING_INSTALLATION,
        productionMoldInstanceId: 'mold-1',
        tenantId: 'tenant-1'
      }),
      source
    )
  })

  it('forwards production mold scrap as a production-mold resource command', async () => {
    const source = {
      requestId: 'req-scrap',
      traceId: 'trace-scrap',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }
    mesManagementAdapter.scrapMold.mockResolvedValue({
      moldResource: { moldResourceId: 'mold-1' }
    })

    await service.scrapProductionMoldInstance(
      'tenant-1',
      'mold-1',
      { closeCurrentInstallation: true, commandId: 'cmd-scrap', scrapReason: 'broken' },
      source as any
    )

    expect(mesManagementAdapter.scrapMold).toHaveBeenCalledWith(
      expect.objectContaining({
        closeCurrentInstallation: true,
        commandId: 'cmd-scrap',
        moldResourceId: 'mold-1',
        moldResourceType: 2,
        orgId: 'org-1',
        scrapReason: 'broken',
        tenantId: 'tenant-1'
      }),
      source
    )
  })
})
