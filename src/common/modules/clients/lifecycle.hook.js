"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientConnectionLifecycle = void 0;
// 作用: 管理微服务客户端连接的生命周期
const common_1 = require("@nestjs/common");
const connection_manager_1 = require("./connection-manager");
let ClientConnectionLifecycle = class ClientConnectionLifecycle {
    async onApplicationShutdown(signal) {
        try {
            console.log(`Shutdown signal received: ${signal}`);
            await (0, connection_manager_1.closeAllClients)();
        }
        catch (e) {
            console.error('Error during client shutdown', e);
        }
    }
};
exports.ClientConnectionLifecycle = ClientConnectionLifecycle;
exports.ClientConnectionLifecycle = ClientConnectionLifecycle = __decorate([
    (0, common_1.Injectable)()
], ClientConnectionLifecycle);
//# sourceMappingURL=lifecycle.hook.js.map