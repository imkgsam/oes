import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { REPO } from 'src/common/constants'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
import { AdminRevokeSessionCommand } from './admin-revoke-session.command'

export interface AdminRevokeSessionResult {
  success: boolean
  sessionId: string
}

@CommandHandler(AdminRevokeSessionCommand)
export class AdminRevokeSessionHandler
  implements ICommandHandler<AdminRevokeSessionCommand, AdminRevokeSessionResult>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: AdminRevokeSessionCommand): Promise<AdminRevokeSessionResult> {
    const reason = command.reason.trim()
    await this.sessionRepository.adminRevokeSession(command.sessionId, reason, command.operatorId)
    this.authAuditService.emitAdminSessionRevoked(command.operatorId, command.sessionId, reason)

    return {
      success: true,
      sessionId: command.sessionId
    }
  }
}
