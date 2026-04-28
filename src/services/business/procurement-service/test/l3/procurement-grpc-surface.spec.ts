import {
  ApplyPurchaseOrderChangeRequest,
  ConfirmSupplierAcknowledgementRequest,
  CreatePurchaseOrderDraftRequest,
  CreatePurchaseRequestRequest,
  CreateReceivingExpectationRequest,
  GetPurchaseOrderRequest,
  ProcurementManagementServiceControllerMethods,
  ProcurementQueryServiceControllerMethods,
  PurchaseOrderLineAllocationType as ProtoPurchaseOrderLineAllocationType,
  PurchaseOrderStatus as ProtoPurchaseOrderStatus,
  PurchaseRequestDecision as ProtoPurchaseRequestDecision,
  PurchaseRequestLineType as ProtoPurchaseRequestLineType,
  PurchaseRequestStatus as ProtoPurchaseRequestStatus,
  PurchaseRequestType as ProtoPurchaseRequestType,
  ReceivingDiscrepancyStatus as ProtoReceivingDiscrepancyStatus,
  ReceivingDiscrepancyType as ProtoReceivingDiscrepancyType,
  ReceivingExpectationStatus as ProtoReceivingExpectationStatus,
  ReceivingResolutionCode as ProtoReceivingResolutionCode,
  SearchPurchaseOrdersRequest,
  SearchPurchaseRequestsRequest,
  SearchReceivingExpectationsRequest
} from '@oes/common/generated/procurement_service'
import { ProcurementManagementGrpcController } from '../../src/interfaces/grpc/procurement-management.grpc.controller'
import { ProcurementQueryGrpcController } from '../../src/interfaces/grpc/procurement-query.grpc.controller'

/** buildQueryContext creates the explicit tenant/operator/trace shape frozen by the query contracts. */
function buildQueryContext(): Pick<
  SearchPurchaseRequestsRequest,
  'tenantId' | 'operatorContext' | 'traceContext'
> {
  return {
    tenantId: 'tenant-1',
    operatorContext: {
      operatorId: 'operator-1',
      operatorType: 'HUMAN',
      orgId: 'org-1'
    },
    traceContext: {
      traceId: 'trace-1',
      requestId: 'request-1'
    }
  }
}

/** buildManagementContext creates the explicit tenant/operator/trace/audit shape frozen by the management contracts. */
function buildManagementContext(): Pick<
  CreatePurchaseRequestRequest,
  'tenantId' | 'operatorContext' | 'traceContext' | 'auditContext'
> {
  return {
    ...buildQueryContext(),
    auditContext: {
      auditId: 'audit-1',
      reason: 'test',
      source: 'jest'
    }
  }
}

