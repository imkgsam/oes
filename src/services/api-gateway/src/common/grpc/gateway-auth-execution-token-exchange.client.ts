import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  ExecutionTokenExchangeClient,
  ExecutionTokenExchangeRequest,
  ExecutionTokenExchangeResult
} from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { EXECUTION_TOKEN_SERVICE_NAME, ExecutionTokenServiceClient } from '@oes/common/generated/auth_service'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'

/** Exchanges a current transport-private source credential for one exact Asset ExecutionToken. */
export class GatewayAuthExecutionTokenExchangeClient implements ExecutionTokenExchangeClient {
  private client?: ClientGrpc
  private service?: ExecutionTokenServiceClient

  constructor(private readonly contextAccessor: AsyncLocalTrustedExecutionContextAccessor) {}

  /** Uses the Common carrier-built STS metadata and exposes only cache-safe result facts. */
  async exchange(
    request: ExecutionTokenExchangeRequest,
    metadata: Parameters<ExecutionTokenExchangeClient['exchange']>[1]
  ): Promise<ExecutionTokenExchangeResult> {
    const response = await safeGrpcCall(
      this.executionTokenService().exchangeExecutionToken(
        {
          targetAudience: request.targetAudience,
          requestedPermissionCodes: [...request.requestedPermissionCodes]
        },
        metadata
      ),
      { caller: 'api-gateway', method: 'ExecutionTokenService.exchangeExecutionToken' }
    )
    return Object.freeze({
      accessToken: response.accessToken ?? '',
      tokenType: response.tokenType ?? '',
      expiresAtUnixSeconds: Number.parseInt(response.expiresAtUnixSeconds ?? '', 10),
      expiresInSeconds: Number.parseInt(response.expiresInSeconds ?? '', 10),
      kid: response.kid ?? '',
      grantedPermissionCodes: Object.freeze([...(response.grantedPermissionCodes ?? [])]),
      grantedAudience: response.grantedAudience ?? ''
    })
  }

  /** Lazily creates the dedicated mTLS Auth STS client and keeps it outside legacy Auth RPC metadata. */
  private executionTokenService(): ExecutionTokenServiceClient {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/execution_token.proto'),
        url: resolveAuthUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    this.service ??= this.client.getService<ExecutionTokenServiceClient>(EXECUTION_TOKEN_SERVICE_NAME)
    return this.service
  }
}

/** Resolves the Auth STS endpoint while retaining the local development destination only outside production. */
function resolveAuthUrl(): string {
  const host = process.env.AUTH_SERVICE_HOST?.trim()
  const port = process.env.AUTH_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50050'
  throw new Error('trusted auth-service gRPC url is unavailable')
}
