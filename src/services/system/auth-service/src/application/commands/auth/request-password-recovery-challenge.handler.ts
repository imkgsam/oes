import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  PasswordRecoveryChallengeResult,
  PasswordRecoveryService
} from '../../services/password-recovery.service'
import { RequestPasswordRecoveryChallengeCommand } from './request-password-recovery-challenge.command'

@CommandHandler(RequestPasswordRecoveryChallengeCommand)
// Starts one forgot-password recovery challenge through the shared password-recovery service.
export class RequestPasswordRecoveryChallengeHandler
  implements
    ICommandHandler<
      RequestPasswordRecoveryChallengeCommand,
      PasswordRecoveryChallengeResult
    >
{
  constructor(private readonly passwordRecoveryService: PasswordRecoveryService) {}

  async execute(
    command: RequestPasswordRecoveryChallengeCommand
  ): Promise<PasswordRecoveryChallengeResult> {
    return this.passwordRecoveryService.requestChallenge(command.channel, command.identifier)
  }
}
