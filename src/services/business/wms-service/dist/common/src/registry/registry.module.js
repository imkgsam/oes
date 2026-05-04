"use strict";
/**
 * @file Registry module — Nacos service registration and discovery
 * @module registry
 *
 * Provides a global NestJS module that manages:
 * - A shared NacosNamingClient connection
 * - Service discovery (subscribing to and querying service instances)
 * - Service registration (registering/deregistering the current instance)
 *
 * Import this module in your root AppModule to enable Nacos integration.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryModule = void 0;
const common_1 = require("@nestjs/common");
const nacos_naming_client_provider_1 = require("./nacos-naming-client.provider");
const nacos_discovery_service_1 = require("./nacos-discovery.service");
const nacos_registry_service_1 = require("./nacos-registry.service");
/**
 * Global module for Nacos service registration and discovery.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     RegistryModule,
 *     GrpcTransportModule.forRoot({ ... }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
let RegistryModule = class RegistryModule {
};
exports.RegistryModule = RegistryModule;
exports.RegistryModule = RegistryModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [nacos_naming_client_provider_1.NacosNamingClientProvider, nacos_discovery_service_1.NacosDiscoveryService, nacos_registry_service_1.NacosRegistryService],
        exports: [nacos_discovery_service_1.NacosDiscoveryService, nacos_registry_service_1.NacosRegistryService]
    })
], RegistryModule);
//# sourceMappingURL=registry.module.js.map