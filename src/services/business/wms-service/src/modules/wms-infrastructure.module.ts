import { Global, Module } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { GrpcTransportModule } from '@oes/common/transport'
import { TOKENS } from '../common/constants/tokens'
import { ReceivingExpectationLookupPort } from '../application/ports/receiving-expectation-lookup.port'
import { StockableItemLookupPort } from '../application/ports/stockable-item-lookup.port'
import { InventoryRepository } from '../domain/repositories/inventory.repository'
import { ReceiptRepository } from '../domain/repositories/receipt.repository'
import { WarehouseRepository } from '../domain/repositories/warehouse.repository'
import { ItemMasterStockableQueryGrpcAdapter } from '../infrastructure/adapters/item-master-stockable-query.grpc.adapter'
import { ProcurementReceivingExpectationGrpcAdapter } from '../infrastructure/adapters/procurement-receiving-expectation.grpc.adapter'
import { PrismaWmsAuditRepository } from '../infrastructure/audit/prisma-wms-audit.repository'
import { PrismaModule } from '../infrastructure/prisma/prisma.module'
import { PrismaInventoryRepository } from '../infrastructure/repositories/prisma/prisma-inventory.repository'
import { PrismaReceiptRepository } from '../infrastructure/repositories/prisma/prisma-receipt.repository'
import { PrismaWarehouseRepository } from '../infrastructure/repositories/prisma/prisma-warehouse.repository'
import { PrismaWmsTransactionRunner } from '../infrastructure/transactions/prisma-wms-transaction-runner'
import { WmsItemMasterTrustedGrpcClient } from '../infrastructure/adapters/item-master-trusted-grpc.client'
import { WmsItemMasterMachineSourceCredentialClient } from '../infrastructure/adapters/wms-item-master-machine-source-credential.client'
import { WmsItemMasterMachineSourceCredentialProvider } from '../infrastructure/adapters/wms-item-master-machine-source-credential.provider'
import { WmsItemMasterExecutionTokenExchangeClient } from '../infrastructure/adapters/wms-item-master-execution-token-exchange.client'
import { WmsItemMasterTrustedGrpcExecutionProducer } from '../infrastructure/adapters/wms-item-master-trusted-grpc-execution.producer'

/** WmsInfrastructureModule wires the Prisma-backed persistence graph and downstream item and procurement lookup adapters. */
@Global()
@Module({
  imports: [PrismaModule, GrpcTransportModule.forFeature([SERVICE_NAMES.PROCUREMENT])],
  providers: [
    WmsItemMasterTrustedGrpcClient,
    WmsItemMasterMachineSourceCredentialClient,
    WmsItemMasterMachineSourceCredentialProvider,
    WmsItemMasterExecutionTokenExchangeClient,
    {
      provide: WmsItemMasterTrustedGrpcExecutionProducer,
      useFactory: (
        source: WmsItemMasterMachineSourceCredentialProvider,
        exchange: WmsItemMasterExecutionTokenExchangeClient
      ) => new WmsItemMasterTrustedGrpcExecutionProducer(source, exchange),
      inject: [
        WmsItemMasterMachineSourceCredentialProvider,
        WmsItemMasterExecutionTokenExchangeClient
      ]
    },
    PrismaWarehouseRepository,
    PrismaReceiptRepository,
    PrismaInventoryRepository,
    PrismaWmsAuditRepository,
    PrismaWmsTransactionRunner,
    ItemMasterStockableQueryGrpcAdapter,
    ProcurementReceivingExpectationGrpcAdapter,
    {
      provide: TOKENS.WAREHOUSE_REPOSITORY,
      useExisting: PrismaWarehouseRepository
    },
    {
      provide: TOKENS.RECEIPT_REPOSITORY,
      useExisting: PrismaReceiptRepository
    },
    {
      provide: TOKENS.INVENTORY_REPOSITORY,
      useExisting: PrismaInventoryRepository
    },
    {
      provide: TOKENS.WMS_AUDIT_WRITER,
      useExisting: PrismaWmsAuditRepository
    },
    {
      provide: TOKENS.WMS_TRANSACTION_RUNNER,
      useExisting: PrismaWmsTransactionRunner
    },
    {
      provide: TOKENS.STOCKABLE_ITEM_LOOKUP_PORT,
      useExisting: ItemMasterStockableQueryGrpcAdapter
    },
    {
      provide: TOKENS.RECEIVING_EXPECTATION_LOOKUP_PORT,
      useExisting: ProcurementReceivingExpectationGrpcAdapter
    }
  ],
  exports: [
    PrismaModule,
    PrismaWarehouseRepository,
    PrismaReceiptRepository,
    PrismaInventoryRepository,
    PrismaWmsAuditRepository,
    PrismaWmsTransactionRunner,
    ItemMasterStockableQueryGrpcAdapter,
    ProcurementReceivingExpectationGrpcAdapter,
    WmsItemMasterTrustedGrpcClient,
    WmsItemMasterTrustedGrpcExecutionProducer,
    TOKENS.WAREHOUSE_REPOSITORY,
    TOKENS.RECEIPT_REPOSITORY,
    TOKENS.INVENTORY_REPOSITORY,
    TOKENS.WMS_AUDIT_WRITER,
    TOKENS.WMS_TRANSACTION_RUNNER,
    TOKENS.STOCKABLE_ITEM_LOOKUP_PORT,
    TOKENS.RECEIVING_EXPECTATION_LOOKUP_PORT
  ]
})
export class WmsInfrastructureModule {}
