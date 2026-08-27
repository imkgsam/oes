import { existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { tmpdir } from 'node:os'
import { assertPathWithin, canonicalJson, objectFingerprint, sha256 } from './canonical.ts'
import { fail } from './errors.ts'
import {
  RESOURCE_TOPOLOGY_VERSIONS,
  type EffectiveOwnerResourceTopology,
  type OwnerCheckpointBundle,
  type OwnerCurrentEvidenceManifest,
  type OwnerDurabilityArtifacts,
  type OwnerRecoveryAdapter,
  type OwnerRecoveryPlan,
  type OwnerRecoveryRequest,
  type OwnerResourceBinding,
  type OwnerResourceObservation,
  type OwnerResourceReference,
  type ResourceTopologyVersion
} from './resource-topology.types.ts'

const SHA256 = /^[0-9a-f]{64}$/
const GIT_SHA = /^[0-9a-f]{40}$/
const OWNER_REF =
  /^refs\/heads\/(?!main$)(?!HEAD$)(?!-)(?!\/)(?!\.)(?!.*\/\.)(?!.*\/\/)(?!.*\.\.)(?!.*@\{)(?!.*(?:^|\/)[^/]*\.lock(?:\/|$))(?!.*[/.]$)(?!@$)[A-Za-z0-9._/@+-]+$/
const FEATURE_PACKET = /^docs\/plans\/features\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const CANONICAL_GITHUB_REMOTE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/
const PROFILE_TOPOLOGY_FIELDS = new Set([
  'resource_topology_version',
  'owner_resource_binding_path',
  'owner_resource_binding_sha256',
  'owner_resource_binding_fingerprint'
])
const OWNER_SCRATCH_LEAF = /^oes-[A-Za-z0-9][A-Za-z0-9._-]*$/

/** Requires an exact object shape for one durable owner artifact. */
function requireExactKeys(value: unknown, allowed: string[], field: string): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    fail('OWNER_RESOURCE_OBJECT_INVALID', field)
  const extras = Object.keys(value).filter((key) => !allowed.includes(key))
  if (extras.length) fail('OWNER_RESOURCE_FIELD_UNDECLARED', `${field}.${extras.sort().join(',')}`)
}

/** Requires one non-empty string. */
function requireString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) fail('OWNER_RESOURCE_FIELD_INVALID', field)
}

/** Requires a canonical absolute path. */
function requireAbsolutePath(value: unknown, field: string): asserts value is string {
  requireString(value, field)
  if (!isAbsolute(value) || resolve(value) !== value)
    fail('OWNER_RESOURCE_PATH_NOT_CANONICAL', field)
}

/** Returns whether one path is a child of an exact root. */
function isWithin(root: string, candidate: string): boolean {
  const child = relative(resolve(root), resolve(candidate))
  return child === '' || (!child.startsWith(`..${sep}`) && child !== '..' && !child.startsWith(sep))
}

/** Returns whether one path is a strict child of an exact root. */
function isStrictlyWithin(root: string, candidate: string): boolean {
  return resolve(root) !== resolve(candidate) && isWithin(root, candidate)
}

/** Resolves an absent target through its nearest existing parent to one physical identity. */
function physicalIdentityForPotentialPath(path: string): string {
  const target = resolve(path)
  let existing = target
  while (!existsSync(existing)) {
    const parent = dirname(existing)
    if (parent === existing) fail('OWNER_RESOURCE_PHYSICAL_PARENT_ABSENT', path)
    existing = parent
  }
  return resolve(realpathSync(existing), relative(existing, target))
}

/** Returns whether a physical path belongs to disposable process or system temporary storage. */
function isTemporaryPath(path: string): boolean {
  const physical = physicalIdentityForPotentialPath(path)
  return ['/tmp', '/private/tmp', resolve(tmpdir())]
    .map(physicalIdentityForPotentialPath)
    .some((root) => isWithin(root, physical))
}

/** Requires one physical, owner-namespaced scratch root directly below an approved temp parent. */
export function validateStableOwnerTaskTempRoot(path: string, field = 'taskTempRoot'): string {
  requireAbsolutePath(path, field)
  const physical = physicalIdentityForPotentialPath(path)
  if (physical !== path) fail('STABLE_OWNER_TASK_TEMP_PHYSICAL_ALIAS', field)
  const approvedParents = [resolve(tmpdir()), '/tmp', '/private/tmp']
    .map(physicalIdentityForPotentialPath)
    .filter((value, index, values) => values.indexOf(value) === index)
  const approvedParent = approvedParents.find(
    (root) => dirname(physical) === root && isStrictlyWithin(root, physical)
  )
  if (!approvedParent || !OWNER_SCRATCH_LEAF.test(basename(physical)))
    fail('STABLE_OWNER_TASK_TEMP_NOT_OWNER_EXCLUSIVE', path)
  return physical
}

/** Reopens one existing path and rejects aliases or missing resource identities. */
function requireExactPhysicalPath(
  path: string,
  field: string,
  physicalPath: (path: string) => string
): string {
  let reopened: string
  try {
    reopened = resolve(physicalPath(path))
  } catch {
    fail('OWNER_RESOURCE_PHYSICAL_PATH_ABSENT', field)
  }
  if (reopened !== path) fail('OWNER_RESOURCE_PHYSICAL_PATH_ALIAS', field)
  return reopened
}

