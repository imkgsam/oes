import { SendEmailRequest } from '@oes/common/generated/notification_service'
import { Allow, IsDefined } from 'class-validator'

/** Carries only controller-established INTERNAL facts; request bodies never establish dispatch authority. */
export type TrustedNotificationDispatchAuthority = Readonly<{
  sourceService: string
  machinePrincipal: string
  traceId?: string
  requestId?: string
}>

export class SendEmailCommand {
  @IsDefined()
  @Allow()
  public readonly request: SendEmailRequest

  constructor(request: SendEmailRequest, public readonly authority: TrustedNotificationDispatchAuthority) {
    this.request = request
  }
}
