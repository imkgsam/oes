"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
/** TOKENS centralizes the DI tokens used across the srm-service runtime graph. */
exports.TOKENS = {
    SUPPLIER_PROFILE_REPOSITORY: Symbol('SUPPLIER_PROFILE_REPOSITORY'),
    SUPPLIER_CONTACT_REPOSITORY: Symbol('SUPPLIER_CONTACT_REPOSITORY'),
    SUPPLIER_ADDRESS_REPOSITORY: Symbol('SUPPLIER_ADDRESS_REPOSITORY'),
    SUPPLIER_OFFERING_REPOSITORY: Symbol('SUPPLIER_OFFERING_REPOSITORY'),
    SRM_AUDIT_WRITER: Symbol('SRM_AUDIT_WRITER'),
    SRM_TRANSACTION_RUNNER: Symbol('SRM_TRANSACTION_RUNNER'),
    TENANT_PARTY_LOOKUP_PORT: Symbol('TENANT_PARTY_LOOKUP_PORT'),
    ITEM_LOOKUP_PORT: Symbol('ITEM_LOOKUP_PORT')
};
//# sourceMappingURL=tokens.js.map