export * from './check-account-permission.query'
export * from './check-account-permission.handler'

import { CheckAccountPermissionHandler } from './check-account-permission.handler'

export const AuthorizationQueryHandlers = [CheckAccountPermissionHandler]
