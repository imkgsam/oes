/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedItemStatusApi = vi.fn()
const createManagedBomApi = vi.fn()
const getManagedBomByOutputItemApi = vi.fn()
const getManagedItemByIdApi = vi.fn()
const getManagedPackagingSpecApi = vi.fn()
const listManagedItemsApi = vi.fn()
const listManagedSupplierItemMappingsApi = vi.fn()
const replaceManagedBomLinesApi = vi.fn()
const setManagedItemCapabilitiesApi = vi.fn()
const updateManagedItemBasicsApi = vi.fn()
const upsertManagedSupplierItemMappingApi = vi.fn()
const push = vi.fn()
const routeState = {
  params: {
    itemId: 'item-1'
  },
  query: {} as Record<string, string>
}

vi.mock('#/api', () => ({
  changeManagedItemStatusApi,
  createManagedBomApi,
  getManagedBomByOutputItemApi,
  getManagedItemByIdApi,
  getManagedPackagingSpecApi,
  listManagedItemsApi,
  listManagedSupplierItemMappingsApi,
  replaceManagedBomLinesApi,
  setManagedItemCapabilitiesApi,
  updateManagedItemBasicsApi,
  upsertManagedSupplierItemMappingApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => ({
    actionCodes: [
      'item_master.item.update_basics',
      'item_master.item.update_status',
      'item_master.item.set_capabilities',
      'item_master.bom.manage',
      'item_master.supplier_item_mapping.upsert'
    ],
    sessionContext: {
      tenant: {
        tenantId: 'tenant-1'
      }
    }
  })
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({ push })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

describe('item management V2 detail page', () => {
  beforeEach(() => {
    changeManagedItemStatusApi.mockReset()
    createManagedBomApi.mockReset()
    getManagedBomByOutputItemApi.mockReset()
    getManagedItemByIdApi.mockReset()
    getManagedPackagingSpecApi.mockReset()
    listManagedItemsApi.mockReset()
    listManagedSupplierItemMappingsApi.mockReset()
    replaceManagedBomLinesApi.mockReset()
    setManagedItemCapabilitiesApi.mockReset()
    updateManagedItemBasicsApi.mockReset()
    upsertManagedSupplierItemMappingApi.mockReset()
    push.mockReset()
    routeState.params = {
      itemId: 'item-1'
    }
    routeState.query = {}
    getManagedItemByIdApi.mockResolvedValue({
      itemId: 'item-1',
      itemModelId: 'model-1',
      itemCode: 'SKU-1',
      itemName: 'SKU 1',
      itemType: 'STANDARD',
      lockedAttributeOptionIds: [],
      status: 'ACTIVE',
      capabilities: {
        assemblable: false,
        manufacturable: false,
        packable: true,
        packaged: false,
        purchasable: false,
        sellable: true,
        stockable: true,
        transformable: false
      }
    })
    getManagedBomByOutputItemApi.mockResolvedValue({
      bom: {
        bomId: 'bom-1',
        lines: [
          {
            bomLineId: 'line-1',
            componentItemId: 'component-1',
            componentItem: {
              itemId: 'component-1',
              itemCode: 'COMP-1',
              itemName: 'Component 1'
            },
            lineRole: 'COMPONENT',
            quantity: '1',
            uomCode: 'PCS'
          }
        ]
      }
    })
    listManagedItemsApi.mockResolvedValue({
      items: [
        {
          itemId: 'component-1',
          itemCode: 'COMP-1',
          itemName: 'Component 1',
          capabilities: {
            assemblable: false,
            manufacturable: false,
            packable: false,
            packaged: false,
            purchasable: false,
            sellable: false,
            stockable: true,
            transformable: false
          }
        },
        {
          itemId: 'component-2',
          itemCode: 'COMP-2',
          itemName: 'Component 2',
          capabilities: {
            assemblable: false,
            manufacturable: false,
            packable: false,
            packaged: false,
            purchasable: false,
            sellable: false,
            stockable: true,
            transformable: false
          }
        }
      ]
    })
    listManagedSupplierItemMappingsApi.mockResolvedValue({ mappings: [] })
    getManagedPackagingSpecApi.mockResolvedValue({
      packagingSpecId: 'spec-1',
      itemModelId: 'model-1',
      packagingMethodId: 'method-1',
      specCode: 'PKG-STD',
      specName: 'Standard Packaging',
      status: 'ACTIVE'
    })
  })

  it('loads Item detail and resolves its composition BOM', async () => {
    const page = (await import('./item-management-detail.vue')).default
    mount(page)
    await flushPromises()

    expect(getManagedItemByIdApi).toHaveBeenCalledWith('tenant-1', 'item-1')
    expect(getManagedBomByOutputItemApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      bomType: 'COMPOSITION'
    })
  })

  it('routes BOM maintenance to the dedicated BOM page instead of editing lines inline', async () => {
    const page = (await import('./item-management-detail.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(wrapper.text()).toContain('COMP-1')

    await wrapper.get('[data-testid="detail-open-bom-management"]').trigger('click')

    expect(replaceManagedBomLinesApi).not.toHaveBeenCalled()
    expect(createManagedBomApi).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemBomManagement',
      query: { outputItemId: 'item-1' }
    })
  })

  it('shows PackagingSpec and resolves PACKAGING_BOM for packaged Items', async () => {
    getManagedItemByIdApi.mockResolvedValue({
      itemId: 'item-1',
      itemModelId: 'model-1',
      itemCode: 'PKG-SKU-1',
      itemName: 'Packaged SKU 1',
      itemType: 'PACKAGED_FINISHED_GOOD',
      lockedAttributeOptionIds: [],
      packagingSpecId: 'spec-1',
      status: 'ACTIVE',
      capabilities: {
        assemblable: false,
        manufacturable: false,
        packable: false,
        packaged: true,
        purchasable: false,
        sellable: true,
        stockable: true,
        transformable: false
      }
    })
    getManagedBomByOutputItemApi.mockResolvedValue({
      bom: {
        bomId: 'packaging-bom-1',
        bomCode: 'PBOM-1',
        bomName: 'Packaging BOM 1',
        bomType: 'PACKAGING',
        outputItemId: 'item-1',
        status: 'ACTIVE',
        lines: [
          {
            bomLineId: 'line-pack-1',
            componentItemId: 'box-1',
            componentItem: {
              itemId: 'box-1',
              itemCode: 'BOX-1',
              itemName: 'Box 1'
            },
            lineRole: 'PACKAGING_MATERIAL',
            quantity: '1',
            uomCode: 'PCS'
          }
        ]
      }
    })

    const page = (await import('./item-management-detail.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(getManagedPackagingSpecApi).toHaveBeenCalledWith('tenant-1', 'spec-1')
    expect(getManagedBomByOutputItemApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      bomType: 'PACKAGING'
    })
    expect(wrapper.text()).toContain('Standard Packaging')
    expect(wrapper.text()).toContain('Packaging BOM')
    expect(wrapper.text()).toContain('BOX-1')
  })

  it('keeps the packaged capability read-only because itemType owns the packaged truth', async () => {
    getManagedItemByIdApi.mockResolvedValue({
      itemId: 'item-1',
      itemModelId: 'model-1',
      itemCode: 'PKG-SKU-1',
      itemName: 'Packaged SKU 1',
      itemType: 'PACKAGED_FINISHED_GOOD',
      lockedAttributeOptionIds: [],
      packagingSpecId: 'spec-1',
      status: 'ACTIVE',
      capabilities: {
        assemblable: false,
        manufacturable: false,
        packable: false,
        packaged: true,
        purchasable: false,
        sellable: true,
        stockable: true,
        transformable: false
      }
    })

    const page = (await import('./item-management-detail.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="detail-edit-button"]').trigger('click')

    expect(wrapper.get('[data-testid="detail-capability-packaged"]').attributes('disabled')).toBeDefined()
  })

  it('shows completeness summary and focuses capability setup from query', async () => {
    routeState.query = {
      focus: 'capabilities'
    }
    getManagedItemByIdApi.mockResolvedValue({
      itemId: 'item-1',
      itemModelId: 'model-1',
      itemCode: 'SKU-NO-CAP',
      itemName: 'Missing Capability',
      itemType: 'STANDARD',
      lockedAttributeOptionIds: [],
      status: 'ACTIVE',
      capabilities: {
        assemblable: false,
        manufacturable: false,
        packable: false,
        packaged: false,
        purchasable: false,
        sellable: false,
        stockable: false,
        transformable: false
      }
    })

    const page = (await import('./item-management-detail.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(wrapper.get('[data-testid="detail-completeness-summary"]').text()).toContain('缺 capability')
    expect(wrapper.get('[data-testid="detail-capability-section"]').classes()).toContain('item-detail-workbench__focus-card')
    expect(wrapper.text()).toContain('请补齐 Item.capabilities 执行真相')
  })

  it('shows supplier mapping focus when opened from a SupplierMapping gap', async () => {
    routeState.query = {
      focus: 'supplierMapping'
    }
    getManagedItemByIdApi.mockResolvedValue({
      itemId: 'item-1',
      itemModelId: 'model-1',
      itemCode: 'SKU-PUR',
      itemName: 'Purchasable SKU',
      itemType: 'STANDARD',
      lockedAttributeOptionIds: [],
      status: 'ACTIVE',
      capabilities: {
        assemblable: false,
        manufacturable: false,
        packable: false,
        packaged: false,
        purchasable: true,
        sellable: false,
        stockable: true,
        transformable: false
      }
    })
    listManagedSupplierItemMappingsApi.mockResolvedValue({
      mappings: [],
      page: 1,
      pageSize: 20,
      total: 0
    })

    const page = (await import('./item-management-detail.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(wrapper.get('[data-testid="detail-completeness-summary"]').text()).toContain('缺 SupplierMapping')
    expect(wrapper.get('[data-testid="detail-supplier-section"]').classes()).toContain('item-detail-workbench__focus-card')
    expect(wrapper.text()).toContain('请维护供应商如何识别该执行层 Item')
  })
})
