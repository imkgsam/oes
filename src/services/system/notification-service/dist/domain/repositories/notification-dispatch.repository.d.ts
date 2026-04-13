import { NotificationDispatch } from '../aggregates/notification-dispatch.aggregate';
export interface INotificationDispatchRepository {
    findByIdempotencyKey(idempotencyKey: string): Promise<NotificationDispatch | null>;
    save(dispatch: NotificationDispatch): Promise<NotificationDispatch>;
}
