import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  AccountTransactionAllocationStatus,
  AccountTransactionDirection,
  AccountTransactionSourceType,
  AccountTransactionStatus,
  CustomerFinancialAccountProviderType,
  FinanceReleaseSignalStatus,
  FinancialAccountStatus,
  FinancialAccountType,
  ReceivableScheduleStatus
} from '@oes/common/generated/finance_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { FinanceManagementGrpcAdapter } from './adapters/finance-management-grpc.adapter'
import { FinanceQueryGrpcAdapter } from './adapters/finance-query-grpc.adapter'

type FinancialAccountTypeValue =
  | 'ALIPAY'
  | 'BANK'
  | 'CASH'
  | 'OTHER_PSP'
  | 'PAYPAL'
  | 'STRIPE'
  | 'WECHAT'
type FinancialAccountStatusValue = 'ACTIVE' | 'CLOSED' | 'INACTIVE'
type AccountTransactionDirectionValue = 'INFLOW' | 'OUTFLOW'
type AccountTransactionSourceTypeValue = 'CSV_IMPORT' | 'FUTURE_API' | 'MANUAL'
type AccountTransactionStatusValue = 'CONFIRMED' | 'DRAFT' | 'VOIDED'
type AccountTransactionAllocationStatusValue = 'FULLY_ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'UNALLOCATED'
type CustomerFinancialAccountProviderTypeValue =
  | 'ALIPAY'
  | 'BANK'
  | 'OTHER'
  | 'PAYPAL'
  | 'STRIPE'
  | 'WECHAT'
type FinanceReleaseSignalStatusValue = 'HELD' | 'RELEASED' | 'REVIEW_REQUIRED'
type ReceivableScheduleStatusValue =
  | 'CANCELLED'
  | 'ON_HOLD'
  | 'OPEN'
  | 'PAID'
  | 'PARTIALLY_PAID'

@Injectable()
// Builds the tenant-scoped finance phase 1A BFF model without widening the underlying finance-service contract or ownership boundaries.
export class FinanceService {
  constructor(
    private readonly financeQueryAdapter: FinanceQueryGrpcAdapter,
    private readonly financeManagementAdapter: FinanceManagementGrpcAdapter
  ) {}

