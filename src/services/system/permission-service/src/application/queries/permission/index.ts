export * from './get-permission-by-id.query'
export * from './get-permission-by-id.handler'
export * from './get-permission-by-code.query'
export * from './get-permission-by-code.handler'
export * from './list-permissions.query'
export * from './list-permissions.handler'
export * from './list-permissions-by-module.query'
export * from './list-permissions-by-module.handler'
export * from './list-permissions-paged.query'
export * from './list-permissions-paged.handler'
export * from './list-permission-roles.query'
export * from './list-permission-roles.handler'

import { GetPermissionByIdHandler } from './get-permission-by-id.handler'
import { GetPermissionByCodeHandler } from './get-permission-by-code.handler'
import { ListPermissionsHandler } from './list-permissions.handler'
import { ListPermissionsByModuleHandler } from './list-permissions-by-module.handler'
import { ListPermissionsPagedHandler } from './list-permissions-paged.handler'
import { ListPermissionRolesHandler } from './list-permission-roles.handler'

export const PermissionQueryHandlers = [
  GetPermissionByIdHandler,
  GetPermissionByCodeHandler,
  ListPermissionsHandler,
  ListPermissionsByModuleHandler,
  ListPermissionsPagedHandler,
  ListPermissionRolesHandler
]
