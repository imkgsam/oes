import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import {
  DownstreamRequestSource,
  GatewayAuthenticatedUser
} from '../grpc/gateway-downstream-source.mapper'
import { getHeaderValue, HttpRequestLike } from '../http/http-request.util'

interface GatewayRequestLike extends HttpRequestLike {
  user?: GatewayAuthenticatedUser
}

export const DownstreamSource = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DownstreamRequestSource => {
    const request = ctx.switchToHttp().getRequest<GatewayRequestLike>()

    return {
      user: request.user,
      requestId: getHeaderValue(request, 'x-request-id')?.trim() || undefined,
      traceId: getHeaderValue(request, 'x-trace-id')?.trim() || undefined,
      traceparent: getHeaderValue(request, 'traceparent')?.trim() || undefined,
      tracestate: getHeaderValue(request, 'tracestate')?.trim() || undefined
    }
  }
)
