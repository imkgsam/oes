import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AuthAuditService } from '../../services/auth-audit.service'
import { MfaBindingView, MfaBindingManagementService } from '../../services/mfa/mfa-binding-management.service'
import { ActivateTotpBindingCommand } from './activate-totp-binding.command'

@CommandHandler(ActivateTotpBindingCommand)
export class ActivateTotpBindingHandler
  implements ICommandHandler<ActivateTotpBindingCommand, MfaBindingView>
{
  constructor(
    private readonly mfaBindingManagementService: MfaBindingManagementService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: ActivateTotpBindingCommand): Promise<MfaBindingView> {
    const result = await this.mfaBindingManagementService.activateTotpBinding(
      command.userId,
      command.bindingId,
      command.code
    )

    this.authAuditService.emitMfaBindingEnabled(command.userId, 'TOTP')
    return result
  }
}
