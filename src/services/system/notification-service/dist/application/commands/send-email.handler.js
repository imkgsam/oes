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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmailHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const notification_service_1 = require("@oes/common/generated/notification_service");
const common_1 = require("@nestjs/common");
const injection_tokens_1 = require("../../common/constants/injection-tokens");
const notification_dispatch_aggregate_1 = require("../../domain/aggregates/notification-dispatch.aggregate");
const send_email_command_1 = require("./send-email.command");
let SendEmailHandler = class SendEmailHandler {
    constructor(dispatchRepository, emailProvider) {
        this.dispatchRepository = dispatchRepository;
        this.emailProvider = emailProvider;
    }
    async execute(command) {
        const request = command.request;
        const recipient = request.recipient?.address?.trim();
        const templateKey = request.templateKey?.trim();
        const idempotencyKey = request.idempotencyKey?.trim();
        const tenantId = request.source?.tenantId?.trim();
        const sourceService = request.source?.sourceService?.trim();
        if (!recipient) {
            return this.reject('INVALID_RECIPIENT');
        }
        if (!templateKey) {
            return this.reject('TEMPLATE_NOT_FOUND');
        }
        if (!idempotencyKey || !tenantId || !sourceService) {
            return this.reject('INTERNAL_REJECTION');
        }
        const existing = await this.dispatchRepository.findByIdempotencyKey(idempotencyKey);
        if (existing) {
            return this.accept(existing);
        }
        const dispatch = notification_dispatch_aggregate_1.NotificationDispatch.accept({
            channel: 'EMAIL',
            category: this.mapCategory(request.category),
            sourceService,
            tenantId,
            orgId: request.source?.orgId || undefined,
            traceId: request.source?.traceId || undefined,
            requestId: request.source?.requestId || undefined,
            recipientAddress: recipient,
            recipientDisplayName: request.recipient?.displayName || undefined,
            templateKey,
            variablePayload: this.mapVariables(request.variables ?? []),
            idempotencyKey,
            subjectOverride: request.subjectOverride || undefined
        });
        const saved = await this.dispatchRepository.save(dispatch);
        await this.emailProvider.send(saved);
        return this.accept(saved);
    }
    accept(dispatch) {
        return {
            accepted: true,
            dispatchId: dispatch.getProps().id,
            status: notification_service_1.DispatchStatus.DISPATCH_STATUS_ACCEPTED
        };
    }
    reject(reason) {
        return {
            accepted: false,
            dispatchId: '',
            status: notification_service_1.DispatchStatus.DISPATCH_STATUS_REJECTED,
            rejectionReason: reason
        };
    }
    mapVariables(variables) {
        return variables.reduce((acc, item) => {
            if (item.key) {
                acc[item.key] = item.value ?? '';
            }
            return acc;
        }, {});
    }
    mapCategory(category) {
        switch (category) {
            case notification_service_1.NotificationCategory.NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT:
                return 'AUTH_SECURITY_ALERT';
            case notification_service_1.NotificationCategory.NOTIFICATION_CATEGORY_WORKFLOW_REMINDER:
                return 'WORKFLOW_REMINDER';
            case notification_service_1.NotificationCategory.NOTIFICATION_CATEGORY_BUSINESS_STATUS:
                return 'BUSINESS_STATUS';
            case notification_service_1.NotificationCategory.NOTIFICATION_CATEGORY_AUTH_OTP:
            default:
                return 'AUTH_OTP';
        }
    }
};
exports.SendEmailHandler = SendEmailHandler;
exports.SendEmailHandler = SendEmailHandler = __decorate([
    (0, cqrs_1.CommandHandler)(send_email_command_1.SendEmailCommand),
    __param(0, (0, common_1.Inject)(injection_tokens_1.REPO_NOTIFICATION_DISPATCH)),
    __param(1, (0, common_1.Inject)(injection_tokens_1.EMAIL_PROVIDER_PORT)),
    __metadata("design:paramtypes", [Object, Object])
], SendEmailHandler);
//# sourceMappingURL=send-email.handler.js.map