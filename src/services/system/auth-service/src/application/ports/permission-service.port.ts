import { IPermissionServicePort as IBasePermissionServicePort } from '@oes/common/interfaces/services/permission-service.interface'

type PermissionMethodsSelections =
  | 'getUserPermissions'
/**
 * Permission Service 端口接口
 */
export interface IPermissionServicePort
  extends Pick<IBasePermissionServicePort, PermissionMethodsSelections> {}
