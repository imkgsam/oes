import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/** PrismaModule exposes the Prisma client for sales-service persistence adapters. */
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
