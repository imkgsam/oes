import { Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/** PrismaModule exposes the Prisma client for finance-service persistence adapters. */
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