/** Validates one complete read-only observation before it can select recovery behavior. */
function validateOwnerResourceObservation(
  observation: OwnerResourceObservation
): OwnerResourceObservation {
  requireExactKeys(
    observation,
    [
      'ownerCloneExists',
      'ownerGitDirectory',
      'ownerGitCommonDirectory',
      'ownerRepositoryRemoteUrl',
      'ownerRef',
      'ownerHeadSha',
      'artifactRootExists',
      'taskTempRootExists',
      'liveFeaturePacketExists',
      'featurePacketCheckpointExists',
      'currentEvidenceManifestExists',
      'checkpointBundleExists',
      'gitBundleExists'
    ],
    'ownerResourceObservation'
  )
  for (const field of [
    'ownerCloneExists',
    'artifactRootExists',
    'taskTempRootExists',
    'liveFeaturePacketExists',
    'featurePacketCheckpointExists',
    'currentEvidenceManifestExists',
    'checkpointBundleExists',
    'gitBundleExists'
  ] as const)
    if (typeof observation[field] !== 'boolean')
      fail('OWNER_RESOURCE_OBSERVATION_STATE_INVALID', field)
  for (const field of ['ownerGitDirectory', 'ownerGitCommonDirectory'] as const) {
    const value = observation[field]
    if (value !== null) requireAbsolutePath(value, `ownerResourceObservation.${field}`)
  }
  if (observation.ownerRepositoryRemoteUrl !== null)
    requireString(
      observation.ownerRepositoryRemoteUrl,
      'ownerResourceObservation.ownerRepositoryRemoteUrl'
    )
  if (observation.ownerRef !== null && !OWNER_REF.test(observation.ownerRef))
    fail('OWNER_RESOURCE_OBSERVED_REF_INVALID', observation.ownerRef)
  if (observation.ownerHeadSha !== null && !GIT_SHA.test(observation.ownerHeadSha))
    fail('OWNER_RESOURCE_OBSERVED_HEAD_INVALID', observation.ownerHeadSha)
  if (
    !observation.ownerCloneExists &&
    [
      observation.ownerGitDirectory,
      observation.ownerGitCommonDirectory,
      observation.ownerRepositoryRemoteUrl,
      observation.ownerRef,
      observation.ownerHeadSha
    ].some((value) => value !== null)
  )
    fail('ABSENT_OWNER_CLONE_HAS_GIT_IDENTITY', 'ownerResourceObservation')
  return observation
}

/** Validates one immutable owner-resource reference. */
export function validateOwnerResourceReference(
  value: OwnerResourceReference,
  field = 'ownerResourceReference'
): OwnerResourceReference {
  requireExactKeys(value, ['path', 'sha256', 'fingerprint'], field)
  requireAbsolutePath(value.path, `${field}.path`)
  if (!SHA256.test(value.sha256) || !SHA256.test(value.fingerprint))
    fail('OWNER_RESOURCE_REFERENCE_HASH_INVALID', field)
  return value
}

