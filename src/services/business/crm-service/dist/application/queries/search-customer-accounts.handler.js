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
exports.SearchCustomerAccountsHandler = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const tokens_1 = require("../../common/constants/tokens");
const crm_assertions_1 = require("../support/crm-assertions");
const search_customer_accounts_query_1 = require("./search-customer-accounts.query");
/** SearchCustomerAccountsHandler exposes the CRM account directory including blocked, archived, and unbound accounts. */
let SearchCustomerAccountsHandler = class SearchCustomerAccountsHandler {
    constructor(accountRepository) {
        this.accountRepository = accountRepository;
    }
    async execute(query) {
        const { page, pageSize } = (0, crm_assertions_1.normalizePageInput)(query.input.page, query.input.pageSize);
        const result = await this.accountRepository.search({
            tenantId: query.input.tenantId,
            keyword: query.input.keyword,
            status: query.input.status,
            primaryTenantPartyId: query.input.primaryTenantPartyId,
            page,
            pageSize
        });
        return {
            customerAccounts: result.items,
            total: result.total,
            page: result.page,
            pageSize: result.pageSize
        };
    }
};
exports.SearchCustomerAccountsHandler = SearchCustomerAccountsHandler;
exports.SearchCustomerAccountsHandler = SearchCustomerAccountsHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(search_customer_accounts_query_1.SearchCustomerAccountsQuery),
    __param(0, (0, common_1.Inject)(tokens_1.TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SearchCustomerAccountsHandler);
//# sourceMappingURL=search-customer-accounts.handler.js.map