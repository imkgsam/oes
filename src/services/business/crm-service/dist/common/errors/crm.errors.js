"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRM_INTERNAL = exports.CRM_FAILED_PRECONDITION = exports.CRM_ALREADY_EXISTS = exports.CRM_NOT_FOUND = exports.CRM_UNAUTHENTICATED = exports.CRM_INVALID_ARGUMENT = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
/** CRM_INVALID_ARGUMENT reports request shapes that violate the frozen CRM phase 1 contract. */
exports.CRM_INVALID_ARGUMENT = {
    code: 'CRM_001',
    message: 'CRM request is invalid',
    messageKey: 'crm.invalid_argument',
    rpcStatus: grpc_js_1.status.INVALID_ARGUMENT
};
/** CRM_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
exports.CRM_UNAUTHENTICATED = {
    code: 'CRM_002',
    message: 'CRM authentication context is missing or invalid',
    messageKey: 'crm.unauthenticated',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
/** CRM_NOT_FOUND reports missing customer-account, contact, address, or tenant-party resources. */
exports.CRM_NOT_FOUND = {
    code: 'CRM_003',
    message: 'CRM resource was not found',
    messageKey: 'crm.not_found',
    rpcStatus: grpc_js_1.status.NOT_FOUND
};
/** CRM_ALREADY_EXISTS reports one-to-one binding conflicts for active customer accounts. */
exports.CRM_ALREADY_EXISTS = {
    code: 'CRM_004',
    message: 'CRM resource already exists',
    messageKey: 'crm.already_exists',
    rpcStatus: grpc_js_1.status.ALREADY_EXISTS
};
/** CRM_FAILED_PRECONDITION reports valid requests that violate frozen customer-master invariants. */
exports.CRM_FAILED_PRECONDITION = {
    code: 'CRM_005',
    message: 'CRM precondition failed',
    messageKey: 'crm.failed_precondition',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
/** CRM_INTERNAL reports uncategorized internal failures inside the crm-service runtime. */
exports.CRM_INTERNAL = {
    code: 'CRM_006',
    message: 'CRM internal error',
    messageKey: 'crm.internal',
    rpcStatus: grpc_js_1.status.INTERNAL
};
//# sourceMappingURL=crm.errors.js.map