import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { objectFingerprint } from '../canonical.ts'
import {
  coordinationOrderedSetFingerprint,
  planCoordinationIntegration,
  validateCoordinationIntegrationAuthorization
} from '../coordination-integration.ts'
import { validateJsonSchema } from '../schema-validation.ts'
import type {
  CoordinationIntegrationAuthorization,
  CoordinationIntegrationItemResult
} from '../types.ts'

function authorization(
  prTopology: 'AGGREGATE' | 'INDEPENDENT' = 'AGGREGATE'
): CoordinationIntegrationAuthorization {
  const baseSha = '1'.repeat(40)
  const items = ['api', 'web'].map((deliveryKey, order) => ({
    order,
    deliveryKey,
    ownerTaskId: `/root/co/do-${deliveryKey}`,
    baseSha,
    candidateSha: `${order + 2}`.repeat(40),
    patchFingerprint: `${order + 3}`.repeat(64),
    contentFingerprint: `${order + 4}`.repeat(64),
    dependencies: order ? ['api'] : [],
    scopedRv: 'PASSED' as const,
    independentlyReleasable: true
  }))
  const raw = {
    schemaVersion: 2 as const,
    kind: 'OES_COORDINATION_INTEGRATION_AUTHORIZATION' as const,
    authorizationFingerprint: '',
    status: 'ISSUED' as const,
    expectedState: 'COORDINATION_INTEGRATION_AUTHORIZED' as const,
    stateVersion: 1,
    coordinationKey: 'release',
    coordinationOwnerTaskId: '/root/co',
    transitionId: 'coordination:integrate:1',
    confirmationFingerprint: 'a'.repeat(64),
    baseSha,
    aggregateBranch: 'codex/coordination/release',
    prTopology,
    independentPrExceptionConfirmed: prTopology === 'INDEPENDENT',
    orderedSetFingerprint: coordinationOrderedSetFingerprint(items),
    items
  }
  return {
    ...raw,
    authorizationFingerprint: objectFingerprint(
      raw as unknown as Record<string, unknown>,
      'authorizationFingerprint'
    )
  }
}

test('CO integrates RV-approved DO candidates and exposes exactly one aggregate PR', () => {
  const auth = authorization()
  validateCoordinationIntegrationAuthorization(auth)
  const schema = JSON.parse(
    readFileSync(
      join(
        import.meta.dirname,
        '..',
        '..',
        'schemas',
        'coordination-integration-authorization.schema.json'
      ),
      'utf8'
    )
  ) as Record<string, unknown>
  validateJsonSchema(schema, auth)
  const first: CoordinationIntegrationItemResult = {
    order: 0,
    deliveryKey: 'api',
    candidateSha: '2'.repeat(40),
    state: 'INTEGRATED_VERIFIED',
    integratedSha: '8'.repeat(40),
    failureCode: null
  }
  assert.deepEqual(planCoordinationIntegration(auth, []).nextItem?.deliveryKey, 'api')
  const afterFirst = planCoordinationIntegration(auth, [first])
  assert.equal(afterFirst.nextItem?.deliveryKey, 'web')
  const final = planCoordinationIntegration(auth, [
    first,
    {
      order: 1,
      deliveryKey: 'web',
      candidateSha: '3'.repeat(40),
      state: 'INTEGRATED_VERIFIED',
      integratedSha: '9'.repeat(40),
      failureCode: null
    }
  ])
  assert.equal(final.status, 'AGGREGATE_CANDIDATE_READY')
  assert.equal(final.pullRequestCount, 1)
})

test('independent PR topology requires the explicit exception and independent releases', () => {
  const value = authorization('INDEPENDENT')
  assert.equal(planCoordinationIntegration(value, []).pullRequestCount, 2)
  value.independentPrExceptionConfirmed = false
  value.authorizationFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(
    () => validateCoordinationIntegrationAuthorization(value),
    /COORDINATION_INDEPENDENT_PR_EXCEPTION_UNPROVEN/
  )
})

test('a failed integration preserves the verified prefix and blocks the suffix', () => {
  const value = authorization()
  const results: CoordinationIntegrationItemResult[] = [
    {
      order: 0,
      deliveryKey: 'api',
      candidateSha: '2'.repeat(40),
      state: 'INTEGRATED_VERIFIED',
      integratedSha: '8'.repeat(40),
      failureCode: null
    },
    {
      order: 1,
      deliveryKey: 'web',
      candidateSha: '3'.repeat(40),
      state: 'FAILED',
      integratedSha: null,
      failureCode: 'CONFLICT'
    }
  ]
  const plan = planCoordinationIntegration(value, results)
  assert.equal(plan.status, 'STOPPED_FAILURE')
  assert.deepEqual(plan.integratedPrefix, ['api'])
})
