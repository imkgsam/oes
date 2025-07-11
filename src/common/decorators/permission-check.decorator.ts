import { SetMetadata } from '@nestjs/common'

export const PERMISSION_CHECK_KEY = 'permission_check'
export interface PermissionCheckOptions {
  resourceParam?: string
}
export const PermissionCheck = (permission: string) =>
  SetMetadata(PERMISSION_CHECK_KEY, { permission })
