import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  ContactBindingChallengeResult,
  ContactBindingVerificationService
} from '../../services/contact-binding-verification.service'
import { RequestPhoneBindingChallengeCommand } from './request-phone-binding-challenge.command'

@CommandHandler(RequestPhoneBindingChallengeCommand)
// Sends one OTP challenge to the target phone so the authenticated user can verify a new binding.
export class RequestPhoneBindingChallengeHandler
  implements ICommandHandler<RequestPhoneBindingChallengeCommand, ContactBindingChallengeResult>
{
  constructor(
    private readonly contactBindingVerificationService: ContactBindingVerificationService
  ) {}

  async execute(
    command: RequestPhoneBindingChallengeCommand
  ): Promise<ContactBindingChallengeResult> {
    return this.contactBindingVerificationService.createPhoneChallenge(command.userId, command.phone)
  }
}
