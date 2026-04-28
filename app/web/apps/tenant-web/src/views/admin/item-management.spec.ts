/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const listManagedItemsApi = vi.fn()
const push = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'item_master.item.list',
    'item_master.item.get_by_id',
    'item_master.item.create'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.item-management']
}

vi.mock('#/api', () => ({
  listManagedItemsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute(),
  useRouter: () => ({
    push
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

// Verifies the item management list page keeps filters, navigation, and tenant-scoped directory loading aligned with the BFF.
describe('item management list page', () => {
  beforeEach(() => {
    listManagedItemsApi.mockReset()
    push.mockReset()
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'master-data.item-management'
      }
    })
    listManagedItemsApi.mockResolvedValue({
      items: [
        {
          itemId: 'item-1',
          itemCode: 'BUNDLE-001',
          itemName: 'Starter Bundle',
          structureType: 'BUNDLE',
          natureType: 'VIRTUAL',
          status: 'ACTIVE',
          capabilities: {
            sellable: true,
            purchasable: false,
            stockable: false,
            manufacturable: false
          }
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
  })

  it('loads the tenant item directory, applies filters, and navigates to create/detail routes', async () => {
    const page = (await import('./item-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedItemsApi).toHaveBeenCalledWith('tenant-1', {
      capability: undefined,
      keyword: undefined,
      natureType: undefined,
      page: 1,
      pageSize: 20,
      status: undefined,
      structureType: undefined
    })
    expect(wrapper.text()).toContain('Starter Bundle')

    await wrapper.get('[data-testid="item-filter-keyword"]').setValue('starter')
    await wrapper.get('[data-testid="item-filter-capability"]').setValue('sellable')
    await wrapper.get('[data-testid="item-filter-structure"]').setValue('BUNDLE')
    await wrapper.get('[data-testid="item-filter-nature"]').setValue('VIRTUAL')
    await wrapper.get('[data-testid="item-filter-status"]').setValue('ACTIVE')
    await wrapper.get('[data-testid="item-filter-search"]').trigger('click')

    expect(listManagedItemsApi).toHaveBeenLastCalledWith('tenant-1', {
      capability: 'sellable',
      keyword: 'starter',
      natureType: 'VIRTUAL',
      page: 1,
      pageSize: 20,
      status: 'ACTIVE',
      structureType: 'BUNDLE'
    })

    await wrapper.get('[data-testid="item-create-button"]').trigger('click')
    await wrapper.get('[data-testid="item-detail-button-item-1"]').trigger('click')

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantItemManagementCreate'
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantItemManagementDetail',
      params: {
        itemId: 'item-1'
      }
    })
  })
})
