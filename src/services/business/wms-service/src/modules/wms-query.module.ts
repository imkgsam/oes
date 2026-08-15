import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GetInventoryBalanceHandler } from '../application/queries/get-inventory-balance.handler'
import { GetLocationHandler } from '../application/queries/get-location.handler'
import { GetReceiptLineHandler } from '../application/queries/get-receipt-line.handler'
import { GetReceiptHandler } from '../application/queries/get-receipt.handler'
import { GetWarehouseHandler } from '../application/queries/get-warehouse.handler'
import { ListLocationsHandler } from '../application/queries/list-locations.handler'
import { ListWarehousesHandler } from '../application/queries/list-warehouses.handler'
import { SearchInventoryBalancesHandler } from '../application/queries/search-inventory-balances.handler'
import { SearchReceiptLinesHandler } from '../application/queries/search-receipt-lines.handler'
import { SearchReceiptsHandler } from '../application/queries/search-receipts.handler'
import { SearchStockLedgerEntriesHandler } from '../application/queries/search-stock-ledger-entries.handler'
import { WmsQueryGrpcController } from '../interfaces/grpc/wms-query.grpc.controller'
import { WmsTrustedExecutionModule } from './wms-trusted-execution.module'

/** WmsQueryModule wires the phase 1 WMS query handlers and gRPC controller surface. */
@Module({
  imports: [CqrsModule, WmsTrustedExecutionModule],
  providers: [
    ValidatingQueryBus,
    GetWarehouseHandler,
    ListWarehousesHandler,
    GetLocationHandler,
    ListLocationsHandler,
    GetReceiptHandler,
    SearchReceiptsHandler,
    GetReceiptLineHandler,
    SearchReceiptLinesHandler,
    SearchStockLedgerEntriesHandler,
    GetInventoryBalanceHandler,
    SearchInventoryBalancesHandler
  ],
  controllers: [WmsQueryGrpcController]
})
export class WmsQueryModule {}
