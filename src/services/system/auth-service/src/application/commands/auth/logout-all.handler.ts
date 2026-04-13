import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { REPO } from '../../../common/constants'
import { AuthAuditService } from '../../services/auth-audit.service'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { LogoutAllCommand } from './logout-all.command'

export interface LogoutAllResult {
  success: boolean
  sessionCount: number
}

@CommandHandler(LogoutAllCommand)
export class LogoutAllHandler implements ICommandHandler<LogoutAllCommand, LogoutAllResult> {
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: LogoutAllCommand): Promise<LogoutAllResult> {
    const sessions = await this.sessionRepository.findAllByUserId(command.userId)
    await this.sessionRepository.deleteAllByUserId(command.userId)
    this.authAuditService.emitLogoutAllSucceeded(
      command.userId,
      sessions.length,
      sessions.map((session) => session.getId())
    )
    return {
      success: true,
      sessionCount: sessions.length
    }
  }
}
