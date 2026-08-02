import { AsyncLocalStorage } from 'node:async_hooks'

const PRINCIPAL_TYPES = new Set(['HUMAN', 'MACHINE', 'DELEGATED'])
const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i

/** Describes only authority and correlation facts already established by a trusted root or server runtime. */
export type TrustedExecutionContextInput = {
  readonly subject: string
  readonly principalType: 'HUMAN' | 'MACHINE' | 'DELEGATED'
  readonly actor?: string
  readonly delegationId?: string
  readonly tenantId?: string
  readonly orgId?: string
  readonly sessionId?: string
  readonly authzVersion?: string | number
  readonly requestId: string
  readonly traceparent: string
  readonly tracestate?: string
}

/** Exposes immutable trusted execution authority without any bearer credential or caller-selected grant. */
export type TrustedExecutionContext = Readonly<TrustedExecutionContextInput>

/** Supplies the current trusted execution root to reusable producer code without accepting request authority. */
export interface TrustedExecutionContextAccessor {
  requireCurrent(): TrustedExecutionContext
}

/** Validates and freezes one root execution context before it enters request-local propagation. */
export function createTrustedExecutionContext(
  input: TrustedExecutionContextInput
): TrustedExecutionContext {
  const subject = requireExactValue(input.subject, 'subject')
  if (!PRINCIPAL_TYPES.has(input.principalType)) {
    throw new Error('Trusted execution context principal type is invalid')
  }

  const actor = optionalExactValue(input.actor, 'actor')
  const delegationId = optionalExactValue(input.delegationId, 'delegation id')
  if (input.principalType === 'DELEGATED' && (actor === undefined || delegationId === undefined)) {
    throw new Error(
      'Trusted execution context DELEGATED authority requires actor and delegation id'
    )
  }
  if (input.principalType !== 'DELEGATED' && (actor !== undefined || delegationId !== undefined)) {
    throw new Error('Trusted execution context actor authority is reserved for DELEGATED execution')
  }

  const tenantId = optionalExactValue(input.tenantId, 'tenant id')
  if (tenantId === '*') {
    throw new Error('Trusted execution context tenant wildcard is forbidden')
  }

  const traceparent = validateTraceparent(input.traceparent)
  const tracestate = validateTracestate(input.tracestate)
  const authzVersion = validateAuthzVersion(input.authzVersion)

  return Object.freeze({
    subject,
    principalType: input.principalType,
    ...(actor === undefined ? {} : { actor }),
    ...(delegationId === undefined ? {} : { delegationId }),
    ...(tenantId === undefined ? {} : { tenantId }),
    ...optionalProperty(input.orgId, 'orgId', 'org id'),
    ...optionalProperty(input.sessionId, 'sessionId', 'session id'),
    ...(authzVersion === undefined ? {} : { authzVersion }),
    requestId: requireExactValue(input.requestId, 'request id'),
    traceparent,
    ...(tracestate === undefined ? {} : { tracestate })
  })
}

/** Keeps one immutable trusted execution context across an async request or job call chain. */
export class AsyncLocalTrustedExecutionContextAccessor implements TrustedExecutionContextAccessor {
  private readonly storage = new AsyncLocalStorage<TrustedExecutionContext>()

  /** Runs one callback under the supplied already-validated trusted execution root. */
  run<T>(context: TrustedExecutionContext, callback: () => T): T {
    if (!Object.isFrozen(context)) {
      throw new Error('Trusted execution context must be immutable')
    }
    return this.storage.run(context, callback)
  }

  /** Returns the active root or fails closed instead of manufacturing anonymous authority. */
  requireCurrent(): TrustedExecutionContext {
    const context = this.storage.getStore()
    if (context === undefined) {
      throw new Error('Trusted execution context is required')
    }
    return context
  }
}

/** Requires one non-empty, already-canonical string fact. */
function requireExactValue(value: string, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value) {
    throw new Error(`Trusted execution context ${label} must be an exact non-empty string`)
  }
  return value
}

/** Reads an optional exact trusted string without converting blank input into authority. */
function optionalExactValue(value: string | undefined, label: string): string | undefined {
  return value === undefined ? undefined : requireExactValue(value, label)
}

/** Copies an optional trusted string under its public context property. */
function optionalProperty(
  value: string | undefined,
  propertyName: string,
  label: string
): Record<string, string> {
  const normalized = optionalExactValue(value, label)
  return normalized === undefined ? {} : { [propertyName]: normalized }
}

/** Accepts only canonical W3C version-00 trace context with non-zero trace and parent identifiers. */
function validateTraceparent(value: string): string {
  const traceparent = requireExactValue(value, 'traceparent').toLowerCase()
  const match = TRACEPARENT_PATTERN.exec(traceparent)
  if (match === null || /^0{32}$/.test(match[1]) || /^0{16}$/.test(match[2])) {
    throw new Error('Trusted execution context traceparent is invalid')
  }
  return traceparent
}

/** Preserves an optional bounded W3C tracestate value only when traceparent is already valid. */
function validateTracestate(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }
  const tracestate = requireExactValue(value, 'tracestate')
  if (
    tracestate.length > 512 ||
    tracestate.split(',').some((member) => !/^[^=,\s]+=[^,]+$/.test(member))
  ) {
    throw new Error('Trusted execution context tracestate is invalid')
  }
  return tracestate
}

/** Keeps the opaque security version exact while rejecting ambiguous or non-finite values. */
function validateAuthzVersion(value: string | number | undefined): string | number | undefined {
  if (value === undefined) {
    return undefined
  }
  if (typeof value === 'string') {
    return requireExactValue(value, 'authorization version')
  }
  if (Number.isInteger(value)) {
    return value
  }
  throw new Error('Trusted execution context authorization version is invalid')
}
