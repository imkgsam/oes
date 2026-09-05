import {
  requireTrustedCoordinationCleanupAuthorization,
  validateCoordinationCleanupAuthorization,
  validateCoordinationCleanupResource
} from './cleanup-binding.ts'
import { objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import type {
  CleanupDiffEntry,
  CleanupResourceDecision,
  CompletedCleanupResource,
  ObservedCleanupResource,
  CoordinationCleanupAuthorization,
  CoordinationCleanupResource
} from './types.ts'

/** Builds a stable identity for one cleanup resource. */
function resourceKey(resource: CoordinationCleanupResource): string {
  return `${resource.kind}:${resource.path}:${resource.expectedSha ?? 'NONE'}`
}

/** Requires one raw cleanup result object to contain no undeclared fields. */
function requireExactKeys(value: unknown, allowed: string[], field: string): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    fail('INVALID_CLEANUP_RESULT_OBJECT', field)
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key))
  if (unexpected.length)
    fail('UNDECLARED_CLEANUP_RESULT_FIELD', `${field}.${unexpected.sort().join(',')}`)
}

/** Validates one exact observation before it can drive or prove cleanup. */
function validateObservation(
  value: ObservedCleanupResource,
  field: string
): ObservedCleanupResource {
  requireExactKeys(value, ['kind', 'path', 'expectedSha', 'exists', 'clean', 'actualSha'], field)
  validateCoordinationCleanupResource(
    {
      kind: value.kind,
      path: value.path,
      expectedSha: value.expectedSha
    },
    field
  )
  if (typeof value.exists !== 'boolean' || typeof value.clean !== 'boolean')
    fail('INVALID_CLEANUP_OBSERVATION_STATE', field)
  if (value.actualSha !== null && !/^[0-9a-f]{40}$/.test(value.actualSha))
    fail('INVALID_CLEANUP_OBSERVATION_SHA', field)
  if (!value.exists && value.actualSha !== null) fail('ABSENT_CLEANUP_RESOURCE_HAS_SHA', field)
  return value
}

