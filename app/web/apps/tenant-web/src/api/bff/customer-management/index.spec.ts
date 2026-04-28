import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const request = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    request
  }
}))

// Verifies the tenant-web customer-management API client stays aligned with the gateway phase 1 BFF surface.
describe('tenant-web customer management api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    request.mockReset()
  })

  it('lists customer directories, selector results, and one customer detail aggregate from the tenant-scoped entry', async () => {
    const {
      getManagedCustomerAccountByIdApi,
      listManagedCustomerAccountsApi,
      listSelectableCustomersApi
    } = await import('./index')

    await listManagedCustomerAccountsApi('tenant-1', {
      keyword: 'alpha',
      page: 2,
      pageSize: 10,
      primaryTenantPartyId: 'party-1',
      status: 'ACTIVE_CUSTOMER'
    })
    await listSelectableCustomersApi('tenant-1', {
      keyword: 'alpha',
      page: 1,
      pageSize: 20
    })
    await getManagedCustomerAccountByIdApi('tenant-1', 'customer-1')

    expect(get).toHaveBeenCalledWith('/customer-management/tenants/tenant-1/customers', {
      params: {
        keyword: 'alpha',
        page: 2,
        pageSize: 10,
        primaryTenantPartyId: 'party-1',
        status: 'ACTIVE_CUSTOMER'
      }
    })
    expect(get).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/selectable-customers',
      {
        params: {
          keyword: 'alpha',
          page: 1,
          pageSize: 20
        }
      }
    )
    expect(get).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/customers/customer-1'
    )
  })

  it('creates and mutates phase 1 customer accounts without widening the CRM contract surface', async () => {
    const {
      bindManagedCustomerAccountToTenantPartyApi,
      changeManagedCustomerStatusApi,
      createManagedCustomerAccountApi,
      updateManagedCustomerAccountBasicsApi,
      upsertManagedCustomerAddressApi,
      upsertManagedCustomerContactApi
    } = await import('./index')

    await createManagedCustomerAccountApi('tenant-1', {
      customerCategory: 'DISTRIBUTOR',
      displayName: 'Alpha Manufacturing',
      tags: ['key']
    })
    await updateManagedCustomerAccountBasicsApi('tenant-1', 'customer-1', {
      customerCategory: 'OEM',
      displayName: 'Alpha Manufacturing Rev',
      tags: ['priority']
    })
    await bindManagedCustomerAccountToTenantPartyApi('tenant-1', 'customer-1', {
      tenantPartyId: 'party-1'
    })
    await upsertManagedCustomerContactApi('tenant-1', 'customer-1', {
      customerContactId: 'contact-1',
      displayName: 'Alice',
      email: 'alice@example.com',
      isActive: true,
      isPrimaryContact: true,
      phone: '123456',
      roleTitle: 'Purchasing Manager'
    })
    await upsertManagedCustomerAddressApi('tenant-1', 'customer-1', {
      addressLine1: 'Line 1',
      addressLine2: 'Line 2',
      countryCode: 'CN',
      customerAddressId: 'address-1',
      isActive: true,
      isPrimaryAddress: true,
      label: 'HQ',
      locality: 'Pudong',
      postalCode: '200000',
      region: 'Shanghai'
    })
    await changeManagedCustomerStatusApi('tenant-1', 'customer-1', {
      status: 'BLOCKED'
    })

    expect(post).toHaveBeenCalledWith('/customer-management/tenants/tenant-1/customers', {
      customerCategory: 'DISTRIBUTOR',
      displayName: 'Alpha Manufacturing',
      tags: ['key']
    })
    expect(request).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/customers/customer-1/basics',
      {
        data: {
          customerCategory: 'OEM',
          displayName: 'Alpha Manufacturing Rev',
          tags: ['priority']
        },
        method: 'PATCH'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/customers/customer-1/tenant-party-binding',
      {
        tenantPartyId: 'party-1'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/customers/customer-1/contacts',
      {
        customerContactId: 'contact-1',
        displayName: 'Alice',
        email: 'alice@example.com',
        isActive: true,
        isPrimaryContact: true,
        phone: '123456',
        roleTitle: 'Purchasing Manager'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/customers/customer-1/addresses',
      {
        addressLine1: 'Line 1',
        addressLine2: 'Line 2',
        countryCode: 'CN',
        customerAddressId: 'address-1',
        isActive: true,
        isPrimaryAddress: true,
        label: 'HQ',
        locality: 'Pudong',
        postalCode: '200000',
        region: 'Shanghai'
      }
    )
    expect(request).toHaveBeenCalledWith(
      '/customer-management/tenants/tenant-1/customers/customer-1/status',
      {
        data: {
          status: 'BLOCKED'
        },
        method: 'PATCH'
      }
    )
  })
})
