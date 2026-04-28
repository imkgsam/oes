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
exports.CreateQuoteHandler = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const sales_records_1 = require("../../domain/models/sales-records");
const sales_assertions_1 = require("../support/sales-assertions");
const sales_line_builders_1 = require("../support/sales-line-builders");
const create_quote_command_1 = require("./create-quote.command");
/** CreateQuoteHandler creates a new quote draft carrier without creating any published version. */
let CreateQuoteHandler = class CreateQuoteHandler {
    constructor(quoteRepository) {
        this.quoteRepository = quoteRepository;
    }
    async execute(command) {
        (0, sales_assertions_1.assertRequiredString)(command.tenantId, 'tenantId');
        (0, sales_assertions_1.assertRequiredString)(command.customerTenantPartyId, 'customerTenantPartyId');
        const quote = {
            id: (0, node_crypto_1.randomUUID)(),
            quoteNo: await this.quoteRepository.nextQuoteNo(command.tenantId),
            tenantId: command.tenantId,
            customerTenantPartyId: command.customerTenantPartyId,
            opportunityRef: command.opportunityRef ?? null,
            status: sales_records_1.SalesQuoteStatus.DRAFT,
            latestPublishedVersionId: null,
            lines: (0, sales_line_builders_1.toQuoteLineRecords)(command.draftLines ?? [])
        };
        return this.quoteRepository.save(quote);
    }
};
exports.CreateQuoteHandler = CreateQuoteHandler;
exports.CreateQuoteHandler = CreateQuoteHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(create_quote_command_1.CreateQuoteCommand),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.QUOTE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CreateQuoteHandler);
//# sourceMappingURL=create-quote.handler.js.map