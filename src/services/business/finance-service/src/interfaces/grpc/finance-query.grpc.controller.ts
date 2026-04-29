import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AccountTransactionAllocationStatus,
  AccountTransactionDirection,
  AccountTransactionSourceType,
  FinancialAccountQueryServiceController,
  FinancialAccountQueryServiceControllerMethods,
  FinancialAccountStatus,
  FinancialAccountType,
  GetExchangeRateRequest,
  GetExchangeRateResponse,
  GetFinanceReleaseSignalRequest,
  GetFinanceReleaseSignalResponse,
  GetFinancialAccountRequest,
  GetFinancialAccountResponse,
  GetPayableScheduleRequest,
  GetPayableScheduleResponse,
  GetReceivableScheduleRequest,
  GetReceivableScheduleResponse,
  PaymentQueryServiceController,
  PaymentQueryServiceControllerMethods,
  ReceivableQueryServiceController,
  ReceivableQueryServiceControllerMethods,
  SearchAccountTransactionsRequest,
  SearchAccountTransactionsResponse,
  SearchFinancialAccountsRequest,
  SearchFinancialAccountsResponse,
  SearchPaymentAllocationsRequest,
  SearchPaymentAllocationsResponse,
  SearchPayableSchedulesRequest,
  SearchPayableSchedulesResponse,
  SearchPaymentExecutionsRequest,
  SearchPaymentExecutionsResponse,
  SearchPaymentRequestsRequest,
  SearchPaymentRequestsResponse,
  SearchReceivableSchedulesRequest,
  SearchReceivableSchedulesResponse
} from '@oes/common/generated/finance_service'
import {
  GetExchangeRateQuery,
  GetFinancialAccountQuery,
  SearchAccountTransactionsQuery,
  SearchFinancialAccountsQuery
} from '../../application/queries/account-query.queries'
import {
  GetFinanceReleaseSignalQuery,
  GetReceivableScheduleQuery,
  SearchReceivableSchedulesQuery
} from '../../application/queries/receivable-query.queries'
import {
  GetPayableScheduleQuery,
  SearchPayableSchedulesQuery,
  SearchPaymentAllocationsQuery,
  SearchPaymentExecutionsQuery,
  SearchPaymentRequestsQuery
} from '../../application/queries/payment-query.queries'
import {
  AccountTransactionAllocationStatus as DomainAllocationStatus,
  AccountTransactionDirection as DomainDirection,
  AccountTransactionSourceType as DomainSourceType,
  FinancialAccountStatus as DomainFinancialAccountStatus,
  FinancialAccountType as DomainFinancialAccountType,
  FinanceReleaseStatus,
  PaymentAllocationTargetType,
  PaymentExecutionStatus,
  PaymentRequestSource,
  PaymentRequestStatus,
  PayableLineRequestGovernanceStatus,
  PayableScheduleStatus,
  ReceivableScheduleStatus
} from '../../domain/models/finance-records'
import { FinanceGrpcPresenter } from './finance-grpc.presenter'
import { FinanceRpcContextValidator } from './finance-rpc-context.validator'

