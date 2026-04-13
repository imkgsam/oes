import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AuthAuditService } from '../../services/auth-audit.service'
import {
  MfaBindingManagementService,
  TotpBindingInitialization
} from '../../services/mfa/mfa-binding-management.service'
import { InitializeTotpBindingCommand } from './initialize-totp-binding.command'

@CommandHandler(InitializeTotpBindingCommand)
export class InitializeTotpBindingHandler
  implements ICommandHandler<InitializeTotpBindingCommand, TotpBindingInitialization>
{
  constructor(
    private readonly mfaBindingManagementService: MfaBindingManagementService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: InitializeTotpBindingCommand): Promise<TotpBindingInitialization> {
    const result = await this.mfaBindingManagementService.initializeTotpBinding(command.userId)
    this.authAuditService.emitMfaBindingInitialized(command.userId, 'TOTP')
    return result
  }
}
