import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { CheckResourceService } from '../../authorization'
import { AuthAuditService } from '../../services/auth-audit.service'
import { AdminDeleteAccountSessionsCommand } from './admin-delete-account-sessions.command'

export interface AdminDeleteAccountSessionsResult {
  success: boolean
  deletedSessionCount: number
}

@CommandHandler(AdminDeleteAccountSessionsCommand)
// Deletes every persisted session bound to one disabled account after tenant-boundary checks pass for each session.
export class AdminDeleteAccountSessionsHandler
  implements ICommandHandler<AdminDeleteAccountSessionsCommand, AdminDeleteAccountSessionsResult>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(
    command: AdminDeleteAccountSessionsCommand
  ): Promise<AdminDeleteAccountSessionsResult> {
    const reason = command.reason.trim()
    const sessions = await this.sessionRepository.findAllByUserId(command.userId)
    const matchingSessions = sessions.filter((session) => session.getAccountId() === command.accountId)

    for (const session of matchingSessions) {
      this.checkResourceService.checkSession(command.operatorScope, {
        resourceId: session.getId(),
        tenantId: session.getTenantId() ?? null
      })
    }

    for (const session of matchingSessions) {
      this.authAuditService.emitAdminSessionRevoked(command.operatorId, session, reason)
      await this.sessionRepository.delete(session.getId())
    }

    return {
      success: true,
      deletedSessionCount: matchingSessions.length
    }
  }
}
