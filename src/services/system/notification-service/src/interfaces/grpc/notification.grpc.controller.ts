import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import {
  GrpcExceptionFilter
} from '../../../../../../common/dist/core/filters'
import {
  NotificationServiceController,
  NotificationServiceControllerMethods,
  SendEmailRequest,
  SendEmailResponse,
  SendSmsResponse,
  SendSmsRequest
} from '@oes/common/generated/notification_service'
import { SendEmailCommand, SendSmsCommand } from '../../application/commands'

@UseFilters(GrpcExceptionFilter)
@Controller()
@NotificationServiceControllerMethods()
export class NotificationGrpcController implements NotificationServiceController {
  constructor(private readonly commandBus: ValidatingCommandBus) {}

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    return this.commandBus.execute(new SendEmailCommand(request))
  }

  async sendSms(request: SendSmsRequest): Promise<SendSmsResponse> {
    return this.commandBus.execute(new SendSmsCommand(request))
  }
}
