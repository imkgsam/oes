import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateJsonSchema } from '../src/schema-validation.ts'
import { cleanupAuthorization, remoteBinding } from './helpers.ts'

const schema = (name: string) =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', name), 'utf8')) as Record<
    string,
    unknown
  >

test('executable schemas accept representative runtime bindings and Stage authorizations', () => {
  const binding = remoteBinding()
  const authority = JSON.parse(readFileSync(binding.authorization.path, 'utf8')) as {
    rootAuthorization: { path: string }
  }
  const rootAuthorization = JSON.parse(
    readFileSync(authority.rootAuthorization.path, 'utf8')
  ) as Record<string, unknown>
  validateJsonSchema(schema('remote-binding.schema.json'), binding)
  validateJsonSchema(schema('remote-authorization.schema.json'), authority)
  validateJsonSchema(schema('remote-authorization-root.schema.json'), rootAuthorization)
  const stage = cleanupAuthorization()
  validateJsonSchema(schema('stage-cleanup-authorization.schema.json'), stage)
  validateJsonSchema(schema('stage-child-cleanup-authorization.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_STAGE_CHILD_CLEANUP_AUTHORIZATION',
    authorizationFingerprint: 'a'.repeat(64),
    status: 'ISSUED',
    rootAuthorization: {
      path: '/trusted/stage.json',
      sha256: 'b'.repeat(64),
      fingerprint: stage.authorizationFingerprint
    },
    expectedState: stage.expectedState,
    stateVersion: stage.stateVersion,
    stageKey: stage.stageKey,
    stageOwnerTaskId: stage.stageOwnerTaskId,
    ownerTaskId: stage.terminalFeatures[0].ownerTaskId,
    transitionId: stage.transitionId,
    confirmationFingerprint: stage.confirmationFingerprint,
    resources: stage.terminalFeatures[0].resources,
    postcondition: 'CHILD_SELF_CLEANUP'
  })
  validateJsonSchema(schema('stage-cleanup-current-authorization.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_STAGE_CLEANUP_CURRENT_AUTHORIZATION',
    recordFingerprint: 'c'.repeat(64),
    status: 'ACTIVE',
    purpose: 'STAGE_CLEANUP_VERIFY',
    rootAuthorization: {
      path: '/trusted/stage.json',
      sha256: 'b'.repeat(64),
      fingerprint: stage.authorizationFingerprint
    },
    childAuthorization: null,
    stageKey: stage.stageKey,
    stageOwnerTaskId: stage.stageOwnerTaskId,
    ownerTaskId: stage.stageOwnerTaskId,
    expectedState: stage.expectedState,
    stateVersion: stage.stateVersion,
    transitionId: stage.transitionId,
    confirmationFingerprint: stage.confirmationFingerprint,
    postcondition: 'CURRENT_STAGE_CLEANUP'
  })
})

