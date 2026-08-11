import { NotificationDispatch } from '../aggregates/notification-dispatch.aggregate'

export interface SmsProviderPort {
  send(dispatch: NotificationDispatch, payload: Record<string, unknown>): Promise<void>
}
