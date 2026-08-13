import { Global, Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { SrmPartyMachineSourceCredentialClient } from '../infrastructure/adapters/srm-party-machine-source-credential.client'
import { SrmPartyMachineSourceCredentialProvider } from '../infrastructure/adapters/srm-party-machine-source-credential.provider'
import { SrmPartyExecutionTokenExchangeClient } from '../infrastructure/adapters/srm-party-execution-token-exchange.client'
import { SrmPartyTrustedGrpcExecutionProducer } from '../infrastructure/adapters/srm-party-trusted-grpc-execution.producer'
import { SrmPartyTrustedGrpcClient } from '../infrastructure/adapters/party-trusted-grpc.client'
import { TOKENS } from '../common/constants/tokens'
import { ItemMasterQueryGrpcAdapter } from '../infrastructure/adapters/item-master-query-grpc.adapter'
import { PartyQueryGrpcAdapter } from '../infrastructure/adapters/party-query-grpc.adapter'
import { PrismaSrmAuditRepository } from '../infrastructure/audit/prisma-srm-audit.repository'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaSupplierOfferingRepository } from '../infrastructure/repositories/prisma/prisma-supplier-offering.repository'
import { PrismaSupplierProfileRepository } from '../infrastructure/repositories/prisma/prisma-supplier-profile.repository'
import { PrismaSupplierAddressRepository } from '../infrastructure/repositories/prisma/prisma-supplier-address.repository'
import { PrismaSupplierContactRepository } from '../infrastructure/repositories/prisma/prisma-supplier-contact.repository'
import { PrismaSrmTransactionRunner } from '../infrastructure/transactions/prisma-srm-transaction-runner'

/** SrmInfrastructureModule wires the Prisma-backed persistence graph and downstream party lookup adapter. */
@Global()
@Module({
  imports: [PrismaModule, GrpcTransportModule.forFeature([SERVICE_NAMES.PARTY, SERVICE_NAMES.ITEM_MASTER])],
  providers: [
    PrismaSupplierProfileRepository,
    PrismaSupplierContactRepository,
    PrismaSupplierAddressRepository,
    PrismaSupplierOfferingRepository,
    PrismaSrmAuditRepository,
    PrismaSrmTransactionRunner,
    SrmPartyTrustedGrpcClient,
    SrmPartyMachineSourceCredentialClient,
    SrmPartyMachineSourceCredentialProvider,
    SrmPartyExecutionTokenExchangeClient,
    { provide: SrmPartyTrustedGrpcExecutionProducer, useFactory: (source: SrmPartyMachineSourceCredentialProvider, exchange: SrmPartyExecutionTokenExchangeClient) => new SrmPartyTrustedGrpcExecutionProducer(source, exchange), inject: [SrmPartyMachineSourceCredentialProvider, SrmPartyExecutionTokenExchangeClient] },
    PartyQueryGrpcAdapter,
    ItemMasterQueryGrpcAdapter,
    {
      provide: TOKENS.SUPPLIER_PROFILE_REPOSITORY,
      useExisting: PrismaSupplierProfileRepository
    },
    {
      provide: TOKENS.SUPPLIER_CONTACT_REPOSITORY,
      useExisting: PrismaSupplierContactRepository
    },
    {
      provide: TOKENS.SUPPLIER_ADDRESS_REPOSITORY,
      useExisting: PrismaSupplierAddressRepository
    },
    {
      provide: TOKENS.SUPPLIER_OFFERING_REPOSITORY,
      useExisting: PrismaSupplierOfferingRepository
    },
    {
      provide: TOKENS.SRM_AUDIT_WRITER,
      useExisting: PrismaSrmAuditRepository
    },
    {
      provide: TOKENS.SRM_TRANSACTION_RUNNER,
      useExisting: PrismaSrmTransactionRunner
    },
    {
      provide: TOKENS.TENANT_PARTY_LOOKUP_PORT,
      useExisting: PartyQueryGrpcAdapter
    },
    {
      provide: TOKENS.ITEM_LOOKUP_PORT,
      useExisting: ItemMasterQueryGrpcAdapter
    }
  ],
  exports: [
    PrismaModule,
    PrismaSupplierProfileRepository,
    PrismaSupplierContactRepository,
    PrismaSupplierAddressRepository,
    PrismaSupplierOfferingRepository,
    PrismaSrmAuditRepository,
    PrismaSrmTransactionRunner,
    PartyQueryGrpcAdapter,
    ItemMasterQueryGrpcAdapter,
    TOKENS.SUPPLIER_PROFILE_REPOSITORY,
    TOKENS.SUPPLIER_CONTACT_REPOSITORY,
    TOKENS.SUPPLIER_ADDRESS_REPOSITORY,
    TOKENS.SUPPLIER_OFFERING_REPOSITORY,
    TOKENS.SRM_AUDIT_WRITER,
    TOKENS.SRM_TRANSACTION_RUNNER,
    TOKENS.TENANT_PARTY_LOOKUP_PORT,
    TOKENS.ITEM_LOOKUP_PORT
  ]
})
export class SrmInfrastructureModule {}
