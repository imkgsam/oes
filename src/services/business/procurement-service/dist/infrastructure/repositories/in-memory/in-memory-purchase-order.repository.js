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
exports.InMemoryPurchaseOrderRepository = void 0;
const common_1 = require("@nestjs/common");
const procurement_assertions_1 = require("../../../application/support/procurement-assertions");
const procurement_records_1 = require("../../../domain/models/procurement-records");
const procurement_in_memory_store_1 = require("../../store/procurement-in-memory-store");
/** InMemoryPurchaseOrderRepository stores PO aggregates and applied changes in-process for behavior tests. */
let InMemoryPurchaseOrderRepository = class InMemoryPurchaseOrderRepository {
    constructor(store) {
        this.store = store;
    }
    async nextOrderNo(_tenantId) {
        return this.store.nextPurchaseOrderNo();
    }
    async findById(tenantId, purchaseOrderId) {
        const record = this.store.purchaseOrders.get(purchaseOrderId);
        if (!record || record.tenantId !== tenantId) {
            return null;
        }
        return (0, procurement_records_1.cloneRecord)(record);
    }
    async save(record) {
        const stored = (0, procurement_records_1.cloneRecord)(record);
        this.store.purchaseOrders.set(stored.purchaseOrderId, stored);
        return (0, procurement_records_1.cloneRecord)(stored);
    }
    async search(input) {
        const { page, pageSize } = (0, procurement_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const filtered = [...this.store.purchaseOrders.values()]
            .filter((record) => record.tenantId === input.tenantId)
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => !input.supplierId || record.supplierId === input.supplierId)
            .filter((record) => !input.itemId || record.lines.some((line) => line.itemId === input.itemId))
            .filter((record) => !input.requestNo || record.sourcePurchaseRequestIds.includes(input.requestNo) || record.sourcePurchaseRequestIds.some((id) => id.includes(input.requestNo)))
            .filter((record) => {
            if (!input.issuedFrom && !input.issuedTo) {
                return true;
            }
            const issuedAt = record.issuedAt;
            if (!issuedAt) {
                return false;
            }
            if (input.issuedFrom && issuedAt < input.issuedFrom) {
                return false;
            }
            if (input.issuedTo && issuedAt > input.issuedTo) {
                return false;
            }
            return true;
        })
            .filter((record) => {
            if (!input.keyword) {
                return true;
            }
            const keyword = input.keyword.toLowerCase();
            return (record.orderNo.toLowerCase().includes(keyword) ||
                record.supplierSnapshot.supplierDisplayName.toLowerCase().includes(keyword) ||
                record.sourcePurchaseRequestIds.some((id) => id.toLowerCase().includes(keyword)));
        })
            .sort((left, right) => left.orderNo.localeCompare(right.orderNo))
            .map((record) => (0, procurement_records_1.cloneRecord)(record));
        const { pageItems, total } = (0, procurement_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async listChanges(input) {
        const { page, pageSize } = (0, procurement_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const record = this.store.purchaseOrders.get(input.purchaseOrderId);
        if (!record || record.tenantId !== input.tenantId) {
            return {
                items: [],
                total: 0,
                page,
                pageSize
            };
        }
        const changes = record.changes.map((change) => (0, procurement_records_1.cloneRecord)(change));
        const { pageItems, total } = (0, procurement_assertions_1.paginate)(changes, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async existsBySourcePurchaseRequestId(tenantId, purchaseRequestId) {
        return [...this.store.purchaseOrders.values()].some((record) => record.tenantId === tenantId && record.sourcePurchaseRequestIds.includes(purchaseRequestId));
    }
    async findBySourcePurchaseRequestId(tenantId, purchaseRequestId) {
        return [...this.store.purchaseOrders.values()]
            .filter((record) => record.tenantId === tenantId && record.sourcePurchaseRequestIds.includes(purchaseRequestId))
            .map((record) => (0, procurement_records_1.cloneRecord)(record));
    }
};
exports.InMemoryPurchaseOrderRepository = InMemoryPurchaseOrderRepository;
exports.InMemoryPurchaseOrderRepository = InMemoryPurchaseOrderRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [procurement_in_memory_store_1.ProcurementInMemoryStore])
], InMemoryPurchaseOrderRepository);
//# sourceMappingURL=in-memory-purchase-order.repository.js.map