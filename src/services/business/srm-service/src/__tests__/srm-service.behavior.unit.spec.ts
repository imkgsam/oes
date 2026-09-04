import { status } from '@grpc/grpc-js'
import { BindSupplierToTenantPartyCommand } from '../application/commands/bind-supplier-to-tenant-party.command'
import { BindSupplierToTenantPartyHandler } from '../application/commands/bind-supplier-to-tenant-party.handler'
import { ChangeSupplierStatusCommand } from '../application/commands/change-supplier-status.command'
import { ChangeSupplierStatusHandler } from '../application/commands/change-supplier-status.handler'
import { CreateSupplierProfileCommand } from '../application/commands/create-supplier-profile.command'
import { CreateSupplierProfileHandler } from '../application/commands/create-supplier-profile.handler'
import { UpsertSupplierAddressCommand } from '../application/commands/upsert-supplier-address.command'
import { UpsertSupplierAddressHandler } from '../application/commands/upsert-supplier-address.handler'
import { UpsertSupplierContactCommand } from '../application/commands/upsert-supplier-contact.command'
import { UpsertSupplierContactHandler } from '../application/commands/upsert-supplier-contact.handler'
import { UpsertSupplierOfferingCommand } from '../application/commands/upsert-supplier-offering.command'
import { UpsertSupplierOfferingHandler } from '../application/commands/upsert-supplier-offering.handler'
import { ItemLookupPort, ItemLookupResult } from '../application/ports/item-lookup.port'
import { TenantPartyLookupPort, TenantPartyLookupResult } from '../application/ports/tenant-party-lookup.port'
import { GetSupplierHandler } from '../application/queries/get-supplier.handler'
import { GetSupplierQuery } from '../application/queries/get-supplier.query'
import { ListSupplierAddressesHandler } from '../application/queries/list-supplier-addresses.handler'
import { ListSupplierAddressesQuery } from '../application/queries/list-supplier-addresses.query'
import { ListSupplierContactsHandler } from '../application/queries/list-supplier-contacts.handler'
import { ListSupplierContactsQuery } from '../application/queries/list-supplier-contacts.query'
import { ListSupplierOfferingsByItemHandler } from '../application/queries/list-supplier-offerings-by-item.handler'
import { ListSupplierOfferingsByItemQuery } from '../application/queries/list-supplier-offerings-by-item.query'
import { ListSupplierOfferingsBySupplierHandler } from '../application/queries/list-supplier-offerings-by-supplier.handler'
import { ListSupplierOfferingsBySupplierQuery } from '../application/queries/list-supplier-offerings-by-supplier.query'
import { SearchSuppliersHandler } from '../application/queries/search-suppliers.handler'
import { SearchSuppliersQuery } from '../application/queries/search-suppliers.query'
import {
  SupplierOfferingStatus,
  SupplierStatus
} from '../domain/models/srm-records'
import { InMemorySupplierAddressRepository } from '../infrastructure/repositories/in-memory/in-memory-supplier-address.repository'
import { InMemorySupplierContactRepository } from '../infrastructure/repositories/in-memory/in-memory-supplier-contact.repository'
import { InMemorySupplierOfferingRepository } from '../infrastructure/repositories/in-memory/in-memory-supplier-offering.repository'
import { InMemorySupplierProfileRepository } from '../infrastructure/repositories/in-memory/in-memory-supplier-profile.repository'
import { SrmInMemoryStore } from '../infrastructure/store/srm-in-memory-store'

/** StubTenantPartyLookupPort controls tenant-party lookup results so Unit can focus on SRM invariants. */
class StubTenantPartyLookupPort implements TenantPartyLookupPort {
  private readonly tenantParties = new Map<string, TenantPartyLookupResult>()

  seed(result: TenantPartyLookupResult): void {
    this.tenantParties.set(`${result.tenantId}:${result.tenantPartyId}`, result)
  }

  async getTenantPartyById(tenantId: string, tenantPartyId: string): Promise<TenantPartyLookupResult | null> {
    return this.tenantParties.get(`${tenantId}:${tenantPartyId}`) ?? null
  }
}

/** StubItemLookupPort controls item-master lookup results so Unit can focus on offering invariants. */
class StubItemLookupPort implements ItemLookupPort {
  private readonly items = new Map<string, ItemLookupResult>()

  seed(result: ItemLookupResult): void {
    this.items.set(result.itemId, result)
  }

  async getItemById(_tenantId: string, itemId: string): Promise<ItemLookupResult | null> {
    return this.items.get(itemId) ?? null
  }
}

