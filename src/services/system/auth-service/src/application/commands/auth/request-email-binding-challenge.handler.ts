import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  ContactBindingChallengeResult,
  ContactBindingVerificationService
} from '../../services/contact-binding-verification.service'
import { RequestEmailBindingChallengeCommand } from './request-email-binding-challenge.command'

@CommandHandler(RequestEmailBindingChallengeCommand)
// Sends one OTP challenge to the target email so the authenticated user can verify a new binding.
export class RequestEmailBindingChallengeHandler
  implements ICommandHandler<RequestEmailBindingChallengeCommand, ContactBindingChallengeResult>
{
  constructor(
    private readonly contactBindingVerificationService: ContactBindingVerificationService
  ) {}

  async execute(
    command: RequestEmailBindingChallengeCommand
  ): Promise<ContactBindingChallengeResult> {
    return this.contactBindingVerificationService.createEmailChallenge(command.userId, command.email)
  }
}
