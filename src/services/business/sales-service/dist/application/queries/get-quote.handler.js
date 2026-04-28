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
exports.GetQuoteHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const sales_errors_1 = require("../../common/errors/sales.errors");
const sales_assertions_1 = require("../support/sales-assertions");
const get_quote_query_1 = require("./get-quote.query");
/** GetQuoteHandler returns the current mutable quote draft or NOT_FOUND for missing targets. */
let GetQuoteHandler = class GetQuoteHandler {
    constructor(quoteRepository) {
        this.quoteRepository = quoteRepository;
    }
    async execute(query) {
        (0, sales_assertions_1.assertRequiredString)(query.tenantId, 'tenantId');
        (0, sales_assertions_1.assertRequiredString)(query.quoteId, 'quoteId');
        const quote = await this.quoteRepository.findById(query.tenantId, query.quoteId);
        if (!quote) {
            throw exceptions_1.ExceptionFactory.domain(sales_errors_1.SALES_NOT_FOUND, {
                quoteId: query.quoteId
            });
        }
        return quote;
    }
};
exports.GetQuoteHandler = GetQuoteHandler;
exports.GetQuoteHandler = GetQuoteHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(get_quote_query_1.GetQuoteQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.QUOTE_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], GetQuoteHandler);
//# sourceMappingURL=get-quote.handler.js.map