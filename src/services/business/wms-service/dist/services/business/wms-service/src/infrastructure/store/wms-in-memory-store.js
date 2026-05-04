"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WmsInMemoryStore = void 0;
/** WmsInMemoryStore holds the isolated aggregate maps used by the L1 in-memory repositories. */
class WmsInMemoryStore {
    warehouses = new Map();
    locations = new Map();
    receipts = new Map();
    stockLedgerEntries = new Map();
    inventoryBalances = new Map();
    nextReceiptNo = 1;
}
exports.WmsInMemoryStore = WmsInMemoryStore;
//# sourceMappingURL=wms-in-memory-store.js.map