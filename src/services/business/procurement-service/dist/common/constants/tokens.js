"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
/** TOKENS centralizes the DI tokens used across the procurement-service runtime graph. */
exports.TOKENS = {
    PURCHASE_REQUEST_REPOSITORY: Symbol('PURCHASE_REQUEST_REPOSITORY'),
    PURCHASE_ORDER_REPOSITORY: Symbol('PURCHASE_ORDER_REPOSITORY'),
    RECEIVING_REPOSITORY: Symbol('RECEIVING_REPOSITORY'),
    ITEM_REFERENCE_LOOKUP_PORT: Symbol('ITEM_REFERENCE_LOOKUP_PORT'),
    SUPPLIER_REFERENCE_LOOKUP_PORT: Symbol('SUPPLIER_REFERENCE_LOOKUP_PORT'),
    PROCUREMENT_AUDIT_WRITER: Symbol('PROCUREMENT_AUDIT_WRITER'),
    PROCUREMENT_TRANSACTION_RUNNER: Symbol('PROCUREMENT_TRANSACTION_RUNNER')
};
//# sourceMappingURL=tokens.js.map