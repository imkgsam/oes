import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import {
  ContactBindingVerificationResult,
  ContactBindingVerificationService
} from '../../services/contact-binding-verification.service'
import { VerifyPhoneBindingCommand } from './verify-phone-binding.command'

@CommandHandler(VerifyPhoneBindingCommand)
// Confirms one phone binding challenge and returns the normalized verified identifier.
export class VerifyPhoneBindingHandler
  implements ICommandHandler<VerifyPhoneBindingCommand, ContactBindingVerificationResult>
{
  constructor(
    private readonly contactBindingVerificationService: ContactBindingVerificationService
  ) {}

  async execute(command: VerifyPhoneBindingCommand): Promise<ContactBindingVerificationResult> {
    return this.contactBindingVerificationService.verifyPhoneChallenge(
      command.userId,
      command.phone,
      command.otp
    )
  }
}
