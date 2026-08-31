import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  CiRecoveryController,
  FileCiRecoveryReceiptStore,
  classifyExternalFailure,
  retryTransient
} from '../src/retry-policy.ts'

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
  const root = mkdtempSync(join(tmpdir(), 'oes-ci-recovery-'))
  const input = {
    candidateSha: sha,
    observedSha: sha,
    failureKind: 'infrastructure' as const,
    workflowRunId: 'workflow-run-42',
    failedJobId: 'failed-job-7'
  }
  const first = new CiRecoveryController(new FileCiRecoveryReceiptStore(root)).decide(input)
  assert.equal(first.action, 'RERUN_FAILED_JOB_ONCE')
  assert.equal(first.reason, 'SAME_SHA_INFRASTRUCTURE_FAILURE')
  assert.ok(first.rerunReceipt)

  const replay = new CiRecoveryController(new FileCiRecoveryReceiptStore(root)).decide(input)
  assert.equal(replay.action, 'REPLAY_EXISTING_RERUN_RECEIPT')
  assert.equal(replay.reason, 'SAME_FAILURE_RERUN_ALREADY_RECORDED')
  assert.deepEqual(replay.rerunReceipt, first.rerunReceipt)

  const controller = new CiRecoveryController(
    new FileCiRecoveryReceiptStore(mkdtempSync(join(tmpdir(), 'oes-ci-other-')))
  )
  assert.equal(
    controller.decide({
      candidateSha: sha,
      observedSha: sha,
      failureKind: 'assertion',
      workflowRunId: 'workflow-run-42',
      failedJobId: 'failed-job-7'
    }).action,
    'RETURN_TO_OWNER'
  )
  assert.equal(
    controller.decide({
      candidateSha: sha,
      observedSha: 'b'.repeat(40),
      failureKind: 'infrastructure',
      workflowRunId: 'workflow-run-42',
      failedJobId: 'failed-job-7'
    }).action,
    'PRESERVE_BLOCKER'
  )
})
