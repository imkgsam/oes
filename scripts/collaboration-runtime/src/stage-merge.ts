import { objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import type {
  StageMergeAuthorization,
  StageMergeItem,
  StageMergeItemResult,
  StageMergePlan,
  StageMergeTechnicalRevision
} from './types.ts'

const SHA = /^[0-9a-f]{40}$/
const DIGEST = /^[0-9a-f]{64}$/
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Validates a complete immutable Stage merge card before any item can be admitted. */
export function validateStageMergeAuthorization(
  value: StageMergeAuthorization
): StageMergeAuthorization {
  if (
    value.schemaVersion !== 1 ||
    value.kind !== 'OES_STAGE_MERGE_AUTHORIZATION' ||
    value.status !== 'ISSUED' ||
    value.expectedState !== 'STAGE_MERGE_AUTHORIZED' ||
    value.stageRi !== 'PASSED' ||
    value.stopPoint !== 'STOP_SAME_STAGE_SUFFIX_ON_FAILURE'
  )
    fail('STAGE_MERGE_CARD_INVALID', value.stageKey)
  if (!KEY.test(value.stageKey) || value.stageOwnerTaskId.length === 0 || value.stateVersion < 1)
    fail('STAGE_MERGE_IDENTITY_INVALID', value.stageKey)
  for (const field of [
    value.authorizationFingerprint,
    value.confirmationFingerprint,
    value.stageScopeFingerprint,
    value.stageRiskFingerprint,
    value.orderedSetFingerprint
  ])
    if (!DIGEST.test(field)) fail('STAGE_MERGE_FINGERPRINT_INVALID', value.stageKey)
  if (!Array.isArray(value.items) || value.items.length === 0)
    fail('STAGE_MERGE_ITEMS_EMPTY', value.stageKey)
  const identities = new Set<string>()
  const prs = new Set<number>()
  const owners = new Set<string>()
  value.items.forEach((item, index) => {
    validateItem(item, index + 1)
    if (
      identities.has(item.featureKey) ||
      prs.has(item.pullRequestNumber) ||
      owners.has(item.ownerTaskId)
    )
      fail('STAGE_MERGE_ITEM_DUPLICATE', item.featureKey)
    identities.add(item.featureKey)
    prs.add(item.pullRequestNumber)
    owners.add(item.ownerTaskId)
  })
  const expectedSet = objectFingerprint(
    value.items.map((item) => ({
      order: item.order,
      featureKey: item.featureKey,
      ownerTaskId: item.ownerTaskId,
      pullRequestNumber: item.pullRequestNumber,
      integrationBase: item.integrationBase,
      candidateSha: item.candidateSha,
      patchFingerprint: item.patchFingerprint,
      contentFingerprint: item.contentFingerprint,
      scopeFingerprint: item.scopeFingerprint,
      riskFingerprint: item.riskFingerprint,
      requiredChecks: item.requiredChecks,
      featureRi: item.featureRi
    })) as unknown as Record<string, unknown>,
    '__none__'
  )
  if (value.orderedSetFingerprint !== expectedSet)
    fail('STAGE_MERGE_ORDERED_SET_MISMATCH', value.stageKey)
  const expectedAuthorization = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (value.authorizationFingerprint !== expectedAuthorization)
    fail('STAGE_MERGE_AUTHORIZATION_FINGERPRINT_MISMATCH', value.stageKey)
  return value
}

/** Selects at most one next Stage item and preserves a verified healthy prefix on failure. */
export function planStageMerge(
  authorizationInput: StageMergeAuthorization,
  results: StageMergeItemResult[]
): StageMergePlan {
  const authorization = validateStageMergeAuthorization(authorizationInput)
  if (!Array.isArray(results)) fail('STAGE_MERGE_RESULTS_INVALID', authorization.stageKey)
  if (results.length > authorization.items.length)
    fail('STAGE_MERGE_RESULT_SET_TOO_LARGE', authorization.stageKey)
  const healthyPrefix: string[] = []
  let failure: StageMergeItemResult | null = null
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]
    const item = authorization.items[index]
    validateResult(result, item)
    if (failure) fail('STAGE_MERGE_RESULT_AFTER_FAILURE', result.featureKey)
    if (result.state === 'PENDING') {
      if (index !== results.length - 1) fail('STAGE_MERGE_RESULT_AFTER_PENDING', result.featureKey)
      break
    }
    if (result.state === 'FAILED') {
      failure = result
      break
    }
    healthyPrefix.push(result.featureKey)
  }
  if (failure) {
    return {
      status: 'STOPPED_FAILURE',
      healthyPrefix,
      nextItem: null,
      blockedSuffix: authorization.items.slice(failure.order).map((item) => item.featureKey),
      failure
    }
  }
  const nextIndex = healthyPrefix.length
  if (nextIndex === authorization.items.length)
    return { status: 'COMPLETE', healthyPrefix, nextItem: null, blockedSuffix: [], failure: null }
  return {
    status: 'ADMIT_NEXT',
    healthyPrefix,
    nextItem: authorization.items[nextIndex],
    blockedSuffix: authorization.items.slice(nextIndex + 1).map((item) => item.featureKey),
    failure: null
  }
}

