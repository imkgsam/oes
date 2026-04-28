"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmInMemoryStore = void 0;
/** CrmInMemoryStore keeps the phase 1 CRM state local to one runtime process for command and query wiring. */
class CrmInMemoryStore {
    constructor() {
        this.customerAccounts = new Map();
        this.customerContacts = new Map();
        this.customerAddresses = new Map();
        this.auditEnvelopes = [];
        this.customerAccountSequence = 1;
    }
    /** nextCustomerAccountNo reserves the next globally unique CRM account number summary for runtime usage. */
    nextCustomerAccountNo() {
        const value = this.customerAccountSequence++;
        return `CA-${String(value).padStart(4, '0')}`;
    }
}
exports.CrmInMemoryStore = CrmInMemoryStore;
//# sourceMappingURL=crm-in-memory-store.js.map