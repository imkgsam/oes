import { Global, Module } from '@nestjs/common'
import { TOKENS } from '../common/constants/tokens'
import { PrismaFinanceAuditRepository } from '../infrastructure/audit/prisma-finance-audit.repository'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaFinanceRepository } from '../infrastructure/repositories/prisma/prisma-finance.repository'
import { PrismaFinanceTransactionRunner } from '../infrastructure/transactions/prisma-finance-transaction-runner'

/** FinanceInfrastructureModule wires the Prisma-backed persistence graph for the finance-service phase 1A runtime. */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    PrismaFinanceRepository,
    PrismaFinanceAuditRepository,
    PrismaFinanceTransactionRunner,
    {
      provide: TOKENS.FINANCE_REPOSITORY,
      useExisting: PrismaFinanceRepository
    },
    {
      provide: TOKENS.FINANCE_AUDIT_WRITER,
      useExisting: PrismaFinanceAuditRepository
    },
    {
      provide: TOKENS.FINANCE_TRANSACTION_RUNNER,
      useExisting: PrismaFinanceTransactionRunner
    }
  ],
  exports: [
    PrismaModule,
    PrismaFinanceRepository,
    PrismaFinanceAuditRepository,
    PrismaFinanceTransactionRunner,
    TOKENS.FINANCE_REPOSITORY,
    TOKENS.FINANCE_AUDIT_WRITER,
    TOKENS.FINANCE_TRANSACTION_RUNNER
  ]
})
export class FinanceInfrastructureModule {}
