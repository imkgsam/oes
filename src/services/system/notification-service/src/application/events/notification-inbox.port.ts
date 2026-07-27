import type { EventConsumeOutcome, EventInboxIdentity, OesCloudEvent } from '@oes/common'

/** Describes the Notification-owned data that must commit atomically with an event Inbox identity. */
export interface NotificationInboxItemDraft {
  readonly tenantId: string
  readonly orgId?: string | null
  readonly recipientAccountId: string
  readonly notificationType:
    | 'COLLABORATION_TASK_ASSIGNED'
    | 'COLLABORATION_TASK_COMPLETED'
    | 'COLLABORATION_TASK_CANCELLED'
  readonly channel: 'IN_APP'
  readonly sourceEventId: string
  readonly sourceObjectRef: string
  readonly deepLinkRef: string
  readonly titleSnapshot: string
  readonly bodySnapshot: string
  readonly templateKey: string
  readonly templateVersion: number
  readonly locale: string
  readonly traceId: string
}

/** Carries one validated event and its deterministic Notification-owned local results to persistence. */
export interface ApplyNotificationInboxInput {
  readonly event: OesCloudEvent
  readonly identity: EventInboxIdentity
  readonly items: readonly NotificationInboxItemDraft[]
}

/** Defines the local transaction boundary for the Notification Inbox and its in-app results. */
export interface NotificationInboxPort {
  apply(input: ApplyNotificationInboxInput): Promise<EventConsumeOutcome>
}
