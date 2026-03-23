import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../../../prisma/generated/prisma'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Temporary compatibility alias: schema model is OTP, legacy repository still expects oneTimeToken.
  get oneTimeToken(): any {
    return this.oTP
  }

  // Temporary compatibility alias: schema does not currently define MfaBinding.
  get mfaBinding(): any {
    throw new Error('MfaBinding Prisma model is not available in current schema.')
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
