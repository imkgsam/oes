import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  NAVIGATION_ENTRY_NOT_AVAILABLE,
  NAVIGATION_ENTRY_NOT_FOUND,
  NAVIGATION_LANDING_ENTRY_NOT_VISIBLE
} from '../../../common/constants/exception-enums/navigation.errors'
import { SYMBOLS } from '../../../common/constants/symbols'
import {
  DEFAULT_NAVIGATION_TERMINAL,
  isDefaultNavigationTerminal
} from '../../../domain/constants/navigation-terminal'
import { NavigationRepository, RoleNavigationConfig } from '../../../domain/repositories/navigation.repository'
import { RoleLandingPolicy } from '../../../domain/vo/role-landing-policy.value-object'
import { SetRoleLandingPoliciesCommand } from './set-role-landing-policies.command'

/** SetRoleLandingPoliciesHandler enforces visibility before replacing role landing policies. */
@CommandHandler(SetRoleLandingPoliciesCommand)
export class SetRoleLandingPoliciesHandler implements ICommandHandler<SetRoleLandingPoliciesCommand> {
  constructor(
    @Inject(SYMBOLS.REPO.NAVIGATION)
    private readonly navigationRepo: NavigationRepository
  ) {}

  async execute(command: SetRoleLandingPoliciesCommand): Promise<RoleNavigationConfig> {
    const currentNavigation = await this.navigationRepo.findRoleNavigation(command.roleId)
    const visibleKeys = new Set(
      currentNavigation.visibility
        .filter((item) => item.enabled)
        .map((item) => `${item.entryKey}:${item.terminal}`)
    )

    for (const policy of command.landingPolicies) {
      if (
        policy.enabled &&
        !isLandingEntryVisibleForPolicy(visibleKeys, policy.defaultEntryKey, policy.terminal)
      ) {
        throw ExceptionFactory.domain(NAVIGATION_LANDING_ENTRY_NOT_VISIBLE, {
          roleId: command.roleId,
          entryKey: policy.defaultEntryKey
        })
      }

      const entry = await this.navigationRepo.findEntryByKey(policy.defaultEntryKey)
      if (!entry) {
        throw ExceptionFactory.domain(NAVIGATION_ENTRY_NOT_FOUND, {
          entryKey: policy.defaultEntryKey
        })
      }

      if (!entry.enabled || !isEntryAvailableForPolicyTerminal(entry, policy.terminal)) {
        throw ExceptionFactory.domain(NAVIGATION_ENTRY_NOT_AVAILABLE, {
          entryKey: policy.defaultEntryKey,
          terminal: policy.terminal
        })
      }
    }

    return this.navigationRepo.replaceRoleLandingPolicies(
      command.roleId,
      command.landingPolicies.map(
        (policy) =>
          new RoleLandingPolicy(
            command.roleId,
            policy.terminal,
            policy.defaultEntryKey,
            policy.priority,
            policy.enabled
          )
      )
    )
  }
}

/** isLandingEntryVisibleForPolicy validates terminal overrides against exact or DEFAULT visibility. */
function isLandingEntryVisibleForPolicy(
  visibleKeys: Set<string>,
  entryKey: string,
  terminal: string
): boolean {
  if (visibleKeys.has(`${entryKey}:${terminal}`)) return true
  return terminal !== DEFAULT_NAVIGATION_TERMINAL
    ? visibleKeys.has(`${entryKey}:${DEFAULT_NAVIGATION_TERMINAL}`)
    : false
}

/** isEntryAvailableForPolicyTerminal allows DEFAULT policies for entries with any concrete terminal support. */
function isEntryAvailableForPolicyTerminal(
  entry: { supportedTerminals: string[]; supportsTerminal(terminal: string): boolean },
  terminal: string
): boolean {
  return isDefaultNavigationTerminal(terminal)
    ? entry.supportedTerminals.length > 0
    : entry.supportsTerminal(terminal)
}
