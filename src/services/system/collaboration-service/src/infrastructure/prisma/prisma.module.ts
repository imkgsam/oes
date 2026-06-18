import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/** PrismaModule provides the collaboration-service owned Prisma client. */
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