/** Validates one frozen owner resource identity without consulting mutable scratch state. */
export function validateOwnerResourceBinding(value: OwnerResourceBinding): OwnerResourceBinding {
  requireExactKeys(
    value,
    [
      'schemaVersion',
      'kind',
      'bindingFingerprint',
      'resourceTopologyVersion',
      'ownerTaskId',
      'directParentTaskId',
      'transitionId',
      'repositoryRoot',
      'repositoryRemoteUrl',
      'ownerClone',
      'ownerGitDirectory',
      'ownerRef',
      'artifactRoot',
      'taskTempRoot',
      'featurePacket',
      'featurePacketCheckpointPath',
      'currentEvidenceManifestPath',
      'checkpointBundlePath',
      'gitBundlePath'
    ],
    'ownerResourceBinding'
  )
  if (value.schemaVersion !== 1 || value.kind !== 'OES_OWNER_RESOURCE_BINDING')
    fail('OWNER_RESOURCE_BINDING_KIND_INVALID', String(value.kind))
  if (!RESOURCE_TOPOLOGY_VERSIONS.includes(value.resourceTopologyVersion))
    fail('OWNER_RESOURCE_TOPOLOGY_VERSION_INVALID', String(value.resourceTopologyVersion))
  if (!SHA256.test(value.bindingFingerprint))
    fail('OWNER_RESOURCE_BINDING_FINGERPRINT_INVALID', value.ownerTaskId)
  const actual = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  if (actual !== value.bindingFingerprint)
    fail('OWNER_RESOURCE_BINDING_FINGERPRINT_MISMATCH', actual)
  requireString(value.ownerTaskId, 'ownerTaskId')
  requireString(value.directParentTaskId, 'directParentTaskId')
  if (value.ownerTaskId === value.directParentTaskId)
    fail('OWNER_RESOURCE_PARENT_SELF_REFERENCE', value.ownerTaskId)
  requireString(value.transitionId, 'transitionId')
  for (const [field, path] of [
    ['repositoryRoot', value.repositoryRoot],
    ['ownerClone', value.ownerClone],
    ['ownerGitDirectory', value.ownerGitDirectory],
    ['artifactRoot', value.artifactRoot],
    ['taskTempRoot', value.taskTempRoot],
    ['featurePacketCheckpointPath', value.featurePacketCheckpointPath],
    ['currentEvidenceManifestPath', value.currentEvidenceManifestPath],
    ['checkpointBundlePath', value.checkpointBundlePath]
  ] as const)
    requireAbsolutePath(path, field)
  if (value.gitBundlePath !== null) requireAbsolutePath(value.gitBundlePath, 'gitBundlePath')
  if (!OWNER_REF.test(value.ownerRef)) fail('OWNER_RESOURCE_REF_INVALID', value.ownerRef)
  if (!FEATURE_PACKET.test(value.featurePacket))
    fail('OWNER_RESOURCE_FEATURE_PACKET_INVALID', value.featurePacket)
  if (value.ownerGitDirectory !== join(value.ownerClone, '.git'))
    fail('OWNER_GIT_DIRECTORY_NOT_PRIVATE_CLONE', value.ownerGitDirectory)
  const physicalOwnerClone = physicalIdentityForPotentialPath(value.ownerClone)
  const physicalArtifactRoot = physicalIdentityForPotentialPath(value.artifactRoot)
  if (
    isWithin(physicalOwnerClone, physicalArtifactRoot) ||
    isWithin(physicalArtifactRoot, physicalOwnerClone)
  )
    fail('OWNER_RESOURCE_ROOT_OVERLAP', value.ownerClone)
  if (value.resourceTopologyVersion === 'stable-owner-exclusive-v1') {
    requireString(value.repositoryRemoteUrl, 'repositoryRemoteUrl')
    if (!CANONICAL_GITHUB_REMOTE.test(value.repositoryRemoteUrl))
      fail('STABLE_OWNER_REPOSITORY_REMOTE_INVALID', value.repositoryRemoteUrl)
    if (value.repositoryRoot !== value.ownerClone)
      fail('STABLE_OWNER_REPOSITORY_NOT_EXCLUSIVE_CLONE', value.repositoryRoot)
    if (
      isTemporaryPath(value.ownerClone) ||
      isTemporaryPath(value.artifactRoot) ||
      value.artifactRoot === value.taskTempRoot
    )
      fail('STABLE_OWNER_RESOURCE_USES_TEMPORARY_ROOT', value.ownerClone)
    validateStableOwnerTaskTempRoot(value.taskTempRoot)
    for (const path of [
      value.featurePacketCheckpointPath,
      value.currentEvidenceManifestPath,
      value.checkpointBundlePath,
      value.gitBundlePath
    ]) {
      if (!path) fail('STABLE_OWNER_DURABILITY_PATH_REQUIRED', value.ownerTaskId)
      assertPathWithin(value.artifactRoot, path)
    }
    if (
      new Set([
        value.featurePacketCheckpointPath,
        value.currentEvidenceManifestPath,
        value.checkpointBundlePath,
        value.gitBundlePath
      ]).size !== 4
    )
      fail('STABLE_OWNER_DURABILITY_PATH_COLLISION', value.artifactRoot)
  } else if (
    !isTemporaryPath(value.ownerClone) ||
    !isTemporaryPath(value.taskTempRoot) ||
    value.gitBundlePath !== null ||
    value.repositoryRemoteUrl !== undefined
  )
    fail('PRE_CUTOVER_RESOURCE_IDENTITY_MIXED', value.ownerClone)
  return value
}

/** Rejects a second binding for the same owner transition while reusing exact duplicates. */
export function resolveOwnerTransitionBinding(
  existing: OwnerResourceBinding | null,
  next: OwnerResourceBinding
): 'ACCEPT_NEW' | 'REUSE_EXISTING' {
  const candidate = validateOwnerResourceBinding(next)
  if (!existing) return 'ACCEPT_NEW'
  const current = validateOwnerResourceBinding(existing)
  if (
    current.ownerTaskId !== candidate.ownerTaskId ||
    current.transitionId !== candidate.transitionId
  )
    return 'ACCEPT_NEW'
  if (current.bindingFingerprint !== candidate.bindingFingerprint)
    fail('OWNER_TRANSITION_BINDING_CONFLICT', `${candidate.ownerTaskId}:${candidate.transitionId}`)
  return 'REUSE_EXISTING'
}

/** Reads and verifies a frozen binding reference. */
export function loadOwnerResourceBindingReference(
  referenceInput: OwnerResourceReference
): OwnerResourceBinding {
  const reference = validateOwnerResourceReference(referenceInput)
  const bytes = readFileSync(reference.path)
  if (sha256(bytes) !== reference.sha256)
    fail('OWNER_RESOURCE_BINDING_SHA_MISMATCH', reference.path)
  const binding = validateOwnerResourceBinding(
    JSON.parse(bytes.toString('utf8')) as OwnerResourceBinding
  )
  if (binding.bindingFingerprint !== reference.fingerprint)
    fail('OWNER_RESOURCE_BINDING_REFERENCE_MISMATCH', reference.path)
  return binding
}

