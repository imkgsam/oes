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
exports.InMemorySupplierOfferingRepository = void 0;
const common_1 = require("@nestjs/common");
const srm_assertions_1 = require("../../../application/support/srm-assertions");
const srm_records_1 = require("../../../domain/models/srm-records");
const srm_in_memory_store_1 = require("../../store/srm-in-memory-store");
/** InMemorySupplierOfferingRepository stores current supplyability facts inside the process-local SRM store. */
let InMemorySupplierOfferingRepository = class InMemorySupplierOfferingRepository {
    constructor(store) {
        this.store = store;
    }
    async findById(tenantId, supplierOfferingId) {
        const offering = this.store.supplierOfferings.get(supplierOfferingId);
        if (!offering || offering.tenantId !== tenantId) {
            return null;
        }
        return (0, srm_records_1.cloneRecord)(offering);
    }
    async findBySupplierAndItem(tenantId, supplierId, itemId) {
        const offering = [...this.store.supplierOfferings.values()].find((candidate) => candidate.tenantId === tenantId &&
            candidate.supplierId === supplierId &&
            candidate.itemId === itemId);
        return offering ? (0, srm_records_1.cloneRecord)(offering) : null;
    }
    async save(offering) {
        const stored = (0, srm_records_1.cloneRecord)(offering);
        this.store.supplierOfferings.set(stored.supplierOfferingId, stored);
        return (0, srm_records_1.cloneRecord)(stored);
    }
    async listBySupplierId(tenantId, supplierId, status, page = 1, pageSize = 20) {
        const filtered = [...this.store.supplierOfferings.values()]
            .filter((offering) => offering.tenantId === tenantId && offering.supplierId === supplierId)
            .filter((offering) => !status || offering.status === status)
            .sort((left, right) => left.itemId.localeCompare(right.itemId))
            .map((offering) => (0, srm_records_1.cloneRecord)(offering));
        const { pageItems, total } = (0, srm_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async listByItemId(tenantId, itemId, status, page = 1, pageSize = 20) {
        const filtered = [...this.store.supplierOfferings.values()]
            .filter((offering) => offering.tenantId === tenantId && offering.itemId === itemId)
            .filter((offering) => !status || offering.status === status)
            .sort((left, right) => left.supplierId.localeCompare(right.supplierId))
            .map((offering) => (0, srm_records_1.cloneRecord)(offering));
        const { pageItems, total } = (0, srm_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async hasActiveBySupplierId(tenantId, supplierId) {
        return [...this.store.supplierOfferings.values()].some((offering) => offering.tenantId === tenantId &&
            offering.supplierId === supplierId &&
            offering.status === srm_records_1.SupplierOfferingStatus.ACTIVE);
    }
};
exports.InMemorySupplierOfferingRepository = InMemorySupplierOfferingRepository;
exports.InMemorySupplierOfferingRepository = InMemorySupplierOfferingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [srm_in_memory_store_1.SrmInMemoryStore])
], InMemorySupplierOfferingRepository);
//# sourceMappingURL=in-memory-supplier-offering.repository.js.map