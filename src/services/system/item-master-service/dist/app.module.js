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
const logging_1 = require("@oes/common/logging");
const registry_1 = require("@oes/common/registry");
const prisma_module_1 = require("./infrastructure/prisma/prisma.module");
const item_master_management_module_1 = require("./modules/item-master-management/item-master-management.module");
const item_master_query_module_1 = require("./modules/item-master-query/item-master-query.module");
/** AppModule wires item-master-service modules and service-scoped logging metadata. */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            logging_1.LoggingModule.forRoot({ serviceName: 'item-master-service' }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env']
            }),
            authorization_1.AuthorizationModule,
            registry_1.RegistryModule,
            prisma_module_1.PrismaModule,
            item_master_query_module_1.ItemMasterQueryModule,
            item_master_management_module_1.ItemMasterManagementModule
        ]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map