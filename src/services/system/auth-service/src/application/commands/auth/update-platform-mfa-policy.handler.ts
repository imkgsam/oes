import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import {
  PlatformMfaFactorPolicySnapshot,
  PlatformMfaScenarioRequirementSnapshot
} from '../../../domain/entities/platform-mfa-policy.entity'
import { PlatformMfaPolicyRepository } from '../../../domain/repositories/platform-mfa-policy.repository'
import { UpdatePlatformMfaPolicyCommand } from './update-platform-mfa-policy.command'

export interface PlatformMfaPolicyView {
  factors: PlatformMfaFactorPolicySnapshot[]
  loginRequired: boolean
  scenarioRequirements: PlatformMfaScenarioRequirementSnapshot
}

@CommandHandler(UpdatePlatformMfaPolicyCommand)
// Persists the platform-owned MFA policy snapshot used by SYSTEM-account MFA orchestration.
export class UpdatePlatformMfaPolicyHandler
  implements ICommandHandler<UpdatePlatformMfaPolicyCommand, PlatformMfaPolicyView>
{
  constructor(
    @Inject(REPO.PLATFORM_MFA_POLICY)
    private readonly platformMfaPolicyRepository: PlatformMfaPolicyRepository
  ) {}

  async execute(command: UpdatePlatformMfaPolicyCommand): Promise<PlatformMfaPolicyView> {
    const policy = await this.platformMfaPolicyRepository.getPlatformPolicy()
    for (const [scenario, required] of Object.entries(command.scenarioRequirements)) {
      policy.setScenarioRequired(scenario as keyof PlatformMfaScenarioRequirementSnapshot, required)
    }
    policy.replaceFactors(
      command.factors.map((factor) => ({
        factor: factor.factor,
        enabled: factor.enabled,
        priority: factor.priority,
        updatedBy: command.updatedBy
      }))
    )

    const saved = await this.platformMfaPolicyRepository.savePlatformPolicy(policy)
    return {
      loginRequired: saved.isLoginRequired(),
      scenarioRequirements: saved.getScenarioRequirements(),
      factors: saved.getFactors()
    }
  }
}
