import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { SRM_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { SupplierManagementController } from '../../../../../../../src/modules/srm-service/interface/http/controllers/supplier-management.controller'

// Verifies the supplier-management gateway controller keeps permissions and phase 1 request forwarding aligned with the SRM BFF surface.
describe('SupplierManagementController', () => {
  const supplierManagementService = {
    bindSupplierToTenantParty: jest.fn(),
    changeSupplierStatus: jest.fn(),
    createSupplierProfile: jest.fn(),
    getSupplierDetail: jest.fn(),
    listSupplierOfferingsByItem: jest.fn(),
    listSupplierOfferingsBySupplier: jest.fn(),
    searchSuppliers: jest.fn(),
    updateSupplierProfileBasics: jest.fn(),
    upsertSupplierAddress: jest.fn(),
    upsertSupplierContact: jest.fn(),
    upsertSupplierOffering: jest.fn()
  }

  const controller = new SupplierManagementController(supplierManagementService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected permissions on supplier-management endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.searchSuppliers
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.getSupplier
      )
    ).toEqual({
      all: [
        SRM_MANAGEMENT_PERMISSION_CODES.VIEW_SUPPLIER_DETAIL,
        SRM_MANAGEMENT_PERMISSION_CODES.LIST_SUPPLIER_OFFERINGS_BY_SUPPLIER
      ]
    })
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.createSupplierProfile
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.updateSupplierProfileBasics
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.bindSupplierToTenantParty
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.upsertSupplierContact
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.upsertSupplierAddress
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.changeSupplierStatus
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.listSupplierOfferingsBySupplier
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.listSupplierOfferingsByItem
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        SupplierManagementController.prototype.upsertSupplierOffering
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards phase 1 list, detail, and mutation requests to the supplier-management service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    supplierManagementService.searchSuppliers.mockResolvedValue({
      suppliers: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    supplierManagementService.getSupplierDetail.mockResolvedValue({
      supplier: { supplierId: 'supplier-1' },
      contacts: [],
      addresses: [],
      offerings: []
    })
    supplierManagementService.createSupplierProfile.mockResolvedValue({
      supplierId: 'supplier-1'
    })
    supplierManagementService.updateSupplierProfileBasics.mockResolvedValue({
      supplierId: 'supplier-1'
    })
    supplierManagementService.bindSupplierToTenantParty.mockResolvedValue({
      supplierId: 'supplier-1'
    })
    supplierManagementService.upsertSupplierContact.mockResolvedValue({
      supplierContactId: 'contact-1'
    })
    supplierManagementService.upsertSupplierAddress.mockResolvedValue({
      supplierAddressId: 'address-1'
    })
    supplierManagementService.changeSupplierStatus.mockResolvedValue({
      supplierId: 'supplier-1',
      status: 'ACTIVE'
    })
    supplierManagementService.listSupplierOfferingsBySupplier.mockResolvedValue({
      offerings: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    supplierManagementService.listSupplierOfferingsByItem.mockResolvedValue({
      offerings: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    supplierManagementService.upsertSupplierOffering.mockResolvedValue({
      supplierOfferingId: 'offering-1'
    })

    await controller.searchSuppliers(
      'tenant-1',
      {
        keyword: 'alpha',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        tenantPartyId: 'party-1'
      } as any,
      source as any
    )
    await controller.getSupplier('tenant-1', 'supplier-1', source as any)
    await controller.createSupplierProfile(
      'tenant-1',
      {
        displayName: 'Alpha Supply',
        supplierCategory: 'RAW_MATERIAL',
        supplierNo: 'SUP-001',
        tags: ['strategic']
      } as any,
      source as any
    )
    await controller.updateSupplierProfileBasics(
      'tenant-1',
      'supplier-1',
      {
        displayName: 'Alpha Supply Rev',
        supplierCategory: 'PACKAGING',
        supplierNo: 'SUP-001',
        tags: ['priority']
      } as any,
      source as any
    )
    await controller.bindSupplierToTenantParty(
      'tenant-1',
      'supplier-1',
      {
        tenantPartyId: 'party-1'
      } as any,
      source as any
    )
    await controller.upsertSupplierContact(
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
      } as any,
      source as any
    )
    await controller.upsertSupplierAddress(
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
      } as any,
      source as any
    )
    await controller.changeSupplierStatus(
      'tenant-1',
      'supplier-1',
      { status: 'ACTIVE' } as any,
      source as any
    )
    await controller.listSupplierOfferingsBySupplier(
      'tenant-1',
      'supplier-1',
      { page: 2, pageSize: 50, status: 'ACTIVE' } as any,
      source as any
    )
    await controller.listSupplierOfferingsByItem(
      'tenant-1',
      'item-1',
      { page: 2, pageSize: 50, status: 'ACTIVE' } as any,
      source as any
    )
    await controller.upsertSupplierOffering(
      'tenant-1',
      'supplier-1',
      {
        itemId: 'item-1',
        status: 'ACTIVE',
        supplierOfferingId: 'offering-1'
      } as any,
      source as any
    )

    expect(supplierManagementService.searchSuppliers).toHaveBeenCalledWith(
      'tenant-1',
      {
        keyword: 'alpha',
        page: 2,
        pageSize: 10,
        status: 'ACTIVE',
        tenantPartyId: 'party-1'
      },
      source
    )
    expect(supplierManagementService.getSupplierDetail).toHaveBeenCalledWith(
      'tenant-1',
      'supplier-1',
      source
    )
    expect(supplierManagementService.createSupplierProfile).toHaveBeenCalledWith(
      'tenant-1',
      {
        displayName: 'Alpha Supply',
        supplierCategory: 'RAW_MATERIAL',
        supplierNo: 'SUP-001',
        tags: ['strategic']
      },
      source
    )
    expect(supplierManagementService.updateSupplierProfileBasics).toHaveBeenCalledWith(
      'tenant-1',
      'supplier-1',
      {
        displayName: 'Alpha Supply Rev',
        supplierCategory: 'PACKAGING',
        supplierNo: 'SUP-001',
        tags: ['priority']
      },
      source
    )
    expect(supplierManagementService.bindSupplierToTenantParty).toHaveBeenCalledWith(
      'tenant-1',
      'supplier-1',
      {
        tenantPartyId: 'party-1'
      },
      source
    )
    expect(supplierManagementService.upsertSupplierContact).toHaveBeenCalledWith(
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
      source
    )
    expect(supplierManagementService.upsertSupplierAddress).toHaveBeenCalledWith(
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
      source
    )
    expect(supplierManagementService.changeSupplierStatus).toHaveBeenCalledWith(
      'tenant-1',
      'supplier-1',
      { status: 'ACTIVE' },
      source
    )
    expect(supplierManagementService.listSupplierOfferingsBySupplier).toHaveBeenCalledWith(
      'tenant-1',
      'supplier-1',
      { page: 2, pageSize: 50, status: 'ACTIVE' },
      source
    )
    expect(supplierManagementService.listSupplierOfferingsByItem).toHaveBeenCalledWith(
      'tenant-1',
      'item-1',
      { page: 2, pageSize: 50, status: 'ACTIVE' },
      source
    )
    expect(supplierManagementService.upsertSupplierOffering).toHaveBeenCalledWith(
      'tenant-1',
      'supplier-1',
      {
        itemId: 'item-1',
        status: 'ACTIVE',
        supplierOfferingId: 'offering-1'
      },
      source
    )
  })
})
