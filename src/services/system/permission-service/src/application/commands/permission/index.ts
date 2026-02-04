export * from './create-permission.command'
export * from './create-permission.handler'
export * from './delete-permission.command'
export * from './delete-permission.handler'

import { CreatePermissionHandler } from './create-permission.handler'
import { DeletePermissionHandler } from './delete-permission.handler'

export const PermissionCommandHandlers = [CreatePermissionHandler, DeletePermissionHandler]
