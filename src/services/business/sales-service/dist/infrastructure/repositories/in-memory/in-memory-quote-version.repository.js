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
exports.InMemoryQuoteVersionRepository = void 0;
const common_1 = require("@nestjs/common");
const sales_records_1 = require("../../../domain/models/sales-records");
const sales_assertions_1 = require("../../../application/support/sales-assertions");
const sales_in_memory_store_1 = require("../../store/sales-in-memory-store");
/** InMemoryQuoteVersionRepository stores immutable quote versions in the process-local phase 1 skeleton store. */
let InMemoryQuoteVersionRepository = class InMemoryQuoteVersionRepository {
    constructor(store) {
        this.store = store;
    }
    async nextVersionNo(tenantId, quoteId) {
        return ([...this.store.quoteVersions.values()].filter((quoteVersion) => quoteVersion.tenantId === tenantId && quoteVersion.quoteId === quoteId).length + 1);
    }
    async findById(tenantId, quoteVersionId) {
        const quoteVersion = this.store.quoteVersions.get(quoteVersionId);
        if (!quoteVersion || quoteVersion.tenantId !== tenantId) {
            return null;
        }
        return (0, sales_records_1.cloneRecord)(quoteVersion);
    }
    async save(quoteVersion) {
        const stored = (0, sales_records_1.cloneRecord)(quoteVersion);
        this.store.quoteVersions.set(stored.id, stored);
        return (0, sales_records_1.cloneRecord)(stored);
    }
    async listByQuoteId(input) {
        const filtered = [...this.store.quoteVersions.values()]
            .filter((quoteVersion) => quoteVersion.tenantId === input.tenantId && quoteVersion.quoteId === input.quoteId)
            .sort((left, right) => left.versionNo - right.versionNo)
            .map((quoteVersion) => (0, sales_records_1.cloneRecord)(quoteVersion));
        const { pageItems, total } = (0, sales_assertions_1.paginate)(filtered, input.page ?? 1, input.pageSize ?? 20);
        return {
            items: pageItems,
            total,
            page: input.page ?? 1,
            pageSize: input.pageSize ?? 20
        };
    }
};
exports.InMemoryQuoteVersionRepository = InMemoryQuoteVersionRepository;
exports.InMemoryQuoteVersionRepository = InMemoryQuoteVersionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_in_memory_store_1.SalesInMemoryStore])
], InMemoryQuoteVersionRepository);
//# sourceMappingURL=in-memory-quote-version.repository.js.map