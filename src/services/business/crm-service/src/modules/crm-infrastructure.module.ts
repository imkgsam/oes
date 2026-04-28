import { Global, Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { TOKENS } from '../common/constants/tokens'
import { PartyQueryGrpcAdapter } from '../infrastructure/adapters/party-query-grpc.adapter'
import { PrismaCrmAuditRepository } from '../infrastructure/audit/prisma-crm-audit.repository'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaCustomerAccountRepository } from '../infrastructure/repositories/prisma/prisma-customer-account.repository'
import { PrismaCustomerAddressRepository } from '../infrastructure/repositories/prisma/prisma-customer-address.repository'
import { PrismaCustomerContactRepository } from '../infrastructure/repositories/prisma/prisma-customer-contact.repository'
import { PrismaCrmTransactionRunner } from '../infrastructure/transactions/prisma-crm-transaction-runner'

/** CrmInfrastructureModule wires the Prisma-backed persistence graph and downstream party lookup adapter. */
@Global()
@Module({
  imports: [PrismaModule, GrpcTransportModule.forFeature([SERVICE_NAMES.PARTY])],
  providers: [
    PrismaCustomerAccountRepository,
    PrismaCustomerContactRepository,
    PrismaCustomerAddressRepository,
    PrismaCrmAuditRepository,
    PrismaCrmTransactionRunner,
    PartyQueryGrpcAdapter,
    {
      provide: TOKENS.CUSTOMER_ACCOUNT_REPOSITORY,
      useExisting: PrismaCustomerAccountRepository
    },
    {
      provide: TOKENS.CUSTOMER_CONTACT_REPOSITORY,
      useExisting: PrismaCustomerContactRepository
    },
    {
      provide: TOKENS.CUSTOMER_ADDRESS_REPOSITORY,
      useExisting: PrismaCustomerAddressRepository
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
    }
  ],
  exports: [
    PrismaModule,
    PrismaCustomerAccountRepository,
    PrismaCustomerContactRepository,
    PrismaCustomerAddressRepository,
    PrismaCrmAuditRepository,
    PrismaCrmTransactionRunner,
    PartyQueryGrpcAdapter,
    TOKENS.CUSTOMER_ACCOUNT_REPOSITORY,
    TOKENS.CUSTOMER_CONTACT_REPOSITORY,
    TOKENS.CUSTOMER_ADDRESS_REPOSITORY,
    TOKENS.CRM_AUDIT_WRITER,
    TOKENS.CRM_TRANSACTION_RUNNER,
    TOKENS.TENANT_PARTY_LOOKUP_PORT
  ]
})
export class CrmInfrastructureModule {}
