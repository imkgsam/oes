/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedPackagingMethodStatusApi = vi.fn()
const changeManagedPackagingSpecStatusApi = vi.fn()
const createManagedPackagingMethodApi = vi.fn()
const createManagedPackagingSpecApi = vi.fn()
const deleteManagedPackagingMethodApi = vi.fn()
const listManagedItemModelsApi = vi.fn()
const listManagedPackagingMethodsApi = vi.fn()
const listManagedPackagingSpecsApi = vi.fn()
const updateManagedPackagingMethodApi = vi.fn()
const updateManagedPackagingSpecApi = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.packaging.list',
    'item_master.packaging.create',
    'item_master.packaging.manage'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.item-packaging-management']
}

vi.mock('#/api', () => ({
  changeManagedPackagingMethodStatusApi,
  changeManagedPackagingSpecStatusApi,
  createManagedPackagingMethodApi,
  createManagedPackagingSpecApi,
  deleteManagedPackagingMethodApi,
  listManagedItemModelsApi,
  listManagedPackagingMethodsApi,
  listManagedPackagingSpecsApi,
  updateManagedPackagingMethodApi,
  updateManagedPackagingSpecApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><h1>{{ title }}</h1><slot /></div>'
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

// Verifies the packaging page is currently scoped to PackagingMethod maintenance only.
describe('item packaging management page', () => {
  beforeEach(() => {
    changeManagedPackagingMethodStatusApi.mockReset()
    changeManagedPackagingSpecStatusApi.mockReset()
    createManagedPackagingMethodApi.mockReset()
    createManagedPackagingSpecApi.mockReset()
    deleteManagedPackagingMethodApi.mockReset()
    listManagedItemModelsApi.mockReset()
    listManagedPackagingMethodsApi.mockReset()
    listManagedPackagingSpecsApi.mockReset()
    updateManagedPackagingMethodApi.mockReset()
    updateManagedPackagingSpecApi.mockReset()

    listManagedPackagingMethodsApi.mockResolvedValue({
      packagingMethods: [
        {
          packagingMethodId: 'method-1',
          methodCode: 'STD',
          methodName: 'Standard',
          description: 'Default carton flow',
          status: 'ACTIVE'
        }
      ]
    })
    createManagedPackagingMethodApi.mockResolvedValue({
      packagingMethodId: 'method-2',
      methodCode: 'ECOM',
      methodName: 'E-commerce',
      description: 'Online parcel packaging',
      status: 'ACTIVE'
    })
    updateManagedPackagingMethodApi.mockResolvedValue({
      packagingMethodId: 'method-1',
      methodCode: 'STD-REV',
      methodName: 'Standard Rev',
      description: 'Updated carton flow',
      status: 'ACTIVE'
    })
    changeManagedPackagingMethodStatusApi.mockResolvedValue({
      packagingMethodId: 'method-1',
      methodCode: 'STD-REV',
      methodName: 'Standard Rev',
      status: 'INACTIVE'
    })
    deleteManagedPackagingMethodApi.mockResolvedValue({})
  })

  it('shows only PackagingMethod table and does not load PackagingSpec data', async () => {
    const page = (await import('./item-packaging-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedPackagingMethodsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      status: undefined
    })
    expect(listManagedItemModelsApi).not.toHaveBeenCalled()
    expect(listManagedPackagingSpecsApi).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('包装管理')
    expect(wrapper.text()).not.toContain('Item 包装管理')
    expect(wrapper.text()).toContain('包装方式列表')
    expect(wrapper.text()).toContain('STD')
    expect(wrapper.text()).toContain('Standard')
    expect(wrapper.text()).toContain('Default carton flow')
    expect(wrapper.find('[data-testid="packaging-spec-filter-model"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="packaging-spec-create-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid^="packaging-spec-row-"]').exists()).toBe(false)
  })

  it('filters, creates, edits status, and hard deletes PackagingMethod rows', async () => {
    const page = (await import('./item-packaging-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    await wrapper.get('[data-testid="packaging-method-filter-keyword"]').setValue('STD')
    await wrapper.get('[data-testid="packaging-method-filter-status"]').setValue('ACTIVE')
    await wrapper.get('[data-testid="packaging-method-filter-submit"]').trigger('click')
    await flushPromises()

    expect(listManagedPackagingMethodsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: 'STD',
      status: 'ACTIVE'
    })

    await wrapper.get('[data-testid="packaging-method-create-button"]').trigger('click')
    await wrapper.get('[data-testid="packaging-method-code"]').setValue('ECOM')
    await wrapper.get('[data-testid="packaging-method-name"]').setValue('E-commerce')
    await wrapper
      .get('[data-testid="packaging-method-description"]')
      .setValue(' Online parcel packaging ')
    await wrapper.get('[data-testid="packaging-method-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedPackagingMethodApi).toHaveBeenCalledWith('tenant-1', {
      description: 'Online parcel packaging',
      methodCode: 'ECOM',
      methodName: 'E-commerce'
    })

    await wrapper.get('[data-testid="packaging-method-edit-method-1"]').trigger('click')
    await wrapper.get('[data-testid="packaging-method-code"]').setValue('STD-REV')
    await wrapper.get('[data-testid="packaging-method-name"]').setValue('Standard Rev')
    await wrapper
      .get('[data-testid="packaging-method-description"]')
      .setValue(' Updated carton flow ')
    await wrapper.get('[data-testid="packaging-method-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="packaging-method-submit"]').trigger('click')
    await flushPromises()

    expect(updateManagedPackagingMethodApi).toHaveBeenCalledWith('tenant-1', 'method-1', {
      description: 'Updated carton flow',
      methodCode: 'STD-REV',
      methodName: 'Standard Rev'
    })
    expect(changeManagedPackagingMethodStatusApi).toHaveBeenCalledWith('tenant-1', 'method-1', {
      status: 'INACTIVE'
    })

    await wrapper.get('[data-testid="packaging-method-delete-method-1"]').trigger('click')
    await flushPromises()

    expect(deleteManagedPackagingMethodApi).toHaveBeenCalledWith('tenant-1', 'method-1')
    expect(listManagedPackagingSpecsApi).not.toHaveBeenCalled()
  })

  it('renders PackagingMethod row actions with the shared dropdown action pattern', async () => {
    const page = (await import('./item-packaging-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(wrapper.find('button[aria-label="包装方式操作"]').exists()).toBe(true)
    expect(wrapper.find('[data-icon="ant-design:more-outlined"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="packaging-method-edit-method-1"]').text()).toContain('编辑')
    expect(wrapper.get('[data-testid="packaging-method-delete-method-1"]').text()).toContain(
      '硬删除'
    )
  })

  it('resizes PackagingMethod table columns from the header drag handle', async () => {
    const page = (await import('./item-packaging-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    const methodNameHeader = wrapper.get('[data-testid="ant-table-header-cell-methodName"]')
    expect(methodNameHeader.attributes('style')).toContain('width: 220px')

    await wrapper
      .get('[data-testid="packaging-method-column-resize-methodName"]')
      .trigger('mousedown', { clientX: 100 })

    expect(document.body.classList.contains('item-packaging-management--resizing-column')).toBe(
      true
    )

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 148 }))
    await nextTick()

    expect(methodNameHeader.attributes('style')).toContain('width: 268px')

    document.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()

    expect(document.body.classList.contains('item-packaging-management--resizing-column')).toBe(
      false
    )
  })
})
