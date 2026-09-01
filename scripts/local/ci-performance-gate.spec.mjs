import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateCiPerformanceCutover } from './ci-performance-gate.mjs'

/** Creates a complete passing paired sample at the frozen minimum counts. */
function passingSample() {
  const workload = 'a'.repeat(64)
  return {
    windowStart: '2026-09-01T00:00:00.000Z',
    windowEnd: '2026-09-20T00:00:00.000Z',
    acceptedPairs: Array.from({ length: 20 }, (_, index) => ({
      paired: true,
      controlWorkloadFingerprint: workload,
      shadowWorkloadFingerprint: workload,
      cacheDisposition: index < 5 ? 'COLD' : 'WARM',
      optimizedCandidateSeconds: 280,
      optimizedMainSeconds: 100,
      duplicateFullMain: false,
      controlJobMinutes: 20,
      optimizedJobMinutes: 12
    })),
    supersededPairs: Array.from({ length: 10 }, () => ({
      paired: true,
      controlWorkloadFingerprint: workload,
      shadowWorkloadFingerprint: workload,
      cancelSeconds: 45
    })),
    stageSequences: Array.from({ length: 5 }, () => ({
      paired: true,
      pullRequestCount: 3,
      controlSeconds: 1200,
      optimizedSeconds: 550
    })),
    testAttempts: Array.from({ length: 50 }, () => ({ flakyRerun: false }))
  }
}

test('complete matched evidence reaches cutover only when every frozen threshold passes', () => {
  const result = evaluateCiPerformanceCutover(passingSample())
  assert.equal(result.status, 'CUTOVER_READY')
  assert.deepEqual(result.failures, [])
  assert.equal(result.metrics.candidateP95Seconds, 280)
})

test('insufficient, slow, duplicated, or flaky evidence keeps legacy authoritative', () => {
  const sample = passingSample()
  sample.acceptedPairs[18].optimizedCandidateSeconds = 301
  sample.acceptedPairs[19].optimizedCandidateSeconds = 301
  sample.acceptedPairs[0].duplicateFullMain = true
  sample.supersededPairs[0].cancelSeconds = 61
  sample.testAttempts[0].flakyRerun = true
  const result = evaluateCiPerformanceCutover(sample)
  assert.equal(result.status, 'KEEP_LEGACY_AUTHORITATIVE')
  assert.ok(result.failures.includes('CANDIDATE_P95_GT_300S'))
  assert.ok(result.failures.includes('DUPLICATE_FULL_MAIN_NONZERO'))
  assert.ok(result.failures.includes('STALE_CANCEL_GT_60S'))
  assert.ok(result.failures.includes('FLAKY_RERUN_RATE_GTE_2PCT'))
})

test('unpaired evidence and an overlong window are rejected rather than omitted', () => {
  const sample = passingSample()
  sample.acceptedPairs[0].paired = false
  assert.throws(() => evaluateCiPerformanceCutover(sample), /UNPAIRED/)
  const overlong = passingSample()
  overlong.windowEnd = '2026-10-02T00:00:00.000Z'
  assert.throws(() => evaluateCiPerformanceCutover(overlong), /WINDOW_INVALID/)
})
