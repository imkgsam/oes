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
    const currentSession = command.currentSessionId
      ? await this.sessionRepository.findById(command.currentSessionId)
      : null
    const currentAccountId = currentSession?.getAccountId() ?? command.currentAccountId
    const targetSessions = sessions.filter(
      (session) => !currentAccountId || session.getAccountId() === currentAccountId
    )

    if (currentAccountId) {
      await this.sessionRepository.deleteAllByAccountId(currentAccountId)
    } else {
      await this.sessionRepository.deleteAllByUserId(command.userId)
    }
    this.authAuditService.emitLogoutAllSucceeded(
      command.userId,
      targetSessions.length,
      targetSessions.map((session) => session.getId())
    )
    return {
      success: true,
      sessionCount: targetSessions.length
    }
  }
}
