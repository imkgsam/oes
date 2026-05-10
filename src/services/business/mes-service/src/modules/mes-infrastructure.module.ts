import { Global, Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { TOKENS } from '../common/constants/tokens'
import { ItemMasterManufacturableQueryGrpcAdapter } from '../infrastructure/adapters/item-master-manufacturable-query.grpc.adapter'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaProductionSpecRepository } from '../infrastructure/repositories/prisma/prisma-production-spec.repository'
import { PrismaMesMoldRepository } from '../infrastructure/repositories/prisma/prisma-mes-mold.repository'

/** MesInfrastructureModule wires the Prisma-backed MES persistence graph and downstream item-master lookup adapter. */
@Global()
@Module({
  imports: [PrismaModule, GrpcTransportModule.forFeature([SERVICE_NAMES.ITEM_MASTER])],
  providers: [
    PrismaMesMoldRepository,
    PrismaProductionSpecRepository,
    ItemMasterManufacturableQueryGrpcAdapter,
    {
      provide: TOKENS.MES_MOLD_REPOSITORY,
      useExisting: PrismaMesMoldRepository
    },
    {
      provide: TOKENS.PRODUCTION_SPEC_REPOSITORY,
      useExisting: PrismaProductionSpecRepository
    },
    {
      provide: TOKENS.MANUFACTURABLE_ITEM_LOOKUP_PORT,
      useExisting: ItemMasterManufacturableQueryGrpcAdapter
    }
  ],
  exports: [
    PrismaModule,
    PrismaMesMoldRepository,
    PrismaProductionSpecRepository,
    ItemMasterManufacturableQueryGrpcAdapter,
    TOKENS.MES_MOLD_REPOSITORY,
    TOKENS.PRODUCTION_SPEC_REPOSITORY,
    TOKENS.MANUFACTURABLE_ITEM_LOOKUP_PORT
  ]
})
export class MesInfrastructureModule {}
