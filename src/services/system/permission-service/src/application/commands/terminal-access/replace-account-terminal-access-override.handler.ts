import { Inject } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants/symbols'
import { TerminalAccessRepository } from '../../../domain/repositories/terminal-access.repository'
import { ReplaceAccountTerminalAccessOverrideCommand } from './replace-account-terminal-access-override.command'

/** ReplaceAccountTerminalAccessOverrideHandler stores an account-level replacement terminal access set. */
@CommandHandler(ReplaceAccountTerminalAccessOverrideCommand)
export class ReplaceAccountTerminalAccessOverrideHandler
  implements ICommandHandler<ReplaceAccountTerminalAccessOverrideCommand, void>
{
  constructor(
    @Inject(SYMBOLS.REPO.TERMINAL_ACCESS)
    private readonly terminalAccessRepo: TerminalAccessRepository
  ) {}

  async execute(command: ReplaceAccountTerminalAccessOverrideCommand): Promise<void> {
    await this.terminalAccessRepo.replaceAccountOverride(
      command.accountId,
      command.tenantId,
      command.scopeLevel,
      command.allowedTerminals
    )
  }
}
