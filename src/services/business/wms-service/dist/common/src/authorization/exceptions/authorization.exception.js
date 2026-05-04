"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_DEPENDENCY_UNAVAILABLE = exports.OPERATOR_CONTEXT_INVALID = exports.OPERATOR_CONTEXT_MISSING = exports.INTERNAL_SERVICE_NOT_ALLOWED = exports.INTERNAL_SERVICE_METADATA_MISSING = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
exports.INTERNAL_SERVICE_METADATA_MISSING = {
    code: 'APP_SECURITY_001',
    message: 'Internal service metadata is missing',
    messageKey: 'app.security.internal_service_metadata_missing',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
exports.INTERNAL_SERVICE_NOT_ALLOWED = {
    code: 'APP_SECURITY_002',
    message: 'Internal service is not allowed',
    messageKey: 'app.security.internal_service_not_allowed',
    rpcStatus: grpc_js_1.status.PERMISSION_DENIED
};
exports.OPERATOR_CONTEXT_MISSING = {
    code: 'APP_SECURITY_003',
    message: 'Operator context is missing',
    messageKey: 'app.security.operator_context_missing',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
exports.OPERATOR_CONTEXT_INVALID = {
    code: 'APP_SECURITY_004',
    message: 'Operator context is invalid',
    messageKey: 'app.security.operator_context_invalid',
    rpcStatus: grpc_js_1.status.FAILED_PRECONDITION
};
exports.PERMISSION_DEPENDENCY_UNAVAILABLE = {
    code: 'APP_SECURITY_005',
    message: 'Permission dependency is unavailable',
    messageKey: 'app.security.permission_dependency_unavailable',
    rpcStatus: grpc_js_1.status.UNAVAILABLE
};
//# sourceMappingURL=authorization.exception.js.map