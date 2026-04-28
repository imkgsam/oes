import { validate } from 'class-validator'
import { BindCustomerAccountToTenantPartyCommand } from '../../src/application/commands/bind-customer-account-to-tenant-party.command'
import { ChangeCustomerStatusCommand } from '../../src/application/commands/change-customer-status.command'
import { CreateCustomerAccountCommand } from '../../src/application/commands/create-customer-account.command'
import { UpdateCustomerAccountBasicsCommand } from '../../src/application/commands/update-customer-account-basics.command'
import { UpsertCustomerAddressCommand } from '../../src/application/commands/upsert-customer-address.command'
import { UpsertCustomerContactCommand } from '../../src/application/commands/upsert-customer-contact.command'
import { GetCustomerAccountQuery } from '../../src/application/queries/get-customer-account.query'
import { ListCustomerAddressesQuery } from '../../src/application/queries/list-customer-addresses.query'
import { ListCustomerContactsQuery } from '../../src/application/queries/list-customer-contacts.query'
import { SearchCustomerAccountsQuery } from '../../src/application/queries/search-customer-accounts.query'
import { SearchSelectableCustomersQuery } from '../../src/application/queries/search-selectable-customers.query'
import { CustomerStatus } from '../../src/domain/models/crm-records'

describe('crm-service cqrs validation L3', () => {
  it('commands and queries / should be whitelisted for the validating command and query buses', async () => {
    const cases = [
      new CreateCustomerAccountCommand({
        tenantId: 'tenant-1',
        displayName: 'Acme CRM',
        customerCategory: 'EXPORT',
        tags: ['priority']
      }),
      new UpdateCustomerAccountBasicsCommand({
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        displayName: 'Acme CRM Updated',
        customerCategory: 'EXPORT',
        tags: ['priority']
      }),
      new BindCustomerAccountToTenantPartyCommand({
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        tenantPartyId: 'tenant-party-1'
      }),
      new UpsertCustomerContactCommand({
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        displayName: 'Alice',
        roleTitle: 'Buyer',
        isPrimaryContact: true
      }),
      new UpsertCustomerAddressCommand({
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        label: 'HQ',
        countryCode: 'CN',
        addressLine1: '88 Century Ave'
      }),
      new ChangeCustomerStatusCommand({
        tenantId: 'tenant-1',
        customerAccountId: 'customer-1',
        targetStatus: CustomerStatus.ACTIVE_CUSTOMER
      }),
      new SearchSelectableCustomersQuery({
        tenantId: 'tenant-1',
        keyword: 'acme',
        page: 1,
        pageSize: 20
      }),
      new SearchCustomerAccountsQuery({
        tenantId: 'tenant-1',
        keyword: 'acme',
        status: CustomerStatus.ACTIVE_CUSTOMER,
        primaryTenantPartyId: 'tenant-party-1',
        page: 1,
        pageSize: 20
      }),
      new GetCustomerAccountQuery('tenant-1', 'customer-1'),
      new ListCustomerContactsQuery('tenant-1', 'customer-1'),
      new ListCustomerAddressesQuery('tenant-1', 'customer-1')
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
