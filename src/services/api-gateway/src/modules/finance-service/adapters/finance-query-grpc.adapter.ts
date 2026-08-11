import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  FINANCIAL_ACCOUNT_QUERY_SERVICE_NAME,
  FinancialAccountQueryServiceClient,
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
  PAYMENT_QUERY_SERVICE_NAME,
  PaymentQueryServiceClient,
  RECEIVABLE_QUERY_SERVICE_NAME,
  ReceivableQueryServiceClient,
  SearchAccountTransactionsRequest,
  SearchAccountTransactionsResponse,
  SearchFinancialAccountsRequest,
  SearchFinancialAccountsResponse,
  SearchPayableSchedulesRequest,
  SearchPayableSchedulesResponse,
  SearchPaymentAllocationsRequest,
  SearchPaymentAllocationsResponse,
  SearchPaymentExecutionsRequest,
  SearchPaymentExecutionsResponse,
  SearchPaymentRequestsRequest,
  SearchPaymentRequestsResponse,
  SearchReceivableSchedulesRequest,
  SearchReceivableSchedulesResponse
} from '@oes/common/generated/finance_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  GatewayFinanceGrpcClient,
  GatewayTrustedGrpcExecutionProducer
} from '../../../common/grpc'

const CALLER = 'api-gateway'
const FINANCE_AUDIENCE = 'urn:oes:service:finance-service'
type FinanceQueryInput<T> = T & { [key: string]: unknown }

/** FinanceQueryGrpcAdapter proxies the frozen phase 1A/1B finance query RPCs from api-gateway into finance-service. */
@Injectable()
export class FinanceQueryGrpcAdapter implements OnModuleInit {
  private financialAccountSvc!: FinancialAccountQueryServiceClient
  private receivableSvc!: ReceivableQueryServiceClient
  private paymentSvc!: PaymentQueryServiceClient

  constructor(
    private readonly client: GatewayFinanceGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    const client: ClientGrpc = this.client.getClient()
    this.financialAccountSvc = client.getService<FinancialAccountQueryServiceClient>(
      FINANCIAL_ACCOUNT_QUERY_SERVICE_NAME
    )
    this.receivableSvc = client.getService<ReceivableQueryServiceClient>(
      RECEIVABLE_QUERY_SERVICE_NAME
    )
    this.paymentSvc = client.getService<PaymentQueryServiceClient>(PAYMENT_QUERY_SERVICE_NAME)
  }

  /** getFinancialAccount forwards one finance account detail read. */
  async getFinancialAccount(
    input: FinanceQueryInput<GetFinancialAccountRequest>,
    source: DownstreamRequestSource
  ): Promise<GetFinancialAccountResponse> {
    return this.call(
      'getFinancialAccount',
      this.financialAccountSvc.getFinancialAccount(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.financial_account.get_by_id'])
      )
    )
  }

  /** searchFinancialAccounts forwards one tenant-scoped finance account directory query. */
  async searchFinancialAccounts(
    input: FinanceQueryInput<SearchFinancialAccountsRequest>,
    source: DownstreamRequestSource
  ): Promise<SearchFinancialAccountsResponse> {
    return this.call(
      'searchFinancialAccounts',
      this.financialAccountSvc.searchFinancialAccounts(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.financial_account.list'])
      )
    )
  }

  /** searchAccountTransactions forwards one finance account-transaction directory query. */
  async searchAccountTransactions(
    input: FinanceQueryInput<SearchAccountTransactionsRequest>,
    source: DownstreamRequestSource
  ): Promise<SearchAccountTransactionsResponse> {
    return this.call(
      'searchAccountTransactions',
      this.financialAccountSvc.searchAccountTransactions(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.account_transaction.list'])
      )
    )
  }

  /** getExchangeRate forwards one finance standard-FX read. */
  async getExchangeRate(
    input: FinanceQueryInput<GetExchangeRateRequest>,
    source: DownstreamRequestSource
  ): Promise<GetExchangeRateResponse> {
    return this.call(
      'getExchangeRate',
      this.financialAccountSvc.getExchangeRate(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.exchange_rate.get'])
      )
    )
  }

