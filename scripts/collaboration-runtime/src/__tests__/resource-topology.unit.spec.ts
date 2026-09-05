import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { canonicalJson, objectFingerprint, sha256 } from '../canonical.ts'
import { GitHubRemoteAdapter, type CommandResult, type CommandRunner } from '../github-adapter.ts'
import { validateJsonSchema } from '../schema-validation.ts'
import {
  planOwnerRecovery,
  loadOwnerDurabilityArtifacts,
  readInstalledProfileResourceTopology,
  recoverOwnerResources,
  resolveOwnerTransitionBinding,
  stableOwnerTaskTempLeaf,
  SystemOwnerRecoveryAdapter,
  validateOwnerCheckpointBundle,
  validateOwnerResourceBinding,
  verifyStableOwnerResourceObservation
} from '../resource-topology.ts'
import type {
  OwnerCheckpointBundle,
  OwnerCurrentEvidenceManifest,
  OwnerRecoveryAdapter,
  OwnerResourceBinding,
  OwnerResourceObservation
} from '../resource-topology.types.ts'
import type { RemoteTruth } from '../types.ts'
import { remoteBinding } from './helpers.ts'

const schema = (name: string) =>
  JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', 'schemas', name), 'utf8')
  ) as Record<string, unknown>

/** Runs one local Git command and returns its literal stdout. */
function git(cwd: string, args: string[]): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  assert.equal(result.status, 0, `${args.join(' ')}: ${result.stderr}`)
  return result.stdout.trim()
}

/** Creates one structurally stable frozen owner binding for contract tests. */
function stableBinding(overrides: Partial<OwnerResourceBinding> = {}): OwnerResourceBinding {
  const ownerTaskId = overrides.ownerTaskId ?? '11111111-1111-4111-8111-111111111111'
  const binding: OwnerResourceBinding = {
    schemaVersion: 1,
    kind: 'OES_OWNER_RESOURCE_BINDING',
    bindingFingerprint: '',
    resourceTopologyVersion: 'owner-exclusive-v2',
    ownerTaskId,
    directParentTaskId: '22222222-2222-4222-8222-222222222222',
    transitionId: 'coordination:start:stable:1',
    ownerClone: '/Users/fixture/.codex/oes/owners/11111111/oes',
    repositoryRoot: '/Users/fixture/.codex/oes/owners/11111111/oes',
    repositoryRemoteUrl: 'https://github.com/example/oes.git',
    ownerGitDirectory: '/Users/fixture/.codex/oes/owners/11111111/oes/.git',
    ownerRef: 'refs/heads/codex/delivery/runtime',
    artifactRoot: '/Users/fixture/.codex/oes/artifacts/11111111/runtime',
    taskTempRoot: `/private/tmp/${stableOwnerTaskTempLeaf(ownerTaskId)}`,
    deliveryRecord: 'docs/plans/deliveries/runtime.md',
    deliveryRecordCheckpointPath:
      '/Users/fixture/.codex/oes/artifacts/11111111/runtime/delivery-record.md',
    currentEvidenceManifestPath:
      '/Users/fixture/.codex/oes/artifacts/11111111/runtime/current-evidence-manifest.json',
    checkpointBundlePath:
      '/Users/fixture/.codex/oes/artifacts/11111111/runtime/checkpoint-bundle.json',
    gitBundlePath: '/Users/fixture/.codex/oes/artifacts/11111111/runtime/owner.bundle',
    ...overrides
  }
  binding.bindingFingerprint = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  return binding
}

/** Creates the durable manifest selected by one binding. */
function manifest(binding: OwnerResourceBinding): OwnerCurrentEvidenceManifest {
  const value: OwnerCurrentEvidenceManifest = {
    schemaVersion: 1,
    kind: 'OES_OWNER_CURRENT_EVIDENCE_MANIFEST',
    manifestFingerprint: '',
    ownerTaskId: binding.ownerTaskId,
    transitionId: binding.transitionId,
    stateVersion: 4,
    resourceBindingFingerprint: binding.bindingFingerprint,
    deliveryRecord: { path: binding.deliveryRecordCheckpointPath, sha256: 'a'.repeat(64) },
    candidateSha: '1'.repeat(40),
    evidence: [],
    scratchPaths: [join(binding.taskTempRoot, 'tests')]
  }
  value.manifestFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'manifestFingerprint'
  )
  return value
}

