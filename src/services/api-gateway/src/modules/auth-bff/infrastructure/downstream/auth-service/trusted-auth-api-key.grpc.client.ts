import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  EXTERNAL_API_KEY_CREDENTIAL_SERVICE_NAME,
  ExecutionTokenServiceClient,
  ExternalApiKeyCredentialServiceClient
} from '@oes/common/generated/auth_service'
import { resolveAuthGrpcUrl } from '../../../../../app.module'

const AUTH_SERVICE_AUDIENCE = 'urn:oes:service:auth-service'
const EXTERNAL_API_KEY_EXCHANGE_PERMISSION = 'auth.internal.external_api_key.exchange'

/** Uses the frozen mTLS + ExecutionToken path only for Gateway's external API-key exchange hop. */
export class TrustedAuthApiKeyGrpcClient {
  private client?: ClientGrpc
  private executionTokenService?: ExecutionTokenServiceClient
  private externalApiKeyService?: ExternalApiKeyCredentialServiceClient

  async issueExchangeToken(metadata: Metadata): Promise<string> {
    const response = await safeGrpcCall(
      this.executionTokenServiceClient().exchangeExecutionToken(
        {
          targetAudience: AUTH_SERVICE_AUDIENCE,
          requestedPermissionCodes: [EXTERNAL_API_KEY_EXCHANGE_PERMISSION]
        },
        metadata
      ),
      {
        caller: 'api-gateway',
        method: 'ExecutionTokenService.exchangeExecutionToken'
      }
    )

    if (!response.accessToken) {
      throw new Error('trusted execution token is unavailable')
    }
    return response.accessToken
  }

  async exchangeExternalApiKey(
    request: { presentedApiKey: string },
    metadata: Metadata,
    executionToken: string
  ) {
    metadata.set('authorization', `Bearer ${executionToken}`)
    return safeGrpcCall(
      this.externalApiKeyServiceClient().exchangeExternalApiKey(request, metadata),
      {
        caller: 'api-gateway',
        method: 'ExternalApiKeyCredentialService.exchangeExternalApiKey'
      }
    )
  }

  private executionTokenServiceClient(): ExecutionTokenServiceClient {
    if (!this.executionTokenService) {
      this.executionTokenService = this.grpcClient().getService<ExecutionTokenServiceClient>(
        EXECUTION_TOKEN_SERVICE_NAME
      )
    }
    return this.executionTokenService
  }

  private externalApiKeyServiceClient(): ExternalApiKeyCredentialServiceClient {
    if (!this.externalApiKeyService) {
      this.externalApiKeyService =
        this.grpcClient().getService<ExternalApiKeyCredentialServiceClient>(
          EXTERNAL_API_KEY_CREDENTIAL_SERVICE_NAME
        )
    }
    return this.externalApiKeyService
  }

  private grpcClient(): ClientGrpc {
    if (!this.client) {
      const url = resolveAuthGrpcUrl()
      if (!url) {
        throw new Error('trusted auth-service gRPC url is unavailable')
      }

      this.client = ClientProxyFactory.create({
        transport: Transport.GRPC,
        options: {
          url,
          package: 'auth_service',
          protoPath: [
            resolveCommonProtoPath('auth_service/auth.proto'),
            resolveCommonProtoPath('auth_service/execution_token.proto'),
            resolveCommonProtoPath('auth_service/external_api_key.proto')
          ],
          credentials: createGrpcClientCredentials()
        }
      }) as unknown as ClientGrpc
    }

    return this.client
  }
}