  /** getReceivableSchedule forwards one receivable detail read. */
  async getReceivableSchedule(
    input: FinanceQueryInput<GetReceivableScheduleRequest>,
    source: DownstreamRequestSource
  ): Promise<GetReceivableScheduleResponse> {
    return this.call(
      'getReceivableSchedule',
      this.receivableSvc.getReceivableSchedule(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.receivable_schedule.get_by_id'])
      )
    )
  }

  /** searchReceivableSchedules forwards one receivable directory query. */
  async searchReceivableSchedules(
    input: FinanceQueryInput<SearchReceivableSchedulesRequest>,
    source: DownstreamRequestSource
  ): Promise<SearchReceivableSchedulesResponse> {
    return this.call(
      'searchReceivableSchedules',
      this.receivableSvc.searchReceivableSchedules(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.receivable_schedule.list'])
      )
    )
  }

  /** getFinanceReleaseSignal forwards one finance-release read by sales order. */
  async getFinanceReleaseSignal(
    input: FinanceQueryInput<GetFinanceReleaseSignalRequest>,
    source: DownstreamRequestSource
  ): Promise<GetFinanceReleaseSignalResponse> {
    return this.call(
      'getFinanceReleaseSignal',
      this.receivableSvc.getFinanceReleaseSignal(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.finance_release_signal.get'])
      )
    )
  }

  /** searchPaymentAllocations forwards one receivable-allocation directory query. */
  async searchPaymentAllocations(
    input: FinanceQueryInput<SearchPaymentAllocationsRequest>,
    source: DownstreamRequestSource
  ): Promise<SearchPaymentAllocationsResponse> {
    return this.call(
      'searchPaymentAllocations',
      this.paymentSvc.searchPaymentAllocations(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.payment_allocation.list'])
      )
    )
  }

  /** getPayableSchedule forwards one payable schedule detail read without treating payment requests as payable truth. */
  async getPayableSchedule(
    input: FinanceQueryInput<GetPayableScheduleRequest>,
    source: DownstreamRequestSource
  ): Promise<GetPayableScheduleResponse> {
    return this.call(
      'getPayableSchedule',
      this.paymentSvc.getPayableSchedule(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.payable.read'])
      )
    )
  }

  /** searchPayableSchedules forwards one payable schedule directory query. */
  async searchPayableSchedules(
    input: FinanceQueryInput<SearchPayableSchedulesRequest>,
    source: DownstreamRequestSource
  ): Promise<SearchPayableSchedulesResponse> {
    return this.call(
      'searchPayableSchedules',
      this.paymentSvc.searchPayableSchedules(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.payable.read'])
      )
    )
  }

  /** searchPaymentRequests forwards one payment-request governance directory query. */
  async searchPaymentRequests(
    input: FinanceQueryInput<SearchPaymentRequestsRequest>,
    source: DownstreamRequestSource
  ): Promise<SearchPaymentRequestsResponse> {
    return this.call(
      'searchPaymentRequests',
      this.paymentSvc.searchPaymentRequests(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.payable.read'])
      )
    )
  }

  /** searchPaymentExecutions forwards one payment-execution directory query without mixing it with account transactions. */
  async searchPaymentExecutions(
    input: FinanceQueryInput<SearchPaymentExecutionsRequest>,
    source: DownstreamRequestSource
  ): Promise<SearchPaymentExecutionsResponse> {
    return this.call(
      'searchPaymentExecutions',
      this.paymentSvc.searchPaymentExecutions(
        this.attachQueryContext(input, source),
        await this.metadata(source, ['finance.payable.read'])
      )
    )
  }

  /** Removes all Finance authority fields before the generated request reaches gRPC. */
  private attachQueryContext<TInput extends object>(
    input: TInput,
    source: DownstreamRequestSource
  ) {
    const {
      tenantId: _tenantId,
      orgId: _orgId,
      operatorContext: _operatorContext,
      traceContext: _traceContext,
      auditContext: _auditContext,
      ...business
    } = input as TInput & Record<string, unknown>
    void source
    return business as TInput
  }

  /** Mints an exact-audience HUMAN/WEB execution token for one Finance RPC. */
  private metadata(source: DownstreamRequestSource, codes: readonly string[]) {
    return this.trustedExecution.forBusinessCall(source, FINANCE_AUDIENCE, codes)
  }

  /** call wraps one gateway finance query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied finance query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
