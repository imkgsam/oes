export * from './get-role-by-id.query'
export * from './get-role-by-id.handler'
export * from './get-role-template-by-id.query'
export * from './get-role-template-by-id.handler'
export * from './list-account-roles.query'
export * from './list-account-roles.handler'
export * from './list-role-permissions.query'
export * from './list-role-permissions.handler'
export * from './list-role-template-permissions.query'
export * from './list-role-template-permissions.handler'
export * from './list-role-accounts.query'
export * from './list-role-accounts.handler'
export * from './list-role-instances.query'
export * from './list-role-instances.handler'
export * from './list-role-templates.query'
export * from './list-role-templates.handler'
export * from './get-account-role-selection.query'
export * from './get-account-role-selection.handler'

import { GetRoleByIdHandler } from './get-role-by-id.handler'
import { GetRoleTemplateByIdHandler } from './get-role-template-by-id.handler'
import { ListAccountRolesHandler } from './list-account-roles.handler'
import { ListRolePermissionsHandler } from './list-role-permissions.handler'
import { ListRoleTemplatePermissionsHandler } from './list-role-template-permissions.handler'
import { ListRoleAccountsHandler } from './list-role-accounts.handler'
import { ListRoleInstancesHandler } from './list-role-instances.handler'
import { ListRoleTemplatesHandler } from './list-role-templates.handler'
import { GetAccountRoleSelectionHandler } from './get-account-role-selection.handler'

export const RoleQueryHandlers = [
  GetRoleByIdHandler,
  GetRoleTemplateByIdHandler,
  ListAccountRolesHandler,
  ListRolePermissionsHandler,
  ListRoleTemplatePermissionsHandler,
  ListRoleAccountsHandler,
  ListRoleInstancesHandler,
  ListRoleTemplatesHandler,
  GetAccountRoleSelectionHandler
]
