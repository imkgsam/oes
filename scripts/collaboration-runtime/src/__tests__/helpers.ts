import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { canonicalJson, objectFingerprint, sha256 } from '../canonical.ts'
import type {
  RemoteActionAuthorization,
  RemoteAuthorizationRoot,
  RemoteDriverBinding,
  RemoteTrustRoots,
  CoordinationCleanupAuthorization
} from '../types.ts'

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
    cleanupAuthorizationFingerprint: binding.cleanupAuthorizationFingerprint,
    resourceTopologyVersion: 'owner-exclusive-v2',
    ownerResourceBinding: binding.ownerResourceBinding
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
      expectedMergeSha: binding.expectedMergeSha ?? null,
      resourceTopologyVersion: binding.resourceTopologyVersion,
      ownerResourceBinding: binding.ownerResourceBinding ?? null
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
    cleanupAuthorizationFingerprint: binding.cleanupAuthorizationFingerprint,
    resourceTopologyVersion: 'owner-exclusive-v2',
    ownerResourceBinding: binding.ownerResourceBinding
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
    profileTransitionId: binding.transitionId,
    profileExpectedState: 'DELIVERY_ACTIVE',
    resourceTopologyVersion: 'owner-exclusive-v2',
    ownerResourceBinding: binding.ownerResourceBinding
  })
  return binding
}

