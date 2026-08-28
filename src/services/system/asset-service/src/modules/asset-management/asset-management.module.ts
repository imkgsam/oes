import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { AvatarCommandHandlers } from '../../application/commands/avatar'
import { AvatarQueryHandlers } from '../../application/queries/avatar'
import { SYMBOLS } from '../../common/constants/symbols'
import { S3CompatibleObjectStorageAdaptor } from '../../infrastructure/adaptors/storage/s3-compatible-object-storage.adaptor'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { PrismaAssetRepository } from '../../infrastructure/repositories/prisma/prisma.asset.repository'
import { AssetGrpcController } from '../../interfaces/grpc/asset.grpc.controller'
import { AssetTrustedExecutionGuard } from '../../interfaces/grpc/asset-trusted-execution.guard'

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    {
      provide: SYMBOLS.REPO.ASSET,
      useClass: PrismaAssetRepository
    },
    {
      provide: SYMBOLS.PORT.OBJECT_STORAGE,
      useFactory: () => new S3CompatibleObjectStorageAdaptor()
    },
    ValidatingCommandBus,
    ValidatingQueryBus,
    AssetTrustedExecutionGuard,
    ...AvatarCommandHandlers,
    ...AvatarQueryHandlers
  ],
  controllers: [AssetGrpcController]
})
// AssetManagementModule assembles the minimal avatar asset write and query pipeline for asset-service.
export class AssetManagementModule {}
