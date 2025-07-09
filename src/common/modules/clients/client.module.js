"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ClientModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientModule = void 0;
// common/clients/client.module.ts
const common_1 = require("@nestjs/common");
const service_map_1 = require("./service-map");
const client_registry_1 = require("./client-registry");
const lifecycle_hook_1 = require("./lifecycle.hook");
let ClientModule = ClientModule_1 = class ClientModule {
    static register() {
        const providers = Object.entries(service_map_1.SERVICE_ENDPOINTS_CONFIG).map(([key, endpoint]) => ({
            provide: service_map_1.SERVICE_CLIENT_TOKENS[key],
            useValue: (0, client_registry_1.getOrCreateClient)(key, endpoint),
        }));
        const logger = new common_1.Logger(ClientModule_1.name);
        logger.log('ClientModule initialized with endpoints: ' + Object.keys(service_map_1.SERVICE_ENDPOINTS_CONFIG).length);
        return {
            module: ClientModule_1,
            providers: [...providers, lifecycle_hook_1.ClientConnectionLifecycle],
            exports: providers,
        };
    }
};
exports.ClientModule = ClientModule;
exports.ClientModule = ClientModule = ClientModule_1 = __decorate([
    (0, common_1.Module)({})
], ClientModule);
//# sourceMappingURL=client.module.js.map