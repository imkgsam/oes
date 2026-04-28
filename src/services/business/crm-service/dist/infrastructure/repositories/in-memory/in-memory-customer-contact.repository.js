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
exports.InMemoryCustomerContactRepository = void 0;
const common_1 = require("@nestjs/common");
const crm_records_1 = require("../../../domain/models/crm-records");
const crm_in_memory_store_1 = require("../../store/crm-in-memory-store");
/** InMemoryCustomerContactRepository stores CRM business-contact records inside the process-local runtime store. */
let InMemoryCustomerContactRepository = class InMemoryCustomerContactRepository {
    constructor(store) {
        this.store = store;
    }
    async findById(tenantId, customerAccountId, customerContactId) {
        const contact = this.store.customerContacts.get(customerContactId);
        if (!contact || contact.tenantId !== tenantId || contact.customerAccountId !== customerAccountId) {
            return null;
        }
        return (0, crm_records_1.cloneRecord)(contact);
    }
    async save(contact) {
        const stored = (0, crm_records_1.cloneRecord)(contact);
        this.store.customerContacts.set(stored.customerContactId, stored);
        return (0, crm_records_1.cloneRecord)(stored);
    }
    async listByCustomerAccountId(tenantId, customerAccountId) {
        return [...this.store.customerContacts.values()]
            .filter((contact) => contact.tenantId === tenantId && contact.customerAccountId === customerAccountId)
            .sort((left, right) => left.displayName.localeCompare(right.displayName))
            .map((contact) => (0, crm_records_1.cloneRecord)(contact));
    }
};
exports.InMemoryCustomerContactRepository = InMemoryCustomerContactRepository;
exports.InMemoryCustomerContactRepository = InMemoryCustomerContactRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_in_memory_store_1.CrmInMemoryStore])
], InMemoryCustomerContactRepository);
//# sourceMappingURL=in-memory-customer-contact.repository.js.map