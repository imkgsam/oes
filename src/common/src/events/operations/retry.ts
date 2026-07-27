/** Defines the frozen default bounded delivery backoff used when a subscription has no approved override. */
export const DEFAULT_CONSUMER_BACKOFF_MS = [1_000, 5_000, 30_000, 120_000, 600_000] as const

/** Classifies errors into the only retry categories accepted by common consumer orchestration. */
export function classifyConsumerFailure(error: unknown): 'RETRYABLE' | 'NON_RETRYABLE' {
  const code = typeof error === 'object' && error !== null && typeof (error as { code?: unknown }).code === 'string' ? (error as { code: string }).code : ''
  return ['EVENT_VERSION_UNSUPPORTED', 'EVENT_OWNER_MISMATCH', 'EVENT_TENANT_REQUIRED', 'EVENT_ID_CONFLICT', 'EVENT_ENVELOPE_INVALID'].includes(code) ? 'NON_RETRYABLE' : 'RETRYABLE'
}

/** Selects a bounded delayed-NAK interval rather than relying on immediate redelivery semantics. */
export function retryDelayForAttempt(attempt: number, backoff = DEFAULT_CONSUMER_BACKOFF_MS): number {
  return backoff[Math.max(0, Math.min(backoff.length - 1, attempt - 1))]
}
