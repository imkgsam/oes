import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import {
  PlatformMfaFactorPolicySnapshot,
  PlatformMfaScenarioRequirementSnapshot
} from '../../../domain/entities/platform-mfa-policy.entity'
import { PlatformMfaPolicyRepository } from '../../../domain/repositories/platform-mfa-policy.repository'
import { GetPlatformMfaPolicyQuery } from './get-platform-mfa-policy.query'

export interface PlatformMfaPolicyQueryResult {
  factors: PlatformMfaFactorPolicySnapshot[]
  loginRequired: boolean
  scenarioRequirements: PlatformMfaScenarioRequirementSnapshot
}

@QueryHandler(GetPlatformMfaPolicyQuery)
// Reads the platform-owned MFA policy snapshot without exposing repository details to transport layers.
export class GetPlatformMfaPolicyHandler
  implements IQueryHandler<GetPlatformMfaPolicyQuery, PlatformMfaPolicyQueryResult>
{
  constructor(
    @Inject(REPO.PLATFORM_MFA_POLICY)
    private readonly platformMfaPolicyRepository: PlatformMfaPolicyRepository
  ) {}

  async execute(): Promise<PlatformMfaPolicyQueryResult> {
    const policy = await this.platformMfaPolicyRepository.getPlatformPolicy()
    return {
      loginRequired: policy.isLoginRequired(),
      scenarioRequirements: policy.getScenarioRequirements(),
      factors: policy.getFactors()
    }
  }
}
