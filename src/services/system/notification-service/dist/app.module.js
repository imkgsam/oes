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
const notification_module_1 = require("./modules/notification/notification.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            registry_1.RegistryModule,
            logging_1.LoggingModule.forRoot({ serviceName: 'notification-service' }),
            config_1.ConfigModule.forRoot({
                cache: true,
                isGlobal: true
            }),
            notification_module_1.NotificationModule
        ]
    })
    /**
     * AppModule wires notification-service infrastructure and enables service-scoped logging metadata.
     */
], AppModule);
//# sourceMappingURL=app.module.js.map