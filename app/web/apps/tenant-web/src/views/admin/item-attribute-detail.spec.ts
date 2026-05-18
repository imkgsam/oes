/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedAttributeOptionApi = vi.fn()
const listManagedAttributeDefinitionsApi = vi.fn()
const listManagedAttributeOptionsApi = vi.fn()
const updateManagedAttributeOptionApi = vi.fn()
const routerPush = vi.fn()

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
  visibleEntries: ['master-data.item-attribute-management']
}

vi.mock('#/api', () => ({
  createManagedAttributeOptionApi,
  listManagedAttributeDefinitionsApi,
  listManagedAttributeOptionsApi,
  updateManagedAttributeOptionApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      attributeDefinitionId: 'attribute-color'
    }
  }),
  useRouter: () => ({
    push: routerPush
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

// Verifies the attribute detail page owns AttributeOption maintenance for one AttributeDefinition.
describe('item attribute detail page', () => {
  beforeEach(() => {
    createManagedAttributeOptionApi.mockReset()
    listManagedAttributeDefinitionsApi.mockReset()
    listManagedAttributeOptionsApi.mockReset()
    updateManagedAttributeOptionApi.mockReset()
    routerPush.mockReset()

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
      pageSize: 100,
      total: 1
    })
    listManagedAttributeOptionsApi.mockResolvedValue({
      attributeOptions: [
        {
          attributeOptionId: 'option-white',
          attributeDefinitionId: 'attribute-color',
          optionCode: 'WHITE',
          optionName: 'White',
          description: 'Glossy white option',
          status: 'ACTIVE'
        }
      ]
    })
    createManagedAttributeOptionApi.mockResolvedValue({
      attributeOptionId: 'option-black',
      attributeDefinitionId: 'attribute-color',
      optionCode: 'BLACK',
      optionName: 'Black',
      description: 'Matte black option',
      status: 'ACTIVE'
    })
    updateManagedAttributeOptionApi.mockResolvedValue({
      attributeOptionId: 'option-white',
      attributeDefinitionId: 'attribute-color',
      optionCode: 'WHITE-REV',
      optionName: 'White Rev',
      description: 'Updated white option',
      status: 'INACTIVE'
    })
  })

  it('loads one attribute and manages its options through a drawer', async () => {
    const page = (await import('./item-attribute-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedAttributeDefinitionsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 100,
      status: undefined
    })
    expect(listManagedAttributeOptionsApi).toHaveBeenCalledWith('tenant-1', 'attribute-color', {
      status: undefined
    })
    expect(wrapper.text()).toContain('属性详情')
    expect(wrapper.text()).toContain('Color')
    expect(wrapper.text()).toContain('COLOR')
    expect(wrapper.text()).toContain('White')
    expect(wrapper.text()).toContain('WHITE')
    expect(wrapper.text()).toContain('Glossy white option')
    expect(wrapper.find('[data-testid="attribute-option-drawer"]').exists()).toBe(false)

    await wrapper.get('[data-testid="attribute-option-create-button"]').trigger('click')
    expect(wrapper.find('[data-testid="attribute-option-drawer"]').exists()).toBe(true)
    await wrapper.get('[data-testid="attribute-option-code"]').setValue('black')
    expect((wrapper.get('[data-testid="attribute-option-code"]').element as HTMLInputElement).value).toBe('BLACK')
    await wrapper.get('[data-testid="attribute-option-name"]').setValue('Black')
    await wrapper.get('[data-testid="attribute-option-description"]').setValue('Matte black option')
    await wrapper.get('[data-testid="attribute-option-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedAttributeOptionApi).toHaveBeenCalledWith('tenant-1', 'attribute-color', {
      description: 'Matte black option',
      optionCode: 'BLACK',
      optionName: 'Black'
    })

    await wrapper.get('[data-testid="attribute-option-edit-option-white"]').trigger('click')
    await wrapper.get('[data-testid="attribute-option-code"]').setValue('white-rev')
    await wrapper.get('[data-testid="attribute-option-name"]').setValue('White Rev')
    await wrapper.get('[data-testid="attribute-option-description"]').setValue('Updated white option')
    await wrapper.get('[data-testid="attribute-option-status-switch"]').setValue(false)
    await wrapper.get('[data-testid="attribute-option-submit"]').trigger('click')
    await flushPromises()

    expect(updateManagedAttributeOptionApi).toHaveBeenCalledWith('tenant-1', 'option-white', {
      description: 'Updated white option',
      optionCode: 'WHITE-REV',
      optionName: 'White Rev',
      status: 'INACTIVE'
    })
  })

  it('returns to the attribute list from the detail page', async () => {
    const page = (await import('./item-attribute-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    await wrapper.get('[data-testid="attribute-detail-back"]').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({ name: 'TenantItemAttributeManagement' })
  })
})
