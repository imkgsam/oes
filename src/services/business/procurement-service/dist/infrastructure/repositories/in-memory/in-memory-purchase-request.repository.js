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
exports.InMemoryPurchaseRequestRepository = void 0;
const common_1 = require("@nestjs/common");
const procurement_assertions_1 = require("../../../application/support/procurement-assertions");
const procurement_records_1 = require("../../../domain/models/procurement-records");
const procurement_in_memory_store_1 = require("../../store/procurement-in-memory-store");
/** InMemoryPurchaseRequestRepository stores PR aggregates in-process for behavior and surface tests. */
let InMemoryPurchaseRequestRepository = class InMemoryPurchaseRequestRepository {
    constructor(store) {
        this.store = store;
    }
    async nextRequestNo(_tenantId) {
        return this.store.nextPurchaseRequestNo();
    }
    async findById(tenantId, purchaseRequestId) {
        const record = this.store.purchaseRequests.get(purchaseRequestId);
        if (!record || record.tenantId !== tenantId) {
            return null;
        }
        return (0, procurement_records_1.cloneRecord)(record);
    }
    async save(record) {
        const stored = (0, procurement_records_1.cloneRecord)(record);
        this.store.purchaseRequests.set(stored.purchaseRequestId, stored);
        return (0, procurement_records_1.cloneRecord)(stored);
    }
    async search(input) {
        const { page, pageSize } = (0, procurement_assertions_1.normalizePageInput)(input.page, input.pageSize);
        const filtered = [...this.store.purchaseRequests.values()]
            .filter((record) => record.tenantId === input.tenantId)
            .filter((record) => !input.orgId || record.orgId === input.orgId)
            .filter((record) => !input.requestType || record.requestType === input.requestType)
            .filter((record) => !input.status || record.status === input.status)
            .filter((record) => !input.requesterOperatorId || record.requester.operatorId === input.requesterOperatorId)
            .filter((record) => !input.itemId || record.lines.some((line) => line.itemId === input.itemId))
            .filter((record) => {
            if (!input.neededByDateFrom && !input.neededByDateTo) {
                return true;
            }
            return record.lines.some((line) => {
                const date = line.neededByDate;
                if (!date) {
                    return false;
                }
                if (input.neededByDateFrom && date < input.neededByDateFrom) {
                    return false;
                }
                if (input.neededByDateTo && date > input.neededByDateTo) {
                    return false;
                }
                return true;
            });
        })
            .filter((record) => {
            if (!input.keyword) {
                return true;
            }
            const keyword = input.keyword.toLowerCase();
            return (record.requestNo.toLowerCase().includes(keyword) ||
                (record.title ?? '').toLowerCase().includes(keyword) ||
                record.requester.displayName.toLowerCase().includes(keyword));
        })
            .sort((left, right) => left.requestNo.localeCompare(right.requestNo))
            .map((record) => (0, procurement_records_1.cloneRecord)(record));
        const { pageItems, total } = (0, procurement_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
};
exports.InMemoryPurchaseRequestRepository = InMemoryPurchaseRequestRepository;
exports.InMemoryPurchaseRequestRepository = InMemoryPurchaseRequestRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [procurement_in_memory_store_1.ProcurementInMemoryStore])
], InMemoryPurchaseRequestRepository);
//# sourceMappingURL=in-memory-purchase-request.repository.js.map