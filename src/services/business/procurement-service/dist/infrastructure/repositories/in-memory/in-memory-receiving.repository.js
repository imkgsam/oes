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
exports.InMemoryReceivingRepository = void 0;
const common_1 = require("@nestjs/common");
const procurement_assertions_1 = require("../../../application/support/procurement-assertions");
const procurement_records_1 = require("../../../domain/models/procurement-records");
const procurement_in_memory_store_1 = require("../../store/procurement-in-memory-store");
/** InMemoryReceivingRepository stores procurement expectation and discrepancy summaries in-process for behavior tests. */
let InMemoryReceivingRepository = class InMemoryReceivingRepository {
    constructor(store) {
        this.store = store;
    }
    async nextExpectationNo(_tenantId) {
        return this.store.nextReceivingExpectationNo();
    }
    async findById(tenantId, receivingExpectationId) {
        const record = this.store.receivingExpectations.get(receivingExpectationId);
        if (!record || record.tenantId !== tenantId) {
            return null;
        }
        return (0, procurement_records_1.cloneRecord)(record);
    }
    async listByPurchaseOrderLineId(tenantId, purchaseOrderLineId) {
        return [...this.store.receivingExpectations.values()]
            .filter((candidate) => candidate.tenantId === tenantId && candidate.purchaseOrderLineId === purchaseOrderLineId)
            .map((record) => (0, procurement_records_1.cloneRecord)(record));
    }
    async save(record) {
        const stored = (0, procurement_records_1.cloneRecord)(record);
        this.store.receivingExpectations.set(stored.receivingExpectationId, stored);
        return (0, procurement_records_1.cloneRecord)(stored);
    }
    async search(input) {
        const { page, pageSize } = (0, procurement_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const filtered = [...this.store.receivingExpectations.values()]
            .filter((record) => record.tenantId === input.tenantId)
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.purchaseOrderId || record.purchaseOrderId === input.purchaseOrderId)
            .filter((record) => !input.supplierId || record.supplierId === input.supplierId)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => !input.targetWarehouseId || record.targetWarehouseId === input.targetWarehouseId)
            .filter((record) => !input.targetReceivingAddressId || record.targetReceivingAddressId === input.targetReceivingAddressId)
            .filter((record) => {
            if (input.hasOpenDiscrepancy === undefined) {
                return true;
            }
            const hasOpen = record.discrepancy?.status === 'OPEN';
            return input.hasOpenDiscrepancy ? hasOpen : !hasOpen;
        })
            .filter((record) => {
            if (!input.expectedReceiptDateFrom && !input.expectedReceiptDateTo) {
                return true;
            }
            const expectedDate = record.expectedReceiptDate;
            if (!expectedDate) {
                return false;
            }
            if (input.expectedReceiptDateFrom && expectedDate < input.expectedReceiptDateFrom) {
                return false;
            }
            if (input.expectedReceiptDateTo && expectedDate > input.expectedReceiptDateTo) {
                return false;
            }
            return true;
        })
            .sort((left, right) => left.receivingExpectationId.localeCompare(right.receivingExpectationId))
            .map((record) => (0, procurement_records_1.cloneRecord)(record));
        const { pageItems, total } = (0, procurement_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async existsByPurchaseOrderId(tenantId, purchaseOrderId) {
        return [...this.store.receivingExpectations.values()].some((record) => record.tenantId === tenantId && record.purchaseOrderId === purchaseOrderId);
    }
};
exports.InMemoryReceivingRepository = InMemoryReceivingRepository;
exports.InMemoryReceivingRepository = InMemoryReceivingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [procurement_in_memory_store_1.ProcurementInMemoryStore])
], InMemoryReceivingRepository);
//# sourceMappingURL=in-memory-receiving.repository.js.map