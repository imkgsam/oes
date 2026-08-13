import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { Metadata } from '@grpc/grpc-js'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  ExecutionTokenExchangeClient,
  ExecutionTokenExchangeRequest,
  ExecutionTokenExchangeResult
} from '@oes/common/authorization'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  ExecutionTokenServiceClient
} from '@oes/common/generated/auth_service'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'

export class CrmPartyExecutionTokenExchangeClient implements ExecutionTokenExchangeClient {
  private client?: ClientGrpc
  private service?: ExecutionTokenServiceClient

  async exchange(
    request: ExecutionTokenExchangeRequest,
    metadata: Metadata
  ): Promise<ExecutionTokenExchangeResult> {
    const result = await safeGrpcCall(
      this.getService().exchangeExecutionToken(
        { targetAudience: request.targetAudience, requestedPermissionCodes: [...request.requestedPermissionCodes] },
        metadata
      ),
      { caller: 'crm-service', method: 'ExchangeExecutionToken' }
    )
    return Object.freeze({
      accessToken: result.accessToken ?? '', tokenType: result.tokenType ?? '',
      expiresAtUnixSeconds: Number.parseInt(result.expiresAtUnixSeconds ?? '', 10),
      expiresInSeconds: Number.parseInt(result.expiresInSeconds ?? '', 10), kid: result.kid ?? '',
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
        url: authUrl(), credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    this.service ??= this.client.getService<ExecutionTokenServiceClient>(EXECUTION_TOKEN_SERVICE_NAME)
    return this.service
  }
}

function authUrl(): string { return `${process.env.AUTH_SERVICE_HOST?.trim() || '127.0.0.1'}:${process.env.AUTH_SERVICE_PORT?.trim() || '50050'}` }
