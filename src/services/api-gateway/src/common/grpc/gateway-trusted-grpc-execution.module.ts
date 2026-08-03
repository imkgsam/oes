import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import { Global, Module } from '@nestjs/common'
import {
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  createGrpcClientCredentials,
  readLocalVerifiedWorkloadIdentity
} from '@oes/common/transport'
import { GatewayAuthExecutionTokenExchangeClient } from './gateway-auth-execution-token-exchange.client'
import { GatewayTrustedGrpcExecutionProducer } from './gateway-trusted-grpc-execution-producer'
import { GatewayAssetGrpcClient } from './gateway-asset-grpc.client'

const ASSET_AUDIENCE = 'urn:oes:service:asset-service'

/** Shares one certificate-bound Auth STS/cache/metadata composition across Gateway Asset callers. */
@Global()
@Module({
  providers: [
    AsyncLocalTrustedExecutionContextAccessor,
    {
      provide: GatewayAssetGrpcClient,
      useFactory: () => new GatewayAssetGrpcClient()
    },
    {
      provide: GatewayAuthExecutionTokenExchangeClient,
      useFactory: (contextAccessor: AsyncLocalTrustedExecutionContextAccessor) =>
        new GatewayAuthExecutionTokenExchangeClient(
          createGatewayAuthStsGrpcClient,
          contextAccessor
        ),
      inject: [AsyncLocalTrustedExecutionContextAccessor]
    },
    {
      provide: TrustedExecutionRegistry,
      useFactory: () =>
        new TrustedExecutionRegistry({
          issuer: requireEnvironmentValue('AUTH_EXECUTION_ISSUER'),
          audiences: [ASSET_AUDIENCE],
          workloadIdentities: [requireEnvironmentValue('OES_WORKLOAD_SPIFFE_ID')]
        })
    },
    {
      provide: CertificateBoundExecutionTokenCache,
      useFactory: () => new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 30 })
    },
    {
      provide: TrustedGrpcMetadataProvider,
      useFactory: (
        contextAccessor: AsyncLocalTrustedExecutionContextAccessor,
        registry: TrustedExecutionRegistry,
        tokenCache: CertificateBoundExecutionTokenCache,
        exchangeClient: GatewayAuthExecutionTokenExchangeClient
      ) =>
        new TrustedGrpcMetadataProvider({
          contextAccessor,
          registry,
          tokenCache,
          exchangeClient,
          localWorkloadIdentity: {
            getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity()
          }
        }),
      inject: [
        AsyncLocalTrustedExecutionContextAccessor,
        TrustedExecutionRegistry,
        CertificateBoundExecutionTokenCache,
        GatewayAuthExecutionTokenExchangeClient
      ]
    },
    {
      provide: GatewayTrustedGrpcExecutionProducer,
      useFactory: (
        contextAccessor: AsyncLocalTrustedExecutionContextAccessor,
        metadataProvider: TrustedGrpcMetadataProvider
      ) => new GatewayTrustedGrpcExecutionProducer(contextAccessor, metadataProvider),
      inject: [AsyncLocalTrustedExecutionContextAccessor, TrustedGrpcMetadataProvider]
    }
  ],
  exports: [GatewayAssetGrpcClient, GatewayTrustedGrpcExecutionProducer]
})
export class GatewayTrustedGrpcExecutionModule {}

/** Creates the dedicated mTLS Auth STS client without widening Gateway's general Auth proto surface. */
function createGatewayAuthStsGrpcClient(): ClientGrpc {
  return ClientProxyFactory.create({
    transport: Transport.GRPC,
    options: {
      url: resolveAuthGrpcUrl(),
      package: 'auth_service',
      protoPath: resolveCommonProtoPath('auth_service/execution_token.proto'),
      credentials: createGrpcClientCredentials()
    }
  }) as unknown as ClientGrpc
}

/** Resolves the exact Auth endpoint while refusing a missing production destination. */
function resolveAuthGrpcUrl(): string {
  const host = process.env.AUTH_SERVICE_HOST?.trim()
  const port = process.env.AUTH_SERVICE_PORT?.trim()
  if (host && port) return `${host === 'localhost' ? '127.0.0.1' : host}:${port}`
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50050'
  throw new Error('trusted auth-service gRPC url is unavailable')
}

/** Requires one deployment-owned trust value without inventing a local authority fallback. */
function requireEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}
