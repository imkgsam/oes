import { Body, Controller, ForbiddenException, Headers, HttpException, HttpStatus, Post, Query, Req, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RpcException } from '@nestjs/microservices'
import { status } from '@grpc/grpc-js'
import { AuthGrpcAdapter } from '../../modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter'

/** Handles the sole disabled-by-default external API-key exchange entry shape without logging credentials. */
@Controller('external/auth')
export class ExternalAuthExchangeController {
  constructor(private readonly auth: AuthGrpcAdapter, private readonly config: ConfigService) {}
  @Post('exchange')
  async exchange(@Headers() headers: Record<string, string>, @Body() body: unknown, @Query() query: Record<string, unknown>, @Req() request: any) {
    if (!this.config.get<boolean>('gateway.externalApi.externalOpening', false)) {
      throw new ForbiddenException({ code: 'EXTERNAL_API_ACCESS_DENIED', message: 'External API access denied' })
    }
    const authorization = headers.authorization ?? headers.Authorization
    if (Object.keys(query).length || request.cookies?.authorization || !authorization || !/^ApiKey oek_live_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization) || body && Object.keys(body as object).length) {
      throw new UnauthorizedException({ code: 'EXTERNAL_API_AUTHENTICATION_FAILED', message: 'External API authentication failed' })
    }
    try {
      const result = await this.auth.exchangeExternalApiKey(
        { presentedApiKey: authorization.slice(7) },
        { requestId: normalizeHeader(headers['x-request-id']), traceId: normalizeHeader(headers['x-trace-id']) }
      )
      return { access_token: result.accessToken, token_type: result.tokenType, expires_in: Number(result.expiresInSeconds ?? 0) }
    } catch (error) {
      if (isRateLimited(error)) {
        throw new HttpException({ code: 'EXTERNAL_API_RATE_LIMITED', message: 'External API rate limited' }, HttpStatus.TOO_MANY_REQUESTS)
      }
      throw new UnauthorizedException({ code: 'EXTERNAL_API_AUTHENTICATION_FAILED', message: 'External API authentication failed' })
    }
  }
}

/** Normalizes one optional request header before it is forwarded into trusted internal correlation metadata. */
function normalizeHeader(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

/** Maps gateway/auth throttling failures onto the frozen non-enumerating external category. */
function isRateLimited(error: unknown): boolean {
  if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) return true
  if (!(error instanceof RpcException)) return false
  const payload = error.getError() as { grpcStatus?: unknown; code?: unknown } | undefined
  return payload?.grpcStatus === status.RESOURCE_EXHAUSTED || payload?.code === HttpStatus.TOO_MANY_REQUESTS
}
