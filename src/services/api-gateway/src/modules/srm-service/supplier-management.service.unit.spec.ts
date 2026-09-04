import { ForbiddenException } from '@nestjs/common'
import {
  SupplierOfferingStatus,
  SupplierPartyBindingStatus,
  SupplierStatus
} from '@oes/common/generated/srm_service'
import { SupplierManagementService } from './supplier-management.service'

// Verifies the gateway supplier-management service keeps tenant scope enforcement and phase 1 request mapping aligned with SRM contracts.
describe('SupplierManagementService', () => {
  const supplierQueryAdapter = {
    getSupplier: jest.fn(),
    listSupplierAddresses: jest.fn(),
    listSupplierContacts: jest.fn(),
    listSupplierOfferingsByItem: jest.fn(),
    listSupplierOfferingsBySupplier: jest.fn(),
    searchSuppliers: jest.fn()
  }
  const supplierManagementAdapter = {
    bindSupplierToTenantParty: jest.fn(),
    changeSupplierStatus: jest.fn(),
    createSupplierProfile: jest.fn(),
    updateSupplierProfileBasics: jest.fn(),
    upsertSupplierAddress: jest.fn(),
    upsertSupplierContact: jest.fn(),
    upsertSupplierOffering: jest.fn()
  }

  const service = new SupplierManagementService(
    supplierQueryAdapter as any,
    supplierManagementAdapter as any
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant supplier directory', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.searchSuppliers(
        'tenant-2',
        {
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(supplierQueryAdapter.searchSuppliers).not.toHaveBeenCalled()
  })

  it('maps supplier directory, detail aggregate, and offering-by-item queries into the SRM phase 1 gateway read model', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    supplierQueryAdapter.searchSuppliers.mockResolvedValue({
      suppliers: [
        {
          supplierId: 'supplier-1',
          supplierNo: 'SUP-001',
          tenantId: 'tenant-1',
          displayName: 'Alpha Supply',
          status: SupplierStatus.SUPPLIER_STATUS_ACTIVE,
          supplierCategory: 'RAW_MATERIAL',
          tags: ['strategic', 'cn'],
          partyBinding: {
            tenantPartyId: 'party-1',
            bindingStatus: SupplierPartyBindingStatus.SUPPLIER_PARTY_BINDING_STATUS_ACTIVE,
            partyDisplayName: 'Alpha Party'
          }
        }
      ],
      total: 1,
      page: 2,
      pageSize: 10
    })
    supplierQueryAdapter.getSupplier.mockResolvedValue({
      supplier: {
        supplierId: 'supplier-1',
        supplierNo: 'SUP-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Supply',
        status: SupplierStatus.SUPPLIER_STATUS_ACTIVE,
        supplierCategory: 'RAW_MATERIAL',
        tags: ['strategic', 'cn'],
        partyBinding: {
          tenantPartyId: 'party-1',
          bindingStatus: SupplierPartyBindingStatus.SUPPLIER_PARTY_BINDING_STATUS_ACTIVE,
          partyDisplayName: 'Alpha Party'
        }
      }
    })
    supplierQueryAdapter.listSupplierContacts.mockResolvedValue({
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
      ]
    })
    supplierQueryAdapter.listSupplierAddresses.mockResolvedValue({
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
      ]
    })
    supplierQueryAdapter.listSupplierOfferingsBySupplier.mockResolvedValue({
      offerings: [
        {
          supplierOfferingId: 'offering-1',
          supplierId: 'supplier-1',
          itemId: 'item-1',
          itemCode: 'ITEM-001',
          itemName: 'Steel Coil',
          status: SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    supplierQueryAdapter.listSupplierOfferingsByItem.mockResolvedValue({
      offerings: [
        {
          supplierOfferingId: 'offering-1',
          supplierId: 'supplier-1',
          itemId: 'item-1',
          itemCode: 'ITEM-001',
          itemName: 'Steel Coil',
          status: SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })

    await expect(
      service.searchSuppliers(
        'tenant-1',
        {
          keyword: 'alpha',
          page: 2,
          pageSize: 10,
          status: 'ACTIVE',
          tenantPartyId: 'party-1'
        },
        source as any
      )
    ).resolves.toEqual({
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
      total: 1,
      page: 2,
      pageSize: 10
    })
    await expect(
      service.getSupplierDetail('tenant-1', 'supplier-1', source as any)
    ).resolves.toEqual({
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
    await expect(
      service.listSupplierOfferingsByItem(
        'tenant-1',
        'item-1',
        { page: 1, pageSize: 20, status: 'ACTIVE' },
        source as any
      )
    ).resolves.toEqual({
      offerings: [
        {
          supplierOfferingId: 'offering-1',
          supplierId: 'supplier-1',
          itemId: 'item-1',
          itemCode: 'ITEM-001',
          itemName: 'Steel Coil',
          status: 'ACTIVE'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })

    expect(supplierQueryAdapter.searchSuppliers).toHaveBeenCalledWith(
      {
        keyword: 'alpha',
        status: SupplierStatus.SUPPLIER_STATUS_ACTIVE,
        tenantPartyId: 'party-1',
        page: 2,
        pageSize: 10
      },
      source
    )
    expect(supplierQueryAdapter.getSupplier).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1'
      },
      source
    )
    expect(supplierQueryAdapter.listSupplierContacts).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1'
      },
      source
    )
    expect(supplierQueryAdapter.listSupplierAddresses).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1'
      },
      source
    )
    expect(supplierQueryAdapter.listSupplierOfferingsBySupplier).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1',
        status: undefined,
        page: 1,
        pageSize: 20
      },
      source
    )
    expect(supplierQueryAdapter.listSupplierOfferingsByItem).toHaveBeenCalledWith(
      {
        itemId: 'item-1',
        status: SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE,
        page: 1,
        pageSize: 20
      },
      source
    )
  })

  it('maps phase 1 create, basics, binding, contact, address, offering, and status operations without widening the SRM contract', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    supplierManagementAdapter.createSupplierProfile.mockResolvedValue({
      supplier: {
        supplierId: 'supplier-1',
        supplierNo: 'SUP-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Supply',
        status: SupplierStatus.SUPPLIER_STATUS_INACTIVE,
        supplierCategory: 'RAW_MATERIAL',
        tags: ['strategic']
      }
    })
    supplierManagementAdapter.updateSupplierProfileBasics.mockResolvedValue({
      supplier: {
        supplierId: 'supplier-1',
        supplierNo: 'SUP-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Supply Rev',
        status: SupplierStatus.SUPPLIER_STATUS_INACTIVE,
        supplierCategory: 'PACKAGING',
        tags: ['priority']
      }
    })
    supplierManagementAdapter.bindSupplierToTenantParty.mockResolvedValue({
      supplier: {
        supplierId: 'supplier-1',
        supplierNo: 'SUP-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Supply Rev',
        status: SupplierStatus.SUPPLIER_STATUS_INACTIVE,
        supplierCategory: 'PACKAGING',
        tags: ['priority'],
        partyBinding: {
          tenantPartyId: 'party-1',
          bindingStatus: SupplierPartyBindingStatus.SUPPLIER_PARTY_BINDING_STATUS_ACTIVE,
          partyDisplayName: 'Alpha Party'
        }
      }
    })
    supplierManagementAdapter.upsertSupplierContact.mockResolvedValue({
      contact: {
        supplierContactId: 'contact-1',
        supplierId: 'supplier-1',
        displayName: 'Alice',
        roleTitle: 'Sales Manager',
        email: 'alice@example.com',
        phone: '123456',
        isPrimaryContact: true,
        isActive: true
      }
    })
    supplierManagementAdapter.upsertSupplierAddress.mockResolvedValue({
      address: {
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
    })
    supplierManagementAdapter.upsertSupplierOffering.mockResolvedValue({
      offering: {
        supplierOfferingId: 'offering-1',
        supplierId: 'supplier-1',
        itemId: 'item-1',
        itemCode: 'ITEM-001',
        itemName: 'Steel Coil',
        status: SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
      }
    })
    supplierManagementAdapter.changeSupplierStatus.mockResolvedValue({
      supplier: {
        supplierId: 'supplier-1',
        supplierNo: 'SUP-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Supply Rev',
        status: SupplierStatus.SUPPLIER_STATUS_ACTIVE,
        supplierCategory: 'PACKAGING',
        tags: ['priority'],
        partyBinding: {
          tenantPartyId: 'party-1',
          bindingStatus: SupplierPartyBindingStatus.SUPPLIER_PARTY_BINDING_STATUS_ACTIVE,
          partyDisplayName: 'Alpha Party'
        }
      }
    })

    await expect(
      service.createSupplierProfile(
        'tenant-1',
        {
          displayName: 'Alpha Supply',
          supplierCategory: 'RAW_MATERIAL',
          supplierNo: 'SUP-001',
          tags: ['strategic']
        },
        source as any
      )
    ).resolves.toEqual({
      supplierId: 'supplier-1',
      supplierNo: 'SUP-001',
      tenantId: 'tenant-1',
      displayName: 'Alpha Supply',
      status: 'INACTIVE',
      supplierCategory: 'RAW_MATERIAL',
      tags: ['strategic'],
      partyBinding: undefined
    })
    await expect(
      service.updateSupplierProfileBasics(
        'tenant-1',
        'supplier-1',
        {
          displayName: 'Alpha Supply Rev',
          supplierCategory: 'PACKAGING',
          supplierNo: 'SUP-001',
          tags: ['priority']
        },
        source as any
      )
    ).resolves.toEqual({
      supplierId: 'supplier-1',
      supplierNo: 'SUP-001',
      tenantId: 'tenant-1',
      displayName: 'Alpha Supply Rev',
      status: 'INACTIVE',
      supplierCategory: 'PACKAGING',
      tags: ['priority'],
      partyBinding: undefined
    })
    await expect(
      service.bindSupplierToTenantParty(
        'tenant-1',
        'supplier-1',
        { tenantPartyId: 'party-1' },
        source as any
      )
    ).resolves.toEqual({
      supplierId: 'supplier-1',
      supplierNo: 'SUP-001',
      tenantId: 'tenant-1',
      displayName: 'Alpha Supply Rev',
      status: 'INACTIVE',
      supplierCategory: 'PACKAGING',
      tags: ['priority'],
      partyBinding: {
        tenantPartyId: 'party-1',
        bindingStatus: 'ACTIVE',
        partyDisplayName: 'Alpha Party'
      }
    })
    await expect(
      service.upsertSupplierContact(
        'tenant-1',
        'supplier-1',
        {
          displayName: 'Alice',
          email: 'alice@example.com',
          isActive: true,
          isPrimaryContact: true,
          phone: '123456',
          roleTitle: 'Sales Manager',
          supplierContactId: 'contact-1'
        },
        source as any
      )
    ).resolves.toEqual({
      supplierContactId: 'contact-1',
      supplierId: 'supplier-1',
      displayName: 'Alice',
      roleTitle: 'Sales Manager',
      email: 'alice@example.com',
      phone: '123456',
      isPrimaryContact: true,
      isActive: true
    })
    await expect(
      service.upsertSupplierAddress(
        'tenant-1',
        'supplier-1',
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
        },
        source as any
      )
    ).resolves.toEqual({
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
    })
    await expect(
      service.upsertSupplierOffering(
        'tenant-1',
        'supplier-1',
        {
          itemId: 'item-1',
          status: 'ACTIVE',
          supplierOfferingId: 'offering-1'
        },
        source as any
      )
    ).resolves.toEqual({
      supplierOfferingId: 'offering-1',
      supplierId: 'supplier-1',
      itemId: 'item-1',
      itemCode: 'ITEM-001',
      itemName: 'Steel Coil',
      status: 'ACTIVE'
    })
    await expect(
      service.changeSupplierStatus('tenant-1', 'supplier-1', { status: 'ACTIVE' }, source as any)
    ).resolves.toEqual({
      supplierId: 'supplier-1',
      supplierNo: 'SUP-001',
      tenantId: 'tenant-1',
      displayName: 'Alpha Supply Rev',
      status: 'ACTIVE',
      supplierCategory: 'PACKAGING',
      tags: ['priority'],
      partyBinding: {
        tenantPartyId: 'party-1',
        bindingStatus: 'ACTIVE',
        partyDisplayName: 'Alpha Party'
      }
    })

    expect(supplierManagementAdapter.createSupplierProfile).toHaveBeenCalledWith(
      {
        displayName: 'Alpha Supply',
        supplierNo: 'SUP-001',
        supplierCategory: 'RAW_MATERIAL',
        tags: ['strategic']
      },
      source
    )
    expect(supplierManagementAdapter.updateSupplierProfileBasics).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1',
        displayName: 'Alpha Supply Rev',
        supplierNo: 'SUP-001',
        supplierCategory: 'PACKAGING',
        tags: ['priority']
      },
      source
    )
    expect(supplierManagementAdapter.bindSupplierToTenantParty).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1',
        tenantPartyId: 'party-1'
      },
      source
    )
    expect(supplierManagementAdapter.upsertSupplierContact).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1',
        supplierContactId: 'contact-1',
        displayName: 'Alice',
        roleTitle: 'Sales Manager',
        email: 'alice@example.com',
        phone: '123456',
        isPrimaryContact: true,
        isActive: true
      },
      source
    )
    expect(supplierManagementAdapter.upsertSupplierAddress).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1',
        supplierAddressId: 'address-1',
        label: 'HQ',
        countryCode: 'CN',
        region: 'Shanghai',
        locality: 'Pudong',
        addressLine1: 'Line 1',
        addressLine2: 'Line 2',
        postalCode: '200000',
        isPrimaryAddress: true,
        isActive: true
      },
      source
    )
    expect(supplierManagementAdapter.upsertSupplierOffering).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1',
        supplierOfferingId: 'offering-1',
        itemId: 'item-1',
        targetStatus: SupplierOfferingStatus.SUPPLIER_OFFERING_STATUS_ACTIVE
      },
      source
    )
    expect(supplierManagementAdapter.changeSupplierStatus).toHaveBeenCalledWith(
      {
        supplierId: 'supplier-1',
        targetStatus: SupplierStatus.SUPPLIER_STATUS_ACTIVE
      },
      source
    )
  })
})
