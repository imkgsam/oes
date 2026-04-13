import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AuthAuditService } from '../../services/auth-audit.service'
import { MfaBindingManagementService, MfaBindingView } from '../../services/mfa/mfa-binding-management.service'
import { EnableMfaBindingCommand } from './enable-mfa-binding.command'

@CommandHandler(EnableMfaBindingCommand)
export class EnableMfaBindingHandler
  implements ICommandHandler<EnableMfaBindingCommand, MfaBindingView>
{
  constructor(
    private readonly mfaBindingManagementService: MfaBindingManagementService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: EnableMfaBindingCommand): Promise<MfaBindingView> {
    const result = await this.mfaBindingManagementService.enableOtpBinding(command.userId, command.type as any)
    this.authAuditService.emitMfaBindingEnabled(command.userId, command.type as 'EMAIL_OTP' | 'SMS_OTP')
    return result
  }
}