describe('procurement-service grpc surface L3', () => {
  const requestContextStore = {
    run: jest.fn((_context, work: () => unknown) => work())
  }

  it('CreatePurchaseRequest / should dispatch the management command through the audit wrapper and present the purchase request response', async () => {
    const execute = jest.fn().mockResolvedValue({
      purchaseRequestId: 'pr-1',
      requestNo: 'PR-0001',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      requestType: 'DEPARTMENTAL',
      status: 'DRAFT',
      requester: {
        operatorId: 'operator-1',
        displayName: 'Buyer One'
      },
      title: 'Office supplies',
      reason: 'phase 1',
      submissionComment: null,
      cancelReason: null,
      createdAt: '2026-04-28T10:00:00.000Z',
      updatedAt: '2026-04-28T10:00:00.000Z',
      submittedAt: null,
      decidedAt: null,
      cancelledAt: null,
      approvalSnapshot: null,
      lines: [
        {
          purchaseRequestLineId: 'pr-line-1',
          lineNo: 1,
          lineType: 'TEXT',
          itemId: null,
          itemCode: null,
          itemName: null,
          description: 'Pens',
          requestedQuantity: '10',
          uom: 'BOX',
          neededByDate: null,
          demandReferenceType: null,
          demandReferenceId: null
        }
      ]
    })
    const recordCommand = jest.fn(async (_meta, work) => work())
    const controller = new ProcurementManagementGrpcController(
      { execute } as never,
      { recordCommand } as never,
      requestContextStore as never
    )

    const response = await controller.createPurchaseRequest({
      ...buildManagementContext(),
      orgId: 'org-1',
      requestType: ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_DEPARTMENTAL,
      title: 'Office supplies',
      reason: 'phase 1',
      lines: [
        {
          lineType: ProtoPurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_TEXT,
          description: 'Pens',
          requestedQuantity: '10',
          uom: 'BOX'
        }
      ]
    })

    expect(recordCommand).toHaveBeenCalledTimes(1)
    expect(execute).toHaveBeenCalledTimes(1)
    expect(response.purchaseRequest).toEqual(
      expect.objectContaining({
        purchaseRequestId: 'pr-1',
        requestNo: 'PR-0001',
        requestType: ProtoPurchaseRequestType.PURCHASE_REQUEST_TYPE_DEPARTMENTAL,
        status: ProtoPurchaseRequestStatus.PURCHASE_REQUEST_STATUS_DRAFT
      })
    )
  })

  it('ApplyPurchaseOrderChange / should dispatch the change command and present the updated order plus APPLIED change response', async () => {
    const execute = jest.fn().mockResolvedValue({
      purchaseOrder: {
        purchaseOrderId: 'po-1',
        orderNo: 'PO-0001',
        tenantId: 'tenant-1',
        orgId: 'org-1',
        status: 'ACKNOWLEDGED',
        currencyCode: 'USD',
        supplierId: 'supplier-1',
        supplierSnapshot: {
          supplierId: 'supplier-1',
          supplierDisplayName: 'Acme Supplier',
          supplierStatusAtIssue: 'ACTIVE'
        },
        sourcePurchaseRequestIds: ['pr-1'],
        supplierAcknowledgement: {
          acknowledgementStatus: 'ACKNOWLEDGED',
          acknowledgedAt: '2026-04-28T12:00:00.000Z',
          externalReference: 'ACK-001',
          comment: 'confirmed'
        },
        issueComment: 'issued',
        cancelReason: null,
        createdAt: '2026-04-28T11:00:00.000Z',
        updatedAt: '2026-04-28T12:05:00.000Z',
        issuedAt: '2026-04-28T11:05:00.000Z',
        cancelledAt: null,
        lines: [
          {
            purchaseOrderLineId: 'po-line-1',
            lineNo: 1,
            lineType: 'STANDARD_ITEM',
            itemId: 'item-1',
            itemCode: 'RM-001',
            itemName: 'Resin',
            description: 'Resin',
            supplierOfferingId: 'offering-1',
            orderedQuantity: '12',
            uom: 'KG',
            orderedUnitPrice: '9.80',
            sourcePurchaseRequestLineId: 'pr-line-1',
            sourceRequestedQuantity: '10',
            generalStockExcessReason: 'buffer stock',
            allocations: [
              {
                purchaseOrderLineAllocationId: 'alloc-1',
                allocationType: 'GENERAL_STOCK',
                referenceId: null,
                quantity: '12',
                reason: 'buffer stock'
              }
            ]
          }
        ],
        changes: []
      },
      change: {
        purchaseOrderChangeId: 'change-1',
        purchaseOrderId: 'po-1',
        changeType: 'LINE_QTY_ADJUSTED',
        changeSummary: 'line quantity adjusted',
        changeReason: 'buffer stock',
        appliedBy: {
          operatorId: 'buyer-1',
          displayName: 'Buyer One'
        },
        appliedAt: '2026-04-28T12:05:00.000Z',
        status: 'APPLIED'
      }
    })
    const recordCommand = jest.fn(async (_meta, work) => work())
    const controller = new ProcurementManagementGrpcController(
      { execute } as never,
      { recordCommand } as never,
      requestContextStore as never
    )

    const response = await controller.applyPurchaseOrderChange({
      ...buildManagementContext(),
      purchaseOrderId: 'po-1',
      changeType: 'LINE_QTY_ADJUSTED',
      changeReason: 'buffer stock',
      targetState: {
        lines: [
          {
            purchaseOrderLineId: 'po-line-1',
            lineType: ProtoPurchaseRequestLineType.PURCHASE_REQUEST_LINE_TYPE_STANDARD_ITEM,
            itemId: 'item-1',
            description: 'Resin',
            orderedQuantity: '12',
            uom: 'KG',
            orderedUnitPrice: '9.80',
            sourcePurchaseRequestLineId: 'pr-line-1',
            generalStockExcessReason: 'buffer stock',
            allocations: [
              {
                allocationType: ProtoPurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_GENERAL_STOCK,
                quantity: '12',
                reason: 'buffer stock'
              }
            ]
          }
        ]
      }
    } satisfies ApplyPurchaseOrderChangeRequest)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(response.purchaseOrder).toEqual(
      expect.objectContaining({
        purchaseOrderId: 'po-1',
        status: ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_ACKNOWLEDGED
      })
    )
    expect(response.change).toEqual(
      expect.objectContaining({
        purchaseOrderChangeId: 'change-1',
        changeType: 'LINE_QTY_ADJUSTED'
      })
    )
  })

  it('SearchPurchaseOrders / should dispatch the query and present the purchase-order directory page', async () => {
    const execute = jest.fn().mockResolvedValue({
      purchaseOrders: [
        {
          purchaseOrderId: 'po-1',
          orderNo: 'PO-0001',
          tenantId: 'tenant-1',
          orgId: 'org-1',
          status: 'ISSUED',
          currencyCode: 'USD',
          supplierId: 'supplier-1',
          supplierSnapshot: {
            supplierId: 'supplier-1',
            supplierDisplayName: 'Acme Supplier',
            supplierStatusAtIssue: 'ACTIVE'
          },
          sourcePurchaseRequestIds: ['pr-1'],
          supplierAcknowledgement: {
            acknowledgementStatus: 'PENDING',
            acknowledgedAt: null,
            externalReference: null,
            comment: null
          },
          issueComment: 'issued',
          cancelReason: null,
          createdAt: '2026-04-28T11:00:00.000Z',
          updatedAt: '2026-04-28T11:05:00.000Z',
          issuedAt: '2026-04-28T11:05:00.000Z',
          cancelledAt: null,
          lines: [],
          changes: []
        }
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
    const controller = new ProcurementQueryGrpcController({ execute } as never)

    const response = await controller.searchPurchaseOrders({
      ...buildQueryContext(),
      supplierId: 'supplier-1',
      status: ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_ISSUED,
      page: 1,
      pageSize: 20
    } satisfies SearchPurchaseOrdersRequest)

    expect(execute).toHaveBeenCalledTimes(1)
    expect(response).toEqual({
      purchaseOrders: [
        expect.objectContaining({
          purchaseOrderId: 'po-1',
          supplierId: 'supplier-1',
          status: ProtoPurchaseOrderStatus.PURCHASE_ORDER_STATUS_ISSUED
        })
      ],
      total: 1,
      page: 1,
      pageSize: 20
    })
  })

  it('GetReceivingExpectation / should dispatch the query and present discrepancy summaries without exposing inventory truth', async () => {
    const execute = jest.fn().mockResolvedValue({
      receivingExpectationId: 'expectation-1',
      tenantId: 'tenant-1',
      orgId: 'org-1',
      purchaseOrderId: 'po-1',
      purchaseOrderLineId: 'po-line-1',
      supplierId: 'supplier-1',
      expectedQuantity: '12',
      receivedQuantitySummary: '9',
      openQuantity: '3',
      expectedReceiptDate: '2026-05-22',
      status: 'PARTIALLY_RECEIVED',
      createdAt: '2026-04-28T13:00:00.000Z',
      updatedAt: '2026-04-28T13:10:00.000Z',
      discrepancy: {
        receivingDiscrepancyId: 'discrepancy-1',
        discrepancyType: 'SHORT_RECEIPT',
        summary: '3 short',
        status: 'OPEN',
        resolutionCode: 'WAIT_REDELIVERY',
        resolutionNote: 'supplier promised redelivery',
        resolvedAt: null
      }
    })
    const controller = new ProcurementQueryGrpcController({ execute } as never)

    const response = await controller.getReceivingExpectation({
      ...buildQueryContext(),
      receivingExpectationId: 'expectation-1'
    })

    expect(execute).toHaveBeenCalledTimes(1)
    expect(response.receivingExpectation).toEqual(
      expect.objectContaining({
        receivingExpectationId: 'expectation-1',
        status: ProtoReceivingExpectationStatus.RECEIVING_EXPECTATION_STATUS_PARTIALLY_RECEIVED,
        discrepancy: expect.objectContaining({
          receivingDiscrepancyId: 'discrepancy-1',
          discrepancyType: ProtoReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_SHORT_RECEIPT,
          status: ProtoReceivingDiscrepancyStatus.RECEIVING_DISCREPANCY_STATUS_OPEN,
          resolutionCode: ProtoReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_WAIT_REDELIVERY
        })
      })
    )
  })

  it('controller surface / should not expose RFQ SupplierQuote AP or NonPO methods in phase 1', () => {
    const managementMethods = Object.getOwnPropertyNames(ProcurementManagementGrpcController.prototype)
    const queryMethods = Object.getOwnPropertyNames(ProcurementQueryGrpcController.prototype)

    const joined = `${managementMethods.join(' ')} ${queryMethods.join(' ')}`
    expect(joined).not.toContain('rfq')
    expect(joined).not.toContain('Quote')
    expect(joined).not.toContain('Invoice')
    expect(joined).not.toContain('Payment')
    expect(joined).not.toContain('NonPo')
  })
})
