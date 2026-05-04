import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { REPO } from '../../../common/constants'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { RevokeTenantSessionsCommand } from './revoke-tenant-sessions.command'

export interface RevokeTenantSessionsResult {
  success: true
  revokedSessionCount: number
}

/** RevokeTenantSessionsHandler removes active tenant-scope sessions after tenant lifecycle deactivation. */
@CommandHandler(RevokeTenantSessionsCommand)
export class RevokeTenantSessionsHandler
  implements ICommandHandler<RevokeTenantSessionsCommand, RevokeTenantSessionsResult>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository
  ) {}

  async execute(command: RevokeTenantSessionsCommand): Promise<RevokeTenantSessionsResult> {
    const revokedSessionCount =
      await this.sessionRepository.deleteActiveTenantScopeSessionsByTenantId(command.tenantId)

    return {
      success: true,
      revokedSessionCount
    }
  }
}
