import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PrismaPurchaseOrderRepository } from '../../src/infrastructure/repositories/prisma/prisma-purchase-order.repository'
import { PrismaPurchaseRequestRepository } from '../../src/infrastructure/repositories/prisma/prisma-purchase-request.repository'
import { PrismaReceivingRepository } from '../../src/infrastructure/repositories/prisma/prisma-receiving.repository'
import {
  PurchaseOrderLineAllocationType,
  PurchaseOrderStatus,
  PurchaseRequestDecision,
  PurchaseRequestLineType,
  PurchaseRequestStatus,
  PurchaseRequestType,
  ReceivingDiscrepancyStatus,
  ReceivingDiscrepancyType,
  ReceivingExpectationStatus
} from '../../src/domain/models/procurement-records'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

/** buildApprovedPurchaseRequestRecord creates one approved PR aggregate for Prisma round-trip tests. */
function buildApprovedPurchaseRequestRecord(tenantId: string, prefix: string) {
  return {
    purchaseRequestId: crypto.randomUUID(),
    requestNo: `${prefix}-PR-0001`,
    tenantId,
    orgId: `${prefix}_org`,
    requestType: PurchaseRequestType.SALES_DEDICATED,
    status: PurchaseRequestStatus.APPROVED,
    requester: {
      operatorId: `${prefix}_requester`,
      displayName: 'Buyer Integration'
    },
    title: `${prefix} approved PR`,
    reason: 'foundation test',
    submissionComment: 'submitted',
    cancelReason: null,
    createdAt: '2026-04-28T10:00:00.000Z',
    updatedAt: '2026-04-28T10:05:00.000Z',
    submittedAt: '2026-04-28T10:01:00.000Z',
    decidedAt: '2026-04-28T10:02:00.000Z',
    cancelledAt: null,
    approvalSnapshot: {
      purchaseRequestApprovalSnapshotId: crypto.randomUUID(),
      decision: PurchaseRequestDecision.APPROVED,
      decidedBy: {
        operatorId: `${prefix}_approver`,
        displayName: 'Approver Integration'
      },
      decidedAt: '2026-04-28T10:02:00.000Z',
      comment: 'approved',
      approvalReference: `${prefix}_approval`
    },
    lines: [
      {
        purchaseRequestLineId: crypto.randomUUID(),
        lineNo: 1,
        lineType: PurchaseRequestLineType.STANDARD_ITEM,
        itemId: `${prefix}_item_1`,
        itemCode: 'RM-001',
        itemName: 'Resin',
        description: 'Resin',
        requestedQuantity: '10',
        uom: 'KG',
        neededByDate: '2026-05-20',
        demandReferenceType: 'FULFILLMENT_DEMAND',
        demandReferenceId: `${prefix}_fd_1`
      }
    ]
  }
}

