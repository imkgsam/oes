import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggingModule } from '@oes/common/logging'
import { RegistryModule } from '@oes/common/registry'
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

/** SiteServiceModule assembles site-service application, persistence, and gRPC interface adapters. */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['src/services/system/site-service/.env', '.env']
    }),
    LoggingModule.forRoot({ serviceName: 'site-service' }),
    RegistryModule
  ],
  controllers: [SiteAdminGrpcController, SiteRuntimeGrpcController],
  providers: [
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
        previewTokenSecret: string
      ) => new SiteAdminApplicationService(repository, { previewTokenSecret }, webhookPublisher),
      inject: [SITE_ADMIN_APPLICATION_REPOSITORY, SITE_WEBHOOK_PUBLISHER, SITE_PREVIEW_TOKEN_SECRET]
    },
    {
      provide: SiteRuntimeApplicationService,
      useFactory: (repository: PrismaSiteRepository, previewTokenSecret: string) =>
        new SiteRuntimeApplicationService(repository, { previewTokenSecret }),
      inject: [SITE_RUNTIME_APPLICATION_REPOSITORY, SITE_PREVIEW_TOKEN_SECRET]
    },
    { provide: SITE_ADMIN_APPLICATION, useExisting: SiteAdminApplicationService },
    { provide: SITE_RUNTIME_APPLICATION, useExisting: SiteRuntimeApplicationService }
  ]
})
export class SiteServiceModule {}
