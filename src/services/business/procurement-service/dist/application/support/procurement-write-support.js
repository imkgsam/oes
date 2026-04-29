"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePaymentTermsSnapshot = normalizePaymentTermsSnapshot;
exports.normalizeCommercialTermsSnapshot = normalizeCommercialTermsSnapshot;
exports.nowIso = nowIso;
exports.cloneOrderForMutation = cloneOrderForMutation;
exports.buildSupplierAcknowledgement = buildSupplierAcknowledgement;
exports.buildDraftSupplierSnapshot = buildDraftSupplierSnapshot;
exports.materializePurchaseRequestLines = materializePurchaseRequestLines;
exports.materializeDraftPurchaseOrderLines = materializeDraftPurchaseOrderLines;
exports.assertIssuableSupplierSnapshot = assertIssuableSupplierSnapshot;
exports.assertStandardLineOfferings = assertStandardLineOfferings;
exports.buildChangeSummary = buildChangeSummary;
exports.buildAppliedChange = buildAppliedChange;
exports.buildConvertedPurchaseOrderLines = buildConvertedPurchaseOrderLines;
exports.toPurchaseRequestLineType = toPurchaseRequestLineType;
exports.toAllocationType = toAllocationType;
const node_crypto_1 = require("node:crypto");
const procurement_assertions_1 = require("./procurement-assertions");
const procurement_records_1 = require("../../domain/models/procurement-records");
const exceptions_1 = require("@oes/common/exceptions");
const procurement_errors_1 = require("../../common/errors/procurement.errors");
/** normalizePaymentTermsSnapshot keeps optional PO payment terms as a trimmed transaction snapshot only. */
function normalizePaymentTermsSnapshot(input) {
    const paymentTermsCode = (0, procurement_assertions_1.normalizeOptionalString)(input?.paymentTermsCode) ?? null;
    const paymentTermsText = (0, procurement_assertions_1.normalizeOptionalString)(input?.paymentTermsText) ?? null;
    return paymentTermsCode || paymentTermsText
        ? {
            paymentTermsCode,
            paymentTermsText
        }
        : null;
}
/** normalizeCommercialTermsSnapshot keeps optional PO commercial terms as a trimmed transaction snapshot only. */
function normalizeCommercialTermsSnapshot(input) {
    const incotermCode = (0, procurement_assertions_1.normalizeOptionalString)(input?.incotermCode) ?? null;
    const commercialTermsText = (0, procurement_assertions_1.normalizeOptionalString)(input?.commercialTermsText) ?? null;
    return incotermCode || commercialTermsText
        ? {
            incotermCode,
            commercialTermsText
        }
        : null;
}
/** nowIso returns the current wall-clock ISO timestamp for phase 1 record mutations. */
function nowIso() {
    return new Date().toISOString();
}
/** cloneOrderForMutation returns a writable deep copy of one PO aggregate. */
function cloneOrderForMutation(order) {
    return structuredClone(order);
}
/** buildSupplierAcknowledgement returns the minimal pending acknowledgement summary required by phase 1 POs. */
function buildSupplierAcknowledgement(current) {
    return {
        acknowledgementStatus: current?.acknowledgementStatus ?? procurement_records_1.PurchaseOrderSupplierAcknowledgementStatus.PENDING,
        acknowledgedAt: current?.acknowledgedAt ?? null,
        externalReference: current?.externalReference ?? null,
        comment: current?.comment ?? null
    };
}
/** buildDraftSupplierSnapshot preserves the supplier reference on drafts without inventing SRM commercial truth. */
function buildDraftSupplierSnapshot(supplierId) {
    return {
        supplierId,
        supplierDisplayName: '',
        supplierStatusAtIssue: null
    };
}
/** materializePurchaseRequestLines validates PR line inputs and snapshots standard-item summaries at intake time. */
async function materializePurchaseRequestLines(tenantId, lines, itemLookup) {
    (0, procurement_assertions_1.assertPrecondition)(lines.length > 0, 'purchase request must have at least one line');
    const result = [];
    for (const [index, line] of lines.entries()) {
        const lineType = toPurchaseRequestLineType(line.lineType);
        const requestedQuantity = (0, procurement_assertions_1.assertPositiveQuantity)(line.requestedQuantity, `lines[${index}].requestedQuantity`);
        (0, procurement_assertions_1.assertRequiredString)(line.description, `lines[${index}].description`);
        (0, procurement_assertions_1.assertRequiredString)(line.uom, `lines[${index}].uom`);
        if (lineType === procurement_records_1.PurchaseRequestLineType.STANDARD_ITEM) {
            (0, procurement_assertions_1.assertRequiredString)(line.itemId ?? '', `lines[${index}].itemId`);
            const item = await assertPurchasableItem(itemLookup, tenantId, line.itemId);
            result.push({
                purchaseRequestLineId: (0, node_crypto_1.randomUUID)(),
                lineNo: index + 1,
                lineType,
                itemId: item.itemId,
                itemCode: item.itemCode,
                itemName: item.itemName,
                description: line.description.trim(),
                requestedQuantity,
                uom: line.uom.trim(),
                neededByDate: (0, procurement_assertions_1.normalizeOptionalString)(line.neededByDate) ?? null,
                demandReferenceType: (0, procurement_assertions_1.normalizeOptionalString)(line.demandReferenceType) ?? null,
                demandReferenceId: (0, procurement_assertions_1.normalizeOptionalString)(line.demandReferenceId) ?? null
            });
            continue;
        }
        result.push({
            purchaseRequestLineId: (0, node_crypto_1.randomUUID)(),
            lineNo: index + 1,
            lineType,
            itemId: null,
            itemCode: null,
            itemName: null,
            description: line.description.trim(),
            requestedQuantity,
            uom: line.uom.trim(),
            neededByDate: (0, procurement_assertions_1.normalizeOptionalString)(line.neededByDate) ?? null,
            demandReferenceType: (0, procurement_assertions_1.normalizeOptionalString)(line.demandReferenceType) ?? null,
            demandReferenceId: (0, procurement_assertions_1.normalizeOptionalString)(line.demandReferenceId) ?? null
        });
    }
    return result;
}
/** materializeDraftPurchaseOrderLines validates PO draft line inputs and enforces allocation, excess, and standard-item invariants. */
async function materializeDraftPurchaseOrderLines(input) {
    const sourceLineMap = input.purchaseRequestRepository
        ? await buildSourcePurchaseRequestLineMap(input.purchaseRequestRepository, input.tenantId, input.sourcePurchaseRequestIds ?? [])
        : new Map();
    const result = [];
    for (const [index, line] of input.lines.entries()) {
        const lineType = toPurchaseRequestLineType(line.lineType);
        const orderedQuantity = (0, procurement_assertions_1.assertPositiveQuantity)(line.orderedQuantity, `lines[${index}].orderedQuantity`);
        (0, procurement_assertions_1.assertRequiredString)(line.description, `lines[${index}].description`);
        (0, procurement_assertions_1.assertRequiredString)(line.uom, `lines[${index}].uom`);
        (0, procurement_assertions_1.assertPrecondition)(line.allocations.length > 0, 'purchase order line must have at least one allocation', {
            lineIndex: index
        });
        let itemId = null;
        let itemCode = null;
        let itemName = null;
        if (lineType === procurement_records_1.PurchaseRequestLineType.STANDARD_ITEM) {
            (0, procurement_assertions_1.assertRequiredString)(line.itemId ?? '', `lines[${index}].itemId`);
            itemId = line.itemId.trim();
            if (input.itemLookup) {
                const item = await assertPurchasableItem(input.itemLookup, input.tenantId, itemId);
                itemCode = item.itemCode;
                itemName = item.itemName;
            }
            else {
                const existing = line.purchaseOrderLineId
                    ? input.existingLineById?.get(line.purchaseOrderLineId)
                    : undefined;
                itemCode = existing?.itemCode ?? null;
                itemName = existing?.itemName ?? null;
            }
        }
        const allocations = materializeAllocations(line.allocations, index);
        if ((0, procurement_assertions_1.sumQuantities)(allocations.map((allocation) => allocation.quantity)) !== (0, procurement_assertions_1.normalizeQuantity)(orderedQuantity)) {
            throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, {
                field: `lines[${index}].allocations`
            });
        }
        const sourceLine = (0, procurement_assertions_1.normalizeOptionalString)(line.sourcePurchaseRequestLineId)
            ? sourceLineMap.get(line.sourcePurchaseRequestLineId.trim())
            : null;
        const requestedQuantity = sourceLine?.requestedQuantity ?? null;
        const excessReason = (0, procurement_assertions_1.normalizeOptionalString)(line.generalStockExcessReason) ?? null;
        if (requestedQuantity && (0, procurement_assertions_1.compareQuantity)(orderedQuantity, requestedQuantity) > 0) {
            const excess = (0, procurement_assertions_1.subtractQuantity)(orderedQuantity, requestedQuantity);
            const generalStockAllocation = allocations
                .filter((allocation) => allocation.allocationType === procurement_records_1.PurchaseOrderLineAllocationType.GENERAL_STOCK)
                .reduce((sum, allocation) => sum + Number(allocation.quantity), 0);
            (0, procurement_assertions_1.assertPrecondition)(excessReason, 'excess quantity must keep general stock reason', {
                lineIndex: index
            });
            (0, procurement_assertions_1.assertPrecondition)(generalStockAllocation >= Number(excess), 'excess quantity must be marked as general stock', {
                lineIndex: index
            });
        }
        result.push({
            purchaseOrderLineId: (0, procurement_assertions_1.normalizeOptionalString)(line.purchaseOrderLineId) ?? (0, node_crypto_1.randomUUID)(),
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
            orderedUnitPrice: (0, procurement_assertions_1.normalizeOptionalString)(line.orderedUnitPrice) ?? null,
            sourcePurchaseRequestLineId: (0, procurement_assertions_1.normalizeOptionalString)(line.sourcePurchaseRequestLineId) ?? null,
            sourceRequestedQuantity: requestedQuantity,
            generalStockExcessReason: excessReason,
            allocations
        });
    }
    return result;
}
/** assertIssuableSupplierSnapshot validates the supplier truth and returns the transaction snapshot frozen at PO issue time. */
async function assertIssuableSupplierSnapshot(supplierLookup, tenantId, supplierId) {
    const supplier = (0, procurement_assertions_1.assertExists)(await supplierLookup.getSupplierById(tenantId, supplierId), 'supplier', supplierId);
    (0, procurement_assertions_1.assertPrecondition)(supplier.status === 'ACTIVE', 'supplier must be ACTIVE', {
        supplierId
    });
    return {
        supplierId: supplier.supplierId,
        supplierDisplayName: supplier.supplierDisplayName,
        supplierStatusAtIssue: supplier.status
    };
}
/** assertStandardLineOfferings validates standard-item issue gates and stamps offering ids onto line snapshots. */
async function assertStandardLineOfferings(supplierLookup, tenantId, supplierId, lines) {
    const updated = [];
    for (const line of lines) {
        if (line.lineType === procurement_records_1.PurchaseRequestLineType.STANDARD_ITEM) {
            const offering = await supplierLookup.getActiveSupplierOffering(tenantId, supplierId, line.itemId ?? '');
            (0, procurement_assertions_1.assertPrecondition)(offering, 'standard item must have ACTIVE SupplierOffering', {
                supplierId,
                itemId: line.itemId ?? ''
            });
            updated.push({
                ...line,
                supplierOfferingId: offering.supplierOfferingId
            });
            continue;
        }
        updated.push({
            ...line,
            supplierOfferingId: null
        });
    }
    return updated;
}
/** buildChangeSummary renders the minimal applied-change summary frozen for phase 1 change history. */
function buildChangeSummary(changeType, lineCount) {
    return `${changeType} applied to ${lineCount} line(s)`;
}
/** buildAppliedChange creates one APPLIED change fact without inventing a workflow layer. */
function buildAppliedChange(input) {
    return {
        purchaseOrderChangeId: (0, node_crypto_1.randomUUID)(),
        purchaseOrderId: input.purchaseOrderId,
        changeType: input.changeType.trim(),
        changeSummary: buildChangeSummary(input.changeType.trim(), input.lineCount),
        changeReason: input.changeReason.trim(),
        appliedBy: input.appliedBy,
        appliedAt: input.appliedAt ?? nowIso(),
        status: procurement_records_1.PurchaseOrderChangeStatus.APPLIED
    };
}
/** buildConvertedPurchaseOrderLines materializes a PO draft from one approved PR selection set. */
async function buildConvertedPurchaseOrderLines(input) {
    const selectedByLineId = new Map(input.selections.map((selection) => [selection.purchaseRequestLineId, selection]));
    const result = [];
    for (const [index, sourceLine] of input.purchaseRequestLines.entries()) {
        const selection = selectedByLineId.get(sourceLine.purchaseRequestLineId);
        if (!selection) {
            continue;
        }
        const orderedQuantity = (0, procurement_assertions_1.assertPositiveQuantity)(selection.purchaseOrderQuantity, 'purchaseOrderQuantity');
        let supplierOfferingId = null;
        if (sourceLine.lineType === procurement_records_1.PurchaseRequestLineType.STANDARD_ITEM) {
            await assertPurchasableItem(input.itemLookup, input.tenantId, sourceLine.itemId ?? '');
            const offering = await input.supplierLookup.getActiveSupplierOffering(input.tenantId, input.supplierId, sourceLine.itemId ?? '');
            (0, procurement_assertions_1.assertPrecondition)(offering, 'standard item must have ACTIVE SupplierOffering', {
                supplierId: input.supplierId,
                itemId: sourceLine.itemId ?? ''
            });
            supplierOfferingId = offering.supplierOfferingId;
        }
        const allocations = buildConvertedAllocations(sourceLine, orderedQuantity, selection.generalStockExcessReason);
        result.push({
            purchaseOrderLineId: (0, node_crypto_1.randomUUID)(),
            lineNo: index + 1,
            lineType: sourceLine.lineType,
            itemId: sourceLine.itemId ?? null,
            itemCode: sourceLine.itemCode ?? null,
            itemName: sourceLine.itemName ?? null,
            description: sourceLine.description,
            supplierOfferingId,
            orderedQuantity,
            uom: sourceLine.uom,
            orderedUnitPrice: (0, procurement_assertions_1.normalizeOptionalString)(selection.orderedUnitPrice) ?? null,
            sourcePurchaseRequestLineId: sourceLine.purchaseRequestLineId,
            sourceRequestedQuantity: sourceLine.requestedQuantity,
            generalStockExcessReason: (0, procurement_assertions_1.normalizeOptionalString)(selection.generalStockExcessReason) ?? null,
            allocations
        });
    }
    return result;
}
/** buildConvertedAllocations translates one PR demand line plus optional excess into the supported mixed-allocation PO shape. */
function buildConvertedAllocations(sourceLine, orderedQuantity, generalStockExcessReason) {
    const requestedQuantity = (0, procurement_assertions_1.normalizeQuantity)(sourceLine.requestedQuantity);
    const allocations = [];
    const baseQuantity = (0, procurement_assertions_1.compareQuantity)(orderedQuantity, requestedQuantity) >= 0 ? requestedQuantity : orderedQuantity;
    allocations.push({
        purchaseOrderLineAllocationId: (0, node_crypto_1.randomUUID)(),
        allocationType: procurement_records_1.PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE,
        sourceReferenceId: sourceLine.purchaseRequestLineId,
        quantity: baseQuantity,
        reason: null,
        targetWarehouseId: null,
        targetReceivingAddressId: null
    });
    if ((0, procurement_assertions_1.compareQuantity)(orderedQuantity, requestedQuantity) > 0) {
        allocations.push({
            purchaseOrderLineAllocationId: (0, node_crypto_1.randomUUID)(),
            allocationType: procurement_records_1.PurchaseOrderLineAllocationType.GENERAL_STOCK,
            sourceReferenceId: null,
            quantity: (0, procurement_assertions_1.subtractQuantity)(orderedQuantity, requestedQuantity),
            reason: (0, procurement_assertions_1.normalizeOptionalString)(generalStockExcessReason) ?? null,
            targetWarehouseId: null,
            targetReceivingAddressId: null
        });
    }
    return allocations;
}
/** materializeAllocations validates allocation inputs and normalizes them into the persisted phase 1 snapshot shape. */
function materializeAllocations(allocations, lineIndex) {
    return allocations.map((allocation, allocationIndex) => {
        const allocationType = toAllocationType(allocation.allocationType);
        const sourceReferenceId = (0, procurement_assertions_1.normalizeOptionalString)(allocation.sourceReferenceId) ?? null;
        if (allocationType !== procurement_records_1.PurchaseOrderLineAllocationType.GENERAL_STOCK) {
            if (!sourceReferenceId) {
                throw exceptions_1.ExceptionFactory.application(procurement_errors_1.PROCUREMENT_INVALID_ARGUMENT, {
                    field: `lines[${lineIndex}].allocations[${allocationIndex}].sourceReferenceId`
                });
            }
        }
        return {
            purchaseOrderLineAllocationId: (0, node_crypto_1.randomUUID)(),
            allocationType,
            sourceReferenceId,
            quantity: (0, procurement_assertions_1.assertPositiveQuantity)(allocation.quantity, `lines[${lineIndex}].allocations[${allocationIndex}].quantity`),
            reason: (0, procurement_assertions_1.normalizeOptionalString)(allocation.reason) ?? null,
            targetWarehouseId: (0, procurement_assertions_1.normalizeOptionalString)(allocation.targetWarehouseId) ?? null,
            targetReceivingAddressId: (0, procurement_assertions_1.normalizeOptionalString)(allocation.targetReceivingAddressId) ?? null
        };
    });
}
/** buildSourcePurchaseRequestLineMap loads source PRs and indexes their lines for PO draft validation. */
async function buildSourcePurchaseRequestLineMap(purchaseRequestRepository, tenantId, purchaseRequestIds) {
    const map = new Map();
    for (const purchaseRequestId of purchaseRequestIds) {
        const request = await purchaseRequestRepository.findById(tenantId, purchaseRequestId);
        if (!request) {
            continue;
        }
        for (const line of request.lines) {
            map.set(line.purchaseRequestLineId, line);
        }
    }
    return map;
}
/** assertPurchasableItem validates standard-item existence and purchasable capability through item-master truth. */
async function assertPurchasableItem(itemLookup, tenantId, itemId) {
    const item = (0, procurement_assertions_1.assertExists)(await itemLookup.getItemById(tenantId, itemId), 'item', itemId);
    (0, procurement_assertions_1.assertPrecondition)(item.purchasable, 'standard item must be purchasable', {
        itemId
    });
    return item;
}
/** toPurchaseRequestLineType normalizes string inputs into the frozen line-type enum set. */
function toPurchaseRequestLineType(value) {
    const normalized = value === procurement_records_1.PurchaseRequestLineType.TEXT ? procurement_records_1.PurchaseRequestLineType.TEXT : procurement_records_1.PurchaseRequestLineType.STANDARD_ITEM;
    return (0, procurement_assertions_1.assertKnownPurchaseRequestLineType)(normalized);
}
/** toAllocationType normalizes string inputs into the frozen allocation enum set. */
function toAllocationType(value) {
    const normalized = (() => {
        if (value === procurement_records_1.PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE) {
            return procurement_records_1.PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE;
        }
        if (value === procurement_records_1.PurchaseOrderLineAllocationType.SALES_ORDER_LINE) {
            return procurement_records_1.PurchaseOrderLineAllocationType.SALES_ORDER_LINE;
        }
        if (value === procurement_records_1.PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND) {
            return procurement_records_1.PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND;
        }
        return procurement_records_1.PurchaseOrderLineAllocationType.GENERAL_STOCK;
    })();
    return (0, procurement_assertions_1.assertKnownAllocationType)(normalized);
}
//# sourceMappingURL=procurement-write-support.js.map