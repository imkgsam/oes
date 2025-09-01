import { IPermissionServicePort as IBasePermissionServicePort } from '@oes/common/interfaces/services/permission-service.interface'

type PermissionMethodsSelections =
  | 'getUserPermissions'
  | 'getUserRoles'
  | 'getAccountPermissions'
  | 'getAccountRoles'
  | 'checkUserPermission'
  | 'checkUserRole'
  | 'checkAccountPermission'
  | 'checkAccountRole'
  | 'getUserAllPermissions'
  | 'getAccountAllPermissions'
  | 'validatePermission'
  | 'validateRole'
  | 'getPermissionByCode'
  | 'getRoleByCode'
/**
 * Permission Service 端口接口
 */
export interface IPermissionServicePort
  extends Pick<IBasePermissionServicePort, PermissionMethodsSelections> {}
