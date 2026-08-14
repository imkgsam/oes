import { ForbiddenException } from '@nestjs/common'
import {
  PurchaseOrderLineAllocationType,
  ReceivingDiscrepancyType,
  ReceivingResolutionCode
} from '@oes/common/generated/procurement_service'
import { ProcurementService } from './procurement.service'

const SAMPLE_PURCHASE_REQUEST = {
  approvalSnapshot: {
    approvalReference: '',
    comment: '',
    decidedAt: '',
    decidedBy: {
      displayName: 'Buyer One',
      operatorId: 'buyer-1'
    },
    decision: 'APPROVED'
  },
  createdAt: '2026-04-28T08:00:00.000Z',
  lines: [
    {
      conversionStatus: 'NOT_CONVERTED',
      demandReferenceId: '',
      demandReferenceType: '',
      description: 'Starter Item',
      itemCode: 'ITEM-001',
      itemId: 'item-1',
      itemName: 'Starter Item',
      linkedPurchaseOrderLines: [],
      lineNo: 1,
      lineType: 'STANDARD_ITEM',
      neededByDate: '2026-05-01',
      purchaseRequestLineId: 'pr-line-1',
      requestedQuantity: '10',
      uom: 'PCS'
    }
  ],
  linkedPurchaseOrders: [],
  purchaseRequestId: 'pr-1',
  reason: 'Need starter inventory',
  requestNo: 'PR-001',
  requestType: 'DEPARTMENTAL',
  requester: {
    displayName: 'Requester One',
    operatorId: 'requester-1'
  },
  status: 'DRAFT',
  tenantId: 'tenant-1',
  title: 'Starter PR',
  updatedAt: '2026-04-28T08:00:00.000Z'
}

const SAMPLE_PURCHASE_ORDER = {
  createdAt: '2026-04-28T08:30:00.000Z',
  currencyCode: 'USD',
  issuedAt: '',
  lines: [
    {
      allocations: [
        {
          allocationType: 'GENERAL_STOCK',
          quantity: '10',
          reason: 'Starter stock',
          referenceId: '',
          targetReceivingAddressId: '',
          targetWarehouseId: ''
        }
      ],
      description: 'Starter Item',
      generalStockExcessReason: '',
      itemCode: 'ITEM-001',
      itemId: 'item-1',
      itemName: 'Starter Item',
      lineNo: 1,
      lineType: 'STANDARD_ITEM',
      orderedQuantity: '10',
      orderedUnitPrice: '12.50',
      purchaseOrderLineId: 'po-line-1',
      sourcePurchaseRequestLineId: 'pr-line-1',
      supplierOfferingId: 'offering-1',
      uom: 'PCS'
    }
  ],
  orderNo: 'PO-001',
  paymentSummary: undefined,
  purchaseOrderId: 'po-1',
  sourcePurchaseRequestIds: ['pr-1'],
  status: 'DRAFT',
  supplierAcknowledgement: {
    acknowledgementStatus: 'PENDING',
    acknowledgedAt: '',
    comment: '',
    externalReference: ''
  },
  supplierId: 'supplier-1',
  supplierSnapshot: {
    supplierDisplayName: 'Supplier One',
    supplierId: 'supplier-1',
    supplierStatusAtIssue: 'ACTIVE'
  },
  tenantId: 'tenant-1',
  updatedAt: '2026-04-28T08:30:00.000Z'
}

const SAMPLE_RECEIVING_EXPECTATION = {
  createdAt: '2026-04-28T09:00:00.000Z',
  discrepancy: {
    receivingDiscrepancyId: 'rd-1',
    discrepancyType: 'SHORT_RECEIVED',
    resolutionCode: '',
    resolutionNote: '',
    resolutionReferences: [],
    resolvedAt: '',
    status: 'OPEN',
    summary: 'received 8 of 10'
  },
  expectedQuantity: '10',
  expectedReceiptDate: '2026-05-02',
  openQuantity: '2',
  purchaseOrderId: 'po-1',
  purchaseOrderLineId: 'po-line-1',
  receivedQuantitySummary: '8',
  receivingExpectationId: 're-1',
  sourceAllocationIds: [],
  status: 'PARTIALLY_RECEIVED',
  supplierId: 'supplier-1',
  updatedAt: '2026-04-28T09:30:00.000Z'
}

