export * from './permission'
export * from './role'
export * from './policy'
export * from './navigation'

import { PermissionCommandHandlers } from './permission'
import { RoleCommandHandlers } from './role'
import { PolicyCommandHandlers } from './policy'
import { NavigationCommandHandlers } from './navigation'

export const CommandHandlers = [
  ...PermissionCommandHandlers,
  ...RoleCommandHandlers,
  ...PolicyCommandHandlers,
  ...NavigationCommandHandlers
]
