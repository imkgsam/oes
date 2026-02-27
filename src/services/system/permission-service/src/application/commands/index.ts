export * from './permission'
export * from './role'
export * from './policy'

import { PermissionCommandHandlers } from './permission'
import { RoleCommandHandlers } from './role'
import { PolicyCommandHandlers } from './policy'

export const CommandHandlers = [
  ...PermissionCommandHandlers,
  ...RoleCommandHandlers,
  ...PolicyCommandHandlers
]
