"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
/** TOKENS centralizes the DI tokens used across the wms-service runtime graph. */
exports.TOKENS = {
    WAREHOUSE_REPOSITORY: Symbol('WAREHOUSE_REPOSITORY'),
    RECEIPT_REPOSITORY: Symbol('RECEIPT_REPOSITORY'),
    INVENTORY_REPOSITORY: Symbol('INVENTORY_REPOSITORY'),
    STOCKABLE_ITEM_LOOKUP_PORT: Symbol('STOCKABLE_ITEM_LOOKUP_PORT'),
    RECEIVING_EXPECTATION_LOOKUP_PORT: Symbol('RECEIVING_EXPECTATION_LOOKUP_PORT'),
    WMS_AUDIT_WRITER: Symbol('WMS_AUDIT_WRITER'),
    WMS_TRANSACTION_RUNNER: Symbol('WMS_TRANSACTION_RUNNER')
};
//# sourceMappingURL=tokens.js.map