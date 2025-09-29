import { IAuthServiceHttpContract } from './http.contract'
import { IAuthServiceRpcContract } from './rpc.contract'

export interface IAuthServiceContract extends IAuthServiceHttpContract, IAuthServiceRpcContract {}

export * from './http.contract'
export * from './rpc.contract'
