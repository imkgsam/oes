/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedItemStatusApi = vi.fn()
const getManagedItemByIdApi = vi.fn()
const getManagedItemCompositionApi = vi.fn()
const listManagedItemCategoriesApi = vi.fn()
const listManagedItemsApi = vi.fn()
const listManagedSupplierItemMappingsApi = vi.fn()
const setManagedItemCapabilitiesApi = vi.fn()
const setManagedItemPrimaryCategoryApi = vi.fn()
const setManagedItemCompositionApi = vi.fn()
const updateManagedItemBasicsApi = vi.fn()
const upsertManagedSupplierItemMappingApi = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.item.get_by_id',
    'item_master.item.update_basics',
    'item_master.item.update_status',
    'item_master.item.set_capabilities',
    'item_master.item.set_composition',
    'item_master.item.set_primary_category',
    'item_master.item_category.list',
    'item_master.supplier_item_mapping.list_by_item',
    'item_master.supplier_item_mapping.upsert'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.item-management']
}

vi.mock('#/api', () => ({
  changeManagedItemStatusApi,
  getManagedItemByIdApi,
  getManagedItemCompositionApi,
  listManagedItemCategoriesApi,
  listManagedItemsApi,
  listManagedSupplierItemMappingsApi,
  setManagedItemCapabilitiesApi,
  setManagedItemPrimaryCategoryApi,
  setManagedItemCompositionApi,
  updateManagedItemBasicsApi,
  upsertManagedSupplierItemMappingApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute()
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

// Verifies the phase 1 detail page wires basics, capabilities, composition full-replace, and supplier mapping upsert to the thin BFF contract.
describe('item management detail page', () => {
  beforeEach(() => {
    changeManagedItemStatusApi.mockReset()
    getManagedItemByIdApi.mockReset()
    getManagedItemCompositionApi.mockReset()
    listManagedItemCategoriesApi.mockReset()
    listManagedItemsApi.mockReset()
    listManagedSupplierItemMappingsApi.mockReset()
    setManagedItemCapabilitiesApi.mockReset()
    setManagedItemPrimaryCategoryApi.mockReset()
    setManagedItemCompositionApi.mockReset()
    updateManagedItemBasicsApi.mockReset()
    upsertManagedSupplierItemMappingApi.mockReset()

    useRoute.mockReturnValue({
      params: {
        itemId: 'item-1'
      }
    })

    getManagedItemByIdApi.mockResolvedValue({
      itemId: 'item-1',
      itemCode: 'BUNDLE-001',
      itemName: 'Starter Bundle',
      structureType: 'BUNDLE',
      natureType: 'VIRTUAL',
      status: 'ACTIVE',
      capabilities: {
        sellable: true,
        purchasable: false,
        stockable: false,
        manufacturable: false
      },
      primaryCategorySummary: {
        categoryId: 'category-1',
        categoryCode: 'FINISHED',
        categoryName: 'Finished Goods',
        status: 'ACTIVE'
      }
    })
    getManagedItemCompositionApi.mockResolvedValue({
      itemId: 'item-1',
      components: [
        {
          componentItemId: 'component-1',
          componentItemCode: 'COMP-001',
          componentItemName: 'Component 1'
        }
      ]
    })
    listManagedSupplierItemMappingsApi.mockResolvedValue({
      mappings: [
        {
          supplierId: 'supplier-1',
          supplierItemCode: 'SUP-001',
          supplierItemName: 'Supplier Item 1',
          itemId: 'item-1'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    listManagedItemsApi.mockResolvedValue({
      items: [
        {
          itemId: 'component-1',
          itemCode: 'COMP-001',
          itemName: 'Component 1',
          structureType: 'SINGLE',
          natureType: 'PHYSICAL',
          status: 'ACTIVE',
          capabilities: {
            sellable: false,
            purchasable: true,
            stockable: true,
            manufacturable: false
          }
        },
        {
          itemId: 'component-2',
          itemCode: 'COMP-002',
          itemName: 'Component 2',
          structureType: 'SINGLE',
          natureType: 'PHYSICAL',
          status: 'ACTIVE',
          capabilities: {
            sellable: false,
            purchasable: true,
            stockable: true,
            manufacturable: true
          }
        }
      ],
      total: 2,
      page: 1,
      pageSize: 100
    })
    listManagedItemCategoriesApi.mockImplementation(async (_tenantId, params) => {
      if (params.parentCategoryId === 'category-root') {
        return {
          categories: [
            {
              categoryId: 'category-1',
              categoryCode: 'FINISHED',
              categoryName: 'Finished Goods',
              parentCategoryId: 'category-root',
              status: 'ACTIVE',
              hasChildren: false
            }
          ]
        }
      }

      return {
        categories: [
          {
            categoryId: 'category-root',
            categoryCode: 'ROOT',
            categoryName: 'Root Category',
            parentCategoryId: '',
            status: 'ACTIVE',
            hasChildren: true
          }
        ]
      }
    })
    updateManagedItemBasicsApi.mockResolvedValue({})
    setManagedItemCapabilitiesApi.mockResolvedValue({})
    setManagedItemCompositionApi.mockResolvedValue({})
    setManagedItemPrimaryCategoryApi.mockResolvedValue({
      itemId: 'item-1',
      itemCode: 'BUNDLE-001',
      itemName: 'Starter Bundle',
      structureType: 'BUNDLE',
      natureType: 'VIRTUAL',
      status: 'ACTIVE',
      capabilities: {
        sellable: true,
        purchasable: true,
        stockable: false,
        manufacturable: false
      },
      primaryCategorySummary: {
        categoryId: 'category-1',
        categoryCode: 'FINISHED',
        categoryName: 'Finished Goods',
        status: 'ACTIVE'
      }
    })
    upsertManagedSupplierItemMappingApi.mockResolvedValue({})
    changeManagedItemStatusApi.mockResolvedValue({})
  })

  it('loads all phase 1 detail sections and saves basics, primary category, capabilities, status, composition, and supplier mappings', async () => {
    const page = (await import('./item-management-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getManagedItemByIdApi).toHaveBeenCalledWith('tenant-1', 'item-1')
    expect(getManagedItemCompositionApi).toHaveBeenCalledWith('tenant-1', 'item-1')
    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: undefined
    })
    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: 'category-root'
    })
    expect(listManagedSupplierItemMappingsApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      page: 1,
      pageSize: 20
    })
    expect(listManagedItemsApi).toHaveBeenCalledWith('tenant-1', {
      capability: undefined,
      keyword: undefined,
      natureType: undefined,
      page: 1,
      pageSize: 100,
      status: 'ACTIVE',
      structureType: undefined
    })
    expect(wrapper.text()).toContain('Supplier Item 1')
    expect(wrapper.text()).toContain('Finished Goods')

    await wrapper.get('[data-testid="detail-item-code"]').setValue('BUNDLE-001-REV')
    await wrapper.get('[data-testid="detail-item-name"]').setValue('Starter Bundle Rev')
    await wrapper.get('[data-testid="detail-save-basics"]').trigger('click')

    await wrapper.get('[data-testid="detail-primary-category"]').setValue('category-1')
    await wrapper.get('[data-testid="detail-primary-category-save"]').trigger('click')
    await wrapper.get('[data-testid="detail-primary-category-clear"]').trigger('click')

    await wrapper.get('[data-testid="detail-capability-purchasable"]').setValue(true)
    await wrapper.get('[data-testid="detail-save-capabilities"]').trigger('click')

    await wrapper.get('[data-testid="detail-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="detail-save-status"]').trigger('click')

    await wrapper.get('[data-testid="detail-component-component-1"]').setValue(false)
    await wrapper.get('[data-testid="detail-component-component-2"]').setValue(true)
    await wrapper.get('[data-testid="detail-save-composition"]').trigger('click')

    await wrapper.get('[data-testid="detail-supplier-id"]').setValue('supplier-2')
    await wrapper.get('[data-testid="detail-supplier-code"]').setValue('SUP-002')
    await wrapper.get('[data-testid="detail-supplier-name"]').setValue('Supplier Item 2')
    await wrapper.get('[data-testid="detail-save-supplier"]').trigger('click')

    await flushPromises()

    expect(updateManagedItemBasicsApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      itemCode: 'BUNDLE-001-REV',
      itemName: 'Starter Bundle Rev'
    })
    expect(setManagedItemPrimaryCategoryApi).toHaveBeenNthCalledWith(1, 'tenant-1', 'item-1', {
      primaryCategoryId: 'category-1'
    })
    expect(setManagedItemPrimaryCategoryApi).toHaveBeenNthCalledWith(2, 'tenant-1', 'item-1', {
      primaryCategoryId: undefined
    })
    expect(setManagedItemCapabilitiesApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      capabilities: {
        sellable: true,
        purchasable: true,
        stockable: false,
        manufacturable: false
      }
    })
    expect(changeManagedItemStatusApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      status: 'INACTIVE'
    })
    expect(setManagedItemCompositionApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      components: [{ componentItemId: 'component-2' }]
    })
    expect(upsertManagedSupplierItemMappingApi).toHaveBeenCalledWith('tenant-1', 'item-1', {
      supplierId: 'supplier-2',
      supplierItemCode: 'SUP-002',
      supplierItemName: 'Supplier Item 2'
    })
    expect(wrapper.text()).toContain('Deferred / 引用说明')
  })
})