  async searchFinancialAccounts(
    tenantId: string,
    query: {
      accountType?: string
      currencyCode?: string
      keyword?: string
      orgId?: string
      page?: number
      pageSize?: number
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeQueryAdapter.searchFinancialAccounts(
      {
        accountType: toGrpcFinancialAccountType(query.accountType),
        currencyCode: normalize(query.currencyCode),
        keyword: normalize(query.keyword),
        orgId: normalize(query.orgId),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        status: toGrpcFinancialAccountStatus(query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      financialAccounts: (result.financialAccounts ?? []).map((account) =>
        mapFinancialAccountSummary(account)
      ),
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      total: Number(result.total ?? 0)
    }
  }

  async getFinancialAccount(
    tenantId: string,
    financialAccountId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.financeQueryAdapter.getFinancialAccount(
      {
        financialAccountId: requireNonBlank(financialAccountId, 'financialAccountId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapFinancialAccount(result.financialAccount)
  }

  async searchAccountTransactions(
    tenantId: string,
    query: {
      allocationStatus?: string
      direction?: string
      externalReference?: string
      financialAccountId?: string
      occurredFrom?: string
      occurredTo?: string
      orgId?: string
      page?: number
      pageSize?: number
      sourceType?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeQueryAdapter.searchAccountTransactions(
      {
        allocationStatus: toGrpcAllocationStatus(query.allocationStatus),
        direction: toGrpcTransactionDirection(query.direction),
        externalReference: normalize(query.externalReference),
        financialAccountId: normalize(query.financialAccountId),
        occurredFrom: normalize(query.occurredFrom),
        occurredTo: normalize(query.occurredTo),
        orgId: normalize(query.orgId),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        sourceType: toGrpcTransactionSourceType(query.sourceType),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      accountTransactions: (result.accountTransactions ?? []).map((transaction) =>
        mapAccountTransaction(transaction)
      ),
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      total: Number(result.total ?? 0)
    }
  }

  async createFinancialAccount(
    tenantId: string,
    input: {
      accountIdentifier: string
      accountName: string
      accountType: string
      currencyCode: string
      institutionName?: string
      openingBalance?: string
      openingBalanceAsOf?: string
      orgId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.createFinancialAccount(
      {
        accountIdentifier: requireNonBlank(input.accountIdentifier, 'accountIdentifier'),
        accountName: requireNonBlank(input.accountName, 'accountName'),
        accountType: requireGrpcFinancialAccountType(input.accountType),
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        institutionName: normalize(input.institutionName),
        openingBalance: normalize(input.openingBalance),
        openingBalanceAsOf: normalize(input.openingBalanceAsOf),
        orgId: normalize(input.orgId),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapFinancialAccount(result.financialAccount)
  }

  async updateFinancialAccountBasics(
    tenantId: string,
    financialAccountId: string,
    input: {
      accountIdentifier?: string
      accountName: string
      auditReason?: string
      institutionName?: string
      status: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.updateFinancialAccountBasics(
      {
        accountIdentifier: normalize(input.accountIdentifier),
        accountName: requireNonBlank(input.accountName, 'accountName'),
        auditReason: normalize(input.auditReason),
        financialAccountId: requireNonBlank(financialAccountId, 'financialAccountId'),
        institutionName: normalize(input.institutionName),
        status: requireGrpcFinancialAccountStatus(input.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapFinancialAccount(result.financialAccount)
  }

  async importAccountTransactions(
    tenantId: string,
    financialAccountId: string,
    input: {
      attachmentRef?: string
      auditReason?: string
      fileAssetId?: string
      importedBy?: string
      sourceBatchReference?: string
      sourceType?: string
      transactions: Array<{
        amount: string
        counterpartyAccountSnapshot?: string
        counterpartyName?: string
        currencyCode: string
        direction: string
        externalReference?: string
        memo?: string
        transactionTime: string
        valueDate?: string
      }>
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.importAccountTransactions(
      {
        attachmentRef: normalize(input.attachmentRef),
        auditReason: normalize(input.auditReason),
        fileAssetId: normalize(input.fileAssetId),
        financialAccountId: requireNonBlank(financialAccountId, 'financialAccountId'),
        importedBy: normalize(input.importedBy),
        sourceBatchReference: normalize(input.sourceBatchReference),
        sourceType: requireGrpcTransactionSourceType(input.sourceType ?? 'CSV_IMPORT'),
        tenantId: this.resolveTenantId(tenantId, source),
        transactions: (input.transactions ?? []).map((transaction) => ({
          amount: requireNonBlank(transaction.amount, 'transactions.amount'),
          counterpartyAccountSnapshot: normalize(transaction.counterpartyAccountSnapshot),
          counterpartyName: normalize(transaction.counterpartyName),
          currencyCode: requireNonBlank(transaction.currencyCode, 'transactions.currencyCode'),
          direction: requireGrpcTransactionDirection(transaction.direction),
          externalReference: normalize(transaction.externalReference),
          memo: normalize(transaction.memo),
          transactionTime: requireNonBlank(transaction.transactionTime, 'transactions.transactionTime'),
          valueDate: normalize(transaction.valueDate)
        }))
      },
      source
    )

    return {
      accountTransactionIds: result.accountTransactionIds ?? [],
      batch: result.batch
        ? {
            acceptedCount: Number(result.batch.acceptedCount ?? 0),
            accountTransactionImportBatchId:
              result.batch.accountTransactionImportBatchId ?? '',
            attachmentRef: result.batch.attachmentRef ?? '',
            duplicateCount: Number(result.batch.duplicateCount ?? 0),
            failedCount: Number(result.batch.failedCount ?? 0),
            fileAssetId: result.batch.fileAssetId ?? '',
            sourceBatchReference: result.batch.sourceBatchReference ?? '',
            sourceType: result.batch.sourceType ?? '',
            totalRows: Number(result.batch.totalRows ?? 0)
          }
        : undefined
    }
  }

  async recordAccountTransaction(
    tenantId: string,
    financialAccountId: string,
    input: {
      amount: string
      attachmentRef?: string
      auditReason?: string
      counterpartyAccountSnapshot?: string
      counterpartyName?: string
      currencyCode: string
      direction: string
      externalReference?: string
      fileAssetId?: string
      memo?: string
      sourceType?: string
      status?: string
      transactionTime: string
      valueDate?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.recordAccountTransaction(
      {
        amount: requireNonBlank(input.amount, 'amount'),
        attachmentRef: normalize(input.attachmentRef),
        auditReason: normalize(input.auditReason),
        counterpartyAccountSnapshot: normalize(input.counterpartyAccountSnapshot),
        counterpartyName: normalize(input.counterpartyName),
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        direction: requireGrpcTransactionDirection(input.direction),
        externalReference: normalize(input.externalReference),
        fileAssetId: normalize(input.fileAssetId),
        financialAccountId: requireNonBlank(financialAccountId, 'financialAccountId'),
        memo: normalize(input.memo),
        sourceType: requireGrpcTransactionSourceType(input.sourceType ?? 'MANUAL'),
        status: requireGrpcTransactionStatus(input.status ?? 'CONFIRMED'),
        tenantId: this.resolveTenantId(tenantId, source),
        transactionTime: requireNonBlank(input.transactionTime, 'transactionTime'),
        valueDate: normalize(input.valueDate)
      },
      source
    )

    return mapAccountTransaction(result.accountTransaction)
  }

  async registerCustomerFinancialAccount(
    tenantId: string,
    input: {
      accountHolderName: string
      accountIdentifier: string
      accountProviderType: string
      auditReason?: string
      currencyCode?: string
      customerTenantPartyId: string
      isDefault?: boolean
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.registerCustomerFinancialAccount(
      {
        accountHolderName: requireNonBlank(input.accountHolderName, 'accountHolderName'),
        accountIdentifier: requireNonBlank(input.accountIdentifier, 'accountIdentifier'),
        accountProviderType: requireGrpcCustomerAccountProviderType(input.accountProviderType),
        auditReason: normalize(input.auditReason),
        currencyCode: normalize(input.currencyCode),
        customerTenantPartyId: requireNonBlank(
          input.customerTenantPartyId,
          'customerTenantPartyId'
        ),
        isDefault: Boolean(input.isDefault),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapCustomerFinancialAccount(result.customerFinancialAccount)
  }

  async getExchangeRate(
    tenantId: string,
    query: {
      baseCurrencyCode: string
      effectiveAt?: string
      quoteCurrencyCode: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeQueryAdapter.getExchangeRate(
      {
        baseCurrencyCode: requireNonBlank(query.baseCurrencyCode, 'baseCurrencyCode'),
        effectiveAt: normalize(query.effectiveAt),
        quoteCurrencyCode: requireNonBlank(query.quoteCurrencyCode, 'quoteCurrencyCode'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapExchangeRate(result.exchangeRate)
  }

  async setExchangeRate(
    tenantId: string,
    input: {
      auditReason?: string
      baseCurrencyCode: string
      effectiveAt: string
      quoteCurrencyCode: string
      rateValue: string
      setBy?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.setExchangeRate(
      {
        auditReason: normalize(input.auditReason),
        baseCurrencyCode: requireNonBlank(input.baseCurrencyCode, 'baseCurrencyCode'),
        effectiveAt: requireNonBlank(input.effectiveAt, 'effectiveAt'),
        quoteCurrencyCode: requireNonBlank(input.quoteCurrencyCode, 'quoteCurrencyCode'),
        rateValue: requireNonBlank(input.rateValue, 'rateValue'),
        setBy: normalize(input.setBy) ?? resolveOperatorId(source),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapExchangeRate(result.exchangeRate)
  }

  async searchReceivableSchedules(
    tenantId: string,
    query: {
      customerTenantPartyId?: string
      dueFrom?: string
      dueTo?: string
      financeReleaseStatus?: string
      keyword?: string
      orgId?: string
      overdueOnly?: boolean
      page?: number
      pageSize?: number
      sourceSalesOrderId?: string
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeQueryAdapter.searchReceivableSchedules(
      {
        customerTenantPartyId: normalize(query.customerTenantPartyId),
        dueFrom: normalize(query.dueFrom),
        dueTo: normalize(query.dueTo),
        financeReleaseStatus: toGrpcFinanceReleaseStatus(query.financeReleaseStatus),
        keyword: normalize(query.keyword),
        orgId: normalize(query.orgId),
        overdueOnly: Boolean(query.overdueOnly),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        sourceSalesOrderId: normalize(query.sourceSalesOrderId),
        status: toGrpcReceivableStatus(query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      receivableSchedules: (result.receivableSchedules ?? []).map((schedule) => ({
        currencyCode: schedule.currencyCode ?? '',
        customerDisplayName: schedule.customerDisplayName ?? '',
        customerTenantPartyId: schedule.customerTenantPartyId ?? '',
        financeReleaseStatus: fromGrpcFinanceReleaseStatus(schedule.financeReleaseStatus),
        nearestDueDate: schedule.nearestDueDate ?? '',
        outstandingAmount: schedule.outstandingAmount ?? '',
        receivableScheduleId: schedule.receivableScheduleId ?? '',
        scheduleNo: schedule.scheduleNo ?? '',
        sourceSalesOrderId: schedule.sourceSalesOrderId ?? '',
        status: fromGrpcReceivableStatus(schedule.status)
      })),
      total: Number(result.total ?? 0)
    }
  }

  async getReceivableSchedule(
    tenantId: string,
    receivableScheduleId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.financeQueryAdapter.getReceivableSchedule(
      {
        receivableScheduleId: requireNonBlank(receivableScheduleId, 'receivableScheduleId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapReceivableSchedule(result.receivableSchedule)
  }

  async getFinanceReleaseSignal(
    tenantId: string,
    salesOrderId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.financeQueryAdapter.getFinanceReleaseSignal(
      {
        salesOrderId: requireNonBlank(salesOrderId, 'salesOrderId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapFinanceReleaseSignal(result.financeReleaseSignal)
  }

  async createReceivableScheduleFromSalesOrder(
    tenantId: string,
    input: {
      auditReason?: string
      currencyCode: string
      customerSnapshot: string
      customerTenantPartyId: string
      lines: Array<{
        dueDate: string
        memo?: string
        scheduledAmount: string
        sourceSalesOrderLineId?: string
      }>
      orgId?: string
      salesExchangeRateSnapshot?: string
      salesOrderId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.createReceivableScheduleFromSalesOrder(
      {
        auditReason: normalize(input.auditReason),
        currencyCode: requireNonBlank(input.currencyCode, 'currencyCode'),
        customerSnapshot: requireNonBlank(input.customerSnapshot, 'customerSnapshot'),
        customerTenantPartyId: requireNonBlank(
          input.customerTenantPartyId,
          'customerTenantPartyId'
        ),
        lines: (input.lines ?? []).map((line) => ({
          dueDate: requireNonBlank(line.dueDate, 'lines.dueDate'),
          memo: normalize(line.memo),
          scheduledAmount: requireNonBlank(line.scheduledAmount, 'lines.scheduledAmount'),
          sourceSalesOrderLineId: normalize(line.sourceSalesOrderLineId)
        })),
        orgId: normalize(input.orgId),
        salesExchangeRateSnapshot: normalize(input.salesExchangeRateSnapshot),
        salesOrderId: requireNonBlank(input.salesOrderId, 'salesOrderId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapReceivableSchedule(result.receivableSchedule)
  }

  async setFinanceReleaseSignal(
    tenantId: string,
    salesOrderId: string,
    input: {
      auditReason?: string
      basedOnSummary?: string
      customerTenantPartyId: string
      effectiveAt: string
      expiresAt?: string
      reasonCode?: string
      reasonSummary?: string
      signalStatus: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.setFinanceReleaseSignal(
      {
        auditReason: normalize(input.auditReason),
        basedOnSummary: normalize(input.basedOnSummary),
        customerTenantPartyId: requireNonBlank(
          input.customerTenantPartyId,
          'customerTenantPartyId'
        ),
        effectiveAt: requireNonBlank(input.effectiveAt, 'effectiveAt'),
        expiresAt: normalize(input.expiresAt),
        reasonCode: normalize(input.reasonCode),
        reasonSummary: normalize(input.reasonSummary),
        salesOrderId: requireNonBlank(salesOrderId, 'salesOrderId'),
        signalStatus: requireGrpcFinanceReleaseStatus(input.signalStatus),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapFinanceReleaseSignal(result.financeReleaseSignal)
  }

  async searchPaymentAllocations(
    tenantId: string,
    query: {
      accountTransactionId?: string
      page?: number
      pageSize?: number
      receivableScheduleId?: string
      receivableScheduleLineId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeQueryAdapter.searchPaymentAllocations(
      {
        accountTransactionId: normalize(query.accountTransactionId),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        receivableScheduleId: normalize(query.receivableScheduleId),
        receivableScheduleLineId: normalize(query.receivableScheduleLineId),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      paymentAllocations: (result.paymentAllocations ?? []).map((allocation) =>
        mapPaymentAllocation(allocation)
      ),
      total: Number(result.total ?? 0)
    }
  }

  async allocatePaymentToReceivable(
    tenantId: string,
    input: {
      accountTransactionId: string
      allocations: Array<{
        allocatedAmount: string
        receivableScheduleId: string
        receivableScheduleLineId: string
      }>
      auditReason?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.financeManagementAdapter.allocatePaymentToReceivable(
      {
        accountTransactionId: requireNonBlank(input.accountTransactionId, 'accountTransactionId'),
        allocations: (input.allocations ?? []).map((allocation) => ({
          allocatedAmount: requireNonBlank(allocation.allocatedAmount, 'allocations.allocatedAmount'),
          receivableScheduleId: requireNonBlank(
            allocation.receivableScheduleId,
            'allocations.receivableScheduleId'
          ),
          receivableScheduleLineId: requireNonBlank(
            allocation.receivableScheduleLineId,
            'allocations.receivableScheduleLineId'
          )
        })),
        auditReason: normalize(input.auditReason),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return (result.paymentAllocations ?? []).map((allocation) => mapPaymentAllocation(allocation))
  }

  /** resolveTenantId keeps tenant-scoped finance requests pinned to the operator tenant unless the operator is at system scope. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)
    const scopeLevel = normalize(source.user?.scopeLevel)

    if (scopeLevel === 'TENANT' && operatorTenantId && operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException('tenant-scoped operator cannot access another tenant finance workspace')
    }

    return scopeLevel === 'TENANT' && operatorTenantId ? operatorTenantId : requestedTenantId
  }
}

/** mapFinancialAccountSummary converts one finance company-account summary into the stable tenant-web BFF shape. */
function mapFinancialAccountSummary(account?: any) {
  return {
    accountName: account?.accountName ?? '',
    accountNo: account?.accountNo ?? '',
    accountType: fromGrpcFinancialAccountType(account?.accountType),
    currencyCode: account?.currencyCode ?? '',
    currentBalance: account?.currentBalance ?? '',
    financialAccountId: account?.financialAccountId ?? '',
    lastTransactionAt: account?.lastTransactionAt ?? '',
    status: fromGrpcFinancialAccountStatus(account?.status)
  }
}

/** mapFinancialAccount converts one finance company-account aggregate into the stable tenant-web BFF shape. */
function mapFinancialAccount(account?: any) {
  return {
    ...mapFinancialAccountSummary(account),
    accountIdentifierMasked: account?.accountIdentifierMasked ?? '',
    createdAt: account?.createdAt ?? '',
    institutionName: account?.institutionName ?? '',
    orgId: account?.orgId ?? '',
    tenantId: account?.tenantId ?? '',
    updatedAt: account?.updatedAt ?? ''
  }
}

/** mapAccountTransaction converts one finance real account transaction into the stable tenant-web BFF shape. */
function mapAccountTransaction(transaction?: any) {
  return {
    accountTransactionId: transaction?.accountTransactionId ?? '',
    allocatedAmount: transaction?.allocatedAmount ?? '',
    allocationStatus: fromGrpcAllocationStatus(transaction?.allocationStatus),
    amount: transaction?.amount ?? '',
    attachmentRef: transaction?.attachmentRef ?? '',
    counterpartyAccountSnapshot: transaction?.counterpartyAccountSnapshot ?? '',
    counterpartyName: transaction?.counterpartyName ?? '',
    createdAt: transaction?.createdAt ?? '',
    currencyCode: transaction?.currencyCode ?? '',
    direction: fromGrpcTransactionDirection(transaction?.direction),
    externalReference: transaction?.externalReference ?? '',
    fileAssetId: transaction?.fileAssetId ?? '',
    financialAccountId: transaction?.financialAccountId ?? '',
    memo: transaction?.memo ?? '',
    paymentExecutionId: transaction?.paymentExecutionId ?? '',
    sourceType: fromGrpcTransactionSourceType(transaction?.sourceType),
    status: fromGrpcTransactionStatus(transaction?.status),
    transactionTime: transaction?.transactionTime ?? '',
    unallocatedAmount: transaction?.unallocatedAmount ?? '',
    valueDate: transaction?.valueDate ?? ''
  }
}

/** mapCustomerFinancialAccount converts one finance customer remittance-account aggregate into the stable tenant-web BFF shape. */
function mapCustomerFinancialAccount(account?: any) {
  return {
    accountHolderName: account?.accountHolderName ?? '',
    accountIdentifierMasked: account?.accountIdentifierMasked ?? '',
    accountProviderType: fromGrpcCustomerAccountProviderType(account?.accountProviderType),
    currencyCode: account?.currencyCode ?? '',
    customerFinancialAccountId: account?.customerFinancialAccountId ?? '',
    customerTenantPartyId: account?.customerTenantPartyId ?? '',
    isDefault: Boolean(account?.isDefault),
    verifiedStatus: account?.verifiedStatus === 2 ? 'VERIFIED' : 'UNVERIFIED'
  }
}

/** mapExchangeRate converts one finance standard-FX aggregate into the stable tenant-web BFF shape. */
function mapExchangeRate(rate?: any) {
  return {
    baseCurrencyCode: rate?.baseCurrencyCode ?? '',
    effectiveAt: rate?.effectiveAt ?? '',
    exchangeRateId: rate?.exchangeRateId ?? '',
    quoteCurrencyCode: rate?.quoteCurrencyCode ?? '',
    rateValue: rate?.rateValue ?? '',
    setBy: rate?.setBy ?? '',
    tenantId: rate?.tenantId ?? '',
    updatedAt: rate?.updatedAt ?? ''
  }
}

/** mapReceivableSchedule converts one finance receivable schedule aggregate into the stable tenant-web BFF shape. */
function mapReceivableSchedule(schedule?: any) {
  return {
    createdAt: schedule?.createdAt ?? '',
    currencyCode: schedule?.currencyCode ?? '',
    customerSnapshot: schedule?.customerSnapshot ?? '',
    customerTenantPartyId: schedule?.customerTenantPartyId ?? '',
    lines: (schedule?.lines ?? []).map((line: any) => ({
      allocatedAmount: line?.allocatedAmount ?? '',
      dueDate: line?.dueDate ?? '',
      lineNo: Number(line?.lineNo ?? 0),
      memo: line?.memo ?? '',
      outstandingAmount: line?.outstandingAmount ?? '',
      receivableScheduleLineId: line?.receivableScheduleLineId ?? '',
      scheduledAmount: line?.scheduledAmount ?? '',
      sourceSalesOrderLineId: line?.sourceSalesOrderLineId ?? '',
      status: fromGrpcReceivableLineStatus(line?.status)
    })),
    orgId: schedule?.orgId ?? '',
    outstandingAmount: schedule?.outstandingAmount ?? '',
    receivableScheduleId: schedule?.receivableScheduleId ?? '',
    salesExchangeRateSnapshot: schedule?.salesExchangeRateSnapshot ?? '',
    scheduleNo: schedule?.scheduleNo ?? '',
    sourceSalesOrderId: schedule?.sourceSalesOrderId ?? '',
    status: fromGrpcReceivableStatus(schedule?.status),
    tenantId: schedule?.tenantId ?? '',
    totalAllocatedAmount: schedule?.totalAllocatedAmount ?? '',
    totalScheduledAmount: schedule?.totalScheduledAmount ?? '',
    updatedAt: schedule?.updatedAt ?? ''
  }
}

/** mapFinanceReleaseSignal converts one finance-release aggregate into the stable tenant-web BFF shape. */
function mapFinanceReleaseSignal(signal?: any) {
  return {
    basedOnSummary: signal?.basedOnSummary ?? '',
    customerTenantPartyId: signal?.customerTenantPartyId ?? '',
    effectiveAt: signal?.effectiveAt ?? '',
    expiresAt: signal?.expiresAt ?? '',
    financeReleaseSignalId: signal?.financeReleaseSignalId ?? '',
    reasonCode: signal?.reasonCode ?? '',
    reasonSummary: signal?.reasonSummary ?? '',
    salesOrderId: signal?.salesOrderId ?? '',
    signalStatus: fromGrpcFinanceReleaseStatus(signal?.signalStatus),
    tenantId: signal?.tenantId ?? '',
    updatedAt: signal?.updatedAt ?? ''
  }
}

/** mapPaymentAllocation converts one finance receipt-allocation aggregate into the stable tenant-web BFF shape. */
function mapPaymentAllocation(allocation?: any) {
  return {
    accountTransactionId: allocation?.accountTransactionId ?? '',
    allocatedAmount: allocation?.allocatedAmount ?? '',
    allocatedAt: allocation?.allocatedAt ?? '',
    currencyCode: allocation?.currencyCode ?? '',
    paymentAllocationId: allocation?.paymentAllocationId ?? '',
    paymentExecutionId: allocation?.paymentExecutionId ?? '',
    targetScheduleId: allocation?.targetScheduleId ?? '',
    targetScheduleLineId: allocation?.targetScheduleLineId ?? '',
    targetType: allocation?.targetType ?? ''
  }
}

function toGrpcFinancialAccountType(value?: string): FinancialAccountType | undefined {
  switch (normalize(value)) {
    case 'BANK':
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_BANK
    case 'CASH':
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_CASH
    case 'WECHAT':
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_WECHAT
    case 'ALIPAY':
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_ALIPAY
    case 'PAYPAL':
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_PAYPAL
    case 'STRIPE':
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_STRIPE
    case 'OTHER_PSP':
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_OTHER_PSP
    default:
      return undefined
  }
}

function requireGrpcFinancialAccountType(value?: string): FinancialAccountType {
  return toGrpcFinancialAccountType(value) ?? FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_OTHER_PSP
}

function fromGrpcFinancialAccountType(value?: FinancialAccountType): FinancialAccountTypeValue {
  switch (value) {
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_CASH:
      return 'CASH'
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_WECHAT:
      return 'WECHAT'
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_ALIPAY:
      return 'ALIPAY'
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_PAYPAL:
      return 'PAYPAL'
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_STRIPE:
      return 'STRIPE'
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_OTHER_PSP:
      return 'OTHER_PSP'
    default:
      return 'BANK'
  }
}

function toGrpcFinancialAccountStatus(value?: string): FinancialAccountStatus | undefined {
  switch (normalize(value)) {
    case 'ACTIVE':
      return FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_ACTIVE
    case 'INACTIVE':
      return FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_INACTIVE
    case 'CLOSED':
      return FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_CLOSED
    default:
      return undefined
  }
}

function requireGrpcFinancialAccountStatus(value?: string): FinancialAccountStatus {
  return toGrpcFinancialAccountStatus(value) ?? FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_ACTIVE
}

function fromGrpcFinancialAccountStatus(value?: FinancialAccountStatus): FinancialAccountStatusValue {
  switch (value) {
    case FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_INACTIVE:
      return 'INACTIVE'
    case FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_CLOSED:
      return 'CLOSED'
    default:
      return 'ACTIVE'
  }
}

function toGrpcTransactionDirection(value?: string): AccountTransactionDirection | undefined {
  switch (normalize(value)) {
    case 'INFLOW':
      return AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_INFLOW
    case 'OUTFLOW':
      return AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_OUTFLOW
    default:
      return undefined
  }
}

function requireGrpcTransactionDirection(value?: string): AccountTransactionDirection {
  return (
    toGrpcTransactionDirection(value) ??
    AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_INFLOW
  )
}

function fromGrpcTransactionDirection(
  value?: AccountTransactionDirection
): AccountTransactionDirectionValue {
  return value === AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_OUTFLOW
    ? 'OUTFLOW'
    : 'INFLOW'
}

function toGrpcTransactionSourceType(value?: string): AccountTransactionSourceType | undefined {
  switch (normalize(value)) {
    case 'MANUAL':
      return AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_MANUAL
    case 'CSV_IMPORT':
      return AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_CSV_IMPORT
    case 'FUTURE_API':
      return AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_FUTURE_API
    default:
      return undefined
  }
}

function requireGrpcTransactionSourceType(value?: string): AccountTransactionSourceType {
  return (
    toGrpcTransactionSourceType(value) ??
    AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_MANUAL
  )
}

function fromGrpcTransactionSourceType(
  value?: AccountTransactionSourceType
): AccountTransactionSourceTypeValue {
  switch (value) {
    case AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_CSV_IMPORT:
      return 'CSV_IMPORT'
    case AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_FUTURE_API:
      return 'FUTURE_API'
    default:
      return 'MANUAL'
  }
}

function toGrpcTransactionStatus(value?: string): AccountTransactionStatus | undefined {
  switch (normalize(value)) {
    case 'DRAFT':
      return AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_DRAFT
    case 'CONFIRMED':
      return AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_CONFIRMED
    case 'VOIDED':
      return AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_VOIDED
    default:
      return undefined
  }
}

function requireGrpcTransactionStatus(value?: string): AccountTransactionStatus {
  return (
    toGrpcTransactionStatus(value) ?? AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_CONFIRMED
  )
}

function fromGrpcTransactionStatus(value?: AccountTransactionStatus): AccountTransactionStatusValue {
  switch (value) {
    case AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_DRAFT:
      return 'DRAFT'
    case AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_VOIDED:
      return 'VOIDED'
    default:
      return 'CONFIRMED'
  }
}

function toGrpcAllocationStatus(
  value?: string
): AccountTransactionAllocationStatus | undefined {
  switch (normalize(value)) {
    case 'UNALLOCATED':
      return AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_UNALLOCATED
    case 'PARTIALLY_ALLOCATED':
      return AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_PARTIALLY_ALLOCATED
    case 'FULLY_ALLOCATED':
      return AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_FULLY_ALLOCATED
    default:
      return undefined
  }
}

function fromGrpcAllocationStatus(
  value?: AccountTransactionAllocationStatus
): AccountTransactionAllocationStatusValue {
  switch (value) {
    case AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_PARTIALLY_ALLOCATED:
      return 'PARTIALLY_ALLOCATED'
    case AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_FULLY_ALLOCATED:
      return 'FULLY_ALLOCATED'
    default:
      return 'UNALLOCATED'
  }
}

function requireGrpcCustomerAccountProviderType(
  value?: string
): CustomerFinancialAccountProviderType {
  switch (normalize(value)) {
    case 'WECHAT':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_WECHAT
    case 'ALIPAY':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_ALIPAY
    case 'PAYPAL':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_PAYPAL
    case 'STRIPE':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_STRIPE
    case 'OTHER':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_OTHER
    default:
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_BANK
  }
}

function fromGrpcCustomerAccountProviderType(
  value?: CustomerFinancialAccountProviderType
): CustomerFinancialAccountProviderTypeValue {
  switch (value) {
    case CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_WECHAT:
      return 'WECHAT'
    case CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_ALIPAY:
      return 'ALIPAY'
    case CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_PAYPAL:
      return 'PAYPAL'
    case CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_STRIPE:
      return 'STRIPE'
    case CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_OTHER:
      return 'OTHER'
    default:
      return 'BANK'
  }
}

function toGrpcReceivableStatus(value?: string): ReceivableScheduleStatus | undefined {
  switch (normalize(value)) {
    case 'OPEN':
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_OPEN
    case 'PARTIALLY_PAID':
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_PARTIALLY_PAID
    case 'PAID':
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_PAID
    case 'CANCELLED':
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_CANCELLED
    case 'ON_HOLD':
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_ON_HOLD
    default:
      return undefined
  }
}

function fromGrpcReceivableStatus(value?: ReceivableScheduleStatus): ReceivableScheduleStatusValue {
  switch (value) {
    case ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_PARTIALLY_PAID:
      return 'PARTIALLY_PAID'
    case ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_PAID:
      return 'PAID'
    case ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_CANCELLED:
      return 'CANCELLED'
    case ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_ON_HOLD:
      return 'ON_HOLD'
    default:
      return 'OPEN'
  }
}

function fromGrpcReceivableLineStatus(value?: number): string {
  switch (value) {
    case 2:
      return 'PARTIALLY_PAID'
    case 3:
      return 'PAID'
    case 4:
      return 'CANCELLED'
    case 5:
      return 'OVERDUE'
    default:
      return 'OPEN'
  }
}

function toGrpcFinanceReleaseStatus(value?: string): FinanceReleaseSignalStatus | undefined {
  switch (normalize(value)) {
    case 'RELEASED':
      return FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_RELEASED
    case 'HELD':
      return FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_HELD
    case 'REVIEW_REQUIRED':
      return FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_REVIEW_REQUIRED
    default:
      return undefined
  }
}

function requireGrpcFinanceReleaseStatus(value?: string): FinanceReleaseSignalStatus {
  return (
    toGrpcFinanceReleaseStatus(value) ??
    FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_RELEASED
  )
}

function fromGrpcFinanceReleaseStatus(
  value?: FinanceReleaseSignalStatus
): FinanceReleaseSignalStatusValue {
  switch (value) {
    case FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_HELD:
      return 'HELD'
    case FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_REVIEW_REQUIRED:
      return 'REVIEW_REQUIRED'
    default:
      return 'RELEASED'
  }
}

function resolveOperatorId(source: DownstreamRequestSource): string {
  return (
    normalize(source.user?.holderId) ??
    normalize(source.user?.aid) ??
    normalize(source.user?.id) ??
    normalize(source.user?.sub) ??
    'api-gateway-operator'
  )
}

function clampPage(value?: number): number {
  return Math.max(value ?? 1, 1)
}

function clampPageSize(value?: number): number {
  return Math.min(Math.max(value ?? 20, 1), 100)
}

function requireNonBlank(value: string | undefined, field: string): string {
  const normalized = normalize(value)
  if (!normalized) {
    throw new Error(`${field} is required`)
  }

  return normalized
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