test('Proposal history and local-main bindings have executable closed schemas', () => {
  validateJsonSchema(schema('proposal-history.schema.json'), {
    audience: 'PROJECT_ROLE',
    history: [
      {
        schemaVersion: 1,
        kind: 'PROPOSAL_TRANSPORT',
        envelope: {
          schemaVersion: 1,
          kind: 'OES_UD_PROPOSAL',
          proposalId: 'proposal-001',
          proposalFingerprint: 'a'.repeat(64),
          scope: 'Continuous optimization',
          source: { role: 'Design Owner', taskId: '/root/design' },
          returnTaskId: '/root/fl',
          supersedesProposalId: null
        }
      }
    ]
  })
  validateJsonSchema(schema('local-main-sync-binding.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_LOCAL_MAIN_SYNC_BINDING',
    bindingFingerprint: 'a'.repeat(64),
    action: 'sync',
    repositoryRoot: '/fixture/oes',
    remote: 'origin',
    branch: 'main',
    expectedRemoteUrl: 'https://github.com/example/oes.git',
    expectedRemoteMainSha: 'b'.repeat(40),
    ownerTaskId: '/root/fl',
    transitionId: 'local-main:1',
    singleUseNonce: 'e'.repeat(64),
    humanConfirmationFingerprint: 'c'.repeat(64),
    confirmation: {
      path: '/trusted/local-main-confirmation.json',
      sha256: 'd'.repeat(64),
      fingerprint: 'c'.repeat(64)
    }
  })
  validateJsonSchema(schema('local-main-sync-confirmation.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_LOCAL_MAIN_SYNC_CONFIRMATION',
    confirmationFingerprint: 'c'.repeat(64),
    status: 'ISSUED',
    ownerTaskId: '/root/fl',
    transitionId: 'local-main:1',
    action: 'sync',
    repositoryRoot: '/fixture/oes',
    remote: 'origin',
    branch: 'main',
    expectedRemoteUrl: 'https://github.com/example/oes.git',
    expectedRemoteMainSha: 'b'.repeat(40),
    singleUseNonce: 'e'.repeat(64)
  })
  validateJsonSchema(schema('ci-rerun-receipt.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_CI_FAILED_JOB_RERUN_RECEIPT',
    receiptFingerprint: 'a'.repeat(64),
    idempotencyKey: 'b'.repeat(64),
    ownerTaskId: '/root/fl',
    transitionId: 'ci:1',
    observationFingerprint: 'd'.repeat(64),
    candidateSha: 'c'.repeat(40),
    workflowRunId: 'workflow-run-42',
    failedJobId: 'failed-job-7',
    action: 'RERUN_FAILED_JOB_ONCE'
  })
  validateJsonSchema(schema('ci-failure-observation.schema.json'), {
    schemaVersion: 1,
    kind: 'OES_CI_FAILED_JOB_OBSERVATION',
    observationFingerprint: 'd'.repeat(64),
    status: 'VERIFIED',
    ownerTaskId: '/root/fl',
    transitionId: 'ci:1',
    candidateSha: 'c'.repeat(40),
    workflowRun: {
      id: 'workflow-run-42',
      headSha: 'c'.repeat(40),
      status: 'completed',
      conclusion: 'failure'
    },
    failedJob: {
      id: 'failed-job-7',
      workflowRunId: 'workflow-run-42',
      headSha: 'c'.repeat(40),
      status: 'completed',
      conclusion: 'failure',
      failureKind: 'infrastructure'
    }
  })
})

test('executable Stage schema and runtime both reject an empty batch', () => {
  const value = cleanupAuthorization()
  value.terminalFeatures = []
  value.allowedDeletedFeaturePackets = []
  assert.throws(
    () => validateJsonSchema(schema('stage-cleanup-authorization.schema.json'), value),
    /minItems/
  )
})

test('Stage schema rejects an invalid cleanup resource identity', () => {
  const value = cleanupAuthorization()
  value.terminalFeatures[0].resources[0] = {
    kind: 'arbitrary-resource' as never,
    path: '',
    expectedSha: null
  }
  assert.throws(
    () => validateJsonSchema(schema('stage-cleanup-authorization.schema.json'), value),
    /enum|minLength/
  )
})

