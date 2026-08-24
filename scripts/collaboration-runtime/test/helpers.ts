import { mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { canonicalJson, objectFingerprint, sha256 } from '../src/canonical.ts'
import type {
  RemoteActionAuthorization,
  RemoteAuthorizationRoot,
  RemoteDriverBinding,
  RemoteTrustRoots,
  StageCleanupAuthorization
} from '../src/types.ts'

const trustByBinding = new WeakMap<RemoteDriverBinding, RemoteTrustRoots>()

/** Returns the fixture trust context separately from the untrusted binding. */
export function remoteTrust(binding: RemoteDriverBinding): RemoteTrustRoots {
  const trust = trustByBinding.get(binding)
  if (!trust) throw new Error('fixture trust context absent')
  return trust
}

/** Reissues a fixture action authorization and seals the exact binding against it. */
export function authorizeRemoteBinding(binding: RemoteDriverBinding): RemoteDriverBinding {
  const authorizationRoot = mkdtempSync(join(tmpdir(), 'oes-remote-authorization-test-'))
  const admissionRoot = mkdtempSync(join(tmpdir(), 'oes-remote-admission-test-'))
  if (binding.admission?.mode === 'serial-latest-main')
    binding.admission.lockPath = join(admissionRoot, 'latest-main.lock')
  const rootRecord: RemoteAuthorizationRoot = {
    schemaVersion: 1,
    kind: 'OES_REMOTE_AUTHORIZATION_ROOT',
    recordFingerprint: '',
    status: 'ACTIVE',
    issuerTaskId: '/root/fixture-authority',
    owner: binding.owner,
    expectedState: binding.expectedState,
    stateVersion: binding.stateVersion,
    transitionId: binding.transitionId,
    rootConfirmationFingerprint: 'e'.repeat(64),
    scopeFingerprint: binding.scopeFingerprint,
    truthBaseline: binding.truthBaseline,
    repositoryRoot: binding.repositoryRoot,
    repositorySlug: binding.repositorySlug,
    artifactRoot: binding.artifactRoot,
    allowedActions: [binding.action],
    mergeAuthorizationFingerprint: binding.mergeAuthorizationFingerprint,
    cleanupAuthorizationFingerprint: binding.cleanupAuthorizationFingerprint
  }
  rootRecord.recordFingerprint = objectFingerprint(
    rootRecord as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  const rootPath = join(authorizationRoot, 'root-authorization.json')
  const rootBytes = `${canonicalJson(rootRecord)}\n`
  writeFileSync(rootPath, rootBytes)
  const resourceSetFingerprint = objectFingerprint(
    {
      checkpointPath: binding.checkpointPath,
      resultPath: binding.resultPath,
      invalidationPath: binding.invalidationPath,
      pullRequest: binding.pullRequest,
      admission: binding.admission ?? null,
      cleanupResources: binding.cleanupResources ?? [],
      expectedMergeSha: binding.expectedMergeSha ?? null
    },
    '__none__'
  )
  const authority: RemoteActionAuthorization = {
    schemaVersion: 1,
    kind: 'OES_REMOTE_ACTION_AUTHORIZATION',
    authorizationFingerprint: '',
    status: 'ISSUED',
    issuedBeforeRemoteMutation: true,
    issuerTaskId: '/root/fixture-authority',
    rootAuthorization: {
      path: rootPath,
      sha256: sha256(rootBytes),
      fingerprint: String(rootRecord.recordFingerprint)
    },
    owner: binding.owner,
    expectedState: binding.expectedState,
    stateVersion: binding.stateVersion,
    transitionId: binding.transitionId,
    rootConfirmationFingerprint: 'e'.repeat(64),
    scopeFingerprint: binding.scopeFingerprint,
    truthBaseline: binding.truthBaseline,
    integrationBase: binding.integrationBase,
    candidateSha: binding.candidateSha,
    allowedAction: binding.action,
    repositoryRoot: binding.repositoryRoot,
    repositorySlug: binding.repositorySlug,
    artifactRoot: binding.artifactRoot,
    headRef: binding.headRef,
    baseRef: binding.baseRef,
    singleUseNonce: binding.singleUseNonce,
    resourceSetFingerprint,
    postcondition: 'FIXTURE_POSTCONDITION',
    mergeAuthorizationFingerprint: binding.mergeAuthorizationFingerprint,
    cleanupAuthorizationFingerprint: binding.cleanupAuthorizationFingerprint
  }
  authority.authorizationFingerprint = objectFingerprint(
    authority as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  const authorityPath = join(authorizationRoot, 'action-authorization.json')
  const authorityBytes = `${canonicalJson(authority)}\n`
  writeFileSync(authorityPath, authorityBytes)
  binding.authorization = {
    path: authorityPath,
    sha256: sha256(authorityBytes),
    fingerprint: authority.authorizationFingerprint
  }
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  trustByBinding.set(binding, {
    authorizationRoot,
    admissionRoot,
    profilePath: '/fixture/installed-profile.toml',
    profileSha256: 'a'.repeat(64),
    ownerTaskId: binding.owner.taskId,
    profileExpectedState: 'DELIVERY_ACTIVE'
  })
  return binding
}

/** Creates one valid remote binding rooted in a disposable artifact directory. */
export function remoteBinding(overrides: Partial<RemoteDriverBinding> = {}): RemoteDriverBinding {
  const root = mkdtempSync(join(tmpdir(), 'oes-remote-driver-test-'))
  const binding: RemoteDriverBinding = {
    schemaVersion: 1,
    kind: 'OES_REMOTE_DRIVER_BINDING',
    bindingFingerprint: '',
    authorization: { path: '/pending', sha256: '0'.repeat(64), fingerprint: '0'.repeat(64) },
    action: 'publish-pr',
    owner: { role: 'Feature Lead', taskId: '/root/fl' },
    expectedState: 'LOCAL_REVIEW_PASSED',
    stateVersion: 3,
    transitionId: 'transition:3:publish',
    scopeFingerprint: 'd'.repeat(64),
    truthBaseline: '1'.repeat(40),
    integrationBase: '2'.repeat(40),
    candidateSha: '3'.repeat(40),
    repositoryRoot: root,
    repositorySlug: 'example/oes',
    artifactRoot: root,
    checkpointPath: join(root, 'checkpoint.json'),
    resultPath: join(root, 'result.json'),
    invalidationPath: join(root, 'invalidated.json'),
    singleUseNonce: 'nonce-1',
    headRef: 'codex/feature/runtime',
    baseRef: 'main',
    pullRequest: {
      baseRef: 'main',
      draft: true,
      number: null,
      requiredChecks: ['Baseline Checks'],
      title: 'Runtime',
      body: 'Exact candidate'
    },
    mergeMethod: 'merge',
    ...overrides
  }
  return authorizeRemoteBinding(binding)
}

/** Creates one valid two-feature Stage cleanup authorization. */
export function cleanupAuthorization(): StageCleanupAuthorization {
  const value: StageCleanupAuthorization = {
    schemaVersion: 1,
    kind: 'OES_STAGE_CLEANUP_AUTHORIZATION',
    authorizationFingerprint: '',
    stageKey: 'stage-1',
    stageOwnerTaskId: '/root/sl',
    transitionId: 'stage:cleanup:1',
    confirmationFingerprint: 'a'.repeat(64),
    cleanupOnlyBranch: 'codex/cleanup/stage-1',
    allowedDeletedFeaturePackets: ['docs/plans/features/alpha.md', 'docs/plans/features/beta.md'],
    terminalFeatures: [
      {
        featureKey: 'alpha',
        ownerTaskId: '/root/sl/fl-alpha',
        candidateSha: '1'.repeat(40),
        mergeSha: '2'.repeat(40),
        featurePacket: 'docs/plans/features/alpha.md',
        resources: [
          { kind: 'remote-branch', path: 'codex/feature/alpha', expectedSha: '1'.repeat(40) },
          { kind: 'worktree', path: '/tmp/fl-alpha', expectedSha: '1'.repeat(40) }
        ]
      },
      {
        featureKey: 'beta',
        ownerTaskId: '/root/sl/fl-beta',
        candidateSha: '3'.repeat(40),
        mergeSha: '4'.repeat(40),
        featurePacket: 'docs/plans/features/beta.md',
        resources: [
          { kind: 'remote-branch', path: 'codex/feature/beta', expectedSha: '3'.repeat(40) }
        ]
      }
    ]
  }
  value.authorizationFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  return value
}
