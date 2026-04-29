import {
  AccountTransaction,
  AccountTransactionAllocationStatus,
  AccountTransactionDirection,
  AccountTransactionSourceType,
  AccountTransactionStatus,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse,
  CreatePayableScheduleFromPurchaseOrderResponse,
  CreatePaymentRequestResponse,
  CreateFinancialAccountResponse,
  CreateReceivableScheduleFromSalesOrderResponse,
  CustomerFinancialAccount,
  CustomerFinancialAccountProviderType,
  CustomerFinancialAccountVerifiedStatus,
  DecidePaymentRequestResponse,
  ExchangeRate,
  ExecutePaymentRequestResponse,
  FinanceReleaseSignal,
  FinanceReleaseSignalStatus,
  FinancialAccount,
  FinancialAccountStatus,
  FinancialAccountSummary,
  FinancialAccountType,
  GetExchangeRateResponse,
  GetFinanceReleaseSignalResponse,
  GetFinancialAccountResponse,
  GetPayableScheduleResponse,
  GetReceivableScheduleResponse,
  ImportAccountTransactionsResponse,
  PayableSchedule,
  PayableScheduleLine,
  PaymentAllocation,
  PaymentExecution,
  PaymentExecutionSummary,
  PaymentRequest,
  PaymentRequestLine,
  PaymentRequestSummary,
  ReceivableSchedule,
  ReceivableScheduleLine,
  ReceivableScheduleLineStatus,
  ReceivableScheduleStatus,
  SearchAccountTransactionsResponse,
  SearchFinancialAccountsResponse,
  SearchPaymentAllocationsResponse,
  SearchPayableSchedulesResponse,
  SearchPaymentExecutionsResponse,
  SearchPaymentRequestsResponse,
  SearchReceivableSchedulesResponse,
  SupplierBillEvidenceSnapshot
} from '@oes/common/generated/finance_service'
import {
  AccountTransactionRecord,
  CustomerFinancialAccountRecord,
  ExchangeRateRecord,
  FinanceReleaseSignalRecord,
  FinancialAccountRecord,
  PayableScheduleRecord,
  PaymentAllocationRecord,
  PaymentExecutionRecord,
  PaymentRequestRecord,
  ReceivableScheduleRecord,
  FinancialAccountType as DomainFinancialAccountType,
  FinancialAccountStatus as DomainFinancialAccountStatus,
  AccountTransactionDirection as DomainAccountTransactionDirection,
  AccountTransactionSourceType as DomainAccountTransactionSourceType,
  AccountTransactionStatus as DomainAccountTransactionStatus,
  AccountTransactionAllocationStatus as DomainAccountTransactionAllocationStatus,
  CustomerFinancialAccountVerifiedStatus as DomainCustomerFinancialAccountVerifiedStatus,
  ReceivableScheduleStatus as DomainReceivableScheduleStatus,
  ReceivableScheduleLineStatus as DomainReceivableScheduleLineStatus,
  FinanceReleaseStatus as DomainFinanceReleaseStatus
} from '../../domain/models/finance-records'

/** FinanceGrpcPresenter maps finance phase 1A records into generated gRPC response shapes and enums. */
export class FinanceGrpcPresenter {
  static toCreateFinancialAccountResponse(
    record: FinancialAccountRecord & { currentBalance: string }
  ): CreateFinancialAccountResponse {
    return {
      financialAccount: this.toFinancialAccount(record)
    }
  }

