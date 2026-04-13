"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const cqrs_2 = require("@oes/common/cqrs");
const injection_tokens_1 = require("../../common/constants/injection-tokens");
const commands_1 = require("../../application/commands");
const prisma_module_1 = require("../../infrastructure/prisma/prisma.module");
const prisma_notification_dispatch_repository_1 = require("../../infrastructure/repositories/prisma/prisma.notification-dispatch.repository");
const local_email_provider_adaptor_1 = require("../../infrastructure/providers/local-email-provider.adaptor");
const local_sms_provider_adaptor_1 = require("../../infrastructure/providers/local-sms-provider.adaptor");
const notification_grpc_controller_1 = require("../../interfaces/grpc/notification.grpc.controller");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [cqrs_1.CqrsModule, prisma_module_1.PrismaModule],
        providers: [
            cqrs_2.ValidatingCommandBus,
            { provide: injection_tokens_1.REPO_NOTIFICATION_DISPATCH, useClass: prisma_notification_dispatch_repository_1.PrismaNotificationDispatchRepository },
            { provide: injection_tokens_1.EMAIL_PROVIDER_PORT, useClass: local_email_provider_adaptor_1.LocalEmailProviderAdaptor },
            { provide: injection_tokens_1.SMS_PROVIDER_PORT, useClass: local_sms_provider_adaptor_1.LocalSmsProviderAdaptor },
            local_email_provider_adaptor_1.LocalEmailProviderAdaptor,
            local_sms_provider_adaptor_1.LocalSmsProviderAdaptor,
            ...commands_1.NotificationCommandHandlers
        ],
        controllers: [notification_grpc_controller_1.NotificationGrpcController]
    })
], NotificationModule);
//# sourceMappingURL=notification.module.js.map