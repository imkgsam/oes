import { Global, Module } from '@nestjs/common'
import { TOKENS } from '../common/constants/tokens'
import { ItemMasterQueryGrpcAdapter } from '../infrastructure/adapters/item-master-query.grpc.adapter'
import { SupplierQueryGrpcAdapter } from '../infrastructure/adapters/supplier-query.grpc.adapter'
import { PrismaProcurementAuditRepository } from '../infrastructure/audit/prisma-procurement-audit.repository'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaPurchaseOrderRepository } from '../infrastructure/repositories/prisma/prisma-purchase-order.repository'
import { PrismaPurchaseRequestRepository } from '../infrastructure/repositories/prisma/prisma-purchase-request.repository'
import { PrismaReceivingRepository } from '../infrastructure/repositories/prisma/prisma-receiving.repository'
import { PrismaProcurementTransactionRunner } from '../infrastructure/transactions/prisma-procurement-transaction-runner'
import { ProcurementTrustedExecutionModule } from './procurement-trusted-execution.module'

/** ProcurementInfrastructureModule wires the Prisma-backed persistence graph and downstream item SRM lookup adapters. */
@Global()
@Module({
  imports: [PrismaModule, ProcurementTrustedExecutionModule],
  providers: [
    PrismaPurchaseRequestRepository,
    PrismaPurchaseOrderRepository,
    PrismaReceivingRepository,
    PrismaProcurementAuditRepository,
    PrismaProcurementTransactionRunner,
    ItemMasterQueryGrpcAdapter,
    SupplierQueryGrpcAdapter,
    {
      provide: TOKENS.PURCHASE_REQUEST_REPOSITORY,
      useExisting: PrismaPurchaseRequestRepository
    },
    {
      provide: TOKENS.PURCHASE_ORDER_REPOSITORY,
      useExisting: PrismaPurchaseOrderRepository
    },
    {
      provide: TOKENS.RECEIVING_REPOSITORY,
      useExisting: PrismaReceivingRepository
    },
    {
      provide: TOKENS.PROCUREMENT_AUDIT_WRITER,
      useExisting: PrismaProcurementAuditRepository
    },
    {
      provide: TOKENS.PROCUREMENT_TRANSACTION_RUNNER,
      useExisting: PrismaProcurementTransactionRunner
    },
    {
      provide: TOKENS.ITEM_REFERENCE_LOOKUP_PORT,
      useExisting: ItemMasterQueryGrpcAdapter
    },
    {
      provide: TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT,
      useExisting: SupplierQueryGrpcAdapter
    }
  ],
  exports: [
    PrismaModule,
    PrismaPurchaseRequestRepository,
    PrismaPurchaseOrderRepository,
    PrismaReceivingRepository,
    PrismaProcurementAuditRepository,
    PrismaProcurementTransactionRunner,
    ItemMasterQueryGrpcAdapter,
    SupplierQueryGrpcAdapter,
    TOKENS.PURCHASE_REQUEST_REPOSITORY,
    TOKENS.PURCHASE_ORDER_REPOSITORY,
    TOKENS.RECEIVING_REPOSITORY,
    TOKENS.PROCUREMENT_AUDIT_WRITER,
    TOKENS.PROCUREMENT_TRANSACTION_RUNNER,
    TOKENS.ITEM_REFERENCE_LOOKUP_PORT,
    TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT
  ]
})
export class ProcurementInfrastructureModule {}
