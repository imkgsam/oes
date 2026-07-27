import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
  COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT
} from '@oes/common/contracts'
import {
  EventContractError,
  validateCloudEvent,
  type EventPublishOutcome,
  type OesCloudEvent,
  type OesEventContract
} from '@oes/common'

/** Describes one lease-held Collaboration outbox record without exposing Prisma to relay logic. */
export interface CollaborationTaskOutboxClaim {
  readonly eventId: string
  readonly eventType: string
  readonly eventVersion: number
  readonly cloudEventBody: unknown
  readonly attemptCount: number
  readonly leaseToken: string
}

/** Defines the Collaboration-owned persistence operations needed by its relay worker. */
export interface CollaborationTaskOutboxStore {
  claimPending(input: { readonly now: Date; readonly limit: number; readonly leaseMs: number }): Promise<readonly CollaborationTaskOutboxClaim[]>
  markPublished(input: { readonly eventId: string; readonly leaseToken: string; readonly publishedAt: Date }): Promise<void>
  scheduleRetry(input: { readonly eventId: string; readonly leaseToken: string; readonly code: string; readonly message: string; readonly nextAttemptAt: Date }): Promise<void>
  quarantine(input: { readonly eventId: string; readonly leaseToken: string; readonly code: string; readonly message: string; readonly quarantinedAt: Date }): Promise<void>
}

export const COLLABORATION_TASK_OUTBOX_STORE = Symbol('COLLABORATION_TASK_OUTBOX_STORE')

/** Defines the injected common transport adapter boundary used by the Collaboration relay. */
export interface CollaborationPublicEventPublisher {
  publish<TData>(event: OesCloudEvent<TData>, contract: OesEventContract<TData>): Promise<EventPublishOutcome>
}

export const COLLABORATION_PUBLIC_EVENT_PUBLISHER = Symbol('COLLABORATION_PUBLIC_EVENT_PUBLISHER')

/** Relays only Collaboration-owned immutable outbox bodies and records broker outcomes locally. */
@Injectable()
export class CollaborationTaskOutboxRelay {
  private static readonly leaseMs = 30_000
  private static readonly batchSize = 100
  private readonly logger = new Logger(CollaborationTaskOutboxRelay.name)

  constructor(
    @Inject(COLLABORATION_TASK_OUTBOX_STORE) private readonly outbox: CollaborationTaskOutboxStore,
    @Inject(COLLABORATION_PUBLIC_EVENT_PUBLISHER) private readonly publisher: CollaborationPublicEventPublisher
  ) {}

  /** relayOnce claims a bounded batch, publishes canonical bodies, and persists each definitive delivery outcome. */
  async relayOnce(now = new Date()): Promise<void> {
    const rows = await this.outbox.claimPending({
      now,
      limit: CollaborationTaskOutboxRelay.batchSize,
      leaseMs: CollaborationTaskOutboxRelay.leaseMs
    })
    for (const row of rows) {
      await this.relayClaim(row, now)
    }
  }

  /** relayClaim validates a stored immutable body before sending it through the injected common adapter. */
  private async relayClaim(row: CollaborationTaskOutboxClaim, now: Date): Promise<void> {
    try {
      const contract = contractFor(row.eventType, row.eventVersion)
      const event = validateStoredCloudEvent(row.cloudEventBody, contract)
      const outcome = await this.publisher.publish(event, contract)
      await this.recordOutcome(row, outcome, now)
    } catch (error) {
      if (error instanceof EventContractError) {
        await this.outbox.quarantine({
          eventId: row.eventId,
          leaseToken: row.leaseToken,
          code: error.code,
          message: error.message,
          quarantinedAt: now
        })
        this.logger.error(`Collaboration outbox quarantined: eventId=${row.eventId}; code=${error.code}`)
        return
      }
      await this.outbox.scheduleRetry({
        eventId: row.eventId,
        leaseToken: row.leaseToken,
        code: 'EVENT_RELAY_FAILED',
        message: safeErrorMessage(error),
        nextAttemptAt: retryAt(now, row.attemptCount)
      })
    }
  }

  /** recordOutcome records acknowledgement, bounded retry, or deterministic quarantine without rebuilding the body. */
  private async recordOutcome(row: CollaborationTaskOutboxClaim, outcome: EventPublishOutcome, now: Date): Promise<void> {
    if (outcome.kind === 'ACKNOWLEDGED') {
      await this.outbox.markPublished({ eventId: row.eventId, leaseToken: row.leaseToken, publishedAt: now })
      return
    }
    if (outcome.kind === 'RETRYABLE_FAILURE') {
      await this.outbox.scheduleRetry({
        eventId: row.eventId,
        leaseToken: row.leaseToken,
        code: outcome.code,
        message: outcome.message,
        nextAttemptAt: retryAt(now, row.attemptCount)
      })
      return
    }
    await this.outbox.quarantine({
      eventId: row.eventId,
      leaseToken: row.leaseToken,
      code: outcome.code,
      message: outcome.message,
      quarantinedAt: now
    })
    this.logger.error(`Collaboration outbox quarantined: eventId=${row.eventId}; code=${outcome.code}`)
  }
}

/** Resolves only the three frozen Collaboration Task contracts and rejects every other type/version pair. */
function contractFor(eventType: string, eventVersion: number): OesEventContract {
  const contract = [
    COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
    COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT,
    COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT
  ].find((candidate) => candidate.eventType === eventType && candidate.eventVersion === eventVersion)
  if (!contract) throw new EventContractError('EVENT_CONTRACT_UNSUPPORTED')
  return contract
}

/** Validates and freezes the persisted body instead of reconstructing event fields in the relay. */
function validateStoredCloudEvent<TData>(body: unknown, contract: OesEventContract<TData>): OesCloudEvent<TData> {
  return validateCloudEvent(body, contract)
}

/** Calculates capped exponential retry delays so transient broker failures do not spin forever. */
function retryAt(now: Date, attemptCount: number): Date {
  const delayMs = Math.min(300_000, 1_000 * 2 ** Math.min(attemptCount, 8))
  return new Date(now.getTime() + delayMs)
}

/** Produces a bounded operational message without serializing arbitrary provider error objects. */
function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'unexpected relay failure'
  return message.slice(0, 1_000)
}
