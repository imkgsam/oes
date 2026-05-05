import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post
  }
}))

// Verifies the tenant-web MES API client stays aligned with the mold-management BFF surface.
describe('tenant-web MES api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
  })

  it('loads mold workspace directories and single-object reads', async () => {
    const {
      getMoldDesignApi,
      listManufacturingSpecsApi,
      getProductionMoldInstanceApi,
      listCurrentMoldsByWorkCenterApi,
      listMoldDesignsApi,
      listProductionMoldInstancesApi,
      listWorkCentersApi
    } = await import('./index')

    await listWorkCentersApi('tenant-1', { keyword: '连体', status: 'ACTIVE' })
    await listManufacturingSpecsApi('tenant-1', { itemId: 'item-1', status: 'ACTIVE' })
    await listMoldDesignsApi('tenant-1', { itemId: 'item-1', keyword: '高压' })
    await getMoldDesignApi('tenant-1', 'design-1')
    await listProductionMoldInstancesApi('tenant-1', { moldDesignId: 'design-1', status: 'INSTALLED' })
    await getProductionMoldInstanceApi('tenant-1', 'mold-1')
    await listCurrentMoldsByWorkCenterApi('tenant-1', 'wc-1')

    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/work-centers', {
      params: {
        keyword: '连体',
        status: 'ACTIVE'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/manufacturing-specs', {
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
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-instances', {
      params: {
        moldDesignId: 'design-1',
        status: 'INSTALLED'
      }
    })
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-instances/mold-1')
    expect(get).toHaveBeenCalledWith('/mes/tenants/tenant-1/work-centers/wc-1/current-molds', {
      params: {
        page: 1,
        pageSize: 100
      }
    })
  })

  it('forwards production-unit and production-mold commands including output option usage', async () => {
    const {
      createWorkCenterApi,
      deactivateWorkCenterApi,
      installProductionMoldInstanceApi,
      recordDailyMoldUsageBatchApi,
      registerMoldDesignApi,
      registerProductionMoldInstanceApi,
      scrapProductionMoldInstanceApi,
      unmountProductionMoldInstanceApi
    } = await import('./index')

    await createWorkCenterApi('tenant-1', {
      name: '连体马桶上线一线',
      workCenterCode: 'LINE-LT-01',
      workCenterType: 'CASTING_LINE'
    })
    await deactivateWorkCenterApi('tenant-1', 'wc-1', { reason: '停用产线' })
    await registerMoldDesignApi('tenant-1', {
      defaultLifeLimit: '1200',
      defaultLifeUnit: 'USE',
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
          quantityPerUse: '1',
          sequenceNo: 1
        }
      ],
      productFamilyRef: {
        refId: 'item-1',
        refType: 'PRODUCT_FAMILY'
      },
      reason: '创建模具方案'
    })
    await registerProductionMoldInstanceApi('tenant-1', {
      moldDesignId: 'design-1',
      moldInstanceCode: 'PM-LT-001'
    })
    await installProductionMoldInstanceApi('tenant-1', 'mold-1', { workCenterId: 'wc-1' })
    await unmountProductionMoldInstanceApi('tenant-1', 'mold-1', {
      moldInstallationId: 'install-1',
      nextStatus: 'PENDING_INSTALLATION'
    })
    await scrapProductionMoldInstanceApi('tenant-1', 'mold-1', { scrapReason: '破损' })
    await recordDailyMoldUsageBatchApi('tenant-1', '2026-05-05', {
      batchCommandId: 'batch-1',
      items: [
        {
          checked: true,
          moldDesignOutputId: 'output-body',
          moldDesignOutputOptionId: 'option-300',
          moldInstallationId: 'install-1',
          productionMoldInstanceId: 'mold-1',
          resourcePositionId: 'pos-1'
        }
      ],
      workCenterId: 'wc-1'
    })

    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/work-centers', {
      name: '连体马桶上线一线',
      workCenterCode: 'LINE-LT-01',
      workCenterType: 'CASTING_LINE'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/work-centers/wc-1/deactivate', {
      reason: '停用产线'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-designs', {
      defaultLifeLimit: '1200',
      defaultLifeUnit: 'USE',
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
          quantityPerUse: '1',
          sequenceNo: 1
        }
      ],
      productFamilyRef: {
        refId: 'item-1',
        refType: 'PRODUCT_FAMILY'
      },
      reason: '创建模具方案'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-instances', {
      moldDesignId: 'design-1',
      moldInstanceCode: 'PM-LT-001'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-instances/mold-1/install', {
      workCenterId: 'wc-1'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-instances/mold-1/unmount', {
      moldInstallationId: 'install-1',
      nextStatus: 'PENDING_INSTALLATION'
    })
    expect(post).toHaveBeenCalledWith('/mes/tenants/tenant-1/mold-instances/mold-1/scrap', {
      scrapReason: '破损'
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
            moldInstallationId: 'install-1',
            productionMoldInstanceId: 'mold-1',
            resourcePositionId: 'pos-1'
          }
        ],
        workCenterId: 'wc-1'
      }
    )
  })
})
