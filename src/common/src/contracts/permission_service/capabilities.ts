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

  // OUTDATED: compatibility capability for the historical context RPC; do not use for new resource authorization integrations.
  checkPermissionWithContext: {
    description:
      'OUTDATED compatibility RPC for historical RBAC + ABAC evaluation context checks',
    transport: [Transport.GRPC]
  } as Cability<PermissionCheckWithContextInput, AuthzDecisionOutput>
}
