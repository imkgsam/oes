import { status } from '@grpc/grpc-js'
import {
  MesMoldManagementService
} from '../../src/application/services/mes-mold-management.service'
import { MesMoldQueryService } from '../../src/application/services/mes-mold-query.service'
import {
  MesLocationStatus,
  MoldDesignOutputKind,
  MoldFunctionRole,
  MoldLifeAdjustmentType,
  MoldOutputStructureType,
  MoldResourceType,
  MoldUsageMode,
  MoldWarningStatus,
  ProductionMoldInstanceStatus
} from '../../src/domain/models/mes-mold-records'
import { InMemoryMesMoldRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-mes-mold.repository'
import { MesInMemoryStore } from '../../src/infrastructure/store/mes-in-memory-store'

const tenantId = 'tenant-1'
const orgId = 'org-1'

function commandContext(commandId: string, reason = 'mold foundation test') {
  return {
    tenantId,
    orgId,
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: `request-${commandId}`
    },
    auditContext: {
      auditId: `audit-${commandId}`,
      reason,
      source: 'jest'
    },
    commandId
  }
}

function queryContext() {
  return {
    tenantId,
    orgId,
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: 'query-request-1'
    }
  }
}

function createHarness() {
  const store = new MesInMemoryStore()
  const repository = new InMemoryMesMoldRepository(store)
  const management = new MesMoldManagementService(repository)
  const query = new MesMoldQueryService(repository)

  store.mesLocations.set('loc-drying', {
    mesLocationId: 'loc-drying',
    tenantId,
    orgId,
    locationCode: 'DRY-01',
    name: 'Drying Area',
    locationType: 'DRYING',
    parentMesLocationId: null,
    relatedWorkCenterId: null,
    capacityProfileId: null,
    status: MesLocationStatus.ACTIVE,
    createdAt: '2026-05-04T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z'
  })
  store.mesLocations.set('loc-ready', {
    mesLocationId: 'loc-ready',
    tenantId,
    orgId,
    locationCode: 'READY-01',
    name: 'Ready Rack',
    locationType: 'AVAILABLE',
    parentMesLocationId: null,
    relatedWorkCenterId: null,
    capacityProfileId: null,
    status: MesLocationStatus.ACTIVE,
    createdAt: '2026-05-04T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z'
  })
  store.mesLocations.set('loc-scrap', {
    mesLocationId: 'loc-scrap',
    tenantId,
    orgId,
    locationCode: 'SCRAP-01',
    name: 'Scrap Holding',
    locationType: 'SCRAP_HOLDING',
    parentMesLocationId: null,
    relatedWorkCenterId: null,
    capacityProfileId: null,
    status: MesLocationStatus.ACTIVE,
    createdAt: '2026-05-04T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z'
  })
  store.workCenters.set('wc-press-1', {
    workCenterId: 'wc-press-1',
    tenantId,
    orgId,
    workCenterCode: 'PRESS-1',
    name: 'High Pressure Line 1',
    workCenterType: 'PRESS_LINE',
    parentWorkCenterId: null,
    relatedMesLocationId: 'loc-ready',
    capacityProfileId: null,
    status: 'ACTIVE',
    createdAt: '2026-05-04T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z'
  })
  store.resourcePositions.set('pos-a', {
    resourcePositionId: 'pos-a',
    tenantId,
    orgId,
    workCenterId: 'wc-press-1',
    positionCode: 'A',
    name: 'Mold Position A',
    positionType: 'MOLD_SLOT',
    compatibleMoldDesignRefs: ['design-1'],
    status: 'ACTIVE',
    createdAt: '2026-05-04T00:00:00.000Z',
    updatedAt: '2026-05-04T00:00:00.000Z'
  })

  return { store, repository, management, query }
}

