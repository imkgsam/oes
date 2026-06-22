import {
  PermissionCheckInput,
  PermissionCheckOutput
} from './contract'
import { Cability, Transport } from '../../core/interfaces/capability.interface'

export const PermissionCheckCapability = {
  checkPermission: {
    description: 'Pure RBAC permission check',
    transport: [Transport.GRPC]
  } as Cability<PermissionCheckInput, PermissionCheckOutput>
}
