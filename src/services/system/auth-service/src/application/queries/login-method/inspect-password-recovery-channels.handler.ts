import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { PasswordRecoveryService } from '../../services/password-recovery.service'
import { PasswordRecoveryChannelInspectionView } from './login-method-query.result'
import { InspectPasswordRecoveryChannelsQuery } from './inspect-password-recovery-channels.query'

@QueryHandler(InspectPasswordRecoveryChannelsQuery)
// Resolves the verified recovery destinations that can be used for one submitted account identifier.
export class InspectPasswordRecoveryChannelsHandler
  implements
    IQueryHandler<InspectPasswordRecoveryChannelsQuery, PasswordRecoveryChannelInspectionView>
{
  constructor(private readonly passwordRecoveryService: PasswordRecoveryService) {}

  async execute(
    query: InspectPasswordRecoveryChannelsQuery
  ): Promise<PasswordRecoveryChannelInspectionView> {
    return this.passwordRecoveryService.inspectChannels(query.identifier)
  }
}
