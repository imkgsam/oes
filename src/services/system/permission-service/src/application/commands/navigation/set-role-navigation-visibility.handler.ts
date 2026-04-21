import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  NAVIGATION_ENTRY_NOT_AVAILABLE,
  NAVIGATION_ENTRY_NOT_FOUND
} from '../../../common/constants/exception-enums/navigation.errors'
import { SYMBOLS } from '../../../common/constants/symbols'
import { isDefaultNavigationTerminal } from '../../../domain/constants/navigation-terminal'
import { NavigationRepository, RoleNavigationConfig } from '../../../domain/repositories/navigation.repository'
import { RoleNavigationVisibility } from '../../../domain/vo/role-navigation-visibility.value-object'
import { SetRoleNavigationVisibilityCommand } from './set-role-navigation-visibility.command'

/** SetRoleNavigationVisibilityHandler validates entry availability before replacing role visibility. */
@CommandHandler(SetRoleNavigationVisibilityCommand)
export class SetRoleNavigationVisibilityHandler
  implements ICommandHandler<SetRoleNavigationVisibilityCommand>
{
  constructor(
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(command: SetRoleNavigationVisibilityCommand): Promise<RoleNavigationConfig> {
    for (const item of command.visibility) {
      const entry = await this.navigationRepo.findEntryByKey(item.entryKey)
      if (!entry) {
        throw ExceptionFactory.domain(NAVIGATION_ENTRY_NOT_FOUND, { entryKey: item.entryKey })
      }

      if (!entry.enabled || !isEntryAvailableForRuleTerminal(entry, item.terminal)) {
        throw ExceptionFactory.domain(NAVIGATION_ENTRY_NOT_AVAILABLE, {
          entryKey: item.entryKey,
          terminal: item.terminal
        })
      }
    }

    return this.navigationRepo.replaceRoleVisibility(
      command.roleId,
      command.visibility.map(
        (item) =>
          new RoleNavigationVisibility(
            command.roleId,
            item.entryKey,
            item.terminal,
            item.enabled
          )
      )
    )
  }
}

/** isEntryAvailableForRuleTerminal allows DEFAULT rules for entries with any concrete terminal support. */
function isEntryAvailableForRuleTerminal(
  entry: { supportedTerminals: string[]; supportsTerminal(terminal: string): boolean },
  terminal: string
): boolean {
  return isDefaultNavigationTerminal(terminal)
    ? entry.supportedTerminals.length > 0
    : entry.supportsTerminal(terminal)
}
