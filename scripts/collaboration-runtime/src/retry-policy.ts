import { fail } from './errors.ts'

export type ExternalFailureKind = 'TRANSIENT' | 'PERMISSION' | 'PERMANENT'

export interface RetryTiming {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  random: () => number
  sleep: (milliseconds: number) => Promise<void>
}

export interface CiRecoveryInput {
  candidateSha: string
  observedSha: string
  failureKind: 'infrastructure' | 'build' | 'type' | 'contract' | 'assertion'
  failedJobReruns: number
}

export interface CiRecoveryDecision {
  action: 'RERUN_FAILED_JOB_ONCE' | 'RETURN_TO_OWNER' | 'PRESERVE_BLOCKER'
  reason: string
}

const DEFAULT_TIMING: RetryTiming = {
  maxRetries: 3,
  baseDelayMs: 250,
  maxDelayMs: 4_000,
  random: Math.random,
  sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
}

/** Classifies an external failure without treating product or assertion failures as transient. */
export function classifyExternalFailure(error: unknown): ExternalFailureKind {
  const message = error instanceof Error ? error.message : String(error)
  if (
    /\b(?:401|403)\b|authentication|credential|permission denied|resource not accessible|forbidden/iu.test(
      message
    )
  )
    return 'PERMISSION'
  if (
    /\b429\b|rate.?limit|timed?\s*out|timeout|connection (?:reset|refused|closed)|temporary failure|service unavailable|bad gateway|gateway timeout|\b(?:502|503|504)\b/iu.test(
      message
    )
  )
    return 'TRANSIENT'
  return 'PERMANENT'
}

/** Runs one idempotent external attempt with at most three exponential-backoff retries. */
export async function retryTransient<T>(
  operation: () => Promise<T>,
  overrides: Partial<RetryTiming> = {}
): Promise<T> {
  const timing = { ...DEFAULT_TIMING, ...overrides }
  if (!Number.isInteger(timing.maxRetries) || timing.maxRetries < 0 || timing.maxRetries > 3)
    fail('RETRY_LIMIT_INVALID', String(timing.maxRetries))
  if (
    !Number.isFinite(timing.baseDelayMs) ||
    !Number.isFinite(timing.maxDelayMs) ||
    timing.baseDelayMs < 0 ||
    timing.maxDelayMs < timing.baseDelayMs
  )
    fail('RETRY_DELAY_INVALID', `${timing.baseDelayMs}:${timing.maxDelayMs}`)
  let retries = 0
  while (true) {
    try {
      return await operation()
    } catch (error) {
      const kind = classifyExternalFailure(error)
      if (kind === 'PERMISSION')
        fail('EXTERNAL_PERMISSION_BLOCKER', error instanceof Error ? error.message : String(error))
      if (kind !== 'TRANSIENT') throw error
      if (retries >= timing.maxRetries)
        fail('TRANSIENT_RETRY_EXHAUSTED', error instanceof Error ? error.message : String(error))
      const exponential = Math.min(timing.maxDelayMs, timing.baseDelayMs * 2 ** retries)
      const random = timing.random()
      if (!Number.isFinite(random)) fail('RETRY_JITTER_INVALID', String(random))
      const jitter = Math.floor(Math.max(0, Math.min(1, random)) * exponential)
      retries += 1
      await timing.sleep(exponential + jitter)
    }
  }
}

/** Limits a CI infrastructure recovery to one failed-job rerun on the unchanged SHA. */
export function decideCiRecovery(input: CiRecoveryInput): CiRecoveryDecision {
  if (!/^[0-9a-f]{40}$/u.test(input.candidateSha) || !/^[0-9a-f]{40}$/u.test(input.observedSha))
    fail('CI_RECOVERY_SHA_INVALID', `${input.candidateSha}:${input.observedSha}`)
  if (!Number.isInteger(input.failedJobReruns) || input.failedJobReruns < 0)
    fail('CI_RECOVERY_RERUN_COUNT_INVALID', String(input.failedJobReruns))
  if (!['infrastructure', 'build', 'type', 'contract', 'assertion'].includes(input.failureKind))
    fail('CI_RECOVERY_FAILURE_KIND_INVALID', String(input.failureKind))
  if (input.observedSha !== input.candidateSha)
    return { action: 'PRESERVE_BLOCKER', reason: 'CI_SHA_CHANGED' }
  if (input.failureKind === 'infrastructure' && input.failedJobReruns === 0)
    return { action: 'RERUN_FAILED_JOB_ONCE', reason: 'SAME_SHA_INFRASTRUCTURE_FAILURE' }
  if (input.failureKind === 'infrastructure')
    return { action: 'PRESERVE_BLOCKER', reason: 'INFRASTRUCTURE_RERUN_EXHAUSTED' }
  return {
    action: 'RETURN_TO_OWNER',
    reason: `NON_INFRASTRUCTURE_${input.failureKind.toUpperCase()}`
  }
}
