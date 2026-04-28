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
exports.InMemoryCustomerAccountRepository = void 0;
const common_1 = require("@nestjs/common");
const crm_assertions_1 = require("../../../application/support/crm-assertions");
const crm_records_1 = require("../../../domain/models/crm-records");
const crm_in_memory_store_1 = require("../../store/crm-in-memory-store");
/** InMemoryCustomerAccountRepository stores current CRM customer-account aggregates inside the process-local store. */
let InMemoryCustomerAccountRepository = class InMemoryCustomerAccountRepository {
    constructor(store) {
        this.store = store;
    }
    async nextCustomerAccountNo(_tenantId) {
        return this.store.nextCustomerAccountNo();
    }
    async findById(tenantId, customerAccountId) {
        const account = this.store.customerAccounts.get(customerAccountId);
        if (!account || account.tenantId !== tenantId) {
            return null;
        }
        return (0, crm_records_1.cloneRecord)(account);
    }
    async findActiveByTenantPartyId(tenantId, tenantPartyId) {
        const match = [...this.store.customerAccounts.values()].find((account) => account.tenantId === tenantId &&
            account.status === crm_records_1.CustomerStatus.ACTIVE_CUSTOMER &&
            account.primaryBinding?.tenantPartyId === tenantPartyId);
        return match ? (0, crm_records_1.cloneRecord)(match) : null;
    }
    async save(account) {
        const stored = (0, crm_records_1.cloneRecord)(account);
        this.store.customerAccounts.set(stored.id, stored);
        return (0, crm_records_1.cloneRecord)(stored);
    }
    async search(input) {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const filtered = [...this.store.customerAccounts.values()]
            .filter((account) => account.tenantId === input.tenantId)
            .filter((account) => !input.status || account.status === input.status)
            .filter((account) => !input.primaryTenantPartyId || account.primaryBinding?.tenantPartyId === input.primaryTenantPartyId)
            .filter((account) => matchesKeyword(account, input.keyword))
            .sort((left, right) => left.customerAccountNo.localeCompare(right.customerAccountNo))
            .map((account) => (0, crm_records_1.cloneRecord)(account));
        const { pageItems, total } = (0, crm_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: pageItems,
            total,
            page,
            pageSize
        };
    }
    async searchSelectable(input) {
        const page = input.page ?? 1;
        const pageSize = input.pageSize ?? 20;
        const filtered = [...this.store.customerAccounts.values()]
            .filter((account) => account.tenantId === input.tenantId)
            .filter((account) => account.status === crm_records_1.CustomerStatus.ACTIVE_CUSTOMER)
            .filter((account) => Boolean(account.primaryBinding))
            .filter((account) => matchesKeyword(account, input.keyword))
            .sort((left, right) => left.customerAccountNo.localeCompare(right.customerAccountNo))
            .map((account) => ({
            customerAccountId: account.id,
            customerAccountNo: account.customerAccountNo,
            displayName: account.displayName,
            status: account.status,
            primaryTenantPartyId: account.primaryBinding.tenantPartyId,
            primaryPartyDisplayName: account.primaryBinding?.partyDisplayName ?? null
        }));
        const { pageItems, total } = (0, crm_assertions_1.paginate)(filtered, page, pageSize);
        return {
            items: (0, crm_records_1.cloneRecord)(pageItems),
            total,
            page,
            pageSize
        };
    }
};
exports.InMemoryCustomerAccountRepository = InMemoryCustomerAccountRepository;
exports.InMemoryCustomerAccountRepository = InMemoryCustomerAccountRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [crm_in_memory_store_1.CrmInMemoryStore])
], InMemoryCustomerAccountRepository);
/** matchesKeyword applies the frozen phase 1 account-number, display-name, and primary-binding summary search rule. */
function matchesKeyword(account, keyword) {
    if (!keyword) {
        return true;
    }
    const normalized = keyword.toLowerCase();
    return (account.customerAccountNo.toLowerCase().includes(normalized) ||
        account.displayName.toLowerCase().includes(normalized) ||
        account.primaryBinding?.partyDisplayName?.toLowerCase().includes(normalized) === true);
}
//# sourceMappingURL=in-memory-customer-account.repository.js.map