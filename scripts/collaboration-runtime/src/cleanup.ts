import { validateStageCleanupAuthorization } from './binding.ts'
import { fail } from './errors.ts'
import type {
  CleanupResourceDecision,
  ObservedCleanupResource,
  StageCleanupAuthorization,
  StageCleanupResource
} from './types.ts'

/** Builds a stable identity for one cleanup resource. */
function resourceKey(resource: StageCleanupResource): string {
  return `${resource.kind}:${resource.path}:${resource.expectedSha ?? 'NONE'}`
}

/** Narrows one Stage cleanup batch to resources owned by the exact FL and preserves mismatches. */
export function planChildSelfCleanup(
  authorizationInput: StageCleanupAuthorization,
  ownerTaskId: string,
  observations: ObservedCleanupResource[],
  completedResourceKeys: string[] = []
): CleanupResourceDecision[] {
  const authorization = validateStageCleanupAuthorization(authorizationInput)
  const owned = authorization.terminalFeatures.filter(
    (feature) => feature.ownerTaskId === ownerTaskId
  )
  if (owned.length === 0) fail('CLEANUP_OWNER_NOT_IN_BATCH', ownerTaskId)
  const allowed = new Map<string, StageCleanupResource>()
  for (const feature of owned)
    for (const resource of feature.resources) allowed.set(resourceKey(resource), resource)
  const observed = new Map(observations.map((resource) => [resourceKey(resource), resource]))
  const completed = new Set(completedResourceKeys)
  return [...allowed.entries()].map(([key, resource]) => {
    if (completed.has(key))
      return {
        resource,
        decision: 'SKIP_COMPLETED',
        reason: 'prior exact cleanup result already verified'
      }
    const current = observed.get(key)
    if (!current || !current.exists)
      return { resource, decision: 'ALREADY_ABSENT', reason: 'exact resource is already absent' }
    if (!current.clean)
      return { resource, decision: 'PRESERVE_FAILURE', reason: 'resource is dirty' }
    if (resource.expectedSha !== null && current.actualSha !== resource.expectedSha) {
      return {
        resource,
        decision: 'PRESERVE_FAILURE',
        reason: 'resource SHA does not match authorization'
      }
    }
    return { resource, decision: 'REMOVE', reason: 'exact owner, path, cleanliness, and SHA match' }
  })
}

/** Verifies a cleanup-only PR deletes exactly the terminal packet allowlist. */
export function verifyCleanupOnlyDeletion(
  authorizationInput: StageCleanupAuthorization,
  deletedPaths: string[]
): void {
  const authorization = validateStageCleanupAuthorization(authorizationInput)
  const expected = [...authorization.allowedDeletedFeaturePackets].sort()
  const actual = [...new Set(deletedPaths)].sort()
  if (expected.length !== actual.length || expected.some((path, index) => path !== actual[index])) {
    fail('CLEANUP_ONLY_DIFF_SCOPE_MISMATCH', JSON.stringify(actual))
  }
}

/** Verifies every exact child resource has one terminal result before the cleanup-only PR is allowed. */
export function verifyChildCleanupResults(
  authorizationInput: StageCleanupAuthorization,
  resultsByOwner: Record<string, CleanupResourceDecision[]>
): void {
  const authorization = validateStageCleanupAuthorization(authorizationInput)
  const expectedOwners = [
    ...new Set(authorization.terminalFeatures.map((feature) => feature.ownerTaskId))
  ].sort()
  const actualOwners = Object.keys(resultsByOwner).sort()
  if (
    expectedOwners.length !== actualOwners.length ||
    expectedOwners.some((owner, index) => owner !== actualOwners[index])
  ) {
    fail('STAGE_CLEANUP_CHILD_SET_MISMATCH', JSON.stringify(actualOwners))
  }
  for (const owner of expectedOwners) {
    const expected = authorization.terminalFeatures
      .filter((feature) => feature.ownerTaskId === owner)
      .flatMap((feature) => feature.resources)
      .map(resourceKey)
      .sort()
    const results = resultsByOwner[owner]
    const actual = results.map((result) => resourceKey(result.resource)).sort()
    if (expected.length !== actual.length || expected.some((key, index) => key !== actual[index])) {
      fail('STAGE_CLEANUP_RESOURCE_RESULT_SET_MISMATCH', owner)
    }
    const failures = results.filter((result) => result.decision === 'PRESERVE_FAILURE')
    if (failures.length)
      fail(
        'STAGE_CLEANUP_PARTIAL_FAILURE',
        failures.map((result) => result.resource.path).join(',')
      )
  }
}
