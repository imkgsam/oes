export * from './permission'
export * from './role'
export * from './authorization'
export * from './policy'
export * from './audit'
export * from './navigation'

import { PermissionQueryHandlers } from './permission'
import { RoleQueryHandlers } from './role'
import { AuthorizationQueryHandlers } from './authorization'
import { PolicyQueryHandlers } from './policy'
import { AuditQueryHandlers } from './audit'
import { NavigationQueryHandlers } from './navigation'

export const QueryHandlers = [
  ...PermissionQueryHandlers,
  ...RoleQueryHandlers,
  ...AuthorizationQueryHandlers,
  ...PolicyQueryHandlers,
  ...AuditQueryHandlers,
  ...NavigationQueryHandlers
]
