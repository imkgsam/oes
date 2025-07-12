import { SetMetadata } from '@nestjs/common'

export const PERMISSION_CHECK_KEY = 'permission_check'
export interface PermissionCheckOptions {
  resourceParam?: string
}

export enum PermissionCheckType {
  ALL = 'ALL',
  ANY = 'ANY',
}

export const PermissionCheckAll = (permissions: string[]) => SetMetadata(PERMISSION_CHECK_KEY, { type: PermissionCheckType.ALL, permissions })
export const PermissionCheckAny = (permissions: string[]) => SetMetadata(PERMISSION_CHECK_KEY, { type: PermissionCheckType.ANY, permissions })