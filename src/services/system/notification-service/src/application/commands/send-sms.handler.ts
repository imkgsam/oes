import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  DispatchStatus,
  NotificationCategory,
  SendDispatchResponse
} from '@oes/common/generated/notification_service'
import { Inject } from '@nestjs/common'
import { REPO_NOTIFICATION_DISPATCH, SMS_PROVIDER_PORT } from '../../common/constants/injection-tokens'
import {
  NotificationCategory as NotificationCategoryType,
  NotificationDispatch
} from '../../domain/aggregates/notification-dispatch.aggregate'
import { INotificationDispatchRepository } from '../../domain/repositories/notification-dispatch.repository'
import { SmsProviderPort } from '../../domain/services/sms-provider.port'
import { SendSmsCommand } from './send-sms.command'

@CommandHandler(SendSmsCommand)
export class SendSmsHandler implements ICommandHandler<SendSmsCommand, SendDispatchResponse> {
  constructor(
    @Inject(REPO_NOTIFICATION_DISPATCH)
    private readonly dispatchRepository: INotificationDispatchRepository,
    @Inject(SMS_PROVIDER_PORT)
    private readonly smsProvider: SmsProviderPort
  ) {}

  async execute(command: SendSmsCommand): Promise<SendDispatchResponse> {
    const request = command.request
    const recipient = request.recipient?.address?.trim()
    const templateKey = request.templateKey?.trim()
    const idempotencyKey = request.idempotencyKey?.trim()
    const tenantId = request.source?.tenantId?.trim()
    const sourceService = request.source?.sourceService?.trim()

    if (!recipient) {
      return this.reject('INVALID_RECIPIENT')
    }

    if (!templateKey) {
      return this.reject('TEMPLATE_NOT_FOUND')
    }

    if (!idempotencyKey || !tenantId || !sourceService) {
      return this.reject('INTERNAL_REJECTION')
    }

    const existing = await this.dispatchRepository.findByIdempotencyKey(idempotencyKey)
    if (existing) {
      return this.accept(existing)
    }

    const dispatch = NotificationDispatch.accept({
      channel: 'SMS',
      category: this.mapCategory(request.category),
      sourceService,
      tenantId,
      orgId: request.source?.orgId || undefined,
      traceId: request.source?.traceId || undefined,
      requestId: request.source?.requestId || undefined,
      recipientAddress: recipient,
      recipientDisplayName: request.recipient?.displayName || undefined,
      templateKey,
      variablePayload: this.mapVariables(request.variables ?? []),
      idempotencyKey
    })

    const saved = await this.dispatchRepository.save(dispatch)
    await this.smsProvider.send(saved)

    return this.accept(saved)
  }

  private accept(dispatch: NotificationDispatch): SendDispatchResponse {
    return {
      accepted: true,
      dispatchId: dispatch.getProps().id,
      status: DispatchStatus.DISPATCH_STATUS_ACCEPTED
    }
  }

  private reject(reason: string): SendDispatchResponse {
    return {
      accepted: false,
      dispatchId: '',
      status: DispatchStatus.DISPATCH_STATUS_REJECTED,
      rejectionReason: reason
    }
  }

  private mapVariables(
    variables: Array<{ key?: string; value?: string }>
  ): Record<string, string> {
    return variables.reduce<Record<string, string>>((acc, item) => {
      if (item.key) {
        acc[item.key] = item.value ?? ''
      }
      return acc
    }, {})
  }

  private mapCategory(category?: NotificationCategory): NotificationCategoryType {
    switch (category) {
      case NotificationCategory.NOTIFICATION_CATEGORY_AUTH_SECURITY_ALERT:
        return 'AUTH_SECURITY_ALERT'
      case NotificationCategory.NOTIFICATION_CATEGORY_WORKFLOW_REMINDER:
        return 'WORKFLOW_REMINDER'
      case NotificationCategory.NOTIFICATION_CATEGORY_BUSINESS_STATUS:
        return 'BUSINESS_STATUS'
      case NotificationCategory.NOTIFICATION_CATEGORY_AUTH_OTP:
      default:
        return 'AUTH_OTP'
    }
  }
}
