"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SrmInMemoryStore = void 0;
/** SrmInMemoryStore keeps the phase 1 SRM state local to one runtime process for command and query wiring. */
class SrmInMemoryStore {
    constructor() {
        this.supplierProfiles = new Map();
        this.supplierContacts = new Map();
        this.supplierAddresses = new Map();
        this.supplierOfferings = new Map();
        this.auditEnvelopes = [];
        this.supplierProfileSequence = 1;
    }
    /** nextSupplierProfileNo reserves the next globally unique SRM account number summary for runtime usage. */
    nextSupplierProfileNo() {
        const value = this.supplierProfileSequence++;
        return `CA-${String(value).padStart(4, '0')}`;
    }
}
exports.SrmInMemoryStore = SrmInMemoryStore;
//# sourceMappingURL=srm-in-memory-store.js.map