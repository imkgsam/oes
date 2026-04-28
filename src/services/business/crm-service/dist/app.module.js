"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const authorization_1 = require("@oes/common/authorization");
const constants_1 = require("@oes/common/constants");
const contracts_1 = require("@oes/common/contracts");
const logging_1 = require("@oes/common/logging");
const registry_1 = require("@oes/common/registry");
const transport_1 = require("@oes/common/transport");
const crm_infrastructure_module_1 = require("./modules/crm-infrastructure.module");
const crm_management_module_1 = require("./modules/crm-management.module");
const crm_query_module_1 = require("./modules/crm-query.module");
function resolveGrpcUrl(envKey, fallbackUrl) {
    const explicitUrl = process.env[envKey]?.trim();
    if (explicitUrl) {
        return explicitUrl;
    }
    if ((process.env.NODE_ENV ?? 'development') !== 'production') {
        return fallbackUrl;
    }
    return undefined;
}
/** AppModule wires the crm-service phase 1 runtime modules and downstream party-service client metadata. */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            logging_1.LoggingModule.forRoot({ serviceName: 'crm-service' }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env']
            }),
            transport_1.GrpcTransportModule.forRoot({
                services: {
                    [constants_1.SERVICE_NAMES.PARTY]: {
                        serviceName: constants_1.SERVICE_NAMES.PARTY,
                        protoPath: [(0, contracts_1.resolveCommonProtoPath)('party_service/party.proto')],
                        packageName: 'party_service',
                        url: resolveGrpcUrl('GRPC_SERVICE_PARTY_URL', '127.0.0.1:50053')
                    }
                }
            }),
            authorization_1.AuthorizationModule,
            registry_1.RegistryModule,
            crm_infrastructure_module_1.CrmInfrastructureModule,
            crm_query_module_1.CrmQueryModule,
            crm_management_module_1.CrmManagementModule
        ]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map