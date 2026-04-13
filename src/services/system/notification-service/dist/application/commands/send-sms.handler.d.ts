import { ICommandHandler } from '@nestjs/cqrs';
import { SendDispatchResponse } from '@oes/common/generated/notification_service';
import { INotificationDispatchRepository } from '../../domain/repositories/notification-dispatch.repository';
import { SmsProviderPort } from '../../domain/services/sms-provider.port';
import { SendSmsCommand } from './send-sms.command';
export declare class SendSmsHandler implements ICommandHandler<SendSmsCommand, SendDispatchResponse> {
    private readonly dispatchRepository;
    private readonly smsProvider;
    constructor(dispatchRepository: INotificationDispatchRepository, smsProvider: SmsProviderPort);
    execute(command: SendSmsCommand): Promise<SendDispatchResponse>;
    private accept;
    private reject;
    private mapVariables;
    private mapCategory;
}
