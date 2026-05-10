import { ExceptionFactory } from '@oes/common/exceptions'
import {
  MES_ABORTED,
  MES_ALREADY_EXISTS,
  MES_FAILED_PRECONDITION,
  MES_INVALID_ARGUMENT,
  MES_NOT_FOUND,
  MES_UNAUTHENTICATED
} from '../../common/errors/mes.errors'
import { MesAuditContext, MesCommandContext, MesOperatorContext, MesQueryContext, MesTraceContext } from '../../domain/models/mes-mold-records'

/** assertRequiredString rejects blank scalar fields before handlers touch repositories. */
export function assertRequiredString(value: string | null | undefined, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(MES_INVALID_ARGUMENT, { field })
  }
}

/** normalizeOptionalString collapses empty strings into undefined so controllers can map transport defaults safely. */
export function normalizeOptionalString(value?: string | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

/** normalizeCode standardizes MES-facing codes while rejecting invisible or full-width whitespace noise. */
export function normalizeCode(value: string, field: string): string {
  assertRequiredString(value, field)
  if (/[\u0000-\u001f\u007f\u3000]/u.test(value)) {
    throw ExceptionFactory.application(MES_INVALID_ARGUMENT, { field, reason: 'code contains invalid characters' })
  }
  return value.trim().toUpperCase()
}

/** normalizeQuantity removes redundant zeros from decimal-like scalar strings after validation. */
export function normalizeQuantity(value: string, field: string): string {
  assertRequiredString(value, field)
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw ExceptionFactory.application(MES_INVALID_ARGUMENT, { field })
  }
  return numeric.toString()
}

/** assertPositiveQuantity keeps business quantities and life deltas away from zero and negative values. */
export function assertPositiveQuantity(value: string, field: string): string {
  const normalized = normalizeQuantity(value, field)
  if (Number(normalized) <= 0) {
    throw ExceptionFactory.application(MES_INVALID_ARGUMENT, { field })
  }
  return normalized
}

/** assertNonNegativeQuantity keeps counters and limits valid while allowing zero. */
export function assertNonNegativeQuantity(value: string, field: string): string {
  const normalized = normalizeQuantity(value, field)
  if (Number(normalized) < 0) {
    throw ExceptionFactory.application(MES_INVALID_ARGUMENT, { field })
  }
  return normalized
}

/** normalizePageInput applies the shared 1-based paging default used by the MES query surface. */
export function normalizePageInput(page?: number, pageSize?: number): { page: number; pageSize: number } {
  return {
    page: page && page > 0 ? page : 1,
    pageSize: pageSize && pageSize > 0 ? pageSize : 20
  }
}

/** assertExists rejects missing aggregates or reference data with frozen NOT_FOUND semantics. */
export function assertExists<T>(value: T | null | undefined, resource: string, identifier?: string): T {
  if (value === null || value === undefined) {
    throw ExceptionFactory.application(MES_NOT_FOUND, { resource, identifier })
  }
  return value
}

/** assertPrecondition enforces business gates without leaking local implementation detail. */
export function assertPrecondition(condition: unknown, reason: string, details?: Record<string, unknown>): void {
  if (!condition) {
    throw ExceptionFactory.application(MES_FAILED_PRECONDITION, { reason, ...details })
  }
}

/** assertAlreadyAbsent enforces uniqueness and occupancy constraints with ALREADY_EXISTS semantics. */
export function assertAlreadyAbsent(condition: unknown, reason: string, details?: Record<string, unknown>): void {
  if (!condition) {
    throw ExceptionFactory.application(MES_ALREADY_EXISTS, { reason, ...details })
  }
}

/** assertStaleGuard enforces caller-provided current projection and idempotency guards with ABORTED semantics. */
export function assertStaleGuard(condition: unknown, reason: string, details?: Record<string, unknown>): void {
  if (!condition) {
    throw ExceptionFactory.application(MES_ABORTED, { reason, ...details })
  }
}

/** assertOperatorContext enforces the explicit query and command operator context contract. */
export function assertOperatorContext(value?: MesOperatorContext | null): MesOperatorContext {
  if (!value) {
    throw ExceptionFactory.application(MES_UNAUTHENTICATED, { reason: 'operator context is required' })
  }
  assertNonEmptyContextField(value.operatorId, 'operatorContext.operatorId')
  assertNonEmptyContextField(value.operatorType, 'operatorContext.operatorType')
  return value
}

/** assertTraceContext enforces the explicit trace context contract. */
export function assertTraceContext(value?: MesTraceContext | null): MesTraceContext {
  if (!value) {
    throw ExceptionFactory.application(MES_UNAUTHENTICATED, { reason: 'trace context is required' })
  }
  assertNonEmptyContextField(value.traceId, 'traceContext.traceId')
  assertNonEmptyContextField(value.requestId, 'traceContext.requestId')
  return value
}

/** assertAuditContext enforces the explicit audit context required by every management command. */
export function assertAuditContext(value?: MesAuditContext | null): MesAuditContext {
  if (!value) {
    throw ExceptionFactory.application(MES_UNAUTHENTICATED, { reason: 'audit context is required' })
  }
  assertNonEmptyContextField(value.auditId, 'auditContext.auditId')
  assertNonEmptyContextField(value.reason, 'auditContext.reason')
  assertNonEmptyContextField(value.source, 'auditContext.source')
  return value
}

/** assertCommandContext enforces the complete command context envelope before state-changing use cases run. */
export function assertCommandContext(value: MesCommandContext): void {
  assertRequiredString(value.tenantId, 'tenantId')
  assertRequiredString(value.commandId, 'commandId')
  assertOperatorContext(value.operatorContext)
  assertTraceContext(value.traceContext)
  assertAuditContext(value.auditContext)
}

/** assertQueryContext enforces the complete query context envelope before read-side use cases run. */
export function assertQueryContext(value: MesQueryContext): void {
  assertRequiredString(value.tenantId, 'tenantId')
  assertOperatorContext(value.operatorContext)
  assertTraceContext(value.traceContext)
}

/** resolveContextOrgId derives the effective org scope consistently from explicit context or operator context. */
export function resolveContextOrgId(value: MesQueryContext): string | null {
  return normalizeOptionalString(value.orgId) ?? normalizeOptionalString(value.operatorContext.orgId) ?? null
}

/** assertDateRange ensures query date filters remain ordered in the phase 1 surface. */
export function assertDateRange(from: string | undefined, to: string | undefined, field: string): void {
  if (from && to && from > to) {
    throw ExceptionFactory.application(MES_INVALID_ARGUMENT, { field, reason: 'date range is invalid' })
  }
}

/** assertInvalidArgument maps complex invalid inputs to the shared INVALID_ARGUMENT contract. */
export function assertInvalidArgument(condition: unknown, reason: string, details?: Record<string, unknown>): void {
  if (!condition) {
    throw ExceptionFactory.application(MES_INVALID_ARGUMENT, { reason, ...details })
  }
}

/** nowIso returns one UTC timestamp for command facts and projections. */
export function nowIso(): string {
  return new Date().toISOString()
}

/** assertNonEmptyContextField keeps missing nested context fields aligned with UNAUTHENTICATED semantics. */
function assertNonEmptyContextField(value: string | null | undefined, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ExceptionFactory.application(MES_UNAUTHENTICATED, { field })
  }
}
