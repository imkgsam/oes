import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  AllocatePaymentToReceivableRequest,
  AllocatePaymentToReceivableResponse,
  AllocatePaymentToPayableRequest,
  AllocatePaymentToPayableResponse,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse,
  CreateFinancialAccountRequest,
  CreateFinancialAccountResponse,
  CreatePayableScheduleFromPurchaseOrderRequest,
  CreatePayableScheduleFromPurchaseOrderResponse,
  CreatePaymentRequestRequest,
  CreatePaymentRequestResponse,
  CreateReceivableScheduleFromSalesOrderRequest,
  CreateReceivableScheduleFromSalesOrderResponse,
  DecidePaymentRequestRequest,
  DecidePaymentRequestResponse,
  ExecutePaymentRequestRequest,
  ExecutePaymentRequestResponse,
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
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  GatewayFinanceGrpcClient,
  GatewayTrustedGrpcExecutionProducer
} from '../../../common/grpc'

const CALLER = 'api-gateway'
const FINANCE_AUDIENCE = 'urn:oes:service:finance-service'

interface ManagementInputBase {
  auditReason?: string
  [key: string]: unknown
}

/** FinanceManagementGrpcAdapter proxies the frozen phase 1A/1B finance command RPCs from api-gateway into finance-service. */
@Injectable()
export class FinanceManagementGrpcAdapter implements OnModuleInit {
  private financialAccountSvc!: FinancialAccountManagementServiceClient
  private receivableSvc!: ReceivableManagementServiceClient
  private paymentSvc!: PaymentManagementServiceClient

  constructor(
    private readonly client: GatewayFinanceGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    const client: ClientGrpc = this.client.getClient()
    this.financialAccountSvc = client.getService<FinancialAccountManagementServiceClient>(
      FINANCIAL_ACCOUNT_MANAGEMENT_SERVICE_NAME
    )
    this.receivableSvc = client.getService<ReceivableManagementServiceClient>(
      RECEIVABLE_MANAGEMENT_SERVICE_NAME
    )
    this.paymentSvc = client.getService<PaymentManagementServiceClient>(
      PAYMENT_MANAGEMENT_SERVICE_NAME
    )
  }

