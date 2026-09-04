import type { SafeRedeliveryRequest } from '@oes/common'
import {
  NotificationEventOperationsService,
  type NotificationEventOperationsRepository,
  type SafeRedeliveryPullOutcome,
  type SafeRedeliveryRuntime
} from '../infrastructure/events/operations/notification-event-operations.service'

/** Verifies Notification-only event operations preserve immutable broker evidence and bounded replay control state. */
describe('NotificationEventOperationsService Unit', () => {
  const now = new Date('2026-07-27T08:00:00.000Z')
  const repository = () => new InMemoryOperationsRepository()

  it('converges duplicate advisory recovery to one unresolved record without fabricating a DLQ transfer or TERM', async () => {
    const store = repository()
    const service = new NotificationEventOperationsService(store, () => now)
    const advisory = {
      stream: 'OES_BUSINESS_EVENTS',
      consumer: 'notification-service__collaboration-task__v1',
      stream_seq: 41,
      consumer_seq: 9,
      deliveries: 5
    }

    await service.captureAdvisoryOnlyRecovery({
      advisory,
      sourceExpiresAt: '2026-08-03T08:00:00.000Z'
    })
    await service.captureAdvisoryOnlyRecovery({
      advisory,
      sourceExpiresAt: '2026-08-03T08:00:00.000Z'
    })

    expect(store.advisories).toEqual([
      expect.objectContaining({
        status: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED',
        sourceStream: 'OES_BUSINESS_EVENTS',
        sourceStreamSequence: 41,
        originalSourceTermination: 'AUTHORITY_UNAVAILABLE'
      })
    ])
    expect(store.audit.map((entry) => entry.action)).toEqual(['ADVISORY_RECORDED'])
  })

  it('records an owner alert, pre-expiry escalation, then unresolved expiry without claiming resolution', async () => {
    const store = repository()
    const service = new NotificationEventOperationsService(store, () => now)
    await service.captureAdvisoryOnlyRecovery({
      advisory: {
        stream: 'OES_BUSINESS_EVENTS',
        consumer: 'notification-service__collaboration-task__v1',
        stream_seq: 42,
        consumer_seq: 10,
        deliveries: 5
      },
      sourceExpiresAt: '2026-07-27T09:00:00.000Z'
    })

    await service.advanceUnresolvedRecoveryEscalations({
      now,
      preExpiryWindowMs: 2 * 60 * 60 * 1_000
    })
    await service.advanceUnresolvedRecoveryEscalations({
      now: new Date('2026-07-27T10:00:00.000Z'),
      preExpiryWindowMs: 2 * 60 * 60 * 1_000
    })

    expect(store.advisories[0]).toMatchObject({ status: 'EXPIRED_UNRESOLVED' })
    expect(store.audit.map((entry) => entry.action)).toEqual([
      'ADVISORY_RECORDED',
      'OWNER_ALERTED',
      'PRE_EXPIRY_ESCALATED',
      'EXPIRED_UNRESOLVED'
    ])
  })

  it('uses a trusted tenant-bound operator to complete bounded replay only after all three run durables are empty', async () => {
    const store = repository()
    const service = new NotificationEventOperationsService(store, () => now)
    const runtime = new SequencedRuntime(['ACKED', 'EMPTY', 'EMPTY', 'EMPTY'])

    await expect(service.runSafeRedelivery({
      trustedOperator: { accountId: 'operator-1', authorizedTenantIds: ['tenant-1'] },
      request: replayRequest(),
      runtime,
      maximumPulls: 10
    })).resolves.toMatchObject({ status: 'COMPLETED', originalSourceTermination: 'NOT_PERFORMED' })

    expect(runtime.calls).toHaveLength(4)
    expect(store.replays).toEqual([
      expect.objectContaining({
        replayRunId: 'run-1',
        status: 'COMPLETED',
        originalSourceTermination: 'NOT_PERFORMED'
      })
    ])
  })

  it('fails closed before broker work for a cross-tenant, untrusted, or unbounded replay request', async () => {
    const service = new NotificationEventOperationsService(repository(), () => now)
    const runtime = new SequencedRuntime([])
    const operator = { accountId: 'operator-1', authorizedTenantIds: ['tenant-1'] }

    await expect(service.runSafeRedelivery({
      trustedOperator: operator,
      request: { ...replayRequest(), tenantScope: ['tenant-2'] },
      runtime,
      maximumPulls: 10
    })).rejects.toThrow('REPLAY_TENANT_SCOPE_NOT_AUTHORIZED')
    await expect(service.runSafeRedelivery({
      trustedOperator: operator,
      request: { ...replayRequest(), requestedBy: 'free-text-user' },
      runtime,
      maximumPulls: 10
    })).rejects.toThrow('REPLAY_TRUSTED_OPERATOR_REQUIRED')
    await expect(service.runSafeRedelivery({
      trustedOperator: operator,
      request: { ...replayRequest(), eventFilter: {} },
      runtime,
      maximumPulls: 10
    })).rejects.toThrow('REPLAY_EVENT_FILTER_REQUIRED')
    expect(runtime.calls).toHaveLength(0)
  })
})

