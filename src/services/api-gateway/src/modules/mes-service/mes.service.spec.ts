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
    moveTooling: jest.fn(),
    installTooling: jest.fn(),
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
        orgId: 'org-1',
        page: 1,
        pageSize: 20,
        status: ProductionSpecStatus.PRODUCTION_SPEC_STATUS_ACTIVE,
        tenantId: 'tenant-1'
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
        tenantId: 'tenant-1'
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
      { status: 'INSTALLED', warningLevel: 'INFO', moldDesignId: 'design-1' },
      source as any
    )

    expect(mesQueryAdapter.listProductionMolds).toHaveBeenCalledWith(
      expect.objectContaining({
        moldDesignId: 'design-1',
        status: ProductionMoldStatus.PRODUCTION_MOLD_STATUS_INSTALLED,
        tenantId: 'tenant-1',
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
        tenantId: 'tenant-1'
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
      { workCenterRef: { workCenterId: 'wc-1' }, moldPosition: 'A1' },
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
        moldPosition: 'A1',
        toolingId: 'mold-1',
        workCenterRef: { workCenterId: 'wc-1' }
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
        tenantId: 'tenant-1',
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
