import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GetActiveCustomerPriceAgreementHandler } from '../application/queries/get-active-customer-price-agreement.handler'
import { GetCustomerPriceAgreementHandler } from '../application/queries/get-customer-price-agreement.handler'
import { GetPriceListLinesHandler } from '../application/queries/get-price-list-lines.handler'
import { GetPriceListHandler } from '../application/queries/get-price-list.handler'
import { ListCustomerPriceAgreementVersionsHandler } from '../application/queries/list-customer-price-agreement-versions.handler'
import { PreviewQuoteLinePricingHandler } from '../application/queries/preview-quote-line-pricing.handler'
import { SearchPriceListsHandler } from '../application/queries/search-price-lists.handler'
import { PricingQueryGrpcController } from '../interfaces/grpc/pricing-query.grpc.controller'
import { SalesTrustedExecutionModule } from './sales-trusted-execution.module'

/** PricingQueryModule wires the phase 1 pricing query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule, SalesTrustedExecutionModule],
  providers: [
    ValidatingQueryBus,
    SearchPriceListsHandler,
    GetPriceListHandler,
    GetPriceListLinesHandler,
    GetActiveCustomerPriceAgreementHandler,
    GetCustomerPriceAgreementHandler,
    ListCustomerPriceAgreementVersionsHandler,
    PreviewQuoteLinePricingHandler
  ],
  controllers: [PricingQueryGrpcController]
})
export class PricingQueryModule {}
