import { Injectable } from '@nestjs/common'
import { EmailService } from '../services/email.service'
import { SmsService } from '../services/sms.service'
import {
  NotificationDispatchPort,
  NotificationDispatchResult
} from '../../domain/services/notification-dispatch.port'

@Injectable()
export class LocalNotificationDispatchAdaptor implements NotificationDispatchPort {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService
  ) {}

  async sendAuthOtpEmail(input: {
    recipient: string
    code: string
    challengeId: string
    maskedDestination?: string
    ttlMinutes: number
  }): Promise<NotificationDispatchResult> {
    const effectiveCode = await this.emailService.sendEmailVerificationCode(
      input.recipient,
      input.code
    )

    return {
      accepted: true,
      dispatchId: `local-email-${input.challengeId}`,
      effectiveCode
    }
  }

  async sendAuthOtpSms(input: {
    recipient: string
    code: string
    challengeId: string
    maskedDestination?: string
    ttlMinutes: number
  }): Promise<NotificationDispatchResult> {
    const effectiveCode = await this.smsService.sendPhoneVerificationCode(
      input.recipient,
      input.code
    )

    return {
      accepted: true,
      dispatchId: `local-sms-${input.challengeId}`,
      effectiveCode
    }
  }
}
