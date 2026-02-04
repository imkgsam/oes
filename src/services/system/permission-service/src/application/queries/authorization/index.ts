export * from './check-user-permission.query'
export * from './check-user-permission.handler'

import { CheckUserPermissionHandler } from './check-user-permission.handler'

export const AuthorizationQueryHandlers = [CheckUserPermissionHandler]
