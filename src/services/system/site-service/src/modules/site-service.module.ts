import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
import { GrpcTransportModule, readLocalVerifiedWorkloadIdentity } from '@oes/common/transport'
import { NatsJetStreamModule, NatsJetStreamRuntimeConfig, NatsDurablePullRunner } from '@oes/common/events'
import { AsyncLocalTransportPrivateSourceCredentialAccessor, AsyncLocalTrustedExecutionContextAccessor, CertificateBoundExecutionTokenCache, TrustedExecutionRegistry, TrustedGrpcMetadataProvider } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { AssetSiteMediaAvailabilityConsumer } from '../infrastructure/events/asset-site-media-availability.consumer'
import { PrismaAssetSiteMediaInboxRepository } from '../infrastructure/repositories/prisma-asset-site-media-inbox.repository'
import { createLazyTrustedExecutionRuntime, TrustedExecutionGuard, TrustedInternalExecutionGuard } from '@oes/common/authorization'
import { Reflector } from '@nestjs/core'
import {
  SITE_ADMIN_APPLICATION_REPOSITORY,
  SiteAdminApplicationService
} from '../application/services/site-admin-application.service'
import {
  SITE_RUNTIME_APPLICATION_REPOSITORY,
  SiteRuntimeApplicationService
} from '../application/services/site-runtime-application.service'
import {
  SITE_WEBHOOK_PUBLISHER,
  SiteWebhookPublisher
} from '../application/ports/site-webhook-publisher.port'
import { HttpSiteWebhookPublisher } from '../infrastructure/adapters/http-site-webhook.publisher'
import { PrismaService } from '../infrastructure/prisma/prisma.service'
import { PrismaSiteRepository } from '../infrastructure/repositories/prisma-site.repository'
import { PrismaSiteTransactionRunner } from '../infrastructure/transactions/prisma-site-transaction-runner'
import {
  requireSitePreviewTokenSecret,
  SITE_PREVIEW_TOKEN_SECRET
} from '../domain/preview/preview-config'
import {
  SITE_ADMIN_APPLICATION,
  SiteAdminGrpcController
} from '../interfaces/grpc/site-admin.grpc.controller'
import {
  SITE_RUNTIME_APPLICATION,
  SiteRuntimeGrpcController
} from '../interfaces/grpc/site-runtime.grpc.controller'
import { ASSET_SITE_MEDIA_PORT } from '../application/ports/asset-site-media.port'
import { SiteTrustedAssetGrpcAdapter } from '../infrastructure/grpc/site-trusted-asset.grpc.adapter'
import { SiteAuthExecutionTokenExchangeClient } from '../infrastructure/grpc/site-auth-execution-token-exchange.client'
import { AssetSiteMediaAvailabilityWorker } from '../infrastructure/events/asset-site-media-availability.worker'

const SITE_AUDIENCE = 'urn:oes:service:site-service'
const siteTrustedRuntime = createLazyTrustedExecutionRuntime(SITE_AUDIENCE)

