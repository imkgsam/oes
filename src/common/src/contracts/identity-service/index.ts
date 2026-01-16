// File: src/common/interfaces/services/identity-service/http.contract.ts
import { IIdentityServiceHttpContract } from './http.contract'
import { IIdentityServiceRpcContract } from './rpc.contract'

// 模块Contract 总接口
export interface IIdentityServiceContract
  extends IIdentityServiceRpcContract,
    IIdentityServiceHttpContract {}

export * from './http.contract'
export * from './rpc.contract'
