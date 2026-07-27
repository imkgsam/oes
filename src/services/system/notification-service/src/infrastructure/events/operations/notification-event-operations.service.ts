import {
  recoverMaxDeliveryToDlq,
  type NatsSafeRedeliveryRunOptions,
  type SafeRedeliveryRequest
} from '@oes/common'

/** Names the immutable outcome that broker advisories can prove without a source delivery token. */
export const UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED =
  'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED' as const

/** Defines the target consumer identity that owns all persistence in this operations module. */
export const NOTIFICATION_TASK_CONSUMER_NAME =
  'notification-service__collaboration-task__v1'

/** Holds one trusted, deployment-provided operator identity and its tenant authorization boundary. */
export interface TrustedReplayOperator {
  readonly accountId: string
  readonly authorizedTenantIds: readonly string[]
}

/** Carries the immutable advisory facts Notification is permitted to retain after a source delivery has been lost. */
export interface UnresolvedAdvisoryRecoveryRecord {
  readonly id: string
  readonly consumerName: string
  readonly sourceStream: string
  readonly sourceStreamSequence: number
  readonly sourceConsumerSequence: number
  readonly deliveryAttempts: number
  readonly sourceExpiresAt: Date
  readonly status: typeof UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED | 'EXPIRED_UNRESOLVED'
  readonly originalSourceTermination: 'AUTHORITY_UNAVAILABLE'
  readonly ownerAlertedAt?: Date
  readonly preExpiryEscalatedAt?: Date
}

/** Carries one replay-run operation record without copying business messages out of JetStream. */
export interface SafeRedeliveryRunRecord {
  readonly id: string
  readonly replayRunId: string
  readonly status: 'RUNNING' | 'COMPLETED' | 'FAILED'
  readonly originalSourceTermination: 'NOT_PERFORMED'
}

/** Defines the service-owned persistence seam for mutable operations state and append-only audit evidence. */
export interface NotificationEventOperationsRepository {
  ensureAdvisory(record: UnresolvedAdvisoryRecoveryRecord): Promise<{ readonly record: UnresolvedAdvisoryRecoveryRecord; readonly created: boolean }>
  listUnresolvedAdvisories(): Promise<readonly UnresolvedAdvisoryRecoveryRecord[]>
  markAdvisory(record: UnresolvedAdvisoryRecoveryRecord, action: 'OWNER_ALERTED' | 'PRE_EXPIRY_ESCALATED' | 'EXPIRED_UNRESOLVED', status?: 'EXPIRED_UNRESOLVED'): Promise<void>
  ensureReplay(record: SafeRedeliveryRunRecord & { readonly request: SafeRedeliveryRequest }): Promise<{ readonly record: SafeRedeliveryRunRecord; readonly created: boolean }>
  recordReplayPull(record: SafeRedeliveryRunRecord, outcome: SafeRedeliveryPullOutcome): Promise<void>
  completeReplay(record: SafeRedeliveryRunRecord): Promise<void>
  failReplay(record: SafeRedeliveryRunRecord, code: string): Promise<void>
}

/** Narrows the common replay runtime to the operation job calls Notification is allowed to make. */
export interface SafeRedeliveryRuntime {
  runOnce(input: NatsSafeRedeliveryRunOptions): Promise<{ readonly kind: SafeRedeliveryPullOutcome }>
}

/** Names the normalized common replay settlement results persisted in Notification's local audit. */
export type SafeRedeliveryPullOutcome =
  | 'EMPTY'
  | 'SKIPPED'
  | 'ACKED'
  | 'RETRY_SCHEDULED'
  | 'REQUIRES_DLQ'

