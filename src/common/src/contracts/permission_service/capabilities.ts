import {
  PermissionCheckInput,
  PermissionCheckOutput,
  PermissionCheckWithContextInput,
  AuthzDecisionOutput
} from './contract'
import { Cability, Transport } from '../../core/interfaces/capability.interface'

export const PermissionCheckCapability = {
  checkPermission: {
    description: 'Pure RBAC permission check',
    transport: [Transport.GRPC]
  } as Cability<PermissionCheckInput, PermissionCheckOutput>,

  checkPermissionWithContext: {
    description: 'RBAC + ABAC permission check with evaluation context',
    transport: [Transport.GRPC]
  } as Cability<PermissionCheckWithContextInput, AuthzDecisionOutput>
}