/** Creates the durable checkpoint selected by one binding and manifest. */
function checkpoint(
  binding: OwnerResourceBinding,
  current: OwnerCurrentEvidenceManifest
): OwnerCheckpointBundle {
  const value: OwnerCheckpointBundle = {
    schemaVersion: 1,
    kind: 'OES_OWNER_CHECKPOINT_BUNDLE',
    bundleFingerprint: '',
    ownerTaskId: binding.ownerTaskId,
    transitionId: binding.transitionId,
    resourceBindingFingerprint: binding.bindingFingerprint,
    ownerRef: binding.ownerRef,
    headSha: '1'.repeat(40),
    deliveryRecord: current.deliveryRecord,
    currentEvidenceManifest: {
      path: binding.currentEvidenceManifestPath,
      sha256: 'b'.repeat(64),
      fingerprint: current.manifestFingerprint
    },
    gitBundle:
      binding.gitBundlePath === null
        ? null
        : { path: binding.gitBundlePath, sha256: 'c'.repeat(64) }
  }
  value.bundleFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'bundleFingerprint'
  )
  return value
}

/** Returns one fully matching stable observation. */
function observed(binding: OwnerResourceBinding): OwnerResourceObservation {
  return {
    ownerCloneExists: true,
    ownerGitDirectory: binding.ownerGitDirectory,
    ownerGitCommonDirectory: binding.ownerGitDirectory,
    ownerRepositoryRemoteUrl: binding.repositoryRemoteUrl ?? null,
    ownerRef: binding.ownerRef,
    ownerHeadSha: '1'.repeat(40),
    artifactRootExists: true,
    taskTempRootExists: true,
    liveDeliveryRecordExists: true,
    deliveryRecordCheckpointExists: true,
    currentEvidenceManifestExists: true,
    checkpointBundleExists: true,
    gitBundleExists: binding.gitBundlePath !== null
  }
}

test('stable topology accepts only one exact private Git and durable artifact identity', () => {
  const binding = stableBinding()
  assert.equal(validateOwnerResourceBinding(binding).bindingFingerprint, binding.bindingFingerprint)
  assert.equal(
    verifyStableOwnerResourceObservation(binding, observed(binding)).ownerTaskId,
    binding.ownerTaskId
  )
  assert.throws(
    () =>
      verifyStableOwnerResourceObservation(binding, {
        ...observed(binding),
        ownerGitCommonDirectory: '/Users/fixture/shared/.git'
      }),
    /STABLE_OWNER_GIT_IDENTITY_MISMATCH/
  )
  assert.throws(
    () =>
      verifyStableOwnerResourceObservation(
        binding,
        { ...observed(binding), ownerHeadSha: '9'.repeat(40) },
        '1'.repeat(40)
      ),
    /STABLE_OWNER_GIT_IDENTITY_MISMATCH/
  )
})

test('stable durability rehashes every binding-selected Packet, manifest, checkpoint, and bundle', () => {
  const binding = stableBinding()
  const packetBytes = '# Runtime\n'
  const gitBundleBytes = 'fixture git bundle bytes\n'
  const current = manifest(binding)
  current.deliveryRecord.sha256 = sha256(packetBytes)
  current.manifestFingerprint = objectFingerprint(
    current as unknown as Record<string, unknown>,
    'manifestFingerprint'
  )
  const manifestBytes = `${canonicalJson(current)}\n`
  const bundle = checkpoint(binding, current)
  bundle.currentEvidenceManifest.sha256 = sha256(manifestBytes)
  if (bundle.gitBundle) bundle.gitBundle.sha256 = sha256(gitBundleBytes)
  bundle.bundleFingerprint = objectFingerprint(
    bundle as unknown as Record<string, unknown>,
    'bundleFingerprint'
  )
  const checkpointBytes = `${canonicalJson(bundle)}\n`
  const artifacts = new Map<string, string>([
    [binding.currentEvidenceManifestPath, manifestBytes],
    [binding.checkpointBundlePath, checkpointBytes],
    [binding.deliveryRecordCheckpointPath, packetBytes],
    [binding.gitBundlePath as string, gitBundleBytes]
  ])
  const readArtifact = (path: string): Uint8Array => Buffer.from(artifacts.get(path) ?? '')
  assert.equal(
    loadOwnerDurabilityArtifacts(binding, readArtifact, (path) => path).checkpointBundle
      .bundleFingerprint,
    bundle.bundleFingerprint
  )
  artifacts.set(binding.gitBundlePath as string, 'tampered bundle\n')
  assert.throws(
    () => loadOwnerDurabilityArtifacts(binding, readArtifact, (path) => path),
    /OWNER_DURABILITY_ARTIFACT_HASH_MISMATCH/
  )
})