/** Validates one current evidence manifest for its exact owner binding. */
export function validateOwnerCurrentEvidenceManifest(
  value: OwnerCurrentEvidenceManifest,
  binding: OwnerResourceBinding
): OwnerCurrentEvidenceManifest {
  requireExactKeys(
    value,
    [
      'schemaVersion',
      'kind',
      'manifestFingerprint',
      'ownerTaskId',
      'transitionId',
      'stateVersion',
      'resourceBindingFingerprint',
      'featurePacket',
      'candidateSha',
      'evidence',
      'scratchPaths'
    ],
    'ownerCurrentEvidenceManifest'
  )
  if (value.schemaVersion !== 1 || value.kind !== 'OES_OWNER_CURRENT_EVIDENCE_MANIFEST')
    fail('OWNER_CURRENT_MANIFEST_KIND_INVALID', String(value.kind))
  if (
    value.manifestFingerprint !==
    objectFingerprint(value as unknown as Record<string, unknown>, 'manifestFingerprint')
  )
    fail('OWNER_CURRENT_MANIFEST_FINGERPRINT_MISMATCH', binding.ownerTaskId)
  if (
    value.ownerTaskId !== binding.ownerTaskId ||
    value.transitionId !== binding.transitionId ||
    value.resourceBindingFingerprint !== binding.bindingFingerprint
  )
    fail('OWNER_CURRENT_MANIFEST_BINDING_MISMATCH', binding.ownerTaskId)
  if (!Number.isSafeInteger(value.stateVersion) || value.stateVersion < 1)
    fail('OWNER_CURRENT_MANIFEST_STATE_VERSION_INVALID', String(value.stateVersion))
  requireExactKeys(value.featurePacket, ['path', 'sha256'], 'manifest.featurePacket')
  if (
    value.featurePacket.path !== binding.featurePacketCheckpointPath ||
    !SHA256.test(value.featurePacket.sha256)
  )
    fail('OWNER_CURRENT_MANIFEST_PACKET_MISMATCH', value.featurePacket.path)
  if (value.candidateSha !== null && !GIT_SHA.test(value.candidateSha))
    fail('OWNER_CURRENT_MANIFEST_CANDIDATE_INVALID', String(value.candidateSha))
  if (!Array.isArray(value.evidence) || !Array.isArray(value.scratchPaths))
    fail('OWNER_CURRENT_MANIFEST_COLLECTION_INVALID', binding.ownerTaskId)
  const evidencePaths = new Set<string>()
  for (const item of value.evidence) {
    requireExactKeys(item, ['path', 'sha256'], 'manifest.evidence')
    requireAbsolutePath(item.path, 'manifest.evidence.path')
    if (binding.resourceTopologyVersion === 'stable-owner-exclusive-v1')
      assertPathWithin(binding.artifactRoot, item.path)
    if (!SHA256.test(item.sha256) || evidencePaths.has(item.path))
      fail('OWNER_CURRENT_MANIFEST_EVIDENCE_INVALID', item.path)
    evidencePaths.add(item.path)
  }
  if (new Set(value.scratchPaths).size !== value.scratchPaths.length)
    fail('OWNER_CURRENT_MANIFEST_SCRATCH_DUPLICATE', binding.ownerTaskId)
  for (const path of value.scratchPaths) {
    requireAbsolutePath(path, 'manifest.scratchPath')
    assertPathWithin(binding.taskTempRoot, path)
  }
  return value
}

/** Validates one durable checkpoint bundle against the manifest and frozen binding. */
export function validateOwnerCheckpointBundle(
  value: OwnerCheckpointBundle,
  binding: OwnerResourceBinding,
  manifest: OwnerCurrentEvidenceManifest
): OwnerCheckpointBundle {
  requireExactKeys(
    value,
    [
      'schemaVersion',
      'kind',
      'bundleFingerprint',
      'ownerTaskId',
      'transitionId',
      'resourceBindingFingerprint',
      'ownerRef',
      'headSha',
      'featurePacket',
      'currentEvidenceManifest',
      'gitBundle'
    ],
    'ownerCheckpointBundle'
  )
  if (value.schemaVersion !== 1 || value.kind !== 'OES_OWNER_CHECKPOINT_BUNDLE')
    fail('OWNER_CHECKPOINT_BUNDLE_KIND_INVALID', String(value.kind))
  if (
    value.bundleFingerprint !==
    objectFingerprint(value as unknown as Record<string, unknown>, 'bundleFingerprint')
  )
    fail('OWNER_CHECKPOINT_BUNDLE_FINGERPRINT_MISMATCH', binding.ownerTaskId)
  if (
    value.ownerTaskId !== binding.ownerTaskId ||
    value.transitionId !== binding.transitionId ||
    value.resourceBindingFingerprint !== binding.bindingFingerprint ||
    value.ownerRef !== binding.ownerRef ||
    !GIT_SHA.test(value.headSha) ||
    (manifest.candidateSha !== null && value.headSha !== manifest.candidateSha)
  )
    fail('OWNER_CHECKPOINT_BUNDLE_BINDING_MISMATCH', binding.ownerTaskId)
  for (const [item, field] of [[value.featurePacket, 'checkpoint.featurePacket']] as const) {
    requireExactKeys(item, ['path', 'sha256'], field)
    if (!SHA256.test(item.sha256)) fail('OWNER_CHECKPOINT_REFERENCE_HASH_INVALID', field)
  }
  if (value.gitBundle !== null) {
    requireExactKeys(value.gitBundle, ['path', 'sha256'], 'checkpoint.gitBundle')
    if (!SHA256.test(value.gitBundle.sha256))
      fail('OWNER_CHECKPOINT_REFERENCE_HASH_INVALID', 'checkpoint.gitBundle')
  }
  validateOwnerResourceReference(value.currentEvidenceManifest, 'checkpoint.currentManifest')
  if (
    value.featurePacket.path !== binding.featurePacketCheckpointPath ||
    value.featurePacket.sha256 !== manifest.featurePacket.sha256 ||
    value.currentEvidenceManifest.path !== binding.currentEvidenceManifestPath ||
    value.currentEvidenceManifest.fingerprint !== manifest.manifestFingerprint ||
    value.gitBundle?.path !== (binding.gitBundlePath ?? undefined)
  )
    fail('OWNER_CHECKPOINT_REFERENCE_MISMATCH', binding.ownerTaskId)
  return value
}

