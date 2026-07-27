import type {
  CollaborationTaskAssignedEventData,
  CollaborationTaskCancelledEventData,
  CollaborationTaskCompletedEventData,
  EventConsumeOutcome,
  EventInboxIdentity,
  OesCloudEvent
} from '@oes/common'
import type { NotificationInboxItemDraft, NotificationInboxPort } from './notification-inbox.port'

type CollaborationTaskEvent = OesCloudEvent<
  | CollaborationTaskAssignedEventData
  | CollaborationTaskCompletedEventData
  | CollaborationTaskCancelledEventData
>

/** Applies the frozen Collaboration Task event policy without querying Task state or resolving additional recipients. */
export class CollaborationTaskNotificationHandler {
  /** Creates the predefined handler with its Notification-owned atomic Inbox persistence boundary. */
  constructor(private readonly inbox: NotificationInboxPort) {}

  /** Resolves the fixed local in-app results and persists them together with Inbox identity material. */
  async handle(
    event: CollaborationTaskEvent,
    identity: EventInboxIdentity
  ): Promise<EventConsumeOutcome> {
    return this.inbox.apply({
      event,
      identity,
      items: this.createItems(event)
    })
  }

  /** Creates only the recipients and display snapshots authorized by the frozen Task P1 contract. */
  private createItems(event: CollaborationTaskEvent): readonly NotificationInboxItemDraft[] {
    const actorAccountId = event.oesactoraccountid ?? undefined
    const policy = this.policyFor(event)
    const recipientIds = [...new Set(policy.candidates)].filter(
      (candidate) => candidate !== actorAccountId
    )
    return recipientIds.map((recipientAccountId) => ({
      tenantId: event.oestenantid,
      ...(event.oesorgid !== undefined ? { orgId: event.oesorgid } : {}),
      recipientAccountId,
      notificationType: policy.notificationType,
      channel: 'IN_APP',
      sourceEventId: event.id,
      sourceObjectRef: `collaboration-service:TASK:${event.data.taskId}`,
      deepLinkRef: `COLLABORATION_TASK_DETAIL(${event.data.taskId})`,
      titleSnapshot: event.data.titleSnapshot,
      bodySnapshot: policy.bodySnapshot,
      templateKey: policy.templateKey,
      templateVersion: 1,
      locale: 'en-US',
      traceId: event.oestraceid
    }))
  }

  /** Maps each frozen event type to its fixed Notification policy and allowlisted display inputs. */
  private policyFor(event: CollaborationTaskEvent): {
    readonly candidates: readonly string[]
    readonly notificationType: NotificationInboxItemDraft['notificationType']
    readonly templateKey: string
    readonly bodySnapshot: string
  } {
    switch (event.type) {
      case 'collaboration.task.assigned':
        return {
          candidates: [event.data.assigneeAccountId],
          notificationType: 'COLLABORATION_TASK_ASSIGNED',
          templateKey: 'notification.collaboration-task.assigned',
          bodySnapshot: `You were assigned “${event.data.titleSnapshot}”${event.data.dueAt ? `; due ${event.data.dueAt}.` : '.'}`
        }
      case 'collaboration.task.completed':
        return this.completedPolicy(event as OesCloudEvent<CollaborationTaskCompletedEventData>)
      case 'collaboration.task.cancelled':
        return this.cancelledPolicy(event as OesCloudEvent<CollaborationTaskCancelledEventData>)
      default:
        throw new Error('EVENT_TYPE_MISMATCH')
    }
  }

  /** Defines the fixed completed-task recipient and snapshot without consulting the current Task. */
  private completedPolicy(event: OesCloudEvent<CollaborationTaskCompletedEventData>) {
    return {
      candidates: [event.data.createdByAccountId],
      notificationType: 'COLLABORATION_TASK_COMPLETED' as const,
      templateKey: 'notification.collaboration-task.completed',
      bodySnapshot: `Task “${event.data.titleSnapshot}” was completed at ${event.data.completedAt}.`
    }
  }

  /** Defines the fixed cancellation recipients and snapshot while deliberately excluding the cancellation reason. */
  private cancelledPolicy(event: OesCloudEvent<CollaborationTaskCancelledEventData>) {
    return {
      candidates: [event.data.createdByAccountId, event.data.assigneeAccountId],
      notificationType: 'COLLABORATION_TASK_CANCELLED' as const,
      templateKey: 'notification.collaboration-task.cancelled',
      bodySnapshot: `Task “${event.data.titleSnapshot}” was cancelled at ${event.data.cancelledAt}.`
    }
  }
}
