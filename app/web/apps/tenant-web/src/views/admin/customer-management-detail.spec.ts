/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const bindManagedCustomerAccountToTenantPartyApi = vi.fn()
const changeManagedCustomerStatusApi = vi.fn()
const getManagedCustomerAccountByIdApi = vi.fn()
const updateManagedCustomerAccountBasicsApi = vi.fn()
const upsertManagedCustomerAddressApi = vi.fn()
const upsertManagedCustomerContactApi = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'crm.customer_account.get_by_id',
    'crm.customer_account.update_basics',
    'crm.customer_account.bind_tenant_party',
    'crm.customer_contact.upsert',
    'crm.customer_address.upsert',
    'crm.customer_account.change_status'
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
  bindManagedCustomerAccountToTenantPartyApi,
  changeManagedCustomerStatusApi,
  getManagedCustomerAccountByIdApi,
  updateManagedCustomerAccountBasicsApi,
  upsertManagedCustomerAddressApi,
  upsertManagedCustomerContactApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => useRoute()
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

// Verifies the phase 1 detail page wires basics, primary binding, contact upsert, address upsert, and status switching to the thin BFF contract.
describe('customer management detail page', () => {
  beforeEach(() => {
    bindManagedCustomerAccountToTenantPartyApi.mockReset()
    changeManagedCustomerStatusApi.mockReset()
    getManagedCustomerAccountByIdApi.mockReset()
    updateManagedCustomerAccountBasicsApi.mockReset()
    upsertManagedCustomerAddressApi.mockReset()
    upsertManagedCustomerContactApi.mockReset()

    useRoute.mockReturnValue({
      params: {
        customerAccountId: 'customer-1'
      }
    })

    getManagedCustomerAccountByIdApi.mockResolvedValue({
      customerAccount: {
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
      },
      contacts: [
        {
          customerContactId: 'contact-1',
          customerAccountId: 'customer-1',
          displayName: 'Alice',
          roleTitle: 'Purchasing Manager',
          email: 'alice@example.com',
          phone: '123456',
          isPrimaryContact: true,
          isActive: true
        }
      ],
      addresses: [
        {
          customerAddressId: 'address-1',
          customerAccountId: 'customer-1',
          label: 'HQ',
          countryCode: 'CN',
          region: 'Shanghai',
          locality: 'Pudong',
          addressLine1: 'Line 1',
          addressLine2: 'Line 2',
          postalCode: '200000',
          isPrimaryAddress: true,
          isActive: true
        }
      ]
    })
    updateManagedCustomerAccountBasicsApi.mockResolvedValue({})
    bindManagedCustomerAccountToTenantPartyApi.mockResolvedValue({})
    upsertManagedCustomerContactApi.mockResolvedValue({})
    upsertManagedCustomerAddressApi.mockResolvedValue({})
    changeManagedCustomerStatusApi.mockResolvedValue({})
  })

  it('loads all phase 1 detail sections and saves basics, primary binding, contact, address, and status', async () => {
    const page = (await import('./customer-management-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getManagedCustomerAccountByIdApi).toHaveBeenCalledWith('tenant-1', 'customer-1')
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('HQ')

    await wrapper.get('[data-testid="detail-customer-display-name"]').setValue('Alpha Manufacturing Rev')
    await wrapper.get('[data-testid="detail-customer-category"]').setValue('OEM')
    await wrapper.get('[data-testid="detail-customer-tags"]').setValue('priority')
    await wrapper.get('[data-testid="detail-save-basics"]').trigger('click')

    await wrapper.get('[data-testid="detail-bind-tenant-party"]').setValue('party-2')
    await wrapper.get('[data-testid="detail-save-binding"]').trigger('click')

    await wrapper.get('[data-testid="detail-contact-name"]').setValue('Bob')
    await wrapper.get('[data-testid="detail-contact-role"]').setValue('Buyer')
    await wrapper.get('[data-testid="detail-contact-email"]').setValue('bob@example.com')
    await wrapper.get('[data-testid="detail-contact-phone"]').setValue('654321')
    await wrapper.get('[data-testid="detail-contact-primary"]').setValue(true)
    await wrapper.get('[data-testid="detail-save-contact"]').trigger('click')

    await wrapper.get('[data-testid="detail-address-label"]').setValue('Factory')
    await wrapper.get('[data-testid="detail-address-country"]').setValue('CN')
    await wrapper.get('[data-testid="detail-address-region"]').setValue('Jiangsu')
    await wrapper.get('[data-testid="detail-address-locality"]').setValue('Suzhou')
    await wrapper.get('[data-testid="detail-address-line1"]').setValue('Factory Line 1')
    await wrapper.get('[data-testid="detail-address-line2"]').setValue('Factory Line 2')
    await wrapper.get('[data-testid="detail-address-postal"]').setValue('215000')
    await wrapper.get('[data-testid="detail-address-primary"]').setValue(true)
    await wrapper.get('[data-testid="detail-save-address"]').trigger('click')

    await wrapper.get('[data-testid="detail-customer-status"]').setValue('BLOCKED')
    await wrapper.get('[data-testid="detail-save-status"]').trigger('click')

    await flushPromises()

    expect(updateManagedCustomerAccountBasicsApi).toHaveBeenCalledWith('tenant-1', 'customer-1', {
      customerCategory: 'OEM',
      displayName: 'Alpha Manufacturing Rev',
      tags: ['priority']
    })
    expect(bindManagedCustomerAccountToTenantPartyApi).toHaveBeenCalledWith(
      'tenant-1',
      'customer-1',
      {
        tenantPartyId: 'party-2'
      }
    )
    expect(upsertManagedCustomerContactApi).toHaveBeenCalledWith('tenant-1', 'customer-1', {
      customerContactId: undefined,
      displayName: 'Bob',
      email: 'bob@example.com',
      isActive: true,
      isPrimaryContact: true,
      phone: '654321',
      roleTitle: 'Buyer'
    })
    expect(upsertManagedCustomerAddressApi).toHaveBeenCalledWith('tenant-1', 'customer-1', {
      addressLine1: 'Factory Line 1',
      addressLine2: 'Factory Line 2',
      countryCode: 'CN',
      customerAddressId: undefined,
      isActive: true,
      isPrimaryAddress: true,
      label: 'Factory',
      locality: 'Suzhou',
      postalCode: '215000',
      region: 'Jiangsu'
    })
    expect(changeManagedCustomerStatusApi).toHaveBeenCalledWith('tenant-1', 'customer-1', {
      status: 'BLOCKED'
    })
    expect(wrapper.text()).toContain('Deferred / 引用说明')
  })
})
