import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AuthAuditService } from '../../services/auth-audit.service'
import { MfaBindingManagementService, MfaBindingView } from '../../services/mfa/mfa-binding-management.service'
import { DisableMfaBindingCommand } from './disable-mfa-binding.command'

@CommandHandler(DisableMfaBindingCommand)
export class DisableMfaBindingHandler
  implements ICommandHandler<DisableMfaBindingCommand, MfaBindingView>
{
  constructor(
    private readonly mfaBindingManagementService: MfaBindingManagementService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: DisableMfaBindingCommand): Promise<MfaBindingView> {
    const result = await this.mfaBindingManagementService.disableBinding(command.userId, command.type as any)
    this.authAuditService.emitMfaBindingDisabled(command.userId, command.type as 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP')
    return result
  }
}
