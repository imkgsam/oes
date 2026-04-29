import { ExceptionFactory } from '@oes/common/exceptions'
import {
  PROCUREMENT_FAILED_PRECONDITION,
  PROCUREMENT_INVALID_ARGUMENT,
  PROCUREMENT_NOT_FOUND,
  PROCUREMENT_UNAUTHENTICATED
} from '../../common/errors/procurement.errors'
import {
  ProcurementAuditContext,
  ProcurementOperatorContext,
  ProcurementTraceContext,
  PurchaseOrderLineAllocationType,
  PurchaseRequestDecision,
  PurchaseRequestLineType,
  ReceivingResolutionCode
} from '../../domain/models/procurement-records'

/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
export function assertRequiredString(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(PROCUREMENT_INVALID_ARGUMENT, { field })
  }
}

/** normalizeOptionalString collapses empty strings into undefined so controllers can map gRPC defaults safely. */
export function normalizeOptionalString(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

/** normalizePageInput applies the shared 1-based paging default used by the frozen phase 1 query surface. */
export function normalizePageInput(page?: number, pageSize?: number): { page: number; pageSize: number } {
  const normalizedPage = page && page > 0 ? page : 1
  const normalizedPageSize = pageSize && pageSize > 0 ? pageSize : 20
  return {
    page: normalizedPage,
    pageSize: normalizedPageSize
  }
}

/** paginate slices a fully filtered record list into the standard phase 1 page envelope. */
export function paginate<T>(items: T[], page: number, pageSize: number): { pageItems: T[]; total: number } {
  const start = (page - 1) * pageSize
  return {
    pageItems: items.slice(start, start + pageSize),
    total: items.length
  }
}

/** assertOperatorContext enforces the explicit command and query operator context contract frozen for procurement-service. */
export function assertOperatorContext(value?: ProcurementOperatorContext | null): ProcurementOperatorContext {
  if (!value) {
    throw ExceptionFactory.application(PROCUREMENT_UNAUTHENTICATED, {
      reason: 'operator context is required'
    })
  }

  assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId')
  assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType')
  return value
}

/** assertTraceContext enforces the explicit trace context contract frozen for procurement-service. */
export function assertTraceContext(value?: ProcurementTraceContext | null): ProcurementTraceContext {
  if (!value) {
    throw ExceptionFactory.application(PROCUREMENT_UNAUTHENTICATED, {
      reason: 'trace context is required'
    })
  }

  assertNonEmptyContextField(value.traceId, 'traceContext.traceId')
  assertNonEmptyContextField(value.requestId, 'traceContext.requestId')
  return value
}

/** assertAuditContext enforces the explicit audit context contract required by every procurement management command. */
export function assertAuditContext(value?: ProcurementAuditContext | null): ProcurementAuditContext {
  if (!value) {
    throw ExceptionFactory.application(PROCUREMENT_UNAUTHENTICATED, {
      reason: 'audit context is required'
    })
  }

  assertNonEmptyContextField(value.auditId, 'auditContext.auditId')
  assertNonEmptyContextField(value.reason, 'auditContext.reason')
  assertNonEmptyContextField(value.source, 'auditContext.source')
  return value
}

/** assertKnownPurchaseRequestLineType rejects unsupported enum values outside the frozen PR line type set. */
export function assertKnownPurchaseRequestLineType(value: PurchaseRequestLineType): PurchaseRequestLineType {
  if (value !== PurchaseRequestLineType.STANDARD_ITEM && value !== PurchaseRequestLineType.TEXT) {
    throw ExceptionFactory.application(PROCUREMENT_INVALID_ARGUMENT, {
      field: 'lineType'
    })
  }

  return value
}

/** assertKnownPurchaseRequestDecision rejects unsupported enum values outside the frozen PR decision set. */
export function assertKnownPurchaseRequestDecision(value: PurchaseRequestDecision): PurchaseRequestDecision {
  if (value !== PurchaseRequestDecision.APPROVED && value !== PurchaseRequestDecision.REJECTED) {
    throw ExceptionFactory.application(PROCUREMENT_INVALID_ARGUMENT, {
      field: 'decision'
    })
  }

  return value
}

/** assertKnownAllocationType rejects unsupported enum values outside the frozen PO allocation type set. */
export function assertKnownAllocationType(
  value: PurchaseOrderLineAllocationType
): PurchaseOrderLineAllocationType {
  if (
    value !== PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE &&
    value !== PurchaseOrderLineAllocationType.SALES_ORDER_LINE &&
    value !== PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND &&
    value !== PurchaseOrderLineAllocationType.GENERAL_STOCK
  ) {
    throw ExceptionFactory.application(PROCUREMENT_INVALID_ARGUMENT, {
      field: 'allocationType'
    })
  }

  return value
}

/** assertKnownReceivingResolutionCode rejects unsupported discrepancy resolution codes outside the frozen set. */
export function assertKnownReceivingResolutionCode(
  value: ReceivingResolutionCode
): ReceivingResolutionCode {
  if (
    value !== ReceivingResolutionCode.WAIT_REDELIVERY &&
    value !== ReceivingResolutionCode.CLOSE_UNRECEIVED &&
    value !== ReceivingResolutionCode.REQUEST_RESEND &&
    value !== ReceivingResolutionCode.ACCEPT_WITH_PO_CHANGE &&
    value !== ReceivingResolutionCode.REJECT_EXCESS &&
    value !== ReceivingResolutionCode.TEMP_HOLD &&
    value !== ReceivingResolutionCode.REJECT_DAMAGED &&
    value !== ReceivingResolutionCode.RECEIVE_WITH_RESTRICTION &&
    value !== ReceivingResolutionCode.CLAIM &&
    value !== ReceivingResolutionCode.REJECT_WRONG_ITEM &&
    value !== ReceivingResolutionCode.TEMP_RECEIVE_PENDING_DECISION &&
    value !== ReceivingResolutionCode.ACCEPT_WITH_CONTROLLED_CHANGE &&
    value !== ReceivingResolutionCode.WAIT_INSPECTION &&
    value !== ReceivingResolutionCode.ACCEPT_WITH_ALLOWANCE &&
    value !== ReceivingResolutionCode.RETURN_TO_SUPPLIER
  ) {
    throw ExceptionFactory.application(PROCUREMENT_INVALID_ARGUMENT, {
      field: 'resolutionCode'
    })
  }

  return value
}

/** assertPositiveQuantity keeps frozen procurement quantity inputs away from zero and negative values. */
export function assertPositiveQuantity(value: string, field: string): string {
  assertRequiredString(value, field)
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw ExceptionFactory.application(PROCUREMENT_INVALID_ARGUMENT, { field })
  }
  return normalizeQuantity(value)
}

