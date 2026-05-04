"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WmsInMemoryStore = void 0;
/** WmsInMemoryStore holds the isolated aggregate maps used by the L1 in-memory repositories. */
class WmsInMemoryStore {
    constructor() {
        this.warehouses = new Map();
        this.locations = new Map();
        this.receipts = new Map();
        this.stockLedgerEntries = new Map();
        this.inventoryBalances = new Map();
        this.nextReceiptNo = 1;
    }
}
exports.WmsInMemoryStore = WmsInMemoryStore;
//# sourceMappingURL=wms-in-memory-store.js.map