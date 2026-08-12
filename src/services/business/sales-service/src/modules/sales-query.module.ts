import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GetQuoteHandler } from '../application/queries/get-quote.handler'
import { GetQuoteVersionHandler } from '../application/queries/get-quote-version.handler'
import { GetSalesOrderHandler } from '../application/queries/get-sales-order.handler'
import { ListQuoteVersionsHandler } from '../application/queries/list-quote-versions.handler'
import { SearchQuotesHandler } from '../application/queries/search-quotes.handler'
import { SearchSalesOrdersHandler } from '../application/queries/search-sales-orders.handler'
import { SalesQueryGrpcController } from '../interfaces/grpc/sales-query.grpc.controller'
import { SalesTrustedExecutionModule } from './sales-trusted-execution.module'

/** SalesQueryModule wires the phase 1 sales query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule, SalesTrustedExecutionModule],
  providers: [
    ValidatingQueryBus,
    GetQuoteHandler,
    SearchQuotesHandler,
    GetQuoteVersionHandler,
    ListQuoteVersionsHandler,
    GetSalesOrderHandler,
    SearchSalesOrdersHandler
  ],
  controllers: [SalesQueryGrpcController]
})
export class SalesQueryModule {}
