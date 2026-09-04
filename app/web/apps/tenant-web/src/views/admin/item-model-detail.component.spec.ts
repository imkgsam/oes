/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getManagedItemModelByIdApi = vi.fn()
const getManagedItemModelAttributeRulesApi = vi.fn()
const listManagedItemCategoriesApi = vi.fn()
const setManagedItemModelCapabilitiesApi = vi.fn()
const setManagedItemModelPrimaryCategoryApi = vi.fn()
const updateManagedItemModelBasicsApi = vi.fn()
const back = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.attribute.list',
    'item_master.item_model.list',
    'item_master.item_model.manage'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1'
    }
  }
}

vi.mock('#/api', () => ({
  getManagedItemModelAttributeRulesApi,
  getManagedItemModelByIdApi,
  listManagedItemCategoriesApi,
  setManagedItemModelCapabilitiesApi,
  setManagedItemModelPrimaryCategoryApi,
  updateManagedItemModelBasicsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      itemModelId: 'model-1'
    }
  }),
  useRouter: () => ({ back })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

// Verifies the ItemModel detail route remains model-level and does not render executable Item sections.
describe('item model detail page', () => {
  beforeEach(() => {
    getManagedItemModelByIdApi.mockReset()
    getManagedItemModelAttributeRulesApi.mockReset()
    listManagedItemCategoriesApi.mockReset()
    setManagedItemModelCapabilitiesApi.mockReset()
    setManagedItemModelPrimaryCategoryApi.mockReset()
    updateManagedItemModelBasicsApi.mockReset()
    back.mockReset()

    getManagedItemModelByIdApi.mockResolvedValue({
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
    })
    getManagedItemModelAttributeRulesApi.mockResolvedValue({
      rules: [
        {
          allowedOptionIds: ['option-white'],
          attributeDefinitionId: 'attribute-color',
          itemModelId: 'model-1',
          required: true
        }
      ]
    })
    listManagedItemCategoriesApi.mockResolvedValue({
      categories: [
        {
          categoryId: 'category-1',
          categoryCode: 'FINISHED',
          categoryName: 'Finished Goods',
          hasChildren: false,
          parentCategoryId: '',
          status: 'ACTIVE'
        },
        {
          categoryId: 'category-2',
          categoryCode: 'RAW',
          categoryName: 'Raw Materials',
          hasChildren: false,
          parentCategoryId: '',
          status: 'ACTIVE'
        }
      ]
    })
    updateManagedItemModelBasicsApi.mockResolvedValue({})
    setManagedItemModelCapabilitiesApi.mockResolvedValue({})
    setManagedItemModelPrimaryCategoryApi.mockResolvedValue({})
  })

  it('loads one ItemModel and renders model-level detail sections', async () => {
    const page = (await import('./item-model-detail.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(getManagedItemModelByIdApi).toHaveBeenCalledWith('tenant-1', 'model-1')
    expect(getManagedItemModelAttributeRulesApi).toHaveBeenCalledWith('tenant-1', 'model-1')
    expect((wrapper.get('[data-testid="detail-model-code"]').element as HTMLInputElement).value).toBe('MODEL-1')
    expect((wrapper.get('[data-testid="detail-model-name"]').element as HTMLInputElement).value).toBe('Model 1')
    expect(wrapper.text()).toContain('PHYSICAL')
    expect(wrapper.text()).toContain('FINISHED_PRODUCT')
    expect(wrapper.text()).toContain('属性规则')
    await wrapper.get('[data-testid="detail-model-tab-attributes"]').trigger('click')
    expect(wrapper.text()).toContain('Attribute Rules')
    expect(wrapper.text()).not.toContain('Derived Items')
    expect(wrapper.text()).not.toContain('创建 Item')
  })

  it('edits ItemModel basics, capabilities, and primary category from an Odoo-like form', async () => {
    const page = (await import('./item-model-detail.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(wrapper.find('[data-testid="item-model-detail-form-sheet"]').exists()).toBe(true)

    await wrapper.get('[data-testid="detail-model-name"]').setValue('Model 1 Updated')
    await wrapper.get('[data-testid="detail-model-code"]').setValue('MODEL-1-UPD')
    await wrapper.get('[data-testid="detail-model-category"]').setValue('category-2')
    await wrapper.get('[data-testid="detail-model-capability-purchasable"]').setValue(true)
    await wrapper.get('[data-testid="detail-model-submit"]').trigger('click')
    await flushPromises()

    expect(updateManagedItemModelBasicsApi).toHaveBeenCalledWith('tenant-1', 'model-1', {
      modelCode: 'MODEL-1-UPD',
      modelName: 'Model 1 Updated'
    })
    expect(setManagedItemModelCapabilitiesApi).toHaveBeenCalledWith(
      'tenant-1',
      'model-1',
      expect.objectContaining({
        capabilities: expect.objectContaining({
          purchasable: true,
          sellable: true,
          stockable: true
        })
      })
    )
    expect(setManagedItemModelPrimaryCategoryApi).toHaveBeenCalledWith('tenant-1', 'model-1', {
      primaryCategoryId: 'category-2'
    })
  })
})
