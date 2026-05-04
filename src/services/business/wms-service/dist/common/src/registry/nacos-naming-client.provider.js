"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NacosNamingClientProvider = exports.NACOS_NAMING_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const nacos_1 = require("nacos");
const app_logger_service_1 = require("../logging/app-logger.service");
const console_logger_adapter_1 = require("../logging/console-logger.adapter");
/**
 * Injection token for the Nacos naming client provider.
 */
exports.NACOS_NAMING_CLIENT = Symbol('NACOS_NAMING_CLIENT');
/**
 * Shared Nacos naming client.
 *
 * Creates a single NacosNamingClient connection that is shared between
 * NacosDiscoveryService and NacosRegistryService, reducing resource usage.
 *
 * Configuration is read from environment variables:
 * - `NACOS_SERVER` — Nacos server address (required)
 * - `NACOS_NAMESPACE` — Nacos namespace (default: 'public')
 *
 * @example
 * ```typescript
 * @Module({
 *   providers: [NacosNamingClientProvider],
 *   exports: [NacosNamingClientProvider],
 * })
 * export class RegistryModule {}
 * ```
 */
let NacosNamingClientProvider = class NacosNamingClientProvider {
    logger;
    client;
    constructor(logger) {
        this.logger = logger;
    }
    async onModuleInit() {
        const serverList = process.env.NACOS_SERVER;
        if (!serverList) {
            this.logger.warn('NACOS_SERVER environment variable is not set. ' +
                'Nacos naming client will not be initialized.');
            return;
        }
        const namespace = process.env.NACOS_NAMESPACE ?? 'public';
        this.client = new nacos_1.NacosNamingClient({
            serverList,
            namespace,
            username: process.env.NACOS_USERNAME,
            password: process.env.NACOS_PASSWORD,
            logger: new console_logger_adapter_1.ConsoleLoggerAdapter(this.logger, 'nacos-naming')
        });
        await this.client.ready();
        this.logger.log(`Nacos naming client connected to ${serverList} (namespace: ${namespace})`);
    }
    /**
     * Get the underlying NacosNamingClient instance.
     *
     * @throws Error if the client has not been initialized
     */
    getClient() {
        if (!this.client) {
            throw new Error('[NacosNamingClientProvider] Client not initialized. ' +
                'Ensure NACOS_SERVER environment variable is set.');
        }
        return this.client;
    }
    /**
     * Check if the client is initialized and ready.
     */
    isReady() {
        return !!this.client;
    }
    async onModuleDestroy() {
        if (this.client) {
            try {
                // NacosNamingClient may not expose a typed close() method,
                // but the underlying SDK supports it at runtime
                if (typeof this.client.close === 'function') {
                    await this.client.close();
                }
                this.logger.log('Nacos naming client closed');
            }
            catch (err) {
                this.logger.error('Error closing Nacos naming client', err);
            }
        }
    }
};
exports.NacosNamingClientProvider = NacosNamingClientProvider;
exports.NacosNamingClientProvider = NacosNamingClientProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLogger])
], NacosNamingClientProvider);
//# sourceMappingURL=nacos-naming-client.provider.js.map