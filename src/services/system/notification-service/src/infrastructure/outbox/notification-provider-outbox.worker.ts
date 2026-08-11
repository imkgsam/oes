import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'
import { EMAIL_PROVIDER_PORT, NOTIFICATION_DELIVERY_PAYLOAD_PROTECTOR, SMS_PROVIDER_PORT } from '../../common/constants/injection-tokens'
import { EmailProviderPort } from '../../domain/services/email-provider.port'
import { NotificationDeliveryPayloadProtector } from '../../domain/services/notification-delivery-payload-protection.port'
import { SmsProviderPort } from '../../domain/services/sms-provider.port'
import { NotificationDispatchMapper } from '../mappers/notification-dispatch.mapper'
import { PrismaService } from '../prisma/prisma.service'

const LEASE_MS = 60_000
const LEASE_RENEWAL_MS = 15_000
const PROVIDER_CALL_DEADLINE_MS = 30_000
const MAX_PROVIDER_ATTEMPTS = 5

/** Schedules and atomically leases committed provider jobs so multiple Notification replicas cannot deliver one job together. */
@Injectable()
export class NotificationProviderOutboxWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_DELIVERY_PAYLOAD_PROTECTOR) private readonly protector: NotificationDeliveryPayloadProtector,
    @Inject(EMAIL_PROVIDER_PORT) private readonly email: EmailProviderPort,
    @Inject(SMS_PROVIDER_PORT) private readonly sms: SmsProviderPort
  ) {}

  onModuleInit(): void {
    const interval = pollIntervalMs()
    this.timer = setInterval(() => { void this.runOnce().catch(() => undefined) }, interval)
    this.timer.unref?.()
    void this.runOnce().catch(() => undefined)
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer)
  }

  async runOnce(now = new Date()): Promise<number> {
    const jobs = await this.prisma.notificationProviderOutbox.findMany({
      where: {
        status: { in: ['PENDING', 'RETRYING'] },
        nextAttemptAt: { lte: now },
        OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }]
      },
      take: 25,
      orderBy: { createdAt: 'asc' }
    })
    let claimed = 0
    for (const job of jobs) if (await this.claimAndDeliver(job.id, now)) claimed += 1
    return claimed
  }

  private async claimAndDeliver(id: string, now: Date): Promise<boolean> {
    const leaseOwner = randomUUID()
    const claimed = await this.prisma.notificationProviderOutbox.updateMany({
      where: {
        id,
        status: { in: ['PENDING', 'RETRYING'] },
        nextAttemptAt: { lte: now },
        OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lte: now } }]
      },
      data: { leaseOwner, leaseExpiresAt: new Date(now.valueOf() + LEASE_MS) }
    })
    if (claimed.count !== 1) return false
    const job = await this.prisma.notificationProviderOutbox.findUnique({ where: { id } })
    if (!job || job.leaseOwner !== leaseOwner) return false
    const dispatchRecord = await this.prisma.notificationDispatch.findUnique({ where: { id: job.dispatchId } })
    if (!dispatchRecord) return this.clearLeasedSecret(id, leaseOwner, 'TERMINAL', 'DISPATCH_MISSING', now)
    if (job.payloadExpiresAt <= now) return this.clearLeasedSecret(id, leaseOwner, 'EXPIRED', 'PAYLOAD_EXPIRED', now)

    try {
      const payload = this.protector.unprotect(job.encryptedPayload, now)
      const dispatch = NotificationDispatchMapper.toDomain(dispatchRecord)
      await this.callProviderWithLease(id, leaseOwner, job.channel, dispatch, payload)
      await this.prisma.$transaction(async (transaction) => {
        const settled = await transaction.notificationProviderOutbox.updateMany({
          where: { id, leaseOwner },
          data: { status: 'DELIVERED', encryptedPayload: '', leaseOwner: null, leaseExpiresAt: null }
        })
        if (settled.count !== 1) return
        await transaction.notificationDispatch.update({ where: { id: job.dispatchId }, data: { protectedPayload: '', protectedPayloadExpiresAt: now } })
        await transaction.notificationDispatchAudit.create({ data: safeAudit(dispatch.getProps(), 'DELIVERED') })
      })
    } catch (error) {
      const attempts = job.attempts + 1
      const reason = error instanceof ProviderCallDeadlineError ? 'PROVIDER_CALL_DEADLINE_EXCEEDED' : 'PROVIDER_FAILURE'
      if (attempts >= MAX_PROVIDER_ATTEMPTS) return this.clearLeasedSecret(id, leaseOwner, 'TERMINAL', reason, now, attempts)
      await this.prisma.notificationProviderOutbox.updateMany({
        where: { id, leaseOwner },
        data: { attempts, status: 'RETRYING', nextAttemptAt: new Date(now.valueOf() + retryDelayMs(attempts)), leaseOwner: null, leaseExpiresAt: null }
      })
    }
    return true
  }

  /** Keeps the opaque owner lease fresh while an abort-aware provider call is in flight. */
  private async callProviderWithLease(
    id: string,
    leaseOwner: string,
    channel: 'EMAIL' | 'SMS',
    dispatch: ReturnType<typeof NotificationDispatchMapper.toDomain>,
    payload: Record<string, unknown>
  ): Promise<void> {
    const controller = new AbortController()
    let ownershipLost = false
    const renew = async () => {
      const renewed = await this.prisma.notificationProviderOutbox.updateMany({
        where: { id, leaseOwner, status: { in: ['PENDING', 'RETRYING'] } },
        data: { leaseExpiresAt: new Date(Date.now() + LEASE_MS) }
      })
      if (renewed.count !== 1) { ownershipLost = true; controller.abort() }
    }
    const renewal = setInterval(() => { void renew() }, LEASE_RENEWAL_MS)
    const deadline = setTimeout(() => controller.abort(), PROVIDER_CALL_DEADLINE_MS)
    try {
      if (channel === 'EMAIL') await this.email.send(dispatch, payload, controller.signal)
      else await this.sms.send(dispatch, payload, controller.signal)
      if (controller.signal.aborted) throw new ProviderCallDeadlineError()
      if (ownershipLost) throw new Error('NOTIFICATION_OUTBOX_LEASE_OWNERSHIP_LOST')
    } catch (error) {
      if (controller.signal.aborted && !ownershipLost) throw new ProviderCallDeadlineError()
      throw error
    } finally {
      clearInterval(renewal)
      clearTimeout(deadline)
    }
  }

  /** Clears both encrypted copies in one transaction once a job has a terminal result or expires. */
  private async clearLeasedSecret(id: string, leaseOwner: string, status: 'TERMINAL' | 'EXPIRED', reason: string, now: Date, attempts?: number): Promise<boolean> {
    const job = await this.prisma.notificationProviderOutbox.findUnique({ where: { id } })
    if (!job || job.leaseOwner !== leaseOwner) return false
    await this.prisma.$transaction(async (transaction) => {
      const cleared = await transaction.notificationProviderOutbox.updateMany({
        where: { id, leaseOwner },
        data: { ...(attempts === undefined ? {} : { attempts }), status, encryptedPayload: '', terminalReason: reason, leaseOwner: null, leaseExpiresAt: null }
      })
      if (cleared.count !== 1) return
      await transaction.notificationDispatch.update({ where: { id: job.dispatchId }, data: { protectedPayload: '', protectedPayloadExpiresAt: now } })
      const dispatch = await transaction.notificationDispatch.findUnique({ where: { id: job.dispatchId } })
      if (dispatch) await transaction.notificationDispatchAudit.create({ data: safeAudit(NotificationDispatchMapper.toDomain(dispatch).getProps(), status, reason) })
    })
    return true
  }
}

