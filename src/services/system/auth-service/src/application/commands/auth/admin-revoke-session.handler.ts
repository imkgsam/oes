import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { CheckResourceService } from '../../authorization'
import { REPO } from '../../../common/constants'
import { AuthAuditService } from '../../services/auth-audit.service'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { AdminRevokeSessionCommand } from './admin-revoke-session.command'

export interface AdminRevokeSessionResult {
  success: boolean
  sessionId: string
}

@CommandHandler(AdminRevokeSessionCommand)
// Handles administrator-driven session revocation after enforcing resource-level tenant boundaries.
export class AdminRevokeSessionHandler
  implements ICommandHandler<AdminRevokeSessionCommand, AdminRevokeSessionResult>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService,
    private readonly checkResourceService: CheckResourceService
  ) {}

  /**
   * execute revokes a target session after enforcing the admin operator tenant boundary for that session.
   */
  async execute(command: AdminRevokeSessionCommand): Promise<AdminRevokeSessionResult> {
    const reason = command.reason.trim()
    const session = await this.sessionRepository.findById(command.sessionId)

    if (session) {
      this.checkResourceService.checkSession(command.operatorScope, {
        resourceId: session.getId(),
        tenantId: session.getTenantId() ?? null
      })
    }

    await this.sessionRepository.adminRevokeSession(command.sessionId, reason, command.operatorId)

    if (session) {
      this.authAuditService.emitAdminSessionRevoked(command.operatorId, session, reason)
    }

    return {
      success: true,
      sessionId: command.sessionId
    }
  }
}
