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
exports.NacosConfigService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const nacos_1 = require("nacos");
const config_events_1 = require("./config.events");
let NacosConfigService = class NacosConfigService {
    eventEmitter;
    client;
    cache = {};
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async init() {
        this.client = new nacos_1.NacosConfigClient({
            serverAddr: process.env.NACOS_SERVER,
            namespace: process.env.NACOS_NAMESPACE,
            username: process.env.NACOS_USERNAME,
            password: process.env.NACOS_PASSWORD
        });
        await this.client.ready();
        const content = await this.client.getConfig(process.env.NACOS_DATA_ID, process.env.NACOS_GROUP || 'DEFAULT_GROUP');
        this.updateCache(content);
        await this.client.subscribe({
            dataId: process.env.NACOS_DATA_ID,
            group: process.env.NACOS_GROUP
        }, (content) => {
            console.log('[Nacos] Config Changed');
            this.updateCache(content);
            // ✅ 发布事件
            this.eventEmitter.emit('config.changed', new config_events_1.ConfigChangedEvent(this.cache));
        });
    }
    updateCache(content) {
        try {
            this.cache = JSON.parse(content);
        }
        catch (e) {
            console.error('[Nacos] Invalid JSON format');
        }
    }
    get(key) {
        return this.cache[key];
    }
    getAll() {
        return this.cache;
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.close();
        }
    }
};
exports.NacosConfigService = NacosConfigService;
exports.NacosConfigService = NacosConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], NacosConfigService);
//# sourceMappingURL=nacos.config.service.js.map