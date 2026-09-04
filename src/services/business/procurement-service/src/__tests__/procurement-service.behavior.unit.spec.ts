import { status } from '@grpc/grpc-js'
import { CreatePurchaseRequestCommand } from '../application/commands/create-purchase-request.command'
import { CreatePurchaseRequestHandler } from '../application/commands/create-purchase-request.handler'
import { UpdatePurchaseRequestDraftCommand } from '../application/commands/update-purchase-request-draft.command'
import { UpdatePurchaseRequestDraftHandler } from '../application/commands/update-purchase-request-draft.handler'
import { SubmitPurchaseRequestCommand } from '../application/commands/submit-purchase-request.command'
import { SubmitPurchaseRequestHandler } from '../application/commands/submit-purchase-request.handler'
import { DecidePurchaseRequestCommand } from '../application/commands/decide-purchase-request.command'
import { DecidePurchaseRequestHandler } from '../application/commands/decide-purchase-request.handler'
import { CancelPurchaseRequestCommand } from '../application/commands/cancel-purchase-request.command'
import { CancelPurchaseRequestHandler } from '../application/commands/cancel-purchase-request.handler'
import { ConvertPurchaseRequestToPurchaseOrderCommand } from '../application/commands/convert-purchase-request-to-purchase-order.command'
import { ConvertPurchaseRequestToPurchaseOrderHandler } from '../application/commands/convert-purchase-request-to-purchase-order.handler'
import { CreatePurchaseOrderDraftCommand } from '../application/commands/create-purchase-order-draft.command'
import { CreatePurchaseOrderDraftHandler } from '../application/commands/create-purchase-order-draft.handler'
import { UpdatePurchaseOrderDraftCommand } from '../application/commands/update-purchase-order-draft.command'
import { UpdatePurchaseOrderDraftHandler } from '../application/commands/update-purchase-order-draft.handler'
import { IssuePurchaseOrderCommand } from '../application/commands/issue-purchase-order.command'
import { IssuePurchaseOrderHandler } from '../application/commands/issue-purchase-order.handler'
import { ConfirmSupplierAcknowledgementCommand } from '../application/commands/confirm-supplier-acknowledgement.command'
import { ConfirmSupplierAcknowledgementHandler } from '../application/commands/confirm-supplier-acknowledgement.handler'
import { ApplyPurchaseOrderChangeCommand } from '../application/commands/apply-purchase-order-change.command'
import { ApplyPurchaseOrderChangeHandler } from '../application/commands/apply-purchase-order-change.handler'
import { CancelPurchaseOrderCommand } from '../application/commands/cancel-purchase-order.command'
import { CancelPurchaseOrderHandler } from '../application/commands/cancel-purchase-order.handler'
import { CreateReceivingExpectationCommand } from '../application/commands/create-receiving-expectation.command'
import { CreateReceivingExpectationHandler } from '../application/commands/create-receiving-expectation.handler'
import { RecordReceivingDiscrepancyResolutionCommand } from '../application/commands/record-receiving-discrepancy-resolution.command'
import { RecordReceivingDiscrepancyResolutionHandler } from '../application/commands/record-receiving-discrepancy-resolution.handler'
import { ItemReferenceLookupPort, ItemReferenceLookupResult } from '../application/ports/item-reference-lookup.port'
import {
  SupplierOfferingReferenceLookupResult,
  SupplierReferenceLookupPort,
  SupplierReferenceLookupResult
} from '../application/ports/supplier-reference-lookup.port'
import { GetPurchaseRequestHandler } from '../application/queries/get-purchase-request.handler'
import { GetPurchaseRequestQuery } from '../application/queries/get-purchase-request.query'
import { SearchPurchaseRequestsHandler } from '../application/queries/search-purchase-requests.handler'
import { SearchPurchaseRequestsQuery } from '../application/queries/search-purchase-requests.query'
import { GetPurchaseOrderHandler } from '../application/queries/get-purchase-order.handler'
import { GetPurchaseOrderQuery } from '../application/queries/get-purchase-order.query'
import { SearchPurchaseOrdersHandler } from '../application/queries/search-purchase-orders.handler'
import { SearchPurchaseOrdersQuery } from '../application/queries/search-purchase-orders.query'
import { ListPurchaseOrderChangesHandler } from '../application/queries/list-purchase-order-changes.handler'
import { ListPurchaseOrderChangesQuery } from '../application/queries/list-purchase-order-changes.query'
import { GetReceivingExpectationHandler } from '../application/queries/get-receiving-expectation.handler'
import { GetReceivingExpectationQuery } from '../application/queries/get-receiving-expectation.query'
import { SearchReceivingExpectationsHandler } from '../application/queries/search-receiving-expectations.handler'
import { SearchReceivingExpectationsQuery } from '../application/queries/search-receiving-expectations.query'
import {
  PurchaseOrderLineAllocationType,
  PurchaseOrderStatus,
  PurchaseRequestDecision,
  PurchaseRequestLineType,
  PurchaseRequestStatus,
  PurchaseRequestType,
  ReceivingDiscrepancyStatus,
  ReceivingDiscrepancyType,
  ReceivingExpectationStatus,
  ReceivingResolutionCode
} from '../domain/models/procurement-records'
import { InMemoryPurchaseOrderRepository } from '../infrastructure/repositories/in-memory/in-memory-purchase-order.repository'
import { InMemoryPurchaseRequestRepository } from '../infrastructure/repositories/in-memory/in-memory-purchase-request.repository'
import { InMemoryReceivingRepository } from '../infrastructure/repositories/in-memory/in-memory-receiving.repository'
import { ProcurementInMemoryStore } from '../infrastructure/store/procurement-in-memory-store'

