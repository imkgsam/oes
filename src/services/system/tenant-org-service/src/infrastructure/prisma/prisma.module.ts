import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/** PrismaModule provides the service-local tenant-org Prisma client. */
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