/** Reopens and hashes all stable durability artifacts selected by one frozen binding. */
export function loadOwnerDurabilityArtifacts(
  bindingInput: OwnerResourceBinding,
  readArtifact: (path: string) => Uint8Array = readFileSync,
  physicalPath: (path: string) => string = realpathSync
): OwnerDurabilityArtifacts {
  const binding = validateOwnerResourceBinding(bindingInput)
  const manifestBytes = readArtifact(binding.currentEvidenceManifestPath)
  const manifest = validateOwnerCurrentEvidenceManifest(
    JSON.parse(Buffer.from(manifestBytes).toString('utf8')) as OwnerCurrentEvidenceManifest,
    binding
  )
  const checkpointBundle = validateOwnerCheckpointBundle(
    JSON.parse(
      Buffer.from(readArtifact(binding.checkpointBundlePath)).toString('utf8')
    ) as OwnerCheckpointBundle,
    binding,
    manifest
  )
  const physicalArtifactRoot = requireExactPhysicalPath(
    binding.artifactRoot,
    'artifactRoot',
    physicalPath
  )
  const durabilityPaths: Array<readonly [string, string]> = [
    [binding.featurePacketCheckpointPath, 'featurePacketCheckpointPath'],
    [binding.currentEvidenceManifestPath, 'currentEvidenceManifestPath'],
    [binding.checkpointBundlePath, 'checkpointBundlePath'],
    ...manifest.evidence.map((item) => [item.path, 'manifest.evidence'] as const)
  ]
  if (binding.gitBundlePath) durabilityPaths.push([binding.gitBundlePath, 'gitBundlePath'])
  for (const [path, field] of durabilityPaths) {
    const physical = requireExactPhysicalPath(path, field, physicalPath)
    if (binding.resourceTopologyVersion === 'stable-owner-exclusive-v1')
      assertPathWithin(physicalArtifactRoot, physical)
  }
  const gitBundleMismatch =
    binding.resourceTopologyVersion === 'stable-owner-exclusive-v1'
      ? !binding.gitBundlePath ||
        !checkpointBundle.gitBundle ||
        sha256(readArtifact(binding.gitBundlePath)) !== checkpointBundle.gitBundle.sha256
      : binding.gitBundlePath !== null || checkpointBundle.gitBundle !== null
  if (
    checkpointBundle.currentEvidenceManifest.sha256 !== sha256(manifestBytes) ||
    sha256(readArtifact(binding.featurePacketCheckpointPath)) !== manifest.featurePacket.sha256 ||
    manifest.evidence.some((evidence) => sha256(readArtifact(evidence.path)) !== evidence.sha256) ||
    gitBundleMismatch
  )
    fail('OWNER_DURABILITY_ARTIFACT_HASH_MISMATCH', binding.ownerTaskId)
  return { manifest, checkpointBundle }
}

/** Verifies the active repository Packet still matches its durable stable checkpoint copy. */
export function verifyLiveOwnerPacket(
  bindingInput: OwnerResourceBinding,
  manifest: OwnerCurrentEvidenceManifest,
  readArtifact: (path: string) => Uint8Array = readFileSync,
  physicalPath: (path: string) => string = realpathSync
): void {
  const binding = validateOwnerResourceBinding(bindingInput)
  validateOwnerCurrentEvidenceManifest(manifest, binding)
  const repositoryRoot = requireExactPhysicalPath(
    binding.repositoryRoot,
    'repositoryRoot',
    physicalPath
  )
  const packetPath = join(binding.repositoryRoot, binding.featurePacket)
  const physicalPacket = requireExactPhysicalPath(packetPath, 'featurePacket', physicalPath)
  assertPathWithin(repositoryRoot, physicalPacket)
  if (sha256(readArtifact(packetPath)) !== manifest.featurePacket.sha256)
    fail('OWNER_LIVE_PACKET_CHECKPOINT_MISMATCH', binding.featurePacket)
}

/** Observes exact filesystem and Git identities without mutating the owner. */
export function observeOwnerResources(
  bindingInput: OwnerResourceBinding
): OwnerResourceObservation {
  const binding = validateOwnerResourceBinding(bindingInput)
  const ownerCloneExists = existsSync(binding.ownerClone)
  let ownerGitDirectory: string | null = null
  let ownerGitCommonDirectory: string | null = null
  let ownerRepositoryRemoteUrl: string | null = null
  let ownerRef: string | null = null
  let ownerHeadSha: string | null = null
  if (ownerCloneExists) {
    const git = (args: string[]): string | null => {
      const result = spawnSync('git', args, { cwd: binding.ownerClone, encoding: 'utf8' })
      return result.status === 0 ? result.stdout.trim() : null
    }
    const directory = git(['rev-parse', '--absolute-git-dir'])
    const common = git(['rev-parse', '--git-common-dir'])
    ownerGitDirectory = directory ? resolve(binding.ownerClone, directory) : null
    ownerGitCommonDirectory = common ? resolve(binding.ownerClone, common) : null
    ownerRepositoryRemoteUrl = git(['remote', 'get-url', 'origin'])
    ownerRef = git(['symbolic-ref', 'HEAD'])
    ownerHeadSha = git(['rev-parse', 'HEAD'])
  }
  return {
    ownerCloneExists,
    ownerGitDirectory,
    ownerGitCommonDirectory,
    ownerRepositoryRemoteUrl,
    ownerRef,
    ownerHeadSha,
    artifactRootExists: existsSync(binding.artifactRoot),
    taskTempRootExists: existsSync(binding.taskTempRoot),
    liveFeaturePacketExists: existsSync(join(binding.repositoryRoot, binding.featurePacket)),
    featurePacketCheckpointExists: existsSync(binding.featurePacketCheckpointPath),
    currentEvidenceManifestExists: existsSync(binding.currentEvidenceManifestPath),
    checkpointBundleExists: existsSync(binding.checkpointBundlePath),
    gitBundleExists: binding.gitBundlePath !== null && existsSync(binding.gitBundlePath)
  }
}

