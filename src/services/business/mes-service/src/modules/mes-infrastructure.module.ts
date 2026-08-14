import { Global, Module } from '@nestjs/common'
import { TOKENS } from '../common/constants/tokens'
import { ItemMasterManufacturableQueryGrpcAdapter } from '../infrastructure/adapters/item-master-manufacturable-query.grpc.adapter'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaProductionSpecRepository } from '../infrastructure/repositories/prisma/prisma-production-spec.repository'
import { PrismaMesMoldRepository } from '../infrastructure/repositories/prisma/prisma-mes-mold.repository'
import { MesItemMasterTrustedGrpcClient } from '../infrastructure/adapters/item-master-trusted-grpc.client'
import { MesItemMasterExecutionTokenExchangeClient } from '../infrastructure/adapters/mes-item-master-execution-token-exchange.client'
import { MesItemMasterTrustedGrpcExecutionProducer } from '../infrastructure/adapters/mes-item-master-trusted-grpc-execution.producer'

/** MesInfrastructureModule wires the Prisma-backed MES persistence graph and downstream item-master lookup adapter. */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    MesItemMasterTrustedGrpcClient,
    MesItemMasterExecutionTokenExchangeClient,
    {
      provide: MesItemMasterTrustedGrpcExecutionProducer,
      useFactory: (exchange: MesItemMasterExecutionTokenExchangeClient) =>
        new MesItemMasterTrustedGrpcExecutionProducer(exchange),
      inject: [MesItemMasterExecutionTokenExchangeClient]
    },
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
    MesItemMasterTrustedGrpcClient,
    MesItemMasterTrustedGrpcExecutionProducer,
    TOKENS.MES_MOLD_REPOSITORY,
    TOKENS.PRODUCTION_SPEC_REPOSITORY,
    TOKENS.MANUFACTURABLE_ITEM_LOOKUP_PORT
  ]
})
export class MesInfrastructureModule {}
