"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
/** TOKENS centralizes injectable repository and infrastructure tokens for sales-service phase 1. */
exports.TOKENS = {
    QUOTE_REPOSITORY: Symbol('SALES_QUOTE_REPOSITORY'),
    QUOTE_VERSION_REPOSITORY: Symbol('SALES_QUOTE_VERSION_REPOSITORY'),
    SALES_ORDER_REPOSITORY: Symbol('SALES_SALES_ORDER_REPOSITORY'),
    PRICE_LIST_REPOSITORY: Symbol('SALES_PRICE_LIST_REPOSITORY'),
    CUSTOMER_PRICE_AGREEMENT_REPOSITORY: Symbol('SALES_CUSTOMER_PRICE_AGREEMENT_REPOSITORY'),
    SALES_EXCHANGE_RATE_RESOLVER: Symbol('SALES_EXCHANGE_RATE_RESOLVER'),
    SALES_AUDIT_WRITER: Symbol('SALES_AUDIT_WRITER'),
    SALES_TRANSACTION_RUNNER: Symbol('SALES_TRANSACTION_RUNNER')
};
//# sourceMappingURL=tokens.js.map