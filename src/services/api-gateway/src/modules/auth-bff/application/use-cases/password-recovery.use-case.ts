import { BadRequestException, Injectable } from '@nestjs/common'
import { PasswordRecoveryChannel } from '@oes/common/generated/auth_service'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import {
  CompletePasswordRecoveryDto,
  InspectPasswordRecoveryChannelsDto,
  RequestPasswordRecoveryChallengeDto,
  VerifyPasswordRecoveryChallengeDto
} from '../../interfaces/http/dtos/password-recovery.dto'
import {
  PasswordRecoveryChallengeViewModel,
  PasswordRecoveryOptionsViewModel,
  PasswordRecoveryCompletionViewModel,
  PasswordRecoveryVerificationViewModel
} from '../../interfaces/http/view-models/password-recovery.view-model'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'

@Injectable()
// Orchestrates the public forgot-password flow exposed by the auth BFF.
export class PasswordRecoveryUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async inspectChannels(
    dto: InspectPasswordRecoveryChannelsDto,
    source: DownstreamRequestSource
  ): Promise<PasswordRecoveryOptionsViewModel> {
    const result = await this.authAdapter.inspectPasswordRecoveryChannels(
      {
        identifier: dto.identifier.trim()
      },
      source
    )

    return {
      channels: (result.channels ?? []).map((channel) => ({
        channel:
          channel.channel === PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE
            ? 'PHONE'
            : 'EMAIL',
        maskedDestination: channel.maskedDestination ?? ''
      })),
      defaultChannel:
        result.defaultChannel === PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_PHONE
          ? 'PHONE'
          : result.defaultChannel === PasswordRecoveryChannel.PASSWORD_RECOVERY_CHANNEL_EMAIL
            ? 'EMAIL'
            : undefined
    }
  }

  async requestChallenge(
    dto: RequestPasswordRecoveryChallengeDto,
    source: DownstreamRequestSource
  ): Promise<PasswordRecoveryChallengeViewModel> {
    const result = await this.authAdapter.requestPasswordRecoveryChallenge(
      {
        channel: dto.channel,
        identifier: dto.identifier.trim()
      },
      source
    )

    return {
      accepted: result.accepted ?? false,
      challengeId: result.challengeId ?? '',
      expiresAt: result.expiresAt ?? undefined,
      maskedDestination: result.maskedDestination ?? undefined
    }
  }

  async verifyChallenge(
    challengeId: string,
    dto: VerifyPasswordRecoveryChallengeDto,
    source: DownstreamRequestSource
  ): Promise<PasswordRecoveryVerificationViewModel> {
    const result = await this.authAdapter.verifyPasswordRecoveryChallenge(
      {
        challengeId: challengeId.trim(),
        otp: dto.otp.trim()
      },
      source
    )

    return {
      verified: result.verified ?? false,
      resetToken: result.resetToken ?? ''
    }
  }

  async complete(
    dto: CompletePasswordRecoveryDto,
    source: DownstreamRequestSource
  ): Promise<PasswordRecoveryCompletionViewModel> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致')
    }

    const result = await this.authAdapter.completePasswordRecovery(
      {
        resetToken: dto.resetToken.trim(),
        newPassword: dto.newPassword.trim()
      },
      source
    )

    return {
      success: result.success ?? false,
      sessionsRevoked: result.sessionsRevoked ?? false
    }
  }
}
