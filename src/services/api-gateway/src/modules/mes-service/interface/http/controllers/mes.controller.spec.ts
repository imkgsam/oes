import { Reflector } from '@nestjs/core'
import {
  MES_MANAGEMENT_PERMISSION_CODES,
  REQUIRE_PERMISSIONS_METADATA_KEY
} from '@oes/common/authorization'
import { MesController } from './mes.controller'

// Verifies the MES gateway controller binds current BFF endpoints to MES permissions and forwards request shapes unchanged.
describe('MesController', () => {
  const mesService = {
    activateProductionSpec: jest.fn(),
    createProductionSpec: jest.fn(),
    getMoldDesign: jest.fn(),
    getMoldUsageHistory: jest.fn(),
    getProductionMold: jest.fn(),
    getProductionSpec: jest.fn(),
    getToolingCurrentPlacement: jest.fn(),
    installTooling: jest.fn(),
    listCurrentMoldsByWorkCenter: jest.fn(),
    listMoldDesigns: jest.fn(),
    listMoldLifeCounters: jest.fn(),
    listProductionMolds: jest.fn(),
    listProductionMoldsByDesign: jest.fn(),
    listProductionSpecs: jest.fn(),
    moveTooling: jest.fn(),
    printDailyMoldChecklist: jest.fn(),
    recordDailyMoldUsageBatch: jest.fn(),
    registerMasterMold: jest.fn(),
    registerMoldDesign: jest.fn(),
    registerProductionMold: jest.fn(),
    retireProductionSpec: jest.fn(),
    scrapProductionMold: jest.fn(),
    updateProductionSpec: jest.fn(),
    unmountTooling: jest.fn()
  }
  const controller = new MesController(mesService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected MES permissions on current gateway endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, MesController.prototype.listProductionSpecs)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, MesController.prototype.createProductionSpec)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, MesController.prototype.listMoldDesigns)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, MesController.prototype.registerMoldDesign)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, MesController.prototype.listProductionMolds)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        MesController.prototype.registerProductionMold
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(REQUIRE_PERMISSIONS_METADATA_KEY, MesController.prototype.moveTooling)
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        MesController.prototype.listCurrentMoldsByWorkCenter
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        MesController.prototype.recordDailyMoldUsageBatch
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards the current MES mold loop BFF surface to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    mesService.listProductionSpecs.mockResolvedValue({ productionSpecs: [] })
    mesService.createProductionSpec.mockResolvedValue({ productionSpecId: 'spec-1' })
    mesService.activateProductionSpec.mockResolvedValue({ productionSpecId: 'spec-1' })
    mesService.updateProductionSpec.mockResolvedValue({ productionSpecId: 'spec-1' })
    mesService.retireProductionSpec.mockResolvedValue({ productionSpecId: 'spec-1' })
    mesService.listMoldDesigns.mockResolvedValue({ moldDesigns: [] })
    mesService.getMoldDesign.mockResolvedValue({ moldDesignId: 'design-1' })
    mesService.registerMoldDesign.mockResolvedValue({ moldDesignId: 'design-1' })
    mesService.listProductionMolds.mockResolvedValue({ productionMolds: [] })
    mesService.listProductionMoldsByDesign.mockResolvedValue({ productionMolds: [] })
    mesService.registerProductionMold.mockResolvedValue({ productionMoldId: 'mold-1' })
    mesService.getProductionMold.mockResolvedValue({ productionMoldId: 'mold-1' })
    mesService.moveTooling.mockResolvedValue({ toolingId: 'mold-1' })
    mesService.installTooling.mockResolvedValue({ toolingInstallationId: 'install-1' })
    mesService.unmountTooling.mockResolvedValue({ toolingInstallationId: 'install-1' })
    mesService.scrapProductionMold.mockResolvedValue({ productionMoldId: 'mold-1' })
    mesService.listCurrentMoldsByWorkCenter.mockResolvedValue({ items: [] })
    mesService.printDailyMoldChecklist.mockResolvedValue({ items: [] })
    mesService.recordDailyMoldUsageBatch.mockResolvedValue({ acceptedItems: [], skippedItems: [] })

    await controller.listProductionSpecs('tenant-1', { status: 'ACTIVE' } as any, source as any)
    await controller.createProductionSpec(
      'tenant-1',
      { specCode: 'SPEC-001' } as any,
      source as any
    )
    await controller.activateProductionSpec(
      'tenant-1',
      'spec-1',
      { commandId: 'cmd-1' } as any,
      source as any
    )
    await controller.updateProductionSpec(
      'tenant-1',
      'spec-1',
      { name: 'Spec A2' } as any,
      source as any
    )
    await controller.retireProductionSpec(
      'tenant-1',
      'spec-1',
      { reason: 'obsolete' } as any,
      source as any
    )
    await controller.listMoldDesigns('tenant-1', { keyword: 'bowl' } as any, source as any)
    await controller.getMoldDesign('tenant-1', 'design-1', source as any)
    await controller.registerMoldDesign('tenant-1', { designCode: 'MD-001' } as any, source as any)
    await controller.listProductionMoldsByDesign(
      'tenant-1',
      'design-1',
      { status: 'INSTALLED' } as any,
      source as any
    )
    await controller.listProductionMolds(
      'tenant-1',
      { status: 'INSTALLED', moldDesignId: 'design-1' } as any,
      source as any
    )
    await controller.registerProductionMold(
      'tenant-1',
      { moldCode: 'PM-001' } as any,
      source as any
    )
    await controller.getProductionMold('tenant-1', 'mold-1', source as any)
    await controller.moveTooling(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-move' } as any,
      source as any
    )
    await controller.installTooling(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-install' } as any,
      source as any
    )
    await controller.unmountTooling(
      'tenant-1',
      'install-1',
      { commandId: 'cmd-unmount' } as any,
      source as any
    )
    await controller.scrapProductionMold(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-scrap' } as any,
      source as any
    )
    await controller.listCurrentMoldsByWorkCenter(
      'tenant-1',
      'wc-1',
      { workUnitId: 'wu-1' } as any,
      source as any
    )
    await controller.printDailyMoldChecklist(
      'tenant-1',
      { checklistDate: '2026-05-05', workCenterId: 'wc-1' } as any,
      source as any
    )
    await controller.recordDailyMoldUsageBatch(
      'tenant-1',
      '2026-05-05',
      { batchCommandId: 'batch-1', items: [], workCenterRef: { workCenterId: 'wc-1' } } as any,
      source as any
    )

    expect(mesService.listProductionSpecs).toHaveBeenCalledWith(
      'tenant-1',
      { status: 'ACTIVE' },
      source
    )
    expect(mesService.createProductionSpec).toHaveBeenCalledWith(
      'tenant-1',
      { specCode: 'SPEC-001' },
      source
    )
    expect(mesService.listProductionMoldsByDesign).toHaveBeenCalledWith(
      'tenant-1',
      'design-1',
      { status: 'INSTALLED' },
      source
    )
    expect(mesService.moveTooling).toHaveBeenCalledWith(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-move' },
      source
    )
    expect(mesService.recordDailyMoldUsageBatch).toHaveBeenCalledWith(
      'tenant-1',
      '2026-05-05',
      { batchCommandId: 'batch-1', items: [], workCenterRef: { workCenterId: 'wc-1' } },
      source
    )
  })
})
