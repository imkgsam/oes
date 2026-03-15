export * from './get-role-by-id.query'
export * from './get-role-by-id.handler'
export * from './list-roles.query'
export * from './list-roles.handler'
export * from './list-account-roles.query'
export * from './list-account-roles.handler'
export * from './list-role-permissions.query'
export * from './list-role-permissions.handler'
export * from './list-role-accounts.query'
export * from './list-role-accounts.handler'

import { GetRoleByIdHandler } from './get-role-by-id.handler'
import { ListRolesHandler } from './list-roles.handler'
import { ListAccountRolesHandler } from './list-account-roles.handler'
import { ListRolePermissionsHandler } from './list-role-permissions.handler'
import { ListRoleAccountsHandler } from './list-role-accounts.handler'

export const RoleQueryHandlers = [
  GetRoleByIdHandler,
  ListRolesHandler,
  ListAccountRolesHandler,
  ListRolePermissionsHandler,
  ListRoleAccountsHandler
]
