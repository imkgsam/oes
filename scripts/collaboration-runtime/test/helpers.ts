import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { objectFingerprint } from '../src/canonical.ts'
import type { RemoteDriverBinding, StageCleanupAuthorization } from '../src/types.ts'

/** Creates one valid remote binding rooted in a disposable artifact directory. */
export function remoteBinding(overrides: Partial<RemoteDriverBinding> = {}): RemoteDriverBinding {
  const root = mkdtempSync(join(tmpdir(), 'oes-remote-driver-test-'))
  const binding: RemoteDriverBinding = {
    schemaVersion: 1,
    kind: 'OES_REMOTE_DRIVER_BINDING',
    bindingFingerprint: '',
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
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  return binding
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
