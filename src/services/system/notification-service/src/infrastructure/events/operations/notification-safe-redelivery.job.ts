import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
  COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT,
  NatsSafeRedeliveryRunner,
  createInboxIdentity,
  encodeCloudEvent,
  type CollaborationTaskAssignedEventData,
  type CollaborationTaskCancelledEventData,
  type CollaborationTaskCompletedEventData,
  type EventConsumeOutcome,
  type OesCloudEvent,
  type SafeRedeliveryRequest
} from '@oes/common'
import { CollaborationTaskNotificationHandler } from '../../../application/events/collaboration-task-notification.handler'
import {
  NotificationEventOperationsService,
  type SafeRedeliveryRunRecord,
  type TrustedReplayOperator
} from './notification-event-operations.service'

type CollaborationTaskEvent = OesCloudEvent<
  | CollaborationTaskAssignedEventData
  | CollaborationTaskCompletedEventData
  | CollaborationTaskCancelledEventData
>

/** Lists the only exact frozen subjects that an approved Notification Task replay credential may advance. */
const APPROVED_SUBJECTS = [
  'oes.events.collaboration.task.assigned',
  'oes.events.collaboration.task.completed',
  'oes.events.collaboration.task.cancelled'
] as const

/** Runs one dual-approved SAFE_REDELIVERY operation through the existing typed Inbox handler without a republish capability. */
export class NotificationSafeRedeliveryJob {
  /** Receives the consumer-owned state service, common run-scoped runtime, and frozen business handler. */
  constructor(
    private readonly operations: NotificationEventOperationsService,
    private readonly runner: Pick<NatsSafeRedeliveryRunner, 'runOnce'>,
    private readonly handler: CollaborationTaskNotificationHandler
  ) {}

  /** Advances the three durable consumers until each is empty, preserving JetStream progress between process restarts. */
  execute(input: {
    readonly trustedOperator: TrustedReplayOperator
    readonly request: SafeRedeliveryRequest
    readonly maximumPulls: number
  }): Promise<SafeRedeliveryRunRecord> {
    return this.operations.runSafeRedelivery({
      trustedOperator: input.trustedOperator,
      request: input.request,
      maximumPulls: input.maximumPulls,
      runtime: this.runner,
      runtimeInput: {
        approvedSubjects: APPROVED_SUBJECTS,
        contracts: [
          COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
          COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT,
          COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT
        ],
        handle: (event) => this.handleReplayEvent(event)
      }
    })
  }

  /** Reuses the normal typed handler and Inbox identity semantics without introducing an event republish path. */
  private async handleReplayEvent(event: OesCloudEvent): Promise<EventConsumeOutcome> {
    const encoded = encodeCloudEvent(event)
    return this.handler.handle(
      event as CollaborationTaskEvent,
      createInboxIdentity(
        'notification-service__collaboration-task__v1',
        event,
        encoded.body
      )
    )
  }
}
