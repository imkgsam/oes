import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  loadTrustedStageChildCleanupAuthorization,
  loadTrustedStageCleanupAuthorization,
  validateRemoteBinding,
  validateStageCleanupAuthorization
} from '../src/binding.ts'
import { canonicalJson, objectFingerprint, sha256 } from '../src/canonical.ts'
import { cleanupAuthorization, remoteBinding, remoteTrust } from './helpers.ts'
import type {
  RemoteTrustRoots,
  StageChildCleanupAuthorization,
  StageCleanupCurrentAuthorization
} from '../src/types.ts'

test('remote binding accepts exact owner-scoped Draft PR publication', () => {
  const binding = remoteBinding()
  assert.equal(
    validateRemoteBinding(binding, remoteTrust(binding)).bindingFingerprint,
    binding.bindingFingerprint
  )
})

test('remote binding rejects main as a head ref even with a recomputed fingerprint', () => {
  const binding = remoteBinding({ headRef: 'main' })
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(() => validateRemoteBinding(binding, remoteTrust(binding)), /INVALID_OWNER_REF/)
})

test('merge binding requires exact Human authorization and Merge Commit method', () => {
  const binding = remoteBinding({
    action: 'merge-pr',
    pullRequest: {
      baseRef: 'main',
      draft: false,
      number: 7,
      requiredChecks: ['Baseline Checks'],
      title: 'Runtime',
      body: ''
    }
  })
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(
    () => validateRemoteBinding(binding, remoteTrust(binding)),
    /mergeAuthorizationFingerprint/
  )
})

test('Stage cleanup authorization fingerprint and packet set are exact', () => {
  const authorization = cleanupAuthorization()
  assert.equal(validateStageCleanupAuthorization(authorization).stageKey, 'stage-1')
  authorization.allowedDeletedFeaturePackets = ['docs/plans/features/alpha.md']
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(
    () => validateStageCleanupAuthorization(authorization),
    /CLEANUP_PACKET_SET_MISMATCH/
  )
})

test('self-hashed owner and state changes fail trusted authorization CAS', () => {
  const binding = remoteBinding()
  binding.owner = { role: 'Feature Lead', taskId: '/root/not-current-owner' }
  binding.expectedState = 'UNAUTHORIZED_STATE'
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(
    () => validateRemoteBinding(binding, remoteTrust(binding)),
    /RUNTIME_TRUST_OWNER_STATE_MISMATCH|REMOTE_AUTHORIZATION_CAS_MISMATCH/
  )
})

test('empty Stage cleanup batch is rejected consistently with schema', () => {
  const authorization = cleanupAuthorization()
  authorization.terminalFeatures = []
  authorization.allowedDeletedFeaturePackets = []
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(
    () => validateStageCleanupAuthorization(authorization),
    /CLEANUP_TERMINAL_FEATURES_REQUIRED/
  )
})

test('Stage cleanup runtime rejects resource identities rejected by its schema', () => {
  const authorization = cleanupAuthorization()
  authorization.terminalFeatures[0].resources[0] = {
    kind: 'arbitrary-resource' as never,
    path: '',
    expectedSha: null
  }
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(
    () => validateStageCleanupAuthorization(authorization),
    /INVALID_CLEANUP_RESOURCE_KIND/
  )
})

test('Stage cleanup runtime enforces the child-owned resource authority ceiling', () => {
  const invalidResources = [
    { kind: 'local-branch', path: 'main', expectedSha: '1'.repeat(40) },
    { kind: 'remote-branch', path: 'release/alpha', expectedSha: '1'.repeat(40) },
    { kind: 'worktree', path: 'relative/fl-alpha', expectedSha: '1'.repeat(40) },
    {
      kind: 'feature-packet',
      path: 'docs/plans/features/alpha.md',
      expectedSha: '1'.repeat(40)
    },
    { kind: 'task-temp', path: '/tmp/fl-alpha-artifacts', expectedSha: '1'.repeat(40) }
  ]
  for (const resource of invalidResources) {
    const authorization = cleanupAuthorization()
    authorization.terminalFeatures[0].resources[0] = resource as never
    authorization.authorizationFingerprint = objectFingerprint(
      authorization as unknown as Record<string, unknown>,
      'authorizationFingerprint'
    )
    assert.throws(() => validateStageCleanupAuthorization(authorization))
  }

  const authorization = cleanupAuthorization()
  authorization.terminalFeatures[0].resources.push({
    kind: 'task-temp',
    path: '/tmp/fl-alpha-artifacts',
    expectedSha: null
  })
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.equal(validateStageCleanupAuthorization(authorization).stageKey, 'stage-1')
})

