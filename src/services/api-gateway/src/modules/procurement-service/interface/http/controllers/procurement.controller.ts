import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  PermissionCheckAll,
  PROCUREMENT_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { ProcurementService } from '../../../procurement.service'
import {
  ApplyPurchaseOrderChangeDto,
  CancelPurchaseOrderDto,
  CancelPurchaseRequestDto,
  ConfirmSupplierAcknowledgementDto,
  ConvertPurchaseRequestToPurchaseOrderDto,
  CreatePurchaseOrderDraftDto,
  CreatePurchaseRequestDto,
  CreateReceivingExpectationDto,
  DecidePurchaseRequestDto,
  IssuePurchaseOrderDto,
  ListPurchaseOrderChangesDto,
  RecordReceivingDiscrepancyResolutionDto,
  SearchPurchaseOrdersDto,
  SearchPurchaseRequestsDto,
  SearchReceivingExpectationsDto,
  SubmitPurchaseRequestDto,
  UpdatePurchaseOrderDraftDto,
  UpdatePurchaseRequestDraftDto
} from '../dtos/procurement.dto'

@ApiBearerAuth('JWT')
@ApiTags('procurement')
@Controller('procurement/tenants/:tenantId')
// Exposes the tenant-scoped procurement phase 1 BFF surface without widening the underlying procurement-service contract.
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('purchase-requests')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_REQUEST])
  @ApiOperation({ summary: 'Search procurement purchase requests for the phase 1 procurement workspace' })
  async searchPurchaseRequests(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchPurchaseRequestsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.searchPurchaseRequests(
      tenantId,
      {
        itemId: query.itemId,
        keyword: query.keyword,
        neededByDateFrom: query.neededByDateFrom,
        neededByDateTo: query.neededByDateTo,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        requestType: query.requestType,
        requesterOperatorId: query.requesterOperatorId,
        status: query.status
      },
      source
    )
  }

  @Get('purchase-requests/:purchaseRequestId')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_REQUEST])
  @ApiOperation({ summary: 'Get one procurement purchase request detail snapshot' })
  async getPurchaseRequest(
    @Param('tenantId') tenantId: string,
    @Param('purchaseRequestId') purchaseRequestId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.getPurchaseRequest(tenantId, purchaseRequestId, source)
  }

  @Post('purchase-requests')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_REQUEST])
  @ApiOperation({ summary: 'Create one procurement purchase request draft' })
  @ApiBody({ type: CreatePurchaseRequestDto })
  async createPurchaseRequest(
    @Param('tenantId') tenantId: string,
    @Body() body: CreatePurchaseRequestDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.createPurchaseRequest(tenantId, body, source)
  }

  @Put('purchase-requests/:purchaseRequestId/draft')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_REQUEST_DRAFT])
  @ApiOperation({ summary: 'Full-replace one procurement purchase request draft snapshot' })
  @ApiBody({ type: UpdatePurchaseRequestDraftDto })
  async updatePurchaseRequestDraft(
    @Param('tenantId') tenantId: string,
    @Param('purchaseRequestId') purchaseRequestId: string,
    @Body() body: UpdatePurchaseRequestDraftDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.updatePurchaseRequestDraft(
      tenantId,
      purchaseRequestId,
      body,
      source
    )
  }

  @Post('purchase-requests/:purchaseRequestId/submit')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.SUBMIT_PURCHASE_REQUEST])
  @ApiOperation({ summary: 'Submit one procurement purchase request draft' })
  @ApiBody({ type: SubmitPurchaseRequestDto })
  async submitPurchaseRequest(
    @Param('tenantId') tenantId: string,
    @Param('purchaseRequestId') purchaseRequestId: string,
    @Body() body: SubmitPurchaseRequestDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.submitPurchaseRequest(
      tenantId,
      purchaseRequestId,
      body.auditReason,
      body.submissionComment,
      source
    )
  }

  @Post('purchase-requests/:purchaseRequestId/decision')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.DECIDE_PURCHASE_REQUEST])
  @ApiOperation({ summary: 'Record one procurement purchase request decision snapshot' })
  @ApiBody({ type: DecidePurchaseRequestDto })
  async decidePurchaseRequest(
    @Param('tenantId') tenantId: string,
    @Param('purchaseRequestId') purchaseRequestId: string,
    @Body() body: DecidePurchaseRequestDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.decidePurchaseRequest(tenantId, purchaseRequestId, body, source)
  }

  @Post('purchase-requests/:purchaseRequestId/cancel')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_REQUEST])
  @ApiOperation({ summary: 'Cancel one procurement purchase request' })
  @ApiBody({ type: CancelPurchaseRequestDto })
  async cancelPurchaseRequest(
    @Param('tenantId') tenantId: string,
    @Param('purchaseRequestId') purchaseRequestId: string,
    @Body() body: CancelPurchaseRequestDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.cancelPurchaseRequest(tenantId, purchaseRequestId, body, source)
  }

  @Post('purchase-requests/:purchaseRequestId/convert-to-order')
  @PermissionCheckAll([
    PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONVERT_PURCHASE_REQUEST_TO_ORDER
  ])
  @ApiOperation({ summary: 'Convert one approved procurement purchase request into a purchase order draft' })
  @ApiBody({ type: ConvertPurchaseRequestToPurchaseOrderDto })
  async convertPurchaseRequestToPurchaseOrder(
    @Param('tenantId') tenantId: string,
    @Param('purchaseRequestId') purchaseRequestId: string,
    @Body() body: ConvertPurchaseRequestToPurchaseOrderDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.convertPurchaseRequestToPurchaseOrder(
      tenantId,
      purchaseRequestId,
      body,
      source
    )
  }

  @Get('purchase-orders')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER])
  @ApiOperation({ summary: 'Search procurement purchase orders for the phase 1 procurement workspace' })
  async searchPurchaseOrders(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchPurchaseOrdersDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.searchPurchaseOrders(
      tenantId,
      {
        issuedFrom: query.issuedFrom,
        issuedTo: query.issuedTo,
        itemId: query.itemId,
        keyword: query.keyword,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        requestNo: query.requestNo,
        status: query.status,
        supplierId: query.supplierId
      },
      source
    )
  }

  @Get('purchase-orders/:purchaseOrderId')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_PURCHASE_ORDER])
  @ApiOperation({ summary: 'Get one procurement purchase order detail snapshot' })
  async getPurchaseOrder(
    @Param('tenantId') tenantId: string,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.getPurchaseOrder(tenantId, purchaseOrderId, source)
  }

  @Post('purchase-orders')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_PURCHASE_ORDER_DRAFT])
  @ApiOperation({ summary: 'Create one procurement purchase order draft' })
  @ApiBody({ type: CreatePurchaseOrderDraftDto })
  async createPurchaseOrderDraft(
    @Param('tenantId') tenantId: string,
    @Body() body: CreatePurchaseOrderDraftDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.createPurchaseOrderDraft(tenantId, body, source)
  }

  @Put('purchase-orders/:purchaseOrderId/draft')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.UPDATE_PURCHASE_ORDER_DRAFT])
  @ApiOperation({ summary: 'Full-replace one procurement purchase order draft snapshot' })
  @ApiBody({ type: UpdatePurchaseOrderDraftDto })
  async updatePurchaseOrderDraft(
    @Param('tenantId') tenantId: string,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: UpdatePurchaseOrderDraftDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.updatePurchaseOrderDraft(tenantId, purchaseOrderId, body, source)
  }

  @Post('purchase-orders/:purchaseOrderId/issue')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.ISSUE_PURCHASE_ORDER])
  @ApiOperation({ summary: 'Issue one procurement purchase order draft' })
  @ApiBody({ type: IssuePurchaseOrderDto })
  async issuePurchaseOrder(
    @Param('tenantId') tenantId: string,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: IssuePurchaseOrderDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.issuePurchaseOrder(
      tenantId,
      purchaseOrderId,
      body.auditReason,
      body.issueComment,
      source
    )
  }

  @Post('purchase-orders/:purchaseOrderId/supplier-acknowledgement')
  @PermissionCheckAll([
    PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CONFIRM_SUPPLIER_ACKNOWLEDGEMENT
  ])
  @ApiOperation({ summary: 'Record one procurement supplier acknowledgement summary' })
  @ApiBody({ type: ConfirmSupplierAcknowledgementDto })
  async confirmSupplierAcknowledgement(
    @Param('tenantId') tenantId: string,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: ConfirmSupplierAcknowledgementDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.confirmSupplierAcknowledgement(
      tenantId,
      purchaseOrderId,
      body,
      source
    )
  }

  @Post('purchase-orders/:purchaseOrderId/changes')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.APPLY_PURCHASE_ORDER_CHANGE])
  @ApiOperation({ summary: 'Apply one procurement purchase order change and return the saved change record' })
  @ApiBody({ type: ApplyPurchaseOrderChangeDto })
  async applyPurchaseOrderChange(
    @Param('tenantId') tenantId: string,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: ApplyPurchaseOrderChangeDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.applyPurchaseOrderChange(
      tenantId,
      purchaseOrderId,
      body,
      source
    )
  }

  @Post('purchase-orders/:purchaseOrderId/cancel')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CANCEL_PURCHASE_ORDER])
  @ApiOperation({ summary: 'Cancel one procurement purchase order' })
  @ApiBody({ type: CancelPurchaseOrderDto })
  async cancelPurchaseOrder(
    @Param('tenantId') tenantId: string,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: CancelPurchaseOrderDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.cancelPurchaseOrder(tenantId, purchaseOrderId, body, source)
  }

  @Get('purchase-orders/:purchaseOrderId/changes')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_PURCHASE_ORDER_CHANGES])
  @ApiOperation({ summary: 'List one procurement purchase order change history page' })
  async listPurchaseOrderChanges(
    @Param('tenantId') tenantId: string,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Query() query: ListPurchaseOrderChangesDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.listPurchaseOrderChanges(
      tenantId,
      purchaseOrderId,
      {
        page: query.page || 1,
        pageSize: query.pageSize || 20
      },
      source
    )
  }

  @Get('receiving-expectations')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.LIST_RECEIVING_EXPECTATION])
  @ApiOperation({ summary: 'Search procurement receiving expectations for the phase 1 procurement workspace' })
  async searchReceivingExpectations(
    @Param('tenantId') tenantId: string,
    @Query() query: SearchReceivingExpectationsDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.searchReceivingExpectations(
      tenantId,
      {
        expectedReceiptDateFrom: query.expectedReceiptDateFrom,
        expectedReceiptDateTo: query.expectedReceiptDateTo,
        hasOpenDiscrepancy: query.hasOpenDiscrepancy,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        purchaseOrderId: query.purchaseOrderId,
        status: query.status,
        supplierId: query.supplierId
      },
      source
    )
  }

  @Get('receiving-expectations/:receivingExpectationId')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.GET_RECEIVING_EXPECTATION])
  @ApiOperation({ summary: 'Get one procurement receiving expectation detail snapshot' })
  async getReceivingExpectation(
    @Param('tenantId') tenantId: string,
    @Param('receivingExpectationId') receivingExpectationId: string,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.getReceivingExpectation(
      tenantId,
      receivingExpectationId,
      source
    )
  }

  @Post('receiving-expectations')
  @PermissionCheckAll([PROCUREMENT_MANAGEMENT_PERMISSION_CODES.CREATE_RECEIVING_EXPECTATION])
  @ApiOperation({ summary: 'Create one procurement receiving expectation snapshot' })
  @ApiBody({ type: CreateReceivingExpectationDto })
  async createReceivingExpectation(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateReceivingExpectationDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.createReceivingExpectation(tenantId, body, source)
  }

  @Post('receiving-expectations/:receivingExpectationId/discrepancies/:receivingDiscrepancyId/resolution')
  @PermissionCheckAll([
    PROCUREMENT_MANAGEMENT_PERMISSION_CODES.RECORD_RECEIVING_DISCREPANCY_RESOLUTION
  ])
  @ApiOperation({ summary: 'Record one procurement receiving discrepancy resolution summary' })
  @ApiBody({ type: RecordReceivingDiscrepancyResolutionDto })
  async recordReceivingDiscrepancyResolution(
    @Param('tenantId') tenantId: string,
    @Param('receivingExpectationId') receivingExpectationId: string,
    @Param('receivingDiscrepancyId') receivingDiscrepancyId: string,
    @Body() body: RecordReceivingDiscrepancyResolutionDto,
    @DownstreamSource() source: DownstreamRequestSource
  ) {
    return this.procurementService.recordReceivingDiscrepancyResolution(
      tenantId,
      receivingExpectationId,
      receivingDiscrepancyId,
      body,
      source
    )
  }
}
