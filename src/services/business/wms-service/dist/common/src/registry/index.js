"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NACOS_NAMING_CLIENT = exports.NacosNamingClientProvider = exports.NacosRegistryService = exports.NacosDiscoveryService = exports.RegistryModule = void 0;
var registry_module_1 = require("./registry.module");
Object.defineProperty(exports, "RegistryModule", { enumerable: true, get: function () { return registry_module_1.RegistryModule; } });
var nacos_discovery_service_1 = require("./nacos-discovery.service");
Object.defineProperty(exports, "NacosDiscoveryService", { enumerable: true, get: function () { return nacos_discovery_service_1.NacosDiscoveryService; } });
var nacos_registry_service_1 = require("./nacos-registry.service");
Object.defineProperty(exports, "NacosRegistryService", { enumerable: true, get: function () { return nacos_registry_service_1.NacosRegistryService; } });
var nacos_naming_client_provider_1 = require("./nacos-naming-client.provider");
Object.defineProperty(exports, "NacosNamingClientProvider", { enumerable: true, get: function () { return nacos_naming_client_provider_1.NacosNamingClientProvider; } });
Object.defineProperty(exports, "NACOS_NAMING_CLIENT", { enumerable: true, get: function () { return nacos_naming_client_provider_1.NACOS_NAMING_CLIENT; } });
//# sourceMappingURL=index.js.map