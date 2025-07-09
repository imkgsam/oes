"use strict";
//作用： 管理所有微服务连接
Object.defineProperty(exports, "__esModule", { value: true });
exports.initManagedClient = initManagedClient;
exports.closeAllClients = closeAllClients;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('ClientManager');
const clients = new Map();
async function initManagedClient(id, client) {
    const managed = {
        id,
        client,
        connected: false,
        retries: 0,
    };
    clients.set(id, managed);
    await tryConnect(managed);
}
async function tryConnect(managed) {
    try {
        await managed.client.connect();
        managed.connected = true;
        managed.retries = 0;
        logger.log(`[${managed.id}] Connected`);
    }
    catch (err) {
        managed.connected = false;
        managed.retries += 1;
        logger.warn(`[${managed.id}] Connection failed. Retry #${managed.retries}`);
        setTimeout(() => tryConnect(managed), 1000 * Math.min(managed.retries, 10));
    }
}
async function closeAllClients() {
    for (const managed of clients.values()) {
        try {
            await managed.client.close();
            logger.log(`[${managed.id}] Closed`);
        }
        catch (err) {
            logger.error(`[${managed.id}] Close failed:`, err);
        }
    }
}
//# sourceMappingURL=connection-manager.js.map