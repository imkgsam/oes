"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroserviceClientModule = exports.AUTH_SERVICE = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const auth_client_1 = require("./auth.client");
exports.AUTH_SERVICE = 'AUTH_SERVICE';
let MicroserviceClientModule = class MicroserviceClientModule {
};
exports.MicroserviceClientModule = MicroserviceClientModule;
exports.MicroserviceClientModule = MicroserviceClientModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.register([
                {
                    name: exports.AUTH_SERVICE,
                    transport: microservices_1.Transport.TCP,
                    options: {
                        host: '127.0.0.1',
                        port: 9202,
                    },
                },
            ])
        ],
        providers: [auth_client_1.AuthClient],
        exports: [auth_client_1.AuthClient],
    })
], MicroserviceClientModule);
//# sourceMappingURL=microservice-client.module.js.map