  static toFinancialAccount(
    record: FinancialAccountRecord & { currentBalance?: string }
  ): FinancialAccount {
    return {
      financialAccountId: record.id,
      accountNo: record.accountNo,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      accountType: toProtoFinancialAccountType(record.accountType),
      accountName: record.accountName,
      currencyCode: record.currencyCode,
      institutionName: record.institutionName ?? undefined,
      accountIdentifierMasked: record.accountIdentifierMasked,
      status: toProtoFinancialAccountStatus(record.status),
      lastTransactionAt: record.lastTransactionAt ?? undefined,
      currentBalance: record.currentBalance ?? '0.00',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  static toFinancialAccountSummary(
    record: FinancialAccountRecord & { currentBalance?: string }
  ): FinancialAccountSummary {
    return {
      financialAccountId: record.id,
      accountNo: record.accountNo,
      accountType: toProtoFinancialAccountType(record.accountType),
      accountName: record.accountName,
      currencyCode: record.currencyCode,
      status: toProtoFinancialAccountStatus(record.status),
      lastTransactionAt: record.lastTransactionAt ?? undefined,
      currentBalance: record.currentBalance ?? '0.00'
    }
  }

  static toSearchFinancialAccountsResponse(input: {
    financialAccounts: Array<FinancialAccountRecord & { currentBalance: string }>
    total: number
    page: number
    pageSize: number
  }): SearchFinancialAccountsResponse {
    return {
      financialAccounts: input.financialAccounts.map((account) =>
        this.toFinancialAccountSummary(account)
      ),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  static toAccountTransaction(record: AccountTransactionRecord): AccountTransaction {
    return {
      accountTransactionId: record.id,
      financialAccountId: record.financialAccountId,
      direction: toProtoTransactionDirection(record.direction),
      amount: record.amount,
      currencyCode: record.currencyCode,
      transactionTime: record.transactionTime,
      valueDate: record.valueDate ?? undefined,
      sourceType: toProtoTransactionSourceType(record.sourceType),
      status: toProtoTransactionStatus(record.status),
      externalReference: record.externalReference ?? undefined,
      counterpartyName: record.counterpartyName ?? undefined,
      counterpartyAccountSnapshot: record.counterpartyAccountSnapshot ?? undefined,
      memo: record.memo ?? undefined,
      paymentExecutionId: record.paymentExecutionId ?? undefined,
      allocationStatus: toProtoAllocationStatus(record.allocationStatus),
      allocatedAmount: record.allocatedAmount,
      unallocatedAmount: record.unallocatedAmount,
      fileAssetId: record.fileAssetId ?? undefined,
      attachmentRef: record.attachmentRef ?? undefined,
      createdAt: record.createdAt
    }
  }

  static toSearchAccountTransactionsResponse(input: {
    accountTransactions: AccountTransactionRecord[]
    total: number
    page: number
    pageSize: number
  }): SearchAccountTransactionsResponse {
    return {
      accountTransactions: input.accountTransactions.map((item) => this.toAccountTransaction(item)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  static toImportAccountTransactionsResponse(input: {
    batch: {
      id: string
      totalRows: number
      acceptedCount: number
      duplicateCount: number
      failedCount: number
      sourceType: string
      sourceBatchReference?: string | null
      fileAssetId?: string | null
      attachmentRef?: string | null
    }
    accountTransactionIds: string[]
  }): ImportAccountTransactionsResponse {
    return {
      batch: {
        accountTransactionImportBatchId: input.batch.id,
        sourceType: input.batch.sourceType,
        sourceBatchReference: input.batch.sourceBatchReference ?? undefined,
        fileAssetId: input.batch.fileAssetId ?? undefined,
        attachmentRef: input.batch.attachmentRef ?? undefined,
        totalRows: input.batch.totalRows,
        acceptedCount: input.batch.acceptedCount,
        duplicateCount: input.batch.duplicateCount,
        failedCount: input.batch.failedCount
      },
      accountTransactionIds: input.accountTransactionIds
    }
  }

  static toCustomerFinancialAccount(record: CustomerFinancialAccountRecord): CustomerFinancialAccount {
    return {
      customerFinancialAccountId: record.id,
      customerTenantPartyId: record.customerTenantPartyId,
      accountHolderName: record.accountHolderName,
      accountProviderType: toProtoCustomerAccountProviderType(record.accountProviderType),
      accountIdentifierMasked: record.accountIdentifierMasked,
      currencyCode: record.currencyCode ?? undefined,
      isDefault: record.isDefault,
      verifiedStatus: toProtoCustomerVerifiedStatus(record.verifiedStatus)
    }
  }

  static toExchangeRate(record: ExchangeRateRecord): ExchangeRate {
    return {
      exchangeRateId: record.id,
      tenantId: record.tenantId,
      baseCurrencyCode: record.baseCurrencyCode,
      quoteCurrencyCode: record.quoteCurrencyCode,
      rateValue: record.rateValue,
      effectiveAt: record.effectiveAt,
      setBy: record.setBy,
      updatedAt: record.updatedAt
    }
  }

  static toGetExchangeRateResponse(record: ExchangeRateRecord): GetExchangeRateResponse {
    return {
      exchangeRate: this.toExchangeRate(record)
    }
  }

  static toReceivableScheduleLine(record: ReceivableScheduleRecord['lines'][number]): ReceivableScheduleLine {
    return {
      receivableScheduleLineId: record.id,
      lineNo: record.lineNo,
      dueDate: record.dueDate,
      scheduledAmount: record.scheduledAmount,
      allocatedAmount: record.allocatedAmount,
      outstandingAmount: record.outstandingAmount,
      status: toProtoReceivableLineStatus(record.status),
      sourceSalesOrderLineId: record.sourceSalesOrderLineId ?? undefined,
      memo: record.memo ?? undefined
    }
  }

  static toReceivableSchedule(record: ReceivableScheduleRecord): ReceivableSchedule {
    return {
      receivableScheduleId: record.id,
      scheduleNo: record.scheduleNo,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      sourceSalesOrderId: record.sourceSalesOrderId,
      customerTenantPartyId: record.customerTenantPartyId,
      customerSnapshot: record.customerSnapshot,
      currencyCode: record.currencyCode,
      status: toProtoReceivableScheduleStatus(record.status),
      totalScheduledAmount: record.totalScheduledAmount,
      totalAllocatedAmount: record.totalAllocatedAmount,
      outstandingAmount: record.outstandingAmount,
      lines: record.lines.map((line) => this.toReceivableScheduleLine(line)),
      salesExchangeRateSnapshot: record.salesExchangeRateSnapshot ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  static toCreateReceivableScheduleFromSalesOrderResponse(
    record: ReceivableScheduleRecord
  ): CreateReceivableScheduleFromSalesOrderResponse {
    return {
      receivableSchedule: this.toReceivableSchedule(record)
    }
  }

  static toGetReceivableScheduleResponse(
    record: ReceivableScheduleRecord
  ): GetReceivableScheduleResponse {
    return {
      receivableSchedule: this.toReceivableSchedule(record)
    }
  }

  static toSearchReceivableSchedulesResponse(input: {
    receivableSchedules: ReceivableScheduleRecord[]
    total: number
    page: number
    pageSize: number
  }): SearchReceivableSchedulesResponse {
    return {
      receivableSchedules: input.receivableSchedules.map((schedule) => ({
        receivableScheduleId: schedule.id,
        scheduleNo: schedule.scheduleNo,
        sourceSalesOrderId: schedule.sourceSalesOrderId,
        customerTenantPartyId: schedule.customerTenantPartyId,
        customerDisplayName: schedule.customerSnapshot,
        currencyCode: schedule.currencyCode,
        status: toProtoReceivableScheduleStatus(schedule.status),
        outstandingAmount: schedule.outstandingAmount,
        nearestDueDate: schedule.lines[0]?.dueDate ?? undefined
      })),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  static toFinanceReleaseSignal(record: FinanceReleaseSignalRecord): FinanceReleaseSignal {
    return {
      financeReleaseSignalId: record.id,
      tenantId: record.tenantId,
      salesOrderId: record.salesOrderId,
      customerTenantPartyId: record.customerTenantPartyId,
      signalStatus: toProtoFinanceReleaseStatus(record.signalStatus),
      reasonCode: record.reasonCode ?? undefined,
      reasonSummary: record.reasonSummary ?? undefined,
      effectiveAt: record.effectiveAt,
      expiresAt: record.expiresAt ?? undefined,
      basedOnSummary: record.basedOnSummary ?? undefined,
      updatedAt: record.updatedAt
    }
  }

  static toGetFinanceReleaseSignalResponse(
    record: FinanceReleaseSignalRecord
  ): GetFinanceReleaseSignalResponse {
    return {
      financeReleaseSignal: this.toFinanceReleaseSignal(record)
    }
  }

  static toPayableScheduleLine(record: PayableScheduleRecord['lines'][number]): PayableScheduleLine {
    return {
      payableScheduleLineId: record.id,
      lineNo: record.lineNo,
      lineType: record.lineType,
      sourceRef: record.sourceRef,
      dueDate: record.dueDate,
      scheduledAmount: record.scheduledAmount,
      requestedAmount: record.requestedAmount,
      executedAmount: record.executedAmount,
      allocatedAmount: record.allocatedAmount,
      outstandingAmount: record.outstandingAmount,
      status: record.status,
      requestGovernanceStatus: record.requestGovernanceStatus,
      sourcePurchaseOrderLineId: record.sourcePurchaseOrderLineId ?? undefined,
      supersedesSourceRef: record.supersedesSourceRef ?? undefined,
      memo: record.memo ?? undefined
    }
  }

  static toPayableSchedule(record: PayableScheduleRecord): PayableSchedule {
    return {
      payableScheduleId: record.id,
      scheduleNo: record.scheduleNo,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      sourceType: record.sourceType,
      sourcePurchaseOrderId: record.sourcePurchaseOrderId,
      sourcePurchaseOrderNo: record.sourcePurchaseOrderNo ?? undefined,
      procurementSnapshotReference: record.procurementSnapshotReference ?? undefined,
      supplierTenantPartyId: record.supplierTenantPartyId,
      supplierSnapshot: record.supplierSnapshot,
      currencyCode: record.currencyCode,
      status: record.status,
      totalScheduledAmount: record.totalScheduledAmount,
      totalRequestedAmount: record.totalRequestedAmount,
      totalExecutedAmount: record.totalExecutedAmount,
      totalAllocatedAmount: record.totalAllocatedAmount,
      outstandingAmount: record.outstandingAmount,
      lines: record.lines.map((line) => this.toPayableScheduleLine(line)),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  static toCreatePayableScheduleFromPurchaseOrderResponse(
    record: PayableScheduleRecord
  ): CreatePayableScheduleFromPurchaseOrderResponse {
    return {
      payableSchedule: this.toPayableSchedule(record)
    }
  }

  static toApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse(
    record: PayableScheduleRecord
  ): ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse {
    return {
      payableSchedule: this.toPayableSchedule(record)
    }
  }

  static toGetPayableScheduleResponse(record: PayableScheduleRecord): GetPayableScheduleResponse {
    return {
      payableSchedule: this.toPayableSchedule(record)
    }
  }

  static toSearchPayableSchedulesResponse(input: {
    payableSchedules: Array<{
      payableScheduleId: string
      scheduleNo: string
      sourcePurchaseOrderId: string
      sourcePurchaseOrderNo?: string
      supplierTenantPartyId: string
      supplierDisplayName: string
      currencyCode: string
      status: string
      requestGovernanceStatusSummary: string
      outstandingAmount: string
      nearestDueDate?: string
    }>
    total: number
    page: number
    pageSize: number
  }): SearchPayableSchedulesResponse {
    return {
      payableSchedules: input.payableSchedules,
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  static toPaymentRequestLine(record: PaymentRequestRecord['lines'][number]): PaymentRequestLine {
    return {
      paymentRequestLineId: record.id,
      payableScheduleId: record.payableScheduleId,
      payableScheduleLineId: record.payableScheduleLineId,
      scheduleDueDate: record.scheduleDueDate,
      requestedAmount: record.requestedAmount,
      isEarlyRequest: record.isEarlyRequest,
      lineStatus: record.lineStatus
    }
  }

  static toSupplierBillEvidenceSnapshot(
    record: PaymentRequestRecord['evidenceSnapshots'][number]
  ): SupplierBillEvidenceSnapshot {
    return {
      evidenceSnapshotId: record.id,
      evidenceType: record.evidenceType,
      externalDocumentNo: record.externalDocumentNo ?? undefined,
      documentDate: record.documentDate ?? undefined,
      currencyCode: record.currencyCode ?? undefined,
      documentAmount: record.documentAmount ?? undefined,
      attachmentRef: record.attachmentRef ?? undefined,
      note: record.note ?? undefined,
      capturedAt: record.capturedAt
    }
  }

  static toPaymentRequest(record: PaymentRequestRecord): PaymentRequest {
    return {
      paymentRequestId: record.id,
      requestNo: record.requestNo,
      tenantId: record.tenantId,
      orgId: record.orgId ?? undefined,
      requestSource: record.requestSource,
      sourcePurchaseOrderId: record.sourcePurchaseOrderId ?? undefined,
      supplierTenantPartyId: record.supplierTenantPartyId,
      beneficiarySupplierFinancialAccountId: record.beneficiarySupplierFinancialAccountId,
      currencyCode: record.currencyCode,
      requestedAmount: record.requestedAmount,
      status: record.status,
      reason: record.reason ?? undefined,
      lines: record.lines.map((line) => this.toPaymentRequestLine(line)),
      evidenceSnapshots: record.evidenceSnapshots.map((snapshot) =>
        this.toSupplierBillEvidenceSnapshot(snapshot)
      ),
      requestedAt: record.requestedAt,
      updatedAt: record.updatedAt
    }
  }

  static toCreatePaymentRequestResponse(record: PaymentRequestRecord): CreatePaymentRequestResponse {
    return {
      paymentRequest: this.toPaymentRequest(record)
    }
  }

  static toDecidePaymentRequestResponse(record: PaymentRequestRecord): DecidePaymentRequestResponse {
    return {
      paymentRequest: this.toPaymentRequest(record)
    }
  }

  static toSearchPaymentRequestsResponse(input: {
    paymentRequests: PaymentRequestSummary[]
    total: number
    page: number
    pageSize: number
  }): SearchPaymentRequestsResponse {
    return {
      paymentRequests: input.paymentRequests,
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  static toPaymentExecution(record: PaymentExecutionRecord): PaymentExecution {
    return {
      paymentExecutionId: record.id,
      paymentRequestId: record.paymentRequestId,
      sourceFinancialAccountId: record.sourceFinancialAccountId,
      beneficiarySupplierFinancialAccountId:
        record.beneficiarySupplierFinancialAccountId ?? undefined,
      beneficiaryAccountSnapshot: record.beneficiaryAccountSnapshot ?? undefined,
      executedAmount: record.executedAmount,
      currencyCode: record.currencyCode,
      executedAt: record.executedAt,
      executionReference: record.executionReference ?? undefined,
      attachmentRefs: record.attachmentRefs,
      linkedAccountTransactionId: record.linkedAccountTransactionId ?? undefined,
      status: record.status
    }
  }

  static toExecutePaymentRequestResponse(input: {
    paymentRequest: PaymentRequestRecord
    paymentExecution: PaymentExecutionRecord
  }): ExecutePaymentRequestResponse {
    return {
      paymentRequest: this.toPaymentRequest(input.paymentRequest),
      paymentExecution: this.toPaymentExecution(input.paymentExecution)
    }
  }

  static toSearchPaymentExecutionsResponse(input: {
    paymentExecutions: PaymentExecutionSummary[]
    total: number
    page: number
    pageSize: number
  }): SearchPaymentExecutionsResponse {
    return {
      paymentExecutions: input.paymentExecutions,
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  static toPaymentAllocation(record: PaymentAllocationRecord): PaymentAllocation {
    return {
      paymentAllocationId: record.id,
      accountTransactionId: record.accountTransactionId,
      paymentExecutionId: record.paymentExecutionId ?? undefined,
      targetType: record.targetType,
      targetScheduleId: record.targetScheduleId,
      targetScheduleLineId: record.targetScheduleLineId,
      allocatedAmount: record.allocatedAmount,
      currencyCode: record.currencyCode,
      allocatedAt: record.allocatedAt,
      paymentRequestId: record.paymentRequestId ?? undefined
    }
  }

  static toSearchPaymentAllocationsResponse(input: {
    paymentAllocations: PaymentAllocationRecord[]
    total: number
    page: number
    pageSize: number
  }): SearchPaymentAllocationsResponse {
    return {
      paymentAllocations: input.paymentAllocations.map((item) => this.toPaymentAllocation(item)),
      total: input.total,
      page: input.page,
      pageSize: input.pageSize
    }
  }

  static toGetFinancialAccountResponse(
    record: FinancialAccountRecord & { currentBalance: string }
  ): GetFinancialAccountResponse {
    return {
      financialAccount: this.toFinancialAccount(record)
    }
  }
}

function toProtoFinancialAccountType(value: DomainFinancialAccountType): FinancialAccountType {
  switch (value) {
    case DomainFinancialAccountType.BANK:
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_BANK
    case DomainFinancialAccountType.CASH:
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_CASH
    case DomainFinancialAccountType.WECHAT:
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_WECHAT
    case DomainFinancialAccountType.ALIPAY:
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_ALIPAY
    case DomainFinancialAccountType.PAYPAL:
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_PAYPAL
    case DomainFinancialAccountType.STRIPE:
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_STRIPE
    default:
      return FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_OTHER_PSP
  }
}

function toProtoFinancialAccountStatus(value: DomainFinancialAccountStatus): FinancialAccountStatus {
  switch (value) {
    case DomainFinancialAccountStatus.ACTIVE:
      return FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_ACTIVE
    case DomainFinancialAccountStatus.INACTIVE:
      return FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_INACTIVE
    default:
      return FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_CLOSED
  }
}

function toProtoTransactionDirection(
  value: DomainAccountTransactionDirection
): AccountTransactionDirection {
  return value === DomainAccountTransactionDirection.INFLOW
    ? AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_INFLOW
    : AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_OUTFLOW
}

function toProtoTransactionSourceType(
  value: DomainAccountTransactionSourceType
): AccountTransactionSourceType {
  switch (value) {
    case DomainAccountTransactionSourceType.MANUAL:
      return AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_MANUAL
    case DomainAccountTransactionSourceType.CSV_IMPORT:
      return AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_CSV_IMPORT
    default:
      return AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_FUTURE_API
  }
}

function toProtoTransactionStatus(value: DomainAccountTransactionStatus): AccountTransactionStatus {
  switch (value) {
    case DomainAccountTransactionStatus.DRAFT:
      return AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_DRAFT
    case DomainAccountTransactionStatus.CONFIRMED:
      return AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_CONFIRMED
    default:
      return AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_VOIDED
  }
}

function toProtoAllocationStatus(
  value: DomainAccountTransactionAllocationStatus
): AccountTransactionAllocationStatus {
  switch (value) {
    case DomainAccountTransactionAllocationStatus.UNALLOCATED:
      return AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_UNALLOCATED
    case DomainAccountTransactionAllocationStatus.PARTIALLY_ALLOCATED:
      return AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_PARTIALLY_ALLOCATED
    default:
      return AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_FULLY_ALLOCATED
  }
}

function toProtoCustomerAccountProviderType(
  value: CustomerFinancialAccountRecord['accountProviderType']
): CustomerFinancialAccountProviderType {
  switch (value) {
    case 'BANK':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_BANK
    case 'WECHAT':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_WECHAT
    case 'ALIPAY':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_ALIPAY
    case 'PAYPAL':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_PAYPAL
    case 'STRIPE':
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_STRIPE
    default:
      return CustomerFinancialAccountProviderType.CUSTOMER_FINANCIAL_ACCOUNT_PROVIDER_TYPE_OTHER
  }
}

function toProtoCustomerVerifiedStatus(
  value: DomainCustomerFinancialAccountVerifiedStatus
): CustomerFinancialAccountVerifiedStatus {
  return value === DomainCustomerFinancialAccountVerifiedStatus.VERIFIED
    ? CustomerFinancialAccountVerifiedStatus.CUSTOMER_FINANCIAL_ACCOUNT_VERIFIED_STATUS_VERIFIED
    : CustomerFinancialAccountVerifiedStatus.CUSTOMER_FINANCIAL_ACCOUNT_VERIFIED_STATUS_UNVERIFIED
}

function toProtoReceivableScheduleStatus(
  value: DomainReceivableScheduleStatus
): ReceivableScheduleStatus {
  switch (value) {
    case DomainReceivableScheduleStatus.OPEN:
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_OPEN
    case DomainReceivableScheduleStatus.PARTIALLY_PAID:
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_PARTIALLY_PAID
    case DomainReceivableScheduleStatus.PAID:
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_PAID
    case DomainReceivableScheduleStatus.CANCELLED:
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_CANCELLED
    default:
      return ReceivableScheduleStatus.RECEIVABLE_SCHEDULE_STATUS_ON_HOLD
  }
}

function toProtoReceivableLineStatus(
  value: DomainReceivableScheduleLineStatus
): ReceivableScheduleLineStatus {
  switch (value) {
    case DomainReceivableScheduleLineStatus.OPEN:
      return ReceivableScheduleLineStatus.RECEIVABLE_SCHEDULE_LINE_STATUS_OPEN
    case DomainReceivableScheduleLineStatus.PARTIALLY_PAID:
      return ReceivableScheduleLineStatus.RECEIVABLE_SCHEDULE_LINE_STATUS_PARTIALLY_PAID
    case DomainReceivableScheduleLineStatus.PAID:
      return ReceivableScheduleLineStatus.RECEIVABLE_SCHEDULE_LINE_STATUS_PAID
    case DomainReceivableScheduleLineStatus.CANCELLED:
      return ReceivableScheduleLineStatus.RECEIVABLE_SCHEDULE_LINE_STATUS_CANCELLED
    default:
      return ReceivableScheduleLineStatus.RECEIVABLE_SCHEDULE_LINE_STATUS_OVERDUE
  }
}

function toProtoFinanceReleaseStatus(
  value: DomainFinanceReleaseStatus
): FinanceReleaseSignalStatus {
  switch (value) {
    case DomainFinanceReleaseStatus.RELEASED:
      return FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_RELEASED
    case DomainFinanceReleaseStatus.HELD:
      return FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_HELD
    default:
      return FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_REVIEW_REQUIRED
  }
}
