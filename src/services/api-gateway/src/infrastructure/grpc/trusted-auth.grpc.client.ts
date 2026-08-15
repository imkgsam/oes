import { Metadata } from '@grpc/grpc-js'
import { Global, Module } from '@nestjs/common'
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices'
import {
  AsyncLocalTransportPrivateSourceCredentialAccessor,
  AsyncLocalTrustedExecutionContextAccessor,
  CertificateBoundExecutionTokenCache,
  ExecutionTokenExchangeClient,
  ExecutionTokenExchangeRequest,
  ExecutionTokenExchangeResult,
  TrustedExecutionRegistry,
  TrustedGrpcMetadataProvider
} from '@oes/common/authorization'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  ExecutionTokenServiceClient
} from '@oes/common/generated/auth_service'
import {
  createGrpcClientCredentials,
  readLocalVerifiedWorkloadIdentity,
  safeGrpcCall
} from '@oes/common/transport'
import { GatewayTrustedGrpcExecutionProducer } from '../../common/grpc/gateway-trusted-grpc-execution-producer'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { TrustedIdentityGrpcClient, IDENTITY_TARGET_AUDIENCE } from './trusted-identity.grpc.client'
import {
  TrustedPermissionGrpcClient,
  PERMISSION_TARGET_AUDIENCE
} from './trusted-permission.grpc.client'
import { TrustedHrGrpcClient, HR_TARGET_AUDIENCE } from './trusted-hr.grpc.client'
import {
  TrustedTenantOrgGrpcClient,
  TENANTORG_TARGET_AUDIENCE
} from './trusted-tenant-org.grpc.client'

export const AUTH_TARGET_AUDIENCE = 'urn:oes:service:auth-service'

/** Owns Gateway's immutable mTLS channel to the Auth trusted gRPC boundary. */
export class TrustedAuthGrpcClient {
  private client?: ClientGrpc

  /** Returns the lazily constructed target-bound client without accepting request transport overrides. */
  getClient(): ClientGrpc {
    return (this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: [
          resolveCommonProtoPath('auth_service/auth.proto'),
          resolveCommonProtoPath('auth_service/external_api_key.proto')
        ],
        url: resolveUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc)
  }
}

/** Produces the five exact Gateway foundation target tokens from verified session source credentials. */
export class GatewayFoundationTrustedGrpcExecutionProducer extends GatewayTrustedGrpcExecutionProducer {
  /** Builds public Auth correlation metadata without creating or copying any ExecutionToken. */
  forAuthPublicAdmission(source: DownstreamRequestSource): Metadata {
    const metadata = new Metadata()
    if (!source.requestId || !source.traceparent) {
      throw new Error('Auth public admission requires verified Gateway correlation')
    }
    metadata.set('x-request-id', source.requestId)
    metadata.set('traceparent', source.traceparent)
    if (source.tracestate) metadata.set('tracestate', source.tracestate)
    return metadata
  }
}

/** Exchanges Gateway's request-private source credential only with Auth's mTLS STS. */
class GatewayFoundationExecutionTokenExchangeClient implements ExecutionTokenExchangeClient {
  private client?: ClientGrpc
  private service?: ExecutionTokenServiceClient

  async exchange(
    request: ExecutionTokenExchangeRequest,
    metadata: Metadata
  ): Promise<ExecutionTokenExchangeResult> {
    const response = await safeGrpcCall(
      this.execution().exchangeExecutionToken(
        {
          targetAudience: request.targetAudience,
          requestedPermissionCodes: [...request.requestedPermissionCodes]
        },
        metadata
      ),
      { caller: 'api-gateway', method: 'ExchangeExecutionToken' }
    )
    return Object.freeze({
      accessToken: response.accessToken ?? '',
      tokenType: response.tokenType ?? '',
      expiresAtUnixSeconds: Number(response.expiresAtUnixSeconds),
      expiresInSeconds: Number(response.expiresInSeconds),
      kid: response.kid ?? '',
      grantedPermissionCodes: Object.freeze([...(response.grantedPermissionCodes ?? [])]),
      grantedAudience: response.grantedAudience ?? ''
    })
  }

  private execution(): ExecutionTokenServiceClient {
    this.client ??= ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'auth_service',
        protoPath: resolveCommonProtoPath('auth_service/execution_token.proto'),
        url: resolveUrl(),
        credentials: createGrpcClientCredentials()
      }
    }) as unknown as ClientGrpc
    return (this.service ??= this.client.getService<ExecutionTokenServiceClient>(
      EXECUTION_TOKEN_SERVICE_NAME
    ))
  }
}

/** Registers the five immutable mTLS clients and one foundation-only HUMAN token producer. */
@Global()
@Module({
  providers: [
    TrustedAuthGrpcClient,
    TrustedIdentityGrpcClient,
    TrustedPermissionGrpcClient,
    TrustedHrGrpcClient,
    TrustedTenantOrgGrpcClient,
    GatewayFoundationExecutionTokenExchangeClient,
    {
      provide: GatewayFoundationTrustedGrpcExecutionProducer,
      useFactory: (
        source: AsyncLocalTransportPrivateSourceCredentialAccessor,
        exchange: GatewayFoundationExecutionTokenExchangeClient
      ) => {
        const context = new AsyncLocalTrustedExecutionContextAccessor()
        const metadata = new TrustedGrpcMetadataProvider({
          contextAccessor: context,
          registry: new TrustedExecutionRegistry({
            issuer: required('AUTH_EXECUTION_ISSUER'),
            audiences: [
              AUTH_TARGET_AUDIENCE,
              IDENTITY_TARGET_AUDIENCE,
              PERMISSION_TARGET_AUDIENCE,
              HR_TARGET_AUDIENCE,
              TENANTORG_TARGET_AUDIENCE
            ],
            workloadIdentities: [required('OES_WORKLOAD_SPIFFE_ID')]
          }),
          tokenCache: new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 30 }),
          exchangeClient: exchange,
          sourceCredentialAccessor: source,
          localWorkloadIdentity: {
            getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity()
          }
        })
        return new GatewayFoundationTrustedGrpcExecutionProducer(context, metadata)
      },
      inject: [
        AsyncLocalTransportPrivateSourceCredentialAccessor,
        GatewayFoundationExecutionTokenExchangeClient
      ]
    }
  ],
  exports: [
    TrustedAuthGrpcClient,
    TrustedIdentityGrpcClient,
    TrustedPermissionGrpcClient,
    TrustedHrGrpcClient,
    TrustedTenantOrgGrpcClient,
    GatewayFoundationTrustedGrpcExecutionProducer
  ]
})
export class GatewayFoundationTrustedGrpcModule {}

/** Resolves only deployment-owned Auth endpoint configuration. */
function resolveUrl(): string {
  const configured = process.env.GRPC_SERVICE_AUTH_URL?.trim()
  if (configured) return configured
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return '127.0.0.1:50050'
  throw new Error('GRPC_SERVICE_AUTH_URL is required')
}

/** Requires immutable deployment trust configuration before the producer can be constructed. */
function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}
