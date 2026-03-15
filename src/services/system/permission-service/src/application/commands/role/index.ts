export * from './create-role.command'
export * from './create-role.handler'
export * from './update-role.command'
export * from './update-role.handler'
export * from './set-role-enabled.command'
export * from './set-role-enabled.handler'
export * from './delete-role.command'
export * from './delete-role.handler'
export * from './assign-role-permission.command'
export * from './assign-role-permission.handler'
export * from './revoke-role-permission.command'
export * from './revoke-role-permission.handler'
export * from './assign-account-role.command'
export * from './assign-account-role.handler'
export * from './revoke-account-role.command'
export * from './revoke-account-role.handler'

import { CreateRoleHandler } from './create-role.handler'
import { UpdateRoleHandler } from './update-role.handler'
import { SetRoleEnabledHandler } from './set-role-enabled.handler'
import { DeleteRoleHandler } from './delete-role.handler'
import { AssignRolePermissionHandler } from './assign-role-permission.handler'
import { RevokeRolePermissionHandler } from './revoke-role-permission.handler'
import { AssignAccountRoleHandler } from './assign-account-role.handler'
import { RevokeAccountRoleHandler } from './revoke-account-role.handler'

export const RoleCommandHandlers = [
  CreateRoleHandler,
  UpdateRoleHandler,
  SetRoleEnabledHandler,
  DeleteRoleHandler,
  AssignRolePermissionHandler,
  RevokeRolePermissionHandler,
  AssignAccountRoleHandler,
  RevokeAccountRoleHandler
]
