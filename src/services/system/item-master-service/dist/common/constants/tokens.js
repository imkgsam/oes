"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
/** TOKENS centralizes injectable repository and port tokens for item-master-service. */
exports.TOKENS = {
    ITEM_REPOSITORY: Symbol('ITEM_REPOSITORY'),
    ITEM_CATEGORY_REPOSITORY: Symbol('ITEM_CATEGORY_REPOSITORY'),
    ITEM_COMPOSITION_REPOSITORY: Symbol('ITEM_COMPOSITION_REPOSITORY'),
    SUPPLIER_ITEM_MAPPING_REPOSITORY: Symbol('SUPPLIER_ITEM_MAPPING_REPOSITORY'),
    ITEM_MASTER_AUDIT_WRITER: Symbol('ITEM_MASTER_AUDIT_WRITER'),
    ITEM_MASTER_TRANSACTION_RUNNER: Symbol('ITEM_MASTER_TRANSACTION_RUNNER')
};
//# sourceMappingURL=tokens.js.map