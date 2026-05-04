"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesInfrastructureModule = void 0;
const common_1 = require("@nestjs/common");
const tokens_1 = require("../common/constants/tokens");
const prisma_sales_audit_repository_1 = require("../infrastructure/audit/prisma-sales-audit.repository");
const fixed_exchange_rate_resolver_1 = require("../infrastructure/pricing/fixed-exchange-rate.resolver");
const prisma_module_1 = require("../infrastructure/prisma/prisma.module");
const prisma_customer_price_agreement_repository_1 = require("../infrastructure/repositories/prisma/prisma-customer-price-agreement.repository");
const prisma_price_list_repository_1 = require("../infrastructure/repositories/prisma/prisma-price-list.repository");
const prisma_quote_repository_1 = require("../infrastructure/repositories/prisma/prisma-quote.repository");
const prisma_quote_version_repository_1 = require("../infrastructure/repositories/prisma/prisma-quote-version.repository");
const prisma_sales_order_repository_1 = require("../infrastructure/repositories/prisma/prisma-sales-order.repository");
const prisma_sales_transaction_runner_1 = require("../infrastructure/transactions/prisma-sales-transaction-runner");
/** SalesInfrastructureModule wires the Prisma-backed persistence graph for the sales-service phase 1 runtime. */
let SalesInfrastructureModule = class SalesInfrastructureModule {
};
exports.SalesInfrastructureModule = SalesInfrastructureModule;
exports.SalesInfrastructureModule = SalesInfrastructureModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [
            prisma_quote_repository_1.PrismaQuoteRepository,
            prisma_quote_version_repository_1.PrismaQuoteVersionRepository,
            prisma_sales_order_repository_1.PrismaSalesOrderRepository,
            prisma_price_list_repository_1.PrismaPriceListRepository,
            prisma_customer_price_agreement_repository_1.PrismaCustomerPriceAgreementRepository,
            prisma_sales_audit_repository_1.PrismaSalesAuditRepository,
            prisma_sales_transaction_runner_1.PrismaSalesTransactionRunner,
            {
                provide: fixed_exchange_rate_resolver_1.FIXED_EXCHANGE_RATE_DEFINITIONS,
                useValue: []
            },
            fixed_exchange_rate_resolver_1.FixedExchangeRateResolver,
            {
                provide: tokens_1.TOKENS.QUOTE_REPOSITORY,
                useExisting: prisma_quote_repository_1.PrismaQuoteRepository
            },
            {
                provide: tokens_1.TOKENS.QUOTE_VERSION_REPOSITORY,
                useExisting: prisma_quote_version_repository_1.PrismaQuoteVersionRepository
            },
            {
                provide: tokens_1.TOKENS.SALES_ORDER_REPOSITORY,
                useExisting: prisma_sales_order_repository_1.PrismaSalesOrderRepository
            },
            {
                provide: tokens_1.TOKENS.PRICE_LIST_REPOSITORY,
                useExisting: prisma_price_list_repository_1.PrismaPriceListRepository
            },
            {
                provide: tokens_1.TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY,
                useExisting: prisma_customer_price_agreement_repository_1.PrismaCustomerPriceAgreementRepository
            },
            {
                provide: tokens_1.TOKENS.SALES_EXCHANGE_RATE_RESOLVER,
                useExisting: fixed_exchange_rate_resolver_1.FixedExchangeRateResolver
            },
            {
                provide: tokens_1.TOKENS.SALES_AUDIT_WRITER,
                useExisting: prisma_sales_audit_repository_1.PrismaSalesAuditRepository
            },
            {
                provide: tokens_1.TOKENS.SALES_TRANSACTION_RUNNER,
                useExisting: prisma_sales_transaction_runner_1.PrismaSalesTransactionRunner
            }
        ],
        exports: [
            prisma_module_1.PrismaModule,
            prisma_quote_repository_1.PrismaQuoteRepository,
            prisma_quote_version_repository_1.PrismaQuoteVersionRepository,
            prisma_sales_order_repository_1.PrismaSalesOrderRepository,
            prisma_price_list_repository_1.PrismaPriceListRepository,
            prisma_customer_price_agreement_repository_1.PrismaCustomerPriceAgreementRepository,
            prisma_sales_audit_repository_1.PrismaSalesAuditRepository,
            prisma_sales_transaction_runner_1.PrismaSalesTransactionRunner,
            fixed_exchange_rate_resolver_1.FIXED_EXCHANGE_RATE_DEFINITIONS,
            fixed_exchange_rate_resolver_1.FixedExchangeRateResolver,
            tokens_1.TOKENS.QUOTE_REPOSITORY,
            tokens_1.TOKENS.QUOTE_VERSION_REPOSITORY,
            tokens_1.TOKENS.SALES_ORDER_REPOSITORY,
            tokens_1.TOKENS.PRICE_LIST_REPOSITORY,
            tokens_1.TOKENS.CUSTOMER_PRICE_AGREEMENT_REPOSITORY,
            tokens_1.TOKENS.SALES_EXCHANGE_RATE_RESOLVER,
            tokens_1.TOKENS.SALES_AUDIT_WRITER,
            tokens_1.TOKENS.SALES_TRANSACTION_RUNNER
        ]
    })
], SalesInfrastructureModule);
//# sourceMappingURL=sales-infrastructure.module.js.map