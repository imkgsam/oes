"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SRM_INTERNAL = exports.SRM_FAILED_PRECONDITION = exports.SRM_ALREADY_EXISTS = exports.SRM_NOT_FOUND = exports.SRM_UNAUTHENTICATED = exports.SRM_INVALID_ARGUMENT = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
/** SRM_INVALID_ARGUMENT reports request shapes that violate the frozen SRM phase 1 contract. */
exports.SRM_INVALID_ARGUMENT = {
    code: 'SRM_001',
    message: 'SRM request is invalid',
    messageKey: 'srm.invalid_argument',
    rpcStatus: grpc_js_1.status.INVALID_ARGUMENT
};
/** SRM_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
exports.SRM_UNAUTHENTICATED = {
    code: 'SRM_002',
    message: 'SRM authentication context is missing or invalid',
    messageKey: 'srm.unauthenticated',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
/** SRM_NOT_FOUND reports missing supplier-profile, contact, address, or tenant-party resources. */
exports.SRM_NOT_FOUND = {
    code: 'SRM_003',
    message: 'SRM resource was not found',
    messageKey: 'srm.not_found',
    rpcStatus: grpc_js_1.status.NOT_FOUND
};
/** SRM_ALREADY_EXISTS reports duplicate supplier bindings or supplier numbers that violate phase 1 uniqueness. */
exports.SRM_ALREADY_EXISTS = {
    code: 'SRM_004',
    message: 'SRM resource already exists',
    messageKey: 'srm.already_exists',
    rpcStatus: grpc_js_1.status.ALREADY_EXISTS
};
/** SRM_FAILED_PRECONDITION reports valid requests that violate frozen supplier-master invariants. */
exports.SRM_FAILED_PRECONDITION = {
    code: 'SRM_005',
    message: 'SRM precondition failed',
    messageKey: 'srm.failed_precondition',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
/** SRM_INTERNAL reports uncategorized internal failures inside the srm-service runtime. */
exports.SRM_INTERNAL = {
    code: 'SRM_006',
    message: 'SRM internal error',
    messageKey: 'srm.internal',
    rpcStatus: grpc_js_1.status.INTERNAL
};
//# sourceMappingURL=srm.errors.js.map