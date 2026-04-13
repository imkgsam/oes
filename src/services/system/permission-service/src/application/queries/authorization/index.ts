export * from './check-permission.query'
export * from './check-permission.handler'
export * from './batch-check-permission.query'
export * from './batch-check-permission.handler'
export * from './check-permission-with-context.query'
export * from './check-permission-with-context.handler'

import { BatchCheckPermissionHandler } from './batch-check-permission.handler'
import { CheckPermissionHandler } from './check-permission.handler'
import { CheckPermissionWithContextHandler } from './check-permission-with-context.handler'

export const AuthorizationQueryHandlers = [
  BatchCheckPermissionHandler,
  CheckPermissionHandler,
  CheckPermissionWithContextHandler
]
