import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import {
  CreateFinancialAccountHandler,
  ImportAccountTransactionsHandler,
  RecordAccountTransactionHandler,
  RegisterCustomerFinancialAccountHandler,
  RegisterSupplierFinancialAccountHandler,
  SetExchangeRateHandler,
  UpdateFinancialAccountBasicsHandler
} from '../application/commands/account-management.handlers'
import {
  AllocatePaymentToPayableHandler,
  AllocatePaymentToReceivableHandler,
  ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeHandler,
  CreatePayableScheduleFromPurchaseOrderHandler,
  CreatePaymentRequestHandler,
  DecidePaymentRequestHandler,
  ExecutePaymentRequestHandler
} from '../application/commands/payment-management.handlers'
import {
  CreateReceivableScheduleFromSalesOrderHandler,
  SetFinanceReleaseSignalHandler
} from '../application/commands/receivable-management.handlers'
import { FinanceAuditService } from '../application/services/finance-audit.service'
import { FinanceManagementGrpcController } from '../interfaces/grpc/finance-management.grpc.controller'
import { FinanceTrustedExecutionModule } from './finance-trusted-execution.module'

/** FinanceManagementModule wires the phase 1A finance command handlers, audit service, and gRPC management controller. */
@Module({
  imports: [CqrsModule, FinanceTrustedExecutionModule],
  providers: [
    ValidatingCommandBus,
    FinanceAuditService,
    CreateFinancialAccountHandler,
    UpdateFinancialAccountBasicsHandler,
    ImportAccountTransactionsHandler,
    RecordAccountTransactionHandler,
    RegisterCustomerFinancialAccountHandler,
    RegisterSupplierFinancialAccountHandler,
    SetExchangeRateHandler,
    CreateReceivableScheduleFromSalesOrderHandler,
    SetFinanceReleaseSignalHandler,
    CreatePayableScheduleFromPurchaseOrderHandler,
    ApplyPayableScheduleAdjustmentFromPurchaseOrderChangeHandler,
    CreatePaymentRequestHandler,
    DecidePaymentRequestHandler,
    ExecutePaymentRequestHandler,
    AllocatePaymentToPayableHandler,
    AllocatePaymentToReceivableHandler
  ],
  controllers: [FinanceManagementGrpcController]
})
export class FinanceManagementModule {}
