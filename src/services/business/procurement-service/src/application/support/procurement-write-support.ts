import { randomUUID } from 'node:crypto'
import { ItemReferenceLookupPort } from '../ports/item-reference-lookup.port'
import { SupplierReferenceLookupPort } from '../ports/supplier-reference-lookup.port'
import {
  assertExists,
  assertPositiveQuantity,
  assertPrecondition,
  assertRequiredString,
  assertKnownAllocationType,
  assertKnownPurchaseRequestLineType,
  compareQuantity,
  inferAllocationType,
  normalizeOptionalString,
  normalizeQuantity,
  subtractQuantity,
  sumQuantities
} from './procurement-assertions'
import {
  OperatorSummary,
  PurchaseOrderChangeRecord,
  PurchaseOrderChangeStatus,
  PurchaseOrderLineAllocationRecord,
  PurchaseOrderLineAllocationType,
  PurchaseOrderLineRecord,
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  PurchaseOrderSupplierAcknowledgementRecord,
  PurchaseOrderSupplierAcknowledgementStatus,
  PurchaseOrderSupplierSnapshotRecord,
  PurchaseRequestLineRecord,
  PurchaseRequestLineType
} from '../../domain/models/procurement-records'
import { PurchaseRequestRepository } from '../../domain/repositories/purchase-request.repository'
import { ExceptionFactory } from '@oes/common/exceptions'
import { PROCUREMENT_INVALID_ARGUMENT } from '../../common/errors/procurement.errors'

export interface PurchaseRequestLineInputLike {
  lineType: string
  itemId?: string
  description: string
  requestedQuantity: string
  uom: string
  neededByDate?: string
  demandReferenceType?: string
  demandReferenceId?: string
}

export interface PurchaseOrderLineAllocationInputLike {
  allocationType: string
  referenceId?: string
  quantity: string
  reason?: string
}

export interface PurchaseOrderLineInputLike {
  purchaseOrderLineId?: string
  lineType: string
  itemId?: string
  description: string
  orderedQuantity: string
  uom: string
  orderedUnitPrice?: string
  sourcePurchaseRequestLineId?: string
  generalStockExcessReason?: string
  allocations: PurchaseOrderLineAllocationInputLike[]
}

/** nowIso returns the current wall-clock ISO timestamp for phase 1 record mutations. */
export function nowIso(): string {
  return new Date().toISOString()
}

/** cloneOrderForMutation returns a writable deep copy of one PO aggregate. */
export function cloneOrderForMutation(order: PurchaseOrderRecord): PurchaseOrderRecord {
  return structuredClone(order)
}

/** buildSupplierAcknowledgement returns the minimal pending acknowledgement summary required by phase 1 POs. */
export function buildSupplierAcknowledgement(
  current?: Partial<PurchaseOrderSupplierAcknowledgementRecord>
): PurchaseOrderSupplierAcknowledgementRecord {
  return {
    acknowledgementStatus:
      current?.acknowledgementStatus ?? PurchaseOrderSupplierAcknowledgementStatus.PENDING,
    acknowledgedAt: current?.acknowledgedAt ?? null,
    externalReference: current?.externalReference ?? null,
    comment: current?.comment ?? null
  }
}

/** buildDraftSupplierSnapshot preserves the supplier reference on drafts without inventing SRM commercial truth. */
export function buildDraftSupplierSnapshot(supplierId: string): PurchaseOrderSupplierSnapshotRecord {
  return {
    supplierId,
    supplierDisplayName: '',
    supplierStatusAtIssue: null
  }
}

