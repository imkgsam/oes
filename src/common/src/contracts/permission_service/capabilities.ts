import { PermissionCheckInput, PermissionCheckOutput } from './contract'
import { Cability, Transport } from '../../core/interfaces/capability.interface'

/**
 * Capability 文件只是用于展示语义化的能力定义
 */
export const PermissionCheckCapability = {
  checkAccountPermission: {
    description: 'Check if an account has a specific permission',
    transport: [Transport.GRPC]
  } as Cability<PermissionCheckInput, PermissionCheckOutput>,

  checkAccountPermissionScope: {
    description: 'Check if an account has a specific permission and return the scopes',
    transport: [Transport.GRPC]
  } as Cability<PermissionCheckInput, PermissionCheckOutput>
}
