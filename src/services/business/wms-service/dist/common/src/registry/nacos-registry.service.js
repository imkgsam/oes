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
exports.NacosRegistryService = void 0;
const common_1 = require("@nestjs/common");
const nacos_naming_client_provider_1 = require("./nacos-naming-client.provider");
const os = require("os");
const logging_1 = require("../logging");
let NacosRegistryService = class NacosRegistryService {
    namingClientProvider;
    logger;
    instance;
    constructor(namingClientProvider, logger) {
        this.namingClientProvider = namingClientProvider;
        this.logger = logger;
        const ip = process.env.SERVICE_REGISTRY_IP ?? getLocalIP();
        const port = Number(process.env.SERVICE_REGISTRY_PORT);
        this.logger.warn(`Initializing NacosRegistryService with IP: ${ip}, Port: ${port}`);
        this.instance = {
            instanceId: `${ip}:${port}`,
            ip,
            port,
            weight: 1,
            healthy: true,
            enabled: true
        };
    }
    async onModuleInit() {
        console.log('in onModuleInit');
        if (!this.namingClientProvider.isReady()) {
            this.logger.warn('Nacos naming client not initialized. Skipping registration.');
            return;
        }
        await this.register();
    }
    async register() {
        const serviceName = process.env.MODULE_NAME;
        if (!serviceName) {
            this.logger.warn('MODULE_NAME not set. Skipping service registration.');
            return;
        }
        const client = this.namingClientProvider.getClient();
        await client.registerInstance(serviceName, this.instance);
        this.logger.log(`Service registered - : ${serviceName} @ ${this.instance.ip}:${this.instance.port}`);
    }
    async deregister() {
        const serviceName = process.env.MODULE_NAME;
        if (!serviceName)
            return;
        if (!this.namingClientProvider.isReady())
            return;
        try {
            const client = this.namingClientProvider.getClient();
            await client.deregisterInstance(serviceName, this.instance);
            this.logger.log(`Service deregistered: ${serviceName} @ ${this.instance.ip}:${this.instance.port}`);
        }
        catch (err) {
            this.logger.error(`Failed to deregister service: ${serviceName}`, err);
        }
    }
    async onModuleDestroy() {
        await this.deregister();
    }
};
exports.NacosRegistryService = NacosRegistryService;
exports.NacosRegistryService = NacosRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nacos_naming_client_provider_1.NacosNamingClientProvider,
        logging_1.AppLogger])
], NacosRegistryService);
function getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    throw new Error('Cannot determine local IP');
}
//# sourceMappingURL=nacos-registry.service.js.map