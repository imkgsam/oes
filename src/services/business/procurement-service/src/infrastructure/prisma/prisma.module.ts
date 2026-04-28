import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

/** PrismaModule exposes the procurement-service scoped PrismaService singleton to persistence adapters. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