function createHarness() {
  const store = new SrmInMemoryStore()
  const profileRepository = new InMemorySupplierProfileRepository(store)
  const contactRepository = new InMemorySupplierContactRepository(store)
  const addressRepository = new InMemorySupplierAddressRepository(store)
  const offeringRepository = new InMemorySupplierOfferingRepository(store)
  const tenantPartyLookup = new StubTenantPartyLookupPort()
  const itemLookup = new StubItemLookupPort()

  return {
    tenantPartyLookup,
    itemLookup,
    createSupplierProfile: new CreateSupplierProfileHandler(profileRepository),
    bindSupplierToTenantParty: new BindSupplierToTenantPartyHandler(profileRepository, tenantPartyLookup),
    changeSupplierStatus: new ChangeSupplierStatusHandler(
      profileRepository,
      offeringRepository,
      tenantPartyLookup
    ),
    upsertSupplierContact: new UpsertSupplierContactHandler(profileRepository, contactRepository),
    upsertSupplierAddress: new UpsertSupplierAddressHandler(profileRepository, addressRepository),
    upsertSupplierOffering: new UpsertSupplierOfferingHandler(
      profileRepository,
      offeringRepository,
      itemLookup
    ),
    getSupplier: new GetSupplierHandler(profileRepository),
    searchSuppliers: new SearchSuppliersHandler(profileRepository),
    listSupplierContacts: new ListSupplierContactsHandler(profileRepository, contactRepository),
    listSupplierAddresses: new ListSupplierAddressesHandler(profileRepository, addressRepository),
    listSupplierOfferingsBySupplier: new ListSupplierOfferingsBySupplierHandler(
      profileRepository,
      offeringRepository
    ),
    listSupplierOfferingsByItem: new ListSupplierOfferingsByItemHandler(offeringRepository)
  }
}