test('owner topology schemas accept the exact binding, manifest, and checkpoint wire contracts', () => {
  const binding = stableBinding()
  const current = manifest(binding)
  const bundle = checkpoint(binding, current)
  validateJsonSchema(schema('owner-resource-binding.schema.json'), binding)
  validateJsonSchema(schema('owner-resource-current-manifest.schema.json'), current)
  validateJsonSchema(schema('owner-resource-checkpoint-bundle.schema.json'), bundle)
  const headDrift = { ...bundle, headSha: '9'.repeat(40), bundleFingerprint: '' }
  headDrift.bundleFingerprint = objectFingerprint(
    headDrift as unknown as Record<string, unknown>,
    'bundleFingerprint'
  )
  assert.throws(
    () => validateOwnerCheckpointBundle(headDrift, binding, current),
    /OWNER_CHECKPOINT_BUNDLE_BINDING_MISMATCH/
  )
  assert.throws(
    () =>
      validateJsonSchema(schema('owner-resource-binding.schema.json'), {
        ...binding,
        ownerRef: 'refs/heads/runtime..lock'
      }),
    /pattern/
  )
})

test('stable scratch identity is deterministically bound to the exact owner task', () => {
  const ownerA = stableBinding()
  const ownerBTaskId = '33333333-3333-4333-8333-333333333333'
  const ownerBSharedPath = stableBinding({
    ownerTaskId: ownerBTaskId,
    ownerClone: '/Users/fixture/.codex/oes/owners/33333333/oes',
    repositoryRoot: '/Users/fixture/.codex/oes/owners/33333333/oes',
    ownerGitDirectory: '/Users/fixture/.codex/oes/owners/33333333/oes/.git',
    artifactRoot: '/Users/fixture/.codex/oes/artifacts/33333333/runtime',
    taskTempRoot: ownerA.taskTempRoot,
    deliveryRecordCheckpointPath:
      '/Users/fixture/.codex/oes/artifacts/33333333/runtime/delivery-record.md',
    currentEvidenceManifestPath:
      '/Users/fixture/.codex/oes/artifacts/33333333/runtime/current-evidence-manifest.json',
    checkpointBundlePath:
      '/Users/fixture/.codex/oes/artifacts/33333333/runtime/checkpoint-bundle.json',
    gitBundlePath: '/Users/fixture/.codex/oes/artifacts/33333333/runtime/owner.bundle'
  })
  assert.equal(ownerA.taskTempRoot, `/private/tmp/oes-owner-${sha256(ownerA.ownerTaskId)}`)
  assert.throws(
    () => validateOwnerResourceBinding(ownerBSharedPath),
    /STABLE_OWNER_TASK_TEMP_NOT_OWNER_EXCLUSIVE/
  )
  const ownerBExact = stableBinding({
    ...ownerBSharedPath,
    taskTempRoot: `/private/tmp/${stableOwnerTaskTempLeaf(ownerBTaskId)}`,
    bindingFingerprint: ''
  })
  assert.doesNotThrow(() => validateOwnerResourceBinding(ownerBExact))
  assert.notEqual(ownerA.taskTempRoot, ownerBExact.taskTempRoot)
})