/** Verifies that stable topology is backed by one private Git directory and complete durable state. */
export function verifyStableOwnerResourceObservation(
  bindingInput: OwnerResourceBinding,
  observationInput: OwnerResourceObservation,
  expectedHeadSha?: string
): OwnerResourceBinding {
  const binding = validateOwnerResourceBinding(bindingInput)
  if (binding.resourceTopologyVersion !== 'stable-owner-exclusive-v1')
    fail('STABLE_OWNER_TOPOLOGY_REQUIRED', binding.ownerTaskId)
  const observation = validateOwnerResourceObservation(observationInput)
  if (expectedHeadSha !== undefined && !GIT_SHA.test(expectedHeadSha))
    fail('OWNER_RESOURCE_EXPECTED_HEAD_INVALID', expectedHeadSha)
  if (
    !observation.ownerCloneExists ||
    observation.ownerGitDirectory !== binding.ownerGitDirectory ||
    observation.ownerGitCommonDirectory !== binding.ownerGitDirectory ||
    observation.ownerRepositoryRemoteUrl !== binding.repositoryRemoteUrl ||
    observation.ownerRef !== binding.ownerRef ||
    (expectedHeadSha !== undefined && observation.ownerHeadSha !== expectedHeadSha)
  )
    fail('STABLE_OWNER_GIT_IDENTITY_MISMATCH', binding.ownerClone)
  if (
    !observation.artifactRootExists ||
    !observation.taskTempRootExists ||
    !observation.liveFeaturePacketExists ||
    !observation.featurePacketCheckpointExists ||
    !observation.currentEvidenceManifestExists ||
    !observation.checkpointBundleExists ||
    !observation.gitBundleExists
  )
    fail('STABLE_OWNER_DURABILITY_INCOMPLETE', binding.ownerTaskId)
  return binding
}

/** Plans exact-owner reboot or temp-loss recovery without changing any frozen identity. */
export function planOwnerRecovery(request: OwnerRecoveryRequest): OwnerRecoveryPlan {
  const binding = validateOwnerResourceBinding(request.binding)
  validateOwnerCurrentEvidenceManifest(request.manifest, binding)
  validateOwnerCheckpointBundle(request.checkpointBundle, binding, request.manifest)
  const observation = validateOwnerResourceObservation(request.observation)
  const mismatch =
    request.ownerTaskId !== binding.ownerTaskId ||
    request.transitionId !== binding.transitionId ||
    request.ownerRef !== binding.ownerRef ||
    !observation.artifactRootExists ||
    !observation.featurePacketCheckpointExists ||
    !observation.currentEvidenceManifestExists ||
    !observation.checkpointBundleExists
  if (mismatch)
    return {
      decision: 'RESOURCE_BINDING_MISMATCH',
      preserveBinding: true,
      operations: [],
      reason: 'owner, transition, ref, or durable artifact identity changed'
    }
  if (binding.resourceTopologyVersion === 'pre-cutover-v1') {
    const cloneExact =
      observation.ownerCloneExists &&
      observation.ownerGitDirectory === binding.ownerGitDirectory &&
      observation.ownerGitCommonDirectory === binding.ownerGitDirectory &&
      observation.ownerRef === binding.ownerRef &&
      observation.ownerHeadSha === request.checkpointBundle.headSha &&
      observation.liveFeaturePacketExists
    if (!cloneExact)
      return {
        decision: 'RESOURCE_BINDING_MISMATCH',
        preserveBinding: true,
        operations: [],
        reason: 'pre-cutover owner clone may only recover at its original bound identity'
      }
    return observation.taskTempRootExists
      ? {
          decision: 'REUSE_EXACT',
          preserveBinding: true,
          operations: [],
          reason: 'pre-cutover owner and scratch remain at their exact frozen identities'
        }
      : {
          decision: 'REBUILD_SCRATCH',
          preserveBinding: true,
          operations: ['REBUILD_TASK_TEMP_FROM_MANIFEST'],
          reason: 'only pre-cutover scratch is reconstructed at its original bound path'
        }
  }
  if (!observation.gitBundleExists)
    return {
      decision: 'RESOURCE_BINDING_MISMATCH',
      preserveBinding: true,
      operations: [],
      reason: 'stable Git bundle is absent'
    }
  const cloneExact =
    observation.ownerCloneExists &&
    observation.ownerGitDirectory === binding.ownerGitDirectory &&
    observation.ownerGitCommonDirectory === binding.ownerGitDirectory &&
    observation.ownerRepositoryRemoteUrl === binding.repositoryRemoteUrl &&
    observation.ownerRef === binding.ownerRef &&
    observation.ownerHeadSha === request.checkpointBundle.headSha &&
    observation.liveFeaturePacketExists
  if (observation.ownerCloneExists && !cloneExact)
    return {
      decision: 'RESOURCE_BINDING_MISMATCH',
      preserveBinding: true,
      operations: [],
      reason: 'existing clone does not match the frozen private Git identity'
    }
  const operations: OwnerRecoveryPlan['operations'] = []
  if (!cloneExact) operations.push('RESTORE_CLONE_FROM_BUNDLE')
  if (!observation.taskTempRootExists) operations.push('REBUILD_TASK_TEMP_FROM_MANIFEST')
  return {
    decision: !cloneExact
      ? 'RESTORE_EXACT_OWNER_CLONE'
      : operations.length
        ? 'REBUILD_SCRATCH'
        : 'REUSE_EXACT',
    preserveBinding: true,
    operations,
    reason: operations.length
      ? 'only missing exact stable resources will be reconstructed'
      : 'all exact stable resources are present'
  }
}

