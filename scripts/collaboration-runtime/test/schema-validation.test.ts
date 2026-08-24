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

test('remote binding schema rejects Git-invalid owner refs accepted by neither runtime nor Git', () => {
  for (const headRef of [
    'codex/feature/./alpha',
    'codex/feature/.alpha',
    'codex/feature/alpha.lock',
    'codex/feature/alpha/'
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