test('duplicate owner transition reuses exact bytes and rejects a rebound path', () => {
  const binding = stableBinding()
  assert.equal(resolveOwnerTransitionBinding(binding, structuredClone(binding)), 'REUSE_EXISTING')
  const rebound = stableBinding({
    repositoryRoot: '/Users/fixture/.codex/oes/owners/other/oes',
    ownerClone: '/Users/fixture/.codex/oes/owners/other/oes'
  })
  rebound.ownerGitDirectory = `${rebound.ownerClone}/.git`
  rebound.bindingFingerprint = objectFingerprint(
    rebound as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  assert.throws(
    () => resolveOwnerTransitionBinding(binding, rebound),
    /OWNER_TRANSITION_BINDING_CONFLICT/
  )
})

test('stable reboot and temp loss restore only the exact owner and become idempotent', async () => {
  const binding = stableBinding()
  const current = manifest(binding)
  const bundle = checkpoint(binding, current)
  let state: OwnerResourceObservation = {
    ...observed(binding),
    ownerCloneExists: false,
    ownerGitDirectory: null,
    ownerGitCommonDirectory: null,
    ownerRepositoryRemoteUrl: null,
    ownerRef: null,
    ownerHeadSha: null,
    liveDeliveryRecordExists: false,
    taskTempRootExists: false
  }
  const calls: string[] = []
  const adapter: OwnerRecoveryAdapter = {
    restoreCloneFromBundle() {
      calls.push('clone')
      state = {
        ...state,
        ownerCloneExists: true,
        ownerGitDirectory: binding.ownerGitDirectory,
        ownerGitCommonDirectory: binding.ownerGitDirectory,
        ownerRepositoryRemoteUrl: binding.repositoryRemoteUrl ?? null,
        ownerRef: binding.ownerRef,
        ownerHeadSha: bundle.headSha,
        liveDeliveryRecordExists: true
      }
    },
    rebuildTaskTemp() {
      calls.push('scratch')
      state = { ...state, taskTempRootExists: true }
    },
    observe() {
      return state
    }
  }
  const request = {
    ownerTaskId: binding.ownerTaskId,
    transitionId: binding.transitionId,
    ownerRef: binding.ownerRef,
    binding,
    manifest: current,
    checkpointBundle: bundle,
    observation: state
  }
  const loadDurability = () => ({ manifest: current, checkpointBundle: bundle })
  const recovered = await recoverOwnerResources(request, adapter, loadDurability, () => {})
  assert.equal(recovered.decision, 'RESTORE_EXACT_OWNER_CLONE')
  assert.deepEqual(calls, ['clone', 'scratch'])
  const second = await recoverOwnerResources(
    { ...request, observation: state },
    adapter,
    loadDurability,
    () => {}
  )
  assert.equal(second.decision, 'REUSE_EXACT')
  assert.deepEqual(calls, ['clone', 'scratch'])
  await assert.rejects(
    () =>
      recoverOwnerResources(
        { ...request, observation: state },
        adapter,
        () => ({
          manifest: { ...current, stateVersion: 99 },
          checkpointBundle: bundle
        }),
        () => {}
      ),
    /OWNER_RECOVERY_DURABILITY_INPUT_MISMATCH/
  )
})

test('system recovery restores the canonical origin accepted by remote preflight', async (t) => {
  const root = mkdtempSync(join(process.cwd(), '.oes-stable-recovery-test-'))
  const scratch = join(
    realpathSync(tmpdir()),
    stableOwnerTaskTempLeaf('11111111-1111-4111-8111-111111111111')
  )
  mkdirSync(scratch)
  t.after(() => {
    rmSync(root, { recursive: true, force: true })
    rmSync(scratch, { recursive: true, force: true })
  })
  const source = join(root, 'source')
  const ownerClone = join(root, 'owner')
  const artifactRoot = join(root, 'artifacts')
  mkdirSync(join(source, 'docs', 'plans', 'deliveries'), { recursive: true })
  mkdirSync(artifactRoot, { recursive: true })
  git(source, ['init', '-b', 'codex/delivery/runtime'])
  git(source, ['config', 'user.email', 'runtime@example.test'])
  git(source, ['config', 'user.name', 'Runtime Test'])
  const packetBytes = '# Runtime\n'
  writeFileSync(join(source, 'docs', 'plans', 'deliveries', 'runtime.md'), packetBytes)
  git(source, ['add', 'docs/plans/deliveries/runtime.md'])
  git(source, ['commit', '-m', 'fixture'])
  const headSha = git(source, ['rev-parse', 'HEAD'])
  const gitBundlePath = join(artifactRoot, 'owner.bundle')
  git(source, ['bundle', 'create', gitBundlePath, 'codex/delivery/runtime'])

  const binding = stableBinding({
    repositoryRoot: ownerClone,
    ownerClone,
    ownerGitDirectory: join(ownerClone, '.git'),
    artifactRoot,
    taskTempRoot: scratch,
    deliveryRecordCheckpointPath: join(artifactRoot, 'delivery-record.md'),
    currentEvidenceManifestPath: join(artifactRoot, 'current-evidence-manifest.json'),
    checkpointBundlePath: join(artifactRoot, 'checkpoint-bundle.json'),
    gitBundlePath
  })
  writeFileSync(binding.deliveryRecordCheckpointPath, packetBytes)
  const current = manifest(binding)
  current.candidateSha = headSha
  current.deliveryRecord.sha256 = sha256(packetBytes)
  current.manifestFingerprint = objectFingerprint(
    current as unknown as Record<string, unknown>,
    'manifestFingerprint'
  )
  const manifestBytes = `${canonicalJson(current)}\n`
  writeFileSync(binding.currentEvidenceManifestPath, manifestBytes)
  const bundle = checkpoint(binding, current)
  bundle.headSha = headSha
  bundle.currentEvidenceManifest.sha256 = sha256(manifestBytes)
  if (bundle.gitBundle) bundle.gitBundle.sha256 = sha256(readFileSync(gitBundlePath))
  bundle.bundleFingerprint = objectFingerprint(
    bundle as unknown as Record<string, unknown>,
    'bundleFingerprint'
  )
  writeFileSync(binding.checkpointBundlePath, `${canonicalJson(bundle)}\n`)

  rmSync(scratch, { recursive: true, force: true })
  const adapter = new SystemOwnerRecoveryAdapter()
  const plan = await recoverOwnerResources(
    {
      ownerTaskId: binding.ownerTaskId,
      transitionId: binding.transitionId,
      ownerRef: binding.ownerRef,
      binding,
      manifest: current,
      checkpointBundle: bundle,
      observation: adapter.observe(binding)
    },
    adapter
  )
  assert.equal(plan.decision, 'RESTORE_EXACT_OWNER_CLONE')
  assert.equal(git(ownerClone, ['remote', 'get-url', 'origin']), binding.repositoryRemoteUrl)

  const ruleset = {
    bypass_actors: [],
    conditions: { ref_name: { include: ['~DEFAULT_BRANCH'], exclude: [] } },
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 0,
          required_review_thread_resolution: true,
          allowed_merge_methods: ['merge']
        }
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: [{ context: 'Baseline Checks' }]
        }
      }
    ]
  }
  const runner: CommandRunner = {
    run(command: string, args: string[], cwd: string): CommandResult {
      if (command === 'git') {
        const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
        return {
          stdout: result.stdout ?? '',
          stderr: result.stderr ?? '',
          exitCode: result.status ?? 1
        }
      }
      const endpoint = args[1] ?? ''
      const value =
        endpoint === 'repos/example/oes'
          ? {
              default_branch: 'main',
              delete_branch_on_merge: false,
              allow_merge_commit: true,
              allow_squash_merge: false,
              allow_rebase_merge: false,
              allow_auto_merge: false
            }
          : endpoint.includes('/rulesets?')
            ? [{ id: 7, name: 'protect-main', target: 'branch', enforcement: 'active' }]
            : endpoint.endsWith('/rulesets/7')
              ? ruleset
              : endpoint.endsWith('/actions/permissions/workflow')
                ? {
                    default_workflow_permissions: 'read',
                    can_approve_pull_request_reviews: false
                  }
                : null
      return value === null
        ? { stdout: '', stderr: `unexpected command: ${command} ${args.join(' ')}`, exitCode: 1 }
        : { stdout: JSON.stringify(value), stderr: '', exitCode: 0 }
    }
  }
  const remote = remoteBinding({
    action: 'preflight',
    repositoryRoot: ownerClone,
    repositorySlug: 'example/oes',
    integrationBase: headSha,
    candidateSha: headSha,
    headRef: 'codex/delivery/runtime'
  })
  const truth: RemoteTruth = {
    branchHead: headSha,
    mergeQueueEntry: null,
    mainHead: headSha,
    pullRequest: null,
    requiredChecks: [],
    mainParents: [],
    pullMergeParents: [],
    reviewGate: {
      annotations: 0,
      issueComments: 0,
      reviewComments: 0,
      blockingReviews: 0,
      unresolvedThreads: 0
    }
  }
  await new GitHubRemoteAdapter(runner).preflight(remote, truth)
})
