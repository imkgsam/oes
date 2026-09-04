import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { CreateFinancialAccountCommand } from '../application/commands/account-management.commands'
import {
  GetFinancialAccountQuery,
  SearchFinancialAccountsQuery
} from '../application/queries/account-query.queries'

/** createValidatingCommandBus builds one validating command bus with a mocked downstream execute path. */
function createValidatingCommandBus() {
  const execute = jest.fn(async (command: unknown) => command)
  const bus = new ValidatingCommandBus({ execute } as unknown as CommandBus)
  return { bus, execute }
}

/** createValidatingQueryBus builds one validating query bus with a mocked downstream execute path. */
function createValidatingQueryBus() {
  const execute = jest.fn(async (query: unknown) => query)
  const bus = new ValidatingQueryBus({ execute } as unknown as QueryBus)
  return { bus, execute }
}

describe('finance-service cqrs validation wiring Contract', () => {
  it('CreateFinancialAccountCommand / when payload wrapper is present / should pass validating command bus', async () => {
    const { bus, execute } = createValidatingCommandBus()
    const command = new CreateFinancialAccountCommand({
      tenantId: 'tenant-1',
      orgId: 'org-1',
      accountType: 'BANK',
      accountName: 'Main Account',
      currencyCode: 'USD',
      accountIdentifier: '6222000012345678'
    })

    await expect(bus.execute(command)).resolves.toBe(command)
    expect(execute).toHaveBeenCalledWith(command)
  })

  it('SearchFinancialAccountsQuery / when input wrapper is present / should pass validating query bus', async () => {
    const { bus, execute } = createValidatingQueryBus()
    const query = new SearchFinancialAccountsQuery({
      tenantId: 'tenant-1',
      keyword: 'main account',
      page: 1,
      pageSize: 20
    })

    await expect(bus.execute(query)).resolves.toBe(query)
    expect(execute).toHaveBeenCalledWith(query)
  })

  it('GetFinancialAccountQuery / when scalar fields are present / should pass validating query bus', async () => {
    const { bus, execute } = createValidatingQueryBus()
    const query = new GetFinancialAccountQuery('tenant-1', 'account-1')

    await expect(bus.execute(query)).resolves.toBe(query)
    expect(execute).toHaveBeenCalledWith(query)
  })
})
