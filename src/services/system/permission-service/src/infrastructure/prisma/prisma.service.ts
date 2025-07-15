import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '../../../prisma/generated/prisma'
import { genBusinessExceptionObject, genSystemExceptionObject } from '@oes/common/helpers/exception.helper'
import { GLOBAL_SYSTEM_ERRORS } from '@oes/common/constants/res-codes/system.errors'
import { SystemException } from '@oes/common/exceptions/system.exception'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect()
    } catch (error) {
      const e = new SystemException(genSystemExceptionObject('PERMISSION_SERVICE', GLOBAL_SYSTEM_ERRORS.DATABASE_CONNECTION_FAILED))
      console.error(`[PERMISSION_SERVICE]`, 'PrismaService connection failed:', e)
      process.exit(1)
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
