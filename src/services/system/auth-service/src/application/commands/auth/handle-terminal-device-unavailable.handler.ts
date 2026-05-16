import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { REPO } from '../../../common/constants'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { AuthAuditService } from '../../services/auth-audit.service'
import { HandleTerminalDeviceUnavailableCommand } from './handle-terminal-device-unavailable.command'

export interface HandleTerminalDeviceUnavailableResult {
  terminalDeviceId: string
  revokedSessionIds: string[]
  revokedCount: number
}

@CommandHandler(HandleTerminalDeviceUnavailableCommand)
// Handles managed terminal unavailable facts by revoking auth-service session truth for that terminal device.
export class HandleTerminalDeviceUnavailableHandler
  implements ICommandHandler<HandleTerminalDeviceUnavailableCommand, HandleTerminalDeviceUnavailableResult>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(
    command: HandleTerminalDeviceUnavailableCommand
  ): Promise<HandleTerminalDeviceUnavailableResult> {
    const terminalDeviceId = command.terminalDeviceId.trim()
    const sessions = await this.sessionRepository.findActiveByTerminalDeviceId(terminalDeviceId)
    const revokedSessionIds: string[] = []

    for (const session of sessions) {
      await this.sessionRepository.delete(session.getId())
      revokedSessionIds.push(session.getId())
    }

    this.authAuditService.emitTerminalDeviceSessionsRevoked({
      terminalDeviceId,
      tenantId: command.tenantId,
      previousStatus: command.previousStatus,
      newStatus: command.newStatus,
      reason: command.reason,
      traceId: command.traceId,
      sessionIds: revokedSessionIds
    })

    return {
      terminalDeviceId,
      revokedSessionIds,
      revokedCount: revokedSessionIds.length
    }
  }
}
