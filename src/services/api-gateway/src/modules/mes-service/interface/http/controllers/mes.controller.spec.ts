import { Reflector } from '@nestjs/core'
import { MES_MANAGEMENT_PERMISSION_CODES, PERMISSION_CHECK_KEY } from '@oes/common/authorization'
import { MesController } from './mes.controller'

// Verifies the MES gateway controller binds forming-workshop endpoints to the minimum MES permission codes and forwards request shapes unchanged.
describe('MesController', () => {
  const mesService = {
    activateManufacturingSpec: jest.fn(),
    createManufacturingSpec: jest.fn(),
    createWorkCenter: jest.fn(),
    deactivateWorkCenter: jest.fn(),
    getMoldDesign: jest.fn(),
    getProductionMoldInstance: jest.fn(),
    installProductionMoldInstance: jest.fn(),
    listCurrentMoldsByWorkCenter: jest.fn(),
    listManufacturingSpecs: jest.fn(),
    listMoldDesigns: jest.fn(),
    listProductionMoldInstances: jest.fn(),
    listProductionMoldInstancesByDesign: jest.fn(),
    listWorkCenters: jest.fn(),
    moveProductionMoldInstance: jest.fn(),
    printDailyMoldChecklist: jest.fn(),
    recordDailyMoldUsageBatch: jest.fn(),
    registerMoldDesign: jest.fn(),
    registerProductionMoldInstance: jest.fn(),
    retireManufacturingSpec: jest.fn(),
    scrapProductionMoldInstance: jest.fn(),
    updateManufacturingSpec: jest.fn(),
    unmountProductionMoldInstance: jest.fn()
  }
  const controller = new MesController(mesService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected MES permissions on the first-stage gateway endpoints', () => {
    const reflector = new Reflector()

    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.listManufacturingSpecs)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.READ_MANUFACTURING_SPEC],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.createManufacturingSpec)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.updateManufacturingSpec)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.retireManufacturingSpec)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MANUFACTURING_SPEC],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.listMoldDesigns)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.READ_MOLD_DESIGN],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.listWorkCenters)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.READ_WORK_CENTER_MOLD_STATUS],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.createWorkCenter)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.deactivateWorkCenter)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.registerMoldDesign)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_MOLD_DESIGN],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.getProductionMoldInstance)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.listProductionMoldInstancesByDesign)
    ).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.listProductionMoldInstances)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.READ_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(
      reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.registerProductionMoldInstance)
    ).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.moveProductionMoldInstance)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.installProductionMoldInstance)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.unmountProductionMoldInstance)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.scrapProductionMoldInstance)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.MANAGE_PRODUCTION_MOLD_INSTANCE],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.listCurrentMoldsByWorkCenter)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.READ_WORK_CENTER_MOLD_STATUS],
      type: 'ALL'
    })
    expect(reflector.get(PERMISSION_CHECK_KEY, MesController.prototype.recordDailyMoldUsageBatch)).toEqual({
      permissions: [MES_MANAGEMENT_PERMISSION_CODES.RECORD_MOLD_USAGE],
      type: 'ALL'
    })
  })

  it('forwards the minimum MES mold loop BFF surface to the proxy service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    mesService.listManufacturingSpecs.mockResolvedValue({ manufacturingSpecs: [] })
    mesService.createManufacturingSpec.mockResolvedValue({ manufacturingSpecId: 'spec-1' })
    mesService.createWorkCenter.mockResolvedValue({ workCenterId: 'wc-1' })
    mesService.deactivateWorkCenter.mockResolvedValue({ workCenterId: 'wc-1', status: 'INACTIVE' })
    mesService.activateManufacturingSpec.mockResolvedValue({ manufacturingSpecId: 'spec-1' })
    mesService.updateManufacturingSpec.mockResolvedValue({ manufacturingSpecId: 'spec-1' })
    mesService.retireManufacturingSpec.mockResolvedValue({ manufacturingSpecId: 'spec-1' })
    mesService.listMoldDesigns.mockResolvedValue({ moldDesigns: [] })
    mesService.listWorkCenters.mockResolvedValue({ workCenters: [] })
    mesService.getMoldDesign.mockResolvedValue({ moldDesignId: 'design-1' })
    mesService.registerMoldDesign.mockResolvedValue({ moldDesignId: 'design-1' })
    mesService.listProductionMoldInstances.mockResolvedValue({ instances: [] })
    mesService.listProductionMoldInstancesByDesign.mockResolvedValue({ instances: [] })
    mesService.registerProductionMoldInstance.mockResolvedValue({ productionMoldInstanceId: 'mold-1' })
    mesService.getProductionMoldInstance.mockResolvedValue({ productionMoldInstanceId: 'mold-1' })
    mesService.moveProductionMoldInstance.mockResolvedValue({ moldResourceId: 'mold-1' })
    mesService.installProductionMoldInstance.mockResolvedValue({ productionMoldInstanceId: 'mold-1' })
    mesService.unmountProductionMoldInstance.mockResolvedValue({ productionMoldInstanceId: 'mold-1' })
    mesService.scrapProductionMoldInstance.mockResolvedValue({ moldResourceId: 'mold-1' })
    mesService.listCurrentMoldsByWorkCenter.mockResolvedValue({ installedMolds: [] })
    mesService.printDailyMoldChecklist.mockResolvedValue({ workCenters: [] })
    mesService.recordDailyMoldUsageBatch.mockResolvedValue({ acceptedItems: [], skippedItems: [] })

    await controller.listManufacturingSpecs('tenant-1', { status: 'ACTIVE' } as any, source as any)
    await controller.createManufacturingSpec('tenant-1', { specCode: 'SPEC-001' } as any, source as any)
    await controller.activateManufacturingSpec('tenant-1', 'spec-1', { commandId: 'cmd-1' } as any, source as any)
    await controller.updateManufacturingSpec('tenant-1', 'spec-1', { name: 'Spec A2' } as any, source as any)
    await controller.retireManufacturingSpec('tenant-1', 'spec-1', { reason: 'obsolete' } as any, source as any)
    await controller.listWorkCenters('tenant-1', { keyword: '连体' } as any, source as any)
    await controller.createWorkCenter('tenant-1', { workCenterCode: 'LINE-LT-01' } as any, source as any)
    await controller.deactivateWorkCenter('tenant-1', 'wc-1', { reason: 'retire line' } as any, source as any)
    await controller.listMoldDesigns('tenant-1', { keyword: 'bowl' } as any, source as any)
    await controller.getMoldDesign('tenant-1', 'design-1', source as any)
    await controller.registerMoldDesign('tenant-1', { designCode: 'MD-001' } as any, source as any)
    await controller.listProductionMoldInstancesByDesign(
      'tenant-1',
      'design-1',
      { status: 'PENDING_INSTALLATION' } as any,
      source as any
    )
    await controller.listProductionMoldInstances(
      'tenant-1',
      { status: 'INSTALLED', moldDesignId: 'design-1' } as any,
      source as any
    )
    await controller.registerProductionMoldInstance('tenant-1', { moldInstanceCode: 'PM-001' } as any, source as any)
    await controller.getProductionMoldInstance('tenant-1', 'mold-1', source as any)
    await controller.moveProductionMoldInstance(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-move', toMesLocationId: 'loc-ready' } as any,
      source as any
    )
    await controller.installProductionMoldInstance(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-install', resourcePositionId: 'pos-1', workCenterId: 'wc-1' } as any,
      source as any
    )
    await controller.unmountProductionMoldInstance(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-unmount', moldInstallationId: 'install-1' } as any,
      source as any
    )
    await controller.scrapProductionMoldInstance(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-scrap', scrapReason: 'broken' } as any,
      source as any
    )
    await controller.listCurrentMoldsByWorkCenter('tenant-1', 'wc-1', { page: 1 } as any, source as any)
    await controller.printDailyMoldChecklist('tenant-1', { checklistDate: '2026-05-05' } as any, source as any)
    await controller.recordDailyMoldUsageBatch(
      'tenant-1',
      '2026-05-05',
      { batchCommandId: 'batch-1', items: [], workCenterId: 'wc-1' } as any,
      source as any
    )

    expect(mesService.listManufacturingSpecs).toHaveBeenCalledWith('tenant-1', { status: 'ACTIVE' }, source)
    expect(mesService.createManufacturingSpec).toHaveBeenCalledWith(
      'tenant-1',
      { specCode: 'SPEC-001' },
      source
    )
    expect(mesService.activateManufacturingSpec).toHaveBeenCalledWith(
      'tenant-1',
      'spec-1',
      { commandId: 'cmd-1' },
      source
    )
    expect(mesService.updateManufacturingSpec).toHaveBeenCalledWith(
      'tenant-1',
      'spec-1',
      { name: 'Spec A2' },
      source
    )
    expect(mesService.retireManufacturingSpec).toHaveBeenCalledWith(
      'tenant-1',
      'spec-1',
      { reason: 'obsolete' },
      source
    )
    expect(mesService.listProductionMoldInstancesByDesign).toHaveBeenCalledWith(
      'tenant-1',
      'design-1',
      { status: 'PENDING_INSTALLATION' },
      source
    )
    expect(mesService.listProductionMoldInstances).toHaveBeenCalledWith(
      'tenant-1',
      { status: 'INSTALLED', moldDesignId: 'design-1' },
      source
    )
    expect(mesService.listWorkCenters).toHaveBeenCalledWith('tenant-1', { keyword: '连体' }, source)
    expect(mesService.createWorkCenter).toHaveBeenCalledWith(
      'tenant-1',
      { workCenterCode: 'LINE-LT-01' },
      source
    )
    expect(mesService.deactivateWorkCenter).toHaveBeenCalledWith(
      'tenant-1',
      'wc-1',
      { reason: 'retire line' },
      source
    )
    expect(mesService.listCurrentMoldsByWorkCenter).toHaveBeenCalledWith(
      'tenant-1',
      'wc-1',
      { page: 1 },
      source
    )
    expect(mesService.moveProductionMoldInstance).toHaveBeenCalledWith(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-move', toMesLocationId: 'loc-ready' },
      source
    )
    expect(mesService.installProductionMoldInstance).toHaveBeenCalledWith(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-install', resourcePositionId: 'pos-1', workCenterId: 'wc-1' },
      source
    )
    expect(mesService.unmountProductionMoldInstance).toHaveBeenCalledWith(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-unmount', moldInstallationId: 'install-1' },
      source
    )
    expect(mesService.scrapProductionMoldInstance).toHaveBeenCalledWith(
      'tenant-1',
      'mold-1',
      { commandId: 'cmd-scrap', scrapReason: 'broken' },
      source
    )
    expect(mesService.recordDailyMoldUsageBatch).toHaveBeenCalledWith(
      'tenant-1',
      '2026-05-05',
      { batchCommandId: 'batch-1', items: [], workCenterId: 'wc-1' },
      source
    )
  })
})