/** Creates one valid V2 remote binding rooted in an owner-exclusive test clone. */
export function remoteBinding(overrides: Partial<RemoteDriverBinding> = {}): RemoteDriverBinding {
  const parent = join(process.cwd(), '.tmp-collaboration-runtime-tests')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'owner-'))
  const artifactRoot = mkdtempSync(join(parent, 'artifacts-'))
  const base: RemoteDriverBinding = {
    schemaVersion: 1,
    kind: 'OES_REMOTE_DRIVER_BINDING',
    bindingFingerprint: '',
    authorization: { path: '/pending', sha256: '0'.repeat(64), fingerprint: '0'.repeat(64) },
    action: 'publish-pr',
    owner: { role: 'DO', taskId: '/root/do' },
    expectedState: 'LOCAL_REVIEW_PASSED',
    stateVersion: 3,
    transitionId: 'transition:3:publish',
    scopeFingerprint: 'd'.repeat(64),
    truthBaseline: '1'.repeat(40),
    integrationBase: '2'.repeat(40),
    candidateSha: '3'.repeat(40),
    repositoryRoot: root,
    repositorySlug: 'example/oes',
    artifactRoot,
    checkpointPath: '',
    resultPath: '',
    invalidationPath: '',
    singleUseNonce: 'nonce-1',
    headRef: 'codex/delivery/runtime',
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
  const ownerBinding = {
    schemaVersion: 1 as const,
    kind: 'OES_OWNER_RESOURCE_BINDING' as const,
    bindingFingerprint: '',
    resourceTopologyVersion: 'owner-exclusive-v2' as const,
    ownerTaskId: base.owner.taskId,
    directParentTaskId: '/root/parent',
    transitionId: base.transitionId,
    repositoryRoot: base.repositoryRoot,
    repositoryRemoteUrl: `https://github.com/${base.repositorySlug}.git`,
    ownerClone: base.repositoryRoot,
    ownerGitDirectory: join(base.repositoryRoot, '.git'),
    ownerRef: `refs/heads/${base.headRef}`,
    artifactRoot: base.artifactRoot,
    taskTempRoot: `/private/tmp/oes-owner-${sha256(base.owner.taskId)}`,
    deliveryRecord: 'docs/plans/deliveries/runtime.md',
    deliveryRecordCheckpointPath: join(base.artifactRoot, 'delivery-record.md'),
    currentEvidenceManifestPath: join(base.artifactRoot, 'current.json'),
    checkpointBundlePath: join(base.artifactRoot, 'bundle.json'),
    gitBundlePath: join(base.artifactRoot, 'owner.bundle')
  }
  ownerBinding.bindingFingerprint = objectFingerprint(
    ownerBinding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  const ownerPath = join(base.artifactRoot, 'owner-resource-binding.json')
  const ownerBytes = `${canonicalJson(ownerBinding)}\n`
  writeFileSync(ownerPath, ownerBytes)
  base.resourceTopologyVersion = 'owner-exclusive-v2'
  base.ownerResourceBinding = {
    path: ownerPath,
    sha256: sha256(ownerBytes),
    fingerprint: ownerBinding.bindingFingerprint
  }
  const actionRoot = join(base.artifactRoot, 'remote-actions', base.action, base.singleUseNonce)
  base.checkpointPath = join(actionRoot, 'checkpoint.json')
  base.resultPath = join(actionRoot, 'result.json')
  base.invalidationPath = join(actionRoot, 'invalidated.json')
  return authorizeRemoteBinding(base)
}

/** Creates one valid V2 two-DO terminal cleanup authorization. */
export function cleanupAuthorization(): CoordinationCleanupAuthorization {
  const binding = (key: string, ownerTaskId: string, sha: string) => ({
    schemaVersion: 1 as const,
    kind: 'OES_OWNER_RESOURCE_BINDING' as const,
    bindingFingerprint: 'f'.repeat(64),
    resourceTopologyVersion: 'owner-exclusive-v2' as const,
    ownerTaskId,
    directParentTaskId: '/root/co',
    transitionId: 'coordination:cleanup:1',
    repositoryRoot: '/fixture/oes',
    repositoryRemoteUrl: 'https://github.com/example/oes.git',
    ownerClone: `/private/tmp/oes-do-${key}`,
    ownerGitDirectory: `/private/tmp/oes-do-${key}/.git`,
    ownerRef: `refs/heads/codex/delivery/${key}`,
    artifactRoot: `/private/tmp/oes-do-${key}-artifacts`,
    taskTempRoot: `/private/tmp/oes-owner-${sha256(ownerTaskId)}`,
    deliveryRecord: `docs/plans/deliveries/${key}.md`,
    deliveryRecordCheckpointPath: `/private/tmp/oes-do-${key}-artifacts/delivery-record.md`,
    currentEvidenceManifestPath: `/private/tmp/oes-do-${key}-artifacts/current.json`,
    checkpointBundlePath: `/private/tmp/oes-do-${key}-artifacts/checkpoint.json`,
    gitBundlePath: `/private/tmp/oes-do-${key}-artifacts/owner.bundle`
  })
  const terminal = (key: string, suffix: string) => {
    const candidateSha = suffix.repeat(40)
    const ownerTaskId = `/root/co/do-${key}`
    const ownerResourceBinding = binding(key, ownerTaskId, candidateSha)
    return {
      deliveryKey: key,
      ownerTaskId,
      terminalState: 'MERGED' as const,
      candidateSha,
      mergeSha: String(Number(suffix) + 1).repeat(40),
      ownerResourceBinding,
      resources: [
        {
          kind: 'remote-branch' as const,
          path: `codex/delivery/${key}`,
          expectedSha: candidateSha
        },
        { kind: 'local-branch' as const, path: `codex/delivery/${key}`, expectedSha: candidateSha },
        {
          kind: 'worktree' as const,
          path: ownerResourceBinding.ownerClone,
          expectedSha: candidateSha
        },
        { kind: 'task-temp' as const, path: ownerResourceBinding.taskTempRoot, expectedSha: null }
      ]
    }
  }
  const value: CoordinationCleanupAuthorization = {
    schemaVersion: 2,
    kind: 'OES_COORDINATION_CLEANUP_AUTHORIZATION',
    authorizationFingerprint: '',
    status: 'ISSUED',
    expectedState: 'COORDINATION_CLEANUP_AUTHORIZED',
    stateVersion: 1,
    coordinationKey: 'release',
    coordinationOwnerTaskId: '/root/co',
    transitionId: 'coordination:cleanup:1',
    confirmationFingerprint: 'a'.repeat(64),
    terminalDeliveries: [terminal('alpha', '1'), terminal('beta', '3')]
  }
  value.authorizationFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  return value
}
