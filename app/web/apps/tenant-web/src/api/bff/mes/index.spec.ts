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
      getProductionMoldApi,
      getToolingCurrentPlacementApi,
      listCurrentMoldsByWorkCenterApi,
      listMoldLifeCountersApi,
      listMoldDesignsApi,
      listProductionMoldsApi,
      listProductionMoldsByDesignApi,
      listProductionSpecsApi
    } = await import('./index')

    await listProductionSpecsApi('tenant-1', { itemId: 'item-1', status: 'ACTIVE' })
    await listMoldDesignsApi('tenant-1', { itemId: 'item-1', keyword: '高压' })
    await getMoldDesignApi('tenant-1', 'design-1')
    await listProductionMoldsApi('tenant-1', {
      carrierResourceId: 'carrier-1',
      moldDesignId: 'design-1',
      status: 'INSTALLED'
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
        itemId: 'item-1',
        keyword: '高压'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-designs/design-1')
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds', {
      params: {
        carrierResourceId: 'carrier-1',
        moldDesignId: 'design-1',
        status: 'INSTALLED'
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
      moveProductionMoldApi,
      recordDailyMoldUsageBatchApi,
      registerMoldDesignApi,
      registerProductionMoldApi,
      scrapProductionMoldApi,
      unmountProductionMoldApi
    } = await import('./index')

    await registerMoldDesignApi('tenant-1', {
      defaultLifeLimit: '1200',
      defaultLifeUnit: 'CASTING_CYCLE',
      designCode: 'MD-LT-HP-01',
      functionRole: 'PRODUCTION',
      materialType: 'RESIN',
      name: '连体马桶高压模具方案',
      outputStructureType: 'SINGLE',
      outputs: [
        {
          componentRole: '主体',
          isPrimaryOutput: true,
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
    await registerProductionMoldApi('tenant-1', {
      acceptedAt: '2026-05-05T08:00:00.000Z',
      moldCode: 'PM-LT-001',
      moldDesignId: 'design-1',
      supplierRef: {
        supplierCodeSnapshot: 'SUP-01',
        supplierDisplayNameSnapshot: '精工模具厂',
        supplierId: 'supplier-1'
      }
    })
    await installProductionMoldApi('tenant-1', 'mold-1', {
      cavityPosition: 'LEFT',
      moldPosition: 'A1',
      setupParameters: '{"pressure":"normal"}',
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      workUnitRef: {
        workUnitCodeSnapshot: 'WU-01',
        workUnitId: 'wu-1'
      }
    })
    await moveProductionMoldApi('tenant-1', 'mold-1', {
      toStorageResourceRef: {
        storageResourceId: 'storage-1'
      }
    })
    await unmountProductionMoldApi('tenant-1', 'install-1', { reason: '换模' })
    await scrapProductionMoldApi('tenant-1', 'mold-1', { reason: '破损' })
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
      materialType: 'RESIN',
      name: '连体马桶高压模具方案',
      outputStructureType: 'SINGLE',
      outputs: [
        {
          componentRole: '主体',
          isPrimaryOutput: true,
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
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds', {
      acceptedAt: '2026-05-05T08:00:00.000Z',
      moldCode: 'PM-LT-001',
      moldDesignId: 'design-1',
      supplierRef: {
        supplierCodeSnapshot: 'SUP-01',
        supplierDisplayNameSnapshot: '精工模具厂',
        supplierId: 'supplier-1'
      }
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/tooling/mold-1/install', {
      cavityPosition: 'LEFT',
      moldPosition: 'A1',
      setupParameters: '{"pressure":"normal"}',
      workCenterRef: {
        workCenterId: 'wc-1'
      },
      workUnitRef: {
        workUnitCodeSnapshot: 'WU-01',
        workUnitId: 'wu-1'
      }
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/tooling/mold-1/move', {
      toStorageResourceRef: {
        storageResourceId: 'storage-1'
      }
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/tooling-installations/install-1/unmount', {
      reason: '换模'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/production-molds/mold-1/scrap', {
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
