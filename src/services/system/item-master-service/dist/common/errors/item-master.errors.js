"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITEM_MASTER_INTERNAL = exports.ITEM_MASTER_UNAVAILABLE = exports.ITEM_MASTER_FAILED_PRECONDITION = exports.ITEM_MASTER_ALREADY_EXISTS = exports.ITEM_MASTER_NOT_FOUND = exports.ITEM_MASTER_PERMISSION_DENIED = exports.ITEM_MASTER_UNAUTHENTICATED = exports.ITEM_MASTER_INVALID_ARGUMENT = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
/** ITEM_MASTER_INVALID_ARGUMENT reports request shapes that violate the frozen phase 1 contract. */
exports.ITEM_MASTER_INVALID_ARGUMENT = {
    code: 'ITEM_MASTER_001',
    message: 'Item master request is invalid',
    messageKey: 'item_master.invalid_argument',
    rpcStatus: grpc_js_1.status.INVALID_ARGUMENT
};
/** ITEM_MASTER_UNAUTHENTICATED reports missing or invalid internal/operator authentication context. */
exports.ITEM_MASTER_UNAUTHENTICATED = {
    code: 'ITEM_MASTER_002',
    message: 'Item master authentication context is missing or invalid',
    messageKey: 'item_master.unauthenticated',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
/** ITEM_MASTER_PERMISSION_DENIED reports caller contexts that are authenticated but not allowed to proceed. */
exports.ITEM_MASTER_PERMISSION_DENIED = {
    code: 'ITEM_MASTER_003',
    message: 'Item master permission is denied',
    messageKey: 'item_master.permission_denied',
    rpcStatus: grpc_js_1.status.PERMISSION_DENIED
};
/** ITEM_MASTER_NOT_FOUND reports missing item-master resources. */
exports.ITEM_MASTER_NOT_FOUND = {
    code: 'ITEM_MASTER_004',
    message: 'Item master resource was not found',
    messageKey: 'item_master.not_found',
    rpcStatus: grpc_js_1.status.NOT_FOUND
};
/** ITEM_MASTER_ALREADY_EXISTS reports uniqueness conflicts inside the tenant-scoped item catalog. */
exports.ITEM_MASTER_ALREADY_EXISTS = {
    code: 'ITEM_MASTER_005',
    message: 'Item master resource already exists',
    messageKey: 'item_master.already_exists',
    rpcStatus: grpc_js_1.status.ALREADY_EXISTS
};
/** ITEM_MASTER_FAILED_PRECONDITION reports valid requests that violate frozen phase 1 invariants. */
exports.ITEM_MASTER_FAILED_PRECONDITION = {
    code: 'ITEM_MASTER_006',
    message: 'Item master precondition failed',
    messageKey: 'item_master.failed_precondition',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
/** ITEM_MASTER_UNAVAILABLE reports infrastructure dependencies that are temporarily unavailable. */
exports.ITEM_MASTER_UNAVAILABLE = {
    code: 'ITEM_MASTER_007',
    message: 'Item master dependency is unavailable',
    messageKey: 'item_master.unavailable',
    rpcStatus: grpc_js_1.status.UNAVAILABLE
};
/** ITEM_MASTER_INTERNAL reports uncategorized internal failures. */
exports.ITEM_MASTER_INTERNAL = {
    code: 'ITEM_MASTER_008',
    message: 'Item master internal error',
    messageKey: 'item_master.internal',
    rpcStatus: grpc_js_1.status.INTERNAL
};
//# sourceMappingURL=item-master.errors.js.map