/** Executes a bounded recovery plan and verifies the same frozen identities afterward. */
export async function recoverOwnerResources(
  request: OwnerRecoveryRequest,
  adapter: OwnerRecoveryAdapter,
  durabilityLoader: (
    binding: OwnerResourceBinding
  ) => OwnerDurabilityArtifacts = loadOwnerDurabilityArtifacts,
  livePacketVerifier: (
    binding: OwnerResourceBinding,
    manifest: OwnerCurrentEvidenceManifest
  ) => void = verifyLiveOwnerPacket
): Promise<OwnerRecoveryPlan> {
  const durable = durabilityLoader(request.binding)
  if (
    canonicalJson(durable.manifest) !== canonicalJson(request.manifest) ||
    canonicalJson(durable.checkpointBundle) !== canonicalJson(request.checkpointBundle)
  )
    fail('OWNER_RECOVERY_DURABILITY_INPUT_MISMATCH', request.binding.ownerTaskId)
  const plan = planOwnerRecovery(request)
  if (plan.decision === 'RESOURCE_BINDING_MISMATCH') return plan
  for (const operation of plan.operations) {
    if (operation === 'RESTORE_CLONE_FROM_BUNDLE')
      await adapter.restoreCloneFromBundle(request.binding, request.checkpointBundle)
    else await adapter.rebuildTaskTemp(request.binding, request.manifest)
  }
  const after = await adapter.observe(request.binding)
  if (request.binding.resourceTopologyVersion === 'stable-owner-exclusive-v1')
    verifyStableOwnerResourceObservation(request.binding, after, request.checkpointBundle.headSha)
  else if (planOwnerRecovery({ ...request, observation: after }).decision !== 'REUSE_EXACT')
    fail('PRE_CUTOVER_RECOVERY_READBACK_MISMATCH', request.binding.ownerTaskId)
  livePacketVerifier(request.binding, request.manifest)
  return plan
}