/** SiteServiceModule assembles site-service application, persistence, and gRPC interface adapters. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['src/services/system/site-service/.env', '.env']
    }),
    LoggingModule.forRoot({ serviceName: 'site-service' }),
    RegistryModule,
    GrpcTransportModule.forFeature([SERVICE_NAMES.ASSET]),
    NatsJetStreamModule.forRoot(deferredSiteNatsRuntimeOptions())
  ],
  controllers: [SiteAdminGrpcController, SiteRuntimeGrpcController],
  providers: [
    PrismaAssetSiteMediaInboxRepository, AssetSiteMediaAvailabilityWorker,
    { provide: AssetSiteMediaAvailabilityConsumer, useFactory: (inbox: PrismaAssetSiteMediaInboxRepository) => new AssetSiteMediaAvailabilityConsumer(inbox), inject: [PrismaAssetSiteMediaInboxRepository] },
    {
      provide: TrustedExecutionGuard,
      useFactory: (reflector: Reflector) => new TrustedExecutionGuard(reflector, siteTrustedRuntime.verifier, siteTrustedRuntime.workloadIdentityProvider, SITE_AUDIENCE),
      inject: [Reflector]
    },
    {
      provide: TrustedInternalExecutionGuard,
      useFactory: (reflector: Reflector) => new TrustedInternalExecutionGuard(reflector, siteTrustedRuntime.verifier, siteTrustedRuntime.workloadIdentityProvider, SITE_AUDIENCE),
      inject: [Reflector]
    },
    PrismaService,
    PrismaSiteRepository,
    PrismaSiteTransactionRunner,
    {
      provide: SITE_PREVIEW_TOKEN_SECRET,
      useFactory: () => requireSitePreviewTokenSecret(process.env.SITE_PREVIEW_TOKEN_SECRET)
    },
    {
      provide: HttpSiteWebhookPublisher,
      useFactory: () => new HttpSiteWebhookPublisher()
    },
    { provide: SITE_ADMIN_APPLICATION_REPOSITORY, useExisting: PrismaSiteRepository },
    { provide: SITE_RUNTIME_APPLICATION_REPOSITORY, useExisting: PrismaSiteRepository },
    { provide: SITE_WEBHOOK_PUBLISHER, useExisting: HttpSiteWebhookPublisher },
    {
      provide: SiteAdminApplicationService,
      useFactory: (
        repository: PrismaSiteRepository,
        webhookPublisher: SiteWebhookPublisher,
        previewTokenSecret: string,
        assetSiteMedia: import('../application/ports/asset-site-media.port').AssetSiteMediaPort
      ) => new SiteAdminApplicationService(repository, { previewTokenSecret }, webhookPublisher, assetSiteMedia),
      inject: [SITE_ADMIN_APPLICATION_REPOSITORY, SITE_WEBHOOK_PUBLISHER, SITE_PREVIEW_TOKEN_SECRET, ASSET_SITE_MEDIA_PORT]
    },
    {
      provide: SiteRuntimeApplicationService,
      useFactory: (repository: PrismaSiteRepository, previewTokenSecret: string) =>
        new SiteRuntimeApplicationService(repository, { previewTokenSecret }),
      inject: [SITE_RUNTIME_APPLICATION_REPOSITORY, SITE_PREVIEW_TOKEN_SECRET]
    },
    { provide: SITE_ADMIN_APPLICATION, useExisting: SiteAdminApplicationService },
    { provide: SITE_RUNTIME_APPLICATION, useExisting: SiteRuntimeApplicationService }
    , AsyncLocalTransportPrivateSourceCredentialAccessor
    , AsyncLocalTrustedExecutionContextAccessor
    , { provide: CertificateBoundExecutionTokenCache, useFactory: () => new CertificateBoundExecutionTokenCache({ refreshMarginSeconds: 15 }) }
    , SiteAuthExecutionTokenExchangeClient
    , {
      provide: TrustedExecutionRegistry,
      useFactory: () => new TrustedExecutionRegistry({ issuer: requireEnv('AUTH_EXECUTION_ISSUER'), audiences: [SITE_AUDIENCE, 'urn:oes:service:asset-service'], workloadIdentities: [requireEnv('OES_WORKLOAD_SPIFFE_ID')] })
    }
    , {
      provide: TrustedGrpcMetadataProvider,
      useFactory: (contextAccessor: AsyncLocalTrustedExecutionContextAccessor, registry: TrustedExecutionRegistry, cache: CertificateBoundExecutionTokenCache, exchangeClient: SiteAuthExecutionTokenExchangeClient, source: AsyncLocalTransportPrivateSourceCredentialAccessor) => new TrustedGrpcMetadataProvider({ contextAccessor, registry, tokenCache: cache, exchangeClient, sourceCredentialAccessor: source, localWorkloadIdentity: { getVerifiedWorkloadIdentity: async () => readLocalVerifiedWorkloadIdentity() } }),
      inject: [AsyncLocalTrustedExecutionContextAccessor, TrustedExecutionRegistry, CertificateBoundExecutionTokenCache, SiteAuthExecutionTokenExchangeClient, AsyncLocalTransportPrivateSourceCredentialAccessor]
    }
    , SiteTrustedAssetGrpcAdapter
    , { provide: ASSET_SITE_MEDIA_PORT, useExisting: SiteTrustedAssetGrpcAdapter }
  ]
})
export class SiteServiceModule {}

/** requireEnv reads deployment-owned trust configuration without manufacturing a local identity. */
function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required`)
  return value
}

/** deferredSiteNatsRuntimeOptions delays required NATS environment resolution until Nest initializes the broker client. */
function deferredSiteNatsRuntimeOptions(): import('@oes/common/events').NatsJetStreamRuntimeOptions {
  const resolve = () => NatsJetStreamRuntimeConfig.fromEnvironment(process.env)
  return Object.defineProperties({}, {
    servers: { enumerable: true, get: () => resolve().servers },
    user: { enumerable: true, get: () => resolve().user },
    password: { enumerable: true, get: () => resolve().password },
    name: { enumerable: true, get: () => resolve().name }
  }) as import('@oes/common/events').NatsJetStreamRuntimeOptions
}
