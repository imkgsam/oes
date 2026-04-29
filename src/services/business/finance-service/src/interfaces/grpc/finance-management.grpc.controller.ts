import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AccountTransactionDirection,
  AccountTransactionSourceType,
  AccountTransactionStatus,
  AllocatePaymentToPayableRequest,
  AllocatePaymentToPayableResponse,
  AllocatePaymentToReceivableRequest,
  AllocatePaymentToReceivableResponse,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse,
  CreatePayableScheduleFromPurchaseOrderRequest,
  CreatePayableScheduleFromPurchaseOrderResponse,
  CreatePaymentRequestRequest,
  CreatePaymentRequestResponse,
  CreateFinancialAccountRequest,
  CreateFinancialAccountResponse,
  CreateReceivableScheduleFromSalesOrderRequest,
  CreateReceivableScheduleFromSalesOrderResponse,
  CustomerFinancialAccountProviderType,
  DecidePaymentRequestRequest,
  DecidePaymentRequestResponse,
  ExecutePaymentRequestRequest,
  ExecutePaymentRequestResponse,
  FinancialAccountManagementServiceController,
  FinancialAccountManagementServiceControllerMethods,
  FinancialAccountStatus,
  FinancialAccountType,
  FinanceReleaseSignalStatus,
  ImportAccountTransactionsRequest,
  ImportAccountTransactionsResponse,
  PaymentManagementServiceController,
  PaymentManagementServiceControllerMethods,
  ReceivableManagementServiceController,
  ReceivableManagementServiceControllerMethods,
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
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  CreateFinancialAccountCommand,
  ImportAccountTransactionsCommand,
  RecordAccountTransactionCommand,
  RegisterCustomerFinancialAccountCommand,
  SetExchangeRateCommand,
  UpdateFinancialAccountBasicsCommand
} from '../../application/commands/account-management.commands'
import {
  AllocatePaymentToPayableCommand,
  AllocatePaymentToReceivableCommand,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand,
  CreatePayableScheduleFromPurchaseOrderCommand,
  CreatePaymentRequestCommand,
  DecidePaymentRequestCommand,
  ExecutePaymentRequestCommand
} from '../../application/commands/payment-management.commands'
import {
  CreateReceivableScheduleFromSalesOrderCommand,
  SetFinanceReleaseSignalCommand
} from '../../application/commands/receivable-management.commands'
import { FinanceAuditService } from '../../application/services/finance-audit.service'
import { FINANCE_INVALID_ARGUMENT } from '../../common/errors/finance.errors'
import {
  AccountTransactionSourceType as DomainSourceType,
  AccountTransactionStatus as DomainStatus,
  FinancialAccountType as DomainFinancialAccountType,
  FinanceReleaseStatus
} from '../../domain/models/finance-records'
import { FinanceGrpcPresenter } from './finance-grpc.presenter'
import { FinanceRpcContextValidator } from './finance-rpc-context.validator'

