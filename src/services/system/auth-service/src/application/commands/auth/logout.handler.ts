import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { REPO } from '../../../common/constants'
import { AuthAuditService } from '../../services/auth-audit.service'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { LogoutCommand } from './logout.command'

export interface LogoutResult {
  success: boolean
}

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, LogoutResult> {
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: LogoutCommand): Promise<LogoutResult> {
    const session = await this.sessionRepository.findById(command.sessionId)
    if (!session) {
      return { success: true }
    }

    await this.sessionRepository.delete(command.sessionId)
    this.authAuditService.emitLogoutSucceeded(session)
    return { success: true }
  }
}
