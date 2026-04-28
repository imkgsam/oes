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
exports.InMemoryCustomerAddressRepository = void 0;
const common_1 = require("@nestjs/common");
const crm_records_1 = require("../../../domain/models/crm-records");
const crm_in_memory_store_1 = require("../../store/crm-in-memory-store");
/** InMemoryCustomerAddressRepository stores CRM business-address records inside the process-local runtime store. */
let InMemoryCustomerAddressRepository = class InMemoryCustomerAddressRepository {
    constructor(store) {
        this.store = store;
    }
    async findById(tenantId, customerAccountId, customerAddressId) {
        const address = this.store.customerAddresses.get(customerAddressId);
        if (!address || address.tenantId !== tenantId || address.customerAccountId !== customerAccountId) {
            return null;
        }
        return (0, crm_records_1.cloneRecord)(address);
    }
    async save(address) {
        const stored = (0, crm_records_1.cloneRecord)(address);
        this.store.customerAddresses.set(stored.customerAddressId, stored);
        return (0, crm_records_1.cloneRecord)(stored);
    }
    async listByCustomerAccountId(tenantId, customerAccountId) {
        return [...this.store.customerAddresses.values()]
            .filter((address) => address.tenantId === tenantId && address.customerAccountId === customerAccountId)
            .sort((left, right) => left.label.localeCompare(right.label))
            .map((address) => (0, crm_records_1.cloneRecord)(address));
    }
};
exports.InMemoryCustomerAddressRepository = InMemoryCustomerAddressRepository;
exports.InMemoryCustomerAddressRepository = InMemoryCustomerAddressRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_in_memory_store_1.CrmInMemoryStore])
], InMemoryCustomerAddressRepository);
//# sourceMappingURL=in-memory-customer-address.repository.js.map