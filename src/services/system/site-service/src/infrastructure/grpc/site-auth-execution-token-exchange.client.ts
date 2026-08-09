import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { ExecutionTokenExchangeClient, ExecutionTokenExchangeRequest, ExecutionTokenExchangeResult } from '@oes/common/authorization'
import { EXECUTION_TOKEN_SERVICE_NAME, ExecutionTokenServiceClient } from '@oes/common/generated/auth_service'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'

/** SiteAuthExecutionTokenExchangeClient reuses Auth STS for target-bound Site-to-Asset hops. */
export class SiteAuthExecutionTokenExchangeClient implements ExecutionTokenExchangeClient {
  private client?: ClientGrpc
  private service?: ExecutionTokenServiceClient

  async exchange(request: ExecutionTokenExchangeRequest, metadata: Metadata): Promise<ExecutionTokenExchangeResult> {
    const response = await safeGrpcCall(this.getService().exchangeExecutionToken({ targetAudience: request.targetAudience, requestedPermissionCodes: [...request.requestedPermissionCodes] }, metadata), { caller: 'site-service', method: 'ExecutionTokenService.exchangeExecutionToken' })
    return Object.freeze({ accessToken: response.accessToken ?? '', tokenType: response.tokenType ?? '', expiresAtUnixSeconds: Number.parseInt(response.expiresAtUnixSeconds ?? '', 10), expiresInSeconds: Number.parseInt(response.expiresInSeconds ?? '', 10), kid: response.kid ?? '', grantedPermissionCodes: Object.freeze([...(response.grantedPermissionCodes ?? [])]), grantedAudience: response.grantedAudience ?? '' })
  }

  private getService(): ExecutionTokenServiceClient {
    if (!this.service) {
      const host = process.env.AUTH_SERVICE_HOST?.trim() || '127.0.0.1'
      const port = process.env.AUTH_SERVICE_PORT?.trim() || '50050'
      this.client = ClientProxyFactory.create({ transport: Transport.GRPC, options: { package: 'auth_service', protoPath: resolveCommonProtoPath('auth_service/execution_token.proto'), url: `${host}:${port}`, credentials: createGrpcClientCredentials() } }) as unknown as ClientGrpc
      this.service = this.client.getService<ExecutionTokenServiceClient>(EXECUTION_TOKEN_SERVICE_NAME)
    }
    return this.service
  }
}
