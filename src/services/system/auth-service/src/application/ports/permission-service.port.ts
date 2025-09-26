import { IPermissionServiceContract } from '@oes/common/interfaces/services/permission-service'

type PermissionMethodsSelections = 'getUserPermissions'
/**
 * Permission Service 端口接口
 */
export interface IPermissionServicePort
  extends Pick<IPermissionServiceContract, PermissionMethodsSelections> {}
