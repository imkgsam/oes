import { SendEmailRequest } from '@oes/common/generated/notification_service';
export declare class SendEmailCommand {
    readonly request: SendEmailRequest;
    constructor(request: SendEmailRequest);
}
