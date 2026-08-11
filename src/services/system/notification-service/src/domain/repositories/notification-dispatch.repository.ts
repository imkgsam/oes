import { NotificationDispatch } from '../aggregates/notification-dispatch.aggregate'

export interface INotificationDispatchRepository {
  findByIdempotencyKey(sourceService: string, channel: string, idempotencyKey: string): Promise<NotificationDispatch | null>
  accept(dispatch: NotificationDispatch): Promise<NotificationDispatch>
}
