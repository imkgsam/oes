import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyExternalFailure, decideCiRecovery, retryTransient } from '../src/retry-policy.ts'

test('transient reads use bounded exponential backoff with jitter', async () => {
  let attempts = 0
  const delays: number[] = []
  const result = await retryTransient(
    async () => {
      attempts += 1
      if (attempts < 4) throw new Error('HTTP 503 service unavailable')
      return 'ok'
    },
    {
      random: () => 0.5,
      sleep: async (milliseconds) => {
        delays.push(milliseconds)
      }
    }
  )
  assert.equal(result, 'ok')
  assert.equal(attempts, 4)
  assert.deepEqual(delays, [375, 750, 1500])
  assert.equal(classifyExternalFailure(new Error('type assertion failed')), 'PERMANENT')
})

test('permission failure stops immediately and transient exhaustion is bounded', async () => {
  let permissionAttempts = 0
  await assert.rejects(
    retryTransient(async () => {
      permissionAttempts += 1
      throw new Error('HTTP 403 resource not accessible')
    }),
    /EXTERNAL_PERMISSION_BLOCKER/
  )
  assert.equal(permissionAttempts, 1)

  let transientAttempts = 0
  await assert.rejects(
    retryTransient(
      async () => {
        transientAttempts += 1
        throw new Error('connection reset')
      },
      { random: () => 0, sleep: async () => undefined }
    ),
    /TRANSIENT_RETRY_EXHAUSTED/
  )
  assert.equal(transientAttempts, 4)
})

test('CI recovery reruns only one infrastructure-failed job on the unchanged SHA', () => {
  const sha = 'a'.repeat(40)
  assert.deepEqual(
    decideCiRecovery({
      candidateSha: sha,
      observedSha: sha,
      failureKind: 'infrastructure',
      failedJobReruns: 0
    }),
    { action: 'RERUN_FAILED_JOB_ONCE', reason: 'SAME_SHA_INFRASTRUCTURE_FAILURE' }
  )
  assert.equal(
    decideCiRecovery({
      candidateSha: sha,
      observedSha: sha,
      failureKind: 'assertion',
      failedJobReruns: 0
    }).action,
    'RETURN_TO_OWNER'
  )
  assert.equal(
    decideCiRecovery({
      candidateSha: sha,
      observedSha: 'b'.repeat(40),
      failureKind: 'infrastructure',
      failedJobReruns: 0
    }).action,
    'PRESERVE_BLOCKER'
  )
})