async function registerDesign(
  management: MesMoldManagementService,
  commandId = 'cmd-design-1',
  designCode = 'wb-a100',
  name = 'Wash Basin A100 Mold'
) {
  return management.registerMoldDesign({
    ...commandContext(commandId, 'register design'),
    moldDesignId: 'design-1',
    designCode,
    name,
    revisionCode: 'R1',
    productFamilyRef: {
      refType: 'PRODUCT_FAMILY',
      refId: 'pf-1',
      refCodeSnapshot: 'WB',
      displayNameSnapshot: 'Wash Basin'
    },
    manufacturingSpecRefs: [
      {
        refType: 'MANUFACTURING_SPEC',
        refId: 'spec-1',
        refCodeSnapshot: 'A100',
        displayNameSnapshot: 'A100 Spec'
      }
    ],
    itemRef: {
      itemId: 'item-optional',
      itemCodeSnapshot: 'ITM-MOLD-A100',
      itemNameSnapshot: 'Optional Mold Item'
    },
    materialType: 'GYPSUM',
    functionRole: MoldFunctionRole.PRODUCTION,
    productionMethodTags: ['HIGH_PRESSURE'],
    outputStructureType: MoldOutputStructureType.SINGLE,
    outputs: [
      {
        sequenceNo: 1,
        outputCode: 'OUT-A100',
        outputKind: MoldDesignOutputKind.PRODUCT,
        productFamilyRef: {
          refType: 'PRODUCT_FAMILY',
          refId: 'pf-1',
          refCodeSnapshot: 'WB',
          displayNameSnapshot: 'Wash Basin'
        },
        manufacturingSpecRef: {
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-1',
          refCodeSnapshot: 'A100',
          displayNameSnapshot: 'A100 Spec'
        },
        quantityPerUse: '1',
        isPrimaryOutput: true
      }
    ],
    defaultLifeLimit: '100',
    defaultLifeUnit: 'USE',
    reason: 'register design'
  })
}

async function registerInstance(
  management: MesMoldManagementService,
  productionMoldInstanceId = 'mold-1',
  moldInstanceCode = 'pm-f01-wb-a100-2026-0001',
  commandId = `cmd-${productionMoldInstanceId}`
) {
  return management.registerProductionMoldInstance({
    ...commandContext(commandId, 'register production mold'),
    productionMoldInstanceId,
    moldInstanceCode,
    moldDesignId: 'design-1',
    initialStatus: ProductionMoldInstanceStatus.PENDING_INSTALLATION,
    initialMesLocationId: 'loc-drying',
    lifeLimitValue: '100',
    lifeUnit: 'USE',
    warningThresholdValue: '50',
    reason: 'register production mold'
  })
}

