import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { RequestMfaFactorChallengeDto } from '../../interfaces/http/dtos/login.dto'
import { OtpChallengeViewModel } from '../../interfaces/http/view-models/auth-response.view-model'

@Injectable()
// Requests a factor-specific MFA challenge so the pending login MFA flow can switch between enabled factors.
export class RequestMfaFactorChallengeUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(
    dto: RequestMfaFactorChallengeDto,
    source: DownstreamRequestSource
  ): Promise<OtpChallengeViewModel> {
    const result = await this.authAdapter.requestLoginMfaFactorChallenge(
      dto.challengeId.trim(),
      dto.factor,
      source
    )

    return {
      challengeId: result.challengeId ?? '',
      destination: result.destination ?? undefined,
      expiresAt: result.expiresAt ?? undefined
    }
  }
}