/** StubItemReferenceLookupPort lets Unit drive standard-item validation outcomes without reaching item-master-service. */
class StubItemReferenceLookupPort implements ItemReferenceLookupPort {
  private readonly items = new Map<string, ItemReferenceLookupResult>()

  seed(item: ItemReferenceLookupResult): void {
    this.items.set(item.itemId, item)
  }

  async getItemById(_tenantId: string, itemId: string): Promise<ItemReferenceLookupResult | null> {
    return this.items.get(itemId) ?? null
  }
}

/** StubSupplierReferenceLookupPort lets Unit drive supplier and offering truth without reaching srm-service. */
class StubSupplierReferenceLookupPort implements SupplierReferenceLookupPort {
  private readonly suppliers = new Map<string, SupplierReferenceLookupResult>()
  private readonly offerings = new Map<string, SupplierOfferingReferenceLookupResult>()

  seedSupplier(supplier: SupplierReferenceLookupResult): void {
    this.suppliers.set(supplier.supplierId, supplier)
  }

  seedOffering(offering: SupplierOfferingReferenceLookupResult): void {
    this.offerings.set(`${offering.supplierId}:${offering.itemId}`, offering)
  }

  async getSupplierById(_tenantId: string, supplierId: string): Promise<SupplierReferenceLookupResult | null> {
    return this.suppliers.get(supplierId) ?? null
  }

  async getActiveSupplierOffering(
    _tenantId: string,
    supplierId: string,
    itemId: string
  ): Promise<SupplierOfferingReferenceLookupResult | null> {
    return this.offerings.get(`${supplierId}:${itemId}`) ?? null
  }
}

function createHarness() {
  const store = new ProcurementInMemoryStore()
  const purchaseRequestRepository = new InMemoryPurchaseRequestRepository(store)
  const purchaseOrderRepository = new InMemoryPurchaseOrderRepository(store)
  const receivingRepository = new InMemoryReceivingRepository(store)
  const itemLookup = new StubItemReferenceLookupPort()
  const supplierLookup = new StubSupplierReferenceLookupPort()

  return {
    purchaseRequestRepository,
    purchaseOrderRepository,
    receivingRepository,
    itemLookup,
    supplierLookup,
    createPurchaseRequest: new CreatePurchaseRequestHandler(purchaseRequestRepository, itemLookup),
    updatePurchaseRequestDraft: new UpdatePurchaseRequestDraftHandler(purchaseRequestRepository, itemLookup),
    submitPurchaseRequest: new SubmitPurchaseRequestHandler(purchaseRequestRepository),
    decidePurchaseRequest: new DecidePurchaseRequestHandler(purchaseRequestRepository),
    cancelPurchaseRequest: new CancelPurchaseRequestHandler(purchaseRequestRepository, purchaseOrderRepository),
    convertPurchaseRequestToPurchaseOrder: new ConvertPurchaseRequestToPurchaseOrderHandler(
      purchaseRequestRepository,
      purchaseOrderRepository,
      itemLookup,
      supplierLookup
    ),
    createPurchaseOrderDraft: new CreatePurchaseOrderDraftHandler(purchaseOrderRepository, purchaseRequestRepository),
    updatePurchaseOrderDraft: new UpdatePurchaseOrderDraftHandler(purchaseOrderRepository, purchaseRequestRepository),
    issuePurchaseOrder: new IssuePurchaseOrderHandler(purchaseOrderRepository, purchaseRequestRepository, itemLookup, supplierLookup),
    confirmSupplierAcknowledgement: new ConfirmSupplierAcknowledgementHandler(purchaseOrderRepository),
    applyPurchaseOrderChange: new ApplyPurchaseOrderChangeHandler(
      purchaseOrderRepository,
      purchaseRequestRepository,
      itemLookup,
      supplierLookup
    ),
    cancelPurchaseOrder: new CancelPurchaseOrderHandler(purchaseOrderRepository, receivingRepository),
    createReceivingExpectation: new CreateReceivingExpectationHandler(purchaseOrderRepository, receivingRepository),
    recordReceivingDiscrepancyResolution: new RecordReceivingDiscrepancyResolutionHandler(receivingRepository),
    getPurchaseRequest: new GetPurchaseRequestHandler(
      purchaseRequestRepository,
      purchaseOrderRepository,
      receivingRepository
    ),
    searchPurchaseRequests: new SearchPurchaseRequestsHandler(
      purchaseRequestRepository,
      purchaseOrderRepository,
      receivingRepository
    ),
    getPurchaseOrder: new GetPurchaseOrderHandler(purchaseOrderRepository),
    searchPurchaseOrders: new SearchPurchaseOrdersHandler(purchaseOrderRepository, purchaseRequestRepository),
    listPurchaseOrderChanges: new ListPurchaseOrderChangesHandler(purchaseOrderRepository),
    getReceivingExpectation: new GetReceivingExpectationHandler(receivingRepository),
    searchReceivingExpectations: new SearchReceivingExpectationsHandler(receivingRepository)
  }
}

