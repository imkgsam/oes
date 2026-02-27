export * from './permission'
export * from './role'
export * from './authorization'
export * from './policy'

import { PermissionQueryHandlers } from './permission'
import { RoleQueryHandlers } from './role'
import { AuthorizationQueryHandlers } from './authorization'
import { PolicyQueryHandlers } from './policy'

export const QueryHandlers = [
  ...PermissionQueryHandlers,
  ...RoleQueryHandlers,
  ...AuthorizationQueryHandlers,
  ...PolicyQueryHandlers
]
