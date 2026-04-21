import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { REPO } from '../../../common/constants'
import { PasswordSetupRequirementRepository } from '../../../domain/repositories/password-setup-requirement.repository'
import { AuthAuditService } from '../../services/auth-audit.service'
import { RequirePasswordSetupCommand } from './require-password-setup.command'

@CommandHandler(RequirePasswordSetupCommand)
// Marks one user as password-setup-required without accepting or generating a password.
export class RequirePasswordSetupHandler
  implements
    ICommandHandler<
      RequirePasswordSetupCommand,
      { passwordSetupRequired: boolean; success: boolean }
    >
{
  constructor(
    @Inject(REPO.PASSWORD_SETUP_REQUIREMENT)
    private readonly passwordSetupRequirementRepository: PasswordSetupRequirementRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: RequirePasswordSetupCommand) {
    await this.passwordSetupRequirementRepository.requireSetup({
      userId: command.userId,
      reason: 'ADMIN_RESET',
      requiredBy: command.requiredBy
    })
    this.authAuditService.emitPasswordSetupRequired(
      command.requiredBy,
      command.userId,
      command.reason
    )
    return { success: true, passwordSetupRequired: true }
  }
}
