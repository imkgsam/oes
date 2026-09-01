import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const trustedSamples = new WeakSet()

/** Reopens one GitHub-readback sample from the effective-profile authorization root. */
export function loadTrustedCiPerformanceSample(reference, trust) {
  if (!reference || typeof reference !== 'object')
    throw new Error('CI_PERFORMANCE_REFERENCE_REQUIRED')
  if (!path.isAbsolute(reference.path) || !path.isAbsolute(trust?.authorizationRoot ?? ''))
    throw new Error('CI_PERFORMANCE_TRUST_ROOT_INVALID')
  const root = fs.realpathSync(trust.authorizationRoot)
  const target = fs.realpathSync(reference.path)
  const relative = path.relative(root, target)
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error('CI_PERFORMANCE_SAMPLE_OUTSIDE_TRUST_ROOT')
  const bytes = fs.readFileSync(target)
  if (!digest(reference.sha256) || sha256(bytes) !== reference.sha256)
    throw new Error('CI_PERFORMANCE_SAMPLE_SHA_MISMATCH')
  const sample = JSON.parse(bytes.toString('utf8'))
  if (
    sample.schemaVersion !== 1 ||
    sample.kind !== 'OES_CI_PERFORMANCE_SAMPLE' ||
    sample.source !== 'GITHUB_ACTIONS_READBACK' ||
    !/^[^/\s]+\/[^/\s]+$/.test(sample.repository ?? '') ||
    reference.fingerprint !== sample.sampleFingerprint ||
    !digest(sample.sampleFingerprint) ||
    sample.sampleFingerprint !== fingerprint(sample, 'sampleFingerprint')
  )
    throw new Error('CI_PERFORMANCE_SAMPLE_PROVENANCE_INVALID')
  deepFreeze(sample)
  trustedSamples.add(sample)
  return sample
}

