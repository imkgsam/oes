import { SendSmsRequest } from '@oes/common/generated/notification_service'
import { Allow, IsDefined } from 'class-validator'

export class SendSmsCommand {
  @IsDefined()
  @Allow()
  public readonly request: SendSmsRequest

  constructor(request: SendSmsRequest) {
    this.request = request
  }
}