/** materializePurchaseRequestLines validates PR line inputs and snapshots standard-item summaries at intake time. */
export async function materializePurchaseRequestLines(
  tenantId: string,
  lines: PurchaseRequestLineInputLike[],
  itemLookup: ItemReferenceLookupPort
): Promise<PurchaseRequestLineRecord[]> {
  assertPrecondition(lines.length > 0, 'purchase request must have at least one line')

  const result: PurchaseRequestLineRecord[] = []
  for (const [index, line] of lines.entries()) {
    const lineType = toPurchaseRequestLineType(line.lineType)
    const requestedQuantity = assertPositiveQuantity(line.requestedQuantity, `lines[${index}].requestedQuantity`)
    assertRequiredString(line.description, `lines[${index}].description`)
    assertRequiredString(line.uom, `lines[${index}].uom`)

    if (lineType === PurchaseRequestLineType.STANDARD_ITEM) {
      assertRequiredString(line.itemId ?? '', `lines[${index}].itemId`)
      const item = await assertPurchasableItem(itemLookup, tenantId, line.itemId!)
      result.push({
        purchaseRequestLineId: randomUUID(),
        lineNo: index + 1,
        lineType,
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        description: line.description.trim(),
        requestedQuantity,
        uom: line.uom.trim(),
        neededByDate: normalizeOptionalString(line.neededByDate) ?? null,
        demandReferenceType: normalizeOptionalString(line.demandReferenceType) ?? null,
        demandReferenceId: normalizeOptionalString(line.demandReferenceId) ?? null
      })
      continue
    }

    result.push({
      purchaseRequestLineId: randomUUID(),
      lineNo: index + 1,
      lineType,
      itemId: null,
      itemCode: null,
      itemName: null,
      description: line.description.trim(),
      requestedQuantity,
      uom: line.uom.trim(),
      neededByDate: normalizeOptionalString(line.neededByDate) ?? null,
      demandReferenceType: normalizeOptionalString(line.demandReferenceType) ?? null,
      demandReferenceId: normalizeOptionalString(line.demandReferenceId) ?? null
    })
  }

  return result
}

/** materializeDraftPurchaseOrderLines validates PO draft line inputs and enforces allocation, excess, and standard-item invariants. */
export async function materializeDraftPurchaseOrderLines(input: {
  tenantId: string
  lines: PurchaseOrderLineInputLike[]
  itemLookup?: ItemReferenceLookupPort
  purchaseRequestRepository?: PurchaseRequestRepository
  sourcePurchaseRequestIds?: string[]
  existingLineById?: Map<string, PurchaseOrderLineRecord>
}): Promise<PurchaseOrderLineRecord[]> {
  const sourceLineMap = input.purchaseRequestRepository
    ? await buildSourcePurchaseRequestLineMap(
        input.purchaseRequestRepository,
        input.tenantId,
        input.sourcePurchaseRequestIds ?? []
      )
    : new Map<string, PurchaseRequestLineRecord>()

  const result: PurchaseOrderLineRecord[] = []
  for (const [index, line] of input.lines.entries()) {
    const lineType = toPurchaseRequestLineType(line.lineType)
    const orderedQuantity = assertPositiveQuantity(line.orderedQuantity, `lines[${index}].orderedQuantity`)
    assertRequiredString(line.description, `lines[${index}].description`)
    assertRequiredString(line.uom, `lines[${index}].uom`)
    assertPrecondition(line.allocations.length > 0, 'purchase order line must have at least one allocation', {
      lineIndex: index
    })

    let itemId: string | null = null
    let itemCode: string | null = null
    let itemName: string | null = null
    if (lineType === PurchaseRequestLineType.STANDARD_ITEM) {
      assertRequiredString(line.itemId ?? '', `lines[${index}].itemId`)
      itemId = line.itemId!.trim()
      if (input.itemLookup) {
        const item = await assertPurchasableItem(input.itemLookup, input.tenantId, itemId)
        itemCode = item.itemCode
        itemName = item.itemName
      } else {
        const existing = line.purchaseOrderLineId
          ? input.existingLineById?.get(line.purchaseOrderLineId)
          : undefined
        itemCode = existing?.itemCode ?? null
        itemName = existing?.itemName ?? null
      }
    }

    const allocations = materializeAllocations(line.allocations, index)
    if (sumQuantities(allocations.map((allocation) => allocation.quantity)) !== normalizeQuantity(orderedQuantity)) {
      throw ExceptionFactory.application(PROCUREMENT_INVALID_ARGUMENT, {
        field: `lines[${index}].allocations`
      })
    }

    const sourceLine = normalizeOptionalString(line.sourcePurchaseRequestLineId)
      ? sourceLineMap.get(line.sourcePurchaseRequestLineId!.trim())
      : null
    const requestedQuantity = sourceLine?.requestedQuantity ?? null
    const excessReason = normalizeOptionalString(line.generalStockExcessReason) ?? null
    if (requestedQuantity && compareQuantity(orderedQuantity, requestedQuantity) > 0) {
      const excess = subtractQuantity(orderedQuantity, requestedQuantity)
      const generalStockAllocation = allocations
        .filter((allocation) => allocation.allocationType === PurchaseOrderLineAllocationType.GENERAL_STOCK)
        .reduce((sum, allocation) => sum + Number(allocation.quantity), 0)

      assertPrecondition(excessReason, 'excess quantity must keep general stock reason', {
        lineIndex: index
      })
      assertPrecondition(generalStockAllocation >= Number(excess), 'excess quantity must be marked as general stock', {
        lineIndex: index
      })
    }

    result.push({
      purchaseOrderLineId: normalizeOptionalString(line.purchaseOrderLineId) ?? randomUUID(),
      lineNo: index + 1,
      lineType,
      itemId,
      itemCode,
      itemName,
      description: line.description.trim(),
      supplierOfferingId: line.purchaseOrderLineId
        ? input.existingLineById?.get(line.purchaseOrderLineId)?.supplierOfferingId ?? null
        : null,
      orderedQuantity,
      uom: line.uom.trim(),
      orderedUnitPrice: normalizeOptionalString(line.orderedUnitPrice) ?? null,
      sourcePurchaseRequestLineId: normalizeOptionalString(line.sourcePurchaseRequestLineId) ?? null,
      sourceRequestedQuantity: requestedQuantity,
      generalStockExcessReason: excessReason,
      allocations
    })
  }

  return result
}

