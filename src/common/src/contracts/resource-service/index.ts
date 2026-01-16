import { IResourceServiceHttpContract } from './http.contract'
import { IResourceServiceRpcDomainContract } from './rpc.contract'

export interface IResourceServiceContract
  extends IResourceServiceRpcDomainContract,
    IResourceServiceHttpContract {}

// 导出所有接口
export * from './rpc.contract'
export * from './http.contract'
