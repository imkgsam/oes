import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  AllocatePaymentToReceivableRequest,
  AllocatePaymentToReceivableResponse,
  CreateFinancialAccountRequest,
  CreateFinancialAccountResponse,
  CreateReceivableScheduleFromSalesOrderRequest,
  CreateReceivableScheduleFromSalesOrderResponse,
  FINANCIAL_ACCOUNT_MANAGEMENT_SERVICE_NAME,
  FinancialAccountManagementServiceClient,
  ImportAccountTransactionsRequest,
  ImportAccountTransactionsResponse,
  PAYMENT_MANAGEMENT_SERVICE_NAME,
  PaymentManagementServiceClient,
  RECEIVABLE_MANAGEMENT_SERVICE_NAME,
  ReceivableManagementServiceClient,
  RecordAccountTransactionRequest,
  RecordAccountTransactionResponse,
  RegisterCustomerFinancialAccountRequest,
  RegisterCustomerFinancialAccountResponse,
  SetExchangeRateRequest,
  SetExchangeRateResponse,
  SetFinanceReleaseSignalRequest,
  SetFinanceReleaseSignalResponse,
  UpdateFinancialAccountBasicsRequest,
  UpdateFinancialAccountBasicsResponse
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
  buildFinanceAuditContext,
  buildFinanceOperatorContext,
  buildFinanceTraceContext
} from './finance-grpc-context'

const CALLER = 'api-gateway'

interface ManagementInputBase {
  auditReason?: string
}

/** FinanceManagementGrpcAdapter proxies the frozen phase 1A finance command RPCs from api-gateway into finance-service. */
@Injectable()
export class FinanceManagementGrpcAdapter implements OnModuleInit {
  private financialAccountSvc!: FinancialAccountManagementServiceClient
  private receivableSvc!: ReceivableManagementServiceClient
  private paymentSvc!: PaymentManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.FINANCE)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.financialAccountSvc = this.client.getService<FinancialAccountManagementServiceClient>(
      FINANCIAL_ACCOUNT_MANAGEMENT_SERVICE_NAME
    )
    this.receivableSvc = this.client.getService<ReceivableManagementServiceClient>(
      RECEIVABLE_MANAGEMENT_SERVICE_NAME
    )
    this.paymentSvc = this.client.getService<PaymentManagementServiceClient>(
      PAYMENT_MANAGEMENT_SERVICE_NAME
    )
  }

  /** createFinancialAccount forwards one finance company-account creation command. */
  createFinancialAccount(
    input: Omit<CreateFinancialAccountRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateFinancialAccountResponse> {
    return this.call(
      'createFinancialAccount',
      this.financialAccountSvc.createFinancialAccount(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'create financial account from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** updateFinancialAccountBasics forwards one finance account-basics mutation command. */
  updateFinancialAccountBasics(
    input: Omit<
      UpdateFinancialAccountBasicsRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<UpdateFinancialAccountBasicsResponse> {
    return this.call(
      'updateFinancialAccountBasics',
      this.financialAccountSvc.updateFinancialAccountBasics(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'update financial account basics from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** importAccountTransactions forwards one finance batch-import command for real account transactions. */
  importAccountTransactions(
    input: Omit<ImportAccountTransactionsRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ImportAccountTransactionsResponse> {
    return this.call(
      'importAccountTransactions',
      this.financialAccountSvc.importAccountTransactions(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'import account transactions from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** recordAccountTransaction forwards one finance manual transaction-recording command. */
  recordAccountTransaction(
    input: Omit<RecordAccountTransactionRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RecordAccountTransactionResponse> {
    return this.call(
      'recordAccountTransaction',
      this.financialAccountSvc.recordAccountTransaction(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'record account transaction from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** registerCustomerFinancialAccount forwards one finance customer remittance-account registration command. */
  registerCustomerFinancialAccount(
    input: Omit<
      RegisterCustomerFinancialAccountRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<RegisterCustomerFinancialAccountResponse> {
    return this.call(
      'registerCustomerFinancialAccount',
      this.financialAccountSvc.registerCustomerFinancialAccount(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'register customer financial account from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** setExchangeRate forwards one finance standard-FX write command. */
  setExchangeRate(
    input: Omit<SetExchangeRateRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<SetExchangeRateResponse> {
    return this.call(
      'setExchangeRate',
      this.financialAccountSvc.setExchangeRate(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'set exchange rate from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** createReceivableScheduleFromSalesOrder forwards one finance receivable schedule creation command. */
  createReceivableScheduleFromSalesOrder(
    input: Omit<
      CreateReceivableScheduleFromSalesOrderRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreateReceivableScheduleFromSalesOrderResponse> {
    return this.call(
      'createReceivableScheduleFromSalesOrder',
      this.receivableSvc.createReceivableScheduleFromSalesOrder(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'create receivable schedule from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** setFinanceReleaseSignal forwards one finance-release write command. */
  setFinanceReleaseSignal(
    input: Omit<SetFinanceReleaseSignalRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<SetFinanceReleaseSignalResponse> {
    return this.call(
      'setFinanceReleaseSignal',
      this.receivableSvc.setFinanceReleaseSignal(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'set finance release signal from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** allocatePaymentToReceivable forwards one finance receipt-allocation command. */
  allocatePaymentToReceivable(
    input: Omit<
      AllocatePaymentToReceivableRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<AllocatePaymentToReceivableResponse> {
    return this.call(
      'allocatePaymentToReceivable',
      this.paymentSvc.allocatePaymentToReceivable(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'allocate payment to receivable from api-gateway'
        ),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** attachManagementContext injects the explicit finance command operator, trace, and audit contract fields. */
  private attachManagementContext<TInput extends ManagementInputBase & object>(
    input: TInput,
    source: DownstreamRequestSource,
    reason: string
  ) {
    return {
      ...input,
      auditContext: buildFinanceAuditContext(source, reason),
      operatorContext: buildFinanceOperatorContext(source),
      traceContext: buildFinanceTraceContext(source)
    }
  }

  /** call wraps one gateway finance command RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied finance command. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
