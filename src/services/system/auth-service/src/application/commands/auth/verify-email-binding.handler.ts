import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  ContactBindingVerificationResult,
  ContactBindingVerificationService
} from '../../services/contact-binding-verification.service'
import { VerifyEmailBindingCommand } from './verify-email-binding.command'

@CommandHandler(VerifyEmailBindingCommand)
// Confirms one email binding challenge and returns the normalized verified identifier.
export class VerifyEmailBindingHandler
  implements ICommandHandler<VerifyEmailBindingCommand, ContactBindingVerificationResult>
{
  constructor(
    private readonly contactBindingVerificationService: ContactBindingVerificationService
  ) {}

  async execute(command: VerifyEmailBindingCommand): Promise<ContactBindingVerificationResult> {
    return this.contactBindingVerificationService.verifyEmailChallenge(
      command.userId,
      command.email,
      command.otp
    )
  }
}
