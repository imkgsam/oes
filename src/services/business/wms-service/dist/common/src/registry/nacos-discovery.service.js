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
exports.NacosDiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const nacos_naming_client_provider_1 = require("./nacos-naming-client.provider");
const logging_1 = require("../logging");
let NacosDiscoveryService = class NacosDiscoveryService {
    namingClientProvider;
    logger;
    cache = new Map();
    constructor(namingClientProvider, logger) {
        this.namingClientProvider = namingClientProvider;
        this.logger = logger;
    }
    async subscribe(serviceName) {
        if (!this.namingClientProvider.isReady()) {
            this.logger.warn(`Cannot subscribe to "${serviceName}": Nacos naming client not initialized`);
            return;
        }
        const client = this.namingClientProvider.getClient();
        await client.subscribe(serviceName, (instances) => {
            const healthyInstances = instances.filter((i) => i.healthy && i.enabled);
            this.cache.set(serviceName, healthyInstances.map((i) => ({
                ip: i.ip,
                port: i.port,
                metadata: i.metadata
            })));
            this.logger.debug(`[${serviceName}] Instances updated: ${healthyInstances.length}/${instances.length} healthy`);
        });
        this.logger.log(`Subscribed to service: ${serviceName}`);
    }
    getInstances(serviceName) {
        return this.cache.get(serviceName) ?? [];
    }
};
exports.NacosDiscoveryService = NacosDiscoveryService;
exports.NacosDiscoveryService = NacosDiscoveryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nacos_naming_client_provider_1.NacosNamingClientProvider,
        logging_1.AppLogger])
], NacosDiscoveryService);
//# sourceMappingURL=nacos-discovery.service.js.map