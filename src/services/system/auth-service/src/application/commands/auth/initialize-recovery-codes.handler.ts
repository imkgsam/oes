import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AuthAuditService } from '../../services/auth-audit.service'
import {
  MfaBindingManagementService,
  RecoveryCodeInitialization
} from '../../services/mfa/mfa-binding-management.service'
import { InitializeRecoveryCodesCommand } from './initialize-recovery-codes.command'

@CommandHandler(InitializeRecoveryCodesCommand)
export class InitializeRecoveryCodesHandler
  implements ICommandHandler<InitializeRecoveryCodesCommand, RecoveryCodeInitialization>
{
  constructor(
    private readonly mfaBindingManagementService: MfaBindingManagementService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: InitializeRecoveryCodesCommand): Promise<RecoveryCodeInitialization> {
    const result = await this.mfaBindingManagementService.initializeRecoveryCodes(command.userId)
    this.authAuditService.emitMfaBindingInitialized(command.userId, 'BACKUP_CODE')
    return result
  }
}
