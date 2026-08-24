import test from 'node:test'
import assert from 'node:assert/strict'
import {
  planChildSelfCleanup,
  verifyChildCleanupResults,
  verifyCleanupOnlyDeletion
} from '../src/cleanup.ts'
import { objectFingerprint } from '../src/canonical.ts'
import { cleanupAuthorization } from './helpers.ts'

const key = (kind: string, path: string, sha: string | null) => `${kind}:${path}:${sha ?? 'NONE'}`
const absent = (resource: {
  kind: 'remote-branch' | 'local-branch' | 'worktree' | 'task-temp'
  path: string
  expectedSha: string | null
}) => ({ ...resource, exists: false, clean: true, actualSha: null })

test('child cleanup narrows to exact owner resources and preserves SHA mismatch', () => {
  const authorization = cleanupAuthorization()
  const plan = planChildSelfCleanup(authorization, '/root/sl/fl-alpha', [
    {
      kind: 'remote-branch',
      path: 'codex/feature/alpha',
      expectedSha: '1'.repeat(40),
      exists: true,
      clean: true,
      actualSha: '1'.repeat(40)
    },
    {
      kind: 'worktree',
      path: '/tmp/fl-alpha',
      expectedSha: '1'.repeat(40),
      exists: true,
      clean: true,
      actualSha: '9'.repeat(40)
    }
  ])
  assert.deepEqual(
    plan.map((item) => item.decision),
    ['REMOVE', 'PRESERVE_FAILURE']
  )
  plan[0].observedAfter = absent(plan[0].resource)
  assert.throws(
    () =>
      verifyChildCleanupResults(authorization, {
        '/root/sl/fl-alpha': plan,
        '/root/sl/fl-beta': [
          {
            resource: authorization.terminalFeatures[1].resources[0],
            decision: 'ALREADY_ABSENT',
            reason: 'observed absent',
            observedBefore: absent(authorization.terminalFeatures[1].resources[0]),
            observedAfter: absent(authorization.terminalFeatures[1].resources[0])
          }
        ]
      }),
    /STAGE_CLEANUP_PARTIAL_FAILURE/
  )
})

test('child cleanup never plans protected main or Feature Packet removal', () => {
  for (const resource of [
    { kind: 'local-branch', path: 'main', expectedSha: '1'.repeat(40) },
    {
      kind: 'feature-packet',
      path: 'docs/plans/features/alpha.md',
      expectedSha: '1'.repeat(40)
    }
  ]) {
    const authorization = cleanupAuthorization()
    authorization.terminalFeatures[0].resources[0] = resource as never
    authorization.authorizationFingerprint = objectFingerprint(
      authorization as unknown as Record<string, unknown>,
      'authorizationFingerprint'
    )
    assert.throws(() =>
      planChildSelfCleanup(authorization, '/root/sl/fl-alpha', [
        { ...resource, exists: true, clean: true, actualSha: '1'.repeat(40) }
      ] as never)
    )
  }
})

test('missing observation is a preserved failure rather than claimed absence', () => {
  const authorization = cleanupAuthorization()
  const plan = planChildSelfCleanup(authorization, '/root/sl/fl-alpha', [])
  assert.deepEqual(
    plan.map((item) => item.decision),
    ['PRESERVE_FAILURE', 'PRESERVE_FAILURE']
  )
})

