import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { REPO } from 'src/common/constants'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
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
    const sessionCount = sessions.filter((session) => session.getId() !== command.currentSessionId).length

    await this.sessionRepository.kickOtherDevices(command.userId, command.currentSessionId)
    this.authAuditService.emitLogoutOtherDevicesSucceeded(command.userId, command.currentSessionId, sessionCount)

    return {
      success: true,
      sessionCount
    }
  }
}