/** normalizeQuantity removes redundant leading and trailing zeros from one decimal-like scalar string. */
export function normalizeQuantity(value: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw ExceptionFactory.application(PROCUREMENT_INVALID_ARGUMENT, {
      field: 'quantity'
    })
  }
  return numeric.toString()
}

/** sumQuantities adds one group of quantity strings with minimal decimal-safe precision for current phase 1 tests. */
export function sumQuantities(values: string[]): string {
  const total = values.reduce((sum, value) => sum + Number(normalizeQuantity(value)), 0)
  return total.toString()
}

/** compareQuantity compares two normalized quantity strings using the current phase 1 decimal-safe rules. */
export function compareQuantity(left: string, right: string): number {
  const delta = Number(normalizeQuantity(left)) - Number(normalizeQuantity(right))
  if (Math.abs(delta) < 1e-9) {
    return 0
  }
  return delta < 0 ? -1 : 1
}

/** subtractQuantity subtracts right from left and returns the normalized non-negative result string. */
export function subtractQuantity(left: string, right: string): string {
  const delta = Number(normalizeQuantity(left)) - Number(normalizeQuantity(right))
  if (delta < -1e-9) {
    throw ExceptionFactory.application(PROCUREMENT_FAILED_PRECONDITION, {
      reason: 'quantity underflow'
    })
  }
  return Math.max(delta, 0).toString()
}

/** inferAllocationType converts frozen upstream demand-reference types into the supported allocation enum set. */
export function inferAllocationType(value?: string | null): PurchaseOrderLineAllocationType {
  if (
    value === PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE ||
    value === 'PURCHASE_REQUEST_LINE'
  ) {
    return PurchaseOrderLineAllocationType.PURCHASE_REQUEST_LINE
  }
  if (value === PurchaseOrderLineAllocationType.SALES_ORDER_LINE || value === 'SALES_ORDER_LINE') {
    return PurchaseOrderLineAllocationType.SALES_ORDER_LINE
  }
  if (value === PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND || value === 'FULFILLMENT_DEMAND') {
    return PurchaseOrderLineAllocationType.FULFILLMENT_DEMAND
  }
  return PurchaseOrderLineAllocationType.GENERAL_STOCK
}

/** assertExists rejects missing aggregates or reference data with the frozen NOT_FOUND semantics. */
export function assertExists<T>(value: T | null | undefined, resource: string, identifier?: string): T {
  if (value === null || value === undefined) {
    throw ExceptionFactory.application(PROCUREMENT_NOT_FOUND, {
      resource,
      identifier
    })
  }

  return value
}

/** assertPrecondition enforces frozen business gates without leaking local implementation detail. */
export function assertPrecondition(condition: unknown, reason: string, details?: Record<string, unknown>): void {
  if (!condition) {
    throw ExceptionFactory.application(PROCUREMENT_FAILED_PRECONDITION, {
      reason,
      ...details
    })
  }
}

/** assertNonEmptyContextField keeps missing nested context fields aligned with the contract's UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value: string | null | undefined, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(PROCUREMENT_UNAUTHENTICATED, {
      field
    })
  }
}