/** Evaluates the frozen optimized-CI cutover thresholds from one complete task-local sample. */
export function evaluateCiPerformanceCutover(sample) {
  if (!trustedSamples.has(sample)) throw new Error('CI_PERFORMANCE_TRUSTED_SAMPLE_REQUIRED')
  const pairs = requiredArray(sample.acceptedPairs, 'acceptedPairs')
  const superseded = requiredArray(sample.supersededPairs, 'supersededPairs')
  const stages = requiredArray(sample.stageSequences, 'stageSequences')
  const attempts = requiredArray(sample.testAttempts, 'testAttempts')
  const observationIds = new Set()
  const runIdentities = new Set()
  for (const [collection, values] of [
    ['acceptedPairs', pairs],
    ['supersededPairs', superseded],
    ['stageSequences', stages],
    ['testAttempts', attempts]
  ])
    for (const value of values)
      validatePairedObservation(value, collection, observationIds, runIdentities)
  if (
    stages.some((stage) => !Number.isInteger(stage.pullRequestCount) || stage.pullRequestCount < 3)
  )
    throw new Error('CI_PERFORMANCE_STAGE_SEQUENCE_INVALID')
  if (
    pairs.some(
      (pair) =>
        !['COLD', 'WARM'].includes(pair.cacheDisposition) ||
        typeof pair.duplicateFullMain !== 'boolean'
    )
  )
    throw new Error('CI_PERFORMANCE_ACCEPTED_PAIR_INVALID')
  if (superseded.some((pair) => !Number.isFinite(pair.cancelSeconds) || pair.cancelSeconds < 0))
    throw new Error('CI_PERFORMANCE_SUPERSEDED_PAIR_INVALID')
  if (
    attempts.some(
      (attempt) => attempt.authoritative !== true || typeof attempt.flakyRerun !== 'boolean'
    )
  )
    throw new Error('CI_PERFORMANCE_ATTEMPT_NOT_AUTHORITATIVE')
  const windowDays = (Date.parse(sample.windowEnd) - Date.parse(sample.windowStart)) / 86_400_000
  if (!Number.isFinite(windowDays) || windowDays < 0 || windowDays > 30)
    throw new Error('CI_PERFORMANCE_WINDOW_INVALID')
  const candidateP95 = nearestRank(pairs.map((pair) => pair.optimizedCandidateSeconds))
  const mainP95 = nearestRank(pairs.map((pair) => pair.optimizedMainSeconds))
  const completeJobMinuteSet = [...pairs, ...superseded, ...stages, ...attempts]
  const controlJobMinutes = sum(completeJobMinuteSet, 'controlJobMinutes')
  const optimizedJobMinutes = sum(completeJobMinuteSet, 'optimizedJobMinutes')
  const controlStageSeconds = sum(stages, 'controlSeconds')
  const optimizedStageSeconds = sum(stages, 'optimizedSeconds')
  const flakyAttempts = attempts.filter((attempt) => attempt.flakyRerun === true).length
  const metrics = {
    acceptedPairCount: pairs.length,
    coldCandidateCount: pairs.filter((pair) => pair.cacheDisposition === 'COLD').length,
    supersededPairCount: superseded.length,
    stageSequenceCount: stages.length,
    authoritativeAttemptCount: attempts.length,
    candidateP95Seconds: candidateP95,
    mainP95Seconds: mainP95,
    duplicateFullMainCount: pairs.filter((pair) => pair.duplicateFullMain === true).length,
    slowCancellationCount: superseded.filter((pair) => pair.cancelSeconds > 60).length,
    jobMinuteReduction: ratioReduction(controlJobMinutes, optimizedJobMinutes),
    stageDurationReduction: ratioReduction(controlStageSeconds, optimizedStageSeconds),
    flakyRerunRate: attempts.length === 0 ? 1 : flakyAttempts / attempts.length,
    windowDays
  }
  const failures = []
  if (metrics.acceptedPairCount < 20) failures.push('ACCEPTED_PAIRS_LT_20')
  if (metrics.coldCandidateCount < 5) failures.push('COLD_CANDIDATES_LT_5')
  if (metrics.supersededPairCount < 10) failures.push('SUPERSEDED_PAIRS_LT_10')
  if (metrics.stageSequenceCount < 5) failures.push('STAGE_SEQUENCES_LT_5')
  if (metrics.authoritativeAttemptCount < 50) failures.push('TEST_ATTEMPTS_LT_50')
  if (metrics.candidateP95Seconds > 300) failures.push('CANDIDATE_P95_GT_300S')
  if (metrics.mainP95Seconds > 120) failures.push('MAIN_P95_GT_120S')
  if (metrics.duplicateFullMainCount !== 0) failures.push('DUPLICATE_FULL_MAIN_NONZERO')
  if (metrics.slowCancellationCount !== 0) failures.push('STALE_CANCEL_GT_60S')
  if (metrics.jobMinuteReduction < 0.35) failures.push('JOB_MINUTE_REDUCTION_LT_35PCT')
  if (metrics.stageDurationReduction < 0.5) failures.push('STAGE_DURATION_REDUCTION_LT_50PCT')
  if (metrics.flakyRerunRate >= 0.02) failures.push('FLAKY_RERUN_RATE_GTE_2PCT')
  return Object.freeze({
    status: failures.length === 0 ? 'CUTOVER_READY' : 'KEEP_LEGACY_AUTHORITATIVE',
    metrics: Object.freeze(metrics),
    failures: Object.freeze(failures)
  })
}

