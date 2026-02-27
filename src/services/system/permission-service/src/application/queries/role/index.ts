export * from './get-role-by-id.query'
export * from './get-role-by-id.handler'
export * from './list-roles.query'
export * from './list-roles.handler'
export * from './list-account-roles.query'
export * from './list-account-roles.handler'

import { GetRoleByIdHandler } from './get-role-by-id.handler'
import { ListRolesHandler } from './list-roles.handler'
import { ListAccountRolesHandler } from './list-account-roles.handler'

export const RoleQueryHandlers = [GetRoleByIdHandler, ListRolesHandler, ListAccountRolesHandler]