/** Narrows one coordination batch to exact-owner resources and preserves missing or mismatched evidence. */
export function planChildSelfCleanup(
  authorizationInput: CoordinationCleanupAuthorization,
  ownerTaskId: string,
  observations: ObservedCleanupResource[],
  completedResources: CompletedCleanupResource[] = []
): CleanupResourceDecision[] {
  const authorization = validateCoordinationCleanupAuthorization(authorizationInput)
  requireTrustedCoordinationCleanupAuthorization(authorization)
  const owned = authorization.terminalDeliveries.filter(
    (delivery) => delivery.ownerTaskId === ownerTaskId
  )
  const ownerDelivery =
    ownerTaskId === authorization.coordinationOwner.ownerTaskId
      ? [authorization.coordinationOwner]
      : []
  if (owned.length === 0 && ownerDelivery.length === 0)
    fail('CLEANUP_OWNER_NOT_IN_BATCH', ownerTaskId)
  const allowed = new Map<string, CoordinationCleanupResource>()
  for (const delivery of owned)
    for (const resource of delivery.resources) allowed.set(resourceKey(resource), resource)
  for (const delivery of ownerDelivery)
    for (const resource of delivery.resources) allowed.set(resourceKey(resource), resource)
  if (!Array.isArray(observations)) fail('CLEANUP_OBSERVATIONS_REQUIRED', ownerTaskId)
  const observed = new Map<string, ObservedCleanupResource>()
  for (const resource of observations) {
    validateObservation(resource, 'cleanupObservation')
    const key = resourceKey(resource)
    if (!allowed.has(key)) fail('UNBOUND_CLEANUP_OBSERVATION', key)
    if (observed.has(key)) fail('DUPLICATE_CLEANUP_OBSERVATION', key)
    observed.set(key, resource)
  }
  if (!Array.isArray(completedResources)) fail('CLEANUP_COMPLETIONS_INVALID', ownerTaskId)
  const completed = new Map<string, CompletedCleanupResource>()
  for (const record of completedResources) {
    requireExactKeys(
      record,
      ['resource', 'observedAfter', 'completionFingerprint'],
      'completedCleanupResource'
    )
    validateCoordinationCleanupResource(record.resource, 'completedCleanupResource.resource')
    validateObservation(record.observedAfter, 'completedCleanupResource.observedAfter')
    const key = resourceKey(record.resource)
    if (
      !allowed.has(key) ||
      record.observedAfter.exists !== false ||
      resourceKey(record.observedAfter) !== key
    )
      fail('COMPLETED_CLEANUP_RESOURCE_INVALID', key)
    const expectedFingerprint = objectFingerprint(
      { resource: record.resource, observedAfter: record.observedAfter },
      '__none__'
    )
    if (record.completionFingerprint !== expectedFingerprint)
      fail('COMPLETED_CLEANUP_FINGERPRINT_MISMATCH', key)
    if (completed.has(key)) fail('DUPLICATE_COMPLETED_CLEANUP_RESOURCE', key)
    completed.set(key, record)
  }
  return [...allowed.entries()].map(([key, resource]) => {
    const prior = completed.get(key)
    if (prior)
      return {
        resource,
        decision: 'SKIP_COMPLETED',
        reason: 'prior exact cleanup result fingerprint and absence were verified',
        observedBefore: null,
        observedAfter: prior.observedAfter,
        completionFingerprint: prior.completionFingerprint
      }
    const current = observed.get(key)
    if (!current)
      return {
        resource,
        decision: 'PRESERVE_FAILURE',
        reason: 'bound resource was not observed',
        observedBefore: null,
        observedAfter: null
      }
    if (!current.exists)
      return {
        resource,
        decision: 'ALREADY_ABSENT',
        reason: 'exact resource absence was observed',
        observedBefore: current,
        observedAfter: current
      }
    if (!current.clean)
      return {
        resource,
        decision: 'PRESERVE_FAILURE',
        reason: 'resource is dirty',
        observedBefore: current,
        observedAfter: current
      }
    if (resource.expectedSha !== null && current.actualSha !== resource.expectedSha)
      return {
        resource,
        decision: 'PRESERVE_FAILURE',
        reason: 'resource SHA does not match authorization',
        observedBefore: current,
        observedAfter: current
      }
    return {
      resource,
      decision: 'REMOVE',
      reason: 'exact owner, path, cleanliness, and SHA match; post-removal observation required',
      observedBefore: current,
      observedAfter: null
    }
  })
}

/** Structurally rejects every repository-content change during lifecycle cleanup. */
export function verifyCleanupProducesNoRepositoryDiff(
  authorizationInput: CoordinationCleanupAuthorization,
  diffEntries: CleanupDiffEntry[]
): void {
  const authorization = validateCoordinationCleanupAuthorization(authorizationInput)
  requireTrustedCoordinationCleanupAuthorization(authorization)
  if (!Array.isArray(diffEntries)) fail('CLEANUP_DIFF_REQUIRED', authorization.coordinationKey)
  if (diffEntries.length !== 0)
    fail('CLEANUP_REPOSITORY_MUTATION_FORBIDDEN', JSON.stringify(diffEntries))
}