describe('srm-service behavior Unit', () => {
  it('ChangeSupplierStatus / when supplier has no tenantParty binding / should reject ACTIVE with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    const profile = await harness.createSupplierProfile.execute(
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'Unbound Supplier',
        tags: []
      })
    )

    await expect(
      harness.changeSupplierStatus.execute(
        new ChangeSupplierStatusCommand({
          tenantId: 'tenant-1',
          supplierId: profile.id,
          targetStatus: SupplierStatus.ACTIVE
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('ChangeSupplierStatus / when bound tenantParty is inactive / should reject ACTIVE with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-inactive',
      status: 'INACTIVE',
      partyDisplayName: 'Dormant Party'
    })

    const profile = await harness.createSupplierProfile.execute(
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'Dormant Supplier',
        tags: []
      })
    )

    await harness.bindSupplierToTenantParty.execute(
      new BindSupplierToTenantPartyCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        tenantPartyId: 'party-inactive'
      })
    )

    await expect(
      harness.changeSupplierStatus.execute(
        new ChangeSupplierStatusCommand({
          tenantId: 'tenant-1',
          supplierId: profile.id,
          targetStatus: SupplierStatus.ACTIVE
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('BindSupplierToTenantParty / when another supplier already owns the tenantPartyId in the same tenant / should reject with ALREADY_EXISTS', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-1',
      status: 'ACTIVE',
      partyDisplayName: 'Acme Trading'
    })

    const first = await harness.createSupplierProfile.execute(
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'First Supplier',
        tags: []
      })
    )
    const second = await harness.createSupplierProfile.execute(
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'Second Supplier',
        tags: []
      })
    )

    await harness.bindSupplierToTenantParty.execute(
      new BindSupplierToTenantPartyCommand({
        tenantId: 'tenant-1',
        supplierId: first.id,
        tenantPartyId: 'party-1'
      })
    )

    await expect(
      harness.bindSupplierToTenantParty.execute(
        new BindSupplierToTenantPartyCommand({
          tenantId: 'tenant-1',
          supplierId: second.id,
          tenantPartyId: 'party-1'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.ALREADY_EXISTS
      }
    })
  })

  it('UpsertSupplierOffering / when supplier is not ACTIVE / should reject ACTIVE offering with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Raw Material',
      active: true,
      purchasable: true
    })

    const profile = await harness.createSupplierProfile.execute(
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'Inactive Supplier',
        tags: []
      })
    )

    await expect(
      harness.upsertSupplierOffering.execute(
        new UpsertSupplierOfferingCommand({
          tenantId: 'tenant-1',
          supplierId: profile.id,
          itemId: 'item-1',
          targetStatus: SupplierOfferingStatus.ACTIVE
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('UpsertSupplierOffering / when item is not purchasable / should reject ACTIVE offering with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-active',
      status: 'ACTIVE',
      partyDisplayName: 'Acme Trading'
    })
    harness.itemLookup.seed({
      itemId: 'item-2',
      itemCode: 'FG-002',
      itemName: 'Finished Good',
      active: true,
      purchasable: false
    })

    const profile = await harness.createSupplierProfile.execute(
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'Active Supplier',
        tags: []
      })
    )

    await harness.bindSupplierToTenantParty.execute(
      new BindSupplierToTenantPartyCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        tenantPartyId: 'party-active'
      })
    )
    await harness.changeSupplierStatus.execute(
      new ChangeSupplierStatusCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        targetStatus: SupplierStatus.ACTIVE
      })
    )

    await expect(
      harness.upsertSupplierOffering.execute(
        new UpsertSupplierOfferingCommand({
          tenantId: 'tenant-1',
          supplierId: profile.id,
          itemId: 'item-2',
          targetStatus: SupplierOfferingStatus.ACTIVE
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('UpsertSupplierOffering / when item is inactive / should reject ACTIVE offering with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-active',
      status: 'ACTIVE',
      partyDisplayName: 'Acme Trading'
    })
    harness.itemLookup.seed({
      itemId: 'item-inactive',
      itemCode: 'RM-INACTIVE',
      itemName: 'Inactive Raw Material',
      active: false,
      purchasable: true
    })

    const profile = await harness.createSupplierProfile.execute(
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'Active Supplier',
        tags: []
      })
    )

    await harness.bindSupplierToTenantParty.execute(
      new BindSupplierToTenantPartyCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        tenantPartyId: 'party-active'
      })
    )
    await harness.changeSupplierStatus.execute(
      new ChangeSupplierStatusCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        targetStatus: SupplierStatus.ACTIVE
      })
    )

    await expect(
      harness.upsertSupplierOffering.execute(
        new UpsertSupplierOfferingCommand({
          tenantId: 'tenant-1',
          supplierId: profile.id,
          itemId: 'item-inactive',
          targetStatus: SupplierOfferingStatus.ACTIVE
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('SearchSuppliers / contact-address upserts / offering queries / should return the frozen phase 1 supplier master surface', async () => {
    const harness = createHarness()
    harness.tenantPartyLookup.seed({
      tenantId: 'tenant-1',
      tenantPartyId: 'party-active',
      status: 'ACTIVE',
      partyDisplayName: 'Acme Trading'
    })
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Raw Material',
      active: true,
      purchasable: true
    })

    const profile = await harness.createSupplierProfile.execute(
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'Acme SRM',
        supplierCategory: 'EXPORT',
        tags: ['priority']
      })
    )

    await harness.bindSupplierToTenantParty.execute(
      new BindSupplierToTenantPartyCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        tenantPartyId: 'party-active'
      })
    )
    await harness.changeSupplierStatus.execute(
      new ChangeSupplierStatusCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        targetStatus: SupplierStatus.ACTIVE
      })
    )

    const createdContact = await harness.upsertSupplierContact.execute(
      new UpsertSupplierContactCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        displayName: 'Alice Chen',
        roleTitle: 'Procurement Manager',
        email: 'alice@example.com',
        phone: '+86-21-0000-0000',
        isPrimaryContact: true
      })
    )
    const createdAddress = await harness.upsertSupplierAddress.execute(
      new UpsertSupplierAddressCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        label: 'HQ',
        countryCode: 'CN',
        region: 'Shanghai',
        locality: 'Pudong',
        addressLine1: '88 Century Ave',
        postalCode: '200120',
        isPrimaryAddress: true
      })
    )
    const offering = await harness.upsertSupplierOffering.execute(
      new UpsertSupplierOfferingCommand({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        itemId: 'item-1',
        targetStatus: SupplierOfferingStatus.ACTIVE
      })
    )

    const fetched = await harness.getSupplier.execute(new GetSupplierQuery('tenant-1', profile.id))
    const suppliers = await harness.searchSuppliers.execute(
      new SearchSuppliersQuery({
        tenantId: 'tenant-1',
        tenantPartyId: 'party-active',
        status: SupplierStatus.ACTIVE,
        page: 1,
        pageSize: 20
      })
    )
    const contacts = await harness.listSupplierContacts.execute(
      new ListSupplierContactsQuery('tenant-1', profile.id)
    )
    const addresses = await harness.listSupplierAddresses.execute(
      new ListSupplierAddressesQuery('tenant-1', profile.id)
    )
    const offeringsBySupplier = await harness.listSupplierOfferingsBySupplier.execute(
      new ListSupplierOfferingsBySupplierQuery({
        tenantId: 'tenant-1',
        supplierId: profile.id,
        status: SupplierOfferingStatus.ACTIVE,
        page: 1,
        pageSize: 20
      })
    )
    const offeringsByItem = await harness.listSupplierOfferingsByItem.execute(
      new ListSupplierOfferingsByItemQuery({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        status: SupplierOfferingStatus.ACTIVE,
        page: 1,
        pageSize: 20
      })
    )

    expect(fetched.id).toBe(profile.id)
    expect(fetched.partyBinding?.tenantPartyId).toBe('party-active')
    expect(suppliers.suppliers.map((item) => item.id)).toEqual([profile.id])
    expect(contacts.contacts).toEqual([createdContact])
    expect(addresses.addresses).toEqual([createdAddress])
    expect(offeringsBySupplier.offerings).toEqual([offering])
    expect(offeringsByItem.offerings).toEqual([offering])
  })
})
