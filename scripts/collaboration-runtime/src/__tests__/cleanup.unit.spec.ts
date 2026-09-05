import assert from 'node:assert/strict'
import test from 'node:test'
import { validateCoordinationCleanupAuthorization } from '../cleanup-binding.ts'
import {
  planChildSelfCleanup,
  verifyChildCleanupResults,
  verifyCleanupProducesNoRepositoryDiff
} from '../cleanup.ts'
import { validateJsonSchema } from '../schema-validation.ts'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cleanupAuthorization } from './helpers.ts'

const schema = JSON.parse(
  readFileSync(
    join(
      import.meta.dirname,
      '..',
      '..',
      'schemas',
      'coordination-cleanup-authorization.schema.json'
    ),
    'utf8'
  )
) as Record<string, unknown>
const observation = (
  resource: ReturnType<
    typeof cleanupAuthorization
  >['terminalDeliveries'][number]['resources'][number],
  exists = true
) => ({ ...resource, exists, clean: true, actualSha: exists ? resource.expectedSha : null })

test('V2 cleanup authorization is terminal, owner-bound, and schema-valid', () => {
  const value = cleanupAuthorization()
  validateCoordinationCleanupAuthorization(value)
  validateJsonSchema(schema, value)
})

test('child cleanup narrows to one exact DO and preserves dirty resources', () => {
  const value = cleanupAuthorization()
  const delivery = value.terminalDeliveries[0]
  const observed = delivery.resources.map((resource) => observation(resource))
  observed[2].clean = false
  const plan = planChildSelfCleanup(value, delivery.ownerTaskId, observed)
  assert.equal(plan.filter((item) => item.decision === 'REMOVE').length, 3)
  assert.equal(plan.find((item) => item.resource.kind === 'worktree')?.decision, 'PRESERVE_FAILURE')
})

test('cleanup structurally permits no repository-content diff', () => {
  const value = cleanupAuthorization()
  verifyCleanupProducesNoRepositoryDiff(value, [])
  assert.throws(
    () => verifyCleanupProducesNoRepositoryDiff(value, [{ status: 'D', path: 'docs/anything.md' }]),
    /CLEANUP_REPOSITORY_MUTATION_FORBIDDEN/
  )
})

test('coordination verification requires every child resource to be observed absent', () => {
  const value = cleanupAuthorization()
  const results = Object.fromEntries(
    value.terminalDeliveries.map((delivery) => [
      delivery.ownerTaskId,
      planChildSelfCleanup(
        value,
        delivery.ownerTaskId,
        delivery.resources.map((resource) => observation(resource, false))
      )
    ])
  )
  verifyChildCleanupResults(value, results)
  results[value.terminalDeliveries[0].ownerTaskId][0].decision = 'PRESERVE_FAILURE'
  assert.throws(
    () => verifyChildCleanupResults(value, results),
    /COORDINATION_CLEANUP_PARTIAL_FAILURE/
  )
})