/** buildIssuedPurchaseOrderRecord creates one issued PO aggregate with change history for Prisma round-trip tests. */
function buildIssuedPurchaseOrderRecord(tenantId: string, prefix: string, purchaseRequestLineId: string) {
  return {
    purchaseOrderId: crypto.randomUUID(),
    orderNo: `${prefix}-PO-0001`,
    tenantId,
    orgId: `${prefix}_org`,
    status: PurchaseOrderStatus.ISSUED,
    currencyCode: 'USD',
    supplierId: `${prefix}_supplier`,
    supplierSnapshot: {
      supplierId: `${prefix}_supplier`,
      supplierDisplayName: 'Acme Integration',
      supplierStatusAtIssue: 'ACTIVE'
    },
    sourcePurchaseRequestIds: [`${prefix}_pr`],
    sourcePurchaseRequestNos: [`${prefix}-PR-0001`],
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
    issuedAt: '2026-04-28T11:01:00.000Z',
    cancelledAt: null,
    lines: [
      {
        purchaseOrderLineId: crypto.randomUUID(),
        lineNo: 1,
        lineType: PurchaseRequestLineType.STANDARD_ITEM,
        itemId: `${prefix}_item_1`,
        itemCode: 'RM-001',
        itemName: 'Resin',
        description: 'Resin',
        supplierOfferingId: `${prefix}_offering`,
        orderedQuantity: '12',
        uom: 'KG',
        orderedUnitPrice: '9.80',
        sourcePurchaseRequestLineId: purchaseRequestLineId,
        sourceRequestedQuantity: '10',
        generalStockExcessReason: 'buffer stock',
        allocations: [
          {
            purchaseOrderLineAllocationId: crypto.randomUUID(),
            allocationType: PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE,
            sourceReferenceId: purchaseRequestLineId,
            quantity: '10',
            reason: null,
            targetWarehouseId: `${prefix}_wh_a`,
            targetReceivingAddressId: `${prefix}_addr_a`
          },
          {
            purchaseOrderLineAllocationId: crypto.randomUUID(),
            allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
            sourceReferenceId: null,
            quantity: '2',
            reason: 'buffer stock',
            targetWarehouseId: `${prefix}_wh_b`,
            targetReceivingAddressId: `${prefix}_addr_b`
          }
        ]
      }
    ],
    changes: [
      {
        purchaseOrderChangeId: crypto.randomUUID(),
        purchaseOrderId: '',
        changeType: 'LINE_QTY_ADJUSTED',
        changeSummary: 'line quantity adjusted',
        changeReason: 'buffer stock',
        appliedBy: {
          operatorId: `${prefix}_buyer`,
          displayName: 'Buyer Integration'
        },
        appliedAt: '2026-04-28T11:05:00.000Z',
        status: 'APPLIED'
      }
    ]
  }
}

/** buildReceivingExpectationRecord creates one procurement-owned expectation and discrepancy summary for Prisma tests. */
function buildReceivingExpectationRecord(tenantId: string, prefix: string, purchaseOrderId: string, purchaseOrderLineId: string) {
  return {
    receivingExpectationId: crypto.randomUUID(),
    tenantId,
    orgId: `${prefix}_org`,
    purchaseOrderId,
    purchaseOrderLineId,
    supplierId: `${prefix}_supplier`,
    allocationGroupingKey: 'group-a',
    sourceAllocationIds: [],
    targetWarehouseId: `${prefix}_wh_a`,
    targetReceivingAddressId: `${prefix}_addr_a`,
    expectedQuantity: '12',
    receivedQuantitySummary: '9',
    openQuantity: '3',
    expectedReceiptDate: '2026-05-22',
    status: ReceivingExpectationStatus.PARTIALLY_RECEIVED,
    createdAt: '2026-04-28T12:00:00.000Z',
    updatedAt: '2026-04-28T12:05:00.000Z',
    discrepancy: {
      receivingDiscrepancyId: crypto.randomUUID(),
      discrepancyType: ReceivingDiscrepancyType.SHORT_RECEIVED,
      summary: '3 short',
      status: ReceivingDiscrepancyStatus.OPEN,
      resolutionCode: null,
      resolutionNote: null,
      resolutionReferences: [],
      resolvedAt: null
    }
  }
}