/** Holds only the event-operation persistence effects required to test service behavior without a database. */
class InMemoryOperationsRepository implements NotificationEventOperationsRepository {
  readonly advisories: any[] = []
  readonly replays: any[] = []
  readonly audit: any[] = []

  async ensureAdvisory(record: any) {
    const existing = this.advisories.find((value) => value.consumerName === record.consumerName && value.sourceStream === record.sourceStream && value.sourceStreamSequence === record.sourceStreamSequence)
    if (existing) return { record: existing, created: false }
    this.advisories.push(record)
    this.audit.push({ action: 'ADVISORY_RECORDED' })
    return { record, created: true }
  }

  async listUnresolvedAdvisories() { return this.advisories.filter((value) => value.status === 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED') }
  async markAdvisory(record: any, action: string, status?: string) {
    if (status) record.status = status
    if (action === 'OWNER_ALERTED') record.ownerAlertedAt = new Date()
    if (action === 'PRE_EXPIRY_ESCALATED') record.preExpiryEscalatedAt = new Date()
    this.audit.push({ action })
  }

  async ensureReplay(record: any) {
    const existing = this.replays.find((value) => value.replayRunId === record.replayRunId)
    if (existing) return { record: existing, created: false }
    this.replays.push(record)
    this.audit.push({ action: 'REPLAY_STARTED' })
    return { record, created: true }
  }
  async recordReplayPull(record: any, outcome: string) { this.audit.push({ action: `REPLAY_${outcome}` }) }
  async completeReplay(record: any) { record.status = 'COMPLETED'; record.originalSourceTermination = 'NOT_PERFORMED'; this.audit.push({ action: 'REPLAY_COMPLETED' }) }
  async failReplay(record: any, code: string) { record.status = 'FAILED'; this.audit.push({ action: `REPLAY_FAILED_${code}` }) }
}

/** Simulates common's one-pull runner while keeping the Notification job's bounded completion policy observable. */
class SequencedRuntime implements SafeRedeliveryRuntime {
  readonly calls: unknown[] = []
  constructor(private readonly outcomes: SafeRedeliveryPullOutcome[]) {}
  async runOnce(input: unknown) {
    this.calls.push(input)
    return { kind: this.outcomes.shift() ?? 'EMPTY' as SafeRedeliveryPullOutcome }
  }
}

/** Builds one fully approved three-subject SAFE_REDELIVERY request. */
function replayRequest(): SafeRedeliveryRequest {
  return {
    replayRunId: 'run-1',
    requestedBy: 'operator-1',
    approvedByConsumerOwner: 'notification-owner-1',
    approvedByPlatformOperator: 'platform-operator-1',
    platformApprovalRef: 'approval-1',
    consumerName: 'notification-service__collaboration-task__v1',
    tenantScope: ['tenant-1'],
    eventFilter: {
      eventTypes: [
        'collaboration.task.assigned',
        'collaboration.task.completed',
        'collaboration.task.cancelled'
      ],
      fromSequence: 1
    },
    mode: 'SAFE_REDELIVERY',
    reason: 'operator-approved repair',
    allowExternalSideEffects: false
  }
}
