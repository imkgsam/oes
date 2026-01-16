import { IPermissionServiceHttpContract } from './http.contract'
import { IPermissionServiceRpcContract } from './rpc.contract'

export interface IPermissionServiceContract
  extends IPermissionServiceRpcContract,
    IPermissionServiceHttpContract {}
