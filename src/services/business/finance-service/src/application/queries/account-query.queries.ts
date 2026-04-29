import { Allow } from 'class-validator'
import {
  AccountTransactionAllocationStatus,
  AccountTransactionDirection,
  AccountTransactionSourceType,
  FinancialAccountStatus,
  FinancialAccountType
} from '../../domain/models/finance-records'

export class GetFinancialAccountQuery {
  @Allow()
  public readonly tenantId: string

  @Allow()
  public readonly financialAccountId: string

  constructor(tenantId: string, financialAccountId: string) {
    this.tenantId = tenantId
    this.financialAccountId = financialAccountId
  }
}

export class SearchFinancialAccountsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    keyword?: string
    accountType?: FinancialAccountType
    currencyCode?: string
    status?: FinancialAccountStatus
    page?: number
    pageSize?: number
  }

  constructor(input: SearchFinancialAccountsQuery['input']) {
    this.input = input
  }
}

export class SearchAccountTransactionsQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    orgId?: string
    financialAccountId?: string
    direction?: AccountTransactionDirection
    sourceType?: AccountTransactionSourceType
    allocationStatus?: AccountTransactionAllocationStatus
    externalReference?: string
    occurredFrom?: string
    occurredTo?: string
    page?: number
    pageSize?: number
  }

  constructor(input: SearchAccountTransactionsQuery['input']) {
    this.input = input
  }
}

export class GetExchangeRateQuery {
  @Allow()
  public readonly input: {
    tenantId: string
    baseCurrencyCode: string
    quoteCurrencyCode: string
    effectiveAt?: string
  }

  constructor(input: GetExchangeRateQuery['input']) {
    this.input = input
  }
}