/** Verifies every exact child resource has a terminal, observed result before packet deletion. */
export function verifyChildCleanupResults(
  authorizationInput: CoordinationCleanupAuthorization,
  resultsByOwner: Record<string, CleanupResourceDecision[]>
): void {
  const authorization = validateCoordinationCleanupAuthorization(authorizationInput)
  requireTrustedCoordinationCleanupAuthorization(authorization)
  if (
    typeof resultsByOwner !== 'object' ||
    resultsByOwner === null ||
    Array.isArray(resultsByOwner)
  )
    fail('COORDINATION_CLEANUP_CHILD_RESULTS_INVALID', authorization.coordinationKey)
  const expectedOwners = [
    ...new Set(authorization.terminalDeliveries.map((delivery) => delivery.ownerTaskId)),
    authorization.coordinationOwner.ownerTaskId
  ]
  const actualOwners = Object.keys(resultsByOwner)
  if (
    expectedOwners.length !== actualOwners.length ||
    expectedOwners.some((owner, index) => owner !== actualOwners[index])
  )
    fail('COORDINATION_CLEANUP_CHILD_SET_MISMATCH', JSON.stringify(actualOwners))
  for (const owner of expectedOwners) {
    const expected = [
      ...authorization.terminalDeliveries.filter((delivery) => delivery.ownerTaskId === owner),
      ...(authorization.coordinationOwner.ownerTaskId === owner
        ? [authorization.coordinationOwner]
        : [])
    ]
      .flatMap((delivery) => delivery.resources)
      .map(resourceKey)
      .sort()
    const results = resultsByOwner[owner]
    if (!Array.isArray(results)) fail('COORDINATION_CLEANUP_RESOURCE_RESULT_SET_MISMATCH', owner)
    const actual = results
      .map((result) => {
        requireExactKeys(
          result,
          [
            'resource',
            'decision',
            'reason',
            'observedBefore',
            'observedAfter',
            'completionFingerprint'
          ],
          'cleanupResourceDecision'
        )
        validateCoordinationCleanupResource(result.resource, 'cleanupResourceDecision.resource')
        if (
          !['REMOVE', 'ALREADY_ABSENT', 'PRESERVE_FAILURE', 'SKIP_COMPLETED'].includes(
            result.decision
          )
        )
          fail('COORDINATION_CLEANUP_RESULT_DECISION_INVALID', String(result.decision))
        if (typeof result.reason !== 'string' || result.reason.length === 0)
          fail('COORDINATION_CLEANUP_RESULT_REASON_INVALID', result.resource.path)
        if (
          result.completionFingerprint !== undefined &&
          !/^[0-9a-f]{64}$/.test(result.completionFingerprint)
        )
          fail('COORDINATION_CLEANUP_COMPLETION_FINGERPRINT_INVALID', result.resource.path)
        if (result.decision !== 'SKIP_COMPLETED' && result.completionFingerprint !== undefined)
          fail('COORDINATION_CLEANUP_UNEXPECTED_COMPLETION_FINGERPRINT', result.resource.path)
        if (result.observedBefore !== null)
          validateObservation(result.observedBefore, 'cleanupResourceDecision.observedBefore')
        if (result.observedAfter !== null)
          validateObservation(result.observedAfter, 'cleanupResourceDecision.observedAfter')
        return resourceKey(result.resource)
      })
      .sort()
    if (expected.length !== actual.length || expected.some((key, index) => key !== actual[index]))
      fail('COORDINATION_CLEANUP_RESOURCE_RESULT_SET_MISMATCH', owner)
    for (const result of results) {
      const boundKey = resourceKey(result.resource)
      if (
        (result.observedBefore && resourceKey(result.observedBefore) !== boundKey) ||
        (result.observedAfter && resourceKey(result.observedAfter) !== boundKey)
      )
        fail('COORDINATION_CLEANUP_OBSERVATION_IDENTITY_MISMATCH', result.resource.path)
      if (result.decision === 'PRESERVE_FAILURE')
        fail('COORDINATION_CLEANUP_PARTIAL_FAILURE', result.resource.path)
      if (result.decision === 'REMOVE') {
        if (
          !result.observedBefore?.exists ||
          !result.observedBefore.clean ||
          (result.resource.expectedSha !== null &&
            result.observedBefore.actualSha !== result.resource.expectedSha) ||
          result.observedAfter?.exists !== false
        )
          fail('COORDINATION_CLEANUP_REMOVAL_NOT_VERIFIED', result.resource.path)
      } else if (result.decision === 'ALREADY_ABSENT') {
        if (result.observedBefore?.exists !== false || result.observedAfter?.exists !== false)
          fail('COORDINATION_CLEANUP_ABSENCE_NOT_VERIFIED', result.resource.path)
      } else if (result.decision === 'SKIP_COMPLETED') {
        const expectedFingerprint = result.observedAfter
          ? objectFingerprint(
              { resource: result.resource, observedAfter: result.observedAfter },
              '__none__'
            )
          : ''
        if (
          result.observedBefore !== null ||
          result.observedAfter?.exists !== false ||
          result.completionFingerprint !== expectedFingerprint
        )
          fail('COORDINATION_CLEANUP_COMPLETED_RESULT_INVALID', result.resource.path)
      }
    }
  }
}
