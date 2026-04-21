import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { REPO } from '../../../common/constants'
import {
  AUTH_PASSWORD_RECOVERY_GRANT_EXPIRED,
  AUTH_PASSWORD_RECOVERY_GRANT_INVALID
} from '../../../common/constants/exception-enums'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { PasswordRecoveryGrantRepository } from '../../../domain/repositories/password-recovery-grant.repository'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { PasswordRecoveryCompletionResult } from '../../services/password-recovery.service'
import { AuthAuditService } from '../../services/auth-audit.service'
import { CompletePasswordRecoveryCommand } from './complete-password-recovery.command'

@CommandHandler(CompletePasswordRecoveryCommand)
// Completes one verified password-recovery flow by rotating credentials and revoking every active session.
export class CompletePasswordRecoveryHandler
  implements
    ICommandHandler<CompletePasswordRecoveryCommand, PasswordRecoveryCompletionResult>
{
  constructor(
    @Inject(REPO.PASSWORD_RECOVERY_GRANT)
    private readonly passwordRecoveryGrantRepository: PasswordRecoveryGrantRepository,
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(
    command: CompletePasswordRecoveryCommand
  ): Promise<PasswordRecoveryCompletionResult> {
    const grant = await this.passwordRecoveryGrantRepository.findById(command.resetToken)
    if (!grant || grant.isConsumed()) {
      throw ExceptionFactory.domain(AUTH_PASSWORD_RECOVERY_GRANT_INVALID, {
        resetToken: command.resetToken
      })
    }

    if (grant.isExpired()) {
      throw ExceptionFactory.domain(AUTH_PASSWORD_RECOVERY_GRANT_EXPIRED, {
        resetToken: command.resetToken
      })
    }

    grant.consume()
    await this.passwordRecoveryGrantRepository.save(grant)
    const methods = await this.loginMethodRepository.findByUserId(grant.userId)
    const targets = methods.filter((method) => method.isEnabled() && method.isVerified())

    for (const method of targets) {
      await method.replacePasswordCredential(command.newPassword)
      await this.loginMethodRepository.save(method)
    }

    const revokedSessions = await this.sessionRepository.findAllByUserId(grant.userId)
    await this.sessionRepository.deleteAllByUserId(grant.userId)
    this.authAuditService.emitPasswordRecoveryCompleted(
      grant.userId,
      grant.id,
      revokedSessions.length
    )

    return {
      success: true,
      sessionsRevoked: true
    }
  }
}
