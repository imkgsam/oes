import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import {
  CompleteStepUpMfaChallengeDto,
  StartStepUpMfaChallengeDto
} from '../../interfaces/http/dtos/self-security.dto'
import {
  StepUpMfaChallengeViewModel,
  StepUpMfaGrantViewModel
} from '../../interfaces/http/view-models/self-security.view-model'
import {
  mapMfaChallengeViewModel,
  mapMfaScenarioViewModel
} from './auth-response.mapper'
import { getAuthenticatedSelfContext } from './self-security-context'

@Injectable()
// Orchestrates one authenticated step-up MFA challenge flow for sensitive in-session operations.
export class StepUpMfaUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async startChallenge(
    dto: StartStepUpMfaChallengeDto,
    source: DownstreamRequestSource
  ): Promise<StepUpMfaChallengeViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const result = await this.authAdapter.startStepUpMfaChallenge(
      {
        userId: self.userId,
        accountId: self.accountId ?? '',
        tenantId: self.tenantId ?? '',
        scopeLevel: self.scopeLevel,
        scenario: dto.scenario
      },
      source
    )

    return {
      required: Boolean(result.required),
      challenge: result.required
        ? mapMfaChallengeViewModel({
            challengeId: result.challengeId,
            mfaScenario: result.scenario,
            defaultMfaFactor: result.defaultMfaFactor,
            availableFactors: result.availableFactors,
            factorChallengeId: result.factorChallengeId,
            challengeDestination: result.challengeDestination,
            challengeExpiresAt: result.challengeExpiresAt
          })
        : null
    }
  }

  async completeChallenge(
    dto: CompleteStepUpMfaChallengeDto,
    source: DownstreamRequestSource
  ): Promise<StepUpMfaGrantViewModel> {
    const result = await this.authAdapter.completeStepUpMfaChallenge(
      {
        challengeId: dto.challengeId.trim(),
        factor: dto.factor,
        code: dto.code.trim(),
        factorChallengeId: dto.factorChallengeId?.trim() || undefined
      },
      source
    )

    return {
      success: Boolean(result.success),
      scenario: mapMfaScenarioViewModel(result.scenario),
      mfaGrantToken: result.mfaGrantToken ?? undefined,
      expiresAt: result.expiresAt ?? undefined
    }
  }
}
