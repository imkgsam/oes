"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
/** TOKENS centralizes injectable repository and infrastructure tokens for sales-service phase 1. */
exports.TOKENS = {
    QUOTE_REPOSITORY: Symbol('SALES_QUOTE_REPOSITORY'),
    QUOTE_VERSION_REPOSITORY: Symbol('SALES_QUOTE_VERSION_REPOSITORY'),
    SALES_ORDER_REPOSITORY: Symbol('SALES_SALES_ORDER_REPOSITORY'),
    SALES_AUDIT_WRITER: Symbol('SALES_AUDIT_WRITER'),
    SALES_TRANSACTION_RUNNER: Symbol('SALES_TRANSACTION_RUNNER')
};
//# sourceMappingURL=tokens.js.map