// Verifies the procurement gateway service enforces tenant scope and maps the frozen phase 1 procurement contract into the BFF shape.
describe('ProcurementService', () => {
  const procurementQueryAdapter = {
    getPurchaseOrder: jest.fn(),
    getPurchaseRequest: jest.fn(),
    getReceivingExpectation: jest.fn(),
    listPurchaseOrderChanges: jest.fn(),
    searchPurchaseOrders: jest.fn(),
    searchPurchaseRequests: jest.fn(),
    searchReceivingExpectations: jest.fn()
  }
  const procurementManagementAdapter = {
    applyPurchaseOrderChange: jest.fn(),
    cancelPurchaseOrder: jest.fn(),
    cancelPurchaseRequest: jest.fn(),
    confirmSupplierAcknowledgement: jest.fn(),
    convertPurchaseRequestToPurchaseOrder: jest.fn(),
    createPurchaseOrderDraft: jest.fn(),
    createPurchaseRequest: jest.fn(),
    createReceivingExpectation: jest.fn(),
    decidePurchaseRequest: jest.fn(),
    issuePurchaseOrder: jest.fn(),
    recordReceivingDiscrepancyResolution: jest.fn(),
    submitPurchaseRequest: jest.fn(),
    updatePurchaseOrderDraft: jest.fn(),
    updatePurchaseRequestDraft: jest.fn()
  }

  const service = new ProcurementService(
    procurementQueryAdapter as any,
    procurementManagementAdapter as any
  )

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('rejects tenant-scoped operators when they request another tenant procurement workspace', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1' }
    }

    await expect(
      service.searchPurchaseRequests('tenant-2', { page: 1, pageSize: 20 }, source as any)
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(procurementQueryAdapter.searchPurchaseRequests).not.toHaveBeenCalled()
  })

  it('maps procurement phase 1 query and command flows without widening service ownership boundaries', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', orgId: 'org-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    procurementQueryAdapter.searchPurchaseRequests.mockResolvedValue({
      page: 2,
      pageSize: 10,
      purchaseRequests: [
        {
          createdAt: SAMPLE_PURCHASE_REQUEST.createdAt,
          decidedAt: '',
          lineCount: 1,
          linkedPurchaseOrders: [],
          nextExpectedReceiptDate: '',
          purchaseRequestId: 'pr-1',
          receivingStatusSummary: '',
          requestNo: 'PR-001',
          requestType: 'DEPARTMENTAL',
          requesterDisplayName: 'Requester One',
          status: 'DRAFT',
          submittedAt: ''
        }
      ],
      total: 1
    })
    procurementQueryAdapter.getPurchaseRequest.mockResolvedValue({
      purchaseRequest: SAMPLE_PURCHASE_REQUEST
    })
    procurementManagementAdapter.createPurchaseRequest.mockResolvedValue({
      purchaseRequest: SAMPLE_PURCHASE_REQUEST
    })
    procurementManagementAdapter.updatePurchaseRequestDraft.mockResolvedValue({
      purchaseRequest: {
        ...SAMPLE_PURCHASE_REQUEST,
        title: 'Starter PR Rev'
      }
    })
    procurementManagementAdapter.submitPurchaseRequest.mockResolvedValue({
      purchaseRequest: {
        ...SAMPLE_PURCHASE_REQUEST,
        status: 'SUBMITTED',
        submittedAt: '2026-04-28T09:00:00.000Z'
      }
    })
    procurementManagementAdapter.decidePurchaseRequest.mockResolvedValue({
      purchaseRequest: {
        ...SAMPLE_PURCHASE_REQUEST,
        status: 'APPROVED'
      }
    })
    procurementManagementAdapter.cancelPurchaseRequest.mockResolvedValue({
      purchaseRequest: {
        ...SAMPLE_PURCHASE_REQUEST,
        status: 'CANCELLED'
      }
    })
    procurementManagementAdapter.convertPurchaseRequestToPurchaseOrder.mockResolvedValue({
      purchaseOrder: SAMPLE_PURCHASE_ORDER
    })
    procurementQueryAdapter.searchPurchaseOrders.mockResolvedValue({
      page: 1,
      pageSize: 20,
      purchaseOrders: [
        {
          createdAt: SAMPLE_PURCHASE_ORDER.createdAt,
          currencyCode: 'USD',
          issuedAt: '',
          lineCount: 1,
          orderNo: 'PO-001',
          purchaseOrderId: 'po-1',
          status: 'DRAFT',
          supplierDisplayName: 'Supplier One',
          supplierId: 'supplier-1'
        }
      ],
      total: 1
    })
    procurementQueryAdapter.getPurchaseOrder.mockResolvedValue({
      purchaseOrder: SAMPLE_PURCHASE_ORDER
    })
    procurementManagementAdapter.createPurchaseOrderDraft.mockResolvedValue({
      purchaseOrder: SAMPLE_PURCHASE_ORDER
    })
    procurementManagementAdapter.updatePurchaseOrderDraft.mockResolvedValue({
      purchaseOrder: {
        ...SAMPLE_PURCHASE_ORDER,
        orderNo: 'PO-001-REV'
      }
    })
    procurementManagementAdapter.issuePurchaseOrder.mockResolvedValue({
      purchaseOrder: {
        ...SAMPLE_PURCHASE_ORDER,
        issuedAt: '2026-04-28T10:00:00.000Z',
        status: 'ISSUED'
      }
    })
    procurementManagementAdapter.confirmSupplierAcknowledgement.mockResolvedValue({
      purchaseOrder: {
        ...SAMPLE_PURCHASE_ORDER,
        status: 'ACKNOWLEDGED'
      }
    })
    procurementManagementAdapter.applyPurchaseOrderChange.mockResolvedValue({
      change: {
        appliedAt: '2026-04-28T10:30:00.000Z',
        appliedBy: {
          displayName: 'Buyer One',
          operatorId: 'buyer-1'
        },
        changeReason: 'qty increase',
        changeSummary: 'line 1 qty 10 -> 12',
        changeType: 'QUANTITY_UPDATE',
        purchaseOrderChangeId: 'change-1',
        purchaseOrderId: 'po-1',
        status: 'APPLIED'
      },
      purchaseOrder: SAMPLE_PURCHASE_ORDER
    })
    procurementManagementAdapter.cancelPurchaseOrder.mockResolvedValue({
      purchaseOrder: {
        ...SAMPLE_PURCHASE_ORDER,
        status: 'CANCELLED'
      }
    })
    procurementQueryAdapter.listPurchaseOrderChanges.mockResolvedValue({
      changes: [
        {
          appliedAt: '2026-04-28T10:30:00.000Z',
          appliedBy: {
            displayName: 'Buyer One',
            operatorId: 'buyer-1'
          },
          changeReason: 'qty increase',
          changeSummary: 'line 1 qty 10 -> 12',
          changeType: 'QUANTITY_UPDATE',
          purchaseOrderChangeId: 'change-1',
          purchaseOrderId: 'po-1',
          status: 'APPLIED'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    procurementQueryAdapter.searchReceivingExpectations.mockResolvedValue({
      page: 1,
      pageSize: 20,
      receivingExpectations: [
        {
          expectedReceiptDate: '2026-05-02',
          hasOpenDiscrepancy: true,
          openQuantity: '2',
          purchaseOrderId: 'po-1',
          purchaseOrderLineId: 'po-line-1',
          receivingExpectationId: 're-1',
          status: 'PARTIALLY_RECEIVED',
          supplierId: 'supplier-1',
          targetReceivingAddressId: '',
          targetWarehouseId: ''
        }
      ],
      total: 1
    })
    procurementQueryAdapter.getReceivingExpectation.mockResolvedValue({
      receivingExpectation: SAMPLE_RECEIVING_EXPECTATION
    })
    procurementManagementAdapter.createReceivingExpectation.mockResolvedValue({
      receivingExpectation: SAMPLE_RECEIVING_EXPECTATION
    })
    procurementManagementAdapter.recordReceivingDiscrepancyResolution.mockResolvedValue({
      receivingDiscrepancy: {
        ...SAMPLE_RECEIVING_EXPECTATION.discrepancy,
        resolutionCode: 'WAIT_REDELIVERY',
        resolutionNote: 'supplier promised resend'
      },
      receivingExpectation: SAMPLE_RECEIVING_EXPECTATION
    })

    await expect(
      service.searchPurchaseRequests(
        'tenant-1',
        {
          keyword: 'starter',
          page: 2,
          pageSize: 10,
          requestType: 'DEPARTMENTAL',
          status: 'DRAFT'
        },
        source as any
      )
    ).resolves.toEqual({
      page: 2,
      pageSize: 10,
      purchaseRequests: [
        {
          createdAt: SAMPLE_PURCHASE_REQUEST.createdAt,
          decidedAt: '',
          lineCount: 1,
          linkedPurchaseOrders: [],
          nextExpectedReceiptDate: '',
          purchaseRequestId: 'pr-1',
          receivingStatusSummary: '',
          requestNo: 'PR-001',
          requestType: 'DEPARTMENTAL',
          requesterDisplayName: 'Requester One',
          status: 'DRAFT',
          submittedAt: ''
        }
      ],
      total: 1
    })
    await expect(service.getPurchaseRequest('tenant-1', 'pr-1', source as any)).resolves.toEqual(
      SAMPLE_PURCHASE_REQUEST
    )
    await expect(
      service.createPurchaseRequest(
        'tenant-1',
        {
          lines: [],
          requestType: 'DEPARTMENTAL',
          title: 'Starter PR'
        },
        source as any
      )
    ).resolves.toEqual(SAMPLE_PURCHASE_REQUEST)
    await expect(service.searchPurchaseOrders('tenant-1', {}, source as any)).resolves.toEqual({
      page: 1,
      pageSize: 20,
      purchaseOrders: [
        {
          createdAt: SAMPLE_PURCHASE_ORDER.createdAt,
          currencyCode: 'USD',
          issuedAt: '',
          lineCount: 1,
          orderNo: 'PO-001',
          purchaseOrderId: 'po-1',
          status: 'DRAFT',
          supplierDisplayName: 'Supplier One',
          supplierId: 'supplier-1'
        }
      ],
      total: 1
    })
    await expect(service.getPurchaseOrder('tenant-1', 'po-1', source as any)).resolves.toEqual(
      SAMPLE_PURCHASE_ORDER
    )
    await expect(
      service.listPurchaseOrderChanges('tenant-1', 'po-1', { page: 1, pageSize: 20 }, source as any)
    ).resolves.toEqual({
      changes: [
        {
          appliedAt: '2026-04-28T10:30:00.000Z',
          appliedBy: {
            displayName: 'Buyer One',
            operatorId: 'buyer-1'
          },
          changeReason: 'qty increase',
          changeSummary: 'line 1 qty 10 -> 12',
          changeType: 'QUANTITY_UPDATE',
          purchaseOrderChangeId: 'change-1',
          purchaseOrderId: 'po-1',
          status: 'APPLIED'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    await expect(
      service.searchReceivingExpectations('tenant-1', { page: 1, pageSize: 20 }, source as any)
    ).resolves.toEqual({
      page: 1,
      pageSize: 20,
      receivingExpectations: [
        {
          expectedReceiptDate: '2026-05-02',
          hasOpenDiscrepancy: true,
          openQuantity: '2',
          purchaseOrderId: 'po-1',
          purchaseOrderLineId: 'po-line-1',
          receivingExpectationId: 're-1',
          status: 'PARTIALLY_RECEIVED',
          supplierId: 'supplier-1',
          targetReceivingAddressId: '',
          targetWarehouseId: ''
        }
      ],
      total: 1
    })
    await expect(
      service.getReceivingExpectation('tenant-1', 're-1', source as any)
    ).resolves.toEqual(SAMPLE_RECEIVING_EXPECTATION)
    await expect(
      service.recordReceivingDiscrepancyResolution(
        'tenant-1',
        're-1',
        'rd-1',
        {
          auditReason: 'resolve discrepancy',
          resolutionCode: 'WAIT_REDELIVERY',
          resolutionNote: 'supplier promised resend'
        },
        source as any
      )
    ).resolves.toMatchObject({
      receivingDiscrepancy: {
        resolutionCode: 'WAIT_REDELIVERY',
        resolutionNote: 'supplier promised resend'
      }
    })
  })

  it('maps the single-PR conversion route into generated sourceLines without widening the BFF surface', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    procurementManagementAdapter.convertPurchaseRequestToPurchaseOrder.mockResolvedValue({
      purchaseOrder: SAMPLE_PURCHASE_ORDER
    })

    await service.convertPurchaseRequestToPurchaseOrder(
      'tenant-1',
      'pr-1',
      {
        auditReason: 'convert to draft po',
        currencyCode: 'USD',
        selectedLines: [
          {
            generalStockExcessReason: 'safety stock top-up',
            orderedUnitPrice: '12.50',
            purchaseOrderQuantity: '10',
            purchaseRequestLineId: 'pr-line-1'
          }
        ],
        supplierId: 'supplier-1'
      },
      source as any
    )

    const [input, forwardedSource] =
      procurementManagementAdapter.convertPurchaseRequestToPurchaseOrder.mock.calls[0]

    expect(forwardedSource).toBe(source)
    expect(input).toMatchObject({
      auditReason: 'convert to draft po',
      currencyCode: 'USD',
      sourceLines: [
        {
          generalStockExcessReason: 'safety stock top-up',
          orderedUnitPrice: '12.50',
          purchaseOrderQuantity: '10',
          purchaseRequestId: 'pr-1',
          purchaseRequestLineId: 'pr-line-1'
        }
      ],
      supplierId: 'supplier-1'
    })
    expect(input).not.toHaveProperty('tenantId')
    expect(input).not.toHaveProperty('purchaseRequestId')
    expect(input).not.toHaveProperty('selectedLines')
  })

  it('maps generated allocation and receiving enums back into the gateway response shape', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    procurementQueryAdapter.getPurchaseOrder.mockResolvedValue({
      purchaseOrder: {
        ...SAMPLE_PURCHASE_ORDER,
        lines: [
          {
            ...SAMPLE_PURCHASE_ORDER.lines[0],
            allocations: [
              {
                allocationSourceType:
                  PurchaseOrderLineAllocationType.PURCHASE_ORDER_LINE_ALLOCATION_TYPE_PURCHASE_REQUEST_LINE,
                quantity: '10',
                reason: 'PR allocation',
                sourceReferenceId: 'pr-line-1'
              }
            ]
          }
        ]
      }
    })
    procurementQueryAdapter.getReceivingExpectation.mockResolvedValue({
      receivingExpectation: {
        ...SAMPLE_RECEIVING_EXPECTATION,
        discrepancy: {
          ...SAMPLE_RECEIVING_EXPECTATION.discrepancy,
          discrepancyType: ReceivingDiscrepancyType.RECEIVING_DISCREPANCY_TYPE_WRONG_ITEM,
          resolutionCode:
            ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_CONTROLLED_CHANGE
        }
      }
    })

    await expect(
      service.getPurchaseOrder('tenant-1', 'po-1', source as any)
    ).resolves.toMatchObject({
      lines: [
        {
          allocations: [
            {
              allocationType: 'PURCHASE_REQUEST_LINE',
              quantity: '10',
              reason: 'PR allocation',
              referenceId: 'pr-line-1'
            }
          ]
        }
      ]
    })

    await expect(
      service.getReceivingExpectation('tenant-1', 're-1', source as any)
    ).resolves.toMatchObject({
      discrepancy: {
        discrepancyType: 'WRONG_ITEM',
        resolutionCode: 'ACCEPT_WITH_CONTROLLED_CHANGE'
      }
    })
  })

  it('maps new receiving resolution codes into the generated management enum', async () => {
    const source = {
      requestId: 'req-1',
      traceId: 'trace-1',
      user: { aid: 'account-1', scopeLevel: 'TENANT', tid: 'tenant-1', typ: 'USER' }
    }

    procurementManagementAdapter.recordReceivingDiscrepancyResolution.mockResolvedValue({
      receivingDiscrepancy: SAMPLE_RECEIVING_EXPECTATION.discrepancy,
      receivingExpectation: SAMPLE_RECEIVING_EXPECTATION
    })

    await service.recordReceivingDiscrepancyResolution(
      'tenant-1',
      're-1',
      'rd-1',
      {
        auditReason: 'resolve discrepancy',
        resolutionCode: 'ACCEPT_WITH_PO_CHANGE',
        resolutionNote: 'accepted with tracked PO change'
      },
      source as any
    )

    const [input] = procurementManagementAdapter.recordReceivingDiscrepancyResolution.mock.calls[0]

    expect(input).toMatchObject({
      auditReason: 'resolve discrepancy',
      receivingDiscrepancyId: 'rd-1',
      receivingExpectationId: 're-1',
      resolutionCode: ReceivingResolutionCode.RECEIVING_RESOLUTION_CODE_ACCEPT_WITH_PO_CHANGE,
      resolutionNote: 'accepted with tracked PO change'
    })
    expect(input).not.toHaveProperty('tenantId')
  })
})
