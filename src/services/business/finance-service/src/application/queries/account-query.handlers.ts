import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { TOKENS } from '../../common/constants/tokens'
import { FINANCE_NOT_FOUND } from '../../common/errors/finance.errors'
import { cloneRecord } from '../../domain/models/finance-records'
import { FinanceRepository } from '../../domain/repositories/finance.repository'
import { assertRequiredString, normalizePageInput } from '../support/finance-assertions'
import {
  GetExchangeRateQuery,
  GetFinancialAccountQuery,
  SearchAccountTransactionsQuery,
  SearchFinancialAccountsQuery
} from './account-query.queries'

/** GetFinancialAccountHandler loads one financial account and computes its current balance from snapshot plus confirmed transactions. */
@QueryHandler(GetFinancialAccountQuery)
export class GetFinancialAccountHandler implements IQueryHandler<GetFinancialAccountQuery> {
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: GetFinancialAccountQuery) {
    assertRequiredString(query.tenantId, 'tenantId')
    assertRequiredString(query.financialAccountId, 'financialAccountId')
    const account = await this.repository.findFinancialAccountById(query.tenantId, query.financialAccountId)
    if (!account) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'financialAccount'
      })
    }

    return {
      ...cloneRecord(account),
      currentBalance: await this.repository.getCalculatedAccountBalance(query.tenantId, account.id)
    }
  }
}

/** SearchFinancialAccountsHandler lists financial accounts with current balances while staying on the finance-owned read model. */
@QueryHandler(SearchFinancialAccountsQuery)
export class SearchFinancialAccountsHandler
  implements IQueryHandler<SearchFinancialAccountsQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: SearchFinancialAccountsQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result = await this.repository.searchFinancialAccounts({
      ...query.input,
      page,
      pageSize
    })

    return {
      financialAccounts: await Promise.all(
        result.items.map(async (account) => ({
          ...cloneRecord(account),
          currentBalance: await this.repository.getCalculatedAccountBalance(
            query.input.tenantId,
            account.id
          )
        }))
      ),
      total: result.total,
      page,
      pageSize
    }
  }
}

/** SearchAccountTransactionsHandler lists real account transactions with allocation state for finance payment operations. */
@QueryHandler(SearchAccountTransactionsQuery)
export class SearchAccountTransactionsHandler
  implements IQueryHandler<SearchAccountTransactionsQuery>
{
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: SearchAccountTransactionsQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result = await this.repository.searchAccountTransactions({
      ...query.input,
      page,
      pageSize
    })

    return {
      accountTransactions: result.items.map((item) => cloneRecord(item)),
      total: result.total,
      page,
      pageSize
    }
  }
}

/** GetExchangeRateHandler resolves the finance-owned standard FX truth for one currency pair. */
@QueryHandler(GetExchangeRateQuery)
export class GetExchangeRateHandler implements IQueryHandler<GetExchangeRateQuery> {
  constructor(
    @Inject(TOKENS.FINANCE_REPOSITORY)
    private readonly repository: FinanceRepository
  ) {}

  async execute(query: GetExchangeRateQuery) {
    assertRequiredString(query.input.tenantId, 'tenantId')
    assertRequiredString(query.input.baseCurrencyCode, 'baseCurrencyCode')
    assertRequiredString(query.input.quoteCurrencyCode, 'quoteCurrencyCode')
    const rate = await this.repository.getExchangeRate(query.input)
    if (!rate) {
      throw ExceptionFactory.application(FINANCE_NOT_FOUND, {
        resource: 'exchangeRate'
      })
    }

    return cloneRecord(rate)
  }
}