/** Owns Notification's mutable advisory/replay records while retaining immutable delivery evidence in JetStream. */
export class NotificationEventOperationsService {
  /** Receives only a Notification-local persistence port and a clock for deterministic expiry escalation. */
  constructor(
    private readonly repository: NotificationEventOperationsRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  /** Stores an advisory-only failure as unresolved, deliberately without creating a DLQ record or sending ACK/TERM. */
  async captureAdvisoryOnlyRecovery(input: {
    readonly advisory: unknown
    readonly sourceExpiresAt: string
  }): Promise<UnresolvedAdvisoryRecoveryRecord> {
    const recovery = await recoverMaxDeliveryToDlq({ advisory: input.advisory })
    if (recovery.kind !== UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED)
      throw new Error('NOTIFICATION_ADVISORY_RECOVERY_OUTCOME_INVALID')
    const sourceExpiresAt = new Date(input.sourceExpiresAt)
    if (Number.isNaN(sourceExpiresAt.getTime()) || sourceExpiresAt <= this.now())
      throw new Error('ADVISORY_SOURCE_EXPIRY_INVALID')
    const record: UnresolvedAdvisoryRecoveryRecord = {
      id: `advisory:${recovery.advisory.consumer}:${recovery.advisory.stream}:${recovery.advisory.streamSequence}`,
      consumerName: recovery.advisory.consumer,
      sourceStream: recovery.advisory.stream,
      sourceStreamSequence: recovery.advisory.streamSequence,
      sourceConsumerSequence: recovery.advisory.consumerSequence,
      deliveryAttempts: recovery.advisory.deliveries,
      sourceExpiresAt,
      status: UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED,
      originalSourceTermination: 'AUTHORITY_UNAVAILABLE'
    }
    const persisted = await this.repository.ensureAdvisory(record)
    return persisted.record
  }

  /** Appends owner-alert, pre-expiry, and expiry state transitions without reclassifying an unresolved advisory as resolved. */
  async advanceUnresolvedRecoveryEscalations(input: {
    readonly now: Date
    readonly preExpiryWindowMs: number
  }): Promise<void> {
    if (!Number.isInteger(input.preExpiryWindowMs) || input.preExpiryWindowMs < 1)
      throw new Error('ADVISORY_PRE_EXPIRY_WINDOW_INVALID')
    const records = await this.repository.listUnresolvedAdvisories()
    for (const record of records) {
      if (!record.ownerAlertedAt)
        await this.repository.markAdvisory(record, 'OWNER_ALERTED')
      if (record.sourceExpiresAt <= input.now) {
        await this.repository.markAdvisory(record, 'EXPIRED_UNRESOLVED', 'EXPIRED_UNRESOLVED')
        continue
      }
      if (!record.preExpiryEscalatedAt && record.sourceExpiresAt.getTime() - input.now.getTime() <= input.preExpiryWindowMs)
        await this.repository.markAdvisory(record, 'PRE_EXPIRY_ESCALATED')
    }
  }

  /** Runs a bounded, tenant-authorized replay and marks completion only after one EMPTY pull from each exact durable. */
  async runSafeRedelivery(input: {
    readonly trustedOperator: TrustedReplayOperator
    readonly request: SafeRedeliveryRequest
    readonly runtime: SafeRedeliveryRuntime
    readonly maximumPulls: number
    readonly runtimeInput?: Omit<NatsSafeRedeliveryRunOptions, 'stream' | 'expiresMs' | 'request'>
  }): Promise<SafeRedeliveryRunRecord> {
    assertTrustedReplayRequest(input.trustedOperator, input.request)
    if (!Number.isInteger(input.maximumPulls) || input.maximumPulls < 3)
      throw new Error('REPLAY_MAXIMUM_PULLS_INVALID')
    const initial: SafeRedeliveryRunRecord & { readonly request: SafeRedeliveryRequest } = {
      id: `replay:${input.request.replayRunId}`,
      replayRunId: input.request.replayRunId,
      status: 'RUNNING',
      originalSourceTermination: 'NOT_PERFORMED',
      request: input.request
    }
    const persisted = await this.repository.ensureReplay(initial)
    const record = persisted.record
    if (record.status === 'COMPLETED') return record
    let emptyDurables = 0
    try {
      for (let pull = 0; pull < input.maximumPulls; pull += 1) {
        const outcome = await input.runtime.runOnce({
          stream: 'OES_BUSINESS_EVENTS',
          expiresMs: 1_000,
          request: input.request,
          ...(input.runtimeInput ?? {})
        } as NatsSafeRedeliveryRunOptions)
        await this.repository.recordReplayPull(record, outcome.kind)
        emptyDurables = outcome.kind === 'EMPTY' ? emptyDurables + 1 : 0
        if (emptyDurables === 3) {
          await this.repository.completeReplay(record)
          return { ...record, status: 'COMPLETED', originalSourceTermination: 'NOT_PERFORMED' }
        }
      }
    } catch (error) {
      await this.repository.failReplay(record, replayFailureCode(error))
      throw error
    }
    await this.repository.failReplay(record, 'REPLAY_MAXIMUM_PULLS_EXHAUSTED')
    throw new Error('REPLAY_MAXIMUM_PULLS_EXHAUSTED')
  }
}

/** Enforces deployment-trusted operator identity, exact consumer ownership, and tenant authorization before any broker activity. */
function assertTrustedReplayRequest(operator: TrustedReplayOperator, request: SafeRedeliveryRequest): void {
  if (!operator.accountId?.trim() || request.requestedBy !== operator.accountId)
    throw new Error('REPLAY_TRUSTED_OPERATOR_REQUIRED')
  if (!operator.authorizedTenantIds.length || request.tenantScope.some((tenantId) => !operator.authorizedTenantIds.includes(tenantId)))
    throw new Error('REPLAY_TENANT_SCOPE_NOT_AUTHORIZED')
  if (request.consumerName !== NOTIFICATION_TASK_CONSUMER_NAME)
    throw new Error('REPLAY_CONSUMER_NOT_APPROVED')
  if (request.mode !== 'SAFE_REDELIVERY' || request.allowExternalSideEffects !== false)
    throw new Error('REPLAY_MODE_NOT_ALLOWED')
  if (!request.tenantScope.length) throw new Error('REPLAY_TENANT_SCOPE_REQUIRED')
  if (!(request.eventFilter.eventTypes?.length || request.eventFilter.eventIds?.length || request.eventFilter.fromSequence || request.eventFilter.fromTime))
    throw new Error('REPLAY_EVENT_FILTER_REQUIRED')
}

/** Reduces thrown runtime errors to a bounded audit code without persisting arbitrary error messages or stacks. */
function replayFailureCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : 'REPLAY_RUNTIME_FAILURE'
}
