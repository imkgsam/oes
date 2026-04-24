import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
// PrismaModule exposes the asset-service Prisma client to repository implementations.
export class PrismaModule {}
