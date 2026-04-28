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
exports.InMemorySupplierProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const srm_assertions_1 = require("../../../application/support/srm-assertions");
const srm_records_1 = require("../../../domain/models/srm-records");
const srm_in_memory_store_1 = require("../../store/srm-in-memory-store");
/** InMemorySupplierProfileRepository stores current SRM supplier-profile aggregates inside the process-local store. */
let InMemorySupplierProfileRepository = class InMemorySupplierProfileRepository {
    constructor(store) {
        this.store = store;
    }
    async nextSupplierProfileNo(_tenantId) {
        return this.store.nextSupplierProfileNo();
    }
    async findById(tenantId, supplierId) {
        const profile = this.store.supplierProfiles.get(supplierId);
        if (!profile || profile.tenantId !== tenantId) {
            return null;
        }
        return (0, srm_records_1.cloneRecord)(profile);
    }
    async findByTenantPartyId(tenantId, tenantPartyId) {
        const match = [...this.store.supplierProfiles.values()].find((profile) => profile.tenantId === tenantId &&
            profile.partyBinding?.tenantPartyId === tenantPartyId);
        return match ? (0, srm_records_1.cloneRecord)(match) : null;
    }
    async save(profile) {
        const stored = (0, srm_records_1.cloneRecord)(profile);
        this.store.supplierProfiles.set(stored.id, stored);
        return (0, srm_records_1.cloneRecord)(stored);
    }
    async search(input) {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const filtered = [...this.store.supplierProfiles.values()]
            .filter((profile) => profile.tenantId === input.tenantId)
            .filter((profile) => !input.status || profile.status === input.status)
            .filter((profile) => !input.tenantPartyId || profile.partyBinding?.tenantPartyId === input.tenantPartyId)
            .filter((profile) => matchesKeyword(profile, input.keyword))
            .sort((left, right) => left.supplierNo.localeCompare(right.supplierNo))
            .map((profile) => (0, srm_records_1.cloneRecord)(profile));
        const { pageItems, total } = (0, srm_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
};
exports.InMemorySupplierProfileRepository = InMemorySupplierProfileRepository;
exports.InMemorySupplierProfileRepository = InMemorySupplierProfileRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [srm_in_memory_store_1.SrmInMemoryStore])
], InMemorySupplierProfileRepository);
/** matchesKeyword applies the frozen phase 1 supplier-number, display-name, and binding-summary search rule. */
function matchesKeyword(profile, keyword) {
    if (!keyword) {
        return true;
    }
    const normalized = keyword.toLowerCase();
    return (profile.supplierNo.toLowerCase().includes(normalized) ||
        profile.displayName.toLowerCase().includes(normalized) ||
        profile.partyBinding?.partyDisplayName?.toLowerCase().includes(normalized) === true);
}
//# sourceMappingURL=in-memory-supplier-profile.repository.js.map