/** assertIssuableSupplierSnapshot validates the supplier truth and returns the transaction snapshot frozen at PO issue time. */
export async function assertIssuableSupplierSnapshot(
  supplierLookup: SupplierReferenceLookupPort,
  tenantId: string,
  supplierId: string
): Promise<PurchaseOrderSupplierSnapshotRecord> {
  const supplier = assertExists(
    await supplierLookup.getSupplierById(tenantId, supplierId),
    'supplier',
    supplierId
  )
  assertPrecondition(supplier.status === 'ACTIVE', 'supplier must be ACTIVE', {
    supplierId
  })

  return {
    supplierId: supplier.supplierId,
    supplierDisplayName: supplier.supplierDisplayName,
    supplierStatusAtIssue: supplier.status
  }
}

/** assertStandardLineOfferings validates standard-item issue gates and stamps offering ids onto line snapshots. */
export async function assertStandardLineOfferings(
  supplierLookup: SupplierReferenceLookupPort,
  tenantId: string,
  supplierId: string,
  lines: PurchaseOrderLineRecord[]
): Promise<PurchaseOrderLineRecord[]> {
  const updated: PurchaseOrderLineRecord[] = []
  for (const line of lines) {
    if (line.lineType === PurchaseRequestLineType.STANDARD_ITEM) {
      const offering = await supplierLookup.getActiveSupplierOffering(tenantId, supplierId, line.itemId ?? '')
      assertPrecondition(offering, 'standard item must have ACTIVE SupplierOffering', {
        supplierId,
        itemId: line.itemId ?? ''
      })
      updated.push({
        ...line,
        supplierOfferingId: offering.supplierOfferingId
      })
      continue
    }

    updated.push({
      ...line,
      supplierOfferingId: null
    })
  }

  return updated
}

/** buildChangeSummary renders the minimal applied-change summary frozen for phase 1 change history. */
export function buildChangeSummary(changeType: string, lineCount: number): string {
  return `${changeType} applied to ${lineCount} line(s)`
}