function buildStandardItemLine(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    lineType: PurchaseRequestLineType.STANDARD_ITEM,
    itemId: 'item-1',
    description: 'Standard resin',
    requestedQuantity: '10',
    uom: 'KG',
    neededByDate: '2026-05-20',
    demandReferenceType: 'FULFILLMENT_DEMAND',
    demandReferenceId: 'fd-1',
    ...overrides
  }
}

function buildTextLine(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    lineType: PurchaseRequestLineType.TEXT,
    description: 'Packaging tape custom width',
    requestedQuantity: '5',
    uom: 'ROLL',
    neededByDate: '2026-05-22',
    ...overrides
  }
}

describe('procurement-service behavior Unit', () => {
  it('PurchaseRequest draft lifecycle / should create update submit and approve a mixed-item demand request', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      active: true,
      purchasable: true
    })

    const created = await harness.createPurchaseRequest.execute(
      new CreatePurchaseRequestCommand({
        tenantId: 'tenant-1',
        orgId: 'org-1',
        requester: {
          operatorId: 'requester-1',
          displayName: 'Buyer One'
        },
        requestType: PurchaseRequestType.PRODUCTION_PACKAGING,
        title: 'Packaging refill',
        reason: 'Phase 1 demand',
        lines: [buildStandardItemLine(), buildTextLine()]
      })
    )

    const updated = await harness.updatePurchaseRequestDraft.execute(
      new UpdatePurchaseRequestDraftCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: created.purchaseRequestId,
        title: 'Packaging refill revised',
        reason: 'Phase 1 demand revised',
        lines: [buildStandardItemLine({ requestedQuantity: '12' }), buildTextLine({ requestedQuantity: '8' })]
      })
    )

    const submitted = await harness.submitPurchaseRequest.execute(
      new SubmitPurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: created.purchaseRequestId,
        submissionComment: 'ready for decision'
      })
    )
    const decided = await harness.decidePurchaseRequest.execute(
      new DecidePurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: created.purchaseRequestId,
        decision: PurchaseRequestDecision.APPROVED,
        comment: 'approved for buying',
        approvalReference: 'approval-1',
        decidedBy: {
          operatorId: 'approver-1',
          displayName: 'Approver One'
        }
      })
    )

    const found = await harness.getPurchaseRequest.execute(
      new GetPurchaseRequestQuery('tenant-1', created.purchaseRequestId)
    )
    const search = await harness.searchPurchaseRequests.execute(
      new SearchPurchaseRequestsQuery({
        tenantId: 'tenant-1',
        keyword: 'Packaging',
        status: PurchaseRequestStatus.APPROVED,
        page: 1,
        pageSize: 20
      })
    )

    expect(created.status).toBe(PurchaseRequestStatus.DRAFT)
    expect(updated.lines).toHaveLength(2)
    expect(submitted.status).toBe(PurchaseRequestStatus.SUBMITTED)
    expect(decided.status).toBe(PurchaseRequestStatus.APPROVED)
    expect(decided.approvalSnapshot?.decision).toBe(PurchaseRequestDecision.APPROVED)
    expect(found).toMatchObject({
      purchaseRequestId: decided.purchaseRequestId,
      status: decided.status
    })
    expect(search.total).toBe(1)
    expect(search.purchaseRequests[0].purchaseRequestId).toBe(created.purchaseRequestId)
  })

  it('PurchaseRequest decision and cancellation / should support rejected and uncoupled approved requests without creating procurement commitments', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      active: true,
      purchasable: true
    })

    const rejected = await harness.createPurchaseRequest.execute(
      new CreatePurchaseRequestCommand({
        tenantId: 'tenant-1',
        requester: {
          operatorId: 'requester-1',
          displayName: 'Buyer One'
        },
        requestType: PurchaseRequestType.DEPARTMENTAL,
        title: 'Rejected request',
        lines: [buildTextLine()]
      })
    )
    await harness.submitPurchaseRequest.execute(
      new SubmitPurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: rejected.purchaseRequestId
      })
    )
    const rejectedDecision = await harness.decidePurchaseRequest.execute(
      new DecidePurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: rejected.purchaseRequestId,
        decision: PurchaseRequestDecision.REJECTED,
        comment: 'budget rejected',
        decidedBy: {
          operatorId: 'approver-1',
          displayName: 'Approver One'
        }
      })
    )

    const cancellable = await harness.createPurchaseRequest.execute(
      new CreatePurchaseRequestCommand({
        tenantId: 'tenant-1',
        requester: {
          operatorId: 'requester-1',
          displayName: 'Buyer One'
        },
        requestType: PurchaseRequestType.MAINTENANCE,
        title: 'Cancel me',
        lines: [buildStandardItemLine()]
      })
    )
    await harness.submitPurchaseRequest.execute(
      new SubmitPurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: cancellable.purchaseRequestId
      })
    )
    await harness.decidePurchaseRequest.execute(
      new DecidePurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: cancellable.purchaseRequestId,
        decision: PurchaseRequestDecision.APPROVED,
        comment: 'approved before cancellation',
        decidedBy: {
          operatorId: 'approver-2',
          displayName: 'Approver Two'
        }
      })
    )
    const cancelled = await harness.cancelPurchaseRequest.execute(
      new CancelPurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: cancellable.purchaseRequestId,
        cancelReason: 'demand disappeared'
      })
    )

    expect(rejectedDecision.status).toBe(PurchaseRequestStatus.REJECTED)
    expect(cancelled.status).toBe(PurchaseRequestStatus.CANCELLED)
  })

  it('PurchaseRequest standard item validation / should reject inactive items before creating draft demand', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-inactive',
      itemCode: 'RM-INACTIVE',
      itemName: 'Inactive Standard Resin',
      active: false,
      purchasable: true
    })

    await expect(
      harness.createPurchaseRequest.execute(
        new CreatePurchaseRequestCommand({
          tenantId: 'tenant-1',
          requester: {
            operatorId: 'requester-1',
            displayName: 'Buyer One'
          },
          requestType: PurchaseRequestType.PRODUCTION_PACKAGING,
          lines: [
            buildStandardItemLine({
              itemId: 'item-inactive',
              description: 'Inactive resin'
            })
          ]
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('ConvertPurchaseRequestToPurchaseOrder / should create a PO draft with mixed allocation and general-stock excess reason', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      active: true,
      purchasable: true
    })
    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })
    harness.supplierLookup.seedOffering({
      supplierOfferingId: 'offering-1',
      supplierId: 'supplier-1',
      itemId: 'item-1',
      status: 'ACTIVE'
    })

    const request = await harness.createPurchaseRequest.execute(
      new CreatePurchaseRequestCommand({
        tenantId: 'tenant-1',
        requester: {
          operatorId: 'requester-1',
          displayName: 'Buyer One'
        },
        requestType: PurchaseRequestType.SALES_DEDICATED,
        title: 'Sales dedicated resin',
        lines: [buildStandardItemLine({ requestedQuantity: '10' }), buildTextLine({ requestedQuantity: '4' })]
      })
    )
    await harness.submitPurchaseRequest.execute(
      new SubmitPurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: request.purchaseRequestId
      })
    )
    const approved = await harness.decidePurchaseRequest.execute(
      new DecidePurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: request.purchaseRequestId,
        decision: PurchaseRequestDecision.APPROVED,
        decidedBy: {
          operatorId: 'approver-1',
          displayName: 'Approver One'
        }
      })
    )

    const converted = await harness.convertPurchaseRequestToPurchaseOrder.execute(
      new ConvertPurchaseRequestToPurchaseOrderCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        sourceLines: [
          {
            purchaseRequestId: approved.purchaseRequestId,
            purchaseRequestLineId: approved.lines[0].purchaseRequestLineId,
            purchaseOrderQuantity: '13',
            orderedUnitPrice: '9.80',
            generalStockExcessReason: 'buffer for shelf stock'
          },
          {
            purchaseRequestId: approved.purchaseRequestId,
            purchaseRequestLineId: approved.lines[1].purchaseRequestLineId,
            purchaseOrderQuantity: '4',
            orderedUnitPrice: '2.50'
          }
        ]
      })
    )

    expect(converted.status).toBe(PurchaseOrderStatus.DRAFT)
    expect(converted.supplierSnapshot.supplierDisplayName).toBe('Acme Supplier')
    expect(converted.lines[0].supplierOfferingId).toBe('offering-1')
    expect(converted.lines[0].generalStockExcessReason).toBe('buffer for shelf stock')
    expect(converted.lines[0].allocations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          allocationType: PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE,
          quantity: '10',
          sourceReferenceId: approved.lines[0].purchaseRequestLineId
        }),
        expect.objectContaining({
          allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
          quantity: '3',
          reason: 'buffer for shelf stock'
        })
      ])
    )
    expect(converted.lines[1].allocations).toEqual([
      expect.objectContaining({
        allocationType: PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE,
        sourceReferenceId: approved.lines[1].purchaseRequestLineId,
        quantity: '4'
      })
    ])
  })

  it('ConvertPurchaseRequestToPurchaseOrder / should keep source PRs, update converted statuses, and support merging another approved PR into an existing draft PO', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      active: true,
      purchasable: true
    })
    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })
    harness.supplierLookup.seedOffering({
      supplierOfferingId: 'offering-1',
      supplierId: 'supplier-1',
      itemId: 'item-1',
      status: 'ACTIVE'
    })

    const firstRequest = await harness.createPurchaseRequest.execute(
      new CreatePurchaseRequestCommand({
        tenantId: 'tenant-1',
        requester: {
          operatorId: 'requester-1',
          displayName: 'Buyer One'
        },
        requestType: PurchaseRequestType.SALES_DEDICATED,
        title: 'First PR',
        lines: [buildStandardItemLine({ requestedQuantity: '10', neededByDate: '2026-06-01' })]
      })
    )
    await harness.submitPurchaseRequest.execute(
      new SubmitPurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: firstRequest.purchaseRequestId
      })
    )
    const approvedFirst = await harness.decidePurchaseRequest.execute(
      new DecidePurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: firstRequest.purchaseRequestId,
        decision: PurchaseRequestDecision.APPROVED,
        decidedBy: {
          operatorId: 'approver-1',
          displayName: 'Approver One'
        }
      })
    )

    const secondRequest = await harness.createPurchaseRequest.execute(
      new CreatePurchaseRequestCommand({
        tenantId: 'tenant-1',
        requester: {
          operatorId: 'requester-2',
          displayName: 'Buyer Two'
        },
        requestType: PurchaseRequestType.PRODUCTION_PACKAGING,
        title: 'Second PR',
        lines: [buildStandardItemLine({ requestedQuantity: '10', neededByDate: '2026-06-05', demandReferenceId: 'fd-2' })]
      })
    )
    await harness.submitPurchaseRequest.execute(
      new SubmitPurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: secondRequest.purchaseRequestId
      })
    )
    const approvedSecond = await harness.decidePurchaseRequest.execute(
      new DecidePurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: secondRequest.purchaseRequestId,
        decision: PurchaseRequestDecision.APPROVED,
        decidedBy: {
          operatorId: 'approver-2',
          displayName: 'Approver Two'
        }
      })
    )

    const createdDraft = await harness.convertPurchaseRequestToPurchaseOrder.execute(
      new ConvertPurchaseRequestToPurchaseOrderCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        sourceLines: [
          {
            purchaseRequestId: approvedFirst.purchaseRequestId,
            purchaseRequestLineId: approvedFirst.lines[0].purchaseRequestLineId,
            purchaseOrderQuantity: '10',
            orderedUnitPrice: '9.80'
          }
        ]
      })
    )

    const mergedDraft = await harness.convertPurchaseRequestToPurchaseOrder.execute(
      new ConvertPurchaseRequestToPurchaseOrderCommand({
        tenantId: 'tenant-1',
        targetPurchaseOrderId: createdDraft.purchaseOrderId,
        sourceLines: [
          {
            purchaseRequestId: approvedSecond.purchaseRequestId,
            purchaseRequestLineId: approvedSecond.lines[0].purchaseRequestLineId,
            purchaseOrderQuantity: '6',
            orderedUnitPrice: '9.60'
          }
        ]
      } as never)
    )

    const firstQuery = await harness.getPurchaseRequest.execute(
      new GetPurchaseRequestQuery('tenant-1', approvedFirst.purchaseRequestId)
    )
    const secondQuery = await harness.getPurchaseRequest.execute(
      new GetPurchaseRequestQuery('tenant-1', approvedSecond.purchaseRequestId)
    )
    const mergedSearch = await harness.searchPurchaseRequests.execute(
      new SearchPurchaseRequestsQuery({
        tenantId: 'tenant-1',
        purchaseOrderId: createdDraft.purchaseOrderId,
        page: 1,
        pageSize: 20
      } as never)
    )

    expect(mergedDraft.purchaseOrderId).toBe(createdDraft.purchaseOrderId)
    expect(mergedDraft.sourcePurchaseRequestIds).toEqual(
      expect.arrayContaining([approvedFirst.purchaseRequestId, approvedSecond.purchaseRequestId])
    )
    expect(firstQuery.purchaseRequestId).toBe(approvedFirst.purchaseRequestId)
    expect(firstQuery.status).toBe('CONVERTED')
    expect((firstQuery.lines[0] as any).conversionStatus).toBe('CONVERTED')
    expect((firstQuery as any).linkedPurchaseOrders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purchaseOrderId: createdDraft.purchaseOrderId,
          orderNo: createdDraft.orderNo
        })
      ])
    )
    expect(secondQuery.purchaseRequestId).toBe(approvedSecond.purchaseRequestId)
    expect(secondQuery.status).toBe('PARTIALLY_CONVERTED')
    expect((secondQuery.lines[0] as any).conversionStatus).toBe('PARTIALLY_CONVERTED')
    expect((secondQuery.lines[0] as any).linkedPurchaseOrderLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purchaseOrderId: createdDraft.purchaseOrderId,
          allocatedQuantity: '6'
        })
      ])
    )
    expect((secondQuery as any).nextExpectedReceiptDate).toBe('2026-06-05')
    expect(mergedSearch.purchaseRequests).toHaveLength(2)
  })

  it('ConvertPurchaseRequestToPurchaseOrder / when standard item has no ACTIVE SupplierOffering / should reject with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      active: true,
      purchasable: true
    })
    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })

    const request = await harness.createPurchaseRequest.execute(
      new CreatePurchaseRequestCommand({
        tenantId: 'tenant-1',
        requester: {
          operatorId: 'requester-1',
          displayName: 'Buyer One'
        },
        requestType: PurchaseRequestType.DEPARTMENTAL,
        title: 'No offering',
        lines: [buildStandardItemLine()]
      })
    )
    await harness.submitPurchaseRequest.execute(
      new SubmitPurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: request.purchaseRequestId
      })
    )
    await harness.decidePurchaseRequest.execute(
      new DecidePurchaseRequestCommand({
        tenantId: 'tenant-1',
        purchaseRequestId: request.purchaseRequestId,
        decision: PurchaseRequestDecision.APPROVED,
        decidedBy: {
          operatorId: 'approver-1',
          displayName: 'Approver One'
        }
      })
    )

    await expect(
      harness.convertPurchaseRequestToPurchaseOrder.execute(
        new ConvertPurchaseRequestToPurchaseOrderCommand({
          tenantId: 'tenant-1',
          supplierId: 'supplier-1',
          currencyCode: 'USD',
          sourceLines: [
            {
              purchaseRequestId: request.purchaseRequestId,
              purchaseRequestLineId: request.lines[0].purchaseRequestLineId,
              purchaseOrderQuantity: '10'
            }
          ]
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('UpdatePurchaseOrderDraft / when allocation sum mismatches ordered quantity / should reject with INVALID_ARGUMENT', async () => {
    const harness = createHarness()

    const draft = await harness.createPurchaseOrderDraft.execute(
      new CreatePurchaseOrderDraftCommand({
        tenantId: 'tenant-1',
        orgId: 'org-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        lines: []
      })
    )

    await expect(
      harness.updatePurchaseOrderDraft.execute(
        new UpdatePurchaseOrderDraftCommand({
          tenantId: 'tenant-1',
          purchaseOrderId: draft.purchaseOrderId,
          supplierId: 'supplier-1',
          currencyCode: 'USD',
          lines: [
            {
              lineType: PurchaseRequestLineType.TEXT,
              description: 'text demand',
              orderedQuantity: '10',
              uom: 'PCS',
              allocations: [
                {
                  allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                  quantity: '6'
                }
              ]
            }
          ]
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })

  it('UpdatePurchaseOrderDraft / when non-general allocation omits the source reference / should reject with INVALID_ARGUMENT', async () => {
    const harness = createHarness()

    const draft = await harness.createPurchaseOrderDraft.execute(
      new CreatePurchaseOrderDraftCommand({
        tenantId: 'tenant-1',
        orgId: 'org-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        lines: []
      })
    )

    await expect(
      harness.updatePurchaseOrderDraft.execute(
        new UpdatePurchaseOrderDraftCommand({
          tenantId: 'tenant-1',
          purchaseOrderId: draft.purchaseOrderId,
          supplierId: 'supplier-1',
          currencyCode: 'USD',
          lines: [
            {
              lineType: PurchaseRequestLineType.TEXT,
              description: 'dedicated text demand',
              orderedQuantity: '10',
              uom: 'PCS',
              allocations: [
                {
                  allocationType: 'PURCHASE_REQUEST_LINE',
                  quantity: '10'
                }
              ]
            }
          ]
        } as never)
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.INVALID_ARGUMENT
      }
    })
  })

  it('IssuePurchaseOrder / should validate ACTIVE supplier offering, keep supplier snapshot, then allow acknowledgement and applied change history', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      active: true,
      purchasable: true
    })
    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })
    harness.supplierLookup.seedOffering({
      supplierOfferingId: 'offering-1',
      supplierId: 'supplier-1',
      itemId: 'item-1',
      status: 'ACTIVE'
    })

    const draft = await harness.createPurchaseOrderDraft.execute(
      new CreatePurchaseOrderDraftCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        lines: [
          {
            lineType: PurchaseRequestLineType.STANDARD_ITEM,
            itemId: 'item-1',
            description: 'Standard Resin',
            orderedQuantity: '10',
            uom: 'KG',
            orderedUnitPrice: '9.80',
            allocations: [
              {
                allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                quantity: '10'
              }
            ]
          }
        ]
      })
    )

    const issued = await harness.issuePurchaseOrder.execute(
      new IssuePurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: draft.purchaseOrderId,
        issueComment: 'issue now'
      })
    )
    const acknowledged = await harness.confirmSupplierAcknowledgement.execute(
      new ConfirmSupplierAcknowledgementCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: draft.purchaseOrderId,
        externalReference: 'ACK-001',
        comment: 'supplier confirmed',
        acknowledgedAt: '2026-05-01T10:00:00.000Z'
      })
    )
    const changed = await harness.applyPurchaseOrderChange.execute(
      new ApplyPurchaseOrderChangeCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: draft.purchaseOrderId,
        changeType: 'LINE_QTY_ADJUSTED',
        changeReason: 'final pack size',
        appliedBy: {
          operatorId: 'buyer-1',
          displayName: 'Buyer One'
        },
        targetState: {
          lines: [
            {
              purchaseOrderLineId: issued.lines[0].purchaseOrderLineId,
              lineType: PurchaseRequestLineType.STANDARD_ITEM,
              itemId: 'item-1',
              description: 'Standard Resin',
              orderedQuantity: '12',
              uom: 'KG',
              orderedUnitPrice: '9.80',
              allocations: [
                {
                  allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                  quantity: '12',
                  reason: 'final pack size'
                }
              ]
            }
          ]
        }
      })
    )
    const changePage = await harness.listPurchaseOrderChanges.execute(
      new ListPurchaseOrderChangesQuery({
        tenantId: 'tenant-1',
        purchaseOrderId: issued.purchaseOrderId,
        page: 1,
        pageSize: 20
      })
    )

    expect(issued.status).toBe(PurchaseOrderStatus.ISSUED)
    expect(issued.supplierSnapshot.supplierDisplayName).toBe('Acme Supplier')
    expect(acknowledged.status).toBe(PurchaseOrderStatus.ACKNOWLEDGED)
    expect(changed.purchaseOrder.lines[0].orderedQuantity).toBe('12')
    expect(changed.change.status).toBe('APPLIED')
    expect(changePage.total).toBe(1)
  })

  it('IssuePurchaseOrder / when standard item has no ACTIVE SupplierOffering / should reject with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      active: true,
      purchasable: true
    })
    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })

    const draft = await harness.createPurchaseOrderDraft.execute(
      new CreatePurchaseOrderDraftCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        lines: [
          {
            lineType: PurchaseRequestLineType.STANDARD_ITEM,
            itemId: 'item-1',
            description: 'Standard Resin',
            orderedQuantity: '10',
            uom: 'KG',
            allocations: [
              {
                allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                quantity: '10'
              }
            ]
          }
        ]
      })
    )

    await expect(
      harness.issuePurchaseOrder.execute(
        new IssuePurchaseOrderCommand({
          tenantId: 'tenant-1',
          purchaseOrderId: draft.purchaseOrderId
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })
  })

  it('ReceivingExpectation / should allow issued-PO expectation creation and discrepancy resolution without mutating inventory truth', async () => {
    const harness = createHarness()

    const draft = await harness.createPurchaseOrderDraft.execute(
      new CreatePurchaseOrderDraftCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        lines: [
          {
            lineType: PurchaseRequestLineType.TEXT,
            description: 'Custom carton',
            orderedQuantity: '8',
            uom: 'BOX',
            allocations: [
              {
                allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                quantity: '8'
              }
            ]
          }
        ]
      })
    )

    await expect(
      harness.createReceivingExpectation.execute(
        new CreateReceivingExpectationCommand({
          tenantId: 'tenant-1',
          purchaseOrderId: draft.purchaseOrderId,
          purchaseOrderLineId: draft.lines[0].purchaseOrderLineId,
          allocationGroupingKey: 'draft-line',
          sourceAllocationIds: [draft.lines[0].allocations[0].purchaseOrderLineAllocationId],
          expectedQuantity: '8',
          expectedReceiptDate: '2026-05-30'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })
    const issued = await harness.issuePurchaseOrder.execute(
      new IssuePurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: draft.purchaseOrderId
      })
    )
    const expectation = await harness.createReceivingExpectation.execute(
      new CreateReceivingExpectationCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: issued.purchaseOrderId,
        purchaseOrderLineId: issued.lines[0].purchaseOrderLineId,
        allocationGroupingKey: 'issued-line',
        sourceAllocationIds: [issued.lines[0].allocations[0].purchaseOrderLineAllocationId],
        expectedQuantity: '8',
        expectedReceiptDate: '2026-05-30'
      })
    )

    const seeded = await harness.receivingRepository.save({
      ...expectation,
      discrepancy: {
        receivingDiscrepancyId: 'discrepancy-1',
        discrepancyType: ReceivingDiscrepancyType.SHORT_RECEIVED,
        summary: '2 boxes short',
        status: ReceivingDiscrepancyStatus.OPEN
      }
    })
    const resolved = await harness.recordReceivingDiscrepancyResolution.execute(
      new RecordReceivingDiscrepancyResolutionCommand({
        tenantId: 'tenant-1',
        receivingExpectationId: seeded.receivingExpectationId,
        receivingDiscrepancyId: 'discrepancy-1',
        resolutionCode: ReceivingResolutionCode.WAIT_REDELIVERY,
        resolutionNote: 'supplier promised redelivery'
      })
    )
    const found = await harness.getReceivingExpectation.execute(
      new GetReceivingExpectationQuery('tenant-1', seeded.receivingExpectationId)
    )
    const search = await harness.searchReceivingExpectations.execute(
      new SearchReceivingExpectationsQuery({
        tenantId: 'tenant-1',
        hasOpenDiscrepancy: false,
        page: 1,
        pageSize: 20
      })
    )

    expect(expectation.status).toBe(ReceivingExpectationStatus.OPEN)
    expect(resolved.receivingDiscrepancy.resolutionCode).toBe(ReceivingResolutionCode.WAIT_REDELIVERY)
    expect(found.receivedQuantitySummary).toBe('0')
    expect(found.openQuantity).toBe('8')
    expect(search.total).toBe(1)
  })

  it('ReceivingExpectation / should require a PurchaseOrderChange reference before closing remaining unreceived quantity', async () => {
    const harness = createHarness()
    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })

    const draft = await harness.createPurchaseOrderDraft.execute(
      new CreatePurchaseOrderDraftCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        lines: [
          {
            lineType: PurchaseRequestLineType.TEXT,
            description: 'Close short receipt via PO change',
            orderedQuantity: '8',
            uom: 'BOX',
            allocations: [
              {
                allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                quantity: '8'
              }
            ]
          }
        ]
      })
    )
    const issued = await harness.issuePurchaseOrder.execute(
      new IssuePurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: draft.purchaseOrderId
      })
    )
    const expectation = await harness.createReceivingExpectation.execute(
      new CreateReceivingExpectationCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: issued.purchaseOrderId,
        purchaseOrderLineId: issued.lines[0].purchaseOrderLineId,
        allocationGroupingKey: 'issued-line',
        sourceAllocationIds: [issued.lines[0].allocations[0].purchaseOrderLineAllocationId],
        expectedQuantity: '8',
        expectedReceiptDate: '2026-05-30'
      })
    )
    const seeded = await harness.receivingRepository.save({
      ...expectation,
      discrepancy: {
        receivingDiscrepancyId: 'discrepancy-close-1',
        discrepancyType: ReceivingDiscrepancyType.SHORT_RECEIVED,
        summary: '2 boxes short',
        status: ReceivingDiscrepancyStatus.OPEN
      }
    })

    await expect(
      harness.recordReceivingDiscrepancyResolution.execute(
        new RecordReceivingDiscrepancyResolutionCommand({
          tenantId: 'tenant-1',
          receivingExpectationId: seeded.receivingExpectationId,
          receivingDiscrepancyId: 'discrepancy-close-1',
          resolutionCode: ReceivingResolutionCode.CLOSE_UNRECEIVED,
          resolutionNote: 'close without change reference'
        })
      )
    ).rejects.toMatchObject({
      definition: {
        rpcStatus: status.FAILED_PRECONDITION
      }
    })

    const poChange = await harness.applyPurchaseOrderChange.execute(
      new ApplyPurchaseOrderChangeCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: issued.purchaseOrderId,
        changeType: 'LINE_QTY_ADJUSTED',
        changeReason: 'cancel remaining unreceived quantity',
        appliedBy: {
          operatorId: 'buyer-1',
          displayName: 'Buyer One'
        },
        targetState: {
          lines: [
            {
              purchaseOrderLineId: issued.lines[0].purchaseOrderLineId,
              lineType: PurchaseRequestLineType.TEXT,
              description: 'Close short receipt via PO change',
              orderedQuantity: '6',
              uom: 'BOX',
              allocations: [
                {
                  allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                  quantity: '6',
                  reason: 'cancel remaining unreceived quantity'
                }
              ]
            }
          ]
        }
      })
    )
    const resolved = await harness.recordReceivingDiscrepancyResolution.execute(
      new RecordReceivingDiscrepancyResolutionCommand({
        tenantId: 'tenant-1',
        receivingExpectationId: seeded.receivingExpectationId,
        receivingDiscrepancyId: 'discrepancy-close-1',
        resolutionCode: ReceivingResolutionCode.CLOSE_UNRECEIVED,
        resolutionNote: 'close the remaining shortfall after PO change',
        resolutionReferences: [
          {
            referenceType: 'PURCHASE_ORDER_CHANGE',
            referenceId: poChange.change.purchaseOrderChangeId
          }
        ]
      })
    )

    expect(poChange.change.status).toBe('APPLIED')
    expect(resolved.receivingDiscrepancy.resolutionCode).toBe(ReceivingResolutionCode.CLOSE_UNRECEIVED)
    expect(resolved.receivingDiscrepancy.resolutionReferences).toEqual([
      {
        referenceType: 'PURCHASE_ORDER_CHANGE',
        referenceId: poChange.change.purchaseOrderChangeId
      }
    ])
  })

  it('CreateReceivingExpectation / should allow multiple expectations for one PO line when allocation grouping or targets differ', async () => {
    const harness = createHarness()
    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })

    const draft = await harness.createPurchaseOrderDraft.execute(
      new CreatePurchaseOrderDraftCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        lines: [
          {
            lineType: PurchaseRequestLineType.TEXT,
            description: 'Split receiving carton',
            orderedQuantity: '8',
            uom: 'BOX',
            allocations: [
              {
                allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                quantity: '4',
                targetWarehouseId: 'wh-a'
              },
              {
                allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                quantity: '4',
                targetWarehouseId: 'wh-b'
              }
            ]
          }
        ]
      } as never)
    )
    const issued = await harness.issuePurchaseOrder.execute(
      new IssuePurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: draft.purchaseOrderId
      })
    )

    const firstExpectation = await harness.createReceivingExpectation.execute(
      new CreateReceivingExpectationCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: issued.purchaseOrderId,
        purchaseOrderLineId: issued.lines[0].purchaseOrderLineId,
        allocationGroupingKey: 'wh-a',
        sourceAllocationIds: [issued.lines[0].allocations[0].purchaseOrderLineAllocationId],
        targetWarehouseId: 'wh-a',
        expectedQuantity: '4',
        expectedReceiptDate: '2026-05-30'
      } as never)
    )

    const secondExpectation = await harness.createReceivingExpectation.execute(
      new CreateReceivingExpectationCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: issued.purchaseOrderId,
        purchaseOrderLineId: issued.lines[0].purchaseOrderLineId,
        allocationGroupingKey: 'wh-b',
        sourceAllocationIds: [issued.lines[0].allocations[1].purchaseOrderLineAllocationId],
        targetWarehouseId: 'wh-b',
        expectedQuantity: '4',
        expectedReceiptDate: '2026-06-02'
      } as never)
    )

    expect(firstExpectation.receivingExpectationId).not.toBe(secondExpectation.receivingExpectationId)
    expect((firstExpectation as any).allocationGroupingKey).toBe('wh-a')
    expect((secondExpectation as any).allocationGroupingKey).toBe('wh-b')
    expect((secondExpectation as any).targetWarehouseId).toBe('wh-b')
  })

  it('CancelPurchaseOrder / should cancel orders without receiving expectations after phase 1 acknowledgement', async () => {
    const harness = createHarness()
    harness.supplierLookup.seedSupplier({
      supplierId: 'supplier-1',
      supplierDisplayName: 'Acme Supplier',
      status: 'ACTIVE'
    })

    const draft = await harness.createPurchaseOrderDraft.execute(
      new CreatePurchaseOrderDraftCommand({
        tenantId: 'tenant-1',
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        lines: [
          {
            lineType: PurchaseRequestLineType.TEXT,
            description: 'Custom carton',
            orderedQuantity: '8',
            uom: 'BOX',
            allocations: [
              {
                allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
                quantity: '8'
              }
            ]
          }
        ]
      })
    )
    await harness.issuePurchaseOrder.execute(
      new IssuePurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: draft.purchaseOrderId
      })
    )

    const cancelled = await harness.cancelPurchaseOrder.execute(
      new CancelPurchaseOrderCommand({
        tenantId: 'tenant-1',
        purchaseOrderId: draft.purchaseOrderId,
        cancelReason: 'supplier switched'
      })
    )
    const found = await harness.getPurchaseOrder.execute(
      new GetPurchaseOrderQuery('tenant-1', draft.purchaseOrderId)
    )
    const search = await harness.searchPurchaseOrders.execute(
      new SearchPurchaseOrdersQuery({
        tenantId: 'tenant-1',
        status: PurchaseOrderStatus.CANCELLED,
        page: 1,
        pageSize: 20
      })
    )

    expect(cancelled.status).toBe(PurchaseOrderStatus.CANCELLED)
    expect(found.status).toBe(PurchaseOrderStatus.CANCELLED)
    expect(search.total).toBe(1)
  })
})
