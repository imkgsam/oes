/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const listManagedCustomerAccountsApi = vi.fn()
const push = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'crm.customer_account.list',
    'crm.customer_account.get_by_id',
    'crm.customer_account.create'
  ],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['master-data.customer-management']
}

vi.mock('#/api', () => ({
  listManagedCustomerAccountsApi
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

// Verifies the customer management list page keeps filters, navigation, and tenant-scoped directory loading aligned with the BFF.
describe('customer management list page', () => {
  beforeEach(() => {
    listManagedCustomerAccountsApi.mockReset()
    push.mockReset()
    useRoute.mockReturnValue({
      meta: {
        entryKey: 'master-data.customer-management'
      }
    })
    listManagedCustomerAccountsApi.mockResolvedValue({
      customerAccounts: [
        {
          customerAccountId: 'customer-1',
          customerAccountNo: 'CUST-001',
          tenantId: 'tenant-1',
          displayName: 'Alpha Manufacturing',
          status: 'ACTIVE_CUSTOMER',
          customerCategory: 'DISTRIBUTOR',
          tags: ['key', 'cn'],
          primaryBinding: {
            customerPartyBindingId: 'binding-1',
            tenantPartyId: 'party-1',
            bindingStatus: 'ACTIVE_PRIMARY',
            partyDisplayName: 'Alpha Party'
          }
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
  })

  it('loads the tenant customer directory, applies filters, and navigates to create/detail routes', async () => {
    const page = (await import('./customer-management.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listManagedCustomerAccountsApi).toHaveBeenCalledWith('tenant-1', {
      keyword: undefined,
      page: 1,
      pageSize: 20,
      primaryTenantPartyId: undefined,
      status: undefined
    })
    expect(wrapper.text()).toContain('Alpha Manufacturing')

    await wrapper.get('[data-testid="customer-filter-keyword"]').setValue('alpha')
    await wrapper.get('[data-testid="customer-filter-status"]').setValue('ACTIVE_CUSTOMER')
    await wrapper.get('[data-testid="customer-filter-party"]').setValue('party-1')
    await wrapper.get('[data-testid="customer-filter-search"]').trigger('click')

    expect(listManagedCustomerAccountsApi).toHaveBeenLastCalledWith('tenant-1', {
      keyword: 'alpha',
      page: 1,
      pageSize: 20,
      primaryTenantPartyId: 'party-1',
      status: 'ACTIVE_CUSTOMER'
    })

    await wrapper.get('[data-testid="customer-create-button"]').trigger('click')
    await wrapper.get('[data-testid="customer-detail-button-customer-1"]').trigger('click')

    expect(push).toHaveBeenNthCalledWith(1, {
      name: 'TenantCustomerManagementCreate'
    })
    expect(push).toHaveBeenNthCalledWith(2, {
      name: 'TenantCustomerManagementDetail',
      params: {
        customerAccountId: 'customer-1'
      }
    })
  })
})
