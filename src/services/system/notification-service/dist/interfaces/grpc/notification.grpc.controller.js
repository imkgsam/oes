"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationGrpcController = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@oes/common/cqrs");
const filters_1 = require("../../../../../../common/dist/core/filters");
const notification_service_1 = require("@oes/common/generated/notification_service");
const commands_1 = require("../../application/commands");
let NotificationGrpcController = class NotificationGrpcController {
    constructor(commandBus) {
        this.commandBus = commandBus;
    }
    async sendEmail(request) {
        return this.commandBus.execute(new commands_1.SendEmailCommand(request));
    }
    async sendSms(request) {
        return this.commandBus.execute(new commands_1.SendSmsCommand(request));
    }
};
exports.NotificationGrpcController = NotificationGrpcController;
exports.NotificationGrpcController = NotificationGrpcController = __decorate([
    (0, common_1.UseFilters)(filters_1.GrpcExceptionFilter),
    (0, common_1.Controller)(),
    (0, notification_service_1.NotificationServiceControllerMethods)(),
    __metadata("design:paramtypes", [cqrs_1.ValidatingCommandBus])
], NotificationGrpcController);
//# sourceMappingURL=notification.grpc.controller.js.map