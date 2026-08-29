import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
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
import { validateJsonSchema } from '../src/schema-validation.ts'
import { cleanupAuthorization, remoteBinding, remoteTrust } from './helpers.ts'
import type {
  RemoteActionAuthorization,
  RemoteAuthorizationRoot,
  RemoteDriverBinding,
  RemoteTrustRoots,
  StageChildCleanupAuthorization,
  StageCleanupCurrentAuthorization
} from '../src/types.ts'
import type {
  OwnerResourceBinding,
  OwnerResourceReference
} from '../src/resource-topology.types.ts'
import { stableOwnerTaskTempLeaf } from '../src/resource-topology.ts'

const schema = (name: string) =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', name), 'utf8')) as Record<
    string,
    unknown
  >

/** Creates one sealed stable owner binding without changing the shared pre-cutover fixtures. */
function stableOwnerResourceFixture(): {
  binding: OwnerResourceBinding
  reference: OwnerResourceReference
} {
  const referenceRoot = mkdtempSync(join(tmpdir(), 'oes-stable-owner-binding-test-'))
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
    taskTempRoot: `/private/tmp/${stableOwnerTaskTempLeaf(
      '11111111-1111-4111-8111-111111111111'
    )}`,
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
  const path = join(referenceRoot, 'owner-resource-binding.json')
  const bytes = `${canonicalJson(binding)}\n`
  writeFileSync(path, bytes)
  return {
    binding,
    reference: { path, sha256: sha256(bytes), fingerprint: binding.bindingFingerprint }
  }
}

/** Reissues the shared fixture authority with the stable fields selected by one binding. */
function sealStableRemoteBinding(binding: RemoteDriverBinding): RemoteDriverBinding {
  const trust = remoteTrust(binding)
  trust.resourceTopologyVersion = 'stable-owner-exclusive-v1'
  trust.ownerResourceBinding = binding.ownerResourceBinding as OwnerResourceReference
  const authority = JSON.parse(
    readFileSync(binding.authorization.path, 'utf8')
  ) as RemoteActionAuthorization
  const root = JSON.parse(
    readFileSync(authority.rootAuthorization.path, 'utf8')
  ) as RemoteAuthorizationRoot
  root.resourceTopologyVersion = 'stable-owner-exclusive-v1'
  root.ownerResourceBinding = binding.ownerResourceBinding
  root.recordFingerprint = objectFingerprint(
    root as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  const rootBytes = `${canonicalJson(root)}\n`
  writeFileSync(authority.rootAuthorization.path, rootBytes)
  authority.rootAuthorization = {
    path: authority.rootAuthorization.path,
    sha256: sha256(rootBytes),
    fingerprint: root.recordFingerprint
  }
  authority.resourceTopologyVersion = 'stable-owner-exclusive-v1'
  authority.ownerResourceBinding = binding.ownerResourceBinding
  authority.resourceSetFingerprint = objectFingerprint(
    {
      checkpointPath: binding.checkpointPath,
      resultPath: binding.resultPath,
      invalidationPath: binding.invalidationPath,
      pullRequest: binding.pullRequest,
      admission: binding.admission ?? null,
      cleanupResources: binding.cleanupResources ?? [],
      expectedMergeSha: binding.expectedMergeSha ?? null,
      resourceTopologyVersion: binding.resourceTopologyVersion,
      ownerResourceBinding: binding.ownerResourceBinding
    },
    '__none__'
  )
  authority.authorizationFingerprint = objectFingerprint(
    authority as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  const authorityBytes = `${canonicalJson(authority)}\n`
  writeFileSync(binding.authorization.path, authorityBytes)
  binding.authorization = {
    path: binding.authorization.path,
    sha256: sha256(authorityBytes),
    fingerprint: authority.authorizationFingerprint
  }
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  return binding
}

test('remote binding accepts exact owner-scoped Draft PR publication', () => {
  const binding = remoteBinding()
  assert.equal(
    validateRemoteBinding(binding, remoteTrust(binding)).bindingFingerprint,
    binding.bindingFingerprint
  )
})

test('stable remote binding requires the profile-sealed owner and action-specific artifacts', () => {
  const { binding: ownerResources, reference } = stableOwnerResourceFixture()
  const actionRoot = `${ownerResources.artifactRoot}/remote-actions/publish-pr/nonce-1`
  const binding = sealStableRemoteBinding(
    remoteBinding({
      owner: { role: 'Feature Lead', taskId: ownerResources.ownerTaskId },
      repositoryRoot: ownerResources.repositoryRoot,
      artifactRoot: ownerResources.artifactRoot,
      checkpointPath: `${actionRoot}/checkpoint.json`,
      resultPath: `${actionRoot}/result.json`,
      invalidationPath: `${actionRoot}/invalidated.json`,
      headRef: 'codex/feature/runtime',
      resourceTopologyVersion: 'stable-owner-exclusive-v1',
      ownerResourceBinding: reference
    })
  )
  assert.equal(
    validateRemoteBinding(binding, remoteTrust(binding)).resourceTopologyVersion,
    'stable-owner-exclusive-v1'
  )
  const authority = JSON.parse(
    readFileSync(binding.authorization.path, 'utf8')
  ) as RemoteActionAuthorization
  const root = JSON.parse(
    readFileSync(authority.rootAuthorization.path, 'utf8')
  ) as RemoteAuthorizationRoot
  validateJsonSchema(schema('remote-binding.schema.json'), binding)
  validateJsonSchema(schema('remote-authorization.schema.json'), authority)
  validateJsonSchema(schema('remote-authorization-root.schema.json'), root)

  binding.checkpointPath = `${ownerResources.artifactRoot}/checkpoint.json`
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(
    () => validateRemoteBinding(binding, remoteTrust(binding)),
    /REMOTE_STABLE_ACTION_PATH_MISMATCH/
  )
})

test('pre-cutover remote profile rejects a stable binding as mixed topology', () => {
  const { binding: ownerResources, reference } = stableOwnerResourceFixture()
  const actionRoot = `${ownerResources.artifactRoot}/remote-actions/publish-pr/nonce-1`
  const binding = sealStableRemoteBinding(
    remoteBinding({
      owner: { role: 'Feature Lead', taskId: ownerResources.ownerTaskId },
      repositoryRoot: ownerResources.repositoryRoot,
      artifactRoot: ownerResources.artifactRoot,
      checkpointPath: `${actionRoot}/checkpoint.json`,
      resultPath: `${actionRoot}/result.json`,
      invalidationPath: `${actionRoot}/invalidated.json`,
      headRef: 'codex/feature/runtime',
      resourceTopologyVersion: 'stable-owner-exclusive-v1',
      ownerResourceBinding: reference
    })
  )
  const legacyTrust = {
    ...remoteTrust(binding),
    resourceTopologyVersion: 'pre-cutover-v1' as const,
    ownerResourceBinding: null
  }
  assert.throws(() => validateRemoteBinding(binding, legacyTrust), /REMOTE_RESOURCE_TOPOLOGY_MIXED/)
})

test('remote binding rejects main as a head ref even with a recomputed fingerprint', () => {
  const binding = remoteBinding({ headRef: 'main' })
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(() => validateRemoteBinding(binding, remoteTrust(binding)), /INVALID_OWNER_REF/)
})

test('remote binding rejects the Git pseudo-ref HEAD', () => {
  const binding = remoteBinding({ headRef: 'HEAD' })
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
    { kind: 'task-temp', path: '/private/tmp/oes-fl-alpha-artifacts', expectedSha: '1'.repeat(40) }
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
    path: '/private/tmp/oes-fl-alpha-artifacts',
    expectedSha: null
  })
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(
    () => validateStageCleanupAuthorization(authorization),
    /CLEANUP_RESOURCE_KIND_DUPLICATE/
  )
})

