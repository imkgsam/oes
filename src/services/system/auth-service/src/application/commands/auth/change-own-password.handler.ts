import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { REPO } from '../../../common/constants'
import { AUTH_INVALID_CREDENTIALS } from '../../../common/constants/exception-enums'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { PasswordSetupRequirementRepository } from '../../../domain/repositories/password-setup-requirement.repository'
import { AuthAuditService } from '../../services/auth-audit.service'
import { ChangeOwnPasswordCommand } from './change-own-password.command'

@CommandHandler(ChangeOwnPasswordCommand)
// Changes one user's unified password after verifying an existing enabled password credential.
export class ChangeOwnPasswordHandler
  implements
    ICommandHandler<
      ChangeOwnPasswordCommand,
      { passwordSetupRequired: boolean; success: boolean }
    >
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.PASSWORD_SETUP_REQUIREMENT)
    private readonly passwordSetupRequirementRepository: PasswordSetupRequirementRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: ChangeOwnPasswordCommand) {
    const methods = await this.loginMethodRepository.findByUserId(command.userId)
    const passwordCredentials = methods
      .map((method) => method.getPasswordCredential())
      .filter(Boolean)

    const currentPasswordMatches = await Promise.all(
      passwordCredentials.map((credential) => credential!.validate(command.currentPassword))
    )
    if (!currentPasswordMatches.some(Boolean)) {
      throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS, {
        reason: 'CURRENT_PASSWORD_INVALID',
        userId: command.userId
      })
    }

    const targets = methods.filter((method) => method.isVerified())
    for (const method of targets) {
      await method.replacePasswordCredential(command.newPassword)
      await this.loginMethodRepository.save(method)
    }

    await this.passwordSetupRequirementRepository.complete(command.userId)
    this.authAuditService.emitPasswordChanged(command.userId)
    return { success: true, passwordSetupRequired: false }
  }
}
