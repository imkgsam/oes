import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

// PrismaModule shares the public-entry-service Prisma client with repositories.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
