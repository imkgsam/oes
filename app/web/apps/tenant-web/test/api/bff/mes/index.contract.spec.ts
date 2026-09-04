import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post
  }
}))

// Verifies the tenant-web MES API client stays aligned with the current mold-management BFF surface.
describe('tenant-web MES api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('loads production specs, mold designs, production molds, tooling placement, and current installations', async () => {
    const {
      getMoldDesignApi,
      getMoldUsageHistoryApi,
      getMasterMoldApi,
      getProductionMoldApi,
      getToolingCurrentPlacementApi,
      listCurrentMoldsByWorkCenterApi,
      listMasterMoldsApi,
      listMoldLifeCountersApi,
      listMoldDesignsApi,
      listProductionMoldsApi,
      listProductionMoldsByDesignApi,
      listProductionSpecsApi
    } = await import('../../../../src/api/bff/mes/index')

    await listProductionSpecsApi('tenant-1', { itemId: 'item-1', status: 'ACTIVE' })
    await listMoldDesignsApi('tenant-1', { itemModelId: 'item-model-1', keyword: '高压' })
    await getMoldDesignApi('tenant-1', 'design-1')
    await listMasterMoldsApi('tenant-1', { moldDesignId: 'design-1', status: 'AVAILABLE' })
    await getMasterMoldApi('tenant-1', 'master-1')
    await listProductionMoldsApi('tenant-1', {
      carrierResourceId: 'carrier-1',
      moldDesignId: 'design-1',
      status: 'READY'
    })
    await listProductionMoldsByDesignApi('tenant-1', 'design-1', { page: 1, pageSize: 20 })
    await getProductionMoldApi('tenant-1', 'mold-1')
    await getToolingCurrentPlacementApi('tenant-1', 'mold-1')
    await getMoldUsageHistoryApi('tenant-1', 'mold-1', { page: 1, pageSize: 20 })
    await listMoldLifeCountersApi('tenant-1', { productionMoldId: 'mold-1', warningLevel: 'WARNING' })
    await listCurrentMoldsByWorkCenterApi('tenant-1', 'wc-1')

    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-specs', {
      params: {
        itemId: 'item-1',
        status: 'ACTIVE'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-designs', {
      params: {
        itemModelId: 'item-model-1',
        keyword: '高压'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-designs/design-1')
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/master-molds', {
      params: {
        moldDesignId: 'design-1',
        status: 'AVAILABLE'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/master-molds/master-1')
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds', {
      params: {
        carrierResourceId: 'carrier-1',
        moldDesignId: 'design-1',
        status: 'READY'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-designs/design-1/production-molds', {
      params: {
        page: 1,
        pageSize: 20
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds/mold-1')
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/tooling/mold-1/current-placement', {
      params: {
        toolingType: 'MOLD'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds/mold-1/usage-history', {
      params: {
        page: 1,
        pageSize: 20
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-life-counters', {
      params: {
        productionMoldId: 'mold-1',
        warningLevel: 'WARNING'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/work-centers/wc-1/current-molds', {
      params: {
        page: 1,
        pageSize: 100
      }
    })
  })

  it('forwards mold design, production mold, tooling, and usage commands through current BFF endpoints', async () => {
    const {
      installProductionMoldApi,
      confirmInstalledMoldReadyApi,
      confirmProductionMoldArrivalApi,
      markInstalledMoldMaintenanceApi,
      markProductionMoldForScrapApi,
      moveProductionMoldApi,
      recordDailyMoldUsageBatchApi,
      registerMasterMoldApi,
      registerMoldDesignApi,
      registerProductionMoldApi,
      unmountProductionMoldApi
    } = await import('../../../../src/api/bff/mes/index')

    await registerMoldDesignApi('tenant-1', {
      defaultLifeLimit: '1200',
      defaultLifeUnit: 'CASTING_CYCLE',
      designCode: 'MD-LT-HP-01',
      functionRole: 'PRODUCTION',
      primaryItemModelRef: {
        itemModelId: 'item-model-1',
        modelCodeSnapshot: 'WC-MODEL'
      },
      materialType: 'RESIN',
      name: '连体马桶高压模具方案',
      outputStructureType: 'SINGLE',
      outputs: [
        {
          componentRole: '主体',
          isPrimaryOutput: true,
          itemModelRef: {
            itemModelId: 'item-model-1'
          },
          optionCode: 'BODY',
          outputCode: 'BODY',
          outputKind: 'PRODUCT',
          productionSpecRef: {
            productionSpecId: 'spec-1',
            specCodeSnapshot: 'SPEC-01'
          },
          quantityPerUse: '1',
          sequenceNo: 1
        }
      ],
      productionSpecRefs: [
        {
          productionSpecId: 'spec-1',
          specCodeSnapshot: 'SPEC-01'
        }
      ],
      reason: '创建模具方案'
    })
    await registerMasterMoldApi('tenant-1', {
      initialStorageResourceRef: { storageResourceId: 'storage-1' },
      masterMoldCode: 'MM-LT-001',
      moldDesignId: 'design-1',
      reason: '母模入库'
    })
    await registerProductionMoldApi('tenant-1', {
      initialStorageResourceRef: { storageResourceId: 'storage-1' },
      moldCode: 'PM-LT-001',
      moldDesignId: 'design-1',
      supplierRef: {
        supplierCodeSnapshot: 'SUP-01',
        supplierDisplayNameSnapshot: '精工模具厂',
        supplierId: 'supplier-1'
      }
    })
    await confirmProductionMoldArrivalApi('tenant-1', 'mold-1', { reason: '到场确认' })
    await installProductionMoldApi('tenant-1', 'mold-1', {
      cavityPosition: 'LEFT',
      moldPositionIndex: 1,
      setupParameters: '{"pressure":"normal"}',
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      workUnitRef: {
        workUnitCodeSnapshot: 'WU-01',
        workUnitId: 'wu-1'
      }
    })
    await confirmInstalledMoldReadyApi('tenant-1', 'mold-1', {
      readyAt: '2026-05-05T08:00:00.000Z',
      toolingInstallationId: 'install-1'
    })
    await markInstalledMoldMaintenanceApi('tenant-1', 'mold-1', {
      reason: '修补',
      toolingInstallationId: 'install-1'
    })
    await moveProductionMoldApi('tenant-1', 'mold-1', {
      toStorageResourceRef: {
        storageResourceId: 'storage-1'
      }
    })
    await unmountProductionMoldApi('tenant-1', 'install-1', { reason: '换模' })
    await markProductionMoldForScrapApi('tenant-1', 'mold-1', { reason: '破损' })
    await recordDailyMoldUsageBatchApi('tenant-1', '2026-05-05', {
      batchCommandId: 'batch-1',
      items: [
        {
          checked: true,
          moldDesignOutputId: 'output-body',
          moldDesignOutputOptionId: 'option-300',
          lifeUnit: 'CASTING_CYCLE',
          productionMoldId: 'mold-1',
          toolingInstallationId: 'install-1'
        }
      ],
      workCenterRef: {
        workCenterId: 'wc-1'
      }
    })

    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-designs', {
      defaultLifeLimit: '1200',
      defaultLifeUnit: 'CASTING_CYCLE',
      designCode: 'MD-LT-HP-01',
      functionRole: 'PRODUCTION',
      primaryItemModelRef: {
        itemModelId: 'item-model-1',
        modelCodeSnapshot: 'WC-MODEL'
      },
      materialType: 'RESIN',
      name: '连体马桶高压模具方案',
      outputStructureType: 'SINGLE',
      outputs: [
        {
          componentRole: '主体',
          isPrimaryOutput: true,
          itemModelRef: {
            itemModelId: 'item-model-1'
          },
          optionCode: 'BODY',
          outputCode: 'BODY',
          outputKind: 'PRODUCT',
          productionSpecRef: {
            productionSpecId: 'spec-1',
            specCodeSnapshot: 'SPEC-01'
          },
          quantityPerUse: '1',
          sequenceNo: 1
        }
      ],
      productionSpecRefs: [
        {
          productionSpecId: 'spec-1',
          specCodeSnapshot: 'SPEC-01'
        }
      ],
      reason: '创建模具方案'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/master-molds', {
      initialStorageResourceRef: { storageResourceId: 'storage-1' },
      masterMoldCode: 'MM-LT-001',
      moldDesignId: 'design-1',
      reason: '母模入库'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds', {
      initialStorageResourceRef: { storageResourceId: 'storage-1' },
      moldCode: 'PM-LT-001',
      moldDesignId: 'design-1',
      supplierRef: {
        supplierCodeSnapshot: 'SUP-01',
        supplierDisplayNameSnapshot: '精工模具厂',
        supplierId: 'supplier-1'
      }
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds/mold-1/confirm-arrival', {
      reason: '到场确认'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/tooling/mold-1/install', {
      cavityPosition: 'LEFT',
      moldPositionIndex: 1,
      setupParameters: '{"pressure":"normal"}',
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      workUnitRef: {
        workUnitCodeSnapshot: 'WU-01',
        workUnitId: 'wu-1'
      }
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds/mold-1/confirm-ready', {
      readyAt: '2026-05-05T08:00:00.000Z',
      toolingInstallationId: 'install-1'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds/mold-1/mark-maintenance', {
      reason: '修补',
      toolingInstallationId: 'install-1'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/tooling/mold-1/move', {
      toStorageResourceRef: {
        storageResourceId: 'storage-1'
      }
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/tooling-installations/install-1/unmount', {
      reason: '换模'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds/mold-1/mark-for-scrap', {
      reason: '破损'
    })
    expect(post).toHaveBeenCalledWith(
      '/mes/tenants/tenant-1/daily-mold-checklists/2026-05-05/usage-batch',
      {
        batchCommandId: 'batch-1',
        items: [
          {
            checked: true,
            moldDesignOutputId: 'output-body',
            moldDesignOutputOptionId: 'option-300',
            lifeUnit: 'CASTING_CYCLE',
            productionMoldId: 'mold-1',
            toolingInstallationId: 'install-1'
          }
        ],
        workCenterRef: {
          workCenterId: 'wc-1'
        }
      }
    )
  })
})
