import { SetMetadata } from '@nestjs/common';
import { ResourceSourceEnum } from '../constants/http-request-permission-controll-resource-source.enum';


export const PERMISSION_CHECK_KEY = 'permission_check';
export type ResourceSource = ResourceSourceEnum.Param | ResourceSourceEnum.Body | ResourceSourceEnum.Header | ResourceSourceEnum.Query
export interface PermissionCheckOptions {
  resourceParam?: string,
  source?: ResourceSource
}
export const PermissionCheck = (
  permission: string,
  options?: PermissionCheckOptions,
) => SetMetadata(
  PERMISSION_CHECK_KEY,
  {
    permission,
    resourceParam: options?.resourceParam,
    source: options?.source ?? 'param'
  })
