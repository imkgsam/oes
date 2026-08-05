export * from './check-permission.query'
export * from './check-permission.handler'
export * from './batch-check-permission.query'
export * from './batch-check-permission.handler'

import { BatchCheckPermissionHandler } from './batch-check-permission.handler'
import { CheckPermissionHandler } from './check-permission.handler'
import { ResolveExternalMachineAuthorizationSnapshotHandler } from './resolve-external-machine-authorization-snapshot.handler'
import { ResolvePrincipalAuthorizationHandler } from './resolve-principal-authorization.handler'
import { ResolveWorkloadIssuanceHandler } from './resolve-workload-issuance.handler'
import { ResolveDelegatedAuthorizationHandler } from './resolve-delegated-authorization.handler'
export * from './resolve-external-machine-authorization-snapshot.query'
export * from './resolve-external-machine-authorization-snapshot.handler'
export * from './resolve-principal-authorization.query'
export * from './resolve-principal-authorization.handler'
export * from './resolve-workload-issuance.query'
export * from './resolve-workload-issuance.handler'
export * from './resolve-delegated-authorization.query'
export * from './resolve-delegated-authorization.handler'

export const AuthorizationQueryHandlers = [
  BatchCheckPermissionHandler,
  CheckPermissionHandler,
  ResolveExternalMachineAuthorizationSnapshotHandler,
  ResolvePrincipalAuthorizationHandler,
  ResolveWorkloadIssuanceHandler,
  ResolveDelegatedAuthorizationHandler
]
