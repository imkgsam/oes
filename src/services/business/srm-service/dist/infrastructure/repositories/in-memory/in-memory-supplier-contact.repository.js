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
exports.InMemorySupplierContactRepository = void 0;
const common_1 = require("@nestjs/common");
const srm_records_1 = require("../../../domain/models/srm-records");
const srm_in_memory_store_1 = require("../../store/srm-in-memory-store");
/** InMemorySupplierContactRepository stores SRM business-contact records inside the process-local runtime store. */
let InMemorySupplierContactRepository = class InMemorySupplierContactRepository {
    constructor(store) {
        this.store = store;
    }
    async findById(tenantId, supplierId, supplierContactId) {
        const contact = this.store.supplierContacts.get(supplierContactId);
        if (!contact || contact.tenantId !== tenantId || contact.supplierId !== supplierId) {
            return null;
        }
        return (0, srm_records_1.cloneRecord)(contact);
    }
    async save(contact) {
        const stored = (0, srm_records_1.cloneRecord)(contact);
        this.store.supplierContacts.set(stored.supplierContactId, stored);
        return (0, srm_records_1.cloneRecord)(stored);
    }
    async listBySupplierProfileId(tenantId, supplierId) {
        return [...this.store.supplierContacts.values()]
            .filter((contact) => contact.tenantId === tenantId && contact.supplierId === supplierId)
            .sort((left, right) => left.displayName.localeCompare(right.displayName))
            .map((contact) => (0, srm_records_1.cloneRecord)(contact));
    }
};
exports.InMemorySupplierContactRepository = InMemorySupplierContactRepository;
exports.InMemorySupplierContactRepository = InMemorySupplierContactRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [srm_in_memory_store_1.SrmInMemoryStore])
], InMemorySupplierContactRepository);
//# sourceMappingURL=in-memory-supplier-contact.repository.js.map