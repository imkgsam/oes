import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { canonicalJson, objectFingerprint, sha256 } from '../src/canonical.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'
import {
  planOwnerRecovery,
  loadOwnerDurabilityArtifacts,
  readInstalledProfileResourceTopology,
  recoverOwnerResources,
  resolveOwnerTransitionBinding,
  validateOwnerCheckpointBundle,
  validateOwnerResourceBinding,
  verifyStableOwnerResourceObservation
} from '../src/resource-topology.ts'
import type {
  OwnerCheckpointBundle,
  OwnerCurrentEvidenceManifest,
  OwnerRecoveryAdapter,
  OwnerResourceBinding,
  OwnerResourceObservation
} from '../src/resource-topology.types.ts'

const schema = (name: string) =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', name), 'utf8')) as Record<
    string,
    unknown
  >

/** Creates one structurally stable frozen owner binding for contract tests. */
function stableBinding(overrides: Partial<OwnerResourceBinding> = {}): OwnerResourceBinding {
  const binding: OwnerResourceBinding = {
    schemaVersion: 1,
    kind: 'OES_OWNER_RESOURCE_BINDING',
    bindingFingerprint: '',
    resourceTopologyVersion: 'stable-owner-exclusive-v1',
    ownerTaskId: '11111111-1111-4111-8111-111111111111',
    directParentTaskId: '22222222-2222-4222-8222-222222222222',
    transitionId: 'stage:start:stable:1',
    ownerClone: '/Users/fixture/.codex/oes/owners/11111111/oes',
    repositoryRoot: '/Users/fixture/.codex/oes/owners/11111111/oes',
    repositoryRemoteUrl: 'https://github.com/example/oes.git',
    ownerGitDirectory: '/Users/fixture/.codex/oes/owners/11111111/oes/.git',
    ownerRef: 'refs/heads/codex/feature/runtime',
    artifactRoot: '/Users/fixture/.codex/oes/artifacts/11111111/runtime',
    taskTempRoot: '/private/tmp/oes-runtime-11111111',
    featurePacket: 'docs/plans/features/runtime.md',
    featurePacketCheckpointPath:
      '/Users/fixture/.codex/oes/artifacts/11111111/runtime/feature-packet.md',
    currentEvidenceManifestPath:
      '/Users/fixture/.codex/oes/artifacts/11111111/runtime/current-evidence-manifest.json',
    checkpointBundlePath:
      '/Users/fixture/.codex/oes/artifacts/11111111/runtime/checkpoint-bundle.json',
    gitBundlePath: '/Users/fixture/.codex/oes/artifacts/11111111/runtime/owner.bundle',
    ...overrides
  }
  if (
    binding.resourceTopologyVersion === 'pre-cutover-v1' &&
    !Object.prototype.hasOwnProperty.call(overrides, 'repositoryRemoteUrl')
  )
    delete binding.repositoryRemoteUrl
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
    featurePacket: { path: binding.featurePacketCheckpointPath, sha256: 'a'.repeat(64) },
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
    featurePacket: current.featurePacket,
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
    liveFeaturePacketExists: true,
    featurePacketCheckpointExists: true,
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
  current.featurePacket.sha256 = sha256(packetBytes)
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
    [binding.featurePacketCheckpointPath, packetBytes],
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

test('stable topology rejects temporary and mixed pre-cutover roots', () => {
  assert.throws(
    () =>
      validateOwnerResourceBinding(
        stableBinding({
          repositoryRoot: '/private/tmp/oes-fl-runtime',
          ownerClone: '/private/tmp/oes-fl-runtime',
          ownerGitDirectory: '/private/tmp/oes-fl-runtime/.git'
        })
      ),
    /STABLE_OWNER_RESOURCE_USES_TEMPORARY_ROOT/
  )
  assert.throws(
    () =>
      validateOwnerResourceBinding(
        stableBinding({ repositoryRoot: '/Users/fixture/repositories/shared-oes' })
      ),
    /STABLE_OWNER_REPOSITORY_NOT_EXCLUSIVE_CLONE/
  )
  assert.throws(
    () => validateOwnerResourceBinding(stableBinding({ ownerRef: 'refs/heads/runtime..lock' })),
    /OWNER_RESOURCE_REF_INVALID/
  )
  const physicalTmp = realpathSync(tmpdir())
  const physicalOwner = join(physicalTmp, 'oes-fl-runtime-physical-alias')
  assert.throws(
    () =>
      validateOwnerResourceBinding(
        stableBinding({
          repositoryRoot: physicalOwner,
          ownerClone: physicalOwner,
          ownerGitDirectory: join(physicalOwner, '.git'),
          artifactRoot: join(physicalTmp, 'oes-fl-runtime-physical-artifacts')
        })
      ),
    /STABLE_OWNER_RESOURCE_USES_TEMPORARY_ROOT/
  )
  const legacy = stableBinding({
    resourceTopologyVersion: 'pre-cutover-v1',
    ownerClone: '/private/tmp/oes-fl-runtime',
    ownerGitDirectory: '/private/tmp/oes-fl-runtime/.git',
    artifactRoot: '/private/tmp/oes-fl-runtime-artifacts',
    taskTempRoot: '/private/tmp/oes-fl-runtime-artifacts',
    currentEvidenceManifestPath: '/private/tmp/oes-fl-runtime-artifacts/current.json',
    checkpointBundlePath: '/private/tmp/oes-fl-runtime-artifacts/checkpoint.json',
    gitBundlePath: null
  })
  assert.equal(validateOwnerResourceBinding(legacy).resourceTopologyVersion, 'pre-cutover-v1')
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
    liveFeaturePacketExists: false,
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
        liveFeaturePacketExists: true
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

test('pre-cutover loss preserves the exact original binding instead of creating replacement owner', () => {
  const binding = stableBinding({
    resourceTopologyVersion: 'pre-cutover-v1',
    ownerTaskId: '/root/sl/fl-runtime',
    directParentTaskId: '/root/sl',
    ownerClone: '/private/tmp/oes-fl-runtime',
    ownerGitDirectory: '/private/tmp/oes-fl-runtime/.git',
    artifactRoot: '/private/tmp/oes-fl-runtime-artifacts',
    taskTempRoot: '/private/tmp/oes-fl-runtime-artifacts',
    currentEvidenceManifestPath: '/private/tmp/oes-fl-runtime-artifacts/current.json',
    checkpointBundlePath: '/private/tmp/oes-fl-runtime-artifacts/checkpoint.json',
    gitBundlePath: null
  })
  const current = manifest(binding)
  const bundle = checkpoint(binding, current)
  const plan = planOwnerRecovery({
    ownerTaskId: binding.ownerTaskId,
    transitionId: binding.transitionId,
    ownerRef: binding.ownerRef,
    binding,
    manifest: current,
    checkpointBundle: bundle,
    observation: {
      ...observed(binding),
      ownerCloneExists: false,
      ownerGitDirectory: null,
      ownerGitCommonDirectory: null,
      ownerRef: null,
      ownerHeadSha: null,
      liveFeaturePacketExists: false
    }
  })
  assert.equal(plan.decision, 'RESOURCE_BINDING_MISMATCH')
  assert.equal(plan.preserveBinding, true)
})

test('pre-cutover temp loss rebuilds only scratch at the original frozen path', async () => {
  const binding = stableBinding({
    resourceTopologyVersion: 'pre-cutover-v1',
    ownerTaskId: '/root/sl/fl-runtime',
    directParentTaskId: '/root/sl',
    repositoryRoot: '/private/tmp/oes-fl-runtime',
    ownerClone: '/private/tmp/oes-fl-runtime',
    ownerGitDirectory: '/private/tmp/oes-fl-runtime/.git',
    artifactRoot: '/private/tmp/oes-fl-runtime-artifacts',
    taskTempRoot: '/private/tmp/oes-fl-runtime-artifacts',
    featurePacketCheckpointPath: '/private/tmp/oes-fl-runtime-artifacts/feature-packet.md',
    currentEvidenceManifestPath: '/private/tmp/oes-fl-runtime-artifacts/current.json',
    checkpointBundlePath: '/private/tmp/oes-fl-runtime-artifacts/checkpoint.json',
    gitBundlePath: null
  })
  const current = manifest(binding)
  const bundle = checkpoint(binding, current)
  let state = { ...observed(binding), taskTempRootExists: false }
  const calls: string[] = []
  const adapter: OwnerRecoveryAdapter = {
    restoreCloneFromBundle() {
      calls.push('unexpected-clone')
    },
    rebuildTaskTemp() {
      calls.push('scratch')
      state = { ...state, taskTempRootExists: true }
    },
    observe() {
      return state
    }
  }
  const plan = await recoverOwnerResources(
    {
      ownerTaskId: binding.ownerTaskId,
      transitionId: binding.transitionId,
      ownerRef: binding.ownerRef,
      binding,
      manifest: current,
      checkpointBundle: bundle,
      observation: state
    },
    adapter,
    () => ({ manifest: current, checkpointBundle: bundle }),
    () => {}
  )
  assert.equal(plan.decision, 'REBUILD_SCRATCH')
  assert.deepEqual(calls, ['scratch'])
})

test('installed profile defaults legacy and rejects an unverified stable reference', () => {
  const root = mkdtempSync(join(tmpdir(), 'oes-topology-profile-'))
  const legacy = join(root, 'legacy.toml')
  writeFileSync(
    legacy,
    '[collaboration_runtime]\nresource_topology_version="pre-cutover-v1"\nowner_resource_binding_path=""\nowner_resource_binding_sha256=""\nowner_resource_binding_fingerprint=""\n'
  )
  assert.deepEqual(readInstalledProfileResourceTopology(legacy), {
    resourceTopologyVersion: 'pre-cutover-v1',
    ownerResourceBinding: null
  })

  const mixed = join(root, 'mixed.toml')
  writeFileSync(
    mixed,
    '[collaboration_runtime]\nowner_resource_binding_path="/Users/fixture/binding.json"\nowner_resource_binding_sha256="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"\nowner_resource_binding_fingerprint="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"\n'
  )
  assert.throws(
    () => readInstalledProfileResourceTopology(mixed),
    /PROFILE_RESOURCE_REFERENCE_WITHOUT_TOPOLOGY_VERSION/
  )

  const binding = stableBinding()
  const bindingPath = join(root, 'binding.json')
  const bytes = `${canonicalJson(binding)}\n`
  writeFileSync(bindingPath, bytes)
  const stable = join(root, 'stable.toml')
  writeFileSync(
    stable,
    `[collaboration_runtime]\nresource_topology_version="stable-owner-exclusive-v1"\nowner_resource_binding_path=${JSON.stringify(bindingPath)}\nowner_resource_binding_sha256="${sha256(bytes)}"\nowner_resource_binding_fingerprint="${binding.bindingFingerprint}"\n`
  )
  assert.throws(
    () =>
      readInstalledProfileResourceTopology(
        stable,
        () => observed(binding),
        () => ({
          manifest: manifest(binding),
          checkpointBundle: checkpoint(binding, manifest(binding))
        })
      ),
    /ARTIFACT_PATH_OUTSIDE_BOUND_ROOT/
  )

  const acceptedReference = {
    path: join(binding.artifactRoot, 'owner-resource-binding.json'),
    sha256: 'd'.repeat(64),
    fingerprint: binding.bindingFingerprint
  }
  writeFileSync(
    stable,
    `[collaboration_runtime]\nresource_topology_version="stable-owner-exclusive-v1"\nowner_resource_binding_path=${JSON.stringify(acceptedReference.path)}\nowner_resource_binding_sha256="${acceptedReference.sha256}"\nowner_resource_binding_fingerprint="${acceptedReference.fingerprint}"\n`
  )
  const current = manifest(binding)
  const bundle = checkpoint(binding, current)
  assert.deepEqual(
    readInstalledProfileResourceTopology(
      stable,
      () => observed(binding),
      () => ({ manifest: current, checkpointBundle: bundle }),
      () => {},
      () => binding,
      (path) => path
    ),
    {
      resourceTopologyVersion: 'stable-owner-exclusive-v1',
      ownerResourceBinding: acceptedReference
    }
  )
  assert.throws(
    () =>
      readInstalledProfileResourceTopology(
        stable,
        () => ({ ...observed(binding), ownerGitCommonDirectory: '/Users/fixture/shared/.git' }),
        () => ({ manifest: current, checkpointBundle: bundle }),
        () => {},
        () => binding,
        (path) => path
      ),
    /STABLE_OWNER_GIT_IDENTITY_MISMATCH/
  )
})
