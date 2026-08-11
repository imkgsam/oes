import { Inject, Injectable } from '@nestjs/common'
import { EMAIL_PROVIDER_PORT, NOTIFICATION_DELIVERY_PAYLOAD_PROTECTOR, SMS_PROVIDER_PORT } from '../../common/constants/injection-tokens'
import { EmailProviderPort } from '../../domain/services/email-provider.port'
import { NotificationDeliveryPayloadProtector } from '../../domain/services/notification-delivery-payload-protection.port'
import { SmsProviderPort } from '../../domain/services/sms-provider.port'
import { NotificationDispatchMapper } from '../mappers/notification-dispatch.mapper'
import { PrismaService } from '../prisma/prisma.service'

/** Delivers committed encrypted outbox jobs with bounded retries and never logs delivery payload contents. */
@Injectable()
export class NotificationProviderOutboxWorker {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_DELIVERY_PAYLOAD_PROTECTOR) private readonly protector: NotificationDeliveryPayloadProtector,
    @Inject(EMAIL_PROVIDER_PORT) private readonly email: EmailProviderPort,
    @Inject(SMS_PROVIDER_PORT) private readonly sms: SmsProviderPort
  ) {}

  async runOnce(now = new Date()): Promise<number> {
    const jobs = await this.prisma.notificationProviderOutbox.findMany({
      where: { status: { in: ['PENDING', 'RETRYING'] }, nextAttemptAt: { lte: now } },
      take: 25,
      orderBy: { createdAt: 'asc' }
    })
    for (const job of jobs) await this.deliver(job.id, now)
    return jobs.length
  }

  private async deliver(id: string, now: Date): Promise<void> {
    const job = await this.prisma.notificationProviderOutbox.findUnique({ where: { id } })
    if (!job || !['PENDING', 'RETRYING'].includes(job.status)) return
    if (job.payloadExpiresAt <= now) {
      await this.prisma.notificationProviderOutbox.update({ where: { id }, data: { status: 'EXPIRED', encryptedPayload: '', terminalReason: 'PAYLOAD_EXPIRED' } })
      return
    }
    const dispatchRecord = await this.prisma.notificationDispatch.findUnique({ where: { id: job.dispatchId } })
    if (!dispatchRecord) return
    try {
      const payload = this.protector.unprotect(job.encryptedPayload, now)
      const dispatch = NotificationDispatchMapper.toDomain(dispatchRecord)
      if (job.channel === 'EMAIL') await this.email.send(dispatch, payload)
      else await this.sms.send(dispatch, payload)
      await this.prisma.$transaction([
        this.prisma.notificationProviderOutbox.update({ where: { id }, data: { status: 'DELIVERED', encryptedPayload: '' } }),
        this.prisma.notificationDispatchAudit.create({ data: { id: crypto.randomUUID(), dispatchId: dispatch.getProps().id, sourceService: dispatch.getProps().sourceService, machinePrincipal: dispatch.getProps().machinePrincipal, channel: dispatch.getProps().channel, category: dispatch.getProps().category, templateKey: dispatch.getProps().templateKey, idempotencyRef: 'redacted', recipientFingerprint: 'redacted', traceId: dispatch.getProps().traceId, requestId: dispatch.getProps().requestId, result: 'DELIVERED' } })
      ])
    } catch {
      const attempts = job.attempts + 1
      const terminal = attempts >= 5
      await this.prisma.notificationProviderOutbox.update({ where: { id }, data: terminal ? { attempts, status: 'TERMINAL', encryptedPayload: '', terminalReason: 'PROVIDER_FAILURE' } : { attempts, status: 'RETRYING', nextAttemptAt: new Date(now.valueOf() + attempts * 30_000) } })
    }
  }
}