/** FinanceQueryGrpcController exposes the phase 1A read-only finance query contract. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@FinancialAccountQueryServiceControllerMethods()
@ReceivableQueryServiceControllerMethods()
@PaymentQueryServiceControllerMethods()
export class FinanceQueryGrpcController
  implements
    FinancialAccountQueryServiceController,
    ReceivableQueryServiceController,
    PaymentQueryServiceController
{
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getFinancialAccount(request: GetFinancialAccountRequest): Promise<GetFinancialAccountResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const account = await this.queryBus.execute(
      new GetFinancialAccountQuery(request.tenantId ?? '', request.financialAccountId ?? '')
    )
    return FinanceGrpcPresenter.toGetFinancialAccountResponse(account)
  }

  async searchFinancialAccounts(
    request: SearchFinancialAccountsRequest
  ): Promise<SearchFinancialAccountsResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchFinancialAccountsQuery({
        tenantId: request.tenantId ?? '',
        orgId: request.orgId ?? undefined,
        keyword: request.keyword ?? undefined,
        accountType: toDomainFinancialAccountType(request.accountType),
        currencyCode: request.currencyCode ?? undefined,
        status: toDomainFinancialAccountStatus(request.status),
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return FinanceGrpcPresenter.toSearchFinancialAccountsResponse(result)
  }

  async searchAccountTransactions(
    request: SearchAccountTransactionsRequest
  ): Promise<SearchAccountTransactionsResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchAccountTransactionsQuery({
        tenantId: request.tenantId ?? '',
        orgId: request.orgId ?? undefined,
        financialAccountId: request.financialAccountId ?? undefined,
        direction: toDomainDirection(request.direction),
        sourceType: toDomainSourceType(request.sourceType),
        allocationStatus: toDomainAllocationStatus(request.allocationStatus),
        externalReference: request.externalReference ?? undefined,
        occurredFrom: request.occurredFrom ?? undefined,
        occurredTo: request.occurredTo ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )

    return FinanceGrpcPresenter.toSearchAccountTransactionsResponse(result)
  }

  async getExchangeRate(request: GetExchangeRateRequest): Promise<GetExchangeRateResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const rate = await this.queryBus.execute(
      new GetExchangeRateQuery({
        tenantId: request.tenantId ?? '',
        baseCurrencyCode: request.baseCurrencyCode ?? '',
        quoteCurrencyCode: request.quoteCurrencyCode ?? '',
        effectiveAt: request.effectiveAt ?? undefined
      })
    )
    return FinanceGrpcPresenter.toGetExchangeRateResponse(rate)
  }

  async getReceivableSchedule(
    request: GetReceivableScheduleRequest
  ): Promise<GetReceivableScheduleResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const schedule = await this.queryBus.execute(
      new GetReceivableScheduleQuery(request.tenantId ?? '', request.receivableScheduleId ?? '')
    )
    return FinanceGrpcPresenter.toGetReceivableScheduleResponse(schedule)
  }

  async searchReceivableSchedules(
    request: SearchReceivableSchedulesRequest
  ): Promise<SearchReceivableSchedulesResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchReceivableSchedulesQuery({
        tenantId: request.tenantId ?? '',
        orgId: request.orgId ?? undefined,
        keyword: request.keyword ?? undefined,
        customerTenantPartyId: request.customerTenantPartyId ?? undefined,
        sourceSalesOrderId: request.sourceSalesOrderId ?? undefined,
        status: toDomainReceivableScheduleStatus(request.status),
        financeReleaseStatus: toDomainFinanceReleaseStatus(request.financeReleaseStatus),
        overdueOnly: request.overdueOnly ?? undefined,
        dueFrom: request.dueFrom ?? undefined,
        dueTo: request.dueTo ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
    return FinanceGrpcPresenter.toSearchReceivableSchedulesResponse(result)
  }

  async getFinanceReleaseSignal(
    request: GetFinanceReleaseSignalRequest
  ): Promise<GetFinanceReleaseSignalResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const signal = await this.queryBus.execute(
      new GetFinanceReleaseSignalQuery(request.tenantId ?? '', request.salesOrderId ?? '')
    )
    return FinanceGrpcPresenter.toGetFinanceReleaseSignalResponse(signal)
  }

  async getPayableSchedule(
    request: GetPayableScheduleRequest
  ): Promise<GetPayableScheduleResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const schedule = await this.queryBus.execute(
      new GetPayableScheduleQuery(request.tenantId ?? '', request.payableScheduleId ?? '')
    )
    return FinanceGrpcPresenter.toGetPayableScheduleResponse(schedule)
  }

  async searchPayableSchedules(
    request: SearchPayableSchedulesRequest
  ): Promise<SearchPayableSchedulesResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchPayableSchedulesQuery({
        tenantId: request.tenantId ?? '',
        orgId: request.orgId ?? undefined,
        keyword: request.keyword ?? undefined,
        supplierTenantPartyId: request.supplierTenantPartyId ?? undefined,
        sourcePurchaseOrderId: request.sourcePurchaseOrderId ?? undefined,
        status: request.status as PayableScheduleStatus | undefined,
        requestGovernanceStatus:
          request.requestGovernanceStatus as PayableLineRequestGovernanceStatus | undefined,
        overdueOnly: request.overdueOnly ?? undefined,
        dueFrom: request.dueFrom ?? undefined,
        dueTo: request.dueTo ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
    return FinanceGrpcPresenter.toSearchPayableSchedulesResponse(result)
  }

  async searchPaymentRequests(
    request: SearchPaymentRequestsRequest
  ): Promise<SearchPaymentRequestsResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchPaymentRequestsQuery({
        tenantId: request.tenantId ?? '',
        orgId: request.orgId ?? undefined,
        requestSource: request.requestSource as PaymentRequestSource | undefined,
        supplierTenantPartyId: request.supplierTenantPartyId ?? undefined,
        sourcePurchaseOrderId: request.sourcePurchaseOrderId ?? undefined,
        status: request.status as PaymentRequestStatus | undefined,
        beneficiarySupplierFinancialAccountId:
          request.beneficiarySupplierFinancialAccountId ?? undefined,
        requestedFrom: request.requestedFrom ?? undefined,
        requestedTo: request.requestedTo ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
    return FinanceGrpcPresenter.toSearchPaymentRequestsResponse(result)
  }

  async searchPaymentExecutions(
    request: SearchPaymentExecutionsRequest
  ): Promise<SearchPaymentExecutionsResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchPaymentExecutionsQuery({
        tenantId: request.tenantId ?? '',
        orgId: request.orgId ?? undefined,
        paymentRequestId: request.paymentRequestId ?? undefined,
        supplierTenantPartyId: request.supplierTenantPartyId ?? undefined,
        sourceFinancialAccountId: request.sourceFinancialAccountId ?? undefined,
        linkedAccountTransactionId: request.linkedAccountTransactionId ?? undefined,
        status: request.status as PaymentExecutionStatus | undefined,
        executedFrom: request.executedFrom ?? undefined,
        executedTo: request.executedTo ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
    return FinanceGrpcPresenter.toSearchPaymentExecutionsResponse(result)
  }

  async searchPaymentAllocations(
    request: SearchPaymentAllocationsRequest
  ): Promise<SearchPaymentAllocationsResponse> {
    FinanceRpcContextValidator.assertQueryContext(request)
    const result = await this.queryBus.execute(
      new SearchPaymentAllocationsQuery({
        tenantId: request.tenantId ?? '',
        accountTransactionId: request.accountTransactionId ?? undefined,
        paymentExecutionId: request.paymentExecutionId ?? undefined,
        targetType: request.targetType as PaymentAllocationTargetType | undefined,
        targetScheduleId: request.targetScheduleId ?? undefined,
        targetScheduleLineId: request.targetScheduleLineId ?? undefined,
        receivableScheduleId: request.receivableScheduleId ?? undefined,
        receivableScheduleLineId: request.receivableScheduleLineId ?? undefined,
        allocatedFrom: request.allocatedFrom ?? undefined,
        allocatedTo: request.allocatedTo ?? undefined,
        page: request.page ?? undefined,
        pageSize: request.pageSize ?? undefined
      })
    )
    return FinanceGrpcPresenter.toSearchPaymentAllocationsResponse(result)
  }
}

function toDomainFinancialAccountType(value?: number): DomainFinancialAccountType | undefined {
  switch (value) {
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_BANK:
      return DomainFinancialAccountType.BANK
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_CASH:
      return DomainFinancialAccountType.CASH
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_WECHAT:
      return DomainFinancialAccountType.WECHAT
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_ALIPAY:
      return DomainFinancialAccountType.ALIPAY
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_PAYPAL:
      return DomainFinancialAccountType.PAYPAL
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_STRIPE:
      return DomainFinancialAccountType.STRIPE
    case FinancialAccountType.FINANCIAL_ACCOUNT_TYPE_OTHER_PSP:
      return DomainFinancialAccountType.OTHER_PSP
    default:
      return undefined
  }
}

function toDomainFinancialAccountStatus(
  value?: number
): DomainFinancialAccountStatus | undefined {
  switch (value) {
    case FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_ACTIVE:
      return DomainFinancialAccountStatus.ACTIVE
    case FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_INACTIVE:
      return DomainFinancialAccountStatus.INACTIVE
    case FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_CLOSED:
      return DomainFinancialAccountStatus.CLOSED
    default:
      return undefined
  }
}

function toDomainDirection(value?: number): DomainDirection | undefined {
  if (value === AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_INFLOW) {
    return DomainDirection.INFLOW
  }
  if (value === AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_OUTFLOW) {
    return DomainDirection.OUTFLOW
  }
  return undefined
}

function toDomainSourceType(value?: number): DomainSourceType | undefined {
  if (value === AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_MANUAL) {
    return DomainSourceType.MANUAL
  }
  if (value === AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_CSV_IMPORT) {
    return DomainSourceType.CSV_IMPORT
  }
  if (value === AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_FUTURE_API) {
    return DomainSourceType.FUTURE_API
  }
  return undefined
}

function toDomainAllocationStatus(value?: number): DomainAllocationStatus | undefined {
  if (value === AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_UNALLOCATED) {
    return DomainAllocationStatus.UNALLOCATED
  }
  if (
    value ===
    AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_PARTIALLY_ALLOCATED
  ) {
    return DomainAllocationStatus.PARTIALLY_ALLOCATED
  }
  if (
    value ===
    AccountTransactionAllocationStatus.ACCOUNT_TRANSACTION_ALLOCATION_STATUS_FULLY_ALLOCATED
  ) {
    return DomainAllocationStatus.FULLY_ALLOCATED
  }
  return undefined
}

function toDomainReceivableScheduleStatus(value?: number): ReceivableScheduleStatus | undefined {
  switch (value) {
    case 1:
      return ReceivableScheduleStatus.OPEN
    case 2:
      return ReceivableScheduleStatus.PARTIALLY_PAID
    case 3:
      return ReceivableScheduleStatus.PAID
    case 4:
      return ReceivableScheduleStatus.CANCELLED
    case 5:
      return ReceivableScheduleStatus.ON_HOLD
    default:
      return undefined
  }
}

function toDomainFinanceReleaseStatus(value?: number): FinanceReleaseStatus | undefined {
  switch (value) {
    case 1:
      return FinanceReleaseStatus.RELEASED
    case 2:
      return FinanceReleaseStatus.HELD
    case 3:
      return FinanceReleaseStatus.REVIEW_REQUIRED
    default:
      return undefined
  }
}
