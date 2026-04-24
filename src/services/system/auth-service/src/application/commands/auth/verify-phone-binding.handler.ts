import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { PlatformMfaPolicyRepository } from '../../../domain/repositories/platform-mfa-policy.repository'
import { TenantMfaPolicyRepository } from '../../../domain/repositories/tenant-mfa-policy.repository'
import {
  ContactBindingVerificationResult,
  ContactBindingVerificationService
} from '../../services/contact-binding-verification.service'
import { StepUpMfaGrantService } from '../../services/mfa/step-up-mfa-grant.service'
import { VerifyPhoneBindingCommand } from './verify-phone-binding.command'

@CommandHandler(VerifyPhoneBindingCommand)
// Confirms one phone binding challenge and returns the normalized verified identifier.
export class VerifyPhoneBindingHandler
  implements ICommandHandler<VerifyPhoneBindingCommand, ContactBindingVerificationResult>
{
  constructor(
    private readonly contactBindingVerificationService: ContactBindingVerificationService,
    @Inject(REPO.PLATFORM_MFA_POLICY)
    private readonly platformMfaPolicyRepository: PlatformMfaPolicyRepository,
    @Inject(REPO.TENANT_MFA_POLICY)
    private readonly tenantMfaPolicyRepository: TenantMfaPolicyRepository,
    private readonly stepUpMfaGrantService: StepUpMfaGrantService
  ) {}

  async execute(command: VerifyPhoneBindingCommand): Promise<ContactBindingVerificationResult> {
    if (command.accountId && command.scopeLevel) {
      const policy =
        command.scopeLevel === 'SYSTEM'
          ? await this.platformMfaPolicyRepository.getPlatformPolicy()
          : command.tenantId
            ? await this.tenantMfaPolicyRepository.getTenantPolicy(command.tenantId)
            : null
      if (!policy) {
        throw new Error('MFA scope context is missing for contact binding verification')
      }
      if (policy.isScenarioRequired('CHANGE_CONTACT')) {
        this.stepUpMfaGrantService.assertGrant({
          userId: command.userId,
          accountId: command.accountId,
          tenantId: command.tenantId,
          scopeLevel: command.scopeLevel,
          scenario: 'CHANGE_CONTACT',
          mfaGrantToken: command.mfaGrantToken
        })
      }
    }

    return this.contactBindingVerificationService.verifyPhoneChallenge(
      command.userId,
      command.phone,
      command.otp
    )
  }
}
