import { status } from '@grpc/grpc-js'
import { ChangeCustomerStatusCommand } from '../../src/application/commands/change-customer-status.command'
import { ChangeCustomerStatusHandler } from '../../src/application/commands/change-customer-status.handler'
import { CreateCustomerAccountCommand } from '../../src/application/commands/create-customer-account.command'
import { CreateCustomerAccountHandler } from '../../src/application/commands/create-customer-account.handler'
import { BindCustomerAccountToTenantPartyCommand } from '../../src/application/commands/bind-customer-account-to-tenant-party.command'
import { BindCustomerAccountToTenantPartyHandler } from '../../src/application/commands/bind-customer-account-to-tenant-party.handler'
import { UpsertCustomerAddressCommand } from '../../src/application/commands/upsert-customer-address.command'
import { UpsertCustomerAddressHandler } from '../../src/application/commands/upsert-customer-address.handler'
import { UpsertCustomerContactCommand } from '../../src/application/commands/upsert-customer-contact.command'
import { UpsertCustomerContactHandler } from '../../src/application/commands/upsert-customer-contact.handler'
import { GetCustomerAccountHandler } from '../../src/application/queries/get-customer-account.handler'
import { GetCustomerAccountQuery } from '../../src/application/queries/get-customer-account.query'
import { ListCustomerAddressesHandler } from '../../src/application/queries/list-customer-addresses.handler'
import { ListCustomerAddressesQuery } from '../../src/application/queries/list-customer-addresses.query'
import { ListCustomerContactsHandler } from '../../src/application/queries/list-customer-contacts.handler'
import { ListCustomerContactsQuery } from '../../src/application/queries/list-customer-contacts.query'
import { SearchSelectableCustomersHandler } from '../../src/application/queries/search-selectable-customers.handler'
import { SearchSelectableCustomersQuery } from '../../src/application/queries/search-selectable-customers.query'
import { CustomerStatus } from '../../src/domain/models/crm-records'
import { TenantPartyLookupPort, TenantPartyLookupResult } from '../../src/application/ports/tenant-party-lookup.port'
import { InMemoryCustomerAccountRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-customer-account.repository'
import { InMemoryCustomerAddressRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-customer-address.repository'
import { InMemoryCustomerContactRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-customer-contact.repository'
import { CrmInMemoryStore } from '../../src/infrastructure/store/crm-in-memory-store'

/** StubTenantPartyLookupPort controls party lookup results so behavior tests can focus on CRM invariants. */
class StubTenantPartyLookupPort implements TenantPartyLookupPort {
  private readonly tenantParties = new Map<string, TenantPartyLookupResult>()

  seed(result: TenantPartyLookupResult): void {
    this.tenantParties.set(`${result.tenantId}:${result.tenantPartyId}`, result)
  }

  async getTenantPartyById(tenantId: string, tenantPartyId: string): Promise<TenantPartyLookupResult | null> {
    return this.tenantParties.get(`${tenantId}:${tenantPartyId}`) ?? null
  }
}

function createHarness() {
  const store = new CrmInMemoryStore()
  const accountRepository = new InMemoryCustomerAccountRepository(store)
  const contactRepository = new InMemoryCustomerContactRepository(store)
  const addressRepository = new InMemoryCustomerAddressRepository(store)
  const tenantPartyLookup = new StubTenantPartyLookupPort()

  return {
    tenantPartyLookup,
    createCustomerAccount: new CreateCustomerAccountHandler(accountRepository),
    bindCustomerAccountToTenantParty: new BindCustomerAccountToTenantPartyHandler(
      accountRepository,
      tenantPartyLookup
    ),
    changeCustomerStatus: new ChangeCustomerStatusHandler(accountRepository),
    upsertCustomerContact: new UpsertCustomerContactHandler(accountRepository, contactRepository),
    upsertCustomerAddress: new UpsertCustomerAddressHandler(accountRepository, addressRepository),
    getCustomerAccount: new GetCustomerAccountHandler(accountRepository),
    searchSelectableCustomers: new SearchSelectableCustomersHandler(accountRepository),
    listCustomerContacts: new ListCustomerContactsHandler(accountRepository, contactRepository),
    listCustomerAddresses: new ListCustomerAddressesHandler(accountRepository, addressRepository)
  }
}

describe('crm-service behavior L1', () => {
  it('SearchSelectableCustomers / should return only ACTIVE_CUSTOMER accounts with one active primary binding', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-active',
      status: 'ACTIVE',
      partyDisplayName: 'Acme Trading'
    })
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-blocked',
      status: 'ACTIVE',
      partyDisplayName: 'Blocked Party'
    })
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-archived',
      status: 'ACTIVE',
      partyDisplayName: 'Archived Party'
    })

    const active = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Acme CRM',
        customerCategory: 'EXPORT',
        tags: ['priority']
      })
    )
    const blocked = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Blocked CRM',
        tags: []
      })
    )
    const archived = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Archived CRM',
        tags: []
      })
    )
    await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Unbound CRM',
        tags: []
      })
    )

    await harness.bindCustomerAccountToTenantParty.execute(
      new BindCustomerAccountToTenantPartyCommand({
        tenantId: 'tenant-1',
        customerAccountId: active.id,
        tenantPartyId: 'party-active'
      })
    )
    await harness.bindCustomerAccountToTenantParty.execute(
      new BindCustomerAccountToTenantPartyCommand({
        tenantId: 'tenant-1',
        customerAccountId: blocked.id,
        tenantPartyId: 'party-blocked'
      })
    )
    await harness.bindCustomerAccountToTenantParty.execute(
      new BindCustomerAccountToTenantPartyCommand({
        tenantId: 'tenant-1',
        customerAccountId: archived.id,
        tenantPartyId: 'party-archived'
      })
    )

    await harness.changeCustomerStatus.execute(
      new ChangeCustomerStatusCommand({
        tenantId: 'tenant-1',
        customerAccountId: blocked.id,
        targetStatus: CustomerStatus.BLOCKED
      })
    )
    await harness.changeCustomerStatus.execute(
      new ChangeCustomerStatusCommand({
        tenantId: 'tenant-1',
        customerAccountId: archived.id,
        targetStatus: CustomerStatus.ARCHIVED
      })
    )

    const selectable = await harness.searchSelectableCustomers.execute(
      new SearchSelectableCustomersQuery({
        tenantId: 'tenant-1',
        keyword: 'crm',
        page: 1,
        pageSize: 20
      })
    )

    expect(selectable.total).toBe(1)
    expect(selectable.customers).toEqual([
      expect.objectContaining({
        customerAccountId: active.id,
        status: CustomerStatus.ACTIVE_CUSTOMER,
        primaryTenantPartyId: 'party-active'
      })
    ])
  })

  it('BindCustomerAccountToTenantParty / when tenantPartyId does not exist / should reject with NOT_FOUND', async () => {
    const harness = createHarness()
    const account = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Acme CRM',
        tags: []
      })
    )

    await expect(
      harness.bindCustomerAccountToTenantParty.execute(
        new BindCustomerAccountToTenantPartyCommand({
          tenantId: 'tenant-1',
          customerAccountId: account.id,
          tenantPartyId: 'party-missing'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.NOT_FOUND
      }
    })
  })

  it('BindCustomerAccountToTenantParty / when tenantPartyId is already occupied by another active account / should reject with ALREADY_EXISTS', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-1',
      status: 'ACTIVE',
      partyDisplayName: 'Acme Trading'
    })

    const first = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'First CRM',
        tags: []
      })
    )
    const second = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Second CRM',
        tags: []
      })
    )

    await harness.bindCustomerAccountToTenantParty.execute(
      new BindCustomerAccountToTenantPartyCommand({
        tenantId: 'tenant-1',
        customerAccountId: first.id,
        tenantPartyId: 'party-1'
      })
    )

    await expect(
      harness.bindCustomerAccountToTenantParty.execute(
        new BindCustomerAccountToTenantPartyCommand({
          tenantId: 'tenant-1',
          customerAccountId: second.id,
          tenantPartyId: 'party-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
  })

  it('BindCustomerAccountToTenantParty / when account already has a different active primary binding / should reject with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-1',
      status: 'ACTIVE',
      partyDisplayName: 'Acme Trading'
    })
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-2',
      status: 'ACTIVE',
      partyDisplayName: 'Beacon Supplies'
    })

    const account = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Acme CRM',
        tags: []
      })
    )

    await harness.bindCustomerAccountToTenantParty.execute(
      new BindCustomerAccountToTenantPartyCommand({
        tenantId: 'tenant-1',
        customerAccountId: account.id,
        tenantPartyId: 'party-1'
      })
    )

    await expect(
      harness.bindCustomerAccountToTenantParty.execute(
        new BindCustomerAccountToTenantPartyCommand({
          tenantId: 'tenant-1',
          customerAccountId: account.id,
          tenantPartyId: 'party-2'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('BindCustomerAccountToTenantParty / when tenantPartyId exists but is not bindable / should reject with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-inactive',
      status: 'INACTIVE',
      partyDisplayName: 'Dormant Party'
    })

    const account = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Acme CRM',
        tags: []
      })
    )

    await expect(
      harness.bindCustomerAccountToTenantParty.execute(
        new BindCustomerAccountToTenantPartyCommand({
          tenantId: 'tenant-1',
          customerAccountId: account.id,
          tenantPartyId: 'party-inactive'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('UpsertCustomerContact / UpsertCustomerAddress / should create and update CRM business relationship records', async () => {
    const harness = createHarness()
    const account = await harness.createCustomerAccount.execute(
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Acme CRM',
        tags: ['priority']
      })
    )

    const createdContact = await harness.upsertCustomerContact.execute(
      new UpsertCustomerContactCommand({
        tenantId: 'tenant-1',
        customerAccountId: account.id,
        displayName: 'Alice Chen',
        roleTitle: 'Procurement Manager',
        email: 'alice@example.com',
        phone: '+86-21-0000-0000',
        isPrimaryContact: true
      })
    )
    const updatedContact = await harness.upsertCustomerContact.execute(
      new UpsertCustomerContactCommand({
        tenantId: 'tenant-1',
        customerAccountId: account.id,
        customerContactId: createdContact.customerContactId,
        displayName: 'Alice Chen',
        roleTitle: 'Senior Procurement Manager',
        email: 'alice@example.com',
        phone: '+86-21-0000-0000',
        isPrimaryContact: true,
        isActive: true
      })
    )

    const createdAddress = await harness.upsertCustomerAddress.execute(
      new UpsertCustomerAddressCommand({
        tenantId: 'tenant-1',
        customerAccountId: account.id,
        label: 'HQ',
        countryCode: 'CN',
        region: 'Shanghai',
        locality: 'Pudong',
        addressLine1: '88 Century Ave',
        postalCode: '200120',
        isPrimaryAddress: true
      })
    )
    const updatedAddress = await harness.upsertCustomerAddress.execute(
      new UpsertCustomerAddressCommand({
        tenantId: 'tenant-1',
        customerAccountId: account.id,
        customerAddressId: createdAddress.customerAddressId,
        label: 'HQ',
        countryCode: 'CN',
        region: 'Shanghai',
        locality: 'Pudong New Area',
        addressLine1: '88 Century Ave',
        addressLine2: 'Tower B',
        postalCode: '200120',
        isPrimaryAddress: true,
        isActive: true
      })
    )

    const fetched = await harness.getCustomerAccount.execute(
      new GetCustomerAccountQuery('tenant-1', account.id)
    )
    const contacts = await harness.listCustomerContacts.execute(
      new ListCustomerContactsQuery('tenant-1', account.id)
    )
    const addresses = await harness.listCustomerAddresses.execute(
      new ListCustomerAddressesQuery('tenant-1', account.id)
    )

    expect(fetched.id).toBe(account.id)
    expect(updatedContact.roleTitle).toBe('Senior Procurement Manager')
    expect(updatedAddress.addressLine2).toBe('Tower B')
    expect(contacts.contacts).toEqual([updatedContact])
    expect(addresses.addresses).toEqual([updatedAddress])
  })
})
