export * from './check-permission.query'
export * from './check-permission.handler'
export * from './batch-check-permission.query'
export * from './batch-check-permission.handler'

import { BatchCheckPermissionHandler } from './batch-check-permission.handler'
import { CheckPermissionHandler } from './check-permission.handler'
import { ResolveExternalMachineAuthorizationSnapshotHandler } from './resolve-external-machine-authorization-snapshot.handler'
export * from './resolve-external-machine-authorization-snapshot.query'
export * from './resolve-external-machine-authorization-snapshot.handler'

export const AuthorizationQueryHandlers = [
  BatchCheckPermissionHandler,
  CheckPermissionHandler,
  ResolveExternalMachineAuthorizationSnapshotHandler
]
