import { ValidatingCommandBus } from '@oes/common/cqrs';
import { NotificationServiceController, SendEmailRequest, SendEmailResponse, SendSmsResponse, SendSmsRequest } from '@oes/common/generated/notification_service';
export declare class NotificationGrpcController implements NotificationServiceController {
    private readonly commandBus;
    constructor(commandBus: ValidatingCommandBus);
    sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;
    sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;
}
