import { IAuthServiceHttpContract } from './http.contract'
import { IAuthServiceRpcContract } from './rpc.contract'

export interface IAuthServiceContract extends IAuthServiceHttpContract, IAuthServiceRpcContract {}
