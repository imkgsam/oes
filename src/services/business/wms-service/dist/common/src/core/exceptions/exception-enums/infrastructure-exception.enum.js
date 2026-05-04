"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNKNOWN_EXCEPTION = exports.INTERNAL_SERVICE_UNAVAILABLE = exports.EXTERNAL_HTTP_ERROR = exports.EXTERNAL_HTTP_UNAVAILABLE = exports.EXTERNAL_HTTP_TIMEOUT = exports.THIRD_PARTY_SERVICE_UNAVAILABLE = exports.REDIS_CONNECTION_FAILED = exports.DATABASE_QUERY_TIMEOUT = exports.DATABASE_CONNECTION_FAILED = void 0;
const grpc_js_1 = require("@grpc/grpc-js");
exports.DATABASE_CONNECTION_FAILED = {
    code: 'INFRA_DB_001',
    message: 'Failed to connect to database',
    messageKey: 'infra.db.connection_failed',
    rpcStatus: grpc_js_1.status.UNAVAILABLE
};
exports.DATABASE_QUERY_TIMEOUT = {
    code: 'INFRA_DB_002',
    message: 'Database query timed out',
    messageKey: 'infra.db.query_timeout',
    rpcStatus: grpc_js_1.status.DEADLINE_EXCEEDED
};
// 缓存
exports.REDIS_CONNECTION_FAILED = {
    code: 'INFRA_CACHE_001',
    message: 'Failed to connect to Redis',
    messageKey: 'infra.cache.redis_connection_failed',
    rpcStatus: grpc_js_1.status.UNAVAILABLE
};
// 第三方服务
exports.THIRD_PARTY_SERVICE_UNAVAILABLE = {
    code: 'INFRA_EXTERNAL_001',
    message: 'Third-party service is unavailable',
    messageKey: 'infra.external.unavailable',
    rpcStatus: grpc_js_1.status.UNAVAILABLE
};
// 外部 HTTP 调用
exports.EXTERNAL_HTTP_TIMEOUT = {
    code: 'INFRA_HTTP_001',
    message: 'External HTTP request timed out',
    messageKey: 'infra.http.timeout',
    rpcStatus: grpc_js_1.status.DEADLINE_EXCEEDED
};
exports.EXTERNAL_HTTP_UNAVAILABLE = {
    code: 'INFRA_HTTP_002',
    message: 'External HTTP service unavailable',
    messageKey: 'infra.http.unavailable',
    rpcStatus: grpc_js_1.status.UNAVAILABLE
};
exports.EXTERNAL_HTTP_ERROR = {
    code: 'INFRA_HTTP_003',
    message: 'External HTTP request failed',
    messageKey: 'infra.http.error',
    rpcStatus: grpc_js_1.status.INTERNAL
};
// 项目内其他服务
exports.INTERNAL_SERVICE_UNAVAILABLE = {
    code: 'INFRA_INTERNAL_DEPENDENCY_UNAVALABLE',
    message: 'Internal service is unavailable',
    messageKey: 'infra.internal.unavailable',
    rpcStatus: grpc_js_1.status.INTERNAL
};
// 未知异常
exports.UNKNOWN_EXCEPTION = {
    code: 'INFRA_UNKNOWN_EXCEPTION',
    message: 'Unknown exception',
    messageKey: 'infra.unknown_exception',
    rpcStatus: grpc_js_1.status.INTERNAL
};
//# sourceMappingURL=infrastructure-exception.enum.js.map