test('verified prior child resource is not repeated during partial retry', () => {
  const authorization = cleanupAuthorization()
  const completedResource = authorization.terminalFeatures[0].resources[0]
  const completedAfter = absent(completedResource)
  const completed = [
    {
      resource: completedResource,
      observedAfter: completedAfter,
      completionFingerprint: objectFingerprint(
        { resource: completedResource, observedAfter: completedAfter },
        '__none__'
      )
    }
  ]
  const worktree = authorization.terminalFeatures[0].resources[1]
  const plan = planChildSelfCleanup(
    authorization,
    '/root/sl/fl-alpha',
    [absent(worktree)],
    completed
  )
  assert.deepEqual(
    plan.map((item) => item.decision),
    ['SKIP_COMPLETED', 'ALREADY_ABSENT']
  )
  const beta = authorization.terminalFeatures[1].resources[0]
  verifyChildCleanupResults(authorization, {
    '/root/sl/fl-alpha': plan,
    '/root/sl/fl-beta': [
      {
        resource: beta,
        decision: 'ALREADY_ABSENT',
        reason: 'observed absent',
        observedBefore: absent(beta),
        observedAfter: absent(beta)
      }
    ]
  })
})

test('cleanup-only diff must contain exactly terminal Feature Packet deletions', () => {
  const authorization = cleanupAuthorization()
  verifyCleanupOnlyDeletion(authorization, [
    { status: 'D', path: 'docs/plans/features/beta.md' },
    { status: 'D', path: 'docs/plans/features/alpha.md' }
  ])
  assert.throws(
    () =>
      verifyCleanupOnlyDeletion(authorization, [
        { status: 'D', path: 'docs/plans/features/alpha.md' },
        { status: 'M', path: 'docs/governance/codex-execution-model.md' }
      ]),
    /CLEANUP_ONLY_NON_DELETION_CHANGE/
  )
})

test('an absence observation for another resource cannot complete the bound resource', () => {
  const authorization = cleanupAuthorization()
  const alpha = authorization.terminalFeatures[0].resources[0]
  const wrong = { ...absent(alpha), path: 'codex/feature/not-alpha' }
  const result = {
    resource: alpha,
    decision: 'ALREADY_ABSENT' as const,
    reason: 'wrong observation',
    observedBefore: wrong,
    observedAfter: wrong
  }
  const worktree = authorization.terminalFeatures[0].resources[1]
  const beta = authorization.terminalFeatures[1].resources[0]
  assert.throws(
    () =>
      verifyChildCleanupResults(authorization, {
        '/root/sl/fl-alpha': [
          result,
          {
            resource: worktree,
            decision: 'ALREADY_ABSENT',
            reason: 'exact absence',
            observedBefore: absent(worktree),
            observedAfter: absent(worktree)
          }
        ],
        '/root/sl/fl-beta': [
          {
            resource: beta,
            decision: 'ALREADY_ABSENT',
            reason: 'exact absence',
            observedBefore: absent(beta),
            observedAfter: absent(beta)
          }
        ]
      }),
    /STAGE_CLEANUP_OBSERVATION_IDENTITY_MISMATCH/
  )
})

test('Stage cleanup verification rejects unknown decisions without observations', () => {
  const authorization = cleanupAuthorization()
  const results = Object.fromEntries(
    authorization.terminalFeatures.map((feature) => [
      feature.ownerTaskId,
      feature.resources.map((resource) => ({
        resource,
        decision: 'UNDECLARED_SUCCESS',
        reason: 'caller-selected terminal result',
        observedBefore: null,
        observedAfter: null
      }))
    ])
  )
  assert.throws(
    () => verifyChildCleanupResults(authorization, results as never),
    /STAGE_CLEANUP_RESULT_DECISION_INVALID/
  )
})

test('Stage cleanup removal verification requires a clean SHA-matched before observation', () => {
  const authorization = cleanupAuthorization()
  const results = Object.fromEntries(
    authorization.terminalFeatures.map((feature) => [
      feature.ownerTaskId,
      feature.resources.map((resource) => ({
        resource,
        decision: 'REMOVE',
        reason: 'claimed removal',
        observedBefore: {
          ...resource,
          exists: true,
          clean: false,
          actualSha: resource.expectedSha
        },
        observedAfter: absent(resource)
      }))
    ])
  )
  assert.throws(
    () => verifyChildCleanupResults(authorization, results as never),
    /STAGE_CLEANUP_REMOVAL_NOT_VERIFIED/
  )
})
