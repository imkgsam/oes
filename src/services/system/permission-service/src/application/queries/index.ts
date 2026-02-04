export * from './permission'
export * from './role'
export * from './authorization'

import { PermissionQueryHandlers } from './permission'
import { RoleQueryHandlers } from './role'
import { AuthorizationQueryHandlers } from './authorization'

export const QueryHandlers = [
  ...PermissionQueryHandlers,
  ...RoleQueryHandlers,
  ...AuthorizationQueryHandlers
]