/** Binds harmless moving-main refresh to the original Stage card without changing business content. */
export function createTechnicalRevision(
  authorizationInput: StageMergeAuthorization,
  input: Omit<
    StageMergeTechnicalRevision,
    'schemaVersion' | 'kind' | 'revisionFingerprint' | 'stageAuthorizationFingerprint' | 'decision'
  >
): StageMergeTechnicalRevision {
  const authorization = validateStageMergeAuthorization(authorizationInput)
  const item = authorization.items[input.order - 1]
  if (!item || item.featureKey !== input.featureKey)
    fail('STAGE_MERGE_REVISION_ITEM_MISMATCH', input.featureKey)
  if (
    input.previousBase !== item.integrationBase ||
    input.previousHead !== item.candidateSha ||
    input.latestMain === input.previousBase ||
    !SHA.test(input.latestMain) ||
    !SHA.test(input.refreshedHead)
  )
    fail('STAGE_MERGE_REVISION_SHA_INVALID', input.featureKey)
  if (
    input.patchFingerprint !== item.patchFingerprint ||
    input.contentFingerprint !== item.contentFingerprint ||
    input.scopeFingerprint !== item.scopeFingerprint ||
    input.riskFingerprint !== item.riskFingerprint ||
    input.orderedSetFingerprint !== authorization.orderedSetFingerprint
  )
    fail('STAGE_MERGE_BUSINESS_CONTENT_CHANGED', input.featureKey)
  const revision: StageMergeTechnicalRevision = {
    schemaVersion: 1,
    kind: 'OES_STAGE_MERGE_TECHNICAL_REVISION',
    revisionFingerprint: '',
    stageAuthorizationFingerprint: authorization.authorizationFingerprint,
    ...input,
    decision: 'TECHNICALLY_EQUIVALENT'
  }
  revision.revisionFingerprint = objectFingerprint(
    revision as unknown as Record<string, unknown>,
    'revisionFingerprint'
  )
  return revision
}

/** Validates one exact ordered Stage card item. */
function validateItem(item: StageMergeItem, expectedOrder: number): void {
  if (
    item.order !== expectedOrder ||
    !KEY.test(item.featureKey) ||
    item.ownerTaskId.length === 0 ||
    !Number.isInteger(item.pullRequestNumber) ||
    item.pullRequestNumber < 1 ||
    !SHA.test(item.integrationBase) ||
    !SHA.test(item.candidateSha) ||
    item.featureRi !== 'PASSED' ||
    item.requiredChecks.length !== 1 ||
    item.requiredChecks[0] !== 'Baseline Checks'
  )
    fail('STAGE_MERGE_ITEM_INVALID', item.featureKey)
  for (const digest of [
    item.patchFingerprint,
    item.contentFingerprint,
    item.scopeFingerprint,
    item.riskFingerprint
  ])
    if (!DIGEST.test(digest)) fail('STAGE_MERGE_ITEM_FINGERPRINT_INVALID', item.featureKey)
}

/** Validates one result against the same positional card item. */
function validateResult(result: StageMergeItemResult, item: StageMergeItem): void {
  if (
    result.order !== item.order ||
    result.featureKey !== item.featureKey ||
    result.candidateSha !== item.candidateSha ||
    !SHA.test(result.effectiveHeadSha)
  )
    fail('STAGE_MERGE_RESULT_BINDING_MISMATCH', item.featureKey)
  if (result.state === 'MERGED_VERIFIED') {
    if (
      !result.mergeSha ||
      !SHA.test(result.mergeSha) ||
      result.acceptedMainSha !== result.mergeSha ||
      result.failureCode !== null
    )
      fail('STAGE_MERGE_VERIFIED_RESULT_INVALID', item.featureKey)
  } else if (result.state === 'FAILED') {
    if (!result.failureCode || result.mergeSha !== null)
      fail('STAGE_MERGE_FAILED_RESULT_INVALID', item.featureKey)
  } else if (
    result.acceptedMainSha !== null ||
    result.mergeSha !== null ||
    result.failureCode !== null
  ) {
    fail('STAGE_MERGE_PENDING_RESULT_INVALID', item.featureKey)
  }
}
