/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const listManagedItemCategoriesApi = vi.fn()
const listManagedItemModelsApi = vi.fn()
const listManagedItemsApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: ['item_master.item_model.list', 'item_master.item_model.create'],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1'
    }
  }
}

vi.mock('#/api', () => ({
  listManagedItemCategoriesApi,
  listManagedItemModelsApi,
  listManagedItemsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('#/locales', () => ({
  $t: (key: string) => key
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
    props: ['icon'],
    template: '<span :data-icon="icon" />'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

// Verifies the ItemModel directory stays model-centric and does not reintroduce executable Item list behavior.
describe('item model management page', () => {
  beforeEach(() => {
    listManagedItemCategoriesApi.mockReset()
    listManagedItemModelsApi.mockReset()
    listManagedItemsApi.mockReset()
    push.mockReset()

    listManagedItemCategoriesApi.mockResolvedValue({
      categories: [
        {
          categoryId: 'category-1',
          categoryCode: 'FINISHED',
          categoryName: 'Finished Goods',
          hasChildren: false,
          parentCategoryId: '',
          status: 'ACTIVE'
        }
      ]
    })
    listManagedItemModelsApi.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelCode: 'MODEL-1',
          modelKind: 'PHYSICAL',
          modelName: 'Model 1',
          modelType: 'FINISHED_PRODUCT',
          status: 'ACTIVE',
          primaryCategorySummary: {
            categoryId: 'category-1',
            categoryCode: 'FINISHED',
            categoryName: 'Finished Goods',
            status: 'ACTIVE'
          },
          capabilities: {
            assemblable: false,
            manufacturable: true,
            packable: false,
            packaged: false,
            purchasable: false,
            sellable: true,
            stockable: true,
            transformable: false
          }
        }
      ],
      page: 1,
      pageSize: 100,
      total: 1
    })
  })

  it('renders each ItemModel as a clickable block instead of a table row', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(wrapper.find('[data-testid="item-model-block-model-1"]').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).toContain('ItemModel 管理')
    expect(wrapper.text()).toContain('启用 ItemModel')
    expect(wrapper.text()).toContain('可销售')
    expect(wrapper.text()).toContain('可库存')
    expect(wrapper.text()).toContain('实物')
    expect(wrapper.text()).toContain('成品')
    expect(wrapper.text()).not.toContain('Active ItemModel')
    expect(wrapper.text()).not.toContain('sellable')
    expect(wrapper.text()).toContain('MODEL-1')
    expect(wrapper.text()).toContain('Model 1')
    expect(wrapper.text()).not.toContain('FINISHED_PRODUCT')
  })

  it('filters ItemModel blocks without loading executable Items', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-filter-keyword"]').setValue('MODEL')
    await wrapper.get('[data-testid="item-model-filter-kind"]').setValue('PHYSICAL')
    await wrapper.get('[data-testid="item-model-filter-type"]').setValue('FINISHED_PRODUCT')
    await wrapper.get('[data-testid="item-model-filter-category"]').setValue('category-1')
    await wrapper.get('[data-testid="item-model-filter-search"]').trigger('click')
    await flushPromises()

    expect(listManagedItemModelsApi).toHaveBeenLastCalledWith('tenant-1', {
      categoryId: 'category-1',
      includeDescendants: true,
      keyword: 'MODEL',
      modelKind: 'PHYSICAL',
      modelType: 'FINISHED_PRODUCT',
      page: 1,
      pageSize: 100,
      status: 'ACTIVE'
    })
    expect(listManagedItemsApi).not.toHaveBeenCalled()
  })

  it('opens the ItemModel detail page when one block is clicked', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-block-model-1"]').trigger('click')

    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemModelDetail',
      params: { itemModelId: 'model-1' }
    })
  })

  it('routes add ItemModel entrances to the dedicated create page instead of opening a modal', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="item-model-create-card"]').trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'TenantItemModelCreate' })
    expect(wrapper.find('[data-testid="create-model-code"]').exists()).toBe(false)

    await wrapper.get('[data-testid="item-model-create-button"]').trigger('click')
    expect(push).toHaveBeenLastCalledWith({ name: 'TenantItemModelCreate' })
  })
})
