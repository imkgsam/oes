"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_INVALID = exports.JWT_MISSING = exports.VALIDATION_FAILED = exports.ACCESS_DENIED = exports.UNAUTHENTICATED = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
exports.UNAUTHENTICATED = {
    code: 'APP_AUTH_001',
    message: 'Request is unauthenticated',
    messageKey: 'app.auth.unauthenticated',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
exports.ACCESS_DENIED = {
    code: 'APP_AUTH_002',
    message: 'Access denied due to insufficient permissions',
    messageKey: 'app.auth.access_denied',
    rpcStatus: grpc_js_1.status.PERMISSION_DENIED
};
exports.VALIDATION_FAILED = {
    code: 'APP_VALIDATION_001',
    message: 'Request validation failed',
    messageKey: 'app.validation.failed',
    rpcStatus: grpc_js_1.status.INVALID_ARGUMENT
};
exports.JWT_MISSING = {
    code: 'APP_AUTH_003',
    message: 'Authorization token is missing',
    messageKey: 'app.auth.jwt_missing',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
exports.JWT_INVALID = {
    code: 'APP_AUTH_004',
    message: 'Authorization token is invalid or expired',
    messageKey: 'app.auth.jwt_invalid',
    rpcStatus: grpc_js_1.status.UNAUTHENTICATED
};
//# sourceMappingURL=application-exception.enum.js.map