/** System adapter for exact-path stable recovery from an already verified Git bundle. */
export class SystemOwnerRecoveryAdapter implements OwnerRecoveryAdapter {
  restoreCloneFromBundle(binding: OwnerResourceBinding, checkpoint: OwnerCheckpointBundle): void {
    if (existsSync(binding.ownerClone))
      fail('OWNER_RECOVERY_CLONE_ALREADY_EXISTS', binding.ownerClone)
    mkdirSync(dirname(binding.ownerClone), { recursive: true })
    if (!checkpoint.gitBundle) fail('OWNER_RECOVERY_GIT_BUNDLE_ABSENT', binding.ownerTaskId)
    const advertised = spawnSync(
      'git',
      ['ls-remote', checkpoint.gitBundle.path, binding.ownerRef],
      { encoding: 'utf8' }
    )
    if (
      advertised.status !== 0 ||
      advertised.stdout.trim() !== `${checkpoint.headSha}\t${binding.ownerRef}`
    )
      fail('OWNER_RECOVERY_GIT_BUNDLE_REF_MISMATCH', binding.ownerRef)
    const ref = binding.ownerRef.replace(/^refs\/heads\//, '')
    const result = spawnSync(
      'git',
      ['clone', '--branch', ref, '--single-branch', checkpoint.gitBundle.path, binding.ownerClone],
      {
        encoding: 'utf8'
      }
    )
    if (result.status !== 0) fail('OWNER_RECOVERY_GIT_CLONE_FAILED', (result.stderr ?? '').trim())
    const remote = binding.repositoryRemoteUrl
    if (!remote) fail('STABLE_OWNER_REPOSITORY_REMOTE_REQUIRED', binding.ownerTaskId)
    const setRemote = spawnSync('git', ['remote', 'set-url', 'origin', remote], {
      cwd: binding.ownerClone,
      encoding: 'utf8'
    })
    if (setRemote.status !== 0)
      fail('OWNER_RECOVERY_REMOTE_SET_FAILED', (setRemote.stderr ?? '').trim())
    const readback = spawnSync('git', ['remote', 'get-url', 'origin'], {
      cwd: binding.ownerClone,
      encoding: 'utf8'
    })
    if (readback.status !== 0 || readback.stdout.trim() !== remote)
      fail('OWNER_RECOVERY_REMOTE_READBACK_MISMATCH', binding.ownerTaskId)
  }

  rebuildTaskTemp(binding: OwnerResourceBinding, manifest: OwnerCurrentEvidenceManifest): void {
    mkdirSync(binding.taskTempRoot, { recursive: true })
    for (const path of manifest.scratchPaths) mkdirSync(path, { recursive: true })
  }

  observe(binding: OwnerResourceBinding): OwnerResourceObservation {
    return observeOwnerResources(binding)
  }
}

/** Parses the resource topology reference sealed into one installed profile. */
export function readInstalledProfileResourceTopology(
  profilePath: string,
  observer: (binding: OwnerResourceBinding) => OwnerResourceObservation = observeOwnerResources,
  durabilityLoader: (
    binding: OwnerResourceBinding
  ) => OwnerDurabilityArtifacts = loadOwnerDurabilityArtifacts,
  livePacketVerifier: (
    binding: OwnerResourceBinding,
    manifest: OwnerCurrentEvidenceManifest
  ) => void = verifyLiveOwnerPacket,
  bindingLoader: (
    reference: OwnerResourceReference
  ) => OwnerResourceBinding = loadOwnerResourceBindingReference,
  physicalPath: (path: string) => string = realpathSync
): EffectiveOwnerResourceTopology {
  const profile = readFileSync(profilePath, 'utf8')
  let section = ''
  const values = new Map<string, string>()
  for (const raw of profile.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const header = /^\[([^\]]+)\]$/.exec(line)
    if (header) {
      section = header[1]
      continue
    }
    if (section !== 'collaboration_runtime') continue
    const assignment = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("(?:[^"\\]|\\.)*")$/.exec(line)
    if (assignment) {
      if (PROFILE_TOPOLOGY_FIELDS.has(assignment[1]) && values.has(assignment[1]))
        fail('PROFILE_RESOURCE_TOPOLOGY_FIELD_DUPLICATE', assignment[1])
      values.set(assignment[1], JSON.parse(assignment[2]) as string)
    }
  }
  const referenceFields = [
    'owner_resource_binding_path',
    'owner_resource_binding_sha256',
    'owner_resource_binding_fingerprint'
  ]
  const referenceDeclarations = referenceFields.filter((field) => values.has(field))
  if (!values.has('resource_topology_version')) {
    if (referenceDeclarations.length !== 0)
      fail('PROFILE_RESOURCE_REFERENCE_WITHOUT_TOPOLOGY_VERSION', profilePath)
    return { resourceTopologyVersion: 'pre-cutover-v1', ownerResourceBinding: null }
  }
  const rawVersion = values.get('resource_topology_version') as string
  if (!RESOURCE_TOPOLOGY_VERSIONS.includes(rawVersion as ResourceTopologyVersion))
    fail('PROFILE_RESOURCE_TOPOLOGY_VERSION_INVALID', rawVersion)
  if (referenceDeclarations.length !== 0 && referenceDeclarations.length !== referenceFields.length)
    fail('PROFILE_RESOURCE_REFERENCE_PARTIAL', profilePath)
  const version = rawVersion as ResourceTopologyVersion
  const path = values.get('owner_resource_binding_path') ?? ''
  const digest = values.get('owner_resource_binding_sha256') ?? ''
  const fingerprint = values.get('owner_resource_binding_fingerprint') ?? ''
  if (version === 'pre-cutover-v1') {
    if (path || digest || fingerprint)
      fail('PRE_CUTOVER_PROFILE_RESOURCE_REFERENCE_FORBIDDEN', profilePath)
    return { resourceTopologyVersion: version, ownerResourceBinding: null }
  }
  const reference = validateOwnerResourceReference({ path, sha256: digest, fingerprint })
  const binding = bindingLoader(reference)
  if (binding.resourceTopologyVersion !== version)
    fail('PROFILE_RESOURCE_TOPOLOGY_BINDING_MISMATCH', binding.ownerTaskId)
  assertPathWithin(binding.artifactRoot, reference.path)
  const physicalArtifactRoot = requireExactPhysicalPath(
    binding.artifactRoot,
    'artifactRoot',
    physicalPath
  )
  for (const [path, field] of [
    [reference.path, 'ownerResourceBindingReference'],
    [binding.ownerClone, 'ownerClone'],
    [binding.ownerGitDirectory, 'ownerGitDirectory'],
    [binding.taskTempRoot, 'taskTempRoot']
  ] as const) {
    const physical = requireExactPhysicalPath(path, field, physicalPath)
    if (field === 'ownerResourceBindingReference') assertPathWithin(physicalArtifactRoot, physical)
  }
  const durability = durabilityLoader(binding)
  verifyStableOwnerResourceObservation(
    binding,
    observer(binding),
    durability.checkpointBundle.headSha
  )
  livePacketVerifier(binding, durability.manifest)
  return { resourceTopologyVersion: version, ownerResourceBinding: reference }
}

/** Returns one safe action-specific artifact directory beneath the stable artifact root. */
export function stableRemoteActionRoot(
  binding: OwnerResourceBinding,
  action: string,
  singleUseNonce: string
): string {
  validateOwnerResourceBinding(binding)
  if (binding.resourceTopologyVersion !== 'stable-owner-exclusive-v1')
    fail('STABLE_REMOTE_ACTION_ROOT_REQUIRES_STABLE_TOPOLOGY', binding.ownerTaskId)
  if (!SAFE_SEGMENT.test(action) || !SAFE_SEGMENT.test(singleUseNonce))
    fail('STABLE_REMOTE_ACTION_SEGMENT_INVALID', `${action}:${singleUseNonce}`)
  return join(binding.artifactRoot, 'remote-actions', action, singleUseNonce)
}
