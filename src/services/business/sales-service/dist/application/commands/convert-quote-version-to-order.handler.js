"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConvertQuoteVersionToOrderHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const sales_errors_1 = require("../../common/errors/sales.errors");
const sales_records_1 = require("../../domain/models/sales-records");
const sales_assertions_1 = require("../support/sales-assertions");
const sales_line_builders_1 = require("../support/sales-line-builders");
const convert_quote_version_to_order_command_1 = require("./convert-quote-version-to-order.command");
/** ConvertQuoteVersionToOrderHandler establishes exactly one sales order from one published quote version. */
let ConvertQuoteVersionToOrderHandler = class ConvertQuoteVersionToOrderHandler {
    constructor(quoteVersionRepository, salesOrderRepository) {
        this.quoteVersionRepository = quoteVersionRepository;
        this.salesOrderRepository = salesOrderRepository;
    }
    async execute(command) {
        (0, sales_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, sales_assertions_1.assertRequiredString)(command.quoteVersionId, 'quoteVersionId');
        const quoteVersion = await this.quoteVersionRepository.findById(command.tenantId, command.quoteVersionId);
        if (!quoteVersion) {
            throw exceptions_1.ExceptionFactory.domain(sales_errors_1.SALES_NOT_FOUND, {
                quoteVersionId: command.quoteVersionId
            });
        }
        const existingOrder = await this.salesOrderRepository.findByQuoteVersionId(command.tenantId, command.quoteVersionId);
        if (existingOrder) {
            throw exceptions_1.ExceptionFactory.domain(sales_errors_1.SALES_ALREADY_EXISTS, {
                quoteVersionId: command.quoteVersionId
            });
        }
        const order = {
            id: (0, node_crypto_1.randomUUID)(),
            salesOrderNo: await this.salesOrderRepository.nextSalesOrderNo(command.tenantId),
            tenantId: quoteVersion.tenantId,
            customerTenantPartyId: quoteVersion.customerTenantPartyId,
            quoteId: quoteVersion.quoteId,
            quoteVersionId: quoteVersion.id,
            commercialGateSummary: (0, sales_records_1.buildInitialCommercialGateSummary)(true),
            fulfillmentHandoffStatus: (0, sales_records_1.buildInitialHandoffSummary)(),
            lines: (0, sales_line_builders_1.toSalesOrderLineRecords)(quoteVersion.lines)
        };
        return this.salesOrderRepository.save(order);
    }
};
exports.ConvertQuoteVersionToOrderHandler = ConvertQuoteVersionToOrderHandler;
exports.ConvertQuoteVersionToOrderHandler = ConvertQuoteVersionToOrderHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(convert_quote_version_to_order_command_1.ConvertQuoteVersionToOrderCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.QUOTE_VERSION_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.SALES_ORDER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], ConvertQuoteVersionToOrderHandler);
//# sourceMappingURL=convert-quote-version-to-order.handler.js.map