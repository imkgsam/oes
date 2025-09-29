import { IPermissionServiceContract } from '@oes/common/interfaces/services/permission-service'

//所需的方法
type PermissionMethodsSelections = 'getUserPermissions'

//Permission Service 端口接口
export interface IPermissionServicePort
  extends Pick<IPermissionServiceContract, PermissionMethodsSelections> {}
