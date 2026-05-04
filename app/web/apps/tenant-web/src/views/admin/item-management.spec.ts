/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedItemCategoryStatusApi = vi.fn()
const createManagedItemCategoryApi = vi.fn()
const listManagedItemCategoriesApi = vi.fn()
const listManagedItemsApi = vi.fn()
const push = vi.fn()
const updateManagedItemCategoryBasicsApi = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.item.list',
    'item_master.item.get_by_id',
    'item_master.item.create',
    'item_master.item_category.list',
    'item_master.item_category.create',
    'item_master.item_category.update_basics',
    'item_master.item_category.update_status'
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
  changeManagedItemCategoryStatusApi,
  createManagedItemCategoryApi,
  listManagedItemCategoriesApi,
  listManagedItemsApi,
  updateManagedItemCategoryBasicsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute(),
  useRouter: () => ({
    push
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

// Verifies the item management list page keeps filters, navigation, and tenant-scoped directory loading aligned with the BFF.
describe('item management list page', () => {
  beforeEach(() => {
    changeManagedItemCategoryStatusApi.mockReset()
    createManagedItemCategoryApi.mockReset()
    listManagedItemCategoriesApi.mockReset()
    listManagedItemsApi.mockReset()
    push.mockReset()
    updateManagedItemCategoryBasicsApi.mockReset()
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'master-data.item-management'
      }
    })
    listManagedItemsApi.mockResolvedValue({
      items: [
        {
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
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
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
    createManagedItemCategoryApi.mockResolvedValue({
      categoryId: 'category-2',
      categoryCode: 'RAW',
      categoryName: 'Raw Material',
      status: 'ACTIVE'
    })
    updateManagedItemCategoryBasicsApi.mockResolvedValue({
      categoryId: 'category-1',
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev',
      status: 'ACTIVE'
    })
    changeManagedItemCategoryStatusApi.mockResolvedValue({
      categoryId: 'category-1',
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev',
      status: 'INACTIVE'
    })
  })

  it('loads the tenant item directory, applies category-aware filters, manages categories, and navigates to create/detail routes', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedItemsApi).toHaveBeenCalledWith('tenant-1', {
      capability: undefined,
      categoryId: undefined,
      includeDescendants: undefined,
      keyword: undefined,
      natureType: undefined,
      page: 1,
      pageSize: 20,
      status: undefined,
      structureType: undefined
    })
    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: undefined
    })
    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: 'category-root'
    })
    expect(wrapper.text()).toContain('Starter Bundle')
    expect(wrapper.text()).toContain('Finished Goods')

    await wrapper.get('[data-testid="item-filter-keyword"]').setValue('starter')
    await wrapper.get('[data-testid="item-filter-capability"]').setValue('sellable')
    await wrapper.get('[data-testid="item-filter-category"]').setValue('category-root')
    await wrapper.get('[data-testid="item-filter-include-descendants"]').setValue(true)
    await wrapper.get('[data-testid="item-filter-structure"]').setValue('BUNDLE')
    await wrapper.get('[data-testid="item-filter-nature"]').setValue('VIRTUAL')
    await wrapper.get('[data-testid="item-filter-status"]').setValue('ACTIVE')
    await wrapper.get('[data-testid="item-filter-search"]').trigger('click')

    expect(listManagedItemsApi).toHaveBeenLastCalledWith('tenant-1', {
      capability: 'sellable',
      categoryId: 'category-root',
      includeDescendants: true,
      keyword: 'starter',
      natureType: 'VIRTUAL',
      page: 1,
      pageSize: 20,
      status: 'ACTIVE',
      structureType: 'BUNDLE'
    })

    await wrapper.get('[data-testid="category-create-code"]').setValue('RAW')
    await wrapper.get('[data-testid="category-create-name"]').setValue('Raw Material')
    await wrapper.get('[data-testid="category-create-parent"]').setValue('category-root')
    await wrapper.get('[data-testid="category-create-submit"]').trigger('click')

    expect(createManagedItemCategoryApi).toHaveBeenCalledWith('tenant-1', {
      categoryCode: 'RAW',
      categoryName: 'Raw Material',
      parentCategoryId: 'category-root'
    })

    await wrapper.get('[data-testid="category-edit-select"]').setValue('category-1')
    await wrapper.get('[data-testid="category-edit-code"]').setValue('FINISHED-REV')
    await wrapper.get('[data-testid="category-edit-name"]').setValue('Finished Goods Rev')
    await wrapper.get('[data-testid="category-edit-save-basics"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="category-edit-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="category-edit-save-status"]').trigger('click')

    expect(updateManagedItemCategoryBasicsApi).toHaveBeenCalledWith('tenant-1', 'category-1', {
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev'
    })
    expect(changeManagedItemCategoryStatusApi).toHaveBeenCalledWith('tenant-1', 'category-1', {
      status: 'INACTIVE'
    })

    await wrapper.get('[data-testid="item-create-button"]').trigger('click')
    await wrapper.get('[data-testid="item-detail-button-item-1"]').trigger('click')

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantItemManagementCreate'
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantItemManagementDetail',
      params: {
        itemId: 'item-1'
      }
    })
  })
})
