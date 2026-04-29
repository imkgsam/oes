import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import {
  GetExchangeRateHandler,
  GetFinancialAccountHandler,
  SearchAccountTransactionsHandler,
  SearchFinancialAccountsHandler
} from '../application/queries/account-query.handlers'
import {
  GetPayableScheduleHandler,
  SearchPayableSchedulesHandler,
  SearchPaymentAllocationsHandler,
  SearchPaymentExecutionsHandler,
  SearchPaymentRequestsHandler
} from '../application/queries/payment-query.handlers'
import {
  GetFinanceReleaseSignalHandler,
  GetReceivableScheduleHandler,
  SearchReceivableSchedulesHandler
} from '../application/queries/receivable-query.handlers'
import { FinanceQueryGrpcController } from '../interfaces/grpc/finance-query.grpc.controller'

/** FinanceQueryModule wires the phase 1A finance query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule],
  providers: [
    ValidatingQueryBus,
    GetFinancialAccountHandler,
    SearchFinancialAccountsHandler,
    SearchAccountTransactionsHandler,
    GetExchangeRateHandler,
    GetReceivableScheduleHandler,
    SearchReceivableSchedulesHandler,
    GetFinanceReleaseSignalHandler,
    GetPayableScheduleHandler,
    SearchPayableSchedulesHandler,
    SearchPaymentRequestsHandler,
    SearchPaymentExecutionsHandler,
    SearchPaymentAllocationsHandler
  ],
  controllers: [FinanceQueryGrpcController]
})
export class FinanceQueryModule {}