/** buildAppliedChange creates one APPLIED change fact without inventing a workflow layer. */
export function buildAppliedChange(input: {
  purchaseOrderId: string
  changeType: string
  changeReason: string
  appliedBy: OperatorSummary
  appliedAt?: string
  lineCount: number
}): PurchaseOrderChangeRecord {
  return {
    purchaseOrderChangeId: randomUUID(),
    purchaseOrderId: input.purchaseOrderId,
    changeType: input.changeType.trim(),
    changeSummary: buildChangeSummary(input.changeType.trim(), input.lineCount),
    changeReason: input.changeReason.trim(),
    appliedBy: input.appliedBy,
    appliedAt: input.appliedAt ?? nowIso(),
    status: PurchaseOrderChangeStatus.APPLIED
  }
}

/** buildConvertedPurchaseOrderLines materializes a PO draft from one approved PR selection set. */
export async function buildConvertedPurchaseOrderLines(input: {
  tenantId: string
  supplierId: string
  purchaseRequestLines: PurchaseRequestLineRecord[]
  selections: Array<{
    purchaseRequestLineId: string
    purchaseOrderQuantity: string
    orderedUnitPrice?: string
    generalStockExcessReason?: string
  }>
  itemLookup: ItemReferenceLookupPort
  supplierLookup: SupplierReferenceLookupPort
}): Promise<PurchaseOrderLineRecord[]> {
  const selectedByLineId = new Map(
    input.selections.map((selection) => [selection.purchaseRequestLineId, selection] as const)
  )
  const result: PurchaseOrderLineRecord[] = []

  for (const [index, sourceLine] of input.purchaseRequestLines.entries()) {
    const selection = selectedByLineId.get(sourceLine.purchaseRequestLineId)
    if (!selection) {
      continue
    }

    const orderedQuantity = assertPositiveQuantity(selection.purchaseOrderQuantity, 'purchaseOrderQuantity')
    let supplierOfferingId: string | null = null
    if (sourceLine.lineType === PurchaseRequestLineType.STANDARD_ITEM) {
      await assertPurchasableItem(input.itemLookup, input.tenantId, sourceLine.itemId ?? '')
      const offering = await input.supplierLookup.getActiveSupplierOffering(
        input.tenantId,
        input.supplierId,
        sourceLine.itemId ?? ''
      )
      assertPrecondition(offering, 'standard item must have ACTIVE SupplierOffering', {
        supplierId: input.supplierId,
        itemId: sourceLine.itemId ?? ''
      })
      supplierOfferingId = offering.supplierOfferingId
    }

    const allocations = buildConvertedAllocations(sourceLine, orderedQuantity, selection.generalStockExcessReason)
    result.push({
      purchaseOrderLineId: randomUUID(),
      lineNo: index + 1,
      lineType: sourceLine.lineType,
      itemId: sourceLine.itemId ?? null,
      itemCode: sourceLine.itemCode ?? null,
      itemName: sourceLine.itemName ?? null,
      description: sourceLine.description,
      supplierOfferingId,
      orderedQuantity,
      uom: sourceLine.uom,
      orderedUnitPrice: normalizeOptionalString(selection.orderedUnitPrice) ?? null,
      sourcePurchaseRequestLineId: sourceLine.purchaseRequestLineId,
      sourceRequestedQuantity: sourceLine.requestedQuantity,
      generalStockExcessReason: normalizeOptionalString(selection.generalStockExcessReason) ?? null,
      allocations
    })
  }

  return result
}