test('Stage root and child schemas exclude protected or Stage-owned cleanup resources', () => {
  const invalidResources = [
    { kind: 'local-branch', path: 'main', expectedSha: '1'.repeat(40) },
    { kind: 'remote-branch', path: 'release/alpha', expectedSha: '1'.repeat(40) },
    { kind: 'worktree', path: 'relative/fl-alpha', expectedSha: '1'.repeat(40) },
    {
      kind: 'feature-packet',
      path: 'docs/plans/features/alpha.md',
      expectedSha: '1'.repeat(40)
    },
    { kind: 'task-temp', path: '/private/tmp/oes-fl-alpha-artifacts', expectedSha: '1'.repeat(40) }
  ]
  for (const resource of invalidResources) {
    const root = cleanupAuthorization()
    root.terminalFeatures[0].resources[0] = resource as never
    assert.throws(() => validateJsonSchema(schema('stage-cleanup-authorization.schema.json'), root))
    assert.throws(() =>
      validateJsonSchema(schema('stage-child-cleanup-authorization.schema.json'), {
        schemaVersion: 1,
        kind: 'OES_STAGE_CHILD_CLEANUP_AUTHORIZATION',
        authorizationFingerprint: 'a'.repeat(64),
        status: 'ISSUED',
        rootAuthorization: {
          path: '/trusted/stage.json',
          sha256: 'b'.repeat(64),
          fingerprint: root.authorizationFingerprint
        },
        expectedState: root.expectedState,
        stateVersion: root.stateVersion,
        stageKey: root.stageKey,
        stageOwnerTaskId: root.stageOwnerTaskId,
        ownerTaskId: root.terminalFeatures[0].ownerTaskId,
        transitionId: root.transitionId,
        confirmationFingerprint: root.confirmationFingerprint,
        resources: [resource],
        postcondition: 'CHILD_SELF_CLEANUP'
      })
    )
  }
})

test('Stage schemas reject Stage-owned roots, filesystem aliases, and Git-invalid refs', () => {
  const invalidResources = [
    { kind: 'local-branch', path: 'codex/cleanup/other-stage', expectedSha: '1'.repeat(40) },
    { kind: 'remote-branch', path: 'codex/feature/./alpha', expectedSha: '1'.repeat(40) },
    { kind: 'remote-branch', path: 'codex/feature/.alpha', expectedSha: '1'.repeat(40) },
    { kind: 'remote-branch', path: 'codex/feature/alpha.lock', expectedSha: '1'.repeat(40) },
    { kind: 'remote-branch', path: 'codex/feature/alpha/', expectedSha: '1'.repeat(40) },
    { kind: 'worktree', path: '/Users/acehood/Documents/GitHub/oes', expectedSha: '1'.repeat(40) },
    { kind: 'worktree', path: '/private/tmp/oes-fl-alpha/', expectedSha: '1'.repeat(40) },
    { kind: 'task-temp', path: '/tmp', expectedSha: null }
  ]
  for (const resource of invalidResources) {
    const root = cleanupAuthorization()
    root.terminalFeatures[0].resources[0] = resource as never
    assert.throws(() => validateJsonSchema(schema('stage-cleanup-authorization.schema.json'), root))
  }
})

test('stable Stage child schema rejects a shared temp parent in binding and resource', () => {
  const taskTempRoot =
    '/private/tmp/oes-owner-bd7662a5eeb41614e720d477abfcb2272e19a8a70a93b7e3bc8560d44ad326e9'
  const ownerClone = '/Users/fixture/.codex/oes/owners/runtime/oes'
  const artifactRoot = '/Users/fixture/.codex/oes/artifacts/runtime'
  const ownerResourceBinding = {
    schemaVersion: 1,
    kind: 'OES_OWNER_RESOURCE_BINDING',
    bindingFingerprint: 'a'.repeat(64),
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
    taskTempRoot,
    featurePacket: 'docs/plans/features/runtime.md',
    featurePacketCheckpointPath: `${artifactRoot}/feature-packet.md`,
    currentEvidenceManifestPath: `${artifactRoot}/current-evidence.json`,
    checkpointBundlePath: `${artifactRoot}/checkpoint.json`,
    gitBundlePath: `${artifactRoot}/candidate.bundle`
  }
  const resources = [
    {
      kind: 'remote-branch',
      path: 'codex/feature/runtime',
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
      kind: 'worktree',
      path: ownerClone,
      expectedSha: '1'.repeat(40),
      resourceTopologyVersion: 'stable-owner-exclusive-v1'
    },
    {
      kind: 'task-temp',
      path: taskTempRoot,
      expectedSha: null,
      resourceTopologyVersion: 'stable-owner-exclusive-v1'
    }
  ]
  const child = {
    schemaVersion: 1,
    kind: 'OES_STAGE_CHILD_CLEANUP_AUTHORIZATION',
    authorizationFingerprint: 'b'.repeat(64),
    status: 'ISSUED',
    rootAuthorization: {
      path: '/trusted/stage.json',
      sha256: 'c'.repeat(64),
      fingerprint: 'd'.repeat(64)
    },
    expectedState: 'STAGE_CLEANUP_AUTHORIZED',
    stateVersion: 4,
    stageKey: 'stage-runtime',
    stageOwnerTaskId: ownerResourceBinding.directParentTaskId,
    ownerTaskId: ownerResourceBinding.ownerTaskId,
    transitionId: ownerResourceBinding.transitionId,
    confirmationFingerprint: 'e'.repeat(64),
    resources,
    postcondition: 'CHILD_SELF_CLEANUP',
    resourceTopologyVersion: 'stable-owner-exclusive-v1',
    ownerResourceBinding
  }
  assert.doesNotThrow(() =>
    validateJsonSchema(schema('stage-child-cleanup-authorization.schema.json'), child)
  )
  ownerResourceBinding.taskTempRoot = '/private/tmp'
  resources[3].path = '/private/tmp'
  assert.throws(
    () => validateJsonSchema(schema('stage-child-cleanup-authorization.schema.json'), child),
    /JSON_SCHEMA_VALIDATION_FAILED/
  )
})