test('Stage cleanup rejects Stage-owned, protected, aliased, and Git-invalid child resources', () => {
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
    const authorization = cleanupAuthorization()
    authorization.terminalFeatures[0].resources[0] = resource as never
    authorization.authorizationFingerprint = objectFingerprint(
      authorization as unknown as Record<string, unknown>,
      'authorizationFingerprint'
    )
    assert.throws(() => validateStageCleanupAuthorization(authorization))
  }
})

test('Stage cleanup derives every resource and cleanup ref from its exact feature or Stage key', () => {
  for (const mutate of [
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[0].resources[0].path = 'codex/feature/beta'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[0].resources[1].path = '/private/tmp/oes-fl-beta'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[0].featurePacket = 'docs/plans/features/beta.md'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.cleanupOnlyBranch = 'codex/cleanup/other-stage'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[1].ownerTaskId = value.terminalFeatures[0].ownerTaskId
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[0].ownerTaskId = '/root/other/fl-alpha'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[0].ownerTaskId = '/root/sl/group/fl-alpha'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[0].ownerTaskId = '/root/sl/'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[0].ownerTaskId = '/root/sl/.'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.stageKey = '../stage-1'
    },
    (value: ReturnType<typeof cleanupAuthorization>) => {
      value.terminalFeatures[0].featureKey = '../alpha'
    }
  ]) {
    const authorization = cleanupAuthorization()
    mutate(authorization)
    authorization.authorizationFingerprint = objectFingerprint(
      authorization as unknown as Record<string, unknown>,
      'authorizationFingerprint'
    )
    assert.throws(() => validateStageCleanupAuthorization(authorization))
  }
})

test('Stage cleanup binds every SHA-bearing resource to the accepted feature candidate', () => {
  const authorization = cleanupAuthorization()
  const mismatchedSha = '9'.repeat(40)
  authorization.terminalFeatures[0].resources = [
    { kind: 'remote-branch', path: 'codex/feature/alpha', expectedSha: mismatchedSha },
    { kind: 'local-branch', path: 'codex/feature/alpha', expectedSha: mismatchedSha },
    { kind: 'worktree', path: '/private/tmp/oes-fl-alpha', expectedSha: mismatchedSha }
  ]
  authorization.authorizationFingerprint = objectFingerprint(
    authorization as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  assert.throws(
    () => validateStageCleanupAuthorization(authorization),
    /CLEANUP_RESOURCE_SHA_NOT_CANDIDATE/
  )
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
