import { Global, Module } from '@nestjs/common'
import { SrmTrustedExecutionModule } from './srm-trusted-execution.module'
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
import { SrmItemMasterTrustedGrpcClient } from '../infrastructure/adapters/item-master-trusted-grpc.client'
import { SrmItemMasterMachineSourceCredentialClient } from '../infrastructure/adapters/srm-item-master-machine-source-credential.client'
import { SrmItemMasterMachineSourceCredentialProvider } from '../infrastructure/adapters/srm-item-master-machine-source-credential.provider'
import { SrmItemMasterExecutionTokenExchangeClient } from '../infrastructure/adapters/srm-item-master-execution-token-exchange.client'
import { SrmItemMasterTrustedGrpcExecutionProducer } from '../infrastructure/adapters/srm-item-master-trusted-grpc-execution.producer'

/** SrmInfrastructureModule wires the Prisma-backed persistence graph and downstream party lookup adapter. */
@Global()
@Module({
  imports: [PrismaModule, SrmTrustedExecutionModule],
  providers: [
    SrmItemMasterTrustedGrpcClient,
    SrmItemMasterMachineSourceCredentialClient,
    SrmItemMasterMachineSourceCredentialProvider,
    SrmItemMasterExecutionTokenExchangeClient,
    {
      provide: SrmItemMasterTrustedGrpcExecutionProducer,
      useFactory: (
        source: SrmItemMasterMachineSourceCredentialProvider,
        exchange: SrmItemMasterExecutionTokenExchangeClient
      ) => new SrmItemMasterTrustedGrpcExecutionProducer(source, exchange),
      inject: [
        SrmItemMasterMachineSourceCredentialProvider,
        SrmItemMasterExecutionTokenExchangeClient
      ]
    },
    PrismaSupplierProfileRepository,
    PrismaSupplierContactRepository,
    PrismaSupplierAddressRepository,
    PrismaSupplierOfferingRepository,
    PrismaSrmAuditRepository,
    PrismaSrmTransactionRunner,
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
    SrmItemMasterTrustedGrpcClient,
    SrmItemMasterTrustedGrpcExecutionProducer,
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
