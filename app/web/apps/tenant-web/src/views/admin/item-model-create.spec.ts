/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedItemModelApi = vi.fn()
const listManagedItemCategoriesApi = vi.fn()
const push = vi.fn()

vi.mock('#/api', () => ({
  createManagedItemModelApi,
  listManagedItemCategoriesApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => ({
    sessionContext: {
      tenant: {
        tenantId: 'tenant-1'
      }
    }
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

describe('item model create page', () => {
  beforeEach(() => {
    createManagedItemModelApi.mockReset()
    listManagedItemCategoriesApi.mockReset()
    push.mockReset()

    listManagedItemCategoriesApi.mockResolvedValue({
      categories: [
        {
          categoryCode: 'FINISHED',
          categoryId: 'category-1',
          categoryName: 'Finished Goods',
          hasChildren: false,
          parentCategoryId: '',
          status: 'ACTIVE'
        }
      ]
    })
    createManagedItemModelApi.mockResolvedValue({ itemModelId: 'model-2' })
  })

  it('creates an ItemModel on a dedicated page and routes to its detail page', async () => {
    const page = (await import('./item-model-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(wrapper.text()).toContain('保存')
    expect(wrapper.find('.item-model-create-page__header').exists()).toBe(false)
    expect(wrapper.find('[data-testid="item-model-form-sheet"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="item-model-create-toolbar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="item-model-create-notebook"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="create-model-identity-stack"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="create-model-code-field"]').exists()).toBe(true)
    expect(wrapper.html().indexOf('data-testid="create-model-name"')).toBeLessThan(
      wrapper.html().indexOf('data-testid="create-model-code-field"')
    )

    await wrapper.get('[data-testid="create-model-code"]').setValue('BATHTUB-COASTER')
    await wrapper.get('[data-testid="create-model-name"]').setValue('Bathtub Coaster')
    await wrapper.get('[data-testid="create-model-kind"]').setValue('PHYSICAL')
    await wrapper.get('[data-testid="create-model-type"]').setValue('FINISHED_PRODUCT')
    await wrapper.get('[data-testid="create-model-category"]').setValue('category-1')
    await wrapper.get('[data-testid="create-model-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemModelApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        modelCode: 'BATHTUB-COASTER',
        modelKind: 'PHYSICAL',
        modelName: 'Bathtub Coaster',
        modelType: 'FINISHED_PRODUCT',
        primaryCategoryId: 'category-1'
      })
    )
    expect(push).toHaveBeenCalledWith({
      name: 'TenantItemModelDetail',
      params: { itemModelId: 'model-2' }
    })
  })

  it('blocks submission until required identity fields are present', async () => {
    const page = (await import('./item-model-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="create-model-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemModelApi).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="create-model-error"]').text()).toContain('Model Code 必填')
    expect(wrapper.get('[data-testid="create-model-error"]').text()).toContain('Model Name 必填')
  })

  it('shows configuration tabs only for selected ItemModel capabilities', async () => {
    const page = (await import('./item-model-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(wrapper.find('[data-testid="item-model-tab-sales"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="item-model-tab-purchase"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="item-model-tab-inventory"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="item-model-tab-manufacturing"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="item-model-tab-packaging"]').exists()).toBe(false)

    await wrapper.get('[data-testid="create-model-capability-sellable"]').setValue(true)
    await wrapper.get('[data-testid="create-model-capability-purchasable"]').setValue(true)
    await wrapper.get('[data-testid="create-model-capability-stockable"]').setValue(true)
    await wrapper.get('[data-testid="create-model-capability-manufacturable"]').setValue(true)
    await wrapper.get('[data-testid="create-model-capability-packaged"]').setValue(true)
    await flushPromises()

    expect(wrapper.find('[data-testid="item-model-tab-sales"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="item-model-tab-purchase"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="item-model-tab-inventory"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="item-model-tab-manufacturing"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="item-model-tab-packaging"]').exists()).toBe(true)
  })
})
