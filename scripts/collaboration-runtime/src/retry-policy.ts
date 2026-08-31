import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { canonicalJson, objectFingerprint, sha256 } from './canonical.ts'
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
  workflowRunId: string
  failedJobId: string
}

export interface CiRecoveryDecision {
  action:
    | 'RERUN_FAILED_JOB_ONCE'
    | 'REPLAY_EXISTING_RERUN_RECEIPT'
    | 'RETURN_TO_OWNER'
    | 'PRESERVE_BLOCKER'
  reason: string
  rerunReceipt: CiRerunReceipt | null
}

export interface CiRerunReceipt {
  schemaVersion: 1
  kind: 'OES_CI_FAILED_JOB_RERUN_RECEIPT'
  receiptFingerprint: string
  idempotencyKey: string
  candidateSha: string
  workflowRunId: string
  failedJobId: string
  action: 'RERUN_FAILED_JOB_ONCE'
}

export interface CiRecoveryReceiptStore {
  createOrRead(receipt: CiRerunReceipt): { created: boolean; receipt: CiRerunReceipt }
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

/** Validates one immutable same-SHA failed-job rerun receipt. */
function validateCiRerunReceipt(receipt: CiRerunReceipt): CiRerunReceipt {
  if (
    !receipt ||
    receipt.schemaVersion !== 1 ||
    receipt.kind !== 'OES_CI_FAILED_JOB_RERUN_RECEIPT' ||
    receipt.action !== 'RERUN_FAILED_JOB_ONCE'
  )
    fail('CI_RERUN_RECEIPT_KIND_INVALID', String(receipt?.idempotencyKey))
  if (
    !/^[0-9a-f]{64}$/u.test(receipt.idempotencyKey) ||
    !/^[0-9a-f]{64}$/u.test(receipt.receiptFingerprint) ||
    !/^[0-9a-f]{40}$/u.test(receipt.candidateSha) ||
    !receipt.workflowRunId.trim() ||
    !receipt.failedJobId.trim()
  )
    fail('CI_RERUN_RECEIPT_FIELDS_INVALID', String(receipt.idempotencyKey))
  const expectedKey = sha256(
    canonicalJson({
      candidateSha: receipt.candidateSha,
      workflowRunId: receipt.workflowRunId,
      failedJobId: receipt.failedJobId
    })
  )
  if (receipt.idempotencyKey !== expectedKey)
    fail('CI_RERUN_IDEMPOTENCY_KEY_MISMATCH', receipt.idempotencyKey)
  if (
    objectFingerprint(receipt as unknown as Record<string, unknown>, 'receiptFingerprint') !==
    receipt.receiptFingerprint
  )
    fail('CI_RERUN_RECEIPT_FINGERPRINT_MISMATCH', receipt.idempotencyKey)
  return structuredClone(receipt)
}

/** Stores a monotonic rerun receipt at the one path derived from workflow/job/SHA identity. */
export class FileCiRecoveryReceiptStore implements CiRecoveryReceiptStore {
  readonly root: string

  constructor(root: string) {
    this.root = resolve(root, 'ci-rerun-receipts')
    mkdirSync(this.root, { recursive: true })
  }

  createOrRead(receiptInput: CiRerunReceipt): { created: boolean; receipt: CiRerunReceipt } {
    const receipt = validateCiRerunReceipt(receiptInput)
    const path = join(this.root, `${receipt.idempotencyKey}.json`)
    let descriptor: number | null = null
    try {
      descriptor = openSync(path, 'wx', 0o600)
      writeFileSync(descriptor, `${canonicalJson(receipt)}\n`, 'utf8')
      fsyncSync(descriptor)
      return { created: true, receipt }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      const existing = validateCiRerunReceipt(
        JSON.parse(readFileSync(path, 'utf8')) as CiRerunReceipt
      )
      if (canonicalJson(existing) !== canonicalJson(receipt))
        fail('CI_RERUN_RECEIPT_REPLAY_MISMATCH', receipt.idempotencyKey)
      return { created: false, receipt: existing }
    } finally {
      if (descriptor !== null) closeSync(descriptor)
    }
  }
}

/** Limits one exact CI infrastructure failure to one monotonic failed-job rerun receipt. */
export class CiRecoveryController {
  readonly store: CiRecoveryReceiptStore

  constructor(store: CiRecoveryReceiptStore) {
    this.store = store
  }

  decide(input: CiRecoveryInput): CiRecoveryDecision {
    if (!/^[0-9a-f]{40}$/u.test(input.candidateSha) || !/^[0-9a-f]{40}$/u.test(input.observedSha))
      fail('CI_RECOVERY_SHA_INVALID', `${input.candidateSha}:${input.observedSha}`)
    if (
      typeof input.workflowRunId !== 'string' ||
      !input.workflowRunId.trim() ||
      typeof input.failedJobId !== 'string' ||
      !input.failedJobId.trim()
    )
      fail('CI_RECOVERY_EXACT_JOB_IDENTITY_REQUIRED', `${input.workflowRunId}:${input.failedJobId}`)
    if (!['infrastructure', 'build', 'type', 'contract', 'assertion'].includes(input.failureKind))
      fail('CI_RECOVERY_FAILURE_KIND_INVALID', String(input.failureKind))
    if (input.observedSha !== input.candidateSha)
      return { action: 'PRESERVE_BLOCKER', reason: 'CI_SHA_CHANGED', rerunReceipt: null }
    if (input.failureKind === 'infrastructure') {
      const receipt: CiRerunReceipt = {
        schemaVersion: 1,
        kind: 'OES_CI_FAILED_JOB_RERUN_RECEIPT',
        receiptFingerprint: '',
        idempotencyKey: sha256(
          canonicalJson({
            candidateSha: input.candidateSha,
            workflowRunId: input.workflowRunId,
            failedJobId: input.failedJobId
          })
        ),
        candidateSha: input.candidateSha,
        workflowRunId: input.workflowRunId,
        failedJobId: input.failedJobId,
        action: 'RERUN_FAILED_JOB_ONCE'
      }
      receipt.receiptFingerprint = objectFingerprint(
        receipt as unknown as Record<string, unknown>,
        'receiptFingerprint'
      )
      const stored = this.store.createOrRead(receipt)
      return stored.created
        ? {
            action: 'RERUN_FAILED_JOB_ONCE',
            reason: 'SAME_SHA_INFRASTRUCTURE_FAILURE',
            rerunReceipt: stored.receipt
          }
        : {
            action: 'REPLAY_EXISTING_RERUN_RECEIPT',
            reason: 'SAME_FAILURE_RERUN_ALREADY_RECORDED',
            rerunReceipt: stored.receipt
          }
    }
    return {
      action: 'RETURN_TO_OWNER',
      reason: `NON_INFRASTRUCTURE_${input.failureKind.toUpperCase()}`,
      rerunReceipt: null
    }
  }
}
