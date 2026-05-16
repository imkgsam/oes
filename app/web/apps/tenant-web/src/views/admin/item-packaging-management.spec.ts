/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changeManagedPackagingMethodStatusApi = vi.fn()
const changeManagedPackagingSpecStatusApi = vi.fn()
const createManagedPackagingMethodApi = vi.fn()
const createManagedPackagingSpecApi = vi.fn()
const listManagedItemModelsApi = vi.fn()
const listManagedPackagingMethodsApi = vi.fn()
const listManagedPackagingSpecsApi = vi.fn()
const updateManagedPackagingMethodApi = vi.fn()
const updateManagedPackagingSpecApi = vi.fn()
const routeState: any = {
  query: {}
}

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
  listManagedItemModelsApi,
  listManagedPackagingMethodsApi,
  listManagedPackagingSpecsApi,
  updateManagedPackagingMethodApi,
  updateManagedPackagingSpecApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('ant-design-vue', async () => await import('./__tests__/ant-design-vue-mock'))

// Verifies the standalone packaging page owns PackagingMethod and PackagingSpec maintenance.
describe('item packaging management page', () => {
  beforeEach(() => {
    changeManagedPackagingMethodStatusApi.mockReset()
    changeManagedPackagingSpecStatusApi.mockReset()
    createManagedPackagingMethodApi.mockReset()
    createManagedPackagingSpecApi.mockReset()
    listManagedItemModelsApi.mockReset()
    listManagedPackagingMethodsApi.mockReset()
    listManagedPackagingSpecsApi.mockReset()
    updateManagedPackagingMethodApi.mockReset()
    updateManagedPackagingSpecApi.mockReset()
    routeState.query = {}

    listManagedItemModelsApi.mockResolvedValue({
      itemModels: [
        {
          itemModelId: 'model-1',
          modelCode: 'TOILET',
          modelName: 'One-piece Toilet',
          modelKind: 'PHYSICAL',
          modelType: 'FINISHED_PRODUCT',
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    listManagedPackagingMethodsApi.mockResolvedValue({
      packagingMethods: [
        {
          packagingMethodId: 'method-1',
          methodCode: 'STD',
          methodName: 'Standard',
          status: 'ACTIVE'
        }
      ]
    })
    listManagedPackagingSpecsApi.mockResolvedValue({
      packagingSpecs: [
        {
          packagingSpecId: 'spec-1',
          itemModelId: 'model-1',
          packagingMethodId: 'method-1',
          specCode: 'PKG-STD',
          specName: 'Standard box',
          grossWeight: '35',
          volume: '0.4',
          outerLength: '700',
          outerWidth: '420',
          outerHeight: '500',
          status: 'ACTIVE'
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    createManagedPackagingMethodApi.mockResolvedValue({
      packagingMethodId: 'method-2',
      methodCode: 'ECOM',
      methodName: 'E-commerce',
      status: 'ACTIVE'
    })
    updateManagedPackagingMethodApi.mockResolvedValue({
      packagingMethodId: 'method-1',
      methodCode: 'STD-REV',
      methodName: 'Standard Rev',
      status: 'ACTIVE'
    })
    changeManagedPackagingMethodStatusApi.mockResolvedValue({
      packagingMethodId: 'method-1',
      methodCode: 'STD-REV',
      methodName: 'Standard Rev',
      status: 'INACTIVE'
    })
    createManagedPackagingSpecApi.mockResolvedValue({
      packagingSpecId: 'spec-2',
      itemModelId: 'model-1',
      packagingMethodId: 'method-1',
      specCode: 'PKG-ECOM',
      specName: 'E-commerce box',
      status: 'ACTIVE'
    })
    updateManagedPackagingSpecApi.mockResolvedValue({
      packagingSpecId: 'spec-1',
      itemModelId: 'model-1',
      packagingMethodId: 'method-1',
      specCode: 'PKG-STD-REV',
      specName: 'Standard box Rev',
      status: 'ACTIVE'
    })
    changeManagedPackagingSpecStatusApi.mockResolvedValue({
      packagingSpecId: 'spec-1',
      itemModelId: 'model-1',
      packagingMethodId: 'method-1',
      specCode: 'PKG-STD-REV',
      specName: 'Standard box Rev',
      status: 'INACTIVE'
    })
  })

  it('loads methods and specs, filters specs, creates methods, and maintains selected spec details', async () => {
    const page = (await import('./item-packaging-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedPackagingMethodsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      status: undefined
    })
    expect(listManagedPackagingSpecsApi).toHaveBeenCalledWith('tenant-1', {
      customerId: undefined,
      itemModelId: undefined,
      keyword: undefined,
      packagingMethodId: undefined,
      page: 1,
      pageSize: 50,
      status: undefined
    })
    expect(wrapper.text()).toContain('Item 包装管理')
    expect(wrapper.text()).toContain('STD')
    expect(wrapper.text()).toContain('PKG-STD')

    await wrapper.get('[data-testid="packaging-spec-filter-model"]').setValue('model-1')
    await wrapper.get('[data-testid="packaging-spec-filter-method"]').setValue('method-1')
    await wrapper.get('[data-testid="packaging-spec-filter-status"]').setValue('ACTIVE')
    await wrapper.get('[data-testid="packaging-spec-filter-submit"]').trigger('click')

    expect(listManagedPackagingSpecsApi).toHaveBeenLastCalledWith('tenant-1', {
      customerId: undefined,
      itemModelId: 'model-1',
      keyword: undefined,
      packagingMethodId: 'method-1',
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })

    await wrapper.get('[data-testid="packaging-method-create-button"]').trigger('click')
    await wrapper.get('[data-testid="packaging-method-code"]').setValue('ECOM')
    await wrapper.get('[data-testid="packaging-method-name"]').setValue('E-commerce')
    await wrapper.get('[data-testid="packaging-method-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedPackagingMethodApi).toHaveBeenCalledWith('tenant-1', {
      methodCode: 'ECOM',
      methodName: 'E-commerce'
    })

    await wrapper.get('[data-testid="packaging-method-row-method-1"]').trigger('click')
    await wrapper.get('[data-testid="packaging-method-code"]').setValue('STD-REV')
    await wrapper.get('[data-testid="packaging-method-name"]').setValue('Standard Rev')
    await wrapper.get('[data-testid="packaging-method-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="packaging-method-submit"]').trigger('click')

    expect(updateManagedPackagingMethodApi).toHaveBeenCalledWith('tenant-1', 'method-1', {
      methodCode: 'STD-REV',
      methodName: 'Standard Rev'
    })
    expect(changeManagedPackagingMethodStatusApi).toHaveBeenCalledWith('tenant-1', 'method-1', {
      status: 'INACTIVE'
    })

    await wrapper.get('[data-testid="packaging-spec-create-button"]').trigger('click')
    await wrapper.get('[data-testid="packaging-spec-code"]').setValue('PKG-ECOM')
    await wrapper.get('[data-testid="packaging-spec-name"]').setValue('E-commerce box')
    await wrapper.get('[data-testid="packaging-spec-model"]').setValue('model-1')
    await wrapper.get('[data-testid="packaging-spec-method"]').setValue('method-1')
    await wrapper.get('[data-testid="packaging-spec-gross-weight"]').setValue('36')
    await wrapper.get('[data-testid="packaging-spec-submit"]').trigger('click')
    await flushPromises()

    expect(createManagedPackagingSpecApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        grossWeight: '36',
        itemModelId: 'model-1',
        packagingMethodId: 'method-1',
        specCode: 'PKG-ECOM',
        specName: 'E-commerce box'
      })
    )

    await wrapper.get('[data-testid="packaging-spec-row-spec-1"]').trigger('click')
    await wrapper.get('[data-testid="packaging-spec-code"]').setValue('PKG-STD-REV')
    await wrapper.get('[data-testid="packaging-spec-name"]').setValue('Standard box Rev')
    await wrapper.get('[data-testid="packaging-spec-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="packaging-spec-submit"]').trigger('click')

    expect(updateManagedPackagingSpecApi).toHaveBeenCalledWith(
      'tenant-1',
      'spec-1',
      expect.objectContaining({
        itemModelId: 'model-1',
        packagingMethodId: 'method-1',
        specCode: 'PKG-STD-REV',
        specName: 'Standard box Rev'
      })
    )
    expect(changeManagedPackagingSpecStatusApi).toHaveBeenCalledWith('tenant-1', 'spec-1', {
      status: 'INACTIVE'
    })
  })

  it('shows an empty state when no packaging specs exist', async () => {
    listManagedPackagingSpecsApi.mockResolvedValue({
      packagingSpecs: [],
      page: 1,
      pageSize: 50,
      total: 0
    })

    const page = (await import('./item-packaging-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(wrapper.text()).toContain('暂无包装规格')
  })

  it('applies ItemModel query filters when opened from the ItemModel workbench', async () => {
    routeState.query = {
      itemModelId: 'model-1'
    }

    const page = (await import('./item-packaging-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedPackagingSpecsApi).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({
        itemModelId: 'model-1'
      })
    )
    expect((wrapper.get('[data-testid="packaging-spec-filter-model"]').element as HTMLSelectElement).value).toBe('model-1')
  })
})
