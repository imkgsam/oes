import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { CollaborationTaskOutboxStatus, Prisma } from '../../../prisma/generated/prisma'
import {
  CollaborationTaskOutboxClaim,
  CollaborationTaskOutboxStore
} from './collaboration-task-outbox.relay'
import { PrismaService } from '../prisma/prisma.service'

/** Implements lease-protected relay state transitions against Collaboration's own outbox table. */
@Injectable()
export class PrismaCollaborationTaskOutboxStore implements CollaborationTaskOutboxStore {
  constructor(private readonly prisma: PrismaService) {}

  /** claimPending acquires short owner-local leases with compare-and-set updates to reduce concurrent duplicate sends. */
  async claimPending(input: { readonly now: Date; readonly limit: number; readonly leaseMs: number }): Promise<readonly CollaborationTaskOutboxClaim[]> {
    const candidates = await this.prisma.collaborationTaskOutbox.findMany({
      where: {
        status: CollaborationTaskOutboxStatus.PENDING,
        nextAttemptAt: { lte: input.now },
        OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: input.now } }]
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      take: input.limit
    })
    const claimed: CollaborationTaskOutboxClaim[] = []
    for (const candidate of candidates) {
      const leaseToken = randomUUID()
      const leaseExpiresAt = new Date(input.now.getTime() + input.leaseMs)
      const result = await this.prisma.collaborationTaskOutbox.updateMany({
        where: {
          eventId: candidate.eventId,
          status: CollaborationTaskOutboxStatus.PENDING,
          nextAttemptAt: { lte: input.now },
          OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: input.now } }]
        },
        data: { leaseToken, leaseExpiresAt }
      })
      if (result.count !== 1) continue
      claimed.push({
        eventId: candidate.eventId,
        eventType: candidate.eventType,
        eventVersion: candidate.eventVersion,
        cloudEventBody: candidate.cloudEventBody,
        attemptCount: candidate.attemptCount,
        leaseToken
      })
    }
    return claimed
  }

  /** markPublished clears an owned lease only after the JetStream adapter reports acknowledgement. */
  async markPublished(input: { readonly eventId: string; readonly leaseToken: string; readonly publishedAt: Date }): Promise<void> {
    await this.prisma.collaborationTaskOutbox.updateMany({
      where: pendingLease(input.eventId, input.leaseToken),
      data: {
        status: CollaborationTaskOutboxStatus.PUBLISHED,
        publishedAt: input.publishedAt,
        leaseToken: null,
        leaseExpiresAt: null,
        lastErrorCode: null,
        lastErrorMessage: null
      }
    })
  }

  /** scheduleRetry returns an owned lease to pending state with capped relay retry evidence. */
  async scheduleRetry(input: { readonly eventId: string; readonly leaseToken: string; readonly code: string; readonly message: string; readonly nextAttemptAt: Date }): Promise<void> {
    await this.prisma.collaborationTaskOutbox.updateMany({
      where: pendingLease(input.eventId, input.leaseToken),
      data: {
        attemptCount: { increment: 1 },
        nextAttemptAt: input.nextAttemptAt,
        leaseToken: null,
        leaseExpiresAt: null,
        lastErrorCode: input.code,
        lastErrorMessage: input.message
      }
    })
  }

  /** quarantine permanently stops deterministic publication failures and retains their operational evidence. */
  async quarantine(input: { readonly eventId: string; readonly leaseToken: string; readonly code: string; readonly message: string; readonly quarantinedAt: Date }): Promise<void> {
    await this.prisma.collaborationTaskOutbox.updateMany({
      where: pendingLease(input.eventId, input.leaseToken),
      data: {
        status: CollaborationTaskOutboxStatus.QUARANTINED,
        quarantinedAt: input.quarantinedAt,
        leaseToken: null,
        leaseExpiresAt: null,
        lastErrorCode: input.code,
        lastErrorMessage: input.message
      }
    })
  }
}

/** pendingLease keeps relay state changes scoped to the worker that successfully claimed a PENDING row. */
function pendingLease(eventId: string, leaseToken: string): Prisma.CollaborationTaskOutboxWhereInput {
  return { eventId, status: CollaborationTaskOutboxStatus.PENDING, leaseToken }
}
