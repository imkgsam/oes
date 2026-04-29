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
exports.InMemorySalesOrderRepository = void 0;
const common_1 = require("@nestjs/common");
const sales_records_1 = require("../../../domain/models/sales-records");
const sales_assertions_1 = require("../../../application/support/sales-assertions");
const sales_in_memory_store_1 = require("../../store/sales-in-memory-store");
/** InMemorySalesOrderRepository stores established orders, commercial gates, and handoff summaries in-process. */
let InMemorySalesOrderRepository = class InMemorySalesOrderRepository {
    constructor(store) {
        this.store = store;
    }
    async nextSalesOrderNo(_tenantId) {
        return this.store.nextSalesOrderNo();
    }
    async findById(tenantId, salesOrderId) {
        const order = this.store.salesOrders.get(salesOrderId);
        if (!order || order.tenantId !== tenantId) {
            return null;
        }
        return (0, sales_records_1.cloneRecord)(order);
    }
    async findByQuoteVersionId(tenantId, quoteVersionId) {
        const order = [...this.store.salesOrders.values()].find((candidate) => candidate.tenantId === tenantId && candidate.quoteVersionId === quoteVersionId);
        return order ? (0, sales_records_1.cloneRecord)(order) : null;
    }
    async findLineById(tenantId, salesOrderLineId) {
        const order = [...this.store.salesOrders.values()].find((candidate) => candidate.tenantId === tenantId &&
            candidate.lines.some((line) => line.salesOrderLineId === salesOrderLineId));
        if (!order) {
            return null;
        }
        const line = order.lines.find((candidate) => candidate.salesOrderLineId === salesOrderLineId);
        if (!line) {
            return null;
        }
        return {
            order: (0, sales_records_1.cloneRecord)(order),
            line: (0, sales_records_1.cloneRecord)(line)
        };
    }
    async save(order) {
        const stored = (0, sales_records_1.cloneRecord)(order);
        this.store.salesOrders.set(stored.id, stored);
        return (0, sales_records_1.cloneRecord)(stored);
    }
    async search(input) {
        const filtered = [...this.store.salesOrders.values()]
            .filter((order) => order.tenantId === input.tenantId)
            .filter((order) => !input.customerTenantPartyId || order.customerTenantPartyId === input.customerTenantPartyId)
            .filter((order) => !input.quoteVersionId || order.quoteVersionId === input.quoteVersionId)
            .filter((order) => input.productionGate === undefined || order.commercialGateSummary.productionGate === input.productionGate)
            .filter((order) => input.stockingGate === undefined || order.commercialGateSummary.stockingGate === input.stockingGate)
            .filter((order) => input.shippingGate === undefined || order.commercialGateSummary.shippingGate === input.shippingGate)
            .filter((order) => {
            if (!input.keyword) {
                return true;
            }
            const keyword = input.keyword.toLowerCase();
            return order.salesOrderNo.toLowerCase().includes(keyword) || order.customerTenantPartyId.toLowerCase().includes(keyword);
        })
            .sort((left, right) => left.salesOrderNo.localeCompare(right.salesOrderNo))
            .map((order) => (0, sales_records_1.cloneRecord)(order));
        const { pageItems, total } = (0, sales_assertions_1.paginate)(filtered, input.page ?? 1, input.pageSize ?? 20);
        return {
            items: pageItems,
            total,
            page: input.page ?? 1,
            pageSize: input.pageSize ?? 20
        };
    }
};
exports.InMemorySalesOrderRepository = InMemorySalesOrderRepository;
exports.InMemorySalesOrderRepository = InMemorySalesOrderRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_in_memory_store_1.SalesInMemoryStore])
], InMemorySalesOrderRepository);
//# sourceMappingURL=in-memory-sales-order.repository.js.map