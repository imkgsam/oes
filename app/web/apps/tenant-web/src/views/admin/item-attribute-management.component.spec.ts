/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedAttributeDefinitionApi = vi.fn()
const listManagedAttributeDefinitionsApi = vi.fn()
const updateManagedAttributeDefinitionApi = vi.fn()
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
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.item-attribute-management']
}

vi.mock('#/api', () => ({
  createManagedAttributeDefinitionApi,
  listManagedAttributeDefinitionsApi,
  updateManagedAttributeDefinitionApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
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

// Verifies the product attribute directory page stays focused on AttributeDefinition management.
describe('item attribute management page', () => {
  beforeEach(() => {
    createManagedAttributeDefinitionApi.mockReset()
    listManagedAttributeDefinitionsApi.mockReset()
    updateManagedAttributeDefinitionApi.mockReset()
    routerPush.mockReset()

    listManagedAttributeDefinitionsApi.mockResolvedValue({
      attributeDefinitions: [
        {
          attributeDefinitionId: 'attribute-color',
          attributeCode: 'COLOR',
          attributeName: 'Color',
          optionCount: 2,
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
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
  })

  it('lists product attributes and manages definitions through a drawer', async () => {
    const page = (await import('./item-attribute-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedAttributeDefinitionsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 50,
      status: undefined
    })
    expect(wrapper.text()).toContain('产品属性管理')
    expect(wrapper.text()).not.toContain('Alpha Tenant')
    expect(wrapper.text()).toContain('属性名称')
    expect(wrapper.text()).toContain('属性编码')
    expect(wrapper.text()).toContain('选项数')
    expect(wrapper.text()).toContain('Color')
    expect(wrapper.text()).toContain('COLOR')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).not.toContain('属性选项')
    expect(wrapper.find('[data-testid="attribute-form-drawer"]').exists()).toBe(false)

    await wrapper.get('[data-testid="attribute-filter-keyword"]').setValue('color')
    await wrapper.get('[data-testid="attribute-filter-status"]').setValue('ACTIVE')
    await wrapper.get('[data-testid="attribute-filter-submit"]').trigger('click')

    expect(listManagedAttributeDefinitionsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: 'color',
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })

    await wrapper.get('[data-testid="attribute-create-button"]').trigger('click')
    expect(wrapper.find('[data-testid="attribute-form-drawer"]').exists()).toBe(true)
    await wrapper.get('[data-testid="attribute-form-code"]').setValue('size')
    expect((wrapper.get('[data-testid="attribute-form-code"]').element as HTMLInputElement).value).toBe('SIZE')
    await wrapper.get('[data-testid="attribute-form-name"]').setValue('Size')
    await wrapper.get('[data-testid="attribute-form-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedAttributeDefinitionApi).toHaveBeenCalledWith('tenant-1', {
      attributeCode: 'SIZE',
      attributeName: 'Size'
    })

    await wrapper.get('[data-testid="attribute-row-edit-attribute-color"]').trigger('click')
    expect(wrapper.get('[data-testid="attribute-form-drawer"]').text()).toContain('编辑属性')
    await wrapper.get('[data-testid="attribute-form-code"]').setValue('color-rev')
    await wrapper.get('[data-testid="attribute-form-name"]').setValue('Color Rev')
    await wrapper.get('[data-testid="attribute-status-switch"]').setValue(false)
    await wrapper.get('[data-testid="attribute-form-submit"]').trigger('click')
    await flushPromises()

    expect(updateManagedAttributeDefinitionApi).toHaveBeenCalledWith('tenant-1', 'attribute-color', {
      attributeCode: 'COLOR-REV',
      attributeName: 'Color Rev',
      status: 'INACTIVE'
    })
  })

  it('navigates from the list to the attribute detail page', async () => {
    const page = (await import('./item-attribute-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    await wrapper.get('[data-testid="attribute-row-detail-attribute-color"]').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'TenantItemAttributeDetail',
      params: {
        attributeDefinitionId: 'attribute-color'
      }
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

    expect(wrapper.text()).toContain('暂无产品属性')
  })
})
