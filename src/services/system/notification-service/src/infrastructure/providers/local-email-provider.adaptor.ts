import { Injectable, Logger } from '@nestjs/common'
import { NotificationDispatch } from '../../domain/aggregates/notification-dispatch.aggregate'
import { EmailProviderPort } from '../../domain/services/email-provider.port'

@Injectable()
export class LocalEmailProviderAdaptor implements EmailProviderPort {
  private readonly logger = new Logger(LocalEmailProviderAdaptor.name)

  async send(dispatch: NotificationDispatch, _payload: Record<string, unknown>, signal: AbortSignal): Promise<void> {
    if (signal.aborted) throw new Error('NOTIFICATION_PROVIDER_CALL_ABORTED')
    const props = dispatch.getProps()
    this.logger.log(
      `[local-email] dispatch=${props.id} recipient=redacted template=${props.templateKey}`
    )
  }
}
