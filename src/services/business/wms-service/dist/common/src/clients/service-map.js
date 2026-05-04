"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_ENDPOINTS_CONFIG = exports.ServiceKeys = void 0;
exports.ServiceKeys = {
    AUTH_TCP: 'AUTH_TCP',
    PERMISSION_TCP: 'PERMISSION_TCP',
    PARTY_GRPC: 'PARTY_GRPC',
    AUDIT_TCP: 'AUDIT_TCP',
    NOTIFICATION_TCP: 'NOTIFICATION_TCP'
};
const resolvePort = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const endpoint = (hostEnv, portEnv, fallbackPort) => ({
    host: process.env[hostEnv] ?? 'localhost',
    port: resolvePort(process.env[portEnv], fallbackPort)
});
exports.SERVICE_ENDPOINTS_CONFIG = {
    AUTH_TCP: endpoint('AUTH_HOST', 'AUTH_TCP_PORT', 9202),
    PERMISSION_TCP: endpoint('PERMISSION_HOST', 'PERMISSION_TCP_PORT', 9302),
    PARTY_GRPC: endpoint('PARTY_SERVICE_GRPC_HOST', 'PARTY_SERVICE_GRPC_PORT', 50053),
    AUDIT_TCP: endpoint('AUDIT_HOST', 'AUDIT_TCP_PORT', 9602),
    NOTIFICATION_TCP: endpoint('NOTIFICATION_HOST', 'NOTIFICATION_TCP_PORT', 9702)
};
//# sourceMappingURL=service-map.js.map