/** buildConvertedAllocations translates one PR demand line plus optional excess into the supported mixed-allocation PO shape. */
function buildConvertedAllocations(
  sourceLine: PurchaseRequestLineRecord,
  orderedQuantity: string,
  generalStockExcessReason?: string
): PurchaseOrderLineAllocationRecord[] {
  const requestedQuantity = normalizeQuantity(sourceLine.requestedQuantity)
  const allocations: PurchaseOrderLineAllocationRecord[] = []
  const dedicatedType = inferAllocationType(sourceLine.demandReferenceType)
  const baseQuantity =
    compareQuantity(orderedQuantity, requestedQuantity) >= 0 ? requestedQuantity : orderedQuantity

  if (dedicatedType === PurchaseOrderLineAllocationType.GENERAL_STOCK) {
    allocations.push({
      purchaseOrderLineAllocationId: randomUUID(),
      allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
      referenceId: null,
      quantity: orderedQuantity,
      reason: normalizeOptionalString(generalStockExcessReason) ?? null
    })
    return allocations
  }

  allocations.push({
    purchaseOrderLineAllocationId: randomUUID(),
    allocationType: dedicatedType,
    referenceId: sourceLine.demandReferenceId ?? null,
    quantity: baseQuantity,
    reason: null
  })

  if (compareQuantity(orderedQuantity, requestedQuantity) > 0) {
    allocations.push({
      purchaseOrderLineAllocationId: randomUUID(),
      allocationType: PurchaseOrderLineAllocationType.GENERAL_STOCK,
      referenceId: null,
      quantity: subtractQuantity(orderedQuantity, requestedQuantity),
      reason: normalizeOptionalString(generalStockExcessReason) ?? null
    })
  }

  return allocations
}

/** materializeAllocations validates allocation inputs and normalizes them into the persisted phase 1 snapshot shape. */
function materializeAllocations(
  allocations: PurchaseOrderLineAllocationInputLike[],
  lineIndex: number
): PurchaseOrderLineAllocationRecord[] {
  return allocations.map((allocation, allocationIndex) => ({
    purchaseOrderLineAllocationId: randomUUID(),
    allocationType: toAllocationType(allocation.allocationType),
    referenceId: normalizeOptionalString(allocation.referenceId) ?? null,
    quantity: assertPositiveQuantity(
      allocation.quantity,
      `lines[${lineIndex}].allocations[${allocationIndex}].quantity`
    ),
    reason: normalizeOptionalString(allocation.reason) ?? null
  }))
}

/** buildSourcePurchaseRequestLineMap loads source PRs and indexes their lines for PO draft validation. */
async function buildSourcePurchaseRequestLineMap(
  purchaseRequestRepository: PurchaseRequestRepository,
  tenantId: string,
  purchaseRequestIds: string[]
): Promise<Map<string, PurchaseRequestLineRecord>> {
  const map = new Map<string, PurchaseRequestLineRecord>()
  for (const purchaseRequestId of purchaseRequestIds) {
    const request = await purchaseRequestRepository.findById(tenantId, purchaseRequestId)
    if (!request) {
      continue
    }
    for (const line of request.lines) {
      map.set(line.purchaseRequestLineId, line)
    }
  }
  return map
}

/** assertPurchasableItem validates standard-item existence and purchasable capability through item-master truth. */
async function assertPurchasableItem(
  itemLookup: ItemReferenceLookupPort,
  tenantId: string,
  itemId: string
) {
  const item = assertExists(await itemLookup.getItemById(tenantId, itemId), 'item', itemId)
  assertPrecondition(item.purchasable, 'standard item must be purchasable', {
    itemId
  })
  return item
}

/** toPurchaseRequestLineType normalizes string inputs into the frozen line-type enum set. */
export function toPurchaseRequestLineType(value: string): PurchaseRequestLineType {
  const normalized =
    value === PurchaseRequestLineType.TEXT ? PurchaseRequestLineType.TEXT : PurchaseRequestLineType.STANDARD_ITEM
  return assertKnownPurchaseRequestLineType(normalized)
}

/** toAllocationType normalizes string inputs into the frozen allocation enum set. */
export function toAllocationType(value: string): PurchaseOrderLineAllocationType {
  const normalized = (() => {
    if (value === PurchaseOrderLineAllocationType.SALES_ORDER_LINE) {
      return PurchaseOrderLineAllocationType.SALES_ORDER_LINE
    }
    if (value === PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND) {
      return PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND
    }
    return PurchaseOrderLineAllocationType.GENERAL_STOCK
  })()
  return assertKnownAllocationType(normalized)
}
