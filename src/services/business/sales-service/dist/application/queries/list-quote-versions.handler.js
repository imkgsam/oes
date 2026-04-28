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
exports.ListQuoteVersionsHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const exceptions_1 = require("@oes/common/exceptions");
const tokens_1 = require("../../common/constants/tokens");
const sales_errors_1 = require("../../common/errors/sales.errors");
const sales_assertions_1 = require("../support/sales-assertions");
const list_quote_versions_query_1 = require("./list-quote-versions.query");
/** ListQuoteVersionsHandler lists published history only after confirming the quote carrier exists. */
let ListQuoteVersionsHandler = class ListQuoteVersionsHandler {
    constructor(quoteRepository, quoteVersionRepository) {
        this.quoteRepository = quoteRepository;
        this.quoteVersionRepository = quoteVersionRepository;
    }
    async execute(query) {
        (0, sales_assertions_1.assertRequiredString)(query.input.tenantId, 'tenantId');
        (0, sales_assertions_1.assertRequiredString)(query.input.quoteId, 'quoteId');
        const quote = await this.quoteRepository.findById(query.input.tenantId, query.input.quoteId);
        if (!quote) {
            throw exceptions_1.ExceptionFactory.domain(sales_errors_1.SALES_NOT_FOUND, {
                quoteId: query.input.quoteId
            });
        }
        const pageState = (0, sales_assertions_1.normalizePageInput)(query.input.page, query.input.pageSize);
        const result = await this.quoteVersionRepository.listByQuoteId({
            ...query.input,
            ...pageState
        });
        return {
            ...result,
            quoteVersions: result.items
        };
    }
};
exports.ListQuoteVersionsHandler = ListQuoteVersionsHandler;
exports.ListQuoteVersionsHandler = ListQuoteVersionsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(list_quote_versions_query_1.ListQuoteVersionsQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.QUOTE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(tokens_1.TOKENS.QUOTE_VERSION_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], ListQuoteVersionsHandler);
//# sourceMappingURL=list-quote-versions.handler.js.map