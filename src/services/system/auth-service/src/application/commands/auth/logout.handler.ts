import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { REPO } from 'src/common/constants'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
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
    await this.sessionRepository.delete(command.sessionId)
    this.authAuditService.emitLogoutSucceeded(command.sessionId)
    return { success: true }
  }
}
