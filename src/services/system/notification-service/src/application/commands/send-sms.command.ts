import { SendSmsRequest } from '@oes/common/generated/notification_service'
import { Allow, IsDefined } from 'class-validator'
import { TrustedNotificationDispatchAuthority } from './send-email.command'

export class SendSmsCommand {
  @IsDefined()
  @Allow()
  public readonly request: SendSmsRequest

  constructor(request: SendSmsRequest, public readonly authority: TrustedNotificationDispatchAuthority) {
    this.request = request
  }
}
