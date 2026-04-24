import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { ExceptionFactory } from '@oes/common/exceptions'
import { AUTH_MFA_STEP_UP_REQUIRED } from '../../../common/constants/exception-enums'
import { StepUpMfaGrantService } from '../../services/mfa/step-up-mfa-grant.service'
import { LoginMfaOrchestrationService } from '../../services/mfa/login-mfa-orchestration.service'
import { CompleteStepUpMfaChallengeCommand } from './complete-step-up-mfa-challenge.command'

export interface CompleteStepUpMfaChallengeResult {
  success: true
  scenario: 'CHANGE_CONTACT' | 'CHANGE_PASSWORD'
  mfaGrantToken: string
  expiresAt?: string
}

@CommandHandler(CompleteStepUpMfaChallengeCommand)
// Exchanges one verified step-up MFA challenge for a short-lived scenario grant consumed by sensitive self-service mutations.
export class CompleteStepUpMfaChallengeHandler
  implements
    ICommandHandler<
      CompleteStepUpMfaChallengeCommand,
      CompleteStepUpMfaChallengeResult
    >
{
  constructor(
    private readonly loginMfaOrchestrationService: LoginMfaOrchestrationService,
    private readonly stepUpMfaGrantService: StepUpMfaGrantService
  ) {}

  async execute(
    command: CompleteStepUpMfaChallengeCommand
  ): Promise<CompleteStepUpMfaChallengeResult> {
    const flow = await this.loginMfaOrchestrationService.verifySelectedFactor({
      challengeId: command.challengeId,
      factor: command.factor,
      code: command.code,
      factorChallengeId: command.factorChallengeId
    })

    if (flow.scenario === 'LOGIN' || flow.scenario === 'NEW_DEVICE_LOGIN') {
      throw ExceptionFactory.domain(AUTH_MFA_STEP_UP_REQUIRED, {
        userId: flow.sub,
        accountId: flow.aid,
        tenantId: flow.tid,
        scopeLevel: flow.scopeLevel,
        scenario: flow.scenario
      })
    }

    const grant = this.stepUpMfaGrantService.issueGrant({
      userId: flow.sub,
      accountId: flow.aid,
      tenantId: flow.tid,
      scopeLevel: flow.scopeLevel,
      scenario: flow.scenario
    })

    return {
      success: true,
      scenario: flow.scenario,
      mfaGrantToken: grant.mfaGrantToken
    }
  }
}
