import { NotificationDispatch } from '../../domain/aggregates/notification-dispatch.aggregate';
import { SmsProviderPort } from '../../domain/services/sms-provider.port';
export declare class LocalSmsProviderAdaptor implements SmsProviderPort {
    private readonly logger;
    send(dispatch: NotificationDispatch): Promise<void>;
}
