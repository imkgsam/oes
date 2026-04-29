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
const logging_1 = require("@oes/common/logging");
const registry_1 = require("@oes/common/registry");
const pricing_management_module_1 = require("./modules/pricing-management.module");
const pricing_query_module_1 = require("./modules/pricing-query.module");
const sales_infrastructure_module_1 = require("./modules/sales-infrastructure.module");
const sales_management_module_1 = require("./modules/sales-management.module");
const sales_query_module_1 = require("./modules/sales-query.module");
/** AppModule wires the sales-service phase 1 runtime skeleton modules and service-scoped logging metadata. */
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            logging_1.LoggingModule.forRoot({ serviceName: 'sales-service' }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env']
            }),
            registry_1.RegistryModule,
            sales_infrastructure_module_1.SalesInfrastructureModule,
            sales_query_module_1.SalesQueryModule,
            sales_management_module_1.SalesManagementModule,
            pricing_query_module_1.PricingQueryModule,
            pricing_management_module_1.PricingManagementModule
        ]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map