/** Bounds autonomous polling so a malformed environment cannot create a hot provider loop. */
function pollIntervalMs(): number {
  const value = Number.parseInt(process.env.NOTIFICATION_PROVIDER_OUTBOX_POLL_MS ?? '5000', 10)
  return Number.isInteger(value) && value >= 1_000 && value <= 60_000 ? value : 5_000
}

/** Marks a provider call that exceeded the abort-aware deadline while its lease was actively renewed. */
class ProviderCallDeadlineError extends Error {}

/** Doubles retries from thirty seconds while keeping the queue's recovery window bounded. */
function retryDelayMs(attempts: number): number {
  return Math.min(30_000 * 2 ** (attempts - 1), 15 * 60_000)
}

/** Produces delivery audit facts without including recipient, bearer, variables, or OTP material. */
function safeAudit(dispatch: ReturnType<ReturnType<typeof NotificationDispatchMapper.toDomain>['getProps']>, result: string, reason?: string) {
  return {
    id: randomUUID(), dispatchId: dispatch.id, sourceService: dispatch.sourceService,
    machinePrincipal: dispatch.machinePrincipal, channel: dispatch.channel, category: dispatch.category,
    templateKey: dispatch.templateKey, idempotencyRef: createHash('sha256').update(dispatch.idempotencyKey).digest('hex'),
    recipientFingerprint: createHash('sha256').update(dispatch.recipientAddress).digest('hex'),
    traceId: dispatch.traceId, requestId: dispatch.requestId, result, ...(reason ? { reason } : {})
  }
}
