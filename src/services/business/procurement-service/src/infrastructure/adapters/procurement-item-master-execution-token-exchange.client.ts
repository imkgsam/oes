import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import {
  ExecutionTokenExchangeClient,
  ExecutionTokenExchangeRequest,
  ExecutionTokenExchangeResult
} from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  ExecutionTokenServiceClient
} from '@oes/common/generated/auth_service'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'

/** Exchanges PROCUREMENT's private source credential for one target-bound Item Master token. */
export class ProcurementItemMasterExecutionTokenExchangeClient implements ExecutionTokenExchangeClient {
  private client?: ClientGrpc
  private service?: ExecutionTokenServiceClient

  async exchange(
    request: ExecutionTokenExchangeRequest,
    metadata: Metadata
  ): Promise<ExecutionTokenExchangeResult> {
    const result = await safeGrpcCall(
      this.getService().exchangeExecutionToken(
        {
          targetAudience: request.targetAudience,
          requestedPermissionCodes: [...request.requestedPermissionCodes]
        },
        metadata
      ),
      { caller: 'procurement-service', method: 'ExchangeExecutionToken' }
    )
    return Object.freeze({
      accessToken: result.accessToken ?? '',
      tokenType: result.tokenType ?? '',
      expiresAtUnixSeconds: Number.parseInt(result.expiresAtUnixSeconds ?? '', 10),
      expiresInSeconds: Number.parseInt(result.expiresInSeconds ?? '', 10),
      kid: result.kid ?? '',
      grantedPermissionCodes: Object.freeze([...(result.grantedPermissionCodes ?? [])]),
      grantedAudience: result.grantedAudience ?? ''
    })
  }

  private getService(): ExecutionTokenServiceClient {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/execution_token.proto'),
        url: `${process.env.AUTH_SERVICE_HOST?.trim() || '127.0.0.1'}:${process.env.AUTH_SERVICE_PORT?.trim() || '50050'}`,
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return (this.service ??= this.client.getService<ExecutionTokenServiceClient>(
      EXECUTION_TOKEN_SERVICE_NAME
    ))
  }
}
