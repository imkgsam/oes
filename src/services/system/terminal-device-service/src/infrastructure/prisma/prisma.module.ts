import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './prisma.service'

@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService]
})
// PrismaModule exposes the terminal-device-service scoped Prisma client to persistence adapters.
export class PrismaModule {}
