import { ForbiddenException } from '@nestjs/common'
import {
  CustomerPartyBindingStatus,
  CustomerStatus
} from '@oes/common/generated/crm_service'
import { CustomerManagementService } from './customer-management.service'

// Verifies the gateway customer-management service keeps tenant scope enforcement and phase 1 request mapping aligned with CRM contracts.
describe('CustomerManagementService', () => {
  const customerQueryAdapter = {
    getCustomerAccount: jest.fn(),
    listCustomerAddresses: jest.fn(),
    listCustomerContacts: jest.fn(),
    searchCustomerAccounts: jest.fn(),
    searchSelectableCustomers: jest.fn()
  }
  const customerManagementAdapter = {
    bindCustomerAccountToTenantParty: jest.fn(),
    changeCustomerStatus: jest.fn(),
    createCustomerAccount: jest.fn(),
    updateCustomerAccountBasics: jest.fn(),
    upsertCustomerAddress: jest.fn(),
    upsertCustomerContact: jest.fn()
  }

  const service = new CustomerManagementService(
    customerQueryAdapter as any,
    customerManagementAdapter as any
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant customer directory', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.searchCustomerAccounts(
        'tenant-2',
        {
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(customerQueryAdapter.searchCustomerAccounts).not.toHaveBeenCalled()
  })

  it('maps customer directory, selector, and detail queries into the CRM phase 1 gateway read model', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    customerQueryAdapter.searchCustomerAccounts.mockResolvedValue({
      customerAccounts: [
        {
          customerAccountId: 'customer-1',
          customerAccountNo: 'CUST-001',
          tenantId: 'tenant-1',
          displayName: 'Alpha Manufacturing',
          status: CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER,
          customerCategory: 'DISTRIBUTOR',
          tags: ['key', 'cn'],
          primaryBinding: {
            customerPartyBindingId: 'binding-1',
            tenantPartyId: 'party-1',
            bindingStatus:
              CustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_ACTIVE_PRIMARY,
            partyDisplayName: 'Alpha Party'
          }
        }
      ],
      total: 1,
      page: 2,
      pageSize: 10
    })
    customerQueryAdapter.searchSelectableCustomers.mockResolvedValue({
      customers: [
        {
          customerAccountId: 'customer-1',
          customerAccountNo: 'CUST-001',
          displayName: 'Alpha Manufacturing',
          status: CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER,
          primaryTenantPartyId: 'party-1',
          primaryPartyDisplayName: 'Alpha Party'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    customerQueryAdapter.getCustomerAccount.mockResolvedValue({
      customerAccount: {
        customerAccountId: 'customer-1',
        customerAccountNo: 'CUST-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Manufacturing',
        status: CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER,
        customerCategory: 'DISTRIBUTOR',
        tags: ['key', 'cn'],
        primaryBinding: {
          customerPartyBindingId: 'binding-1',
          tenantPartyId: 'party-1',
          bindingStatus:
            CustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_ACTIVE_PRIMARY,
          partyDisplayName: 'Alpha Party'
        }
      }
    })
    customerQueryAdapter.listCustomerContacts.mockResolvedValue({
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
      ]
    })
    customerQueryAdapter.listCustomerAddresses.mockResolvedValue({
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

    await expect(
      service.searchCustomerAccounts(
        'tenant-1',
        {
          keyword: 'alpha',
          page: 2,
          pageSize: 10,
          primaryTenantPartyId: 'party-1',
          status: 'ACTIVE_CUSTOMER'
        },
        source as any
      )
    ).resolves.toEqual({
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
      total: 1,
      page: 2,
      pageSize: 10
    })
    await expect(
      service.searchSelectableCustomers(
        'tenant-1',
        {
          keyword: 'alpha',
          page: 1,
          pageSize: 20
        },
        source as any
      )
    ).resolves.toEqual({
      customers: [
        {
          customerAccountId: 'customer-1',
          customerAccountNo: 'CUST-001',
          displayName: 'Alpha Manufacturing',
          status: 'ACTIVE_CUSTOMER',
          primaryTenantPartyId: 'party-1',
          primaryPartyDisplayName: 'Alpha Party'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    await expect(
      service.getCustomerAccountDetail('tenant-1', 'customer-1', source as any)
    ).resolves.toEqual({
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

    expect(customerQueryAdapter.searchCustomerAccounts).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        keyword: 'alpha',
        status: CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER,
        primaryTenantPartyId: 'party-1',
        page: 2,
        pageSize: 10
      },
      source
    )
    expect(customerQueryAdapter.searchSelectableCustomers).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        keyword: 'alpha',
        page: 1,
        pageSize: 20
      },
      source
    )
    expect(customerQueryAdapter.getCustomerAccount).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1'
      },
      source
    )
    expect(customerQueryAdapter.listCustomerContacts).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1'
      },
      source
    )
    expect(customerQueryAdapter.listCustomerAddresses).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1'
      },
      source
    )
  })

  it('maps phase 1 create, basics, binding, contact, address, and status operations without widening the CRM contract', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    customerManagementAdapter.createCustomerAccount.mockResolvedValue({
      customerAccount: {
        customerAccountId: 'customer-1',
        customerAccountNo: 'CUST-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Manufacturing',
        status: CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER,
        customerCategory: 'DISTRIBUTOR',
        tags: ['key'],
        primaryBinding: undefined
      }
    })
    customerManagementAdapter.updateCustomerAccountBasics.mockResolvedValue({
      customerAccount: {
        customerAccountId: 'customer-1',
        customerAccountNo: 'CUST-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Manufacturing Rev',
        status: CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER,
        customerCategory: 'OEM',
        tags: ['priority'],
        primaryBinding: undefined
      }
    })
    customerManagementAdapter.bindCustomerAccountToTenantParty.mockResolvedValue({
      customerAccount: {
        customerAccountId: 'customer-1',
        customerAccountNo: 'CUST-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Manufacturing Rev',
        status: CustomerStatus.CUSTOMER_STATUS_ACTIVE_CUSTOMER,
        customerCategory: 'OEM',
        tags: ['priority'],
        primaryBinding: {
          customerPartyBindingId: 'binding-1',
          tenantPartyId: 'party-1',
          bindingStatus:
            CustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_ACTIVE_PRIMARY,
          partyDisplayName: 'Alpha Party'
        }
      }
    })
    customerManagementAdapter.upsertCustomerContact.mockResolvedValue({
      contact: {
        customerContactId: 'contact-1',
        customerAccountId: 'customer-1',
        displayName: 'Alice',
        roleTitle: 'Purchasing Manager',
        email: 'alice@example.com',
        phone: '123456',
        isPrimaryContact: true,
        isActive: true
      }
    })
    customerManagementAdapter.upsertCustomerAddress.mockResolvedValue({
      address: {
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
    })
    customerManagementAdapter.changeCustomerStatus.mockResolvedValue({
      customerAccount: {
        customerAccountId: 'customer-1',
        customerAccountNo: 'CUST-001',
        tenantId: 'tenant-1',
        displayName: 'Alpha Manufacturing Rev',
        status: CustomerStatus.CUSTOMER_STATUS_BLOCKED,
        customerCategory: 'OEM',
        tags: ['priority'],
        primaryBinding: {
          customerPartyBindingId: 'binding-1',
          tenantPartyId: 'party-1',
          bindingStatus:
            CustomerPartyBindingStatus.CUSTOMER_PARTY_BINDING_STATUS_ACTIVE_PRIMARY,
          partyDisplayName: 'Alpha Party'
        }
      }
    })

    await expect(
      service.createCustomerAccount(
        'tenant-1',
        {
          displayName: 'Alpha Manufacturing',
          customerCategory: 'DISTRIBUTOR',
          tags: ['key']
        },
        source as any
      )
    ).resolves.toEqual({
      customerAccountId: 'customer-1',
      customerAccountNo: 'CUST-001',
      tenantId: 'tenant-1',
      displayName: 'Alpha Manufacturing',
      status: 'ACTIVE_CUSTOMER',
      customerCategory: 'DISTRIBUTOR',
      tags: ['key'],
      primaryBinding: undefined
    })

    await expect(
      service.updateCustomerAccountBasics(
        'tenant-1',
        'customer-1',
        {
          displayName: 'Alpha Manufacturing Rev',
          customerCategory: 'OEM',
          tags: ['priority']
        },
        source as any
      )
    ).resolves.toEqual({
      customerAccountId: 'customer-1',
      customerAccountNo: 'CUST-001',
      tenantId: 'tenant-1',
      displayName: 'Alpha Manufacturing Rev',
      status: 'ACTIVE_CUSTOMER',
      customerCategory: 'OEM',
      tags: ['priority'],
      primaryBinding: undefined
    })

    await expect(
      service.bindCustomerAccountToTenantParty(
        'tenant-1',
        'customer-1',
        {
          tenantPartyId: 'party-1'
        },
        source as any
      )
    ).resolves.toEqual({
      customerAccountId: 'customer-1',
      customerAccountNo: 'CUST-001',
      tenantId: 'tenant-1',
      displayName: 'Alpha Manufacturing Rev',
      status: 'ACTIVE_CUSTOMER',
      customerCategory: 'OEM',
      tags: ['priority'],
      primaryBinding: {
        customerPartyBindingId: 'binding-1',
        tenantPartyId: 'party-1',
        bindingStatus: 'ACTIVE_PRIMARY',
        partyDisplayName: 'Alpha Party'
      }
    })

    await expect(
      service.upsertCustomerContact(
        'tenant-1',
        'customer-1',
        {
          customerContactId: 'contact-1',
          displayName: 'Alice',
          roleTitle: 'Purchasing Manager',
          email: 'alice@example.com',
          phone: '123456',
          isPrimaryContact: true,
          isActive: true
        },
        source as any
      )
    ).resolves.toEqual({
      customerContactId: 'contact-1',
      customerAccountId: 'customer-1',
      displayName: 'Alice',
      roleTitle: 'Purchasing Manager',
      email: 'alice@example.com',
      phone: '123456',
      isPrimaryContact: true,
      isActive: true
    })

    await expect(
      service.upsertCustomerAddress(
        'tenant-1',
        'customer-1',
        {
          customerAddressId: 'address-1',
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
        source as any
      )
    ).resolves.toEqual({
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
    })

    await expect(
      service.changeCustomerStatus(
        'tenant-1',
        'customer-1',
        {
          status: 'BLOCKED'
        },
        source as any
      )
    ).resolves.toEqual({
      customerAccountId: 'customer-1',
      customerAccountNo: 'CUST-001',
      tenantId: 'tenant-1',
      displayName: 'Alpha Manufacturing Rev',
      status: 'BLOCKED',
      customerCategory: 'OEM',
      tags: ['priority'],
      primaryBinding: {
        customerPartyBindingId: 'binding-1',
        tenantPartyId: 'party-1',
        bindingStatus: 'ACTIVE_PRIMARY',
        partyDisplayName: 'Alpha Party'
      }
    })

    expect(customerManagementAdapter.createCustomerAccount).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        displayName: 'Alpha Manufacturing',
        customerCategory: 'DISTRIBUTOR',
        tags: ['key']
      },
      source
    )
    expect(customerManagementAdapter.updateCustomerAccountBasics).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        displayName: 'Alpha Manufacturing Rev',
        customerCategory: 'OEM',
        tags: ['priority']
      },
      source
    )
    expect(customerManagementAdapter.bindCustomerAccountToTenantParty).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        tenantPartyId: 'party-1'
      },
      source
    )
    expect(customerManagementAdapter.upsertCustomerContact).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        customerContactId: 'contact-1',
        displayName: 'Alice',
        roleTitle: 'Purchasing Manager',
        email: 'alice@example.com',
        phone: '123456',
        isPrimaryContact: true,
        isActive: true
      },
      source
    )
    expect(customerManagementAdapter.upsertCustomerAddress).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        customerAddressId: 'address-1',
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
    expect(customerManagementAdapter.changeCustomerStatus).toHaveBeenCalledWith(
      {
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        targetStatus: CustomerStatus.CUSTOMER_STATUS_BLOCKED
      },
      source
    )
  })
})
