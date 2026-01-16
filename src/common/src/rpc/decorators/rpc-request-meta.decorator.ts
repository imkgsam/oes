import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import {
  RpcRequestMeta as RPCRequestMeta,
  RpcRequest
} from '../final/core/interfaces/rpc.interface'

export const RpcRequestMeta = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RPCRequestMeta => {
    const rpcContext = ctx.switchToRpc()
    const request = rpcContext.getData<RpcRequest<any>>()
    return request.meta
  }
)
