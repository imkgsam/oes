import { Module } from '@nestjs/common'
import { AuthorizationModule } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { IdentityContactAssetGrpcAdapter } from './adapters/identity-contact-asset-grpc.adapter'
import { PublicEntryShortLinkGrpcAdapter } from './adapters/public-entry-short-link-grpc.adapter'
import { PublicEntryBusinessCardGrpcAdapter } from './adapters/public-entry-business-card-grpc.adapter'
import { PublicEntryBusinessCardController } from './interface/http/controllers/public-entry-business-card.controller'
import { PublicEntryShortLinkController } from './interface/http/controllers/public-entry-short-link.controller'
import { PublicEntryBusinessCardService } from './public-entry-business-card.service'
import { PublicEntryShortLinkService } from './public-entry-short-link.service'

// PublicEntryServiceProxyModule wires gateway HTTP/BFF endpoints to public-entry-service gRPC contracts.
@Module({
  imports: [AuthorizationModule, GrpcTransportModule.forFeature([SERVICE_NAMES.PUBLIC_ENTRY, SERVICE_NAMES.IDENTITY])],
  controllers: [PublicEntryShortLinkController, PublicEntryBusinessCardController],
  providers: [
    IdentityContactAssetGrpcAdapter,
    PublicEntryShortLinkGrpcAdapter,
    PublicEntryShortLinkService,
    PublicEntryBusinessCardGrpcAdapter,
    PublicEntryBusinessCardService
  ]
})
export class PublicEntryServiceProxyModule {}
