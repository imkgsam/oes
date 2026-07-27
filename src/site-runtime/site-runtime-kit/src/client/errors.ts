import type { SiteRuntimeStatus } from '../types'

export interface SiteRuntimeErrorOptions {
  code: string
  message: string
  httpStatus?: number
  requestId?: string
  traceId?: string
  retryAfterSeconds?: number
  runtimeStatus?: SiteRuntimeStatus
}

// SiteRuntimeError normalizes OES Site-facing API failures into explicit runtime error categories.
export class SiteRuntimeError extends Error {
  readonly code: string
  readonly httpStatus?: number
  readonly requestId?: string
  readonly traceId?: string
  readonly retryAfterSeconds?: number
  readonly runtimeStatus: SiteRuntimeStatus

  constructor(options: SiteRuntimeErrorOptions) {
    super(options.message)
    this.name = 'SiteRuntimeError'
    this.code = options.code
    this.httpStatus = options.httpStatus
    this.requestId = options.requestId
    this.traceId = options.traceId
    this.retryAfterSeconds = options.retryAfterSeconds
    this.runtimeStatus = options.runtimeStatus ?? runtimeStatusForError(options.code)
  }
}

// runtimeStatusForError maps security and infrastructure failures to runtime health states.
export function runtimeStatusForError(code: string): SiteRuntimeStatus {
  if (
    code === 'SITE_DISABLED' ||
    code === 'CREDENTIAL_REVOKED' ||
    code === 'SCOPE_INSUFFICIENT'
  ) {
    return 'blocked'
  }
  if (code === 'LOCAL_STORE_FAILED') {
    return 'failed'
  }
  return 'degraded'
}

// isRetryableRuntimeError applies the frozen P1 retry boundary for OES client calls.
export function isRetryableRuntimeError(error: unknown): boolean {
  if (!(error instanceof SiteRuntimeError)) {
    return true
  }
  if (error.httpStatus === 429 && error.retryAfterSeconds !== undefined) {
    return true
  }
  if (error.code === 'REQUEST_TIMEOUT') {
    return true
  }
  return error.httpStatus === 502 || error.httpStatus === 503 || error.httpStatus === 504
}
