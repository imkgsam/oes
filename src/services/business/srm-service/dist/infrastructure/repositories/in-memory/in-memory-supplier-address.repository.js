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
exports.InMemorySupplierAddressRepository = void 0;
const common_1 = require("@nestjs/common");
const srm_records_1 = require("../../../domain/models/srm-records");
const srm_in_memory_store_1 = require("../../store/srm-in-memory-store");
/** InMemorySupplierAddressRepository stores SRM business-address records inside the process-local runtime store. */
let InMemorySupplierAddressRepository = class InMemorySupplierAddressRepository {
    constructor(store) {
        this.store = store;
    }
    async findById(tenantId, supplierId, supplierAddressId) {
        const address = this.store.supplierAddresses.get(supplierAddressId);
        if (!address || address.tenantId !== tenantId || address.supplierId !== supplierId) {
            return null;
        }
        return (0, srm_records_1.cloneRecord)(address);
    }
    async save(address) {
        const stored = (0, srm_records_1.cloneRecord)(address);
        this.store.supplierAddresses.set(stored.supplierAddressId, stored);
        return (0, srm_records_1.cloneRecord)(stored);
    }
    async listBySupplierProfileId(tenantId, supplierId) {
        return [...this.store.supplierAddresses.values()]
            .filter((address) => address.tenantId === tenantId && address.supplierId === supplierId)
            .sort((left, right) => left.label.localeCompare(right.label))
            .map((address) => (0, srm_records_1.cloneRecord)(address));
    }
};
exports.InMemorySupplierAddressRepository = InMemorySupplierAddressRepository;
exports.InMemorySupplierAddressRepository = InMemorySupplierAddressRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [srm_in_memory_store_1.SrmInMemoryStore])
], InMemorySupplierAddressRepository);
//# sourceMappingURL=in-memory-supplier-address.repository.js.map