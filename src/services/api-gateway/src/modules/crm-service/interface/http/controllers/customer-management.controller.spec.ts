import { Reflector } from '@nestjs/core'
import { REQUIRE_PERMISSIONS_METADATA_KEY } from '@oes/common/authorization'
import { CustomerManagementController } from './customer-management.controller'

// Verifies the customer-management gateway controller keeps permissions and phase 1 request forwarding aligned with the CRM BFF surface.
describe('CustomerManagementController', () => {
  const customerManagementService = {
    bindCustomerAccountToTenantParty: jest.fn(),
    changeCustomerStatus: jest.fn(),
    createCustomerAccount: jest.fn(),
    getCustomerAccountDetail: jest.fn(),
    searchCustomerAccounts: jest.fn(),
    searchSelectableCustomers: jest.fn(),
    updateCustomerAccountBasics: jest.fn(),
    upsertCustomerAddress: jest.fn(),
    upsertCustomerContact: jest.fn()
  }

  const controller = new CustomerManagementController(customerManagementService as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('declares the expected permissions on customer-management endpoints', () => {
    const reflector = new Reflector()

    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.searchCustomerAccounts
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.searchSelectableCustomers
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.getCustomerAccount
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.createCustomerAccount
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.updateCustomerAccountBasics
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.bindCustomerAccountToTenantParty
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.upsertCustomerContact
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.upsertCustomerAddress
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
    expect(
      reflector.get(
        REQUIRE_PERMISSIONS_METADATA_KEY,
        CustomerManagementController.prototype.changeCustomerStatus
      )
    ).toEqual(expect.objectContaining({ all: expect.any(Array) }))
  })

  it('forwards phase 1 list, selector, detail, and mutation requests to the customer-management service', async () => {
    const source = { requestId: 'req-1', traceId: 'trace-1' }

    customerManagementService.searchCustomerAccounts.mockResolvedValue({
      customerAccounts: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    customerManagementService.searchSelectableCustomers.mockResolvedValue({
      customers: [],
      page: 1,
      pageSize: 20,
      total: 0
    })
    customerManagementService.getCustomerAccountDetail.mockResolvedValue({
      customerAccount: { customerAccountId: 'customer-1' },
      contacts: [],
      addresses: []
    })
    customerManagementService.createCustomerAccount.mockResolvedValue({
      customerAccountId: 'customer-1'
    })
    customerManagementService.updateCustomerAccountBasics.mockResolvedValue({
      customerAccountId: 'customer-1'
    })
    customerManagementService.bindCustomerAccountToTenantParty.mockResolvedValue({
      customerAccountId: 'customer-1'
    })
    customerManagementService.upsertCustomerContact.mockResolvedValue({
      customerContactId: 'contact-1'
    })
    customerManagementService.upsertCustomerAddress.mockResolvedValue({
      customerAddressId: 'address-1'
    })
    customerManagementService.changeCustomerStatus.mockResolvedValue({
      customerAccountId: 'customer-1',
      status: 'BLOCKED'
    })

    await controller.searchCustomerAccounts(
      'tenant-1',
      {
        keyword: 'alpha',
        page: 2,
        pageSize: 10,
        primaryTenantPartyId: 'party-1',
        status: 'ACTIVE_CUSTOMER'
      } as any,
      source as any
    )
    await controller.searchSelectableCustomers(
      'tenant-1',
      {
        keyword: 'alpha',
        page: 1,
        pageSize: 20
      } as any,
      source as any
    )
    await controller.getCustomerAccount('tenant-1', 'customer-1', source as any)
    await controller.createCustomerAccount(
      'tenant-1',
      {
        customerCategory: 'DISTRIBUTOR',
        displayName: 'Alpha Manufacturing',
        tags: ['key']
      } as any,
      source as any
    )
    await controller.updateCustomerAccountBasics(
      'tenant-1',
      'customer-1',
      {
        customerCategory: 'OEM',
        displayName: 'Alpha Manufacturing Rev',
        tags: ['priority']
      } as any,
      source as any
    )
    await controller.bindCustomerAccountToTenantParty(
      'tenant-1',
      'customer-1',
      {
        tenantPartyId: 'party-1'
      } as any,
      source as any
    )
    await controller.upsertCustomerContact(
      'tenant-1',
      'customer-1',
      {
        customerContactId: 'contact-1',
        displayName: 'Alice',
        email: 'alice@example.com',
        isActive: true,
        isPrimaryContact: true,
        phone: '123456',
        roleTitle: 'Purchasing Manager'
      } as any,
      source as any
    )
    await controller.upsertCustomerAddress(
      'tenant-1',
      'customer-1',
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
      } as any,
      source as any
    )
    await controller.changeCustomerStatus(
      'tenant-1',
      'customer-1',
      { status: 'BLOCKED' } as any,
      source as any
    )

    expect(customerManagementService.searchCustomerAccounts).toHaveBeenCalledWith(
      'tenant-1',
      {
        keyword: 'alpha',
        page: 2,
        pageSize: 10,
        primaryTenantPartyId: 'party-1',
        status: 'ACTIVE_CUSTOMER'
      },
      source
    )
    expect(customerManagementService.searchSelectableCustomers).toHaveBeenCalledWith(
      'tenant-1',
      {
        keyword: 'alpha',
        page: 1,
        pageSize: 20
      },
      source
    )
    expect(customerManagementService.getCustomerAccountDetail).toHaveBeenCalledWith(
      'tenant-1',
      'customer-1',
      source
    )
    expect(customerManagementService.createCustomerAccount).toHaveBeenCalledWith(
      'tenant-1',
      {
        customerCategory: 'DISTRIBUTOR',
        displayName: 'Alpha Manufacturing',
        tags: ['key']
      },
      source
    )
    expect(customerManagementService.updateCustomerAccountBasics).toHaveBeenCalledWith(
      'tenant-1',
      'customer-1',
      {
        customerCategory: 'OEM',
        displayName: 'Alpha Manufacturing Rev',
        tags: ['priority']
      },
      source
    )
    expect(customerManagementService.bindCustomerAccountToTenantParty).toHaveBeenCalledWith(
      'tenant-1',
      'customer-1',
      {
        tenantPartyId: 'party-1'
      },
      source
    )
    expect(customerManagementService.upsertCustomerContact).toHaveBeenCalledWith(
      'tenant-1',
      'customer-1',
      {
        customerContactId: 'contact-1',
        displayName: 'Alice',
        email: 'alice@example.com',
        isActive: true,
        isPrimaryContact: true,
        phone: '123456',
        roleTitle: 'Purchasing Manager'
      },
      source
    )
    expect(customerManagementService.upsertCustomerAddress).toHaveBeenCalledWith(
      'tenant-1',
      'customer-1',
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
      },
      source
    )
    expect(customerManagementService.changeCustomerStatus).toHaveBeenCalledWith(
      'tenant-1',
      'customer-1',
      {
        status: 'BLOCKED'
      },
      source
    )
  })
})
