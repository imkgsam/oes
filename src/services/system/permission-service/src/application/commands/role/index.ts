export * from './create-role.command'
export * from './create-role.handler'
export * from './delete-role.command'
export * from './delete-role.handler'

import { CreateRoleHandler } from './create-role.handler'
import { DeleteRoleHandler } from './delete-role.handler'

export const RoleCommandHandlers = [CreateRoleHandler, DeleteRoleHandler]
