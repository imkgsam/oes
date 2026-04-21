import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { LoginMethodType } from '@oes/common/constants'
import { REPO } from '../../../common/constants'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { PasswordSetupRequirementRepository } from '../../../domain/repositories/password-setup-requirement.repository'
import { CompleteFirstLoginPasswordSetupCommand } from './complete-first-login-password-setup.command'

export interface CompleteFirstLoginPasswordSetupResult {
  completed: boolean
}

@CommandHandler(CompleteFirstLoginPasswordSetupCommand)
export class CompleteFirstLoginPasswordSetupHandler
  implements
    ICommandHandler<CompleteFirstLoginPasswordSetupCommand, CompleteFirstLoginPasswordSetupResult>
{
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.PASSWORD_SETUP_REQUIREMENT)
    private readonly passwordSetupRequirementRepository: PasswordSetupRequirementRepository
  ) {}

  async execute(
    command: CompleteFirstLoginPasswordSetupCommand
  ): Promise<CompleteFirstLoginPasswordSetupResult> {
    const [phoneMethod, emailMethod] = await Promise.all([
      this.loginMethodRepository.findByUserIdAndType(command.userId, LoginMethodType.PHONE),
      this.loginMethodRepository.findByUserIdAndType(command.userId, LoginMethodType.EMAIL)
    ])
    const targets = [phoneMethod, emailMethod].filter(
      (method): method is NonNullable<typeof method> => Boolean(method?.isVerified())
    )

    if (targets.length === 0) {
      throw new Error('No login method available for password setup')
    }

    for (const target of targets) {
      await target.replacePasswordCredential(command.newPassword)
      await this.loginMethodRepository.save(target)
    }
    await this.passwordSetupRequirementRepository.complete(command.userId)

    return { completed: true }
  }
}
