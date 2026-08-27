import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  planChildSelfCleanup,
  verifyChildCleanupResults,
  verifyCleanupOnlyDeletion
} from '../src/cleanup.ts'
import { objectFingerprint } from '../src/canonical.ts'
import type { OwnerResourceBinding } from '../src/resource-topology.types.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'
import type { StageCleanupAuthorization } from '../src/types.ts'
import { cleanupAuthorization } from './helpers.ts'

const cleanupSchema = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', 'schemas', 'stage-cleanup-authorization.schema.json'),
    'utf8'
  )
) as Record<string, unknown>

const key = (kind: string, path: string, sha: string | null) => `${kind}:${path}:${sha ?? 'NONE'}`
const absent = (resource: {
  kind: 'remote-branch' | 'local-branch' | 'worktree' | 'task-temp'
  path: string
  expectedSha: string | null
}) => ({ ...resource, exists: false, clean: true, actualSha: null })

/** Converts every bound cleanup resource into one verified absence result. */
function absentResults(resources: StageCleanupAuthorization['terminalFeatures'][number]['resources']) {
  return resources.map((resource) => ({
    resource,
    decision: 'ALREADY_ABSENT' as const,
    reason: 'observed absent',
    observedBefore: absent(resource),
    observedAfter: absent(resource)
  }))
}

/** Creates one exact stable owner identity for cleanup derivation tests. */
function stableOwnerBinding(): OwnerResourceBinding {
  const ownerClone = '/Users/fixture/.codex/oes/owners/11111111/oes'
  const artifactRoot = '/Users/fixture/.codex/oes/artifacts/11111111/runtime'
  const binding: OwnerResourceBinding = {
    schemaVersion: 1,
    kind: 'OES_OWNER_RESOURCE_BINDING',
    bindingFingerprint: '',
    resourceTopologyVersion: 'stable-owner-exclusive-v1',
    ownerTaskId: '11111111-1111-4111-8111-111111111111',
    directParentTaskId: '22222222-2222-4222-8222-222222222222',
    transitionId: 'stable-owner:1',
    repositoryRoot: ownerClone,
    repositoryRemoteUrl: 'https://github.com/example/oes.git',
    ownerClone,
    ownerGitDirectory: `${ownerClone}/.git`,
    ownerRef: 'refs/heads/codex/feature/runtime',
    artifactRoot,
    taskTempRoot: '/private/tmp/oes-runtime-11111111',
    featurePacket: 'docs/plans/features/runtime.md',
    featurePacketCheckpointPath: `${artifactRoot}/feature-packet.md`,
    currentEvidenceManifestPath: `${artifactRoot}/current-evidence-manifest.json`,
    checkpointBundlePath: `${artifactRoot}/checkpoint-bundle.json`,
    gitBundlePath: `${artifactRoot}/owner.bundle`
  }
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  return binding
}

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
      path: '/private/tmp/oes-fl-alpha',
      expectedSha: '1'.repeat(40),
      exists: true,
      clean: true,
      actualSha: '9'.repeat(40)
    }
  ])
  assert.deepEqual(
    plan.map((item) => item.decision),
    ['REMOVE', 'PRESERVE_FAILURE', 'PRESERVE_FAILURE', 'PRESERVE_FAILURE']
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

test('stable cleanup derives only exact owner binding resources and rejects mixed topology', () => {
  const authorization = cleanupAuthorization()
  const binding = stableOwnerBinding()
  authorization.stageOwnerTaskId = binding.directParentTaskId
  authorization.allowedDeletedFeaturePackets = [binding.featurePacket]
  authorization.terminalFeatures = [
    {
      featureKey: 'runtime',
      ownerTaskId: binding.ownerTaskId,
      candidateSha: '1'.repeat(40),
      mergeSha: '2'.repeat(40),
      featurePacket: binding.featurePacket,
      resourceTopologyVersion: 'stable-owner-exclusive-v1',
      ownerResourceBinding: binding,
      resources: [
        {
          kind: 'remote-branch',
          path: 'codex/feature/runtime',
          expectedSha: '1'.repeat(40),
          resourceTopologyVersion: 'stable-owner-exclusive-v1'
        },
        {
          kind: 'worktree',
          path: binding.ownerClone,
          expectedSha: '1'.repeat(40),
          resourceTopologyVersion: 'stable-owner-exclusive-v1'
        },
        {
          kind: 'local-branch',
          path: 'codex/feature/runtime',
          expectedSha: '1'.repeat(40),
          resourceTopologyVersion: 'stable-owner-exclusive-v1'
        },
        {
          kind: 'task-temp',
          path: binding.taskTempRoot,
          expectedSha: null,
          resourceTopologyVersion: 'stable-owner-exclusive-v1'
        }
      ]
    }
  ]
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  validateJsonSchema(cleanupSchema, authorization)
  const observations = authorization.terminalFeatures[0].resources.map((resource) => ({
    ...resource,
    exists: true,
    clean: true,
    actualSha: resource.expectedSha
  }))
  assert.deepEqual(
    planChildSelfCleanup(authorization, binding.ownerTaskId, observations).map(
      (item) => item.decision
    ),
    ['REMOVE', 'REMOVE', 'REMOVE', 'REMOVE']
  )

  authorization.terminalFeatures[0].resources.pop()
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(() => validateJsonSchema(cleanupSchema, authorization), /contains|minItems/)
  assert.throws(
    () => planChildSelfCleanup(authorization, binding.ownerTaskId, observations),
    /CLEANUP_RESOURCE_KIND_SET_INCOMPLETE/
  )

  authorization.terminalFeatures[0].resources.push({
    kind: 'task-temp',
    path: binding.taskTempRoot,
    expectedSha: null,
    resourceTopologyVersion: 'stable-owner-exclusive-v1'
  })

  delete authorization.terminalFeatures[0].resources[0].resourceTopologyVersion
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(() => validateJsonSchema(cleanupSchema, authorization), /required/)
  assert.throws(
    () => planChildSelfCleanup(authorization, binding.ownerTaskId, observations),
    /CLEANUP_RESOURCE_TOPOLOGY_MIXED/
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
    ['PRESERVE_FAILURE', 'PRESERVE_FAILURE', 'PRESERVE_FAILURE', 'PRESERVE_FAILURE']
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
  const remaining = authorization.terminalFeatures[0].resources.slice(2)
  const plan = planChildSelfCleanup(
    authorization,
    '/root/sl/fl-alpha',
    [absent(worktree), ...remaining.map(absent)],
    completed
  )
  assert.deepEqual(
    plan.map((item) => item.decision),
    ['SKIP_COMPLETED', 'ALREADY_ABSENT', 'ALREADY_ABSENT', 'ALREADY_ABSENT']
  )
  verifyChildCleanupResults(authorization, {
    '/root/sl/fl-alpha': plan,
    '/root/sl/fl-beta': absentResults(authorization.terminalFeatures[1].resources)
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
  assert.throws(
    () =>
      verifyChildCleanupResults(authorization, {
        '/root/sl/fl-alpha': [
          result,
          ...absentResults(authorization.terminalFeatures[0].resources.slice(1))
        ],
        '/root/sl/fl-beta': absentResults(authorization.terminalFeatures[1].resources)
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
