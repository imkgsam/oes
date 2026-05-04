"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WMS_INTERNAL = exports.WMS_UNAVAILABLE = exports.WMS_FAILED_PRECONDITION = exports.WMS_ALREADY_EXISTS = exports.WMS_NOT_FOUND = exports.WMS_PERMISSION_DENIED = exports.WMS_UNAUTHENTICATED = exports.WMS_INVALID_ARGUMENT = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
/** WMS_INVALID_ARGUMENT reports request shapes that violate the frozen WMS phase 1 contract. */
exports.WMS_INVALID_ARGUMENT = {
    code: 'WMS_001',
    message: 'WMS request is invalid',
    messageKey: 'wms.invalid_argument',
    rpcStatus: grpc_js_1.status.INVALID_ARGUMENT
};
/** WMS_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
exports.WMS_UNAUTHENTICATED = {
    code: 'WMS_002',
    message: 'WMS authentication context is missing or invalid',
    messageKey: 'wms.unauthenticated',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
/** WMS_PERMISSION_DENIED reports authenticated calls that are outside the allowed WMS phase 1 scope. */
exports.WMS_PERMISSION_DENIED = {
    code: 'WMS_003',
    message: 'WMS permission denied',
    messageKey: 'wms.permission_denied',
    rpcStatus: grpc_js_1.status.PERMISSION_DENIED
};
/** WMS_NOT_FOUND reports missing WMS-owned records or required downstream references. */
exports.WMS_NOT_FOUND = {
    code: 'WMS_004',
    message: 'WMS resource was not found',
    messageKey: 'wms.not_found',
    rpcStatus: grpc_js_1.status.NOT_FOUND
};
/** WMS_ALREADY_EXISTS reports uniqueness conflicts on WMS-owned facts. */
exports.WMS_ALREADY_EXISTS = {
    code: 'WMS_005',
    message: 'WMS resource already exists',
    messageKey: 'wms.already_exists',
    rpcStatus: grpc_js_1.status.ALREADY_EXISTS
};
/** WMS_FAILED_PRECONDITION reports valid requests that violate frozen WMS state or boundary invariants. */
exports.WMS_FAILED_PRECONDITION = {
    code: 'WMS_006',
    message: 'WMS precondition failed',
    messageKey: 'wms.failed_precondition',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
/** WMS_UNAVAILABLE reports temporarily unreachable downstream or infrastructure dependencies. */
exports.WMS_UNAVAILABLE = {
    code: 'WMS_007',
    message: 'WMS dependency is unavailable',
    messageKey: 'wms.unavailable',
    rpcStatus: grpc_js_1.status.UNAVAILABLE
};
/** WMS_INTERNAL reports uncategorized internal failures inside the wms-service runtime. */
exports.WMS_INTERNAL = {
    code: 'WMS_008',
    message: 'WMS internal error',
    messageKey: 'wms.internal',
    rpcStatus: grpc_js_1.status.INTERNAL
};
//# sourceMappingURL=wms.errors.js.map