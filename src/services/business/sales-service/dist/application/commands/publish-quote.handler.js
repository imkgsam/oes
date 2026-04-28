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
exports.PublishQuoteHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const sales_errors_1 = require("../../common/errors/sales.errors");
const sales_records_1 = require("../../domain/models/sales-records");
const sales_assertions_1 = require("../support/sales-assertions");
const publish_quote_command_1 = require("./publish-quote.command");
/** PublishQuoteHandler freezes the current draft into an immutable quote version and updates the quote summary. */
let PublishQuoteHandler = class PublishQuoteHandler {
    constructor(quoteRepository, quoteVersionRepository) {
        this.quoteRepository = quoteRepository;
        this.quoteVersionRepository = quoteVersionRepository;
    }
    async execute(command) {
        (0, sales_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, sales_assertions_1.assertRequiredString)(command.quoteId, 'quoteId');
        const quote = await this.quoteRepository.findById(command.tenantId, command.quoteId);
        if (!quote) {
            throw exceptions_1.ExceptionFactory.domain(sales_errors_1.SALES_NOT_FOUND, {
                quoteId: command.quoteId
            });
        }
        if (quote.lines.length === 0) {
            throw exceptions_1.ExceptionFactory.application(sales_errors_1.SALES_FAILED_PRECONDITION, {
                reason: 'quote draft must contain at least one line before publish'
            });
        }
        const quoteVersion = {
            id: (0, node_crypto_1.randomUUID)(),
            quoteId: quote.id,
            quoteNo: quote.quoteNo,
            versionNo: await this.quoteVersionRepository.nextVersionNo(command.tenantId, quote.id),
            tenantId: quote.tenantId,
            customerTenantPartyId: quote.customerTenantPartyId,
            publishedAt: new Date().toISOString(),
            lines: structuredClone(quote.lines)
        };
        const savedVersion = await this.quoteVersionRepository.save(quoteVersion);
        const updatedQuote = await this.quoteRepository.save({
            ...quote,
            status: sales_records_1.SalesQuoteStatus.PUBLISHED,
            latestPublishedVersionId: savedVersion.id
        });
        return {
            id: savedVersion.id,
            quote: updatedQuote,
            quoteVersion: savedVersion
        };
    }
};
exports.PublishQuoteHandler = PublishQuoteHandler;
exports.PublishQuoteHandler = PublishQuoteHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(publish_quote_command_1.PublishQuoteCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.QUOTE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.QUOTE_VERSION_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], PublishQuoteHandler);
//# sourceMappingURL=publish-quote.handler.js.map