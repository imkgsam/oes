import { Module } from '@nestjs/common'
import { NatsJetStreamModule, NatsJetStreamPublisher, NatsJetStreamRuntimeConfig } from '@oes/common/events'
import { SiteMediaGrpcController } from '../../interfaces/grpc/site-media.grpc.controller'
import { SiteMediaApplicationService } from '../../application/services/site-media-application.service'
import { PrismaService } from '../../infrastructure/prisma/prisma.service'
import { PrismaSiteMediaRepository } from '../../infrastructure/repositories/prisma/prisma.site-media.repository'
import { SiteMediaStoragePort } from '../../domain/ports/site-media-storage.port'
import { CloudflareR2SiteMediaStorageAdaptor } from '../../infrastructure/adaptors/storage/cloudflare-r2-site-media-storage.adaptor'
import { AssetSiteMediaOutboxRelay } from '../../infrastructure/events/asset-site-media-outbox.relay'
import { AssetSiteMediaOutboxWorker } from '../../infrastructure/events/asset-site-media-outbox.worker'
import { PrismaAssetSiteMediaOutboxStore } from '../../infrastructure/events/prisma-asset-site-media-outbox.store'
import { CloudflareSiteMediaDeliveryPurgeAdaptor } from '../../infrastructure/adaptors/delivery/cloudflare-site-media-delivery-purge.adaptor'
import { AssetDeliveryPurgePort } from '../../domain/ports/asset-delivery-purge.port'
import { SiteMediaLifecycleOperationWorker } from '../../infrastructure/workers/site-media-lifecycle-operation.worker'
import { NatsAssetSiteMediaEventPublisher } from '../../infrastructure/events/nats-asset-site-media-event.publisher'

export const SITE_MEDIA_STORAGE = Symbol('SITE_MEDIA_STORAGE')

/** SiteMediaModule assembles the Site Media controller and explicit application/domain seams. */
@Module({
  imports: [NatsJetStreamModule.forRoot(NatsJetStreamRuntimeConfig.fromEnvironment(process.env))],
  controllers: [SiteMediaGrpcController],
  providers: [PrismaService, PrismaSiteMediaRepository, PrismaAssetSiteMediaOutboxStore, CloudflareSiteMediaDeliveryPurgeAdaptor, NatsAssetSiteMediaEventPublisher, { provide: SITE_MEDIA_STORAGE, useClass: CloudflareR2SiteMediaStorageAdaptor }, { provide: SiteMediaApplicationService, useFactory: (repository: PrismaSiteMediaRepository, storage: SiteMediaStoragePort, purge: AssetDeliveryPurgePort) => new SiteMediaApplicationService(repository, storage, purge), inject: [PrismaSiteMediaRepository, SITE_MEDIA_STORAGE, CloudflareSiteMediaDeliveryPurgeAdaptor] }, { provide: SiteMediaLifecycleOperationWorker, useFactory: (repository: PrismaSiteMediaRepository, purge: CloudflareSiteMediaDeliveryPurgeAdaptor) => new SiteMediaLifecycleOperationWorker(repository, purge), inject: [PrismaSiteMediaRepository, CloudflareSiteMediaDeliveryPurgeAdaptor] }, { provide: AssetSiteMediaOutboxRelay, useFactory: (store: PrismaAssetSiteMediaOutboxStore, publisher: NatsAssetSiteMediaEventPublisher) => new AssetSiteMediaOutboxRelay(store, publisher), inject: [PrismaAssetSiteMediaOutboxStore, NatsAssetSiteMediaEventPublisher] }, { provide: AssetSiteMediaOutboxWorker, useFactory: (relay: AssetSiteMediaOutboxRelay) => new AssetSiteMediaOutboxWorker(relay), inject: [AssetSiteMediaOutboxRelay] }],
  exports: [SiteMediaApplicationService]
})
export class SiteMediaModule {}