test('Stage schemas reject empty and dot task owner segments', () => {
  for (const ownerTaskId of ['/root/sl/', '/root/sl/.']) {
    const root = cleanupAuthorization()
    root.terminalFeatures[0].ownerTaskId = ownerTaskId
    assert.throws(() => validateJsonSchema(schema('stage-cleanup-authorization.schema.json'), root))
  }
})

test('remote binding schema rejects Git-invalid owner refs accepted by neither runtime nor Git', () => {
  for (const headRef of [
    'codex/feature/./alpha',
    'codex/feature/.alpha',
    'codex/feature/alpha.lock',
    'codex/feature/alpha/',
    'HEAD'
  ]) {
    assert.throws(() =>
      validateJsonSchema(schema('remote-binding.schema.json'), remoteBinding({ headRef }))
    )
  }
})

test('effective-profile schema rejects duplicate declarations and open nested credential fields', () => {
  const value = {
    schemaVersion: 1,
    kind: 'OES_EFFECTIVE_PROFILE_REPORT',
    ownerTaskId: '/root/fl',
    transitionId: 't',
    expectedState: 'HANDOFF_PENDING',
    declaredCapabilities: ['filesystemWrite', 'filesystemWrite'],
    profile: { name: 'p', permission: 'owner', path: '/tmp/p', sha256: 'a'.repeat(64) },
    observations: [
      {
        name: 'filesystemWrite',
        command: 'probe',
        literalOutput: 'PASS',
        exitCode: 0,
        result: 'PASS',
        evidencePath: '/tmp/e',
        evidenceSha256: 'b'.repeat(64)
      }
    ],
    credentialReference: {
      reference: 'git',
      keys: ['username', 'password'],
      secretValuesRecorded: false,
      passwordValue: 'secret'
    },
    telemetry: {
      eventSource: '/tmp/t',
      eventSourceSha256: 'c'.repeat(64),
      approvalPolicy: 'on-request',
      approvalsReviewer: 'auto_review',
      approvalEventCount: 0,
      normalPermissionPromptCount: 0
    }
  }
  assert.throws(
    () => validateJsonSchema(schema('effective-profile-report.schema.json'), value),
    /uniqueItems|additionalProperties/
  )
})

test('remote binding schema and runtime both reject main as the owner head', () => {
  const value = remoteBinding({ headRef: 'main' })
  assert.throws(() => validateJsonSchema(schema('remote-binding.schema.json'), value), /not/)
})

test('executable schema validation fails closed on unknown keywords', () => {
  assert.throws(
    () => validateJsonSchema({ type: 'string', format: 'uri' }, 'https://example.test'),
    /JSON_SCHEMA_KEYWORD_UNSUPPORTED/
  )
})
