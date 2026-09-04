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

// Verifies the tenant-web supplier-management API client stays aligned with the gateway phase 1 BFF surface.
describe('tenant-web supplier management api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    request.mockReset()
  })

  it('lists supplier directories, one supplier detail aggregate, and offering pages from the tenant-scoped entry', async () => {
    const {
      getManagedSupplierByIdApi,
      listManagedSupplierOfferingsByItemApi,
      listManagedSupplierOfferingsBySupplierApi,
      listManagedSuppliersApi
    } = await import('../../../../src/api/bff/supplier-management/index')

    await listManagedSuppliersApi('tenant-1', {
      keyword: 'alpha',
      page: 2,
      pageSize: 10,
      status: 'ACTIVE',
      tenantPartyId: 'party-1'
    })
    await getManagedSupplierByIdApi('tenant-1', 'supplier-1')
    await listManagedSupplierOfferingsBySupplierApi('tenant-1', 'supplier-1', {
      page: 1,
      pageSize: 20,
      status: 'ACTIVE'
    })
    await listManagedSupplierOfferingsByItemApi('tenant-1', 'item-1', {
      page: 1,
      pageSize: 20,
      status: 'ACTIVE'
    })

    expect(get).toHaveBeenCalledWith('/supplier-management/tenants/tenant-1/suppliers', {
      params: {
        keyword: 'alpha',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        tenantPartyId: 'party-1'
      }
    })
    expect(get).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/suppliers/supplier-1'
    )
    expect(get).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/suppliers/supplier-1/offerings',
      {
        params: {
          page: 1,
          pageSize: 20,
          status: 'ACTIVE'
        }
      }
    )
    expect(get).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/items/item-1/offerings',
      {
        params: {
          page: 1,
          pageSize: 20,
          status: 'ACTIVE'
        }
      }
    )
  })

  it('creates and mutates phase 1 suppliers without widening the SRM contract surface', async () => {
    const {
      bindManagedSupplierToTenantPartyApi,
      changeManagedSupplierStatusApi,
      createManagedSupplierApi,
      updateManagedSupplierBasicsApi,
      upsertManagedSupplierAddressApi,
      upsertManagedSupplierContactApi,
      upsertManagedSupplierOfferingApi
    } = await import('../../../../src/api/bff/supplier-management/index')

    await createManagedSupplierApi('tenant-1', {
      displayName: 'Alpha Supply',
      supplierCategory: 'RAW_MATERIAL',
      supplierNo: 'SUP-001',
      tags: ['strategic']
    })
    await updateManagedSupplierBasicsApi('tenant-1', 'supplier-1', {
      displayName: 'Alpha Supply Rev',
      supplierCategory: 'PACKAGING',
      supplierNo: 'SUP-001',
      tags: ['priority']
    })
    await bindManagedSupplierToTenantPartyApi('tenant-1', 'supplier-1', {
      tenantPartyId: 'party-1'
    })
    await upsertManagedSupplierContactApi('tenant-1', 'supplier-1', {
      displayName: 'Alice',
      email: 'alice@example.com',
      isActive: true,
      isPrimaryContact: true,
      phone: '123456',
      roleTitle: 'Sales Manager',
      supplierContactId: 'contact-1'
    })
    await upsertManagedSupplierAddressApi('tenant-1', 'supplier-1', {
      addressLine1: 'Line 1',
      addressLine2: 'Line 2',
      countryCode: 'CN',
      isActive: true,
      isPrimaryAddress: true,
      label: 'HQ',
      locality: 'Pudong',
      postalCode: '200000',
      region: 'Shanghai',
      supplierAddressId: 'address-1'
    })
    await changeManagedSupplierStatusApi('tenant-1', 'supplier-1', {
      status: 'ACTIVE'
    })
    await upsertManagedSupplierOfferingApi('tenant-1', 'supplier-1', {
      itemId: 'item-1',
      status: 'ACTIVE',
      supplierOfferingId: 'offering-1'
    })

    expect(post).toHaveBeenCalledWith('/supplier-management/tenants/tenant-1/suppliers', {
      displayName: 'Alpha Supply',
      supplierCategory: 'RAW_MATERIAL',
      supplierNo: 'SUP-001',
      tags: ['strategic']
    })
    expect(request).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/suppliers/supplier-1/basics',
      {
        data: {
          displayName: 'Alpha Supply Rev',
          supplierCategory: 'PACKAGING',
          supplierNo: 'SUP-001',
          tags: ['priority']
        },
        method: 'PATCH'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/suppliers/supplier-1/tenant-party-binding',
      {
        tenantPartyId: 'party-1'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/suppliers/supplier-1/contacts',
      {
        displayName: 'Alice',
        email: 'alice@example.com',
        isActive: true,
        isPrimaryContact: true,
        phone: '123456',
        roleTitle: 'Sales Manager',
        supplierContactId: 'contact-1'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/suppliers/supplier-1/addresses',
      {
        addressLine1: 'Line 1',
        addressLine2: 'Line 2',
        countryCode: 'CN',
        isActive: true,
        isPrimaryAddress: true,
        label: 'HQ',
        locality: 'Pudong',
        postalCode: '200000',
        region: 'Shanghai',
        supplierAddressId: 'address-1'
      }
    )
    expect(request).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/suppliers/supplier-1/status',
      {
        data: {
          status: 'ACTIVE'
        },
        method: 'PATCH'
      }
    )
    expect(post).toHaveBeenCalledWith(
      '/supplier-management/tenants/tenant-1/suppliers/supplier-1/offerings',
      {
        itemId: 'item-1',
        status: 'ACTIVE',
        supplierOfferingId: 'offering-1'
      }
    )
  })
})
