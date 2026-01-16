import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { RpcRequest } from '../final/core/interfaces/rpc.interface'

export const RpcRequestData = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const rpcContext = ctx.switchToRpc()
  const request = rpcContext.getData<RpcRequest<any>>()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return request.data
})
