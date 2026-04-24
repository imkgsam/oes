import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { REPO } from '../../../common/constants'
import { AUTH_INVALID_CREDENTIALS } from '../../../common/constants/exception-enums'
import { PlatformMfaPolicyRepository } from '../../../domain/repositories/platform-mfa-policy.repository'
import { ILoginMethodRepository } from '../../../domain/repositories/loginmethod.repository'
import { PasswordSetupRequirementRepository } from '../../../domain/repositories/password-setup-requirement.repository'
import { TenantMfaPolicyRepository } from '../../../domain/repositories/tenant-mfa-policy.repository'
import { AuthAuditService } from '../../services/auth-audit.service'
import { StepUpMfaGrantService } from '../../services/mfa/step-up-mfa-grant.service'
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
    private readonly authAuditService: AuthAuditService,
    @Inject(REPO.PLATFORM_MFA_POLICY)
    private readonly platformMfaPolicyRepository: PlatformMfaPolicyRepository,
    @Inject(REPO.TENANT_MFA_POLICY)
    private readonly tenantMfaPolicyRepository: TenantMfaPolicyRepository,
    private readonly stepUpMfaGrantService: StepUpMfaGrantService
  ) {}

  async execute(command: ChangeOwnPasswordCommand) {
    if (command.accountId && command.scopeLevel) {
      const policy =
        command.scopeLevel === 'SYSTEM'
          ? await this.platformMfaPolicyRepository.getPlatformPolicy()
          : command.tenantId
            ? await this.tenantMfaPolicyRepository.getTenantPolicy(command.tenantId)
            : null
      if (!policy) {
        throw ExceptionFactory.domain(AUTH_INVALID_CREDENTIALS, {
          reason: 'ACCOUNT_SCOPE_CONTEXT_MISSING',
          userId: command.userId
        })
      }
      if (policy.isScenarioRequired('CHANGE_PASSWORD')) {
        this.stepUpMfaGrantService.assertGrant({
          userId: command.userId,
          accountId: command.accountId,
          tenantId: command.tenantId,
          scopeLevel: command.scopeLevel,
          scenario: 'CHANGE_PASSWORD',
          mfaGrantToken: command.mfaGrantToken
        })
      }
    }

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
