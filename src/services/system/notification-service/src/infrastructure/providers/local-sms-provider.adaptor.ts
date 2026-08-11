import { Injectable, Logger } from '@nestjs/common'
import { NotificationDispatch } from '../../domain/aggregates/notification-dispatch.aggregate'
import { SmsProviderPort } from '../../domain/services/sms-provider.port'

@Injectable()
export class LocalSmsProviderAdaptor implements SmsProviderPort {
  private readonly logger = new Logger(LocalSmsProviderAdaptor.name)

  async send(dispatch: NotificationDispatch, _payload: Record<string, unknown>, signal: AbortSignal): Promise<void> {
    if (signal.aborted) throw new Error('NOTIFICATION_PROVIDER_CALL_ABORTED')
    const props = dispatch.getProps()
    this.logger.log(
      `[local-sms] dispatch=${props.id} recipient=redacted template=${props.templateKey}`
    )
  }
}
