import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { buildCiPerformanceEvidence } from './ci-performance-evidence.mjs'
import { validateJsonSchema } from '../collaboration-runtime/src/schema-validation.ts'

test('legacy control and optimized shadow share workload identity but not execution identity', () => {
  const base = {
    sourceSha: '1'.repeat(40),
    sourceTreeSha: '6'.repeat(40),
    baseSha: '7'.repeat(40),
    acceptedSourceIdentity: '1'.repeat(40),
    acceptedResultIdentity: '2'.repeat(40),
    changedPaths: ['b.ts', 'a.ts'],
    riskClass: 'HIGH',
    stagePullRequests: ['11', '12'],
    commandInventory: ['build', 'test'],
    testInventory: ['test:b', 'test:a'],
    lockfileDigest: '3'.repeat(64),
    toolchain: { node: 'v22', pnpm: '10.33.0', buf: 'v1' },
    cacheDisposition: 'COLD',
    workflowRevision: '4'.repeat(64),
    eventTopology: 'pull_request',
    shardStrategy: 'legacy',
    cacheStrategy: 'exact',
    artifactStrategy: 'none',
    artifactDigest: null
  }
  const control = buildCiPerformanceEvidence({ ...base, mode: 'LEGACY_CONTROL' })
  const shadow = buildCiPerformanceEvidence({
    ...base,
    mode: 'OPTIMIZED_SHADOW',
    shardStrategy: 'weighted',
    artifactStrategy: 'content-addressed',
    artifactDigest: '5'.repeat(64)
  })
  assert.equal(control.workloadFingerprint, shadow.workloadFingerprint)
  assert.notEqual(control.executionFingerprint, shadow.executionFingerprint)
  const schema = JSON.parse(
    fs.readFileSync(
      new URL(
        '../collaboration-runtime/schemas/ci-performance-evidence.schema.json',
        import.meta.url
      ),
      'utf8'
    )
  )
  assert.doesNotThrow(() => validateJsonSchema(schema, control))
  assert.doesNotThrow(() => validateJsonSchema(schema, shadow))
})

test('workflow topology changes only execution identity', () => {
  const input = {
    sourceSha: '1'.repeat(40),
    sourceTreeSha: '6'.repeat(40),
    baseSha: '7'.repeat(40),
    acceptedSourceIdentity: '1'.repeat(40),
    acceptedResultIdentity: '2'.repeat(40),
    changedPaths: [],
    riskClass: 'STANDARD',
    stagePullRequests: [],
    commandInventory: ['test'],
    testInventory: ['one'],
    lockfileDigest: '3'.repeat(64),
    toolchain: {},
    cacheDisposition: 'WARM',
    workflowRevision: '4'.repeat(64),
    eventTopology: 'pull_request',
    mode: 'OPTIMIZED_SHADOW',
    shardStrategy: 'weighted',
    cacheStrategy: 'exact',
    artifactStrategy: 'content-addressed',
    artifactDigest: '5'.repeat(64)
  }
  const pull = buildCiPerformanceEvidence(input)
  const push = buildCiPerformanceEvidence({ ...input, eventTopology: 'push' })
  assert.equal(pull.workloadFingerprint, push.workloadFingerprint)
  assert.notEqual(pull.executionFingerprint, push.executionFingerprint)
})
