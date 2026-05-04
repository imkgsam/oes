import { Global, Module } from '@nestjs/common'
import { TOKENS } from '../common/constants/tokens'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaMesMoldRepository } from '../infrastructure/repositories/prisma/prisma-mes-mold.repository'

/** MesInfrastructureModule wires the Prisma-backed mold persistence graph. */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaMesMoldRepository,
    {
      provide: TOKENS.MES_MOLD_REPOSITORY,
      useExisting: PrismaMesMoldRepository
    }
  ],
  exports: [PrismaModule, PrismaMesMoldRepository, TOKENS.MES_MOLD_REPOSITORY]
})
export class MesInfrastructureModule {}
