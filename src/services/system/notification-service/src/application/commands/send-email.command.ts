import { SendEmailRequest } from '@oes/common/generated/notification_service'
import { Allow, IsDefined } from 'class-validator'

export class SendEmailCommand {
  @IsDefined()
  @Allow()
  public readonly request: SendEmailRequest

  constructor(request: SendEmailRequest) {
    this.request = request
  }
}
