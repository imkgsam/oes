import { Global, Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { TOKENS } from '../common/constants/tokens'
import { PartyQueryGrpcAdapter } from '../infrastructure/adapters/party-query-grpc.adapter'
import { PrismaCrmAuditRepository } from '../infrastructure/audit/prisma-crm-audit.repository'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaCrmAccountRepository } from '../infrastructure/repositories/prisma/prisma-crm-account.repository'
import { PrismaCrmTransactionRunner } from '../infrastructure/transactions/prisma-crm-transaction-runner'

/** CrmInfrastructureModule wires the Prisma-backed persistence graph and downstream party lookup adapter. */
@Global()
@Module({
  imports: [PrismaModule, GrpcTransportModule.forFeature([SERVICE_NAMES.PARTY])],
  providers: [
    PrismaCrmAccountRepository,
    PrismaCrmAuditRepository,
    PrismaCrmTransactionRunner,
    PartyQueryGrpcAdapter,
    {
      provide: TOKENS.CRM_ACCOUNT_REPOSITORY,
      useExisting: PrismaCrmAccountRepository
    },
    {
      provide: TOKENS.CRM_AUDIT_WRITER,
      useExisting: PrismaCrmAuditRepository
    },
    {
      provide: TOKENS.CRM_TRANSACTION_RUNNER,
      useExisting: PrismaCrmTransactionRunner
    },
    {
      provide: TOKENS.TENANT_PARTY_LOOKUP_PORT,
      useExisting: PartyQueryGrpcAdapter
    },
    {
      provide: TOKENS.TENANT_PARTY_RESOLUTION_PORT,
      useExisting: PartyQueryGrpcAdapter
    }
  ],
  exports: [
    PrismaModule,
    PrismaCrmAccountRepository,
    PrismaCrmAuditRepository,
    PrismaCrmTransactionRunner,
    PartyQueryGrpcAdapter,
    TOKENS.CRM_ACCOUNT_REPOSITORY,
    TOKENS.CRM_AUDIT_WRITER,
    TOKENS.CRM_TRANSACTION_RUNNER,
    TOKENS.TENANT_PARTY_LOOKUP_PORT,
    TOKENS.TENANT_PARTY_RESOLUTION_PORT
  ]
})
export class CrmInfrastructureModule {}