describe('Prisma procurement repositories Integration', () => {
  let prisma: PrismaService
  let purchaseRequestRepository: PrismaPurchaseRequestRepository
  let purchaseOrderRepository: PrismaPurchaseOrderRepository
  let receivingRepository: PrismaReceivingRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    purchaseRequestRepository = new PrismaPurchaseRequestRepository(prisma)
    purchaseOrderRepository = new PrismaPurchaseOrderRepository(prisma)
    receivingRepository = new PrismaReceivingRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('repositories / should persist and query PR PO receiving aggregates with allocation, change, and discrepancy summaries intact', async () => {
    const tenantId = `${prefix}_tenant`
    const purchaseRequest = buildApprovedPurchaseRequestRecord(tenantId, prefix)
    const savedRequest = await purchaseRequestRepository.save(purchaseRequest)
    const purchaseOrder = buildIssuedPurchaseOrderRecord(
      tenantId,
      prefix,
      purchaseRequest.lines[0].purchaseRequestLineId
    )
    purchaseOrder.sourcePurchaseRequestIds = [savedRequest.purchaseRequestId]
    purchaseOrder.sourcePurchaseRequestNos = [savedRequest.requestNo]
    purchaseOrder.changes[0].purchaseOrderId = purchaseOrder.purchaseOrderId
    const savedOrder = await purchaseOrderRepository.save(purchaseOrder)
    const expectation = buildReceivingExpectationRecord(
      tenantId,
      prefix,
      savedOrder.purchaseOrderId,
      savedOrder.lines[0].purchaseOrderLineId
    )
    const savedExpectation = await receivingRepository.save(expectation)

    const foundRequest = await purchaseRequestRepository.findById(tenantId, savedRequest.purchaseRequestId)
    const foundOrder = await purchaseOrderRepository.findById(tenantId, savedOrder.purchaseOrderId)
    const foundExpectation = await receivingRepository.findById(tenantId, savedExpectation.receivingExpectationId)
    const requestSearch = await purchaseRequestRepository.search({
      tenantId,
      itemId: `${prefix}_item_1`,
      status: PurchaseRequestStatus.APPROVED,
      page: 1,
      pageSize: 20
    })
    const orderSearch = await purchaseOrderRepository.search({
      tenantId,
      requestNo: savedRequest.requestNo,
      supplierId: `${prefix}_supplier`,
      status: PurchaseOrderStatus.ISSUED,
      page: 1,
      pageSize: 20
    })
    const changePage = await purchaseOrderRepository.listChanges({
      tenantId,
      purchaseOrderId: savedOrder.purchaseOrderId,
      page: 1,
      pageSize: 20
    })
    const receivingSearch = await receivingRepository.search({
      tenantId,
      supplierId: `${prefix}_supplier`,
      hasOpenDiscrepancy: true,
      page: 1,
      pageSize: 20
    })

    expect(foundRequest).toEqual(savedRequest)
    expect(foundOrder).toEqual(savedOrder)
    expect(foundExpectation).toEqual(savedExpectation)
    expect(requestSearch.items).toEqual([savedRequest])
    expect(orderSearch.items).toEqual([savedOrder])
    expect(changePage.items).toEqual(savedOrder.changes)
    expect(receivingSearch.items).toEqual([savedExpectation])
  })

  it('repositories / should round-trip converted PR state, source-based allocation targets, payment snapshots, and multiple grouped receiving expectations on one PO line', async () => {
    const tenantId = `${prefix}_tenant`
    const purchaseRequest = {
      ...buildApprovedPurchaseRequestRecord(tenantId, prefix),
      status: 'PARTIALLY_CONVERTED',
      linkedPurchaseOrders: [
        {
          purchaseOrderId: `${prefix}_po`,
          orderNo: `${prefix}-PO-0001`,
          allocatedQuantity: '6',
          expectedReceiptDate: '2026-05-22',
          receivingStatusSummary: 'PARTIALLY_RECEIVED'
        }
      ],
      nextExpectedReceiptDate: '2026-05-22',
      receivingStatusSummary: 'PARTIALLY_RECEIVED',
      lines: [
        {
          ...buildApprovedPurchaseRequestRecord(tenantId, prefix).lines[0],
          conversionStatus: 'PARTIALLY_CONVERTED',
          linkedPurchaseOrderLines: [
            {
              purchaseOrderId: `${prefix}_po`,
              orderNo: `${prefix}-PO-0001`,
              purchaseOrderLineId: `${prefix}_po_line`,
              allocatedQuantity: '6',
              expectedReceiptDate: '2026-05-22',
              receivingStatusSummary: 'PARTIALLY_RECEIVED'
            }
          ]
        }
      ]
    } as never
    const savedRequest = await purchaseRequestRepository.save(purchaseRequest)

    const purchaseOrder = {
      ...buildIssuedPurchaseOrderRecord(tenantId, prefix, purchaseRequest.lines[0].purchaseRequestLineId),
      paymentTermsSnapshot: {
        paymentTermsCode: 'NET30',
        paymentTermsText: '30 days'
      },
      supplierCommercialTermsSnapshot: {
        incotermCode: 'FOB',
        commercialTermsText: 'FOB Shanghai'
      },
      paymentSummary: {
        paymentStatusSummary: 'DEPOSIT_PAID',
        depositPaidAmount: '100.00',
        balancePaidAmount: '0.00',
        currencyCode: 'USD',
        attachmentRefs: ['asset://payment-proof-1'],
        lastPaymentAt: '2026-04-28T12:00:00.000Z'
      },
      lines: [
        {
          ...buildIssuedPurchaseOrderRecord(tenantId, prefix, purchaseRequest.lines[0].purchaseRequestLineId).lines[0],
          allocations: [
            {
              purchaseOrderLineAllocationId: crypto.randomUUID(),
              allocationType: 'PURCHASE_REQUEST_LINE',
              sourceReferenceId: purchaseRequest.lines[0].purchaseRequestLineId,
              quantity: '6',
              reason: null,
              targetWarehouseId: `${prefix}_wh_a`,
              targetReceivingAddressId: `${prefix}_addr_a`
            },
            {
              purchaseOrderLineAllocationId: crypto.randomUUID(),
              allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
              sourceReferenceId: null,
              quantity: '6',
              reason: 'buffer stock',
              targetWarehouseId: `${prefix}_wh_b`,
              targetReceivingAddressId: `${prefix}_addr_b`
            }
          ]
        }
      ]
    } as never
    purchaseOrder.sourcePurchaseRequestIds = [savedRequest.purchaseRequestId]
    purchaseOrder.sourcePurchaseRequestNos = [savedRequest.requestNo]
    purchaseOrder.changes[0].purchaseOrderId = purchaseOrder.purchaseOrderId
    const savedOrder = await purchaseOrderRepository.save(purchaseOrder)

    const expectationA = {
      ...buildReceivingExpectationRecord(
        tenantId,
        prefix,
        savedOrder.purchaseOrderId,
        savedOrder.lines[0].purchaseOrderLineId
      ),
      allocationGroupingKey: 'group-a',
      sourceAllocationIds: [savedOrder.lines[0].allocations[0].purchaseOrderLineAllocationId],
      targetWarehouseId: `${prefix}_wh_a`,
      targetReceivingAddressId: `${prefix}_addr_a`,
      discrepancy: {
        receivingDiscrepancyId: crypto.randomUUID(),
        discrepancyType: 'QUALITY_HOLD',
        summary: 'awaiting inspection',
        status: ReceivingDiscrepancyStatus.OPEN,
        resolutionCode: null,
        resolutionNote: null,
        resolutionReferences: [],
        resolvedAt: null
      }
    } as never
    const expectationB = {
      ...buildReceivingExpectationRecord(
        tenantId,
        prefix,
        savedOrder.purchaseOrderId,
        savedOrder.lines[0].purchaseOrderLineId
      ),
      receivingExpectationId: crypto.randomUUID(),
      allocationGroupingKey: 'group-b',
      sourceAllocationIds: [savedOrder.lines[0].allocations[1].purchaseOrderLineAllocationId],
      targetWarehouseId: `${prefix}_wh_b`,
      targetReceivingAddressId: `${prefix}_addr_b`,
      discrepancy: {
        receivingDiscrepancyId: crypto.randomUUID(),
        discrepancyType: 'WRONG_ITEM',
        summary: 'wrong carton variant',
        status: 'RESOLVED',
        resolutionCode: 'REJECT_WRONG_ITEM',
        resolutionNote: 'supplier collects and replaces',
        resolutionReferences: [
          {
            referenceType: 'RETURN_REFERENCE',
            referenceId: `${prefix}_return_1`
          }
        ],
        resolvedAt: '2026-04-28T13:00:00.000Z'
      }
    } as never
    const savedExpectationA = await receivingRepository.save(expectationA)
    const savedExpectationB = await receivingRepository.save(expectationB)

    const foundRequest = await purchaseRequestRepository.findById(tenantId, savedRequest.purchaseRequestId)
    const foundOrder = await purchaseOrderRepository.findById(tenantId, savedOrder.purchaseOrderId)
    const foundExpectationA = await receivingRepository.findById(tenantId, savedExpectationA.receivingExpectationId)
    const foundExpectationB = await receivingRepository.findById(tenantId, savedExpectationB.receivingExpectationId)

    expect(foundRequest).toEqual(savedRequest)
    expect(foundOrder).toEqual(savedOrder)
    expect(foundExpectationA).toEqual(savedExpectationA)
    expect(foundExpectationB).toEqual(savedExpectationB)
  })
})
