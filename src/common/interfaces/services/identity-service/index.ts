import { IIdentityServiceHttpContract } from './http.contract'
import { IIdentityServiceRpcContract } from './rpc.contract'

/**
 * 等级： 1
 * 汇总服务接口
 */
export interface IIdentityServiceContract
  extends IIdentityServiceRpcContract,
    IIdentityServiceHttpContract {}
