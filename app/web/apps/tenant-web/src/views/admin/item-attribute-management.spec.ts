/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedAttributeDefinitionApi = vi.fn()
const createManagedAttributeOptionApi = vi.fn()
const listManagedAttributeDefinitionsApi = vi.fn()
const listManagedAttributeOptionsApi = vi.fn()
const updateManagedAttributeDefinitionApi = vi.fn()
const updateManagedAttributeOptionApi = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.attribute.list',
    'item_master.attribute.create',
    'item_master.attribute.manage'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.item-attribute-management']
}

vi.mock('#/api', () => ({
  createManagedAttributeDefinitionApi,
  createManagedAttributeOptionApi,
  listManagedAttributeDefinitionsApi,
  listManagedAttributeOptionsApi,
  updateManagedAttributeDefinitionApi,
  updateManagedAttributeOptionApi
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

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

// Verifies the standalone item attribute page owns AttributeDefinition and AttributeOption maintenance.
describe('item attribute management page', () => {
  beforeEach(() => {
    createManagedAttributeDefinitionApi.mockReset()
    createManagedAttributeOptionApi.mockReset()
    listManagedAttributeDefinitionsApi.mockReset()
    listManagedAttributeOptionsApi.mockReset()
    updateManagedAttributeDefinitionApi.mockReset()
    updateManagedAttributeOptionApi.mockReset()

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
        }
      ]
    })
    createManagedAttributeDefinitionApi.mockResolvedValue({
      attributeDefinitionId: 'attribute-size',
      attributeCode: 'SIZE',
      attributeName: 'Size',
      status: 'ACTIVE'
    })
    updateManagedAttributeDefinitionApi.mockResolvedValue({
      attributeDefinitionId: 'attribute-color',
      attributeCode: 'COLOR-REV',
      attributeName: 'Color Rev',
      status: 'INACTIVE'
    })
    createManagedAttributeOptionApi.mockResolvedValue({
      attributeOptionId: 'option-black',
      attributeDefinitionId: 'attribute-color',
      optionCode: 'BLACK',
      optionName: 'Black',
      status: 'ACTIVE'
    })
    updateManagedAttributeOptionApi.mockResolvedValue({
      attributeOptionId: 'option-white',
      attributeDefinitionId: 'attribute-color',
      optionCode: 'WHITE-REV',
      optionName: 'White Rev',
      status: 'INACTIVE'
    })
  })

  it('loads definitions, filters them, edits definitions, and maintains options under the selected definition', async () => {
    const page = (await import('./item-attribute-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedAttributeDefinitionsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 50,
      status: undefined
    })
    expect(listManagedAttributeOptionsApi).toHaveBeenCalledWith('tenant-1', 'attribute-color', {
      status: undefined
    })
    expect(wrapper.text()).toContain('Item 属性管理')
    expect(wrapper.text()).toContain('COLOR')
    expect(wrapper.text()).toContain('WHITE')

    await wrapper.get('[data-testid="attribute-filter-keyword"]').setValue('color')
    await wrapper.get('[data-testid="attribute-filter-status"]').setValue('ACTIVE')
    await wrapper.get('[data-testid="attribute-filter-submit"]').trigger('click')

    expect(listManagedAttributeDefinitionsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: 'color',
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })

    await wrapper.get('[data-testid="attribute-definition-create-button"]').trigger('click')
    await wrapper.get('[data-testid="attribute-definition-code"]').setValue('SIZE')
    await wrapper.get('[data-testid="attribute-definition-name"]').setValue('Size')
    await wrapper.get('[data-testid="attribute-definition-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedAttributeDefinitionApi).toHaveBeenCalledWith('tenant-1', {
      attributeCode: 'SIZE',
      attributeName: 'Size'
    })

    await wrapper.get('[data-testid="attribute-definition-row-attribute-color"]').trigger('click')
    await wrapper.get('[data-testid="attribute-definition-code"]').setValue('COLOR-REV')
    await wrapper.get('[data-testid="attribute-definition-name"]').setValue('Color Rev')
    await wrapper.get('[data-testid="attribute-definition-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="attribute-definition-submit"]').trigger('click')

    expect(updateManagedAttributeDefinitionApi).toHaveBeenCalledWith('tenant-1', 'attribute-color', {
      attributeCode: 'COLOR-REV',
      attributeName: 'Color Rev',
      status: 'INACTIVE'
    })

    await wrapper.get('[data-testid="attribute-option-create-button"]').trigger('click')
    await wrapper.get('[data-testid="attribute-option-code"]').setValue('BLACK')
    await wrapper.get('[data-testid="attribute-option-name"]').setValue('Black')
    await wrapper.get('[data-testid="attribute-option-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedAttributeOptionApi).toHaveBeenCalledWith('tenant-1', 'attribute-color', {
      optionCode: 'BLACK',
      optionName: 'Black'
    })

    await wrapper.get('[data-testid="attribute-option-row-option-white"]').trigger('click')
    await wrapper.get('[data-testid="attribute-option-code"]').setValue('WHITE-REV')
    await wrapper.get('[data-testid="attribute-option-name"]').setValue('White Rev')
    await wrapper.get('[data-testid="attribute-option-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="attribute-option-submit"]').trigger('click')

    expect(updateManagedAttributeOptionApi).toHaveBeenCalledWith('tenant-1', 'option-white', {
      optionCode: 'WHITE-REV',
      optionName: 'White Rev',
      status: 'INACTIVE'
    })
  })

  it('shows an empty state when no attribute definitions exist', async () => {
    listManagedAttributeDefinitionsApi.mockResolvedValue({
      attributeDefinitions: [],
      page: 1,
      pageSize: 50,
      total: 0
    })

    const page = (await import('./item-attribute-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(wrapper.text()).toContain('暂无 Item 属性')
  })
})
