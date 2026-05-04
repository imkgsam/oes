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
const wms_infrastructure_module_1 = require("./modules/wms-infrastructure.module");
const wms_management_module_1 = require("./modules/wms-management.module");
const wms_query_module_1 = require("./modules/wms-query.module");
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
/** AppModule wires the wms-service phase 1 runtime modules and downstream procurement and item-master clients. */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            logging_1.LoggingModule.forRoot({ serviceName: 'wms-service' }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env']
            }),
            transport_1.GrpcTransportModule.forRoot({
                services: {
                    [constants_1.SERVICE_NAMES.ITEM_MASTER]: {
                        serviceName: constants_1.SERVICE_NAMES.ITEM_MASTER,
                        protoPath: [(0, contracts_1.resolveCommonProtoPath)('item_master_service/item_master.proto')],
                        packageName: 'item_master_service',
                        url: resolveGrpcUrl('GRPC_SERVICE_ITEM_MASTER_URL', '127.0.0.1:50058')
                    },
                    [constants_1.SERVICE_NAMES.PROCUREMENT]: {
                        serviceName: constants_1.SERVICE_NAMES.PROCUREMENT,
                        protoPath: [(0, contracts_1.resolveCommonProtoPath)('procurement_service/procurement.proto')],
                        packageName: 'procurement_service',
                        url: resolveGrpcUrl('GRPC_SERVICE_PROCUREMENT_URL', '127.0.0.1:50062')
                    }
                }
            }),
            authorization_1.AuthorizationModule,
            registry_1.RegistryModule,
            wms_infrastructure_module_1.WmsInfrastructureModule,
            wms_query_module_1.WmsQueryModule,
            wms_management_module_1.WmsManagementModule
        ]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map