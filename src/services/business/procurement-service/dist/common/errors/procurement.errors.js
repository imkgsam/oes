"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROCUREMENT_INTERNAL = exports.PROCUREMENT_FAILED_PRECONDITION = exports.PROCUREMENT_ALREADY_EXISTS = exports.PROCUREMENT_NOT_FOUND = exports.PROCUREMENT_UNAUTHENTICATED = exports.PROCUREMENT_INVALID_ARGUMENT = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
/** PROCUREMENT_INVALID_ARGUMENT reports request shapes that violate the frozen procurement phase 1 contract. */
exports.PROCUREMENT_INVALID_ARGUMENT = {
    code: 'PROCUREMENT_001',
    message: 'Procurement request is invalid',
    messageKey: 'procurement.invalid_argument',
    rpcStatus: grpc_js_1.status.INVALID_ARGUMENT
};
/** PROCUREMENT_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
exports.PROCUREMENT_UNAUTHENTICATED = {
    code: 'PROCUREMENT_002',
    message: 'Procurement authentication context is missing or invalid',
    messageKey: 'procurement.unauthenticated',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
/** PROCUREMENT_NOT_FOUND reports missing purchase request, purchase order, receiving, item, or supplier resources. */
exports.PROCUREMENT_NOT_FOUND = {
    code: 'PROCUREMENT_003',
    message: 'Procurement resource was not found',
    messageKey: 'procurement.not_found',
    rpcStatus: grpc_js_1.status.NOT_FOUND
};
/** PROCUREMENT_ALREADY_EXISTS reports uniqueness conflicts on procurement-owned facts. */
exports.PROCUREMENT_ALREADY_EXISTS = {
    code: 'PROCUREMENT_004',
    message: 'Procurement resource already exists',
    messageKey: 'procurement.already_exists',
    rpcStatus: grpc_js_1.status.ALREADY_EXISTS
};
/** PROCUREMENT_FAILED_PRECONDITION reports valid requests that violate frozen PR PO foundation invariants. */
exports.PROCUREMENT_FAILED_PRECONDITION = {
    code: 'PROCUREMENT_005',
    message: 'Procurement precondition failed',
    messageKey: 'procurement.failed_precondition',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
/** PROCUREMENT_INTERNAL reports uncategorized internal failures inside the procurement-service runtime. */
exports.PROCUREMENT_INTERNAL = {
    code: 'PROCUREMENT_006',
    message: 'Procurement internal error',
    messageKey: 'procurement.internal',
    rpcStatus: grpc_js_1.status.INTERNAL
};
//# sourceMappingURL=procurement.errors.js.map