describe('mes-service mold foundation behavior L1', () => {
  it('design and production mold registration / should require primary output, create life counter, and reject duplicate codes', async () => {
    const { management, store } = createHarness()

    const design = await registerDesign(management)
    expect(design.designCode).toBe('WB-A100')
    expect(design.outputs).toHaveLength(1)
    expect(store.outboxEvents).toHaveLength(1)
    expect(store.outboxEvents[0]?.eventType).toBe('MoldRegistered')

    await expect(registerDesign(management, 'cmd-design-duplicate')).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
    await expect(registerDesign(management, 'cmd-design-duplicate')).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
    expect(
      Array.from(store.commandIdempotencyRecords.values()).some((record) => record.commandId === 'cmd-design-duplicate')
    ).toBe(false)

    const registered = await registerInstance(management)
    expect(registered.productionMoldInstance.moldInstanceCode).toBe('PM-F01-WB-A100-2026-0001')
    expect(registered.moldLifeCounter).toMatchObject({
      productionMoldInstanceId: 'mold-1',
      usedValue: '0',
      limitValue: '100',
      warningThresholdValue: '50'
    })

    await expect(registerInstance(management, 'mold-duplicate', 'pm-f01-wb-a100-2026-0001')).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
  })

  it('management idempotency / should replay same command payload and reject command id reuse with different payload', async () => {
    const { management, store } = createHarness()

    const design = await registerDesign(management)
    const replayedDesign = await registerDesign(management)
    expect(replayedDesign).toEqual(design)
    expect(store.moldDesigns.size).toBe(1)
    expect(store.auditEnvelopes.filter((audit) => audit.commandId === 'cmd-design-1')).toHaveLength(1)
    expect(store.outboxEvents.filter((event) => event.commandId === 'cmd-design-1')).toHaveLength(1)

    await expect(registerDesign(management, 'cmd-design-1', 'wb-a101')).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })

    const registered = await registerInstance(management)
    const replayedInstance = await registerInstance(management)
    expect(replayedInstance).toEqual(registered)
    expect(store.productionMoldInstances.size).toBe(1)
    expect(store.lifeCounters.size).toBe(1)
    expect(store.auditEnvelopes.filter((audit) => audit.commandId === 'cmd-mold-1')).toHaveLength(1)
    expect(store.outboxEvents.filter((event) => event.commandId === 'cmd-mold-1')).toHaveLength(1)

    await expect(
      registerInstance(management, 'mold-2', 'pm-f01-wb-a100-2026-0002', 'cmd-mold-1')
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
  })

  it('work center management / should create list and deactivate production units without exposing resource position CRUD', async () => {
    const { management, query } = createHarness()

    const created = await management.createWorkCenter({
      ...commandContext('cmd-create-wc-1', 'create casting line'),
      workCenterId: 'wc-line-a',
      workCenterCode: 'line-a',
      name: '连体马桶上线 A',
      workCenterType: 'CASTING_LINE',
      relatedMesLocationId: 'loc-ready',
      reason: 'create casting line'
    })
    expect(created).toMatchObject({
      workCenterCode: 'LINE-A',
      name: '连体马桶上线 A',
      status: 'ACTIVE'
    })

    const listed = await query.listWorkCenters({
      ...queryContext(),
      keyword: 'line',
      workCenterType: 'CASTING_LINE',
      page: 1,
      pageSize: 20
    })
    expect(listed.items.map((item) => item.workCenterId)).toContain('wc-line-a')

    const deactivated = await management.deactivateWorkCenter({
      ...commandContext('cmd-deactivate-wc-1', 'line retired'),
      workCenterId: 'wc-line-a',
      reason: 'line retired'
    })
    expect(deactivated.status).toBe('INACTIVE')
  })

  it('output options and auto positions / should keep selectable manufacturing specs and allocate mold slots during install', async () => {
    const { management, query, store } = createHarness()
    const design = await management.registerMoldDesign({
      ...commandContext('cmd-design-options', 'register selectable design'),
      moldDesignId: 'design-options',
      designCode: 'toilet-body-hp',
      name: '连体马桶主体高压模具方案',
      revisionCode: 'R1',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: 'pf-toilet',
        refCodeSnapshot: 'TOILET',
        displayNameSnapshot: '连体马桶'
      },
      manufacturingSpecRefs: [
        {
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-300',
          refCodeSnapshot: 'BODY-300',
          displayNameSnapshot: '主体 300 坑距'
        },
        {
          refType: 'MANUFACTURING_SPEC',
          refId: 'spec-400',
          refCodeSnapshot: 'BODY-400',
          displayNameSnapshot: '主体 400 坑距'
        }
      ],
      itemRef: {
        itemId: 'item-toilet-body',
        itemCodeSnapshot: 'TOILET-BODY',
        itemNameSnapshot: '连体马桶坐头'
      },
      materialType: 'HIGH_PRESSURE',
      functionRole: MoldFunctionRole.PRODUCTION,
      productionMethodTags: ['HIGH_PRESSURE'],
      outputStructureType: MoldOutputStructureType.SINGLE,
      outputs: [
        {
          sequenceNo: 1,
          outputCode: 'BODY',
          outputKind: MoldDesignOutputKind.PRODUCT,
          productFamilyRef: {
            refType: 'PRODUCT_FAMILY',
            refId: 'pf-toilet',
            refCodeSnapshot: 'TOILET',
            displayNameSnapshot: '连体马桶'
          },
          quantityPerUse: '1',
          isPrimaryOutput: true,
          options: [
            {
              optionCode: 'P300',
              label: '300 坑距',
              manufacturingSpecRef: {
                refType: 'MANUFACTURING_SPEC',
                refId: 'spec-300',
                refCodeSnapshot: 'BODY-300',
                displayNameSnapshot: '主体 300 坑距'
              },
              isDefault: true
            },
            {
              optionCode: 'P400',
              label: '400 坑距',
              manufacturingSpecRef: {
                refType: 'MANUFACTURING_SPEC',
                refId: 'spec-400',
                refCodeSnapshot: 'BODY-400',
                displayNameSnapshot: '主体 400 坑距'
              }
            }
          ]
        }
      ],
      defaultLifeLimit: '12000',
      defaultLifeUnit: 'USE',
      reason: 'register selectable design'
    })
    expect(design.outputs[0]?.options?.map((option) => option.optionCode)).toEqual(['P300', 'P400'])

    await management.registerProductionMoldInstance({
      ...commandContext('cmd-options-mold-1', 'register high pressure mold'),
      productionMoldInstanceId: 'mold-options-1',
      moldInstanceCode: 'hp-toilet-body-0001',
      moldDesignId: 'design-options',
      initialStatus: ProductionMoldInstanceStatus.PENDING_INSTALLATION,
      initialMesLocationId: 'loc-ready',
      reason: 'register high pressure mold'
    })
    const installed = await management.installMold({
      ...commandContext('cmd-options-install-1', 'install without manual slot'),
      productionMoldInstanceId: 'mold-options-1',
      workCenterId: 'wc-press-1',
      reason: 'install without manual slot'
    })
    expect(installed.moldInstallation.resourcePositionId).toMatch(/^auto-pos-/)
    expect(store.resourcePositions.get(installed.moldInstallation.resourcePositionId)?.positionType).toBe('AUTO_MOLD_SLOT')

    const used = await management.recordMoldUsage({
      ...commandContext('cmd-options-usage-1', 'record selected output option'),
      productionMoldInstanceId: 'mold-options-1',
      moldInstallationId: installed.moldInstallation.moldInstallationId,
      workCenterId: 'wc-press-1',
      resourcePositionId: installed.moldInstallation.resourcePositionId,
      usageMode: MoldUsageMode.MANUAL_CHECKLIST,
      usageQuantity: '1',
      lifeDelta: '1',
      lifeUnit: 'USE',
      moldDesignOutputId: design.outputs[0]?.moldDesignOutputId,
      moldDesignOutputOptionId: design.outputs[0]?.options[1]?.moldDesignOutputOptionId,
      manufacturingSpecRef: design.outputs[0]?.options[1]?.manufacturingSpecRef,
      captureSource: 'WEB_CHECKLIST',
      reason: 'record selected output option'
    })
    expect(used.usageEvent.moldDesignOutputOptionId).toBe(design.outputs[0]?.options[1]?.moldDesignOutputOptionId)
    expect(used.usageEvent.manufacturingSpecRef?.refId).toBe('spec-400')

    const derivedSpecUsage = await management.recordMoldUsage({
      ...commandContext('cmd-options-usage-2', 'derive selected output option spec'),
      productionMoldInstanceId: 'mold-options-1',
      moldInstallationId: installed.moldInstallation.moldInstallationId,
      workCenterId: 'wc-press-1',
      resourcePositionId: installed.moldInstallation.resourcePositionId,
      usageMode: MoldUsageMode.MANUAL_CHECKLIST,
      usageQuantity: '1',
      lifeDelta: '1',
      lifeUnit: 'USE',
      moldDesignOutputId: design.outputs[0]?.moldDesignOutputId,
      moldDesignOutputOptionId: design.outputs[0]?.options[0]?.moldDesignOutputOptionId,
      captureSource: 'WEB_CHECKLIST',
      reason: 'derive selected output option spec'
    })
    expect(derivedSpecUsage.usageEvent.manufacturingSpecRef?.refId).toBe('spec-300')

    await expect(
      management.recordMoldUsage({
        ...commandContext('cmd-options-usage-mismatch', 'reject mismatched selected option'),
        productionMoldInstanceId: 'mold-options-1',
        moldInstallationId: installed.moldInstallation.moldInstallationId,
        workCenterId: 'wc-press-1',
        resourcePositionId: installed.moldInstallation.resourcePositionId,
        usageMode: MoldUsageMode.MANUAL_CHECKLIST,
        usageQuantity: '1',
        lifeDelta: '1',
        lifeUnit: 'USE',
        moldDesignOutputId: design.outputs[0]?.moldDesignOutputId,
        moldDesignOutputOptionId: design.outputs[0]?.options[1]?.moldDesignOutputOptionId,
        manufacturingSpecRef: design.outputs[0]?.options[0]?.manufacturingSpecRef,
        captureSource: 'WEB_CHECKLIST',
        reason: 'reject mismatched selected option'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    const listed = await query.listProductionMoldInstances({
      ...queryContext(),
      page: 1,
      pageSize: 20
    })
    expect(listed.items.map((item) => item.productionMoldInstanceId)).toContain('mold-options-1')
  })

  it('movement installation usage and query / should keep append-only facts, current projections, position occupancy, and warning de-duplication aligned', async () => {
    const { management, query, store } = createHarness()
    await registerDesign(management)
    await registerInstance(management)

    const moved = await management.moveMold({
      ...commandContext('cmd-move-1', 'move to ready rack'),
      moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
      moldResourceId: 'mold-1',
      fromMesLocationId: 'loc-drying',
      toMesLocationId: 'loc-ready',
      movementReason: 'drying complete'
    })
    expect(moved.moldCurrentLocation.currentMesLocationSummary?.mesLocationId).toBe('loc-ready')
    expect(store.movementEvents).toHaveLength(1)
    expect(store.auditEnvelopes.some((audit) => audit.eventType === 'MoveMold')).toBe(true)
    expect(store.outboxEvents.some((event) => event.eventType === 'MoldMoved')).toBe(true)

    const installed = await management.installMold({
      ...commandContext('cmd-install-1', 'install for production'),
      productionMoldInstanceId: 'mold-1',
      workCenterId: 'wc-press-1',
      resourcePositionId: 'pos-a',
      reason: 'install for production'
    })
    expect(installed.productionMoldInstance.currentStatus).toBe(ProductionMoldInstanceStatus.INSTALLED)
    expect(installed.productionMoldInstance.currentInstallationSummary?.resourcePositionId).toBe('pos-a')

    await registerInstance(management, 'mold-2', 'pm-f01-wb-a100-2026-0002')
    await expect(
      management.installMold({
        ...commandContext('cmd-install-occupied', 'try occupied position'),
        productionMoldInstanceId: 'mold-2',
        workCenterId: 'wc-press-1',
        resourcePositionId: 'pos-a',
        reason: 'try occupied position'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })

    const usage = await management.recordMoldUsage({
      ...commandContext('cmd-usage-1', 'record shift usage'),
      productionMoldInstanceId: 'mold-1',
      workCenterId: 'wc-press-1',
      resourcePositionId: 'pos-a',
      usageMode: MoldUsageMode.MANUAL_CHECKLIST,
      usageQuantity: '80',
      lifeDelta: '80',
      lifeUnit: 'USE',
      productFamilyRef: {
        refType: 'PRODUCT_FAMILY',
        refId: 'pf-1',
        refCodeSnapshot: 'WB',
        displayNameSnapshot: 'Wash Basin'
      },
      manufacturingSpecRef: {
        refType: 'MANUFACTURING_SPEC',
        refId: 'spec-1',
        refCodeSnapshot: 'A100',
        displayNameSnapshot: 'A100 Spec'
      },
      captureSource: 'CHECKLIST',
      reason: 'record shift usage'
    })
    expect(usage.moldLifeCounter.usedValue).toBe('80')
    expect(usage.productionMoldInstance.currentStatus).toBe(ProductionMoldInstanceStatus.INSTALLED)
    expect(usage.raisedWarning?.warningLevel).toBe('WARNING')
    expect(store.warningEvents).toHaveLength(1)
    expect(store.outboxEvents.filter((event) => event.eventType === 'MoldLifeWarningRaised')).toHaveLength(1)

    const repeatedWarning = await management.recordMoldUsage({
      ...commandContext('cmd-usage-2', 'record follow-up usage'),
      productionMoldInstanceId: 'mold-1',
      workCenterId: 'wc-press-1',
      resourcePositionId: 'pos-a',
      usageMode: MoldUsageMode.MANUAL_CHECKLIST,
      usageQuantity: '5',
      lifeDelta: '5',
      lifeUnit: 'USE',
      captureSource: 'CHECKLIST',
      reason: 'record follow-up usage'
    })
    expect(repeatedWarning.raisedWarning).toBeNull()
    expect(store.warningEvents).toHaveLength(1)

    const instance = await query.getProductionMoldInstance({
      ...queryContext(),
      productionMoldInstanceId: 'mold-1'
    })
    expect(instance.currentMesLocationSummary?.mesLocationId).toBe('loc-ready')
    expect(instance.currentInstallationSummary?.usageState).toBe('IN_USE_WINDOW')
    expect(instance.lifeSummary?.usedValue).toBe('85')
    expect(instance.warningSummary?.status).toBe(MoldWarningStatus.OPEN)

    const workCenterMolds = await query.listCurrentMoldsByWorkCenter({
      ...queryContext(),
      workCenterId: 'wc-press-1',
      page: 1,
      pageSize: 20
    })
    expect(workCenterMolds.total).toBe(1)
    expect(workCenterMolds.items[0]?.productionMoldInstance.productionMoldInstanceId).toBe('mold-1')
  })

  it('unmount scrap and life adjustment / should close installations, enforce terminal scrap state, and require authorization for life adjustment', async () => {
    const { management, query } = createHarness()
    await registerDesign(management)
    await registerInstance(management)
    await management.moveMold({
      ...commandContext('cmd-move-1', 'move to ready rack'),
      moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
      moldResourceId: 'mold-1',
      fromMesLocationId: 'loc-drying',
      toMesLocationId: 'loc-ready',
      movementReason: 'drying complete'
    })
    const installed = await management.installMold({
      ...commandContext('cmd-install-1', 'install for production'),
      productionMoldInstanceId: 'mold-1',
      workCenterId: 'wc-press-1',
      resourcePositionId: 'pos-a',
      reason: 'install for production'
    })

    const unmounted = await management.unmountMold({
      ...commandContext('cmd-unmount-1', 'remove after shift'),
      productionMoldInstanceId: 'mold-1',
      moldInstallationId: installed.moldInstallation.moldInstallationId,
      nextStatus: ProductionMoldInstanceStatus.PENDING_INSTALLATION,
      toMesLocationId: 'loc-ready',
      reason: 'remove after shift'
    })
    expect(unmounted.moldInstallation.unmountedAt).toBeTruthy()
    expect(unmounted.productionMoldInstance.currentStatus).toBe(ProductionMoldInstanceStatus.PENDING_INSTALLATION)
    expect(unmounted.productionMoldInstance.currentInstallationSummary).toBeNull()

    await expect(
      management.adjustMoldLife({
        ...commandContext('cmd-adjust-denied', 'missing authorization'),
        productionMoldInstanceId: 'mold-1',
        adjustmentType: MoldLifeAdjustmentType.ADD_USED_VALUE,
        adjustmentValue: '5',
        lifeUnit: 'USE',
        reason: 'missing authorization'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.PERMISSION_DENIED
      }
    })

    const adjusted = await management.adjustMoldLife({
      ...commandContext('cmd-adjust-1', 'authorized counter correction'),
      productionMoldInstanceId: 'mold-1',
      adjustmentType: MoldLifeAdjustmentType.ADD_USED_VALUE,
      adjustmentValue: '5',
      lifeUnit: 'USE',
      authorizationRef: {
        refType: 'APPROVAL',
        refId: 'approval-1',
        refCodeSnapshot: 'APP-1',
        displayNameSnapshot: 'Supervisor approval'
      },
      reason: 'authorized counter correction'
    })
    expect(adjusted.moldLifeCounter.usedValue).toBe('5')

    await management.scrapMold({
      ...commandContext('cmd-scrap-1', 'scrap cracked mold'),
      moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
      moldResourceId: 'mold-1',
      scrapReason: 'cracked',
      toMesLocationId: 'loc-scrap'
    })

    await expect(
      management.installMold({
        ...commandContext('cmd-install-scrapped', 'install scrapped mold'),
        productionMoldInstanceId: 'mold-1',
        workCenterId: 'wc-press-1',
        resourcePositionId: 'pos-a',
        reason: 'install scrapped mold'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    await expect(
      management.recordMoldUsage({
        ...commandContext('cmd-usage-scrapped', 'use scrapped mold'),
        productionMoldInstanceId: 'mold-1',
        workCenterId: 'wc-press-1',
        usageMode: MoldUsageMode.MANUAL_CHECKLIST,
        usageQuantity: '1',
        lifeDelta: '1',
        lifeUnit: 'USE',
        captureSource: 'CHECKLIST'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    await expect(
      management.moveMold({
        ...commandContext('cmd-move-scrapped', 'move scrapped mold to ready'),
        moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
        moldResourceId: 'mold-1',
        fromMesLocationId: 'loc-scrap',
        toMesLocationId: 'loc-ready',
        movementReason: 'move scrapped mold to ready'
      })
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    const location = await query.getMoldCurrentLocation({
      ...queryContext(),
      moldResourceType: MoldResourceType.PRODUCTION_MOLD_INSTANCE,
      moldResourceId: 'mold-1'
    })
    expect(location.currentStatus).toBe('SCRAPPED')
    expect(location.currentMesLocationSummary?.mesLocationId).toBe('loc-scrap')
  })
})
