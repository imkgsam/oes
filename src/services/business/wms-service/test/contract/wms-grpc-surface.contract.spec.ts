import {
  InventoryBalanceStatusFilter as ProtoInventoryBalanceStatusFilter,
  InventoryStatus as ProtoInventoryStatus,
  ReceiptSourceType as ProtoReceiptSourceType,
  ReceiptStatus as ProtoReceiptStatus
} from '@oes/common/generated/wms_service'
import {
  attachVerifiedExecution,
  getAuthenticatedGrpcRequestContext
} from '@oes/common/authorization'
import { WmsManagementGrpcController } from '../../src/interfaces/grpc/wms-management.grpc.controller'
import { WmsQueryGrpcController } from '../../src/interfaces/grpc/wms-query.grpc.controller'

/** Builds the private verified context attached by the trusted execution guard. */
function buildQueryContext(): Record<string, unknown> {
  const request: Record<string, unknown> = {}
  attachVerifiedExecution(request, {
    verifiedExecutionToken: {
      issuer: 'https://auth.example',
      audience: 'urn:oes:service:wms-service',
      subject: 'operator-1',
      principalType: 'HUMAN',
      clientId: 'spiffe://oes/api-gateway',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      permissionCodes: [],
      tokenId: 'token-1',
      issuedAt: 1,
      notBefore: 1,
      expiresAt: 9999999999,
      certificateThumbprint: 'A'.repeat(43),
      sessionId: 'session-1',
      sessionTerminal: 'WEB'
    },
    verifiedWorkloadIdentity: {
      spiffeId: 'spiffe://oes/api-gateway',
      certificateThumbprint: 'A'.repeat(43)
    }
  })
  Object.assign(getAuthenticatedGrpcRequestContext(request) as object, {
    requestId: 'request-1',
    traceId: 'trace-1'
  })
  return request
}

/** Reuses the same verified authority because audit is claims-derived. */
function buildManagementContext(): Record<string, unknown> {
  return buildQueryContext()
}

describe('wms-service grpc surface Contract', () => {
  it('CreateReceiptDraft / should dispatch the management command through the audit wrapper and present the receipt response', async () => {
    const execute = jest.fn().mockResolvedValue({
      receiptId: 'receipt-1',
      receiptNo: 'RC-000001',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      warehouseId: 'wh-1',
      status: 'DRAFT',
      receiptSourceType: 'MANUAL',
      referencedReceivingExpectationIds: [],
      receiptDate: '2026-04-29',
      note: 'manual receipt',
      attachmentRefs: ['attachment-1'],
      lineCount: 0,
      postedAt: null,
      cancelledAt: null,
      cancelReason: null,
      postComment: null,
      procurementReceiptSummary: null,
      createdAt: '2026-04-29T10:00:00.000Z',
      updatedAt: '2026-04-29T10:00:00.000Z',
      lines: []
    })
    const recordCommand = jest.fn(async (_meta, work) => work())
    const controller = new WmsManagementGrpcController(
      { execute } as never,
      { recordCommand } as never
    )

    const response = await controller.createReceiptDraft({
      ...buildManagementContext(),
      warehouseId: 'wh-1',
      receiptSourceType: ProtoReceiptSourceType.RECEIPT_SOURCE_TYPE_MANUAL,
      note: 'manual receipt',
      attachmentRefs: ['attachment-1']
    })

    expect(recordCommand).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(response.receipt).toEqual(
      expect.objectContaining({
        receiptId: 'receipt-1',
        receiptNo: 'RC-000001',
        status: ProtoReceiptStatus.RECEIPT_STATUS_DRAFT
      })
    )
  })

  it('SearchInventoryBalances / should map the query payload and present the projected balance page', async () => {
    const execute = jest.fn().mockResolvedValue({
      items: [
        {
          tenantId: 'tenant-1',
          orgId: 'org-1',
          warehouseId: 'wh-1',
          locationId: 'loc-1',
          itemId: 'item-1',
          itemCode: 'RM-001',
          itemName: 'Resin',
          uom: 'KG',
          onHandQuantity: '10',
          availableQuantity: '8',
          restrictedQuantity: '2',
          restrictedQuantities: [
            {
              reasonCode: 'DAMAGED',
              quantity: '2'
            }
          ],
          lastLedgerEntryId: 'ledger-2',
          lastPostedAt: '2026-04-29T11:00:00.000Z',
          updatedAt: '2026-04-29T11:00:00.000Z'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    const controller = new WmsQueryGrpcController({
      execute
    } as never)

    const response = await controller.searchInventoryBalances({
      ...buildQueryContext(),
      warehouseId: 'wh-1',
      inventoryStatus: ProtoInventoryBalanceStatusFilter.INVENTORY_BALANCE_STATUS_FILTER_RESTRICTED,
      page: 1,
      pageSize: 20
    })

    expect(execute).toHaveBeenCalledTimes(1)
    expect(response.inventoryBalances?.[0]).toEqual(
      expect.objectContaining({
        warehouseId: 'wh-1',
        itemId: 'item-1',
        onHandQuantity: '10',
        availableQuantity: '8',
        restrictedQuantity: '2'
      })
    )
  })

  it('PostReceipt / should present posted ledger ids and mapped receipt status', async () => {
    const execute = jest.fn().mockResolvedValue({
      receiptId: 'receipt-1',
      receiptNo: 'RC-000001',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      warehouseId: 'wh-1',
      status: 'POSTED',
      receiptSourceType: 'MANUAL',
      referencedReceivingExpectationIds: [],
      receiptDate: '2026-04-29',
      note: null,
      attachmentRefs: [],
      lineCount: 1,
      postedAt: '2026-04-29T11:00:00.000Z',
      cancelledAt: null,
      cancelReason: null,
      postComment: 'posted',
      procurementReceiptSummary: null,
      createdAt: '2026-04-29T10:00:00.000Z',
      updatedAt: '2026-04-29T11:00:00.000Z',
      lines: [
        {
          receiptLineId: 'line-1',
          receiptId: 'receipt-1',
          lineNo: 1,
          itemId: 'item-1',
          itemCode: 'RM-001',
          itemName: 'Resin',
          receivingExpectationId: null,
          targetLocationId: 'loc-1',
          confirmedQuantity: '10',
          uom: 'KG',
          inventoryStatus: 'AVAILABLE',
          restrictedReason: null,
          trackingRefs: [],
          physicalDiscrepancy: null,
          evidenceAttachmentRefs: [],
          postedStockLedgerEntryIds: ['ledger-1'],
          createdAt: '2026-04-29T10:30:00.000Z',
          updatedAt: '2026-04-29T11:00:00.000Z'
        }
      ]
    })
    const recordCommand = jest.fn(async (_meta, work) => work())
    const controller = new WmsManagementGrpcController(
      { execute } as never,
      { recordCommand } as never
    )

    const response = await controller.postReceipt({
      ...buildManagementContext(),
      receiptId: 'receipt-1',
      postComment: 'posted'
    })

    expect(response.receipt?.status).toBe(ProtoReceiptStatus.RECEIPT_STATUS_POSTED)
    expect(response.postedStockLedgerEntryIds).toEqual(['ledger-1'])
  })
})
