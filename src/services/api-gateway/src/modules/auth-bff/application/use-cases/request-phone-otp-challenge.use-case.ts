import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { PhoneOtpChallengeDto } from '../../interfaces/http/dtos/login.dto'
import { OtpChallengeViewModel } from '../../interfaces/http/view-models/auth-response.view-model'

@Injectable()
// Starts a phone OTP login challenge and normalizes the downstream challenge payload.
export class RequestPhoneOtpChallengeUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(
    dto: PhoneOtpChallengeDto,
    source: DownstreamRequestSource
  ): Promise<OtpChallengeViewModel> {
    const result = await this.authAdapter.requestPhoneOtpLoginChallenge(dto.phone.trim(), source)
    return {
      challengeId: result.challengeId ?? '',
      expiresAt: result.expiresAt ?? undefined,
      destination: result.destination ?? undefined
    }
  }
}
