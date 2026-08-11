import { Injectable } from '@nestjs/common'
import { NotificationDispatchPort, NotificationDispatchResult } from '../../domain/services/notification-dispatch.port'

/** Provides an isolated test double only; Auth runtime composition always uses the trusted Notification gRPC adaptor. */
@Injectable()
export class LocalNotificationDispatchAdaptor implements NotificationDispatchPort {
  async sendAccountInvitationEmail(input: { accountId: string; displayName?: string; email?: string; recipient: string }): Promise<NotificationDispatchResult> { return accepted(`local-account-invite-email-${input.accountId}`) }
  async sendAccountInvitationSms(input: { accountId: string; displayName?: string; phone?: string; recipient: string }): Promise<NotificationDispatchResult> { return accepted(`local-account-invite-sms-${input.accountId}`) }
  async sendAuthOtpEmail(input: { recipient: string; code: string; challengeId: string; maskedDestination?: string; ttlMinutes: number }): Promise<NotificationDispatchResult> { return accepted(`local-email-${input.challengeId}`) }
  async sendAuthOtpSms(input: { recipient: string; code: string; challengeId: string; maskedDestination?: string; ttlMinutes: number }): Promise<NotificationDispatchResult> { return accepted(`local-sms-${input.challengeId}`) }
}

/** Returns acceptance without manufacturing or replacing Auth-owned OTP material. */
function accepted(dispatchId: string): NotificationDispatchResult { return { accepted: true, dispatchId } }
