import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AuthAuditService } from '../../services/auth-audit.service'
import {
  MfaBindingManagementService,
  RecoveryCodeInitialization
} from '../../services/mfa/mfa-binding-management.service'
import { RegenerateRecoveryCodesCommand } from './regenerate-recovery-codes.command'

@CommandHandler(RegenerateRecoveryCodesCommand)
export class RegenerateRecoveryCodesHandler
  implements ICommandHandler<RegenerateRecoveryCodesCommand, RecoveryCodeInitialization>
{
  constructor(
    private readonly mfaBindingManagementService: MfaBindingManagementService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: RegenerateRecoveryCodesCommand): Promise<RecoveryCodeInitialization> {
    const result = await this.mfaBindingManagementService.regenerateRecoveryCodes(command.userId)
    this.authAuditService.emitMfaBindingRotated(command.userId, 'BACKUP_CODE')
    return result
  }
}
