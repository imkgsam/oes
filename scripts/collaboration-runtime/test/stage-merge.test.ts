import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { objectFingerprint } from '../src/canonical.ts'
import { createTechnicalRevision, planStageMerge } from '../src/stage-merge.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'
import type { StageMergeAuthorization, StageMergeItemResult } from '../src/types.ts'

/** Creates one complete two-item immutable Stage merge card. */
function card(): StageMergeAuthorization {
  const digestCharacters = ['5', '6', '7', '8', '9', 'a', 'b', 'c']
  const items = ['alpha', 'beta'].map((featureKey, index) => ({
    order: index + 1,
    featureKey,
    ownerTaskId: `/root/sl/fl-${featureKey}`,
    pullRequestNumber: 100 + index,
    integrationBase: `${index + 1}`.repeat(40),
    candidateSha: `${index + 3}`.repeat(40),
    patchFingerprint: digestCharacters[index].repeat(64),
    contentFingerprint: digestCharacters[index + 2].repeat(64),
    scopeFingerprint: digestCharacters[index + 4].repeat(64),
    riskFingerprint: digestCharacters[index + 6].repeat(64),
    requiredChecks: ['Baseline Checks'] as ['Baseline Checks'],
    featureRi: 'PASSED' as const
  }))
  const value: StageMergeAuthorization = {
    schemaVersion: 1,
    kind: 'OES_STAGE_MERGE_AUTHORIZATION',
    authorizationFingerprint: '',
    status: 'ISSUED',
    expectedState: 'STAGE_MERGE_AUTHORIZED',
    stateVersion: 1,
    stageKey: 'stage-one',
    stageOwnerTaskId: '/root/sl',
    transitionId: 'stage:merge:1',
    confirmationFingerprint: 'a'.repeat(64),
    stageScopeFingerprint: 'b'.repeat(64),
    stageRiskFingerprint: 'c'.repeat(64),
    orderedSetFingerprint: objectFingerprint(
      items as unknown as Record<string, unknown>,
      '__none__'
    ),
    stageRi: 'PASSED',
    stopPoint: 'STOP_SAME_STAGE_SUFFIX_ON_FAILURE',
    items
  }
  value.authorizationFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  return value
}

/** Creates one exact terminal result for a card item. */
function merged(value: StageMergeAuthorization, index: number): StageMergeItemResult {
  const item = value.items[index]
  return {
    order: item.order,
    featureKey: item.featureKey,
    candidateSha: item.candidateSha,
    effectiveHeadSha: item.candidateSha,
    state: 'MERGED_VERIFIED',
    acceptedMainSha: `${index + 7}`.repeat(40),
    mergeSha: `${index + 7}`.repeat(40),
    failureCode: null
  }
}

test('Stage merge admits one item at a time and completes only the full ordered set', () => {
  const value = card()
  assert.equal(planStageMerge(value, []).nextItem?.featureKey, 'alpha')
  const afterAlpha = planStageMerge(value, [merged(value, 0)])
  assert.equal(afterAlpha.status, 'ADMIT_NEXT')
  assert.deepEqual(afterAlpha.healthyPrefix, ['alpha'])
  assert.equal(afterAlpha.nextItem?.featureKey, 'beta')
  assert.equal(planStageMerge(value, [merged(value, 0), merged(value, 1)]).status, 'COMPLETE')
})

test('Stage merge failure preserves the healthy prefix and blocks the same-Stage suffix', () => {
  const value = card()
  const failed: StageMergeItemResult = {
    order: 2,
    featureKey: 'beta',
    candidateSha: value.items[1].candidateSha,
    effectiveHeadSha: value.items[1].candidateSha,
    state: 'FAILED',
    acceptedMainSha: value.items[0].candidateSha,
    mergeSha: null,
    failureCode: 'BASELINE_CHECKS_FAILED'
  }
  const plan = planStageMerge(value, [merged(value, 0), failed])
  assert.equal(plan.status, 'STOPPED_FAILURE')
  assert.deepEqual(plan.healthyPrefix, ['alpha'])
  assert.equal(plan.nextItem, null)
  assert.throws(() => planStageMerge(value, [failed]), /STAGE_MERGE_RESULT_BINDING_MISMATCH/)
})

test('moving-main revision accepts only unchanged card content and ordering', () => {
  const value = card()
  const item = value.items[0]
  const input = {
    featureKey: item.featureKey,
    order: item.order,
    previousBase: item.integrationBase,
    latestMain: 'd'.repeat(40),
    previousHead: item.candidateSha,
    refreshedHead: 'e'.repeat(40),
    patchFingerprint: item.patchFingerprint,
    contentFingerprint: item.contentFingerprint,
    scopeFingerprint: item.scopeFingerprint,
    riskFingerprint: item.riskFingerprint,
    orderedSetFingerprint: value.orderedSetFingerprint
  }
  assert.equal(createTechnicalRevision(value, input).decision, 'TECHNICALLY_EQUIVALENT')
  assert.throws(
    () => createTechnicalRevision(value, { ...input, contentFingerprint: 'f'.repeat(64) }),
    /STAGE_MERGE_BUSINESS_CONTENT_CHANGED/
  )
})

test('Stage merge JSON schema and runtime reject incomplete or reordered cards', () => {
  const value = card()
  const schema = JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', 'schemas', 'stage-merge-authorization.schema.json'),
      'utf8'
    )
  ) as Record<string, unknown>
  assert.doesNotThrow(() => validateJsonSchema(schema, value))
  assert.throws(() => validateJsonSchema(schema, { ...value, stageRi: 'PENDING' }), /const/)
  value.items.reverse()
  assert.throws(() => planStageMerge(value, []), /STAGE_MERGE_ITEM_INVALID|FINGERPRINT/)
})