  /** createFinancialAccount forwards one finance company-account creation command. */
  async createFinancialAccount(
    input: Omit<
      CreateFinancialAccountRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
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
        await this.metadata(source, ['finance.financial_account.create'])
      )
    )
  }

  /** updateFinancialAccountBasics forwards one finance account-basics mutation command. */
  async updateFinancialAccountBasics(
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
        await this.metadata(source, ['finance.financial_account.update_basics'])
      )
    )
  }

  /** importAccountTransactions forwards one finance batch-import command for real account transactions. */
  async importAccountTransactions(
    input: Omit<
      ImportAccountTransactionsRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
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
        await this.metadata(source, ['finance.account_transaction.import'])
      )
    )
  }

  /** recordAccountTransaction forwards one finance manual transaction-recording command. */
  async recordAccountTransaction(
    input: Omit<
      RecordAccountTransactionRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
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
        await this.metadata(source, ['finance.account_transaction.record'])
      )
    )
  }

  /** registerCustomerFinancialAccount forwards one finance customer remittance-account registration command. */
  async registerCustomerFinancialAccount(
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
        await this.metadata(source, ['finance.customer_financial_account.register'])
      )
    )
  }

  /** setExchangeRate forwards one finance standard-FX write command. */
  async setExchangeRate(
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
        await this.metadata(source, ['finance.exchange_rate.set'])
      )
    )
  }

  /** createReceivableScheduleFromSalesOrder forwards one finance receivable schedule creation command. */
  async createReceivableScheduleFromSalesOrder(
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
        await this.metadata(source, ['finance.receivable_schedule.create_from_sales_order'])
      )
    )
  }

  /** setFinanceReleaseSignal forwards one finance-release write command. */
  async setFinanceReleaseSignal(
    input: Omit<
      SetFinanceReleaseSignalRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
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
        await this.metadata(source, ['finance.finance_release_signal.set'])
      )
    )
  }

  /** allocatePaymentToReceivable forwards one finance receipt-allocation command. */
  async allocatePaymentToReceivable(
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
        await this.metadata(source, ['finance.payment_allocation.allocate_to_receivable'])
      )
    )
  }

  /** createPayableScheduleFromPurchaseOrder forwards one PO-derived payable schedule creation command. */
  async createPayableScheduleFromPurchaseOrder(
    input: Omit<
      CreatePayableScheduleFromPurchaseOrderRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreatePayableScheduleFromPurchaseOrderResponse> {
    return this.call(
      'createPayableScheduleFromPurchaseOrder',
      this.paymentSvc.createPayableScheduleFromPurchaseOrder(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'create payable schedule from api-gateway'
        ),
        await this.metadata(source, ['finance.payable.create_from_purchase_order'])
      )
    )
  }

  /** applyPayableScheduleAdjustmentFromPurchaseOrderChange forwards one controlled PO-change payable adjustment command. */
  async applyPayableScheduleAdjustmentFromPurchaseOrderChange(
    input: Omit<
      ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse> {
    return this.call(
      'applyPayableScheduleAdjustmentFromPurchaseOrderChange',
      this.paymentSvc.applyPayableScheduleAdjustmentFromPurchaseOrderChange(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'adjust payable schedule from api-gateway'
        ),
        await this.metadata(source, ['finance.payable.adjust_from_purchase_order_change'])
      )
    )
  }

  /** createPaymentRequest forwards one phase 1B payment governance request command. */
  async createPaymentRequest(
    input: Omit<CreatePaymentRequestRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<CreatePaymentRequestResponse> {
    return this.call(
      'createPaymentRequest',
      this.paymentSvc.createPaymentRequest(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'create payment request from api-gateway'
        ),
        await this.metadata(source, ['finance.payment_request.create'])
      )
    )
  }

  /** decidePaymentRequest forwards one approve/reject command without treating approval as payment execution. */
  async decidePaymentRequest(
    input: Omit<DecidePaymentRequestRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<DecidePaymentRequestResponse> {
    return this.call(
      'decidePaymentRequest',
      this.paymentSvc.decidePaymentRequest(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'decide payment request from api-gateway'
        ),
        await this.metadata(source, ['finance.payment_request.decide'])
      )
    )
  }

  /** executePaymentRequest forwards one payment execution record command without creating account-transaction truth. */
  async executePaymentRequest(
    input: Omit<ExecutePaymentRequestRequest, 'auditContext' | 'operatorContext' | 'traceContext'> &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<ExecutePaymentRequestResponse> {
    return this.call(
      'executePaymentRequest',
      this.paymentSvc.executePaymentRequest(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'execute payment request from api-gateway'
        ),
        await this.metadata(source, ['finance.payment_execution.create'])
      )
    )
  }

  /** allocatePaymentToPayable forwards one real outflow allocation command against payable lines. */
  async allocatePaymentToPayable(
    input: Omit<
      AllocatePaymentToPayableRequest,
      'auditContext' | 'operatorContext' | 'traceContext'
    > &
      ManagementInputBase,
    source: DownstreamRequestSource
  ): Promise<AllocatePaymentToPayableResponse> {
    return this.call(
      'allocatePaymentToPayable',
      this.paymentSvc.allocatePaymentToPayable(
        this.attachManagementContext(
          input,
          source,
          input.auditReason ?? 'allocate payment to payable from api-gateway'
        ),
        await this.metadata(source, ['finance.payment_allocation.create'])
      )
    )
  }

  /** Removes all Finance authority and caller-identity fields before the generated request reaches gRPC. */
  private attachManagementContext<TInput extends ManagementInputBase & object>(
    input: TInput,
    source: DownstreamRequestSource,
    _reason: string
  ) {
    const {
      tenantId: _tenantId,
      orgId: _orgId,
      operatorContext: _operatorContext,
      traceContext: _traceContext,
      auditContext: _auditContext,
      importedBy: _importedBy,
      setBy: _setBy,
      auditReason: _auditReason,
      ...business
    } = input as TInput & Record<string, unknown>
    void source
    return business as TInput
  }

  /** Mints an exact-audience HUMAN/WEB execution token for one Finance command. */
  private metadata(source: DownstreamRequestSource, codes: readonly string[]) {
    return this.trustedExecution.forBusinessCall(source, FINANCE_AUDIENCE, codes)
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
