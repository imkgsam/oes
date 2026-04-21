import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { REPO } from '../../../common/constants'
import { AUTH_SESSION_NOT_FOUND } from '../../../common/constants/exception-enums'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { AuthAuditService } from '../../services/auth-audit.service'
import { LogoutSessionCommand } from './logout-session.command'

export interface LogoutSessionResult {
  success: boolean
}

// Handles account-scoped single-session logout while preventing the current session from being revoked.
@CommandHandler(LogoutSessionCommand)
export class LogoutSessionHandler implements ICommandHandler<LogoutSessionCommand, LogoutSessionResult> {
  constructor(
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: LogoutSessionCommand): Promise<LogoutSessionResult> {
    const currentSession = await this.sessionRepository.findById(command.currentSessionId)
    if (
      !currentSession ||
      currentSession.getUserId() !== command.userId ||
      !currentSession.isActive()
    ) {
      throw ExceptionFactory.domain(AUTH_SESSION_NOT_FOUND, {
        userId: command.userId,
        currentSessionId: command.currentSessionId
      })
    }

    if (command.targetSessionId === command.currentSessionId) {
      throw ExceptionFactory.domain(AUTH_SESSION_NOT_FOUND, {
        userId: command.userId,
        currentSessionId: command.currentSessionId,
        targetSessionId: command.targetSessionId
      })
    }

    const targetSession = await this.sessionRepository.findById(command.targetSessionId)
    if (
      !targetSession ||
      !targetSession.isActive() ||
      targetSession.getUserId() !== currentSession.getUserId() ||
      targetSession.getAccountId() !== currentSession.getAccountId()
    ) {
      throw ExceptionFactory.domain(AUTH_SESSION_NOT_FOUND, {
        userId: command.userId,
        currentSessionId: command.currentSessionId,
        targetSessionId: command.targetSessionId
      })
    }

    await this.sessionRepository.delete(targetSession.getId())
    this.authAuditService.emitLogoutSucceeded(targetSession)

    return { success: true }
  }
}
