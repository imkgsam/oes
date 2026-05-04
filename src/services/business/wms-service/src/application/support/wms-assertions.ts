import { ExceptionFactory } from '@oes/common/exceptions'
import {
  WMS_FAILED_PRECONDITION,
  WMS_INVALID_ARGUMENT,
  WMS_NOT_FOUND,
  WMS_UNAUTHENTICATED
} from '../../common/errors/wms.errors'
import {
  InventoryStatus,
  ReceiptPhysicalDiscrepancyType,
  ReceiptSourceType,
  ReceiptTrackingRefType,
  RestrictedStatusReasonCode,
  WmsAuditContext,
  WmsOperatorContext,
  WmsTraceContext
} from '../../domain/models/wms-records'

/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
export function assertRequiredString(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, { field })
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

/** normalizePageInput applies the shared 1-based paging default used by the frozen WMS query surface. */
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

/** assertOperatorContext enforces the explicit query and command operator context contract frozen for WMS. */
export function assertOperatorContext(value?: WmsOperatorContext | null): WmsOperatorContext {
  if (!value) {
    throw ExceptionFactory.application(WMS_UNAUTHENTICATED, {
      reason: 'operator context is required'
    })
  }

  assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId')
  assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType')
  return value
}

/** assertTraceContext enforces the explicit trace context contract frozen for WMS. */
export function assertTraceContext(value?: WmsTraceContext | null): WmsTraceContext {
  if (!value) {
    throw ExceptionFactory.application(WMS_UNAUTHENTICATED, {
      reason: 'trace context is required'
    })
  }

  assertNonEmptyContextField(value.traceId, 'traceContext.traceId')
  assertNonEmptyContextField(value.requestId, 'traceContext.requestId')
  return value
}

/** assertAuditContext enforces the explicit audit context contract required by every WMS management command. */
export function assertAuditContext(value?: WmsAuditContext | null): WmsAuditContext {
  if (!value) {
    throw ExceptionFactory.application(WMS_UNAUTHENTICATED, {
      reason: 'audit context is required'
    })
  }

  assertNonEmptyContextField(value.auditId, 'auditContext.auditId')
  assertNonEmptyContextField(value.reason, 'auditContext.reason')
  assertNonEmptyContextField(value.source, 'auditContext.source')
  return value
}

/** assertKnownReceiptSourceType rejects unsupported enum values outside the frozen receipt source set. */
export function assertKnownReceiptSourceType(value: ReceiptSourceType): ReceiptSourceType {
  if (value !== ReceiptSourceType.MANUAL && value !== ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, {
      field: 'receiptSourceType'
    })
  }

  return value
}

/** assertKnownInventoryStatus rejects unsupported enum values outside the frozen inventory status set. */
export function assertKnownInventoryStatus(value: InventoryStatus): InventoryStatus {
  if (value !== InventoryStatus.AVAILABLE && value !== InventoryStatus.RESTRICTED) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, {
      field: 'inventoryStatus'
    })
  }

  return value
}

/** assertKnownRestrictedReasonCode rejects unsupported enum values outside the frozen restricted reason set. */
export function assertKnownRestrictedReasonCode(
  value: RestrictedStatusReasonCode
): RestrictedStatusReasonCode {
  if (
    value !== RestrictedStatusReasonCode.DAMAGED &&
    value !== RestrictedStatusReasonCode.QUALITY_HOLD &&
    value !== RestrictedStatusReasonCode.PENDING_IDENTIFICATION &&
    value !== RestrictedStatusReasonCode.PENDING_DECISION &&
    value !== RestrictedStatusReasonCode.OTHER
  ) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, {
      field: 'restrictedReason.reasonCode'
    })
  }

  return value
}

/** assertKnownTrackingRefType rejects unsupported tracking-ref enum values outside the frozen set. */
export function assertKnownTrackingRefType(value: ReceiptTrackingRefType): ReceiptTrackingRefType {
  if (
    value !== ReceiptTrackingRefType.BOX_CODE &&
    value !== ReceiptTrackingRefType.UNIT_CODE &&
    value !== ReceiptTrackingRefType.EXTERNAL_CODE &&
    value !== ReceiptTrackingRefType.FREE_TEXT
  ) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, {
      field: 'trackingRefs.trackingRefType'
    })
  }

  return value
}

/** assertKnownPhysicalDiscrepancyType rejects unsupported physical discrepancy enum values outside the frozen set. */
export function assertKnownPhysicalDiscrepancyType(
  value: ReceiptPhysicalDiscrepancyType
): ReceiptPhysicalDiscrepancyType {
  if (
    value !== ReceiptPhysicalDiscrepancyType.SHORT_RECEIVED &&
    value !== ReceiptPhysicalDiscrepancyType.OVER_RECEIVED &&
    value !== ReceiptPhysicalDiscrepancyType.DAMAGED &&
    value !== ReceiptPhysicalDiscrepancyType.WRONG_ITEM &&
    value !== ReceiptPhysicalDiscrepancyType.QUALITY_HOLD &&
    value !== ReceiptPhysicalDiscrepancyType.OTHER
  ) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, {
      field: 'physicalDiscrepancy.discrepancyType'
    })
  }

  return value
}

/** assertPositiveQuantity keeps frozen WMS quantity inputs away from zero and negative values. */
export function assertPositiveQuantity(value: string, field: string): string {
  assertRequiredString(value, field)
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, { field })
  }
  return normalizeQuantity(value)
}

/** normalizeQuantity removes redundant leading and trailing zeros from one decimal-like scalar string. */
export function normalizeQuantity(value: string): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, {
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

/** assertExists rejects missing aggregates or reference data with the frozen NOT_FOUND semantics. */
export function assertExists<T>(value: T | null | undefined, resource: string, identifier?: string): T {
  if (value === null || value === undefined) {
    throw ExceptionFactory.application(WMS_NOT_FOUND, {
      resource,
      identifier
    })
  }

  return value
}

/** assertPrecondition enforces frozen business gates without leaking local implementation detail. */
export function assertPrecondition(condition: unknown, reason: string, details?: Record<string, unknown>): void {
  if (!condition) {
    throw ExceptionFactory.application(WMS_FAILED_PRECONDITION, {
      reason,
      ...details
    })
  }
}

/** assertDateRange ensures query date filters remain ordered in the frozen phase 1 surface. */
export function assertDateRange(from: string | undefined, to: string | undefined, field: string): void {
  if (from && to && from > to) {
    throw ExceptionFactory.application(WMS_INVALID_ARGUMENT, {
      field,
      reason: 'date range is invalid'
    })
  }
}

/** assertNonEmptyContextField keeps missing nested context fields aligned with the contract's UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value: string | null | undefined, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(WMS_UNAUTHENTICATED, {
      field
    })
  }
}
