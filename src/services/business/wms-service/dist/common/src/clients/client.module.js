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
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const service_map_1 = require("./service-map");
let ClientModule = ClientModule_1 = class ClientModule {
    static register(serviceKeys) {
        return {
            module: ClientModule_1,
            imports: [
                microservices_1.ClientsModule.register(serviceKeys.map((serviceKey) => {
                    const endpoint = service_map_1.SERVICE_ENDPOINTS_CONFIG[serviceKey];
                    return {
                        name: serviceKey,
                        transport: microservices_1.Transport.TCP,
                        options: {
                            host: endpoint.host,
                            port: endpoint.port
                        }
                    };
                }))
            ],
            exports: [microservices_1.ClientsModule]
        };
    }
};
exports.ClientModule = ClientModule;
exports.ClientModule = ClientModule = ClientModule_1 = __decorate([
    (0, common_1.Module)({})
], ClientModule);
//# sourceMappingURL=client.module.js.map