"use strict";
//作用： 记录所有微服务的配置和客户端令牌
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_CLIENT_TOKENS = exports.SERVICE_ENDPOINTS_CONFIG = void 0;
exports.SERVICE_ENDPOINTS_CONFIG = {
    MES_TCP: {
        protocol: 'TCP',
        serviceName: 'MES-SERVICE',
        port: 11102,
        host: 'localhost'
    },
    ERP_TCP: {
        protocol: 'TCP',
        serviceName: 'ERP-SERVICE',
        port: 11202,
        host: 'localhost'
    },
    AUTH_TCP: {
        protocol: 'TCP',
        serviceName: 'AUTH-SERVICE',
        port: 9202,
        host: 'localhost'
    },
    PERMI_TCP: {
        protocol: 'TCP',
        serviceName: 'PERMISSION-SERVICE',
        port: 9302,
        host: 'localhost'
    },
};
exports.SERVICE_CLIENT_TOKENS = Object.fromEntries(Object.keys(exports.SERVICE_ENDPOINTS_CONFIG).map((key, value) => [key, `${key}_${value['protocol']}_CLIENT`]));
//# sourceMappingURL=service-map.js.map