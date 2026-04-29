import { Allow } from 'class-validator'
import {
  AccountTransactionSourceType,
  AccountTransactionStatus,
  CustomerFinancialAccountProviderType,
  ExchangeRateRecord,
  FinancialAccountType,
  SupplierFinancialAccountProviderType
} from '../../domain/models/finance-records'

export class CreateFinancialAccountCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    orgId?: string
    accountType: FinancialAccountType | 'BANK' | 'CASH' | 'WECHAT' | 'ALIPAY' | 'PAYPAL' | 'STRIPE' | 'OTHER_PSP'
    accountName: string
    currencyCode: string
    institutionName?: string
    accountIdentifier: string
    openingBalance?: string
    openingBalanceAsOf?: string
  }

  constructor(payload: CreateFinancialAccountCommand['payload']) {
    this.payload = payload
  }
}

export class UpdateFinancialAccountBasicsCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    financialAccountId: string
    accountName: string
    institutionName?: string
    accountIdentifier?: string
    status: 'ACTIVE' | 'INACTIVE' | 'CLOSED'
  }

  constructor(payload: UpdateFinancialAccountBasicsCommand['payload']) {
    this.payload = payload
  }
}

export class ImportAccountTransactionsCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    financialAccountId: string
    sourceType: AccountTransactionSourceType | 'CSV_IMPORT' | 'FUTURE_API'
    sourceBatchReference?: string
    fileAssetId?: string
    attachmentRef?: string
    importedBy: string
    transactions: Array<{
      direction: 'INFLOW' | 'OUTFLOW'
      amount: string
      currencyCode: string
      transactionTime: string
      valueDate?: string
      externalReference?: string
      counterpartyName?: string
      counterpartyAccountSnapshot?: string
      memo?: string
    }>
  }

  constructor(payload: ImportAccountTransactionsCommand['payload']) {
    this.payload = payload
  }
}

export class RecordAccountTransactionCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    financialAccountId: string
    direction: 'INFLOW' | 'OUTFLOW'
    amount: string
    currencyCode: string
    transactionTime: string
    valueDate?: string
    sourceType?: AccountTransactionSourceType
    status?: AccountTransactionStatus
    externalReference?: string
    counterpartyName?: string
    counterpartyAccountSnapshot?: string
    memo?: string
    fileAssetId?: string
    attachmentRef?: string
  }

  constructor(payload: RecordAccountTransactionCommand['payload']) {
    this.payload = payload
  }
}

export class RegisterCustomerFinancialAccountCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    customerTenantPartyId: string
    accountHolderName: string
    accountProviderType: CustomerFinancialAccountProviderType
    accountIdentifier: string
    currencyCode?: string
    isDefault?: boolean
  }

  constructor(payload: RegisterCustomerFinancialAccountCommand['payload']) {
    this.payload = payload
  }
}

export class RegisterSupplierFinancialAccountCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    supplierTenantPartyId: string
    accountHolderName: string
    accountProviderType: SupplierFinancialAccountProviderType
    accountIdentifier: string
    currencyCode?: string
    isDefault?: boolean
  }

  constructor(payload: RegisterSupplierFinancialAccountCommand['payload']) {
    this.payload = payload
  }
}

export class SetExchangeRateCommand {
  @Allow()
  public readonly payload: {
    tenantId: string
    baseCurrencyCode: string
    quoteCurrencyCode: string
    rateValue: string
    effectiveAt: string
    setBy: string
  }

  constructor(payload: SetExchangeRateCommand['payload']) {
    this.payload = payload
  }
}

export type SetExchangeRateResult = ExchangeRateRecord
