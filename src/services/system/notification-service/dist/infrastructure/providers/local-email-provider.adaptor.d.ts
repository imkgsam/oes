import { NotificationDispatch } from '../../domain/aggregates/notification-dispatch.aggregate';
import { EmailProviderPort } from '../../domain/services/email-provider.port';
export declare class LocalEmailProviderAdaptor implements EmailProviderPort {
    private readonly logger;
    send(dispatch: NotificationDispatch): Promise<void>;
}
