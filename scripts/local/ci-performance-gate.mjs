import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Evaluates the frozen optimized-CI cutover thresholds from one complete task-local sample. */
export function evaluateCiPerformanceCutover(sample) {
  const pairs = requiredArray(sample.acceptedPairs, 'acceptedPairs')
  const superseded = requiredArray(sample.supersededPairs, 'supersededPairs')
  const stages = requiredArray(sample.stageSequences, 'stageSequences')
  const attempts = requiredArray(sample.testAttempts, 'testAttempts')
  for (const pair of [...pairs, ...superseded])
    if (!pair.paired || pair.controlWorkloadFingerprint !== pair.shadowWorkloadFingerprint)
      throw new Error('CI_PERFORMANCE_UNPAIRED_OBSERVATION')
  if (stages.some((stage) => !stage.paired || stage.pullRequestCount < 3))
    throw new Error('CI_PERFORMANCE_STAGE_SEQUENCE_INVALID')
  const windowDays = (Date.parse(sample.windowEnd) - Date.parse(sample.windowStart)) / 86_400_000
  if (!Number.isFinite(windowDays) || windowDays < 0 || windowDays > 30)
    throw new Error('CI_PERFORMANCE_WINDOW_INVALID')
  const candidateP95 = nearestRank(pairs.map((pair) => pair.optimizedCandidateSeconds))
  const mainP95 = nearestRank(pairs.map((pair) => pair.optimizedMainSeconds))
  const controlJobMinutes = sum(pairs, 'controlJobMinutes')
  const optimizedJobMinutes = sum(pairs, 'optimizedJobMinutes')
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
    const inputIndex = process.argv.indexOf('--input')
    if (inputIndex < 0 || !process.argv[inputIndex + 1])
      throw new Error('CI_PERFORMANCE_INPUT_REQUIRED')
    process.stdout.write(
      `${JSON.stringify(evaluateCiPerformanceCutover(JSON.parse(fs.readFileSync(process.argv[inputIndex + 1], 'utf8'))))}\n`
    )
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
