export * from './get-permission-by-id.query'
export * from './get-permission-by-id.handler'
export * from './get-permission-by-code.query'
export * from './get-permission-by-code.handler'
export * from './list-permissions-paged.query'
export * from './list-permissions-paged.handler'
export * from './list-permission-roles.query'
export * from './list-permission-roles.handler'

import { GetPermissionByIdHandler } from './get-permission-by-id.handler'
import { GetPermissionByCodeHandler } from './get-permission-by-code.handler'
import { ListPermissionsPagedHandler } from './list-permissions-paged.handler'
import { ListPermissionRolesHandler } from './list-permission-roles.handler'

export const PermissionQueryHandlers = [
  GetPermissionByIdHandler,
  GetPermissionByCodeHandler,
  ListPermissionsPagedHandler,
  ListPermissionRolesHandler
]
