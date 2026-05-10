/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedItemCategoryStatusApi = vi.fn()
const createManagedItemCategoryApi = vi.fn()
const listManagedItemCategoriesApi = vi.fn()
const updateManagedItemCategoryBasicsApi = vi.fn()

const authContextState: any = {
  actionCodes: [
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
  visibleEntries: ['master-data.item-category-management']
}

vi.mock('#/api', () => ({
  changeManagedItemCategoryStatusApi,
  createManagedItemCategoryApi,
  listManagedItemCategoriesApi,
  updateManagedItemCategoryBasicsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    template: '<span data-testid="iconify-icon" />'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

// Verifies the standalone item category page owns category tree browsing and category mutations.
describe('item category management page', () => {
  beforeEach(() => {
    changeManagedItemCategoryStatusApi.mockReset()
    createManagedItemCategoryApi.mockReset()
    listManagedItemCategoriesApi.mockReset()
    updateManagedItemCategoryBasicsApi.mockReset()

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

  it('loads a nested category tree, filters it, creates root and child categories, and saves the selected category', async () => {
    const page = (await import('./item-category-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: undefined
    })
    expect(listManagedItemCategoriesApi).toHaveBeenCalledWith('tenant-1', {
      parentCategoryId: 'category-root'
    })
    expect(wrapper.text()).toContain('Item 分类管理')
    expect(wrapper.text()).toContain('Root Category')
    expect(wrapper.text()).toContain('Finished Goods')
    expect(wrapper.find('.ant-card').exists()).toBe(true)
    expect(wrapper.find('.ant-tree').exists()).toBe(true)
    expect(wrapper.find('.item-category-tree-panel').exists()).toBe(false)

    await wrapper.get('[data-testid="category-tree-search"]').setValue('finished')

    expect(wrapper.text()).not.toContain('Root Category')
    expect(wrapper.text()).toContain('Finished Goods')
    await wrapper.get('[data-testid="category-tree-search"]').setValue('')

    await wrapper.get('[data-testid="category-create-root-button"]').trigger('click')
    await wrapper.get('[data-testid="category-form-code"]').setValue('RAW')
    await wrapper.get('[data-testid="category-form-name"]').setValue('Raw Material')
    await wrapper.get('[data-testid="category-form-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemCategoryApi).toHaveBeenCalledWith('tenant-1', {
      categoryCode: 'RAW',
      categoryName: 'Raw Material',
      parentCategoryId: undefined
    })

    await wrapper.get('[data-testid="category-tree-row-category-root"]').trigger('click')
    await wrapper.get('[data-testid="category-create-child-button"]').trigger('click')
    await wrapper.get('[data-testid="category-form-code"]').setValue('CHILD')
    await wrapper.get('[data-testid="category-form-name"]').setValue('Child Category')
    await wrapper.get('[data-testid="category-form-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemCategoryApi).toHaveBeenLastCalledWith('tenant-1', {
      categoryCode: 'CHILD',
      categoryName: 'Child Category',
      parentCategoryId: 'category-root'
    })

    await wrapper.get('[data-testid="category-tree-row-category-1"]').trigger('click')
    await wrapper.get('[data-testid="category-form-code"]').setValue('FINISHED-REV')
    await wrapper.get('[data-testid="category-form-name"]').setValue('Finished Goods Rev')
    await wrapper.get('[data-testid="category-form-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="category-form-submit"]').trigger('click')

    expect(updateManagedItemCategoryBasicsApi).toHaveBeenCalledWith('tenant-1', 'category-1', {
      categoryCode: 'FINISHED-REV',
      categoryName: 'Finished Goods Rev'
    })
    expect(changeManagedItemCategoryStatusApi).toHaveBeenCalledWith('tenant-1', 'category-1', {
      status: 'INACTIVE'
    })
  })

  it('shows an empty state when no categories are available', async () => {
    listManagedItemCategoriesApi.mockResolvedValue({
      categories: []
    })

    const page = (await import('./item-category-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(wrapper.text()).toContain('暂无 Item 分类')
  })
})
