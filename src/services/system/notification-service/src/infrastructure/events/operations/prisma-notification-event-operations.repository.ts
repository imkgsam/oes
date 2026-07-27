import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type {
  NotificationEventOperationsRepository,
  SafeRedeliveryPullOutcome,
  SafeRedeliveryRunRecord,
  UnresolvedAdvisoryRecoveryRecord
} from './notification-event-operations.service'

/** Persists only Notification-owned mutable recovery/replay state and append-only operational evidence. */
@Injectable()
export class PrismaNotificationEventOperationsRepository
  implements NotificationEventOperationsRepository
{
  /** Creates the repository with access limited to Notification's own database. */
  constructor(private readonly prisma: PrismaService) {}

  /** Inserts one advisory recovery identity once and records its immutable sequence evidence without storing a business message copy. */
  async ensureAdvisory(
    record: UnresolvedAdvisoryRecoveryRecord
  ): Promise<{ readonly record: UnresolvedAdvisoryRecoveryRecord; readonly created: boolean }> {
    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.notificationEventAdvisoryRecovery.createMany({
        data: [{
          id: record.id,
          consumerName: record.consumerName,
          sourceStream: record.sourceStream,
          sourceStreamSequence: BigInt(record.sourceStreamSequence),
          sourceConsumerSequence: BigInt(record.sourceConsumerSequence),
          deliveryAttempts: record.deliveryAttempts,
          sourceExpiresAt: record.sourceExpiresAt,
          status: record.status,
          originalSourceTermination: record.originalSourceTermination
        }],
        skipDuplicates: true
      })
      const stored = await transaction.notificationEventAdvisoryRecovery.findUnique({
        where: {
          consumerName_sourceStream_sourceStreamSequence: {
            consumerName: record.consumerName,
            sourceStream: record.sourceStream,
            sourceStreamSequence: BigInt(record.sourceStreamSequence)
          }
        }
      })
      if (!stored) throw new Error('NOTIFICATION_ADVISORY_RECOVERY_PERSISTENCE_MISSING')
      if (created.count === 1) {
        await transaction.notificationEventAdvisoryAudit.create({
          data: {
            id: randomUUID(),
            recoveryId: stored.id,
            action: 'ADVISORY_RECORDED',
            evidence: advisoryEvidence(stored)
          }
        })
      }
      return { record: toAdvisoryRecord(stored), created: created.count === 1 }
    })
  }

  /** Lists unresolved Notification recoveries so the service can alert and escalate before source retention expires. */
  async listUnresolvedAdvisories(): Promise<readonly UnresolvedAdvisoryRecoveryRecord[]> {
    const records = await this.prisma.notificationEventAdvisoryRecovery.findMany({
      where: { status: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED' },
      orderBy: { sourceExpiresAt: 'asc' }
    })
    return records.map(toAdvisoryRecord)
  }

  /** Advances one unresolved record with an idempotent local audit action and never writes a fabricated DLQ/TERM result. */
  async markAdvisory(
    record: UnresolvedAdvisoryRecoveryRecord,
    action: 'OWNER_ALERTED' | 'PRE_EXPIRY_ESCALATED' | 'EXPIRED_UNRESOLVED',
    status?: 'EXPIRED_UNRESOLVED'
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const where = { id: record.id, status: 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED' as const }
      const update = action === 'OWNER_ALERTED'
        ? { ownerAlertedAt: null }
        : action === 'PRE_EXPIRY_ESCALATED'
          ? { preExpiryEscalatedAt: null }
          : {}
      const changed = await transaction.notificationEventAdvisoryRecovery.updateMany({
        where: { ...where, ...update },
        data: {
          ...(action === 'OWNER_ALERTED' ? { ownerAlertedAt: new Date() } : {}),
          ...(action === 'PRE_EXPIRY_ESCALATED' ? { preExpiryEscalatedAt: new Date() } : {}),
          ...(status ? { status } : {})
        }
      })
      if (changed.count !== 1) return
      await transaction.notificationEventAdvisoryAudit.create({
        data: {
          id: randomUUID(),
          recoveryId: record.id,
          action,
          evidence: {
            consumerName: record.consumerName,
            sourceStream: record.sourceStream,
            sourceStreamSequence: record.sourceStreamSequence,
            originalSourceTermination: record.originalSourceTermination
          }
        }
      })
    })
  }

  /** Creates or resumes one exact replay-run record after preserving its approval and tenant-scope evidence. */
  async ensureReplay(
    record: SafeRedeliveryRunRecord & { readonly request: import('@oes/common').SafeRedeliveryRequest }
  ): Promise<{ readonly record: SafeRedeliveryRunRecord; readonly created: boolean }> {
    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.notificationEventReplayRun.createMany({
        data: [{
          id: record.id,
          replayRunId: record.replayRunId,
          consumerName: record.request.consumerName,
          tenantScope: [...record.request.tenantScope],
          eventFilter: record.request.eventFilter,
          requestedBy: record.request.requestedBy,
          approvedByConsumerOwner: record.request.approvedByConsumerOwner,
          approvedByPlatformOperator: record.request.approvedByPlatformOperator,
          platformApprovalRef: record.request.platformApprovalRef,
          reason: record.request.reason,
          status: record.status,
          originalSourceTermination: record.originalSourceTermination
        }],
        skipDuplicates: true
      })
      const stored = await transaction.notificationEventReplayRun.findUnique({
        where: { replayRunId: record.replayRunId }
      })
      if (!stored) throw new Error('NOTIFICATION_REPLAY_RUN_PERSISTENCE_MISSING')
      if (!sameReplayRequest(stored, record.request)) throw new Error('REPLAY_RUN_IMMUTABLE_EVIDENCE_CONFLICT')
      if (created.count === 1) {
        await transaction.notificationEventReplayAudit.create({
          data: {
            id: randomUUID(),
            replayRunId: stored.replayRunId,
            action: 'REPLAY_STARTED',
            evidence: replayEvidence(record.request)
          }
        })
      }
      if (created.count === 0 && stored.status === 'FAILED') {
        const resumed = await transaction.notificationEventReplayRun.update({
          where: { replayRunId: stored.replayRunId },
          data: { status: 'RUNNING' }
        })
        await transaction.notificationEventReplayAudit.create({
          data: {
            id: randomUUID(),
            replayRunId: resumed.replayRunId,
            action: 'REPLAY_RESUMED',
            evidence: { originalSourceTermination: 'NOT_PERFORMED' }
          }
        })
        return { record: toReplayRunRecord(resumed), created: false }
      }
      return { record: toReplayRunRecord(stored), created: created.count === 1 }
    })
  }

  /** Appends the common runner settlement result without changing the original event or broker-side progress. */
  async recordReplayPull(record: SafeRedeliveryRunRecord, outcome: SafeRedeliveryPullOutcome): Promise<void> {
    await this.prisma.notificationEventReplayAudit.create({
      data: {
        id: randomUUID(),
        replayRunId: record.replayRunId,
        action: replayAuditAction(outcome),
        evidence: { outcome }
      }
    })
  }

  /** Marks an exhausted three-durable replay as complete and explicitly records that no original-source TERM was performed. */
  async completeReplay(record: SafeRedeliveryRunRecord): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const changed = await transaction.notificationEventReplayRun.updateMany({
        where: { replayRunId: record.replayRunId, status: 'RUNNING' },
        data: { status: 'COMPLETED', completedAt: new Date(), originalSourceTermination: 'NOT_PERFORMED' }
      })
      if (changed.count !== 1) return
      await transaction.notificationEventReplayAudit.create({
        data: {
          id: randomUUID(),
          replayRunId: record.replayRunId,
          action: 'REPLAY_COMPLETED',
          evidence: { originalSourceTermination: 'NOT_PERFORMED' }
        }
      })
    })
  }

  /** Marks a bounded replay failure locally so a later invocation can resume its own durable progress rather than recreating another run. */
  async failReplay(record: SafeRedeliveryRunRecord, code: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.notificationEventReplayRun.updateMany({
        where: { replayRunId: record.replayRunId, status: 'RUNNING' },
        data: { status: 'FAILED' }
      })
      await transaction.notificationEventReplayAudit.create({
        data: { id: randomUUID(), replayRunId: record.replayRunId, action: 'REPLAY_FAILED', evidence: { code } }
      })
    })
  }
}