/** Requires a unique exact workload pair with distinct bound control/shadow executions. */
function validatePairedObservation(value, collection, observationIds, runIdentities) {
  if (
    value.paired !== true ||
    !digest(value.controlWorkloadFingerprint) ||
    value.controlWorkloadFingerprint !== value.shadowWorkloadFingerprint
  )
    throw new Error('CI_PERFORMANCE_UNPAIRED_OBSERVATION')
  if (
    !digest(value.controlExecutionFingerprint) ||
    !digest(value.shadowExecutionFingerprint) ||
    value.controlExecutionFingerprint === value.shadowExecutionFingerprint ||
    value.controlMode !== 'LEGACY_CONTROL' ||
    value.shadowMode !== 'OPTIMIZED_SHADOW'
  )
    throw new Error('CI_PERFORMANCE_EXECUTION_BINDING_INVALID')
  if (
    typeof value.observationId !== 'string' ||
    value.observationId.length === 0 ||
    observationIds.has(value.observationId)
  )
    throw new Error('CI_PERFORMANCE_OBSERVATION_ID_INVALID')
  observationIds.add(value.observationId)
  for (const identity of [value.controlRunIdentity, value.shadowRunIdentity]) {
    if (typeof identity !== 'string' || identity.length === 0 || runIdentities.has(identity))
      throw new Error('CI_PERFORMANCE_RUN_IDENTITY_INVALID')
    runIdentities.add(identity)
  }
  if (
    value.controlRunIdentity === value.shadowRunIdentity ||
    typeof value.controlArtifactIdentity !== 'string' ||
    value.controlArtifactIdentity.length === 0 ||
    typeof value.shadowArtifactIdentity !== 'string' ||
    value.shadowArtifactIdentity.length === 0 ||
    value.controlArtifactIdentity === value.shadowArtifactIdentity
  )
    throw new Error(`CI_PERFORMANCE_ARTIFACT_BINDING_INVALID collection=${collection}`)
  if (
    !/^\d+:[1-9]\d*$/.test(value.controlRunIdentity) ||
    !/^\d+:[1-9]\d*$/.test(value.shadowRunIdentity) ||
    !/^\d+:[0-9a-f]{64}$/.test(value.controlArtifactIdentity) ||
    !/^\d+:[0-9a-f]{64}$/.test(value.shadowArtifactIdentity) ||
    !digest(value.githubReadbackFingerprint)
  )
    throw new Error(`CI_PERFORMANCE_GITHUB_PROVENANCE_INVALID collection=${collection}`)
  for (const key of ['controlJobMinutes', 'optimizedJobMinutes'])
    if (!Number.isFinite(value[key]) || value[key] < 0)
      throw new Error(`CI_PERFORMANCE_METRIC_INVALID key=${key}`)
}

/** Checks one canonical lowercase SHA-256 identity. */
function digest(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
}

/** Hashes exact artifact or sample bytes. */
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/** Computes one stable canonical record fingerprint excluding its fingerprint field. */
function fingerprint(value, omitted) {
  const clone = { ...value }
  delete clone[omitted]
  return sha256(canonical(clone))
}

/** Canonicalizes nested JSON keys for reproducible trust-root receipts. */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`)
      .join(',')}}`
  return JSON.stringify(value)
}

/** Prevents a verified sample from being changed after provenance validation. */
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

/** Implements nearest-rank P95 over the complete observation vector. */
function nearestRank(values) {
  if (values.length === 0) return Number.POSITIVE_INFINITY
  const ordered = [...values]
  for (const value of ordered)
    if (!Number.isFinite(value) || value < 0) throw new Error('CI_PERFORMANCE_METRIC_INVALID')
  ordered.sort((left, right) => left - right)
  return ordered[Math.ceil(0.95 * ordered.length) - 1]
}

/** Sums one non-negative numeric metric without dropping failed or slow observations. */
function sum(values, key) {
  return values.reduce((total, value) => {
    if (!Number.isFinite(value[key]) || value[key] < 0)
      throw new Error(`CI_PERFORMANCE_METRIC_INVALID key=${key}`)
    return total + value[key]
  }, 0)
}

/** Calculates bounded fractional reduction and rejects a missing control denominator. */
function ratioReduction(control, optimized) {
  if (!(control > 0) || optimized < 0) throw new Error('CI_PERFORMANCE_REDUCTION_INVALID')
  return (control - optimized) / control
}

/** Requires a complete observation array. */
function requiredArray(value, field) {
  if (!Array.isArray(value)) throw new Error(`CI_PERFORMANCE_ARRAY_REQUIRED field=${field}`)
  return value
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const profileIndex = process.argv.indexOf('--profile-report')
    const referenceIndex = process.argv.indexOf('--sample-reference')
    if (
      profileIndex < 0 ||
      !process.argv[profileIndex + 1] ||
      referenceIndex < 0 ||
      !process.argv[referenceIndex + 1]
    )
      throw new Error('CI_PERFORMANCE_TRUSTED_INPUT_REQUIRED')
    const { loadRemoteTrustRootsFromProfileReport, verifyEffectiveProfileReport } =
      await import('../collaboration-runtime/src/profile-preflight.ts')
    const report = verifyEffectiveProfileReport(
      JSON.parse(fs.readFileSync(process.argv[profileIndex + 1], 'utf8'))
    )
    const trust = loadRemoteTrustRootsFromProfileReport(report)
    const sample = loadTrustedCiPerformanceSample(
      JSON.parse(fs.readFileSync(process.argv[referenceIndex + 1], 'utf8')),
      trust
    )
    process.stdout.write(`${JSON.stringify(evaluateCiPerformanceCutover(sample))}\n`)
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