test('per-command environment variables cannot replace the installed runtime trust roots', () => {
  const binding = remoteBinding()
  const trust = remoteTrust(binding)
  process.env.OES_REMOTE_AUTHORIZATION_ROOT = binding.artifactRoot
  process.env.OES_REMOTE_ADMISSION_ROOT = binding.artifactRoot
  try {
    assert.equal(
      validateRemoteBinding(binding, trust).bindingFingerprint,
      binding.bindingFingerprint
    )
    assert.throws(
      () => validateRemoteBinding(binding, undefined as never),
      /TRUSTED_RUNTIME_CONTEXT_REQUIRED/
    )
  } finally {
    delete process.env.OES_REMOTE_AUTHORIZATION_ROOT
    delete process.env.OES_REMOTE_ADMISSION_ROOT
  }
})

test('protected child cleanup assignment is exact and derives the current profile owner', () => {
  const rootDirectory = mkdtempSync(join(tmpdir(), 'oes-stage-cleanup-trust-test-'))
  const rootAuthorization = cleanupAuthorization()
  const rootPath = join(rootDirectory, 'stage-cleanup-authorization.json')
  const rootBytes = `${canonicalJson(rootAuthorization)}\n`
  writeFileSync(rootPath, rootBytes)
  const ownerTaskId = '/root/sl/fl-alpha'
  const child: StageChildCleanupAuthorization = {
    schemaVersion: 1,
    kind: 'OES_STAGE_CHILD_CLEANUP_AUTHORIZATION',
    authorizationFingerprint: '',
    status: 'ISSUED',
    rootAuthorization: {
      path: rootPath,
      sha256: sha256(rootBytes),
      fingerprint: rootAuthorization.authorizationFingerprint
    },
    expectedState: rootAuthorization.expectedState,
    stateVersion: rootAuthorization.stateVersion,
    stageKey: rootAuthorization.stageKey,
    stageOwnerTaskId: rootAuthorization.stageOwnerTaskId,
    ownerTaskId,
    transitionId: rootAuthorization.transitionId,
    confirmationFingerprint: rootAuthorization.confirmationFingerprint,
    resources: rootAuthorization.terminalFeatures[0].resources,
    postcondition: 'CHILD_SELF_CLEANUP'
  }
  child.authorizationFingerprint = objectFingerprint(
    child as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  const childPath = join(rootDirectory, 'child-cleanup-authorization.json')
  const childBytes = `${canonicalJson(child)}\n`
  writeFileSync(childPath, childBytes)
  const current: StageCleanupCurrentAuthorization = {
    schemaVersion: 1,
    kind: 'OES_STAGE_CLEANUP_CURRENT_AUTHORIZATION',
    recordFingerprint: '',
    status: 'ACTIVE',
    purpose: 'CHILD_SELF_CLEANUP',
    rootAuthorization: child.rootAuthorization,
    childAuthorization: {
      path: childPath,
      sha256: sha256(childBytes),
      fingerprint: child.authorizationFingerprint
    },
    stageKey: rootAuthorization.stageKey,
    stageOwnerTaskId: rootAuthorization.stageOwnerTaskId,
    ownerTaskId,
    expectedState: rootAuthorization.expectedState,
    stateVersion: rootAuthorization.stateVersion,
    transitionId: rootAuthorization.transitionId,
    confirmationFingerprint: rootAuthorization.confirmationFingerprint,
    postcondition: 'CURRENT_STAGE_CLEANUP'
  }
  current.recordFingerprint = objectFingerprint(
    current as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  writeFileSync(join(rootDirectory, 'current-stage-cleanup.json'), `${canonicalJson(current)}\n`)
  const trust: RemoteTrustRoots = {
    authorizationRoot: rootDirectory,
    admissionRoot: join(rootDirectory, 'admission'),
    profilePath: '/installed/profile.toml',
    profileSha256: 'a'.repeat(64),
    ownerTaskId,
    profileExpectedState: 'DELIVERY_ACTIVE'
  }
  assert.equal(
    loadTrustedStageChildCleanupAuthorization(rootPath, childPath, trust).child.ownerTaskId,
    ownerTaskId
  )
  assert.throws(
    () =>
      loadTrustedStageChildCleanupAuthorization(rootPath, childPath, {
        ...trust,
        ownerTaskId: '/root/sl/fl-beta'
      }),
    /STAGE_CLEANUP_CURRENT_CAS_MISMATCH/
  )

  const staleRoot = cleanupAuthorization()
  staleRoot.transitionId = 'stage:cleanup:stale'
  staleRoot.stateVersion = rootAuthorization.stateVersion + 1
  staleRoot.authorizationFingerprint = objectFingerprint(
    staleRoot as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  const staleRootPath = join(rootDirectory, 'stale-stage-cleanup-authorization.json')
  writeFileSync(staleRootPath, `${canonicalJson(staleRoot)}\n`)
  assert.throws(
    () => loadTrustedStageChildCleanupAuthorization(staleRootPath, childPath, trust),
    /STAGE_CLEANUP_CURRENT_PURPOSE_MISMATCH/
  )
})

test('fixed protected cleanup CAS rejects stale and invalidated Stage cards', () => {
  const directory = mkdtempSync(join(tmpdir(), 'oes-stage-cleanup-current-test-'))
  const root = cleanupAuthorization()
  const rootPath = join(directory, 'stage-cleanup-authorization.json')
  const rootBytes = `${canonicalJson(root)}\n`
  writeFileSync(rootPath, rootBytes)
  const current: StageCleanupCurrentAuthorization = {
    schemaVersion: 1,
    kind: 'OES_STAGE_CLEANUP_CURRENT_AUTHORIZATION',
    recordFingerprint: '',
    status: 'ACTIVE',
    purpose: 'STAGE_CLEANUP_VERIFY',
    rootAuthorization: {
      path: rootPath,
      sha256: sha256(rootBytes),
      fingerprint: root.authorizationFingerprint
    },
    childAuthorization: null,
    stageKey: root.stageKey,
    stageOwnerTaskId: root.stageOwnerTaskId,
    ownerTaskId: root.stageOwnerTaskId,
    expectedState: root.expectedState,
    stateVersion: root.stateVersion,
    transitionId: root.transitionId,
    confirmationFingerprint: root.confirmationFingerprint,
    postcondition: 'CURRENT_STAGE_CLEANUP'
  }
  const writeCurrent = () => {
    current.recordFingerprint = objectFingerprint(
      current as unknown as Record<string, unknown>,
      'recordFingerprint'
    )
    writeFileSync(join(directory, 'current-stage-cleanup.json'), `${canonicalJson(current)}\n`)
  }
  writeCurrent()
  const trust: RemoteTrustRoots = {
    authorizationRoot: directory,
    admissionRoot: join(directory, 'admission'),
    profilePath: '/installed/profile.toml',
    profileSha256: 'a'.repeat(64),
    ownerTaskId: root.stageOwnerTaskId,
    profileExpectedState: 'DELIVERY_ACTIVE'
  }
  assert.equal(
    loadTrustedStageCleanupAuthorization(rootPath, trust).transitionId,
    root.transitionId
  )

  const stale = cleanupAuthorization()
  stale.transitionId = 'stage:cleanup:stale'
  stale.stateVersion += 1
  stale.authorizationFingerprint = objectFingerprint(
    stale as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  const stalePath = join(directory, 'stale-stage-cleanup-authorization.json')
  writeFileSync(stalePath, `${canonicalJson(stale)}\n`)
  assert.throws(
    () => loadTrustedStageCleanupAuthorization(stalePath, trust),
    /STAGE_CLEANUP_CURRENT_PURPOSE_MISMATCH/
  )

  current.status = 'INVALIDATED'
  writeCurrent()
  assert.throws(
    () => loadTrustedStageCleanupAuthorization(rootPath, trust),
    /STAGE_CLEANUP_CURRENT_NOT_ACTIVE/
  )
})

test('official cleanup plan rejects caller-minted authorization and owner arguments', () => {
  const directory = mkdtempSync(join(tmpdir(), 'oes-cleanup-cli-untrusted-test-'))
  const authorizationPath = join(directory, 'caller-authorization.json')
  const observationsPath = join(directory, 'observations.json')
  writeFileSync(authorizationPath, `${canonicalJson(cleanupAuthorization())}\n`)
  writeFileSync(observationsPath, '[]\n')
  const result = spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      'scripts/collaboration-runtime/src/cli.ts',
      'cleanup-plan',
      '--authorization',
      authorizationPath,
      '--owner',
      '/root/sl/fl-alpha',
      '--observed',
      observationsPath,
      '--output',
      join(directory, 'plan.json')
    ],
    { cwd: process.cwd(), encoding: 'utf8' }
  )
  assert.equal(result.status, 2)
  assert.match(result.stderr, /CLI_ARGUMENT_REQUIRED: --profile-report/)
})
