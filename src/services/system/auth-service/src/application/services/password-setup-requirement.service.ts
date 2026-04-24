import { Inject, Injectable } from '@nestjs/common'
import { LoginMethodType } from '@oes/common/constants'
import { CredentialType } from '../../../prisma/generated/prisma'
import { REPO } from '../../common/constants'
import { ILoginMethodRepository } from '../../domain/repositories/loginmethod.repository'
import { PasswordSetupRequirementRepository } from '../../domain/repositories/password-setup-requirement.repository'

// Resolves whether one authenticated user must complete password setup before entering the workspace.
@Injectable()
export class PasswordSetupRequirementService {
  constructor(
    @Inject(REPO.LOGIN_METHOD)
    private readonly loginMethodRepository: ILoginMethodRepository,
    @Inject(REPO.PASSWORD_SETUP_REQUIREMENT)
    private readonly passwordSetupRequirementRepository: PasswordSetupRequirementRepository
  ) {}

  async userRequiresPasswordSetup(userId: string): Promise<boolean> {
    const explicit = await this.passwordSetupRequirementRepository.findActiveByUserId(userId)
    if (explicit) {
      return true
    }

    const [phoneMethod, emailMethod] = await Promise.all([
      this.loginMethodRepository.findByUserIdAndType(userId, LoginMethodType.PHONE),
      this.loginMethodRepository.findByUserIdAndType(userId, LoginMethodType.EMAIL)
    ])

    return (
      !phoneMethod?.getCredentialByType(CredentialType.PASSWORD) &&
      !emailMethod?.getCredentialByType(CredentialType.PASSWORD)
    )
  }
}