/** Maps a Prisma recovery row into the provider-neutral operations state consumed by the service. */
function toAdvisoryRecord(record: {
  id: string
  consumerName: string
  sourceStream: string
  sourceStreamSequence: bigint
  sourceConsumerSequence: bigint
  deliveryAttempts: number
  sourceExpiresAt: Date
  status: string
  originalSourceTermination: string
  ownerAlertedAt: Date | null
  preExpiryEscalatedAt: Date | null
}): UnresolvedAdvisoryRecoveryRecord {
  if (record.status !== 'UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED' && record.status !== 'EXPIRED_UNRESOLVED')
    throw new Error('NOTIFICATION_ADVISORY_STATUS_INVALID')
  if (record.originalSourceTermination !== 'AUTHORITY_UNAVAILABLE')
    throw new Error('NOTIFICATION_ADVISORY_TERMINATION_STATE_INVALID')
  return {
    id: record.id,
    consumerName: record.consumerName,
    sourceStream: record.sourceStream,
    sourceStreamSequence: Number(record.sourceStreamSequence),
    sourceConsumerSequence: Number(record.sourceConsumerSequence),
    deliveryAttempts: record.deliveryAttempts,
    sourceExpiresAt: record.sourceExpiresAt,
    status: record.status,
    originalSourceTermination: record.originalSourceTermination,
    ...(record.ownerAlertedAt ? { ownerAlertedAt: record.ownerAlertedAt } : {}),
    ...(record.preExpiryEscalatedAt ? { preExpiryEscalatedAt: record.preExpiryEscalatedAt } : {})
  }
}

