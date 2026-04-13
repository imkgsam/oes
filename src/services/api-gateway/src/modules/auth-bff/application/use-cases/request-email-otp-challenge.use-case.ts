import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { EmailOtpChallengeDto } from '../../interfaces/http/dtos/login.dto'
import { OtpChallengeViewModel } from '../../interfaces/http/view-models/auth-response.view-model'

@Injectable()
// Starts an email OTP login challenge and normalizes the downstream challenge payload.
export class RequestEmailOtpChallengeUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(
    dto: EmailOtpChallengeDto,
    source: DownstreamRequestSource
  ): Promise<OtpChallengeViewModel> {
    const result = await this.authAdapter.requestEmailOtpLoginChallenge(dto.email.trim(), source)
    return {
      challengeId: result.challengeId ?? '',
      expiresAt: result.expiresAt ?? undefined,
      destination: result.destination ?? undefined
    }
  }
}
