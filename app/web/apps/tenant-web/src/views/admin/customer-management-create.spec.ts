/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createManagedCustomerAccountApi = vi.fn()
const push = vi.fn()

const authContextState: any = {
  actionCodes: ['crm.customer_account.create'],
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
  createManagedCustomerAccountApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
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

// Verifies the phase 1 customer create page only submits the frozen creation fields and returns to the detail route.
describe('customer management create page', () => {
  beforeEach(() => {
    createManagedCustomerAccountApi.mockReset()
    push.mockReset()
    createManagedCustomerAccountApi.mockResolvedValue({
      customerAccountId: 'customer-1'
    })
  })

  it('creates one phase 1 customer account and redirects to the new detail page', async () => {
    const page = (await import('./customer-management-create.vue')).default
    const wrapper = mount(page)

    await wrapper.get('[data-testid="create-customer-display-name"]').setValue('Alpha Manufacturing')
    await wrapper.get('[data-testid="create-customer-category"]').setValue('DISTRIBUTOR')
    await wrapper.get('[data-testid="create-customer-tags"]').setValue('key, cn')
    await wrapper.get('[data-testid="create-customer-submit"]').trigger('click')

    await flushPromises()

    expect(createManagedCustomerAccountApi).toHaveBeenCalledWith('tenant-1', {
      customerCategory: 'DISTRIBUTOR',
      displayName: 'Alpha Manufacturing',
      tags: ['key', 'cn']
    })
    expect(push).toHaveBeenCalledWith({
      name: 'TenantCustomerManagementDetail',
      params: {
        customerAccountId: 'customer-1'
      }
    })
    expect(wrapper.text()).toContain('Deferred')
  })
})
