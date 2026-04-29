import { Global, Module } from '@nestjs/common'
import { TOKENS } from '../common/constants/tokens'
import { PrismaSalesAuditRepository } from '../infrastructure/audit/prisma-sales-audit.repository'
import { FixedExchangeRateResolver } from '../infrastructure/pricing/fixed-exchange-rate.resolver'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaCustomerPriceAgreementRepository } from '../infrastructure/repositories/prisma/prisma-customer-price-agreement.repository'
import { PrismaPriceListRepository } from '../infrastructure/repositories/prisma/prisma-price-list.repository'
import { PrismaQuoteRepository } from '../infrastructure/repositories/prisma/prisma-quote.repository'
import { PrismaQuoteVersionRepository } from '../infrastructure/repositories/prisma/prisma-quote-version.repository'
import { PrismaSalesOrderRepository } from '../infrastructure/repositories/prisma/prisma-sales-order.repository'
import { PrismaSalesTransactionRunner } from '../infrastructure/transactions/prisma-sales-transaction-runner'

/** SalesInfrastructureModule wires the Prisma-backed persistence graph for the sales-service phase 1 runtime. */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaQuoteRepository,
    PrismaQuoteVersionRepository,
    PrismaSalesOrderRepository,
    PrismaPriceListRepository,
    PrismaCustomerPriceAgreementRepository,
    PrismaSalesAuditRepository,
    PrismaSalesTransactionRunner,
    FixedExchangeRateResolver,
    {
      provide: TOKENS.QUOTE_REPOSITORY,
      useExisting: PrismaQuoteRepository
    },
    {
      provide: TOKENS.QUOTE_VERSION_REPOSITORY,
      useExisting: PrismaQuoteVersionRepository
    },
    {
      provide: TOKENS.SALES_ORDER_REPOSITORY,
      useExisting: PrismaSalesOrderRepository
    },
    {
      provide: TOKENS.PRICE_LIST_REPOSITORY,
      useExisting: PrismaPriceListRepository
    },
    {
      provide: TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY,
      useExisting: PrismaCustomerPriceAgreementRepository
    },
    {
      provide: TOKENS.SALES_EXCHANGE_RATE_RESOLVER,
      useExisting: FixedExchangeRateResolver
    },
    {
      provide: TOKENS.SALES_AUDIT_WRITER,
      useExisting: PrismaSalesAuditRepository
    },
    {
      provide: TOKENS.SALES_TRANSACTION_RUNNER,
      useExisting: PrismaSalesTransactionRunner
    }
  ],
  exports: [
    PrismaModule,
    PrismaQuoteRepository,
    PrismaQuoteVersionRepository,
    PrismaSalesOrderRepository,
    PrismaPriceListRepository,
    PrismaCustomerPriceAgreementRepository,
    PrismaSalesAuditRepository,
    PrismaSalesTransactionRunner,
    FixedExchangeRateResolver,
    TOKENS.QUOTE_REPOSITORY,
    TOKENS.QUOTE_VERSION_REPOSITORY,
    TOKENS.SALES_ORDER_REPOSITORY,
    TOKENS.PRICE_LIST_REPOSITORY,
    TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY,
    TOKENS.SALES_EXCHANGE_RATE_RESOLVER,
    TOKENS.SALES_AUDIT_WRITER,
    TOKENS.SALES_TRANSACTION_RUNNER
  ]
})
export class SalesInfrastructureModule {}
