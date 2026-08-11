import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { DispatchStatus, SendSmsResponse } from '@oes/common/generated/notification_service'
import { NOTIFICATION_DELIVERY_PAYLOAD_PROTECTOR, REPO_NOTIFICATION_DISPATCH } from '../../common/constants/injection-tokens'
import { NotificationDispatch } from '../../domain/aggregates/notification-dispatch.aggregate'
import { INotificationDispatchRepository } from '../../domain/repositories/notification-dispatch.repository'
import { NotificationDeliveryPayloadProtector } from '../../domain/services/notification-delivery-payload-protection.port'
import { SendSmsCommand } from './send-sms.command'
import { prepareAuthDispatch, reject } from './send-email.handler'

/** Accepts only the frozen Auth SMS profiles and queues their encrypted payload after atomic acceptance. */
@CommandHandler(SendSmsCommand)
export class SendSmsHandler implements ICommandHandler<SendSmsCommand, SendSmsResponse> {
  constructor(@Inject(REPO_NOTIFICATION_DISPATCH) private readonly dispatchRepository: INotificationDispatchRepository, @Inject(NOTIFICATION_DELIVERY_PAYLOAD_PROTECTOR) private readonly protector: NotificationDeliveryPayloadProtector) {}

  async execute(command: SendSmsCommand): Promise<SendSmsResponse> {
    const prepared = prepareAuthDispatch(command.request, 'SMS')
    if (typeof prepared === 'string') return reject(prepared)
    try {
      const expiresAt = new Date(Date.now() + 15 * 60_000)
      const digest = createHash('sha256').update(JSON.stringify({ channel: 'SMS', ...prepared, variables: Object.entries(prepared.variables).sort(([a], [b]) => a.localeCompare(b)) })).digest('hex')
      const dispatch = NotificationDispatch.accept({ channel: 'SMS', category: prepared.category, sourceService: command.authority.sourceService, machinePrincipal: command.authority.machinePrincipal, traceId: command.authority.traceId, requestId: command.authority.requestId, recipientAddress: prepared.recipient, recipientDisplayName: prepared.displayName, templateKey: prepared.templateKey, idempotencyKey: prepared.idempotencyKey, commandDigest: digest, protectedPayload: this.protector.protect({ recipient: prepared.recipient, displayName: prepared.displayName, variables: prepared.variables }, expiresAt), protectedPayloadExpiresAt: expiresAt })
      const saved = await this.dispatchRepository.accept(dispatch)
      return { accepted: true, dispatchId: saved.getProps().id, status: DispatchStatus.DISPATCH_STATUS_QUEUED }
    } catch (error) {
      return reject(error instanceof Error && error.message === 'IDEMPOTENCY_CONFLICT' ? 'IDEMPOTENCY_CONFLICT' : 'DISPATCH_ACCEPTANCE_UNAVAILABLE')
    }
  }
}
