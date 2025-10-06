import { IPermissionServiceContract } from '@oes/common/interfaces/services/permission-service'

type PermissionMethodsSelections =
  | 'checkUserPermission'
  | 'getUserPermissions'
  | 'getUserRoles'
  | 'validatePermission'

/**
 * Permission Service 端口接口
 *
 * 职责：
 * 1. 定义与权限服务的RPC通信接口
 * 2. 提供权限验证和检查能力
 * 3. 支持资源访问权限控制
 * 4. 封装权限服务的依赖
 */
export interface IPermissionServicePort
  extends Pick<IPermissionServiceContract, PermissionMethodsSelections> {}