/** Maps a persisted replay row into its minimal mutable operation state. */
function toReplayRunRecord(record: {
  id: string
  replayRunId: string
  status: string
  originalSourceTermination: string
}): SafeRedeliveryRunRecord {
  if (record.status !== 'RUNNING' && record.status !== 'COMPLETED' && record.status !== 'FAILED')
    throw new Error('NOTIFICATION_REPLAY_STATUS_INVALID')
  if (record.originalSourceTermination !== 'NOT_PERFORMED')
    throw new Error('NOTIFICATION_REPLAY_TERMINATION_STATE_INVALID')
  return {
    id: record.id,
    replayRunId: record.replayRunId,
    status: record.status,
    originalSourceTermination: record.originalSourceTermination
  }
}

/** Preserves only advisory sequence/location facts required to correlate an unresolved recovery with retained broker evidence. */
function advisoryEvidence(record: {
  consumerName: string
  sourceStream: string
  sourceStreamSequence: bigint
  sourceConsumerSequence: bigint
  deliveryAttempts: number
  originalSourceTermination: string
}) {
  return {
    consumerName: record.consumerName,
    sourceStream: record.sourceStream,
    sourceStreamSequence: record.sourceStreamSequence.toString(),
    sourceConsumerSequence: record.sourceConsumerSequence.toString(),
    deliveryAttempts: record.deliveryAttempts,
    originalSourceTermination: record.originalSourceTermination
  }
}

/** Preserves approved replay controls as immutable local evidence without copying any business event body. */
function replayEvidence(request: import('@oes/common').SafeRedeliveryRequest) {
  return {
    requestedBy: request.requestedBy,
    approvedByConsumerOwner: request.approvedByConsumerOwner,
    approvedByPlatformOperator: request.approvedByPlatformOperator,
    platformApprovalRef: request.platformApprovalRef,
    consumerName: request.consumerName,
    tenantScope: [...request.tenantScope],
    eventFilter: request.eventFilter,
    mode: request.mode,
    reason: request.reason,
    allowExternalSideEffects: request.allowExternalSideEffects
  }
}

/** Rejects reuse of a run identifier when any immutable approval, tenant, or filter evidence differs. */
function sameReplayRequest(record: {
  consumerName: string
  tenantScope: unknown
  eventFilter: unknown
  requestedBy: string
  approvedByConsumerOwner: string
  approvedByPlatformOperator: string
  platformApprovalRef: string
  reason: string
}, request: import('@oes/common').SafeRedeliveryRequest): boolean {
  return record.consumerName === request.consumerName &&
    stableJson(record.tenantScope) === stableJson([...request.tenantScope]) &&
    stableJson(record.eventFilter) === stableJson(request.eventFilter) &&
    record.requestedBy === request.requestedBy &&
    record.approvedByConsumerOwner === request.approvedByConsumerOwner &&
    record.approvedByPlatformOperator === request.approvedByPlatformOperator &&
    record.platformApprovalRef === request.platformApprovalRef &&
    record.reason === request.reason
}

/** Produces deterministic comparison text for JSON evidence without treating key insertion order as authorization semantics. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>
    return `{${Object.keys(source).sort().map((key) => `${JSON.stringify(key)}:${stableJson(source[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** Maps common settlement names onto the frozen append-only replay-audit vocabulary. */
function replayAuditAction(outcome: SafeRedeliveryPullOutcome) {
  return `PULL_${outcome}` as 'PULL_EMPTY' | 'PULL_SKIPPED' | 'PULL_ACKED' | 'PULL_RETRY_SCHEDULED' | 'PULL_REQUIRES_DLQ'
}
