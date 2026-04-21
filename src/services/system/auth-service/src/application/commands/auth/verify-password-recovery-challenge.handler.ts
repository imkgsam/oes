import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  PasswordRecoveryService,
  PasswordRecoveryVerificationResult
} from '../../services/password-recovery.service'
import { VerifyPasswordRecoveryChallengeCommand } from './verify-password-recovery-challenge.command'

@CommandHandler(VerifyPasswordRecoveryChallengeCommand)
// Verifies one forgot-password OTP and returns a short-lived password-reset grant.
export class VerifyPasswordRecoveryChallengeHandler
  implements
    ICommandHandler<
      VerifyPasswordRecoveryChallengeCommand,
      PasswordRecoveryVerificationResult
    >
{
  constructor(private readonly passwordRecoveryService: PasswordRecoveryService) {}

  async execute(
    command: VerifyPasswordRecoveryChallengeCommand
  ): Promise<PasswordRecoveryVerificationResult> {
    return this.passwordRecoveryService.verifyChallenge(command.challengeId, command.otp)
  }
}
