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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryQuoteRepository = void 0;
const common_1 = require("@nestjs/common");
const sales_records_1 = require("../../../domain/models/sales-records");
const sales_assertions_1 = require("../../../application/support/sales-assertions");
const sales_in_memory_store_1 = require("../../store/sales-in-memory-store");
/** InMemoryQuoteRepository stores current quote draft carriers inside the process-local phase 1 skeleton store. */
let InMemoryQuoteRepository = class InMemoryQuoteRepository {
    constructor(store) {
        this.store = store;
    }
    async nextQuoteNo(_tenantId) {
        return this.store.nextQuoteNo();
    }
    async findById(tenantId, quoteId) {
        const quote = this.store.quotes.get(quoteId);
        if (!quote || quote.tenantId !== tenantId) {
            return null;
        }
        return (0, sales_records_1.cloneRecord)(quote);
    }
    async save(quote) {
        const stored = (0, sales_records_1.cloneRecord)(quote);
        this.store.quotes.set(stored.id, stored);
        return (0, sales_records_1.cloneRecord)(stored);
    }
    async search(input) {
        const filtered = [...this.store.quotes.values()]
            .filter((quote) => quote.tenantId === input.tenantId)
            .filter((quote) => !input.customerTenantPartyId || quote.customerTenantPartyId === input.customerTenantPartyId)
            .filter((quote) => !input.status || input.status === sales_records_1.SalesQuoteStatus.DRAFT || input.status === sales_records_1.SalesQuoteStatus.PUBLISHED
            ? quote.status === input.status || !input.status
            : true)
            .filter((quote) => {
            if (!input.keyword) {
                return true;
            }
            const keyword = input.keyword.toLowerCase();
            return quote.quoteNo.toLowerCase().includes(keyword) || quote.customerTenantPartyId.toLowerCase().includes(keyword);
        })
            .sort((left, right) => left.quoteNo.localeCompare(right.quoteNo))
            .map((quote) => (0, sales_records_1.cloneRecord)(quote));
        const { pageItems, total } = (0, sales_assertions_1.paginate)(filtered, input.page ?? 1, input.pageSize ?? 20);
        return {
            items: pageItems,
            total,
            page: input.page ?? 1,
            pageSize: input.pageSize ?? 20
        };
    }
};
exports.InMemoryQuoteRepository = InMemoryQuoteRepository;
exports.InMemoryQuoteRepository = InMemoryQuoteRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_in_memory_store_1.SalesInMemoryStore])
], InMemoryQuoteRepository);
//# sourceMappingURL=in-memory-quote.repository.js.map