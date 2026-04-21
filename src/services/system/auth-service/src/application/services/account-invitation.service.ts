import { Inject, Injectable } from '@nestjs/common'
import { NOTIFICATION_DISPATCH_PORT } from '../../common/constants/injection-tokens'
import { NotificationDispatchPort } from '../../domain/services/notification-dispatch.port'

// Dispatches one account invitation through the preferred outbound channel for newly created users.
@Injectable()
export class AccountInvitationService {
  constructor(
    @Inject(NOTIFICATION_DISPATCH_PORT)
    private readonly notificationDispatchPort: NotificationDispatchPort
  ) {}

  async sendInvitation(input: {
    accountId: string
    displayName?: string
    email?: string
    phone?: string
  }): Promise<void> {
    const phone = input.phone?.trim()
    if (phone) {
      await this.notificationDispatchPort.sendAccountInvitationSms({
        accountId: input.accountId,
        displayName: input.displayName,
        phone,
        recipient: phone
      })
      return
    }

    const email = input.email?.trim().toLowerCase()
    if (email) {
      await this.notificationDispatchPort.sendAccountInvitationEmail({
        accountId: input.accountId,
        displayName: input.displayName,
        email,
        recipient: email
      })
    }
  }
}
