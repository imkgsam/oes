import { ExceptionFactory } from '@oes/common/exceptions'
import {
  FINANCE_INVALID_ARGUMENT,
  FINANCE_UNAUTHENTICATED
} from '../../common/errors/finance.errors'
import {
  FinanceAuditContext,
  FinanceOperatorContext,
  FinanceTraceContext
} from '../../domain/models/finance-records'

/** assertRequiredString rejects blank scalar fields before command or query handlers touch repositories. */
export function assertRequiredString(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(FINANCE_INVALID_ARGUMENT, { field })
  }
}

/** assertOptionalDateString rejects malformed ISO-like date-time strings when one optional field is provided. */
export function assertOptionalDateString(value: string | null | undefined, field: string): void {
  if (value == null || value === '') {
    return
  }

  if (Number.isNaN(Date.parse(value))) {
    throw ExceptionFactory.application(FINANCE_INVALID_ARGUMENT, { field })
  }
}

/** normalizePageInput applies the shared 1-based paging default used by the frozen phase 1A query surface. */
export function normalizePageInput(
  page?: number,
  pageSize?: number
): { page: number; pageSize: number } {
  const normalizedPage = page && page > 0 ? page : 1
  const normalizedPageSize = pageSize && pageSize > 0 ? pageSize : 20
  return {
    page: normalizedPage,
    pageSize: normalizedPageSize
  }
}

/** assertOperatorContext enforces the explicit command and query operator context contract frozen for finance-service. */
export function assertOperatorContext(value?: FinanceOperatorContext | null): FinanceOperatorContext {
  if (!value) {
    throw ExceptionFactory.application(FINANCE_UNAUTHENTICATED, {
      reason: 'operator context is required'
    })
  }

  assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId')
  assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType')
  return value
}

/** assertTraceContext enforces the explicit trace context contract frozen for finance-service. */
export function assertTraceContext(value?: FinanceTraceContext | null): FinanceTraceContext {
  if (!value) {
    throw ExceptionFactory.application(FINANCE_UNAUTHENTICATED, {
      reason: 'trace context is required'
    })
  }

  assertNonEmptyContextField(value.traceId, 'traceContext.traceId')
  assertNonEmptyContextField(value.requestId, 'traceContext.requestId')
  return value
}

/** assertAuditContext enforces the explicit audit context contract required by every management command. */
export function assertAuditContext(value?: FinanceAuditContext | null): FinanceAuditContext {
  if (!value) {
    throw ExceptionFactory.application(FINANCE_UNAUTHENTICATED, {
      reason: 'audit context is required'
    })
  }

  assertNonEmptyContextField(value.auditId, 'auditContext.auditId')
  assertNonEmptyContextField(value.reason, 'auditContext.reason')
  assertNonEmptyContextField(value.source, 'auditContext.source')
  return value
}

/** paginate slices a fully filtered record list into the standard phase 1A page envelope. */
export function paginate<T>(items: T[], page: number, pageSize: number): { pageItems: T[]; total: number } {
  const start = (page - 1) * pageSize
  return {
    pageItems: items.slice(start, start + pageSize),
    total: items.length
  }
}

/** assertNonEmptyContextField keeps missing nested context fields aligned with the contract's UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value: string | null | undefined, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(FINANCE_UNAUTHENTICATED, {
      field
    })
  }
}
