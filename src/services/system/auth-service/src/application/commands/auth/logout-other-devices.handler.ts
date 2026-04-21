import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { REPO } from '../../../common/constants'
import { AuthAuditService } from '../../services/auth-audit.service'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { LogoutOtherDevicesCommand } from './logout-other-devices.command'

export interface LogoutOtherDevicesResult {
  success: boolean
  sessionCount: number
}

@CommandHandler(LogoutOtherDevicesCommand)
export class LogoutOtherDevicesHandler
  implements ICommandHandler<LogoutOtherDevicesCommand, LogoutOtherDevicesResult>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: LogoutOtherDevicesCommand): Promise<LogoutOtherDevicesResult> {
    const sessions = await this.sessionRepository.findAllByUserId(command.userId)
    const currentSession =
      (await this.sessionRepository.findById(command.currentSessionId)) ??
      sessions.find((session) => session.getId() === command.currentSessionId) ??
      null
    const currentAccountId = currentSession?.getAccountId() ?? command.currentAccountId
    const revokedSessions = sessions.filter(
      (session) =>
        session.getId() !== command.currentSessionId &&
        (!currentAccountId || session.getAccountId() === currentAccountId)
    )
    const sessionCount = revokedSessions.length

    await this.sessionRepository.kickOtherDevices(
      command.userId,
      currentAccountId,
      command.currentSessionId
    )
    this.authAuditService.emitLogoutOtherDevicesSucceeded(
      command.userId,
      currentSession,
      sessionCount,
      revokedSessions.map((session) => session.getId())
    )

    return {
      success: true,
      sessionCount
    }
  }
}
