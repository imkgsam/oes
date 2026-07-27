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

vi.mock('#/locales', () => ({
  $t: (key: string) => key
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
        },
        {
          categoryCode: 'TOILET',
          categoryId: 'category-2',
          categoryName: 'Toilets',
          hasChildren: false,
          parentCategoryId: 'category-1',
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
    expect(wrapper.get('[data-testid="create-model-identity-stack"]').classes()).toContain(
      'item-model-create-page__identity--compact'
    )
    expect(wrapper.find('[data-testid="create-model-code-field"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('模型名称')
    expect(wrapper.text()).toContain('模型编码')
    expect(wrapper.text()).toContain('模型类型')
    expect(wrapper.text()).toContain('实物')
    expect(wrapper.text()).toContain('成品')
    expect(wrapper.text()).toContain('半成品')
    expect(wrapper.text()).toContain('可销售')
    expect(wrapper.get('[data-testid="create-model-kind-tooltip"]').classes()).toContain(
      'ant-tooltip'
    )
    expect(
      wrapper.get('[data-testid="create-model-kind-tooltip"]').attributes('data-placement')
    ).toBe('right')
    expect(
      wrapper.get('[data-testid="create-model-kind-tooltip"]').attributes('data-overlay-class-name')
    ).toBe('item-model-create-page__help-tooltip')
    expect(wrapper.findAll('[data-testid="create-model-kind-tooltip-line"]')).toHaveLength(4)
    expect(wrapper.findAll('[data-testid="create-model-kind-tooltip-line"]')[0]?.text()).toContain(
      '实物：马桶、浴缸、纸箱'
    )
    expect(wrapper.findAll('[data-testid="create-model-kind-tooltip-line"]')[2]?.text()).toContain(
      '数字物料：电子图纸、固件包'
    )
    expect(wrapper.get('[data-testid="create-model-type-tooltip"]').classes()).toContain(
      'ant-tooltip'
    )
    expect(
      wrapper.get('[data-testid="create-model-type-tooltip"]').attributes('data-placement')
    ).toBe('right')
    expect(
      wrapper.get('[data-testid="create-model-type-tooltip"]').attributes('data-overlay-class-name')
    ).toBe('item-model-create-page__help-tooltip')
    expect(wrapper.findAll('[data-testid="create-model-type-tooltip-line"]')).toHaveLength(9)
    expect(wrapper.findAll('[data-testid="create-model-type-tooltip-line"]')[0]?.text()).toContain(
      '成品：可销售的最终卫浴产品'
    )
    expect(wrapper.findAll('[data-testid="create-model-type-tooltip-line"]')[6]?.text()).toContain(
      '包装材料：纸箱、泡沫、标签'
    )
    expect(wrapper.text()).not.toContain('General Information')
    expect(wrapper.text()).not.toContain('Sellable')
    expect(wrapper.html().indexOf('data-testid="create-model-code-field"')).toBeLessThan(
      wrapper.html().indexOf('data-testid="create-model-name"')
    )
    expect(wrapper.get('[data-testid="create-model-code"]').classes()).toContain(
      'item-model-create-page__identity-input'
    )
    expect(wrapper.get('[data-testid="create-model-name"]').classes()).toContain(
      'item-model-create-page__identity-input'
    )
    expect(wrapper.get('[data-testid="create-model-code"]').classes()).not.toContain(
      'item-model-create-page__code-input'
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

  it('uses a hierarchical category picker for primary category selection', async () => {
    const page = (await import('./item-model-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    const categoryPicker = wrapper.get('[data-testid="create-model-category"]')

    expect(categoryPicker.classes()).toContain('ant-tree-select')
    expect(categoryPicker.text()).toContain('Finished Goods（FINISHED）')
    expect(categoryPicker.text()).toContain('　Toilets（TOILET）')

    await categoryPicker.setValue('category-2')
    await wrapper.get('[data-testid="create-model-code"]').setValue('TOILET-MODEL')
    await wrapper.get('[data-testid="create-model-name"]').setValue('Toilet Model')
    await wrapper.get('[data-testid="create-model-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemModelApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        primaryCategoryId: 'category-2'
      })
    )
  })

  it('blocks submission until required identity fields are present', async () => {
    const page = (await import('./item-model-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="create-model-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemModelApi).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="create-model-error"]').text()).toContain('模型编码必填')
    expect(wrapper.get('[data-testid="create-model-error"]').text()).toContain('模型名称必填')
    expect(wrapper.get('[data-testid="create-model-code-field"]').text()).toContain('模型编码必填')
    expect(wrapper.get('[data-testid="create-model-name-field"]').text()).toContain('模型名称必填')

    await wrapper.get('[data-testid="create-model-code"]').setValue('MODEL-1')
    await wrapper.get('[data-testid="create-model-name"]').setValue('Model 1')
    await flushPromises()

    expect(wrapper.get('[data-testid="create-model-code-field"]').text()).not.toContain(
      '模型编码必填'
    )
    expect(wrapper.get('[data-testid="create-model-name-field"]').text()).not.toContain(
      '模型名称必填'
    )
  })

  it('normalizes Model Code input to uppercase before saving', async () => {
    const page = (await import('./item-model-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="create-model-code"]').setValue('bathtub-coaster')
    await wrapper.get('[data-testid="create-model-name"]').setValue('Bathtub Coaster')
    await wrapper.get('[data-testid="create-model-submit"]').trigger('click')
    await flushPromises()

    expect(
      (wrapper.get('[data-testid="create-model-code"]').element as HTMLInputElement).value
    ).toBe('BATHTUB-COASTER')
    expect(createManagedItemModelApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        modelCode: 'BATHTUB-COASTER'
      })
    )
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
