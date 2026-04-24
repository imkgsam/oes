import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { IDENTITY_SERVICE } from '@oes/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import { IIdentityServicePort } from '../../ports/identity-service.port'
import {
  AccountSessionEstablishmentService,
  EstablishedAccountSession
} from '../../services/account-session-establishment.service'
import { LoginMfaOrchestrationService } from '../../services/mfa/login-mfa-orchestration.service'
import { AUTH_NO_AVAILABLE_ACCOUNT } from '../../../common/constants/exception-enums'
import { SubmitMfaChallengeCommand } from './submit-mfa-challenge.command'

export type SubmitMfaChallengeResult = EstablishedAccountSession

@CommandHandler(SubmitMfaChallengeCommand)
export class SubmitMfaChallengeHandler
  implements ICommandHandler<SubmitMfaChallengeCommand, SubmitMfaChallengeResult>
{
  constructor(
    private readonly loginMfaOrchestrationService: LoginMfaOrchestrationService,
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    private readonly accountSessionEstablishmentService: AccountSessionEstablishmentService
  ) {}

  async execute(command: SubmitMfaChallengeCommand): Promise<SubmitMfaChallengeResult> {
    const flow = await this.loginMfaOrchestrationService.verifySelectedFactor({
      challengeId: command.challengeId,
      factor: command.factor,
      code: command.code,
      factorChallengeId: command.factorChallengeId
    })
    const account = await this.identityService.getAccountById(flow.aid)
    if (!account || account.userId !== flow.sub) {
      throw ExceptionFactory.domain(AUTH_NO_AVAILABLE_ACCOUNT, { userId: flow.sub, accountId: flow.aid })
    }

    return this.accountSessionEstablishmentService.establish({
      userId: flow.sub,
      account,
      loginMethod: flow.loginMethod,
      deviceId: flow.deviceId,
      deviceName: flow.deviceName,
      userAgent: flow.userAgent,
      ipAddress: flow.ipAddress,
      trustCurrentDevice: command.trustCurrentDevice
    })
  }
}
