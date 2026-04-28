import { validate } from 'class-validator'
import { BindSupplierToTenantPartyCommand } from '../../src/application/commands/bind-supplier-to-tenant-party.command'
import { ChangeSupplierStatusCommand } from '../../src/application/commands/change-supplier-status.command'
import { CreateSupplierProfileCommand } from '../../src/application/commands/create-supplier-profile.command'
import { UpdateSupplierProfileBasicsCommand } from '../../src/application/commands/update-supplier-profile-basics.command'
import { UpsertSupplierAddressCommand } from '../../src/application/commands/upsert-supplier-address.command'
import { UpsertSupplierContactCommand } from '../../src/application/commands/upsert-supplier-contact.command'
import { UpsertSupplierOfferingCommand } from '../../src/application/commands/upsert-supplier-offering.command'
import { GetSupplierQuery } from '../../src/application/queries/get-supplier.query'
import { ListSupplierAddressesQuery } from '../../src/application/queries/list-supplier-addresses.query'
import { ListSupplierContactsQuery } from '../../src/application/queries/list-supplier-contacts.query'
import { ListSupplierOfferingsByItemQuery } from '../../src/application/queries/list-supplier-offerings-by-item.query'
import { ListSupplierOfferingsBySupplierQuery } from '../../src/application/queries/list-supplier-offerings-by-supplier.query'
import { SearchSuppliersQuery } from '../../src/application/queries/search-suppliers.query'
import { SupplierOfferingStatus, SupplierStatus } from '../../src/domain/models/srm-records'

describe('srm-service cqrs validation L3', () => {
  it('commands and queries / should be whitelisted for the validating command and query buses', async () => {
    const cases = [
      new CreateSupplierProfileCommand({
        tenantId: 'tenant-1',
        displayName: 'Acme SRM',
        supplierNo: 'SUP-001',
        supplierCategory: 'EXPORT',
        tags: ['priority']
      }),
      new UpdateSupplierProfileBasicsCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        displayName: 'Acme SRM Updated',
        supplierNo: 'SUP-001',
        supplierCategory: 'EXPORT',
        tags: ['priority']
      }),
      new BindSupplierToTenantPartyCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        tenantPartyId: 'tenant-party-1'
      }),
      new UpsertSupplierContactCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        displayName: 'Alice',
        roleTitle: 'Buyer',
        isPrimaryContact: true
      }),
      new UpsertSupplierAddressCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        label: 'HQ',
        countryCode: 'CN',
        addressLine1: '88 Century Ave'
      }),
      new UpsertSupplierOfferingCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        itemId: 'item-1',
        targetStatus: SupplierOfferingStatus.ACTIVE
      }),
      new ChangeSupplierStatusCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        targetStatus: SupplierStatus.ACTIVE
      }),
      new SearchSuppliersQuery({
        tenantId: 'tenant-1',
        keyword: 'acme',
        status: SupplierStatus.ACTIVE,
        tenantPartyId: 'tenant-party-1',
        page: 1,
        pageSize: 20
      }),
      new GetSupplierQuery('tenant-1', 'supplier-1'),
      new ListSupplierContactsQuery('tenant-1', 'supplier-1'),
      new ListSupplierAddressesQuery('tenant-1', 'supplier-1'),
      new ListSupplierOfferingsBySupplierQuery({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        status: SupplierOfferingStatus.ACTIVE,
        page: 1,
        pageSize: 20
      }),
      new ListSupplierOfferingsByItemQuery({
        tenantId: 'tenant-1',
        itemId: 'item-1',
        status: SupplierOfferingStatus.ACTIVE,
        page: 1,
        pageSize: 20
      })
    ]

    for (const value of cases) {
      await expect(
        validate(value as object, {
          whitelist: true,
          forbidNonWhitelisted: true,
          forbidUnknownValues: false,
          skipMissingProperties: false
        })
      ).resolves.toEqual([])
    }
  })
})
