import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { RpcRequest } from '../interfaces/rpc.interface'

export const RpcRequestData = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const rpcContext = ctx.switchToRpc()
  const request = rpcContext.getData() as RpcRequest<any>
  return request.data
})
