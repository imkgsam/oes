import { ICommandHandler } from '@nestjs/cqrs';
import { SendEmailResponse } from '@oes/common/generated/notification_service';
import { INotificationDispatchRepository } from '../../domain/repositories/notification-dispatch.repository';
import { EmailProviderPort } from '../../domain/services/email-provider.port';
import { SendEmailCommand } from './send-email.command';
export declare class SendEmailHandler implements ICommandHandler<SendEmailCommand, SendEmailResponse> {
    private readonly dispatchRepository;
    private readonly emailProvider;
    constructor(dispatchRepository: INotificationDispatchRepository, emailProvider: EmailProviderPort);
    execute(command: SendEmailCommand): Promise<SendEmailResponse>;
    private accept;
    private reject;
    private mapVariables;
    private mapCategory;
}
