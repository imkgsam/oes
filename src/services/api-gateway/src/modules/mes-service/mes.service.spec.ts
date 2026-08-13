import { ForbiddenException } from '@nestjs/common'
import {
  MasterMoldStatus,
  MoldWarningLevel,
  ProductionMoldStatus,
  ProductionSpecStatus,
  ToolingType
} from '@oes/common/generated/mes_service'
import { MesService } from './mes.service'

// Verifies the MES gateway service preserves tenant scope and only maps current BFF payloads into frozen MES gRPC contracts.
describe('MesService', () => {
  const mesQueryAdapter = {
    getProductionSpec: jest.fn(),
    listProductionSpecs: jest.fn(),
    resolveProductionSpecsForMold: jest.fn(),
    getMoldDesign: jest.fn(),
    getMasterMold: jest.fn(),
    listMoldDesigns: jest.fn(),
    listMasterMolds: jest.fn(),
    getProductionMold: jest.fn(),
    listProductionMolds: jest.fn(),
    listProductionMoldsByDesign: jest.fn(),
    getToolingCurrentPlacement: jest.fn(),
    getMoldUsageHistory: jest.fn(),
    listCurrentMoldsByWorkCenter: jest.fn(),
    listMoldLifeCounters: jest.fn(),
  }
  const mesManagementAdapter = {
    createProductionSpec: jest.fn(),
    activateProductionSpec: jest.fn(),
    retireProductionSpec: jest.fn(),
    updateProductionSpec: jest.fn(),
    registerMoldDesign: jest.fn(),
    registerMasterMold: jest.fn(),
    registerProductionMold: jest.fn(),
    acceptProductionMold: jest.fn(),
    confirmProductionMoldArrival: jest.fn(),
    moveTooling: jest.fn(),
    installTooling: jest.fn(),
    confirmInstalledMoldReady: jest.fn(),
    markInstalledMoldMaintenance: jest.fn(),
    unmountTooling: jest.fn(),
    recordMoldUsageBatch: jest.fn(),
    adjustMoldLifeCounter: jest.fn(),
    markProductionMoldForScrap: jest.fn()
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
      service.listProductionSpecs('tenant-2', { page: 1, pageSize: 20 }, source as any)
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(mesQueryAdapter.listProductionSpecs).not.toHaveBeenCalled()
  })

  it.each([
    ['getProductionSpec', () => service.getProductionSpec('tenant-2', 'spec-1', buildSource('cross-get-spec') as any)],
    ['createProductionSpec', () => service.createProductionSpec('tenant-2', {}, buildSource('cross-create-spec') as any)],
    ['activateProductionSpec', () => service.activateProductionSpec('tenant-2', 'spec-1', {}, buildSource('cross-activate-spec') as any)],
    ['updateProductionSpec', () => service.updateProductionSpec('tenant-2', 'spec-1', {}, buildSource('cross-update-spec') as any)],
    ['retireProductionSpec', () => service.retireProductionSpec('tenant-2', 'spec-1', {}, buildSource('cross-retire-spec') as any)],
    ['listMoldDesigns', () => service.listMoldDesigns('tenant-2', {}, buildSource('cross-list-designs') as any)],
    ['getMoldDesign', () => service.getMoldDesign('tenant-2', 'design-1', buildSource('cross-get-design') as any)],
    ['registerMoldDesign', () => service.registerMoldDesign('tenant-2', {}, buildSource('cross-register-design') as any)],
    ['registerMasterMold', () => service.registerMasterMold('tenant-2', {}, buildSource('cross-register-master') as any)],
    ['listMasterMolds', () => service.listMasterMolds('tenant-2', {}, buildSource('cross-list-master') as any)],
    ['getMasterMold', () => service.getMasterMold('tenant-2', 'master-1', buildSource('cross-get-master') as any)],
    ['registerProductionMold', () => service.registerProductionMold('tenant-2', {}, buildSource('cross-register-mold') as any)],
    ['acceptProductionMold', () => service.acceptProductionMold('tenant-2', 'mold-1', {}, buildSource('cross-accept-mold') as any)],
    ['confirmProductionMoldArrival', () => service.confirmProductionMoldArrival('tenant-2', 'mold-1', {}, buildSource('cross-arrival') as any)],
    ['getProductionMold', () => service.getProductionMold('tenant-2', 'mold-1', buildSource('cross-get-mold') as any)],
    ['listProductionMolds', () => service.listProductionMolds('tenant-2', {}, buildSource('cross-list-molds') as any)],
    ['listProductionMoldsByDesign', () => service.listProductionMoldsByDesign('tenant-2', 'design-1', {}, buildSource('cross-list-by-design') as any)],
    ['moveTooling', () => service.moveTooling('tenant-2', 'mold-1', {}, buildSource('cross-move') as any)],
    ['getToolingCurrentPlacement', () => service.getToolingCurrentPlacement('tenant-2', 'mold-1', {}, buildSource('cross-placement') as any)],
    ['installTooling', () => service.installTooling('tenant-2', 'mold-1', {}, buildSource('cross-install') as any)],
    ['unmountTooling', () => service.unmountTooling('tenant-2', 'install-1', {}, buildSource('cross-unmount') as any)],
    ['confirmInstalledMoldReady', () => service.confirmInstalledMoldReady('tenant-2', 'mold-1', { toolingInstallationId: 'install-1' }, buildSource('cross-ready') as any)],
    ['markInstalledMoldMaintenance', () => service.markInstalledMoldMaintenance('tenant-2', 'mold-1', { toolingInstallationId: 'install-1', reason: 'repair' }, buildSource('cross-maintenance') as any)],
    ['markProductionMoldForScrap', () => service.markProductionMoldForScrap('tenant-2', 'mold-1', {}, buildSource('cross-scrap') as any)],
    ['listCurrentMoldsByWorkCenter', () => service.listCurrentMoldsByWorkCenter('tenant-2', 'wc-1', {}, buildSource('cross-current') as any)],
    ['listMoldLifeCounters', () => service.listMoldLifeCounters('tenant-2', {}, buildSource('cross-life') as any)],
    ['getMoldUsageHistory', () => service.getMoldUsageHistory('tenant-2', 'mold-1', {}, buildSource('cross-history') as any)],
    ['printDailyMoldChecklist', () => service.printDailyMoldChecklist('tenant-2', { checklistDate: '2026-05-05', workCenterId: 'wc-1' }, buildSource('cross-checklist') as any)],
    ['recordDailyMoldUsageBatch', () => service.recordDailyMoldUsageBatch('tenant-2', '2026-05-05', { batchCommandId: 'batch-1' }, buildSource('cross-batch') as any)]
  ])('%s rejects cross-tenant requests before adapter calls', async (_method, invoke) => {
    await expect(invoke()).rejects.toBeInstanceOf(ForbiddenException)
    expect([...Object.values(mesQueryAdapter), ...Object.values(mesManagementAdapter)].every((mock) => !(mock as jest.Mock).mock.calls.length)).toBe(true)
  })

  it('maps ProductionSpec list filters into the frozen MES query contract', async () => {
    const source = buildSource('req-spec-list')
    mesQueryAdapter.listProductionSpecs.mockResolvedValue({
      productionSpecs: [{ productionSpecId: 'spec-1', specCode: 'SPEC-001' }],
      page: 1,
      pageSize: 20,
      total: 1
    })

    await service.listProductionSpecs(
      'tenant-1',
      { itemId: 'item-1', keyword: 'spec', page: 1, pageSize: 20, status: 'ACTIVE' },
      source as any
    )

    expect(mesQueryAdapter.listProductionSpecs).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'item-1',
        keyword: 'spec',
        page: 1,
        pageSize: 20,
        status: ProductionSpecStatus.PRODUCTION_SPEC_STATUS_ACTIVE,
      }),
      source
    )
  })

  it('forwards ProductionSpec update and retire commands through MES management', async () => {
    const source = buildSource('req-spec-write')
    mesManagementAdapter.updateProductionSpec.mockResolvedValue({
      productionSpec: { productionSpecId: 'spec-1', version: 2 }
    })
    mesManagementAdapter.retireProductionSpec.mockResolvedValue({
      productionSpec: { productionSpecId: 'spec-1', status: 'RETIRED' }
    })

    await service.updateProductionSpec('tenant-1', 'spec-1', { expectedVersion: 1, name: 'Spec A2' }, source as any)
    await service.retireProductionSpec(
      'tenant-1',
      'spec-1',
      { expectedVersion: 2, replacementProductionSpecId: 'spec-2' },
      source as any
    )

    expect(mesManagementAdapter.updateProductionSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'req-spec-write',
        expectedVersion: 1,
        productionSpecId: 'spec-1',
      }),
      source
    )
    expect(mesManagementAdapter.retireProductionSpec).toHaveBeenCalledWith(
      expect.objectContaining({
        replacementProductionSpecId: 'spec-2',
        productionSpecId: 'spec-1'
      }),
      source
    )
  })

  it('lists ProductionMolds with current status and warning filters', async () => {
    const source = buildSource('req-list-molds')
    mesQueryAdapter.listProductionMolds.mockResolvedValue({
      productionMolds: [{ productionMoldId: 'mold-1' }],
      page: 1,
      pageSize: 20,
      total: 1
    })

    await service.listProductionMolds(
      'tenant-1',
      { status: 'READY', warningLevel: 'INFO', moldDesignId: 'design-1' },
      source as any
    )

    expect(mesQueryAdapter.listProductionMolds).toHaveBeenCalledWith(
      expect.objectContaining({
        moldDesignId: 'design-1',
        status: ProductionMoldStatus.PRODUCTION_MOLD_STATUS_READY,
        warningLevel: MoldWarningLevel.MOLD_WARNING_LEVEL_INFO
      }),
      source
    )
  })

  it('lists MasterMolds with current status filters', async () => {
    const source = buildSource('req-list-master-molds')
    mesQueryAdapter.listMasterMolds.mockResolvedValue({
      masterMolds: [{ masterMoldId: 'master-1' }],
      page: 1,
      pageSize: 20,
      total: 1
    })

    await service.listMasterMolds(
      'tenant-1',
      { status: 'AVAILABLE', moldDesignId: 'design-1' },
      source as any
    )

    expect(mesQueryAdapter.listMasterMolds).toHaveBeenCalledWith(
      expect.objectContaining({
        moldDesignId: 'design-1',
        status: MasterMoldStatus.MASTER_MOLD_STATUS_AVAILABLE,
      }),
      source
    )
  })

  it('maps tooling placement and installation commands to current Tooling contract names', async () => {
    const source = buildSource('req-tooling')
    mesManagementAdapter.moveTooling.mockResolvedValue({ placement: { toolingInstallationId: 'install-1' } })
    mesManagementAdapter.installTooling.mockResolvedValue({ toolingInstallation: { toolingInstallationId: 'install-1' } })

    await service.moveTooling(
      'tenant-1',
      'mold-1',
      { toCarrierResourceRef: { carrierResourceId: 'carrier-1' } },
      source as any
    )
    await service.installTooling(
      'tenant-1',
      'mold-1',
      { workCenterRef: { workCenterId: 'wc-1' }, moldPositionIndex: 1 },
      source as any
    )

    expect(mesManagementAdapter.moveTooling).toHaveBeenCalledWith(
      expect.objectContaining({
        toolingId: 'mold-1',
        toolingType: ToolingType.TOOLING_TYPE_MOLD,
        toCarrierResourceRef: { carrierResourceId: 'carrier-1' }
      }),
      source
    )
    expect(mesManagementAdapter.installTooling).toHaveBeenCalledWith(
      expect.objectContaining({
        moldPositionIndex: 1,
        toolingId: 'mold-1',
        workCenterRef: { workCenterId: 'wc-1' }
      }),
      source
    )
  })

  it('maps arrival, ready, and maintenance production mold field commands', async () => {
    const source = buildSource('req-mold-state')
    mesManagementAdapter.confirmProductionMoldArrival.mockResolvedValue({ productionMold: { productionMoldId: 'mold-1' } })
    mesManagementAdapter.confirmInstalledMoldReady.mockResolvedValue({ productionMold: { productionMoldId: 'mold-1' } })
    mesManagementAdapter.markInstalledMoldMaintenance.mockResolvedValue({ productionMold: { productionMoldId: 'mold-1' } })

    await service.confirmProductionMoldArrival(
      'tenant-1',
      'mold-1',
      { arrivedAt: '2026-05-05T08:00:00.000Z' },
      source as any
    )
    await service.confirmInstalledMoldReady(
      'tenant-1',
      'mold-1',
      { toolingInstallationId: 'install-1', readyAt: '2026-05-05T09:00:00.000Z' },
      source as any
    )
    await service.markInstalledMoldMaintenance(
      'tenant-1',
      'mold-1',
      { toolingInstallationId: 'install-1', reason: 'repair required' },
      source as any
    )

    expect(mesManagementAdapter.confirmProductionMoldArrival).toHaveBeenCalledWith(
      expect.objectContaining({
        arrivedAt: '2026-05-05T08:00:00.000Z',
        productionMoldId: 'mold-1'
      }),
      source
    )
    expect(mesManagementAdapter.confirmInstalledMoldReady).toHaveBeenCalledWith(
      expect.objectContaining({
        productionMoldId: 'mold-1',
        readyAt: '2026-05-05T09:00:00.000Z',
        toolingInstallationId: 'install-1'
      }),
      source
    )
    expect(mesManagementAdapter.markInstalledMoldMaintenance).toHaveBeenCalledWith(
      expect.objectContaining({
        productionMoldId: 'mold-1',
        reason: 'repair required',
        toolingInstallationId: 'install-1'
      }),
      source
    )
  })

  it('records one checkbox batch as a single MES RecordMoldUsageBatch command', async () => {
    const source = buildSource('req-batch')
    mesManagementAdapter.recordMoldUsageBatch.mockResolvedValueOnce({
      moldLifeCounters: [{ productionMoldId: 'mold-1', usedValue: '11' }],
      moldUsageRecords: [{ moldUsageRecordId: 'usage-1', productionMoldId: 'mold-1' }]
    })

    const result = await service.recordDailyMoldUsageBatch(
      'tenant-1',
      '2026-05-05',
      {
        batchCommandId: 'batch-1',
        items: [
          {
            checked: true,
            productionMoldId: 'mold-1',
            toolingInstallationId: 'install-1',
            usageQuantity: '1'
          },
          {
            checked: false,
            productionMoldId: 'mold-2',
            toolingInstallationId: 'install-2'
          }
        ],
        workCenterRef: { workCenterId: 'wc-1' }
      },
      source as any
    )

    expect(result).toEqual({
      acceptedItems: [
        {
          moldLifeCounter: { productionMoldId: 'mold-1', usedValue: '11' },
          productionMoldId: 'mold-1',
          usageRecordId: 'usage-1'
        }
      ],
      checklistDate: '2026-05-05',
      skippedItems: [{ productionMoldId: 'mold-2', reason: 'unchecked' }],
      workCenterRef: { workCenterId: 'wc-1' }
    })
    expect(mesManagementAdapter.recordMoldUsageBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: 'batch-1',
        lifeUnit: 'CASTING_CYCLE',
        lines: [
          expect.objectContaining({
            isSubmitted: true,
            productionMoldId: 'mold-1',
            toolingInstallationId: 'install-1',
            usageQuantity: '1'
          }),
          expect.objectContaining({
            isSubmitted: false,
            productionMoldId: 'mold-2',
            toolingInstallationId: 'install-2'
          })
        ],
        workCenterRef: { workCenterId: 'wc-1' }
      }),
      source
    )
  })

  it('builds daily checklist rows from current molds instead of a MES checklist RPC', async () => {
    const source = buildSource('req-checklist')
    mesQueryAdapter.listCurrentMoldsByWorkCenter.mockResolvedValue({
      items: [
        {
          productionMold: { productionMoldId: 'mold-1' },
          toolingInstallation: { toolingInstallationId: 'install-1' },
          usageAllowed: false,
          usageDisabledReason: 'SCRAP_PENDING'
        }
      ]
    })

    const result = await service.printDailyMoldChecklist(
      'tenant-1',
      { checklistDate: '2026-05-05', workCenterId: 'wc-1' },
      source as any
    )

    expect(mesQueryAdapter.listCurrentMoldsByWorkCenter).toHaveBeenCalledWith(
      expect.objectContaining({
        workCenterId: 'wc-1'
      }),
      source
    )
    expect(result.items[0]).toEqual(expect.objectContaining({ usageAllowed: false }))
  })
})

/** buildSource creates one tenant-scoped downstream source for BFF service tests. */
function buildSource(requestId: string) {
  return {
    requestId,
    traceId: `trace-${requestId}`,
    user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
  }
}
