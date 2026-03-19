export * from './create-permission.command'
export * from './create-permission.handler'
export * from './batch-create-permissions.command'
export * from './batch-create-permissions.handler'
export * from './update-permission.command'
export * from './update-permission.handler'
export * from './delete-permission.command'
export * from './delete-permission.handler'

import { CreatePermissionHandler } from './create-permission.handler'
import { BatchCreatePermissionsHandler } from './batch-create-permissions.handler'
import { UpdatePermissionHandler } from './update-permission.handler'
import { DeletePermissionHandler } from './delete-permission.handler'

export const PermissionCommandHandlers = [
  CreatePermissionHandler,
  BatchCreatePermissionsHandler,
  UpdatePermissionHandler,
  DeletePermissionHandler
]
