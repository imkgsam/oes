import { ICommandHandler } from '@nestjs/cqrs';
import { SendSmsResponse } from '@oes/common/generated/notification_service';
import { INotificationDispatchRepository } from '../../domain/repositories/notification-dispatch.repository';
import { SmsProviderPort } from '../../domain/services/sms-provider.port';
import { SendSmsCommand } from './send-sms.command';
export declare class SendSmsHandler implements ICommandHandler<SendSmsCommand, SendSmsResponse> {
    private readonly dispatchRepository;
    private readonly smsProvider;
    constructor(dispatchRepository: INotificationDispatchRepository, smsProvider: SmsProviderPort);
    execute(command: SendSmsCommand): Promise<SendSmsResponse>;
    private accept;
    private reject;
    private mapVariables;
    private mapCategory;
}
