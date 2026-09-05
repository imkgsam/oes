import { canonicalJson, objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import type {
  CoordinationDeliveryCandidate,
  CoordinationIntegrationAuthorization,
  CoordinationIntegrationItemResult,
  CoordinationIntegrationPlan
} from './types.ts'

const SHA = /^[0-9a-f]{40}$/
const DIGEST = /^[0-9a-f]{64}$/
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const AGGREGATE_BRANCH = /^codex\/coordination\/[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Validates one CO integration authorization and its ordered, RV-approved DO candidates. */
export function validateCoordinationIntegrationAuthorization(
  value: CoordinationIntegrationAuthorization
): CoordinationIntegrationAuthorization {
  if (
    value.schemaVersion !== 2 ||
    value.kind !== 'OES_COORDINATION_INTEGRATION_AUTHORIZATION' ||
    value.status !== 'ISSUED' ||
    value.expectedState !== 'COORDINATION_INTEGRATION_AUTHORIZED' ||
    !Number.isSafeInteger(value.stateVersion) ||
    value.stateVersion < 1 ||
    !KEY.test(value.coordinationKey) ||
    !value.coordinationOwnerTaskId ||
    !value.transitionId ||
    !DIGEST.test(value.confirmationFingerprint) ||
    !SHA.test(value.baseSha) ||
    !AGGREGATE_BRANCH.test(value.aggregateBranch) ||
    value.aggregateBranch !== `codex/coordination/${value.coordinationKey}` ||
    !['AGGREGATE', 'INDEPENDENT'].includes(value.prTopology) ||
    !Array.isArray(value.items) ||
    value.items.length < 2
  )
    fail('COORDINATION_INTEGRATION_AUTHORIZATION_INVALID', value.coordinationKey)

  const keys = new Set<string>()
  const owners = new Set<string>()
  value.items.forEach((item, index) => validateItem(item, index, keys, owners, value))
  for (const item of value.items)
    for (const dependency of item.dependencies)
      if (
        !keys.has(dependency) ||
        value.items.findIndex((candidate) => candidate.deliveryKey === dependency) >= item.order
      )
        fail(
          'COORDINATION_INTEGRATION_DEPENDENCY_ORDER_INVALID',
          `${item.deliveryKey}:${dependency}`
        )

  if (value.prTopology === 'INDEPENDENT') {
    if (
      !value.independentPrExceptionConfirmed ||
      value.items.some((item) => !item.independentlyReleasable)
    )
      fail('COORDINATION_INDEPENDENT_PR_EXCEPTION_UNPROVEN', value.coordinationKey)
  } else if (value.independentPrExceptionConfirmed) {
    fail('COORDINATION_UNUSED_INDEPENDENT_PR_CONFIRMATION', value.coordinationKey)
  }

  const expectedSet = objectFingerprint(
    value.items as unknown as Record<string, unknown>,
    '__none__'
  )
  if (value.orderedSetFingerprint !== expectedSet)
    fail('COORDINATION_INTEGRATION_ORDERED_SET_MISMATCH', value.coordinationKey)
  const expected = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (value.authorizationFingerprint !== expected)
    fail('COORDINATION_INTEGRATION_AUTHORIZATION_FINGERPRINT_MISMATCH', value.coordinationKey)
  return value
}

/** Validates a candidate as one independently owned delivery with scoped RV evidence. */
function validateItem(
  item: CoordinationDeliveryCandidate,
  index: number,
  keys: Set<string>,
  owners: Set<string>,
  authorization: CoordinationIntegrationAuthorization
): void {
  if (
    item.order !== index ||
    !KEY.test(item.deliveryKey) ||
    keys.has(item.deliveryKey) ||
    !item.ownerTaskId ||
    owners.has(item.ownerTaskId) ||
    !SHA.test(item.baseSha) ||
    !SHA.test(item.candidateSha) ||
    !DIGEST.test(item.patchFingerprint) ||
    !DIGEST.test(item.contentFingerprint) ||
    item.scopedRv !== 'PASSED' ||
    !Array.isArray(item.dependencies) ||
    new Set(item.dependencies).size !== item.dependencies.length ||
    item.dependencies.some((dependency) => !KEY.test(dependency))
  )
    fail('COORDINATION_INTEGRATION_ITEM_INVALID', `${index}:${item.deliveryKey}`)
  if (item.baseSha !== authorization.baseSha)
    fail('COORDINATION_INTEGRATION_BASE_MISMATCH', item.deliveryKey)
  keys.add(item.deliveryKey)
  owners.add(item.ownerTaskId)
}

/** Selects one next DO candidate for CO integration and never creates or merges a pull request. */
export function planCoordinationIntegration(
  authorizationInput: CoordinationIntegrationAuthorization,
  results: CoordinationIntegrationItemResult[]
): CoordinationIntegrationPlan {
  const authorization = validateCoordinationIntegrationAuthorization(authorizationInput)
  if (!Array.isArray(results) || results.length > authorization.items.length)
    fail('COORDINATION_INTEGRATION_RESULTS_INVALID', authorization.coordinationKey)
  const integratedPrefix: string[] = []
  let failure: CoordinationIntegrationItemResult | null = null
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index]
    const item = authorization.items[index]
    if (
      result.order !== item.order ||
      result.deliveryKey !== item.deliveryKey ||
      result.candidateSha !== item.candidateSha ||
      !['PENDING', 'FAILED', 'INTEGRATED_VERIFIED'].includes(result.state)
    )
      fail('COORDINATION_INTEGRATION_RESULT_BINDING_MISMATCH', item.deliveryKey)
    if (failure) fail('COORDINATION_INTEGRATION_RESULT_AFTER_FAILURE', item.deliveryKey)
    if (result.state === 'PENDING') {
      if (
        index !== results.length - 1 ||
        result.integratedSha !== null ||
        result.failureCode !== null
      )
        fail('COORDINATION_INTEGRATION_PENDING_RESULT_INVALID', item.deliveryKey)
      break
    }
    if (result.state === 'FAILED') {
      if (result.integratedSha !== null || !result.failureCode)
        fail('COORDINATION_INTEGRATION_FAILED_RESULT_INVALID', item.deliveryKey)
      failure = result
      break
    }
    if (!result.integratedSha || !SHA.test(result.integratedSha) || result.failureCode !== null)
      fail('COORDINATION_INTEGRATION_VERIFIED_RESULT_INVALID', item.deliveryKey)
    integratedPrefix.push(item.deliveryKey)
  }
  if (failure)
    return {
      status: 'STOPPED_FAILURE',
      integratedPrefix,
      nextItem: null,
      blockedSuffix: authorization.items.slice(failure.order + 1).map((item) => item.deliveryKey),
      aggregateBranch: authorization.aggregateBranch,
      pullRequestCount: authorization.prTopology === 'AGGREGATE' ? 1 : authorization.items.length,
      failure
    }
  const next = authorization.items[integratedPrefix.length] ?? null
  if (next)
    return {
      status: 'INTEGRATE_NEXT',
      integratedPrefix,
      nextItem: next,
      blockedSuffix: authorization.items.slice(next.order + 1).map((item) => item.deliveryKey),
      aggregateBranch: authorization.aggregateBranch,
      pullRequestCount: authorization.prTopology === 'AGGREGATE' ? 1 : authorization.items.length,
      failure: null
    }
  return {
    status:
      authorization.prTopology === 'AGGREGATE'
        ? 'AGGREGATE_CANDIDATE_READY'
        : 'INDEPENDENT_PRS_READY',
    integratedPrefix,
    nextItem: null,
    blockedSuffix: [],
    aggregateBranch: authorization.aggregateBranch,
    pullRequestCount: authorization.prTopology === 'AGGREGATE' ? 1 : authorization.items.length,
    failure: null
  }
}

/** Returns the stable ordered-set fingerprint used when issuing the CO authorization. */
export function coordinationOrderedSetFingerprint(items: CoordinationDeliveryCandidate[]): string {
  return objectFingerprint(JSON.parse(canonicalJson(items)) as Record<string, unknown>, '__none__')
}