/** FinanceManagementGrpcController exposes the phase 1A finance command contract with local audit envelope recording. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@FinancialAccountManagementServiceControllerMethods()
@ReceivableManagementServiceControllerMethods()
@PaymentManagementServiceControllerMethods()
export class FinanceManagementGrpcController
  implements
    FinancialAccountManagementServiceController,
    ReceivableManagementServiceController,
    PaymentManagementServiceController
{
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly auditService: FinanceAuditService
  ) {}

  async createFinancialAccount(
    request: CreateFinancialAccountRequest
  ): Promise<CreateFinancialAccountResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreateFinancialAccount',
        resourceType: 'financial_account',
        targetId: null,
        requestSummary: {
          accountName: request.accountName ?? '',
          currencyCode: request.currencyCode ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreateFinancialAccountCommand({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            accountType: toDomainFinancialAccountType(request.accountType),
            accountName: request.accountName ?? '',
            currencyCode: request.currencyCode ?? '',
            institutionName: request.institutionName ?? undefined,
            accountIdentifier: request.accountIdentifier ?? '',
            openingBalance: request.openingBalance ?? undefined,
            openingBalanceAsOf: request.openingBalanceAsOf ?? undefined
          })
        )

        return FinanceGrpcPresenter.toCreateFinancialAccountResponse(result)
      }
    )
  }

  async updateFinancialAccountBasics(
    request: UpdateFinancialAccountBasicsRequest
  ): Promise<UpdateFinancialAccountBasicsResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'UpdateFinancialAccountBasics',
        resourceType: 'financial_account',
        targetId: request.financialAccountId ?? null,
        requestSummary: {
          financialAccountId: request.financialAccountId ?? '',
          status: request.status ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new UpdateFinancialAccountBasicsCommand({
            tenantId: request.tenantId ?? '',
            financialAccountId: request.financialAccountId ?? '',
            accountName: request.accountName ?? '',
            institutionName: request.institutionName ?? undefined,
            accountIdentifier: request.accountIdentifier ?? undefined,
            status: toDomainFinancialAccountStatus(request.status)
          })
        )

        return {
          financialAccount: FinanceGrpcPresenter.toFinancialAccount(result)
        }
      }
    )
  }

  async importAccountTransactions(
    request: ImportAccountTransactionsRequest
  ): Promise<ImportAccountTransactionsResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ImportAccountTransactions',
        resourceType: 'account_transaction_import_batch',
        targetId: request.financialAccountId ?? null,
        requestSummary: {
          financialAccountId: request.financialAccountId ?? '',
          rowCount: request.transactions?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ImportAccountTransactionsCommand({
            tenantId: request.tenantId ?? '',
            financialAccountId: request.financialAccountId ?? '',
            sourceType: toDomainSourceType(request.sourceType),
            sourceBatchReference: request.sourceBatchReference ?? undefined,
            fileAssetId: request.fileAssetId ?? undefined,
            attachmentRef: request.attachmentRef ?? undefined,
            importedBy: request.importedBy ?? '',
            transactions: (request.transactions ?? []).map((item) => ({
              direction: item.direction === 2 ? 'OUTFLOW' : 'INFLOW',
              amount: item.amount ?? '',
              currencyCode: item.currencyCode ?? '',
              transactionTime: item.transactionTime ?? '',
              valueDate: item.valueDate ?? undefined,
              externalReference: item.externalReference ?? undefined,
              counterpartyName: item.counterpartyName ?? undefined,
              counterpartyAccountSnapshot: item.counterpartyAccountSnapshot ?? undefined,
              memo: item.memo ?? undefined
            }))
          })
        )

        return FinanceGrpcPresenter.toImportAccountTransactionsResponse(result)
      }
    )
  }

  async recordAccountTransaction(
    request: RecordAccountTransactionRequest
  ): Promise<RecordAccountTransactionResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'RecordAccountTransaction',
        resourceType: 'account_transaction',
        targetId: request.financialAccountId ?? null,
        requestSummary: {
          financialAccountId: request.financialAccountId ?? '',
          amount: request.amount ?? '',
          direction: request.direction ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new RecordAccountTransactionCommand({
            tenantId: request.tenantId ?? '',
            financialAccountId: request.financialAccountId ?? '',
            direction: request.direction === AccountTransactionDirection.ACCOUNT_TRANSACTION_DIRECTION_OUTFLOW
              ? 'OUTFLOW'
              : 'INFLOW',
            amount: request.amount ?? '',
            currencyCode: request.currencyCode ?? '',
            transactionTime: request.transactionTime ?? '',
            valueDate: request.valueDate ?? undefined,
            sourceType: toDomainSourceType(request.sourceType),
            status: toDomainTransactionStatus(request.status),
            externalReference: request.externalReference ?? undefined,
            counterpartyName: request.counterpartyName ?? undefined,
            counterpartyAccountSnapshot: request.counterpartyAccountSnapshot ?? undefined,
            memo: request.memo ?? undefined,
            fileAssetId: request.fileAssetId ?? undefined,
            attachmentRef: request.attachmentRef ?? undefined
          })
        )

        return {
          accountTransaction: FinanceGrpcPresenter.toAccountTransaction(result)
        }
      }
    )
  }

  async registerCustomerFinancialAccount(
    request: RegisterCustomerFinancialAccountRequest
  ): Promise<RegisterCustomerFinancialAccountResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'RegisterCustomerFinancialAccount',
        resourceType: 'customer_financial_account',
        targetId: request.customerTenantPartyId ?? null,
        requestSummary: {
          customerTenantPartyId: request.customerTenantPartyId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new RegisterCustomerFinancialAccountCommand({
            tenantId: request.tenantId ?? '',
            customerTenantPartyId: request.customerTenantPartyId ?? '',
            accountHolderName: request.accountHolderName ?? '',
            accountProviderType: toDomainCustomerAccountProviderType(request.accountProviderType),
            accountIdentifier: request.accountIdentifier ?? '',
            currencyCode: request.currencyCode ?? undefined,
            isDefault: request.isDefault ?? undefined
          })
        )

        return {
          customerFinancialAccount: FinanceGrpcPresenter.toCustomerFinancialAccount(result)
        }
      }
    )
  }

  async setExchangeRate(request: SetExchangeRateRequest): Promise<SetExchangeRateResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'SetExchangeRate',
        resourceType: 'exchange_rate',
        targetId: null,
        requestSummary: {
          baseCurrencyCode: request.baseCurrencyCode ?? '',
          quoteCurrencyCode: request.quoteCurrencyCode ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new SetExchangeRateCommand({
            tenantId: request.tenantId ?? '',
            baseCurrencyCode: request.baseCurrencyCode ?? '',
            quoteCurrencyCode: request.quoteCurrencyCode ?? '',
            rateValue: request.rateValue ?? '',
            effectiveAt: request.effectiveAt ?? '',
            setBy: request.setBy ?? ''
          })
        )

        return {
          exchangeRate: FinanceGrpcPresenter.toExchangeRate(result)
        }
      }
    )
  }

  async createReceivableScheduleFromSalesOrder(
    request: CreateReceivableScheduleFromSalesOrderRequest
  ): Promise<CreateReceivableScheduleFromSalesOrderResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreateReceivableScheduleFromSalesOrder',
        resourceType: 'receivable_schedule',
        targetId: request.salesOrderId ?? null,
        requestSummary: {
          salesOrderId: request.salesOrderId ?? '',
          lineCount: request.lines?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreateReceivableScheduleFromSalesOrderCommand({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            salesOrderId: request.salesOrderId ?? '',
            customerTenantPartyId: request.customerTenantPartyId ?? '',
            customerSnapshot: request.customerSnapshot ?? '',
            currencyCode: request.currencyCode ?? '',
            salesExchangeRateSnapshot: request.salesExchangeRateSnapshot ?? undefined,
            lines: (request.lines ?? []).map((line) => ({
              dueDate: line.dueDate ?? '',
              scheduledAmount: line.scheduledAmount ?? '',
              sourceSalesOrderLineId: line.sourceSalesOrderLineId ?? undefined,
              memo: line.memo ?? undefined
            }))
          })
        )

        return FinanceGrpcPresenter.toCreateReceivableScheduleFromSalesOrderResponse(result)
      }
    )
  }

  async setFinanceReleaseSignal(
    request: SetFinanceReleaseSignalRequest
  ): Promise<SetFinanceReleaseSignalResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'SetFinanceReleaseSignal',
        resourceType: 'finance_release_signal',
        targetId: request.salesOrderId ?? null,
        requestSummary: {
          salesOrderId: request.salesOrderId ?? '',
          signalStatus: request.signalStatus ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new SetFinanceReleaseSignalCommand({
            tenantId: request.tenantId ?? '',
            salesOrderId: request.salesOrderId ?? '',
            customerTenantPartyId: request.customerTenantPartyId ?? '',
            signalStatus: toDomainFinanceReleaseStatus(request.signalStatus),
            reasonCode: request.reasonCode ?? undefined,
            reasonSummary: request.reasonSummary ?? undefined,
            effectiveAt: request.effectiveAt ?? '',
            expiresAt: request.expiresAt ?? undefined,
            basedOnSummary: request.basedOnSummary ?? undefined
          })
        )

        return {
          financeReleaseSignal: FinanceGrpcPresenter.toFinanceReleaseSignal(result)
        }
      }
    )
  }

  async createPayableScheduleFromPurchaseOrder(
    request: CreatePayableScheduleFromPurchaseOrderRequest
  ): Promise<CreatePayableScheduleFromPurchaseOrderResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreatePayableScheduleFromPurchaseOrder',
        resourceType: 'payable_schedule',
        targetId: request.purchaseOrderId ?? null,
        requestSummary: {
          purchaseOrderId: request.purchaseOrderId ?? '',
          lineCount: request.lines?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreatePayableScheduleFromPurchaseOrderCommand({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            purchaseOrderId: request.purchaseOrderId ?? '',
            purchaseOrderNo: request.purchaseOrderNo ?? undefined,
            procurementSnapshotReference: request.procurementSnapshotReference ?? undefined,
            supplierTenantPartyId: request.supplierTenantPartyId ?? '',
            supplierSnapshot: request.supplierSnapshot ?? '',
            currencyCode: request.currencyCode ?? '',
            lines: (request.lines ?? []).map((line) => ({
              lineType: (line.lineType ?? '') as 'DEPOSIT' | 'BALANCE' | 'INSTALLMENT' | 'TERM_DUE',
              sourceRef: line.sourceRef ?? '',
              dueDate: line.dueDate ?? '',
              scheduledAmount: line.scheduledAmount ?? '',
              sourcePurchaseOrderLineId: line.sourcePurchaseOrderLineId ?? undefined,
              memo: line.memo ?? undefined
            }))
          })
        )

        return FinanceGrpcPresenter.toCreatePayableScheduleFromPurchaseOrderResponse(result)
      }
    )
  }

  async applyPayableScheduleAdjustmentFromPurchaseOrderChange(
    request: ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeRequest
  ): Promise<ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ApplyPayableScheduleAdjustmentFromPurchaseOrderChange',
        resourceType: 'payable_schedule',
        targetId: request.purchaseOrderId ?? null,
        requestSummary: {
          purchaseOrderId: request.purchaseOrderId ?? '',
          purchaseOrderChangeId: request.purchaseOrderChangeId ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeCommand({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            purchaseOrderId: request.purchaseOrderId ?? '',
            purchaseOrderChangeId: request.purchaseOrderChangeId ?? '',
            procurementSnapshotReference: request.procurementSnapshotReference ?? undefined,
            changeReason: request.changeReason ?? undefined,
            adjustments: (request.adjustments ?? []).map((item) => ({
              action: (item.action ?? '') as 'ADD' | 'CANCEL_UNEXECUTED' | 'SUPERSEDE_UNEXECUTED',
              targetSourceRef: item.targetSourceRef ?? undefined,
              newSourceRef: item.newSourceRef ?? undefined,
              lineType: item.lineType as
                | 'DEPOSIT'
                | 'BALANCE'
                | 'INSTALLMENT'
                | 'TERM_DUE'
                | 'ADJUSTMENT'
                | undefined,
              dueDate: item.dueDate ?? undefined,
              scheduledAmount: item.scheduledAmount ?? undefined,
              sourcePurchaseOrderLineId: item.sourcePurchaseOrderLineId ?? undefined,
              memo: item.memo ?? undefined
            }))
          })
        )

        return FinanceGrpcPresenter.toApplyPayableScheduleAdjustmentFromPurchaseOrderChangeResponse(
          result
        )
      }
    )
  }

  async createPaymentRequest(
    request: CreatePaymentRequestRequest
  ): Promise<CreatePaymentRequestResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'CreatePaymentRequest',
        resourceType: 'payment_request',
        targetId: request.sourcePurchaseOrderId ?? null,
        requestSummary: {
          requestSource: request.requestSource ?? '',
          requestedAmount: request.requestedAmount ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new CreatePaymentRequestCommand({
            tenantId: request.tenantId ?? '',
            orgId: request.orgId ?? undefined,
            requestSource: (request.requestSource ?? '') as
              | 'PROCUREMENT_INITIATED'
              | 'FINANCE_INITIATED',
            sourcePurchaseOrderId: request.sourcePurchaseOrderId ?? undefined,
            supplierTenantPartyId: request.supplierTenantPartyId ?? '',
            beneficiarySupplierFinancialAccountId:
              request.beneficiarySupplierFinancialAccountId ?? '',
            currencyCode: request.currencyCode ?? '',
            requestedAmount: request.requestedAmount ?? '',
            requestedLines: (request.requestedLines ?? []).map((line) => ({
              payableScheduleId: line.payableScheduleId ?? '',
              payableScheduleLineId: line.payableScheduleLineId ?? '',
              requestedAmount: line.requestedAmount ?? ''
            })),
            evidenceSnapshots: (request.evidenceSnapshots ?? []).map((snapshot) => ({
              evidenceType: (snapshot.evidenceType ?? '') as
                | 'SUPPLIER_BILL'
                | 'SUPPLIER_INVOICE'
                | 'SUPPLIER_STATEMENT'
                | 'OTHER',
              externalDocumentNo: snapshot.externalDocumentNo ?? undefined,
              documentDate: snapshot.documentDate ?? undefined,
              currencyCode: snapshot.currencyCode ?? undefined,
              documentAmount: snapshot.documentAmount ?? undefined,
              attachmentRef: snapshot.attachmentRef ?? undefined,
              note: snapshot.note ?? undefined
            })),
            reason: request.reason ?? undefined
          })
        )

        return FinanceGrpcPresenter.toCreatePaymentRequestResponse(result)
      }
    )
  }

  async decidePaymentRequest(
    request: DecidePaymentRequestRequest
  ): Promise<DecidePaymentRequestResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'DecidePaymentRequest',
        resourceType: 'payment_request',
        targetId: request.paymentRequestId ?? null,
        requestSummary: {
          paymentRequestId: request.paymentRequestId ?? '',
          decision: request.decision ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new DecidePaymentRequestCommand({
            tenantId: request.tenantId ?? '',
            paymentRequestId: request.paymentRequestId ?? '',
            decision: (request.decision ?? '') as 'APPROVED' | 'REJECTED',
            decisionReason: request.decisionReason ?? undefined
          })
        )

        return FinanceGrpcPresenter.toDecidePaymentRequestResponse(result)
      }
    )
  }

  async executePaymentRequest(
    request: ExecutePaymentRequestRequest
  ): Promise<ExecutePaymentRequestResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'ExecutePaymentRequest',
        resourceType: 'payment_execution',
        targetId: request.paymentRequestId ?? null,
        requestSummary: {
          paymentRequestId: request.paymentRequestId ?? '',
          executedAmount: request.executedAmount ?? ''
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new ExecutePaymentRequestCommand({
            tenantId: request.tenantId ?? '',
            paymentRequestId: request.paymentRequestId ?? '',
            sourceFinancialAccountId: request.sourceFinancialAccountId ?? '',
            executedAmount: request.executedAmount ?? '',
            currencyCode: request.currencyCode ?? '',
            executedAt: request.executedAt ?? '',
            executionReference: request.executionReference ?? undefined,
            attachmentRefs: request.attachmentRefs ?? [],
            linkedAccountTransactionId: request.linkedAccountTransactionId ?? undefined
          })
        )

        return FinanceGrpcPresenter.toExecutePaymentRequestResponse(result)
      }
    )
  }

  async allocatePaymentToPayable(
    request: AllocatePaymentToPayableRequest
  ): Promise<AllocatePaymentToPayableResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'AllocatePaymentToPayable',
        resourceType: 'payment_allocation',
        targetId: request.accountTransactionId ?? null,
        requestSummary: {
          accountTransactionId: request.accountTransactionId ?? '',
          allocationCount: request.allocations?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new AllocatePaymentToPayableCommand({
            tenantId: request.tenantId ?? '',
            accountTransactionId: request.accountTransactionId ?? '',
            paymentExecutionId: request.paymentExecutionId ?? undefined,
            allocations: (request.allocations ?? []).map((allocation) => ({
              payableScheduleId: allocation.payableScheduleId ?? '',
              payableScheduleLineId: allocation.payableScheduleLineId ?? '',
              allocatedAmount: allocation.allocatedAmount ?? ''
            }))
          })
        )

        return {
          paymentAllocations: result.map((item) => FinanceGrpcPresenter.toPaymentAllocation(item))
        }
      }
    )
  }

  async allocatePaymentToReceivable(
    request: AllocatePaymentToReceivableRequest
  ): Promise<AllocatePaymentToReceivableResponse> {
    const context = FinanceRpcContextValidator.assertManagementContext(request)
    return this.auditService.recordCommand(
      {
        tenantId: context.tenantId,
        operatorContext: context.operatorContext,
        traceContext: context.traceContext,
        auditContext: context.auditContext,
        commandName: 'AllocatePaymentToReceivable',
        resourceType: 'payment_allocation',
        targetId: request.accountTransactionId ?? null,
        requestSummary: {
          accountTransactionId: request.accountTransactionId ?? '',
          allocationCount: request.allocations?.length ?? 0
        }
      },
      async () => {
        const result = await this.commandBus.execute(
          new AllocatePaymentToReceivableCommand({
            tenantId: request.tenantId ?? '',
            accountTransactionId: request.accountTransactionId ?? '',
            allocations: (request.allocations ?? []).map((allocation) => ({
              receivableScheduleId: allocation.receivableScheduleId ?? '',
              receivableScheduleLineId: allocation.receivableScheduleLineId ?? '',
              allocatedAmount: allocation.allocatedAmount ?? ''
            }))
          })
        )

        return {
          paymentAllocations: result.map((item) => FinanceGrpcPresenter.toPaymentAllocation(item))
        }
      }
    )
  }
}

function toDomainFinancialAccountType(value?: number): DomainFinancialAccountType {
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
      throw ExceptionFactory.application(FINANCE_INVALID_ARGUMENT, { field: 'accountType' })
  }
}

function toDomainFinancialAccountStatus(value?: number): 'ACTIVE' | 'INACTIVE' | 'CLOSED' {
  switch (value) {
    case FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_ACTIVE:
      return 'ACTIVE'
    case FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_INACTIVE:
      return 'INACTIVE'
    case FinancialAccountStatus.FINANCIAL_ACCOUNT_STATUS_CLOSED:
      return 'CLOSED'
    default:
      throw ExceptionFactory.application(FINANCE_INVALID_ARGUMENT, { field: 'status' })
  }
}

function toDomainSourceType(value?: number): DomainSourceType {
  switch (value) {
    case AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_CSV_IMPORT:
      return DomainSourceType.CSV_IMPORT
    case AccountTransactionSourceType.ACCOUNT_TRANSACTION_SOURCE_TYPE_FUTURE_API:
      return DomainSourceType.FUTURE_API
    default:
      return DomainSourceType.MANUAL
  }
}

function toDomainTransactionStatus(value?: number): DomainStatus | undefined {
  switch (value) {
    case AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_DRAFT:
      return DomainStatus.DRAFT
    case AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_CONFIRMED:
      return DomainStatus.CONFIRMED
    case AccountTransactionStatus.ACCOUNT_TRANSACTION_STATUS_VOIDED:
      return DomainStatus.VOIDED
    default:
      return undefined
  }
}

function toDomainCustomerAccountProviderType(
  value?: number
): RegisterCustomerFinancialAccountCommand['payload']['accountProviderType'] {
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

function toDomainFinanceReleaseStatus(value?: number): FinanceReleaseStatus {
  switch (value) {
    case FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_RELEASED:
      return FinanceReleaseStatus.RELEASED
    case FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_HELD:
      return FinanceReleaseStatus.HELD
    case FinanceReleaseSignalStatus.FINANCE_RELEASE_SIGNAL_STATUS_REVIEW_REQUIRED:
      return FinanceReleaseStatus.REVIEW_REQUIRED
    default:
      throw ExceptionFactory.application(FINANCE_INVALID_ARGUMENT, { field: 'signalStatus' })
  }
}
