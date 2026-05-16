import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RequirePermissions, WMS_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { WmsService } from '../../../wms.service'
import {
  CancelReceiptDraftDto,
  CreateReceiptDraftDto,
  GetInventoryBalanceDto,
  ListLocationsDto,
  ListWarehousesDto,
  PostReceiptDto,
  ReplaceReceiptLinesDto,
  SearchInventoryBalancesDto,
  SearchReceiptLinesDto,
  SearchReceiptsDto,
  SearchStockLedgerEntriesDto
} from '../dtos/wms.dto'

@ApiBearerAuth('JWT')
@ApiTags('wms')
@Controller('wms/tenants/:tenantId')
// Exposes the tenant-scoped WMS phase 1 BFF surface without widening the underlying wms-service contract.
export class WmsController {
  constructor(private readonly wmsService: WmsService) {}

  @Get('warehouses')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE] })
  @ApiOperation({ summary: 'List WMS warehouses for the phase 1 workspace' })
  async listWarehouses(
    @Param('tenantId') tenantId: string,
    @Query() query: ListWarehousesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.listWarehouses(
      tenantId,
      {
        keyword: query.keyword,
        page: query.page,
        pageSize: query.pageSize,
        status: query.status
      },
      source
    )
  }

  @Get('warehouses/:warehouseId')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE] })
  @ApiOperation({ summary: 'Get one WMS warehouse detail snapshot' })
  async getWarehouse(
    @Param('tenantId') tenantId: string,
    @Param('warehouseId') warehouseId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.getWarehouse(tenantId, warehouseId, source)
  }

  @Get('locations')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION] })
  @ApiOperation({ summary: 'List WMS locations for the phase 1 workspace' })
  async listLocations(
    @Param('tenantId') tenantId: string,
    @Query() query: ListLocationsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.listLocations(
      tenantId,
      {
        locationType: query.locationType,
        page: query.page,
        pageSize: query.pageSize,
        parentLocationId: query.parentLocationId,
        status: query.status,
        supportsReceipt: query.supportsReceipt,
        supportsStorage: query.supportsStorage,
        warehouseId: query.warehouseId
      },
      source
    )
  }

  @Get('locations/:locationId')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION] })
  @ApiOperation({ summary: 'Get one WMS location detail snapshot' })
  async getLocation(
    @Param('tenantId') tenantId: string,
    @Param('locationId') locationId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.getLocation(tenantId, locationId, source)
  }

  @Get('receipts')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT] })
  @ApiOperation({ summary: 'Search WMS receipts for the phase 1 workspace' })
  async searchReceipts(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchReceiptsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.searchReceipts(
      tenantId,
      {
        keyword: query.keyword,
        page: query.page,
        pageSize: query.pageSize,
        postedAtFrom: query.postedAtFrom,
        postedAtTo: query.postedAtTo,
        receiptDateFrom: query.receiptDateFrom,
        receiptDateTo: query.receiptDateTo,
        receiptSourceType: query.receiptSourceType,
        receivingExpectationId: query.receivingExpectationId,
        status: query.status,
        warehouseId: query.warehouseId
      },
      source
    )
  }

  @Get('receipts/:receiptId')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT] })
  @ApiOperation({ summary: 'Get one WMS receipt detail snapshot' })
  async getReceipt(
    @Param('tenantId') tenantId: string,
    @Param('receiptId') receiptId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.getReceipt(tenantId, receiptId, source)
  }

  @Get('receipt-lines')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT] })
  @ApiOperation({ summary: 'Search WMS receipt lines for the phase 1 workspace' })
  async searchReceiptLines(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchReceiptLinesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.searchReceiptLines(
      tenantId,
      {
        discrepancyType: query.discrepancyType,
        inventoryStatus: query.inventoryStatus,
        itemId: query.itemId,
        page: query.page,
        pageSize: query.pageSize,
        postedAtFrom: query.postedAtFrom,
        postedAtTo: query.postedAtTo,
        receiptId: query.receiptId,
        receivingExpectationId: query.receivingExpectationId,
        restrictedReasonCode: query.restrictedReasonCode,
        targetLocationId: query.targetLocationId,
        warehouseId: query.warehouseId
      },
      source
    )
  }

  @Get('receipt-lines/:receiptLineId')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT] })
  @ApiOperation({ summary: 'Get one WMS receipt line detail snapshot' })
  async getReceiptLine(
    @Param('tenantId') tenantId: string,
    @Param('receiptLineId') receiptLineId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.getReceiptLine(tenantId, receiptLineId, source)
  }

  @Post('receipts')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT] })
  @ApiOperation({ summary: 'Create one WMS receipt draft' })
  @ApiBody({ type: CreateReceiptDraftDto })
  async createReceiptDraft(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateReceiptDraftDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.createReceiptDraft(tenantId, body, source)
  }

  @Put('receipts/:receiptId/lines')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT] })
  @ApiOperation({ summary: 'Full-replace one WMS receipt draft line snapshot' })
  @ApiBody({ type: ReplaceReceiptLinesDto })
  async addOrReplaceReceiptLines(
    @Param('tenantId') tenantId: string,
    @Param('receiptId') receiptId: string,
    @Body() body: ReplaceReceiptLinesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.addOrReplaceReceiptLines(tenantId, receiptId, body, source)
  }

  @Post('receipts/:receiptId/post')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT] })
  @ApiOperation({ summary: 'Post one WMS receipt draft into inventory truth' })
  @ApiBody({ type: PostReceiptDto })
  async postReceipt(
    @Param('tenantId') tenantId: string,
    @Param('receiptId') receiptId: string,
    @Body() body: PostReceiptDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.postReceipt(tenantId, receiptId, body, source)
  }

  @Post('receipts/:receiptId/cancel')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.MANAGE_RECEIPT] })
  @ApiOperation({ summary: 'Cancel one WMS receipt draft' })
  @ApiBody({ type: CancelReceiptDraftDto })
  async cancelReceiptDraft(
    @Param('tenantId') tenantId: string,
    @Param('receiptId') receiptId: string,
    @Body() body: CancelReceiptDraftDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.cancelReceiptDraft(tenantId, receiptId, body, source)
  }

  @Get('stock-ledger-entries')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY] })
  @ApiOperation({ summary: 'Search WMS stock ledger entries for the phase 1 workspace' })
  async searchStockLedgerEntries(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchStockLedgerEntriesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.searchStockLedgerEntries(
      tenantId,
      {
        inventoryStatus: query.inventoryStatus,
        itemId: query.itemId,
        locationId: query.locationId,
        page: query.page,
        pageSize: query.pageSize,
        postedAtFrom: query.postedAtFrom,
        postedAtTo: query.postedAtTo,
        receiptId: query.receiptId,
        receiptLineId: query.receiptLineId,
        receivingExpectationId: query.receivingExpectationId,
        restrictedReasonCode: query.restrictedReasonCode,
        warehouseId: query.warehouseId
      },
      source
    )
  }

  @Get('inventory-balance')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY] })
  @ApiOperation({ summary: 'Get one WMS inventory balance snapshot' })
  async getInventoryBalance(
    @Param('tenantId') tenantId: string,
    @Query() query: GetInventoryBalanceDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.getInventoryBalance(
      tenantId,
      {
        itemId: query.itemId,
        locationId: query.locationId,
        warehouseId: query.warehouseId
      },
      source
    )
  }

  @Get('inventory-balances')
  @RequirePermissions({ all: [WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY] })
  @ApiOperation({ summary: 'Search WMS inventory balances for the phase 1 workspace' })
  async searchInventoryBalances(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchInventoryBalancesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.wmsService.searchInventoryBalances(
      tenantId,
      {
        inventoryStatus: query.inventoryStatus,
        itemId: query.itemId,
        locationId: query.locationId,
        onlyPositiveOnHand: query.onlyPositiveOnHand,
        page: query.page,
        pageSize: query.pageSize,
        restrictedReasonCode: query.restrictedReasonCode,
        warehouseId: query.warehouseId
      },
      source
    )
  }
}
