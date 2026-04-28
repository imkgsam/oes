"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SALES_INTERNAL = exports.SALES_FAILED_PRECONDITION = exports.SALES_ALREADY_EXISTS = exports.SALES_NOT_FOUND = exports.SALES_PERMISSION_DENIED = exports.SALES_UNAUTHENTICATED = exports.SALES_INVALID_ARGUMENT = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
/** SALES_INVALID_ARGUMENT reports request shapes that violate the frozen sales phase 1 contract. */
exports.SALES_INVALID_ARGUMENT = {
    code: 'SALES_001',
    message: 'Sales request is invalid',
    messageKey: 'sales.invalid_argument',
    rpcStatus: grpc_js_1.status.INVALID_ARGUMENT
};
/** SALES_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
exports.SALES_UNAUTHENTICATED = {
    code: 'SALES_002',
    message: 'Sales authentication context is missing or invalid',
    messageKey: 'sales.unauthenticated',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
/** SALES_PERMISSION_DENIED reports caller contexts that are present but not allowed to continue. */
exports.SALES_PERMISSION_DENIED = {
    code: 'SALES_003',
    message: 'Sales permission is denied',
    messageKey: 'sales.permission_denied',
    rpcStatus: grpc_js_1.status.PERMISSION_DENIED
};
/** SALES_NOT_FOUND reports missing quote, quote version, or sales order resources. */
exports.SALES_NOT_FOUND = {
    code: 'SALES_004',
    message: 'Sales resource was not found',
    messageKey: 'sales.not_found',
    rpcStatus: grpc_js_1.status.NOT_FOUND
};
/** SALES_ALREADY_EXISTS reports one-to-one conflicts such as repeated conversion from the same quote version. */
exports.SALES_ALREADY_EXISTS = {
    code: 'SALES_005',
    message: 'Sales resource already exists',
    messageKey: 'sales.already_exists',
    rpcStatus: grpc_js_1.status.ALREADY_EXISTS
};
/** SALES_FAILED_PRECONDITION reports valid requests that violate frozen quote, order, or handoff invariants. */
exports.SALES_FAILED_PRECONDITION = {
    code: 'SALES_006',
    message: 'Sales precondition failed',
    messageKey: 'sales.failed_precondition',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
/** SALES_INTERNAL reports uncategorized internal failures inside the sales runtime skeleton. */
exports.SALES_INTERNAL = {
    code: 'SALES_007',
    message: 'Sales internal error',
    messageKey: 'sales.internal',
    rpcStatus: grpc_js_1.status.INTERNAL
};
//# sourceMappingURL=sales.errors.js.map