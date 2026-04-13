import { SendSmsRequest } from '@oes/common/generated/notification_service';
export declare class SendSmsCommand {
    readonly request: SendSmsRequest;
    constructor(request: SendSmsRequest);
}
