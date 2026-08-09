import { Global, Module } from '@nestjs/common'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { readLocalVerifiedWorkloadIdentity } from '@oes/common/transport'
import { GatewayAssetGrpcClient } from './gateway-asset-grpc.client'
import { GatewayAuthExecutionTokenExchangeClient } from './gateway-auth-execution-token-exchange.client'
import { GatewayTrustedGrpcExecutionProducer } from './gateway-trusted-grpc-execution-producer'
import { GatewayAuthMachineWorkloadSourceCredentialClient } from './gateway-auth-machine-workload-source-credential.client'
import { GatewayMachineWorkloadSourceCredentialProvider } from './gateway-machine-workload-source-credential.provider'
import { GatewayMachineTrustedGrpcExecutionProducer } from './gateway-machine-trusted-grpc-execution-producer'

const ASSET_AUDIENCE = 'urn:oes:service:asset-service'
const SITE_AUDIENCE = 'urn:oes:service:site-service'

/** Composes the sole Gateway target-token producer with the same request-private source-credential accessor. */
@Global()
@Module({
  providers: [
    AsyncLocalTransportPrivateSourceCredentialAccessor,
    AsyncLocalTrustedExecutionContextAccessor,
    GatewayAssetGrpcClient,
    GatewayAuthMachineWorkloadSourceCredentialClient,
    { provide: GatewayMachineWorkloadSourceCredentialProvider, useFactory: (client: GatewayAuthMachineWorkloadSourceCredentialClient, accessor: AsyncLocalTransportPrivateSourceCredentialAccessor) => new GatewayMachineWorkloadSourceCredentialProvider(client, undefined, accessor), inject: [GatewayAuthMachineWorkloadSourceCredentialClient, AsyncLocalTransportPrivateSourceCredentialAccessor] },
    {
      provide: GatewayAuthExecutionTokenExchangeClient,
      useFactory: (context: AsyncLocalTrustedExecutionContextAccessor) =>
        new GatewayAuthExecutionTokenExchangeClient(context),
      inject: [AsyncLocalTrustedExecutionContextAccessor]
    },
    {
      provide: TrustedExecutionRegistry,
      useFactory: () => new TrustedExecutionRegistry({
        issuer: requireEnvironment('AUTH_EXECUTION_ISSUER'),
        audiences: [ASSET_AUDIENCE, SITE_AUDIENCE],
        workloadIdentities: [requireEnvironment('OES_WORKLOAD_SPIFFE_ID')]
      })
    },
    { provide: CertificateBoundExecutionTokenCache, useFactory: () => new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 30 }) },
    {
      provide: TrustedGrpcMetadataProvider,
      useFactory: (
        contextAccessor: AsyncLocalTrustedExecutionContextAccessor,
        registry: TrustedExecutionRegistry,
        tokenCache: CertificateBoundExecutionTokenCache,
        exchangeClient: GatewayAuthExecutionTokenExchangeClient,
        sourceCredentialAccessor: AsyncLocalTransportPrivateSourceCredentialAccessor
      ) => new TrustedGrpcMetadataProvider({
        contextAccessor,
        registry,
        tokenCache,
        exchangeClient,
        sourceCredentialAccessor,
        localWorkloadIdentity: { getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity() }
      }),
      inject: [AsyncLocalTrustedExecutionContextAccessor, TrustedExecutionRegistry, CertificateBoundExecutionTokenCache, GatewayAuthExecutionTokenExchangeClient, AsyncLocalTransportPrivateSourceCredentialAccessor]
    },
    {
      provide: GatewayTrustedGrpcExecutionProducer,
      useFactory: (context: AsyncLocalTrustedExecutionContextAccessor, metadata: TrustedGrpcMetadataProvider) => new GatewayTrustedGrpcExecutionProducer(context, metadata),
      inject: [AsyncLocalTrustedExecutionContextAccessor, TrustedGrpcMetadataProvider]
    },
    { provide: GatewayMachineTrustedGrpcExecutionProducer, useFactory: (source: GatewayMachineWorkloadSourceCredentialProvider, metadata: TrustedGrpcMetadataProvider) => new GatewayMachineTrustedGrpcExecutionProducer(source, metadata), inject: [GatewayMachineWorkloadSourceCredentialProvider, TrustedGrpcMetadataProvider] }
  ],
  exports: [
    AsyncLocalTransportPrivateSourceCredentialAccessor,
    GatewayAssetGrpcClient,
    GatewayTrustedGrpcExecutionProducer,
    GatewayMachineWorkloadSourceCredentialProvider,
    GatewayMachineTrustedGrpcExecutionProducer
  ]
})
export class GatewayTrustedGrpcExecutionModule {}

/** Requires deployment-owned STS registry facts and never creates synthetic authority. */
function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}
