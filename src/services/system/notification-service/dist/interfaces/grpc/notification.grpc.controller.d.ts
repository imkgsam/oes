import { ValidatingCommandBus } from '@oes/common/cqrs';
import { NotificationServiceController, SendDispatchResponse, SendEmailRequest, SendSmsRequest } from '@oes/common/generated/notification_service';
export declare class NotificationGrpcController implements NotificationServiceController {
    private readonly commandBus;
    constructor(commandBus: ValidatingCommandBus);
    sendEmail(request: SendEmailRequest): Promise<SendDispatchResponse>;
    sendSms(request: SendSmsRequest): Promise<SendDispatchResponse>;
}
