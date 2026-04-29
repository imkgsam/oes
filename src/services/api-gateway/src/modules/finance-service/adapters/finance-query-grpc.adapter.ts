import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
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
  SearchPaymentAllocationsRequest,
  SearchPaymentAllocationsResponse,
  SearchReceivableSchedulesRequest,
  SearchReceivableSchedulesResponse
} from '@oes/common/generated/finance_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  buildFinanceOperatorContext,
  buildFinanceTraceContext
} from './finance-grpc-context'

const CALLER = 'api-gateway'

/** FinanceQueryGrpcAdapter proxies the frozen phase 1A finance query RPCs from api-gateway into finance-service. */
@Injectable()
export class FinanceQueryGrpcAdapter implements OnModuleInit {
  private financialAccountSvc!: FinancialAccountQueryServiceClient
  private receivableSvc!: ReceivableQueryServiceClient
  private paymentSvc!: PaymentQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.FINANCE)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.financialAccountSvc = this.client.getService<FinancialAccountQueryServiceClient>(
      FINANCIAL_ACCOUNT_QUERY_SERVICE_NAME
    )
    this.receivableSvc = this.client.getService<ReceivableQueryServiceClient>(
      RECEIVABLE_QUERY_SERVICE_NAME
    )
    this.paymentSvc = this.client.getService<PaymentQueryServiceClient>(
      PAYMENT_QUERY_SERVICE_NAME
    )
  }

  /** getFinancialAccount forwards one finance account detail read. */
  getFinancialAccount(
    input: Omit<GetFinancialAccountRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetFinancialAccountResponse> {
    return this.call(
      'getFinancialAccount',
      this.financialAccountSvc.getFinancialAccount(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchFinancialAccounts forwards one tenant-scoped finance account directory query. */
  searchFinancialAccounts(
    input: Omit<SearchFinancialAccountsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchFinancialAccountsResponse> {
    return this.call(
      'searchFinancialAccounts',
      this.financialAccountSvc.searchFinancialAccounts(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchAccountTransactions forwards one finance account-transaction directory query. */
  searchAccountTransactions(
    input: Omit<SearchAccountTransactionsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchAccountTransactionsResponse> {
    return this.call(
      'searchAccountTransactions',
      this.financialAccountSvc.searchAccountTransactions(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getExchangeRate forwards one finance standard-FX read. */
  getExchangeRate(
    input: Omit<GetExchangeRateRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetExchangeRateResponse> {
    return this.call(
      'getExchangeRate',
      this.financialAccountSvc.getExchangeRate(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getReceivableSchedule forwards one receivable detail read. */
  getReceivableSchedule(
    input: Omit<GetReceivableScheduleRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetReceivableScheduleResponse> {
    return this.call(
      'getReceivableSchedule',
      this.receivableSvc.getReceivableSchedule(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchReceivableSchedules forwards one receivable directory query. */
  searchReceivableSchedules(
    input: Omit<SearchReceivableSchedulesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchReceivableSchedulesResponse> {
    return this.call(
      'searchReceivableSchedules',
      this.receivableSvc.searchReceivableSchedules(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getFinanceReleaseSignal forwards one finance-release read by sales order. */
  getFinanceReleaseSignal(
    input: Omit<GetFinanceReleaseSignalRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetFinanceReleaseSignalResponse> {
    return this.call(
      'getFinanceReleaseSignal',
      this.receivableSvc.getFinanceReleaseSignal(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchPaymentAllocations forwards one receivable-allocation directory query. */
  searchPaymentAllocations(
    input: Omit<SearchPaymentAllocationsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchPaymentAllocationsResponse> {
    return this.call(
      'searchPaymentAllocations',
      this.paymentSvc.searchPaymentAllocations(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** attachQueryContext injects the explicit finance query operator and trace contract fields. */
  private attachQueryContext<TInput extends object>(
    input: TInput,
    source: DownstreamRequestSource
  ) {
    return {
      ...input,
      operatorContext: buildFinanceOperatorContext(source),
      traceContext: buildFinanceTraceContext(source)
    }
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
