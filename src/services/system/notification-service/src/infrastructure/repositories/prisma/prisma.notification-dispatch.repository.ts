import { Injectable } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'
import { NotificationDispatch } from '../../../domain/aggregates/notification-dispatch.aggregate'
import { INotificationDispatchRepository } from '../../../domain/repositories/notification-dispatch.repository'
import { NotificationDispatchMapper } from '../../mappers/notification-dispatch.mapper'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PrismaNotificationDispatchRepository implements INotificationDispatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdempotencyKey(
    sourceService: string,
    machinePrincipal: string,
    channel: string,
    idempotencyKey: string
  ): Promise<NotificationDispatch | null> {
    const record = await this.prisma.notificationDispatch.findUnique({
      where: {
        sourceService_machinePrincipal_channel_idempotencyKey: {
          sourceService,
          machinePrincipal,
          channel: channel as 'EMAIL' | 'SMS',
          idempotencyKey
        }
      }
    })

    return record ? NotificationDispatchMapper.toDomain(record) : null
  }

  /** Persists acceptance, redacted audit, and encrypted outbox together so QUEUED always has durable work. */
  async accept(dispatch: NotificationDispatch): Promise<NotificationDispatch> {
    const persisted = NotificationDispatchMapper.toPersistence(dispatch)
    try {
      const record = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.notificationDispatch.findUnique({
        where: {
          sourceService_machinePrincipal_channel_idempotencyKey: {
            sourceService: persisted.sourceService,
            machinePrincipal: persisted.machinePrincipal,
            channel: persisted.channel,
            idempotencyKey: persisted.idempotencyKey
          }
        }
      })
      if (existing) {
        if (existing.commandDigest !== persisted.commandDigest) {
          throw new Error('IDEMPOTENCY_CONFLICT')
        }
        return existing
      }

      const created = await transaction.notificationDispatch.create({ data: persisted })
      await transaction.notificationDispatchAudit.create({
        data: {
          id: randomUUID(),
          dispatchId: created.id,
          sourceService: created.sourceService,
          machinePrincipal: created.machinePrincipal,
          channel: created.channel,
          category: created.category,
          templateKey: created.templateKey,
          idempotencyRef: createHash('sha256').update(created.idempotencyKey).digest('hex'),
          recipientFingerprint: createHash('sha256').update(created.recipientAddress).digest('hex'),
          traceId: created.traceId,
          requestId: created.requestId,
          result: 'QUEUED'
        }
      })
      await transaction.notificationProviderOutbox.create({
        data: {
          id: randomUUID(),
          dispatchId: created.id,
          channel: created.channel,
          encryptedPayload: created.protectedPayload,
          payloadExpiresAt: created.protectedPayloadExpiresAt
        }
      })
      return created
      })
      return NotificationDispatchMapper.toDomain(record)
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error
      const winner = await this.prisma.notificationDispatch.findUnique({
        where: {
          sourceService_machinePrincipal_channel_idempotencyKey: {
            sourceService: persisted.sourceService,
            machinePrincipal: persisted.machinePrincipal,
            channel: persisted.channel,
            idempotencyKey: persisted.idempotencyKey
          }
        }
      })
      if (!winner) throw error
      if (winner.commandDigest !== persisted.commandDigest) throw new Error('IDEMPOTENCY_CONFLICT')
      return NotificationDispatchMapper.toDomain(winner)
    }
  }
}

/** Recognizes Prisma's concurrent unique-key winner so identical idempotent callers can read it safely. */
function isUniqueConstraintError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'
}
