/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const bindManagedSupplierToTenantPartyApi = vi.fn()
const changeManagedSupplierStatusApi = vi.fn()
const getManagedSupplierByIdApi = vi.fn()
const updateManagedSupplierBasicsApi = vi.fn()
const upsertManagedSupplierAddressApi = vi.fn()
const upsertManagedSupplierContactApi = vi.fn()
const upsertManagedSupplierOfferingApi = vi.fn()
const useRoute = vi.fn()

const authContextState: any = {
  actionCodes: [
    'srm.supplier_profile.get_by_id',
    'srm.supplier_profile.update_basics',
    'srm.supplier_profile.bind_tenant_party',
    'srm.supplier_contact.upsert',
    'srm.supplier_address.upsert',
    'srm.supplier_profile.change_status',
    'srm.supplier_offering.upsert'
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
  bindManagedSupplierToTenantPartyApi,
  changeManagedSupplierStatusApi,
  getManagedSupplierByIdApi,
  updateManagedSupplierBasicsApi,
  upsertManagedSupplierAddressApi,
  upsertManagedSupplierContactApi,
  upsertManagedSupplierOfferingApi
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

// Verifies the phase 1 supplier detail page wires basics, binding, contacts, addresses, status, and offering upsert to the thin BFF contract.
describe('supplier management detail page', () => {
  beforeEach(() => {
    bindManagedSupplierToTenantPartyApi.mockReset()
    changeManagedSupplierStatusApi.mockReset()
    getManagedSupplierByIdApi.mockReset()
    updateManagedSupplierBasicsApi.mockReset()
    upsertManagedSupplierAddressApi.mockReset()
    upsertManagedSupplierContactApi.mockReset()
    upsertManagedSupplierOfferingApi.mockReset()

    useRoute.mockReturnValue({
      params: {
        supplierId: 'supplier-1'
      }
    })

    getManagedSupplierByIdApi.mockResolvedValue({
      supplier: {
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
      },
      contacts: [
        {
          supplierContactId: 'contact-1',
          supplierId: 'supplier-1',
          displayName: 'Alice',
          roleTitle: 'Sales Manager',
          email: 'alice@example.com',
          phone: '123456',
          isPrimaryContact: true,
          isActive: true
        }
      ],
      addresses: [
        {
          supplierAddressId: 'address-1',
          supplierId: 'supplier-1',
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
      ],
      offerings: [
        {
          supplierOfferingId: 'offering-1',
          supplierId: 'supplier-1',
          itemId: 'item-1',
          itemCode: 'ITEM-001',
          itemName: 'Steel Coil',
          status: 'ACTIVE'
        }
      ]
    })
    updateManagedSupplierBasicsApi.mockResolvedValue({})
    bindManagedSupplierToTenantPartyApi.mockResolvedValue({})
    upsertManagedSupplierContactApi.mockResolvedValue({})
    upsertManagedSupplierAddressApi.mockResolvedValue({})
    upsertManagedSupplierOfferingApi.mockResolvedValue({})
    changeManagedSupplierStatusApi.mockResolvedValue({})
  })

  it('loads all phase 1 detail sections and saves basics, binding, contacts, addresses, status, and offerings', async () => {
    const page = (await import('./supplier-management-detail.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(getManagedSupplierByIdApi).toHaveBeenCalledWith('tenant-1', 'supplier-1')
    expect(wrapper.text()).toContain('Steel Coil')

    await wrapper.get('[data-testid="detail-supplier-display-name"]').setValue('Alpha Supply Rev')
    await wrapper.get('[data-testid="detail-supplier-no"]').setValue('SUP-001-REV')
    await wrapper.get('[data-testid="detail-supplier-category"]').setValue('PACKAGING')
    await wrapper.get('[data-testid="detail-supplier-tags"]').setValue('priority, cn')
    await wrapper.get('[data-testid="detail-save-basics"]').trigger('click')

    await wrapper.get('[data-testid="detail-bind-tenant-party"]').setValue('party-2')
    await wrapper.get('[data-testid="detail-save-binding"]').trigger('click')

    await wrapper.get('[data-testid="detail-edit-contact-contact-1"]').trigger('click')
    await wrapper.get('[data-testid="detail-contact-name"]').setValue('Alice Rev')
    await wrapper.get('[data-testid="detail-save-contact"]').trigger('click')

    await wrapper.get('[data-testid="detail-edit-address-address-1"]').trigger('click')
    await wrapper.get('[data-testid="detail-address-label"]').setValue('Warehouse')
    await wrapper.get('[data-testid="detail-save-address"]').trigger('click')

    await wrapper.get('[data-testid="detail-edit-offering-offering-1"]').trigger('click')
    await wrapper.get('[data-testid="detail-offering-item-id"]').setValue('item-2')
    await wrapper.get('[data-testid="detail-offering-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="detail-save-offering"]').trigger('click')

    await wrapper.get('[data-testid="detail-supplier-status"]').setValue('INACTIVE')
    await wrapper.get('[data-testid="detail-save-status"]').trigger('click')

    await flushPromises()

    expect(updateManagedSupplierBasicsApi).toHaveBeenCalledWith('tenant-1', 'supplier-1', {
      displayName: 'Alpha Supply Rev',
      supplierNo: 'SUP-001-REV',
      supplierCategory: 'PACKAGING',
      tags: ['priority', 'cn']
    })
    expect(bindManagedSupplierToTenantPartyApi).toHaveBeenCalledWith('tenant-1', 'supplier-1', {
      tenantPartyId: 'party-2'
    })
    expect(upsertManagedSupplierContactApi).toHaveBeenCalledWith('tenant-1', 'supplier-1', {
      supplierContactId: 'contact-1',
      displayName: 'Alice Rev',
      roleTitle: 'Sales Manager',
      email: 'alice@example.com',
      phone: '123456',
      isPrimaryContact: true,
      isActive: true
    })
    expect(upsertManagedSupplierAddressApi).toHaveBeenCalledWith('tenant-1', 'supplier-1', {
      supplierAddressId: 'address-1',
      label: 'Warehouse',
      countryCode: 'CN',
      region: 'Shanghai',
      locality: 'Pudong',
      addressLine1: 'Line 1',
      addressLine2: 'Line 2',
      postalCode: '200000',
      isPrimaryAddress: true,
      isActive: true
    })
    expect(upsertManagedSupplierOfferingApi).toHaveBeenCalledWith('tenant-1', 'supplier-1', {
      supplierOfferingId: 'offering-1',
      itemId: 'item-2',
      status: 'INACTIVE'
    })
    expect(changeManagedSupplierStatusApi).toHaveBeenCalledWith('tenant-1', 'supplier-1', {
      status: 'INACTIVE'
    })
  })
})
