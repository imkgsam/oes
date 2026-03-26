import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { REPO } from 'src/common/constants'
import {
  AUTH_SESSION_NOT_FOUND,
  AUTH_SESSION_OWNER_MISMATCH
} from 'src/common/constants/exception-enums'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
import { RenameSessionDeviceCommand } from './rename-session-device.command'

export interface RenameSessionDeviceResult {
  success: boolean
  sessionId: string
  deviceName: string
}

@CommandHandler(RenameSessionDeviceCommand)
export class RenameSessionDeviceHandler
  implements ICommandHandler<RenameSessionDeviceCommand, RenameSessionDeviceResult>
{
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: RenameSessionDeviceCommand): Promise<RenameSessionDeviceResult> {
    const session = await this.sessionRepository.findById(command.sessionId)

    if (!session) {
      throw ExceptionFactory.domain(AUTH_SESSION_NOT_FOUND, {
        sessionId: command.sessionId
      })
    }

    if (session.getUserId() !== command.userId) {
      throw ExceptionFactory.domain(AUTH_SESSION_OWNER_MISMATCH, {
        sessionId: command.sessionId,
        userId: command.userId
      })
    }

    const deviceName = command.deviceName.trim()
    session.renameDevice(deviceName)
    await this.sessionRepository.save(session)

    this.authAuditService.emitSessionDeviceRenamed(
      command.userId,
      command.sessionId,
      deviceName
    )

    return {
      success: true,
      sessionId: command.sessionId,
      deviceName
    }
  }
}
