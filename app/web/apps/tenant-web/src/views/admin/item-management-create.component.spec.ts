/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedItemApi = vi.fn()
const getManagedItemModelAttributeRulesApi = vi.fn()
const listManagedAttributeDefinitionsApi = vi.fn()
const listManagedAttributeOptionsApi = vi.fn()
const listManagedItemModelsApi = vi.fn()
const listManagedPackagingSpecsApi = vi.fn()
const push = vi.fn()
const routeState: any = {
  query: {}
}

vi.mock('#/api', () => ({
  createManagedItemApi,
  getManagedItemModelAttributeRulesApi,
  listManagedAttributeDefinitionsApi,
  listManagedAttributeOptionsApi,
  listManagedItemModelsApi,
  listManagedPackagingSpecsApi
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
  useRoute: () => routeState,
  useRouter: () => ({ push })
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

describe('item management V2 create page', () => {
  beforeEach(() => {
    createManagedItemApi.mockReset()
    getManagedItemModelAttributeRulesApi.mockReset()
    listManagedAttributeDefinitionsApi.mockReset()
    listManagedAttributeOptionsApi.mockReset()
    listManagedItemModelsApi.mockReset()
    listManagedPackagingSpecsApi.mockReset()
    push.mockReset()
    routeState.query = {}
    listManagedItemModelsApi.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelCode: 'MODEL-1',
          modelName: 'Model 1'
        }
      ]
    })
    getManagedItemModelAttributeRulesApi.mockResolvedValue({
      rules: [
        {
          allowedOptionIds: ['option-white', 'option-black'],
          attributeDefinitionId: 'attribute-color',
          itemModelId: 'model-1',
          required: true
        }
      ]
    })
    listManagedAttributeDefinitionsApi.mockResolvedValue({
      attributeDefinitions: [
        {
          attributeDefinitionId: 'attribute-color',
          attributeCode: 'COLOR',
          attributeName: 'Color',
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    listManagedAttributeOptionsApi.mockResolvedValue({
      attributeOptions: [
        {
          attributeOptionId: 'option-white',
          attributeDefinitionId: 'attribute-color',
          optionCode: 'WHITE',
          optionName: 'White',
          status: 'ACTIVE'
        },
        {
          attributeOptionId: 'option-black',
          attributeDefinitionId: 'attribute-color',
          optionCode: 'BLACK',
          optionName: 'Black',
          status: 'ACTIVE'
        }
      ]
    })
    listManagedPackagingSpecsApi.mockResolvedValue({
      packagingSpecs: [
        {
          packagingSpecId: 'packaging-spec-1',
          itemModelId: 'model-1',
          packagingMethodId: 'method-1',
          specCode: 'PKG-STD',
          specName: 'Standard Packaging',
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    createManagedItemApi.mockResolvedValue({ itemId: 'item-1' })
  })

  it('creates one executable Item from an ItemModel and redirects to detail', async () => {
    const page = (await import('./item-management-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="create-item-code"]').setValue('SKU-1')
    await wrapper.get('[data-testid="create-item-name"]').setValue('SKU 1')
    await wrapper.get('[data-testid="create-item-locked-attribute-color"]').setValue(['option-white'])
    await wrapper.get('[data-testid="create-item-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        itemModelId: 'model-1',
        itemType: 'STANDARD',
        lockedAttributeOptionIds: ['option-white'],
        packagingSpecId: undefined
      })
    )
    expect(push).toHaveBeenCalledWith({ name: 'TenantItemManagementDetail', params: { itemId: 'item-1' } })
  })

  it('blocks create when required ItemModel attribute rules are not locked', async () => {
    const page = (await import('./item-management-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="create-item-code"]').setValue('SKU-1')
    await wrapper.get('[data-testid="create-item-name"]').setValue('SKU 1')
    await wrapper.get('[data-testid="create-item-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemApi).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="create-item-error"]').text()).toContain('必选 AttributeRule')
  })

  it('blocks packaged Item create when PackagingSpec is missing', async () => {
    const page = (await import('./item-management-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    await wrapper.get('[data-testid="create-item-code"]').setValue('PKG-SKU-1')
    await wrapper.get('[data-testid="create-item-name"]').setValue('Packaged SKU 1')
    await wrapper.get('[data-testid="create-item-locked-attribute-color"]').setValue(['option-white'])
    await wrapper.get('[data-testid="create-item-type"]').setValue('PACKAGED_FINISHED_GOOD')
    await wrapper.get('[data-testid="create-item-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemApi).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="create-item-error"]').text()).toContain('PackagedItem 必须选择 PackagingSpec')
  })

  it('creates Items with locked attributes and PackagedItem packaging fields from ItemModel rules', async () => {
    const page = (await import('./item-management-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect(getManagedItemModelAttributeRulesApi).toHaveBeenCalledWith('tenant-1', 'model-1')
    expect(listManagedPackagingSpecsApi).toHaveBeenCalledWith('tenant-1', {
      itemModelId: 'model-1',
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
    expect(wrapper.text()).toContain('Color')

    await wrapper.get('[data-testid="create-item-code"]').setValue('PKG-SKU-1')
    await wrapper.get('[data-testid="create-item-name"]').setValue('Packaged SKU 1')
    await wrapper.get('[data-testid="create-item-locked-attribute-color"]').setValue(['option-white'])
    await wrapper.get('[data-testid="create-item-type"]').setValue('PACKAGED_FINISHED_GOOD')
    expect(wrapper.text()).toContain('Standard Packaging')
    await wrapper.get('[data-testid="create-item-packaging-spec"]').setValue('packaging-spec-1')
    await wrapper.get('[data-testid="create-item-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedItemApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        capabilities: expect.objectContaining({
          packaged: true
        }),
        itemModelId: 'model-1',
        itemType: 'PACKAGED_FINISHED_GOOD',
        lockedAttributeOptionIds: ['option-white'],
        packagingSpecId: 'packaging-spec-1'
      })
    )
  })

  it('prefills ItemModel from query when opened from the ItemModel workbench', async () => {
    routeState.query = {
      itemModelId: 'model-2'
    }
    listManagedItemModelsApi.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelCode: 'MODEL-1',
          modelName: 'Model 1'
        },
        {
          itemModelId: 'model-2',
          modelCode: 'MODEL-2',
          modelName: 'Model 2'
        }
      ]
    })

    const page = (await import('./item-management-create.vue')).default
    const wrapper = mount(page)
    await flushPromises()

    expect((wrapper.get('[data-testid="create-item-model"]').element as HTMLSelectElement).value).toBe('model-2')
    expect(getManagedItemModelAttributeRulesApi).toHaveBeenCalledWith('tenant-1', 'model-2')
  })
})
