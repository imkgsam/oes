import { ExceptionFactory } from '@oes/common/exceptions'
import {
  CRM_INVALID_ARGUMENT,
  CRM_UNAUTHENTICATED
} from '../../common/errors/crm.errors'
import {
  CrmAuditContext,
  CrmOperatorContext,
  CrmTraceContext,
  CustomerStatus
} from '../../domain/models/crm-records'

/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
export function assertRequiredString(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(CRM_INVALID_ARGUMENT, { field })
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

/** normalizeTags trims, de-duplicates, and preserves the incoming CRM business-tag order. */
export function normalizeTags(tags?: string[] | null): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()

  for (const raw of tags ?? []) {
    const value = raw.trim()
    if (value.length === 0 || seen.has(value)) {
      continue
    }
    seen.add(value)
    normalized.push(value)
  }

  return normalized
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

/** assertOperatorContext enforces the explicit command and query operator context contract frozen for crm-service. */
export function assertOperatorContext(value?: CrmOperatorContext | null): CrmOperatorContext {
  if (!value) {
    throw ExceptionFactory.application(CRM_UNAUTHENTICATED, {
      reason: 'operator context is required'
    })
  }

  assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId')
  assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType')
  return value
}

/** assertTraceContext enforces the explicit trace context contract frozen for crm-service. */
export function assertTraceContext(value?: CrmTraceContext | null): CrmTraceContext {
  if (!value) {
    throw ExceptionFactory.application(CRM_UNAUTHENTICATED, {
      reason: 'trace context is required'
    })
  }

  assertNonEmptyContextField(value.traceId, 'traceContext.traceId')
  assertNonEmptyContextField(value.requestId, 'traceContext.requestId')
  return value
}

/** assertAuditContext enforces the explicit audit context contract required by every CRM management command. */
export function assertAuditContext(value?: CrmAuditContext | null): CrmAuditContext {
  if (!value) {
    throw ExceptionFactory.application(CRM_UNAUTHENTICATED, {
      reason: 'audit context is required'
    })
  }

  assertNonEmptyContextField(value.auditId, 'auditContext.auditId')
  assertNonEmptyContextField(value.reason, 'auditContext.reason')
  assertNonEmptyContextField(value.source, 'auditContext.source')
  return value
}

/** assertKnownCustomerStatus rejects unsupported enum values outside the frozen phase 1 CRM status set. */
export function assertKnownCustomerStatus(status: CustomerStatus): CustomerStatus {
  if (
    status !== CustomerStatus.ACTIVE_CUSTOMER &&
    status !== CustomerStatus.BLOCKED &&
    status !== CustomerStatus.ARCHIVED
  ) {
    throw ExceptionFactory.application(CRM_INVALID_ARGUMENT, {
      field: 'targetStatus'
    })
  }

  return status
}

/** assertNonEmptyContextField keeps missing nested context fields aligned with the contract's UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value: string | null | undefined, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(CRM_UNAUTHENTICATED, {
      field
    })
  }
}
