"use strict";
// 作用: 创建和管理微服务客户端代理
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateClient = getOrCreateClient;
const client_factory_1 = require("./client-factory");
const connection_manager_1 = require("./connection-manager");
const clientCache = new Map();
function getOrCreateClient(id, endpointConfig) {
    if (!clientCache.has(id)) {
        const client = (0, client_factory_1.createClient)(endpointConfig);
        clientCache.set(id, client);
        (0, connection_manager_1.initManagedClient)(id, client);
    }
    return clientCache.get(id);
}
//# sourceMappingURL=client-registry.js.map