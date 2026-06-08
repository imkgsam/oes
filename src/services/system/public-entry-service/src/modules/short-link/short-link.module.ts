import { Module } from '@nestjs/common'
import { PublicEntryShortLinkGrpcController } from '../../interfaces/grpc/public-entry-short-link.grpc.controller'
import { PublicRedirectService } from '../../application/services/public-redirect.service'
import { QrCodeService } from '../../application/services/qr-code.service'
import { ShortLinkApplicationService } from '../../application/services/short-link-application.service'
import { ShortLinkTargetResolverRegistry } from '../../application/services/short-link-target-resolver.registry'
import { ShortCodeGenerator } from '../../domain/services/short-code-generator'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaShortLinkRepository } from '../../infrastructure/repositories/prisma-short-link.repository'

// ShortLinkModule assembles Phase 1 ShortLink application services and transport controllers.
@Module({
  imports: [PrismaModule],
  controllers: [PublicEntryShortLinkGrpcController],
  providers: [
    PrismaShortLinkRepository,
    { provide: 'ShortLinkRepository', useExisting: PrismaShortLinkRepository },
    ShortCodeGenerator,
    ShortLinkTargetResolverRegistry,
    QrCodeService,
    {
      provide: ShortLinkApplicationService,
      useFactory: (
        repository: PrismaShortLinkRepository,
        generator: ShortCodeGenerator,
        registry: ShortLinkTargetResolverRegistry,
        qrCodeService: QrCodeService
      ) => new ShortLinkApplicationService(repository, generator, registry, qrCodeService),
      inject: [
        PrismaShortLinkRepository,
        ShortCodeGenerator,
        ShortLinkTargetResolverRegistry,
        QrCodeService
      ]
    },
    {
      provide: PublicRedirectService,
      useFactory: (
        repository: PrismaShortLinkRepository,
        registry: ShortLinkTargetResolverRegistry
      ) => new PublicRedirectService(repository, registry),
      inject: [PrismaShortLinkRepository, ShortLinkTargetResolverRegistry]
    }
  ],
  exports: [ShortLinkApplicationService, PublicRedirectService, ShortLinkTargetResolverRegistry]
})
export class ShortLinkModule {}
