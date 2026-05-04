import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/** PrismaModule exposes the Prisma client for all wms-service modules. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
