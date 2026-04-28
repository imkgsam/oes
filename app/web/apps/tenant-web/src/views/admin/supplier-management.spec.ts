/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const listManagedSuppliersApi = vi.fn()
const push = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'srm.supplier_profile.list',
    'srm.supplier_profile.get_by_id',
    'srm.supplier_profile.create'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.supplier-management']
}

vi.mock('#/api', () => ({
  listManagedSuppliersApi
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

// Verifies the supplier management list page keeps filters, navigation, and tenant-scoped directory loading aligned with the BFF.
describe('supplier management list page', () => {
  beforeEach(() => {
    listManagedSuppliersApi.mockReset()
    push.mockReset()
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'master-data.supplier-management'
      }
    })
    listManagedSuppliersApi.mockResolvedValue({
      suppliers: [
        {
          supplierId: 'supplier-1',
          supplierNo: 'SUP-001',
          tenantId: 'tenant-1',
          displayName: 'Alpha Supply',
          status: 'ACTIVE',
          supplierCategory: 'RAW_MATERIAL',
          tags: ['strategic', 'cn'],
          partyBinding: {
            tenantPartyId: 'party-1',
            bindingStatus: 'ACTIVE',
            partyDisplayName: 'Alpha Party'
          }
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
  })

  it('loads the tenant supplier directory, applies filters, and navigates to create/detail routes', async () => {
    const page = (await import('./supplier-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedSuppliersApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      status: undefined,
      tenantPartyId: undefined
    })
    expect(wrapper.text()).toContain('Alpha Supply')

    await wrapper.get('[data-testid="supplier-filter-keyword"]').setValue('alpha')
    await wrapper.get('[data-testid="supplier-filter-status"]').setValue('ACTIVE')
    await wrapper.get('[data-testid="supplier-filter-party"]').setValue('party-1')
    await wrapper.get('[data-testid="supplier-filter-search"]').trigger('click')

    expect(listManagedSuppliersApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: 'alpha',
      page: 1,
      pageSize: 20,
      status: 'ACTIVE',
      tenantPartyId: 'party-1'
    })

    await wrapper.get('[data-testid="supplier-create-button"]').trigger('click')
    await wrapper.get('[data-testid="supplier-detail-button-supplier-1"]').trigger('click')

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantSupplierManagementCreate'
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantSupplierManagementDetail',
      params: {
        supplierId: 'supplier-1'
      }
    })
  })
})
