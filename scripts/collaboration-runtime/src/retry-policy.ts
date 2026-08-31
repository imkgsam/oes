import {
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync
} from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { assertPathWithin, canonicalJson, objectFingerprint, sha256 } from './canonical.ts'
import { fail } from './errors.ts'
import type { RemoteTrustRoots, TrustedAuthorizationReference } from './types.ts'

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
  observation: TrustedAuthorizationReference
}

export interface CiFailureObservation {
  schemaVersion: 1
  kind: 'OES_CI_FAILED_JOB_OBSERVATION'
  observationFingerprint: string
  status: 'VERIFIED'
  ownerTaskId: string
  transitionId: string
  candidateSha: string
  workflowRun: {
    id: string
    headSha: string
    status: 'completed'
    conclusion: 'failure'
  }
  failedJob: {
    id: string
    workflowRunId: string
    headSha: string
    status: 'completed'
    conclusion: 'failure'
    failureKind: 'infrastructure' | 'build' | 'type' | 'contract' | 'assertion'
  }
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
  ownerTaskId: string
  transitionId: string
  observationFingerprint: string
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
    !/^[0-9a-f]{64}$/u.test(receipt.observationFingerprint) ||
    !/^[0-9a-f]{40}$/u.test(receipt.candidateSha) ||
    !receipt.ownerTaskId.trim() ||
    !receipt.transitionId.trim() ||
    !receipt.workflowRunId.trim() ||
    !receipt.failedJobId.trim()
  )
    fail('CI_RERUN_RECEIPT_FIELDS_INVALID', String(receipt.idempotencyKey))
  const expectedKey = sha256(
    canonicalJson({
      ownerTaskId: receipt.ownerTaskId,
      candidateSha: receipt.candidateSha,
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

/** Reopens a profile-read-only live-CI observation and verifies its canonical run/job relation. */
function loadTrustedCiFailureObservation(
  reference: TrustedAuthorizationReference,
  trust: RemoteTrustRoots
): CiFailureObservation {
  if (
    trust.profileExpectedState !== 'DELIVERY_ACTIVE' ||
    !isAbsolute(trust.authorizationRoot) ||
    !isAbsolute(trust.admissionRoot)
  )
    fail('CI_OBSERVATION_TRUST_CONTEXT_INVALID', trust.ownerTaskId)
  if (!reference || typeof reference !== 'object')
    fail('CI_OBSERVATION_REFERENCE_INVALID', String(reference))
  const referenceExtras = Object.keys(reference).filter(
    (key) => !['path', 'sha256', 'fingerprint'].includes(key)
  )
  if (
    referenceExtras.length ||
    !isAbsolute(reference.path) ||
    !/^[0-9a-f]{64}$/u.test(reference.sha256) ||
    !/^[0-9a-f]{64}$/u.test(reference.fingerprint)
  )
    fail('CI_OBSERVATION_REFERENCE_INVALID', reference.path)
  assertPathWithin(trust.authorizationRoot, reference.path)
  assertPathWithin(realpathSync(trust.authorizationRoot), realpathSync(reference.path))
  const bytes = readFileSync(reference.path)
  if (sha256(bytes) !== reference.sha256) fail('CI_OBSERVATION_SHA_MISMATCH', reference.path)
  const observation = JSON.parse(bytes.toString('utf8')) as CiFailureObservation
  if (!observation || typeof observation !== 'object')
    fail('CI_OBSERVATION_FIELDS_INVALID', reference.path)
  const exactKeys = (value: object, allowed: string[], code: string) => {
    const extras = Object.keys(value).filter((key) => !allowed.includes(key))
    if (extras.length) fail(code, extras.sort().join(','))
  }
  exactKeys(
    observation,
    [
      'schemaVersion',
      'kind',
      'observationFingerprint',
      'status',
      'ownerTaskId',
      'transitionId',
      'candidateSha',
      'workflowRun',
      'failedJob'
    ],
    'CI_OBSERVATION_FIELDS_INVALID'
  )
  if (!observation.workflowRun || !observation.failedJob)
    fail('CI_OBSERVATION_LIVE_TRUTH_REQUIRED', reference.path)
  exactKeys(
    observation.workflowRun,
    ['id', 'headSha', 'status', 'conclusion'],
    'CI_OBSERVATION_RUN_FIELDS_INVALID'
  )
  exactKeys(
    observation.failedJob,
    ['id', 'workflowRunId', 'headSha', 'status', 'conclusion', 'failureKind'],
    'CI_OBSERVATION_JOB_FIELDS_INVALID'
  )
  if (
    observation.schemaVersion !== 1 ||
    observation.kind !== 'OES_CI_FAILED_JOB_OBSERVATION' ||
    observation.status !== 'VERIFIED' ||
    observation.workflowRun.status !== 'completed' ||
    observation.workflowRun.conclusion !== 'failure' ||
    observation.failedJob.status !== 'completed' ||
    observation.failedJob.conclusion !== 'failure'
  )
    fail('CI_OBSERVATION_KIND_INVALID', reference.path)
  if (
    !observation.ownerTaskId.trim() ||
    !observation.transitionId.trim() ||
    !observation.workflowRun.id.trim() ||
    !observation.failedJob.id.trim() ||
    !/^[0-9a-f]{40}$/u.test(observation.candidateSha) ||
    !/^[0-9a-f]{40}$/u.test(observation.workflowRun.headSha) ||
    !/^[0-9a-f]{40}$/u.test(observation.failedJob.headSha) ||
    !['infrastructure', 'build', 'type', 'contract', 'assertion'].includes(
      observation.failedJob.failureKind
    )
  )
    fail('CI_OBSERVATION_FIELDS_INVALID', reference.path)
  if (
    observation.ownerTaskId !== trust.ownerTaskId ||
    observation.transitionId !== trust.profileTransitionId
  )
    fail('CI_OBSERVATION_OWNER_TRANSITION_MISMATCH', reference.path)
  if (
    observation.failedJob.workflowRunId !== observation.workflowRun.id ||
    observation.candidateSha !== observation.workflowRun.headSha ||
    observation.candidateSha !== observation.failedJob.headSha
  )
    fail('CI_OBSERVATION_RUN_JOB_RELATION_INVALID', reference.path)
  if (
    reference.fingerprint !== observation.observationFingerprint ||
    objectFingerprint(
      observation as unknown as Record<string, unknown>,
      'observationFingerprint'
    ) !== observation.observationFingerprint
  )
    fail('CI_OBSERVATION_FINGERPRINT_MISMATCH', reference.path)
  return structuredClone(observation)
}

/** Stores a monotonic rerun receipt at the one path derived from owner/job/SHA identity. */
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
  readonly trust: RemoteTrustRoots

  constructor(store: CiRecoveryReceiptStore, trust: RemoteTrustRoots) {
    this.store = store
    this.trust = trust
  }

  decide(input: CiRecoveryInput): CiRecoveryDecision {
    if (!/^[0-9a-f]{40}$/u.test(input.candidateSha))
      fail('CI_RECOVERY_SHA_INVALID', input.candidateSha)
    const observation = loadTrustedCiFailureObservation(input.observation, this.trust)
    if (observation.candidateSha !== input.candidateSha)
      return { action: 'PRESERVE_BLOCKER', reason: 'CI_SHA_CHANGED', rerunReceipt: null }
    if (observation.failedJob.failureKind === 'infrastructure') {
      const receipt: CiRerunReceipt = {
        schemaVersion: 1,
        kind: 'OES_CI_FAILED_JOB_RERUN_RECEIPT',
        receiptFingerprint: '',
        idempotencyKey: sha256(
          canonicalJson({
            ownerTaskId: observation.ownerTaskId,
            candidateSha: observation.candidateSha,
            failedJobId: observation.failedJob.id
          })
        ),
        ownerTaskId: observation.ownerTaskId,
        transitionId: observation.transitionId,
        observationFingerprint: observation.observationFingerprint,
        candidateSha: observation.candidateSha,
        workflowRunId: observation.workflowRun.id,
        failedJobId: observation.failedJob.id,
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
      reason: `NON_INFRASTRUCTURE_${observation.failedJob.failureKind.toUpperCase()}`,
      rerunReceipt: null
    }
  }
}
