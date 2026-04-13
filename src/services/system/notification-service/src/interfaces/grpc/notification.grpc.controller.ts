import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingCommandBus } from '@oes/common/cqrs'
import {
  GrpcExceptionFilter
} from '../../../../../../common/dist/core/filters'
import {
  NotificationServiceController,
  NotificationServiceControllerMethods,
  SendDispatchResponse,
  SendEmailRequest,
  SendSmsRequest
} from '@oes/common/generated/notification_service'
import { SendEmailCommand, SendSmsCommand } from '../../application/commands'

@UseFilters(GrpcExceptionFilter)
@Controller()
@NotificationServiceControllerMethods()
export class NotificationGrpcController implements NotificationServiceController {
  constructor(private readonly commandBus: ValidatingCommandBus) {}

  async sendEmail(request: SendEmailRequest): Promise<SendDispatchResponse> {
    return this.commandBus.execute(new SendEmailCommand(request))
  }

  async sendSms(request: SendSmsRequest): Promise<SendDispatchResponse> {
    return this.commandBus.execute(new SendSmsCommand(request))
  }
}
