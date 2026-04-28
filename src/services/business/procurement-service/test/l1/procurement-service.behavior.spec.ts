import { status } from '@grpc/grpc-js'
import { CreatePurchaseRequestCommand } from '../../src/application/commands/create-purchase-request.command'
import { CreatePurchaseRequestHandler } from '../../src/application/commands/create-purchase-request.handler'
import { UpdatePurchaseRequestDraftCommand } from '../../src/application/commands/update-purchase-request-draft.command'
import { UpdatePurchaseRequestDraftHandler } from '../../src/application/commands/update-purchase-request-draft.handler'
import { SubmitPurchaseRequestCommand } from '../../src/application/commands/submit-purchase-request.command'
import { SubmitPurchaseRequestHandler } from '../../src/application/commands/submit-purchase-request.handler'
import { DecidePurchaseRequestCommand } from '../../src/application/commands/decide-purchase-request.command'
import { DecidePurchaseRequestHandler } from '../../src/application/commands/decide-purchase-request.handler'
import { CancelPurchaseRequestCommand } from '../../src/application/commands/cancel-purchase-request.command'
import { CancelPurchaseRequestHandler } from '../../src/application/commands/cancel-purchase-request.handler'
import { ConvertPurchaseRequestToPurchaseOrderCommand } from '../../src/application/commands/convert-purchase-request-to-purchase-order.command'
import { ConvertPurchaseRequestToPurchaseOrderHandler } from '../../src/application/commands/convert-purchase-request-to-purchase-order.handler'
import { CreatePurchaseOrderDraftCommand } from '../../src/application/commands/create-purchase-order-draft.command'
import { CreatePurchaseOrderDraftHandler } from '../../src/application/commands/create-purchase-order-draft.handler'
import { UpdatePurchaseOrderDraftCommand } from '../../src/application/commands/update-purchase-order-draft.command'
import { UpdatePurchaseOrderDraftHandler } from '../../src/application/commands/update-purchase-order-draft.handler'
import { IssuePurchaseOrderCommand } from '../../src/application/commands/issue-purchase-order.command'
import { IssuePurchaseOrderHandler } from '../../src/application/commands/issue-purchase-order.handler'
import { ConfirmSupplierAcknowledgementCommand } from '../../src/application/commands/confirm-supplier-acknowledgement.command'
import { ConfirmSupplierAcknowledgementHandler } from '../../src/application/commands/confirm-supplier-acknowledgement.handler'
import { ApplyPurchaseOrderChangeCommand } from '../../src/application/commands/apply-purchase-order-change.command'
import { ApplyPurchaseOrderChangeHandler } from '../../src/application/commands/apply-purchase-order-change.handler'
import { CancelPurchaseOrderCommand } from '../../src/application/commands/cancel-purchase-order.command'
import { CancelPurchaseOrderHandler } from '../../src/application/commands/cancel-purchase-order.handler'
import { CreateReceivingExpectationCommand } from '../../src/application/commands/create-receiving-expectation.command'
import { CreateReceivingExpectationHandler } from '../../src/application/commands/create-receiving-expectation.handler'
import { RecordReceivingDiscrepancyResolutionCommand } from '../../src/application/commands/record-receiving-discrepancy-resolution.command'
import { RecordReceivingDiscrepancyResolutionHandler } from '../../src/application/commands/record-receiving-discrepancy-resolution.handler'
import { ItemReferenceLookupPort, ItemReferenceLookupResult } from '../../src/application/ports/item-reference-lookup.port'
import {
  SupplierOfferingReferenceLookupResult,
  SupplierReferenceLookupPort,
  SupplierReferenceLookupResult
} from '../../src/application/ports/supplier-reference-lookup.port'
import { GetPurchaseRequestHandler } from '../../src/application/queries/get-purchase-request.handler'
import { GetPurchaseRequestQuery } from '../../src/application/queries/get-purchase-request.query'
import { SearchPurchaseRequestsHandler } from '../../src/application/queries/search-purchase-requests.handler'
import { SearchPurchaseRequestsQuery } from '../../src/application/queries/search-purchase-requests.query'
import { GetPurchaseOrderHandler } from '../../src/application/queries/get-purchase-order.handler'
import { GetPurchaseOrderQuery } from '../../src/application/queries/get-purchase-order.query'
import { SearchPurchaseOrdersHandler } from '../../src/application/queries/search-purchase-orders.handler'
import { SearchPurchaseOrdersQuery } from '../../src/application/queries/search-purchase-orders.query'
import { ListPurchaseOrderChangesHandler } from '../../src/application/queries/list-purchase-order-changes.handler'
import { ListPurchaseOrderChangesQuery } from '../../src/application/queries/list-purchase-order-changes.query'
import { GetReceivingExpectationHandler } from '../../src/application/queries/get-receiving-expectation.handler'
import { GetReceivingExpectationQuery } from '../../src/application/queries/get-receiving-expectation.query'
import { SearchReceivingExpectationsHandler } from '../../src/application/queries/search-receiving-expectations.handler'
import { SearchReceivingExpectationsQuery } from '../../src/application/queries/search-receiving-expectations.query'
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
} from '../../src/domain/models/procurement-records'
import { InMemoryPurchaseOrderRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-purchase-order.repository'
import { InMemoryPurchaseRequestRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-purchase-request.repository'
import { InMemoryReceivingRepository } from '../../src/infrastructure/repositories/in-memory/in-memory-receiving.repository'
import { ProcurementInMemoryStore } from '../../src/infrastructure/store/procurement-in-memory-store'

/** StubItemReferenceLookupPort lets L1 drive standard-item validation outcomes without reaching item-master-service. */
class StubItemReferenceLookupPort implements ItemReferenceLookupPort {
  private readonly items = new Map<string, ItemReferenceLookupResult>()

  seed(item: ItemReferenceLookupResult): void {
    this.items.set(item.itemId, item)
  }

  async getItemById(_tenantId: string, itemId: string): Promise<ItemReferenceLookupResult | null> {
    return this.items.get(itemId) ?? null
  }
}

/** StubSupplierReferenceLookupPort lets L1 drive supplier and offering truth without reaching srm-service. */
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
    getPurchaseRequest: new GetPurchaseRequestHandler(purchaseRequestRepository),
    searchPurchaseRequests: new SearchPurchaseRequestsHandler(purchaseRequestRepository),
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

describe('procurement-service behavior L1', () => {
  it('PurchaseRequest draft lifecycle / should create update submit and approve a mixed-item demand request', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      status: 'ACTIVE',
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
    expect(found).toEqual(decided)
    expect(search.total).toBe(1)
    expect(search.purchaseRequests[0].purchaseRequestId).toBe(created.purchaseRequestId)
  })

  it('PurchaseRequest decision and cancellation / should support rejected and uncoupled approved requests without creating procurement commitments', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      status: 'ACTIVE',
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

  it('ConvertPurchaseRequestToPurchaseOrder / should create a PO draft with mixed allocation and general-stock excess reason', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      status: 'ACTIVE',
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
        purchaseRequestId: approved.purchaseRequestId,
        supplierId: 'supplier-1',
        currencyCode: 'USD',
        selectedLines: [
          {
            purchaseRequestLineId: approved.lines[0].purchaseRequestLineId,
            purchaseOrderQuantity: '13',
            orderedUnitPrice: '9.80',
            generalStockExcessReason: 'buffer for shelf stock'
          },
          {
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
          allocationType: PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND,
          quantity: '10',
          referenceId: 'fd-1'
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
        allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
        quantity: '4'
      })
    ])
  })

  it('ConvertPurchaseRequestToPurchaseOrder / when standard item has no ACTIVE SupplierOffering / should reject with FAILED_PRECONDITION', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      status: 'ACTIVE',
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
          purchaseRequestId: request.purchaseRequestId,
          supplierId: 'supplier-1',
          currencyCode: 'USD',
          selectedLines: [
            {
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

  it('IssuePurchaseOrder / should validate ACTIVE supplier offering, keep supplier snapshot, then allow acknowledgement and applied change history', async () => {
    const harness = createHarness()
    harness.itemLookup.seed({
      itemId: 'item-1',
      itemCode: 'RM-001',
      itemName: 'Standard Resin',
      status: 'ACTIVE',
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
      status: 'ACTIVE',
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
        expectedQuantity: '8',
        expectedReceiptDate: '2026-05-30'
      })
    )

    const seeded = await harness.receivingRepository.save({
      ...expectation,
      discrepancy: {
        receivingDiscrepancyId: 'discrepancy-1',
        discrepancyType: ReceivingDiscrepancyType.SHORT_RECEIPT,
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
