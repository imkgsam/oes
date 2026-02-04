export * from './permission'
export * from './role'

import { PermissionCommandHandlers } from './permission'
import { RoleCommandHandlers } from './role'

export const CommandHandlers = [...PermissionCommandHandlers, ...RoleCommandHandlers]
