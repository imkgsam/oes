import { NotificationDispatch } from '../aggregates/notification-dispatch.aggregate'

export interface EmailProviderPort {
  send(dispatch: NotificationDispatch, payload: Record<string, unknown>): Promise<void>
}
