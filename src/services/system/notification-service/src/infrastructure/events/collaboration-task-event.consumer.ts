import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
  COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT,
  EventContractError,
  createInboxIdentity,
  decodeCloudEvent,
  retryDelayForAttempt,
  assertNatsTransport,
  type EventConsumeOutcome,
  type NatsPullDelivery,
  type OesCloudEvent,
  type OesEventContract,
  type CollaborationTaskAssignedEventData,
  type CollaborationTaskCompletedEventData,
  type CollaborationTaskCancelledEventData
} from '@oes/common'
import { CollaborationTaskNotificationHandler } from '../../application/events/collaboration-task-notification.handler'

type CollaborationTaskEvent = OesCloudEvent<
  | CollaborationTaskAssignedEventData
  | CollaborationTaskCompletedEventData
  | CollaborationTaskCancelledEventData
>

/** Names the pre-created durable consumer that is the sole Task P1 subscription identity. */
export const NOTIFICATION_COLLABORATION_TASK_CONSUMER_NAME =
  'notification-service__collaboration-task__v1'

/** Lists every and only every frozen business subject accepted by this Notification consumer. */
export const NOTIFICATION_COLLABORATION_TASK_SUBJECTS = [
  'oes.events.collaboration.task.assigned',
  'oes.events.collaboration.task.completed',
  'oes.events.collaboration.task.cancelled'
] as const

/** Transfers a failed raw delivery durably before it terminates its source delivery. */
export interface NotificationEventDlqPort {
  transfer(input: {
    readonly delivery: NatsPullDelivery
    readonly event?: OesCloudEvent
    readonly errorClass: 'NON_RETRYABLE' | 'EVENT_ID_CONFLICT'
    readonly code: string
  }): Promise<{ readonly kind: 'TERMINATED' | 'DLQ_RETRY_REQUIRED' }>
}

/** Validates exact Task event deliveries and settles the durable message only after Notification-local processing succeeds. */
export class CollaborationTaskEventConsumer {
  /** Creates the consumer with a typed business handler and consumer-owned durable DLQ transfer boundary. */
  constructor(
    private readonly handler: CollaborationTaskNotificationHandler,
    private readonly dlq: NotificationEventDlqPort
  ) {}

  /** Processes one delivery from the pre-created durable without exposing NATS client objects to application code. */
  async handleDelivery(delivery: NatsPullDelivery): Promise<EventConsumeOutcome> {
    let event: OesCloudEvent | undefined
    try {
      const contract = contractForSubject(delivery.subject)
      event = decodeCloudEvent(delivery.body, contract)
      assertNatsTransport({ subject: delivery.subject, headers: delivery.headers, event, contract })
      assertTaskAggregate(event as CollaborationTaskEvent)
      const identity = createInboxIdentity(
        NOTIFICATION_COLLABORATION_TASK_CONSUMER_NAME,
        event,
        delivery.body
      )
      const outcome = await this.handler.handle(event as CollaborationTaskEvent, identity)
      return this.settle(delivery, event, outcome)
    } catch (error) {
      if (!(error instanceof EventContractError)) {
        await delivery.nak(retryDelayForAttempt(delivery.deliveryAttempt))
        return {
          kind: 'RETRYABLE_FAILURE',
          code: 'NOTIFICATION_INBOX_WRITE_FAILED',
          delayMs: retryDelayForAttempt(delivery.deliveryAttempt)
        }
      }
      return this.transferToDlq(delivery, event, 'NON_RETRYABLE', error.code)
    }
  }

  /** Maps typed outcomes to explicit ACK, bounded delayed NAK, or a consumer-specific durable DLQ transfer. */
  private async settle(
    delivery: NatsPullDelivery,
    event: OesCloudEvent,
    outcome: EventConsumeOutcome
  ): Promise<EventConsumeOutcome> {
    if (outcome.kind === 'APPLIED' || outcome.kind === 'DUPLICATE') {
      await delivery.ack()
      return outcome
    }
    if (outcome.kind === 'RETRYABLE_FAILURE') {
      const delayMs = outcome.delayMs ?? retryDelayForAttempt(delivery.deliveryAttempt)
      await delivery.nak(delayMs)
      return { ...outcome, delayMs }
    }
    if (outcome.kind === 'EVENT_ID_CONFLICT') {
      return this.transferToDlq(delivery, event, 'EVENT_ID_CONFLICT', outcome.code)
    }
    return this.transferToDlq(
      delivery,
      event,
      'NON_RETRYABLE',
      outcome.kind === 'STALE_IGNORED' ? 'NOTIFICATION_STALE_OUTCOME_FORBIDDEN' : outcome.code
    )
  }

  /** Publishes to the consumer-specific DLQ before TERM, or schedules a bounded retry when that transfer cannot complete. */
  private async transferToDlq(
    delivery: NatsPullDelivery,
    event: OesCloudEvent | undefined,
    errorClass: 'NON_RETRYABLE' | 'EVENT_ID_CONFLICT',
    code: string
  ): Promise<EventConsumeOutcome> {
    try {
      const transfer = await this.dlq.transfer({ delivery, event, errorClass, code })
      if (transfer.kind === 'TERMINATED') {
        return errorClass === 'EVENT_ID_CONFLICT'
          ? { kind: 'EVENT_ID_CONFLICT', code }
          : { kind: 'NON_RETRYABLE_FAILURE', code }
      }
    } catch {
      // Fall through to the same bounded retry path used for a rejected DLQ publication.
    }
    const delayMs = retryDelayForAttempt(delivery.deliveryAttempt)
    await delivery.nak(delayMs)
    return { kind: 'RETRYABLE_FAILURE', code: 'NOTIFICATION_DLQ_TRANSFER_FAILED', delayMs }
  }
}

/** Selects a contract only from the frozen exact NATS subject allowlist. */
function contractForSubject(subject: string): OesEventContract {
  switch (subject) {
    case 'oes.events.collaboration.task.assigned':
      return COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT
    case 'oes.events.collaboration.task.completed':
      return COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT
    case 'oes.events.collaboration.task.cancelled':
      return COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT
    default:
      throw new EventContractError('EVENT_SUBJECT_MISMATCH')
  }
}

/** Enforces the Task aggregate triple-check that the generic owner contract intentionally does not own. */
function assertTaskAggregate(event: CollaborationTaskEvent): void {
  if (event.oesaggregatetype !== 'TASK' || event.oesaggregateid !== event.data.taskId) {
    throw new EventContractError('EVENT_TASK_AGGREGATE_MISMATCH')
  }
}
