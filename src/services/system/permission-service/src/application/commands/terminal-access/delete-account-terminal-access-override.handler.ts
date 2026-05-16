import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalAccessRepository } from '../../../domain/repositories/terminal-access.repository'
import { DeleteAccountTerminalAccessOverrideCommand } from './delete-account-terminal-access-override.command'

/** DeleteAccountTerminalAccessOverrideHandler deletes account-specific terminal access replacement rows. */
@CommandHandler(DeleteAccountTerminalAccessOverrideCommand)
export class DeleteAccountTerminalAccessOverrideHandler
  implements ICommandHandler<DeleteAccountTerminalAccessOverrideCommand, void>
{
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_ACCESS)
    private readonly terminalAccessRepo: TerminalAccessRepository
  ) {}

  async execute(command: DeleteAccountTerminalAccessOverrideCommand): Promise<void> {
    await this.terminalAccessRepo.deleteAccountOverride(
      command.accountId,
      command.tenantId,
      command.scopeLevel
    )
  }
}
