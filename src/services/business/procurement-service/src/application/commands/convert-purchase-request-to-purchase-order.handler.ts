import { randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import {
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  PurchaseRequestRecord,
  PurchaseRequestStatus
} from '../../domain/models/procurement-records'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port'
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port'
import { assertExists, assertPrecondition, assertRequiredString } from '../support/procurement-assertions'
import {
  buildConvertedPurchaseOrderLines,
  buildSupplierAcknowledgement,
  normalizeCommercialTermsSnapshot,
  normalizePaymentTermsSnapshot,
  nowIso,
  assertIssuableSupplierSnapshot
} from '../support/procurement-write-support'
import { ConvertPurchaseRequestToPurchaseOrderCommand } from './convert-purchase-request-to-purchase-order.command'

/** ConvertPurchaseRequestToPurchaseOrderHandler turns one approved PR into a phase 1 PO draft under frozen supplier-item gates. */
@Injectable()
@CommandHandler(ConvertPurchaseRequestToPurchaseOrderCommand)
export class ConvertPurchaseRequestToPurchaseOrderHandler
  implements ICommandHandler<ConvertPurchaseRequestToPurchaseOrderCommand, PurchaseOrderRecord>
{
  constructor(
    @Inject(TOKENS.PURCHASE_REQUEST_REPOSITORY)
    private readonly purchaseRequestRepository: PurchaseRequestRepository,
    @Inject(TOKENS.PURCHASE_ORDER_REPOSITORY)
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    @Inject(TOKENS.ITEM_REFERENCE_LOOKUP_PORT)
    private readonly itemLookup: ItemReferenceLookupPort,
    @Inject(TOKENS.SUPPLIER_REFERENCE_LOOKUP_PORT)
    private readonly supplierLookup: SupplierReferenceLookupPort
  ) {}

  async execute(command: ConvertPurchaseRequestToPurchaseOrderCommand): Promise<PurchaseOrderRecord> {
    assertRequiredString(command.payload.tenantId, 'tenantId')
    assertPrecondition(command.payload.sourceLines.length > 0, 'at least one purchase request line must be selected')

    const existingDraft = command.payload.targetPurchaseOrderId
      ? assertExists(
          await this.purchaseOrderRepository.findById(
            command.payload.tenantId,
            command.payload.targetPurchaseOrderId
          ),
          'purchase_order',
          command.payload.targetPurchaseOrderId
        )
      : null
    if (existingDraft) {
      assertPrecondition(existingDraft.status === PurchaseOrderStatus.DRAFT, 'target purchase order must be DRAFT')
    }

    const groupedSelections = new Map<
      string,
      Array<ConvertPurchaseRequestToPurchaseOrderCommand['payload']['sourceLines'][number]>
    >()
    for (const selection of command.payload.sourceLines) {
      assertRequiredString(selection.purchaseRequestId, 'sourceLines.purchaseRequestId')
      assertRequiredString(selection.purchaseRequestLineId, 'sourceLines.purchaseRequestLineId')
      const current = groupedSelections.get(selection.purchaseRequestId) ?? []
      current.push(selection)
      groupedSelections.set(selection.purchaseRequestId, current)
    }

    const sourcePurchaseRequests: PurchaseRequestRecord[] = []
    for (const purchaseRequestId of groupedSelections.keys()) {
      const purchaseRequest = assertExists(
        await this.purchaseRequestRepository.findById(command.payload.tenantId, purchaseRequestId),
        'purchase_request',
        purchaseRequestId
      )
      assertApprovedPurchaseRequest(purchaseRequest)
      sourcePurchaseRequests.push(purchaseRequest)
    }

    const supplierId = existingDraft?.supplierId ?? command.payload.supplierId ?? ''
    const currencyCode = existingDraft?.currencyCode ?? command.payload.currencyCode ?? ''
    assertRequiredString(supplierId, 'supplierId')
    assertRequiredString(currencyCode, 'currencyCode')

    const supplierSnapshot = await assertIssuableSupplierSnapshot(
      this.supplierLookup,
      command.payload.tenantId,
      supplierId
    )

    const convertedLines = (
      await Promise.all(
        sourcePurchaseRequests.map(async (purchaseRequest) => {
          const selections = groupedSelections.get(purchaseRequest.purchaseRequestId) ?? []
          const selectedLineIds = new Set(selections.map((selection) => selection.purchaseRequestLineId))
          const selectedRequestLines = purchaseRequest.lines.filter((line) =>
            selectedLineIds.has(line.purchaseRequestLineId)
          )
          assertPrecondition(
            selectedRequestLines.length === selections.length,
            'selected purchase request line was not found'
          )

          return buildConvertedPurchaseOrderLines({
            tenantId: command.payload.tenantId,
            supplierId,
            purchaseRequestLines: selectedRequestLines,
            selections,
            itemLookup: this.itemLookup,
            supplierLookup: this.supplierLookup
          })
        })
      )
    ).flat()

    const createdAt = nowIso()
    const existingSourceIds = existingDraft?.sourcePurchaseRequestIds ?? []
    const existingSourceNos = existingDraft?.sourcePurchaseRequestNos ?? []
    const nextSourceIds = [...new Set([...existingSourceIds, ...sourcePurchaseRequests.map((request) => request.purchaseRequestId)])]
    const nextSourceNos = [
      ...new Set([...existingSourceNos, ...sourcePurchaseRequests.map((request) => request.requestNo)])
    ]

    const purchaseOrder: PurchaseOrderRecord = existingDraft
      ? {
          ...existingDraft,
          orgId: existingDraft.orgId ?? sourcePurchaseRequests[0]?.orgId ?? null,
          currencyCode: currencyCode.trim(),
          supplierId: supplierId.trim(),
          supplierSnapshot,
          paymentTermsSnapshot:
            normalizePaymentTermsSnapshot(command.payload.paymentTermsSnapshot) ??
            existingDraft.paymentTermsSnapshot ??
            null,
          supplierCommercialTermsSnapshot:
            normalizeCommercialTermsSnapshot(command.payload.supplierCommercialTermsSnapshot) ??
            existingDraft.supplierCommercialTermsSnapshot ??
            null,
          sourcePurchaseRequestIds: nextSourceIds,
          sourcePurchaseRequestNos: nextSourceNos,
          updatedAt: createdAt,
          lines: [...existingDraft.lines, ...renumberLines(existingDraft.lines.length, convertedLines)]
        }
      : {
          purchaseOrderId: randomUUID(),
          orderNo: await this.purchaseOrderRepository.nextOrderNo(command.payload.tenantId),
          tenantId: command.payload.tenantId,
          orgId: sourcePurchaseRequests[0]?.orgId ?? null,
          status: PurchaseOrderStatus.DRAFT,
          currencyCode: currencyCode.trim(),
          supplierId: supplierId.trim(),
          supplierSnapshot,
          paymentTermsSnapshot: normalizePaymentTermsSnapshot(command.payload.paymentTermsSnapshot),
          supplierCommercialTermsSnapshot: normalizeCommercialTermsSnapshot(
            command.payload.supplierCommercialTermsSnapshot
          ),
          paymentSummary: null,
          sourcePurchaseRequestIds: nextSourceIds,
          sourcePurchaseRequestNos: nextSourceNos,
          supplierAcknowledgement: buildSupplierAcknowledgement(),
          issueComment: null,
          cancelReason: null,
          createdAt,
          updatedAt: createdAt,
          issuedAt: null,
          cancelledAt: null,
          lines: renumberLines(0, convertedLines),
          changes: []
        }

    return this.purchaseOrderRepository.save(purchaseOrder)
  }
}

function assertApprovedPurchaseRequest(purchaseRequest: PurchaseRequestRecord): void {
  assertPrecondition(
    purchaseRequest.status === PurchaseRequestStatus.APPROVED ||
      purchaseRequest.status === PurchaseRequestStatus.PARTIALLY_CONVERTED,
    'purchase request must be APPROVED or PARTIALLY_CONVERTED before conversion'
  )
}

function renumberLines(startLineNo: number, lines: PurchaseOrderRecord['lines']): PurchaseOrderRecord['lines'] {
  return lines.map((line, index) => ({
    ...line,
    lineNo: startLineNo + index + 1
  }))
}
