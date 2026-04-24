import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  LoginMfaFactorOption,
  LoginMfaOrchestrationService
} from '../../services/mfa/login-mfa-orchestration.service'
import { TenantMfaFactor } from '../../../domain/entities/tenant-mfa-policy.entity'
import { StartStepUpMfaChallengeCommand } from './start-step-up-mfa-challenge.command'

export interface StartStepUpMfaChallengeResult {
  required: boolean
  challengeId?: string
  scenario?: 'CHANGE_CONTACT' | 'CHANGE_PASSWORD' | 'NEW_DEVICE_LOGIN'
  defaultFactor?: TenantMfaFactor
  availableFactors?: LoginMfaFactorOption[]
  factorChallengeId?: string
  destination?: string
  expiresAt?: string
}

@CommandHandler(StartStepUpMfaChallengeCommand)
// Resolves one protected self-service scenario into a reusable MFA challenge only when the active account policy requires it.
export class StartStepUpMfaChallengeHandler
  implements
    ICommandHandler<StartStepUpMfaChallengeCommand, StartStepUpMfaChallengeResult>
{
  constructor(
    private readonly loginMfaOrchestrationService: LoginMfaOrchestrationService
  ) {}

  async execute(
    command: StartStepUpMfaChallengeCommand
  ): Promise<StartStepUpMfaChallengeResult> {
    const challenge = await this.loginMfaOrchestrationService.resolveChallengeForAccount({
      userId: command.userId,
      accountId: command.accountId,
      tenantId: command.tenantId,
      scopeLevel: command.scopeLevel,
      scenario: command.scenario
    })

    if (!challenge) {
      return { required: false }
    }

    return {
      required: true,
      challengeId: challenge.challengeId,
      scenario: command.scenario,
      defaultFactor: challenge.defaultFactor,
      availableFactors: challenge.availableFactors,
      factorChallengeId: challenge.factorChallengeId,
      destination: challenge.destination,
      expiresAt: challenge.expiresAt
    }
  }
}
