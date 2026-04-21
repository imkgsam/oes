import { CreateNavigationEntryHandler } from './create-navigation-entry.handler'
import { SetRoleLandingPoliciesHandler } from './set-role-landing-policies.handler'
import { SetRoleNavigationVisibilityHandler } from './set-role-navigation-visibility.handler'
import { UpdateNavigationEntryHandler } from './update-navigation-entry.handler'

export * from './create-navigation-entry.command'
export * from './set-role-landing-policies.command'
export * from './set-role-navigation-visibility.command'
export * from './update-navigation-entry.command'

export const NavigationCommandHandlers = [
  CreateNavigationEntryHandler,
  UpdateNavigationEntryHandler,
  SetRoleNavigationVisibilityHandler,
  SetRoleLandingPoliciesHandler
]
