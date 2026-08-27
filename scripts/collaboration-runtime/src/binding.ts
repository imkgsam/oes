import { readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import {
  CAPABILITY_NAMES,
  REMOTE_ACTIONS,
  type EffectiveProfileReport,
  type RemoteActionAuthorization,
  type RemoteAuthorizationRoot,
  type RemoteDriverBinding,
  type RemoteTrustRoots,
  type StageChildCleanupAuthorization,
  type StageCleanupAuthorization,
  type StageCleanupCurrentAuthorization,
  type StageCleanupResource,
  type TrustedAuthorizationReference
} from './types.ts'
import {
  assertPathWithin,
  canonicalJson,
  isInvalidated,
  objectFingerprint,
  readJson,
  sha256
} from './canonical.ts'
import { fail } from './errors.ts'
import {
  loadOwnerResourceBindingReference,
  stableRemoteActionRoot,
  validateOwnerResourceBinding,
  validateOwnerResourceReference
} from './resource-topology.ts'
import { RESOURCE_TOPOLOGY_VERSIONS } from './resource-topology.types.ts'

const SHA256 = /^[0-9a-f]{64}$/
const GIT_SHA = /^[0-9a-f]{40}$/
const SAFE_REF =
  /^(?!main$)(?!HEAD$)(?!refs\/)(?!-)(?!\/)(?!\.)(?!.*\/\.)(?!.*\/\/)(?!.*\.\.)(?!.*@\{)(?!.*(?:^|\/)[^/]*\.lock(?:\/|$))(?!.*[/.]$)(?!@$)[A-Za-z0-9._\/@+-]+$/
const FEATURE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TASK_PATH = /^\/[A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)+$/
const UUID_TASK = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const STAGE_BRANCH = /^codex\/feature\/[a-z0-9]+(?:-[a-z0-9]+)*$/
const STAGE_WORKTREE = /^\/private\/tmp\/oes-fl-[a-z0-9]+(?:-[a-z0-9]+)*$/
const STAGE_TASK_TEMP = /^\/private\/tmp\/oes-fl-[a-z0-9]+(?:-[a-z0-9]+)*-artifacts$/

/** Requires an exact non-empty string field. */
function requireString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) fail('INVALID_BINDING_FIELD', field)
}

/** Requires a lowercase hexadecimal fingerprint. */
function requireFingerprint(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !SHA256.test(value)) fail('INVALID_BINDING_FINGERPRINT', field)
}

/** Requires a full Git object id. */
function requireGitSha(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !GIT_SHA.test(value)) fail('INVALID_GIT_SHA', field)
}

/** Requires an object to contain no undeclared keys. */
function requireExactKeys(
  value: unknown,
  allowed: string[],
  field: string
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    fail('INVALID_CONTRACT_OBJECT', field)
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key))
  if (unexpected.length)
    fail('UNDECLARED_CONTRACT_FIELD', `${field}.${unexpected.sort().join(',')}`)
}

/** Validates a safe non-main owner branch name. */
function requireOwnerRef(value: unknown, field: string): asserts value is string {
  requireString(value, field)
  if (!SAFE_REF.test(value)) fail('INVALID_OWNER_REF', field)
}

/** Returns the topology version selected by the installed effective profile. */
function trustTopologyVersion(
  trust: RemoteTrustRoots
): 'pre-cutover-v1' | 'stable-owner-exclusive-v1' {
  return trust.resourceTopologyVersion ?? 'pre-cutover-v1'
}

/** Computes the action resource set while preserving pre-cutover fingerprints byte-for-byte. */
function remoteResourceSetFingerprint(binding: RemoteDriverBinding): string {
  const value: Record<string, unknown> = {
    checkpointPath: binding.checkpointPath,
    resultPath: binding.resultPath,
    invalidationPath: binding.invalidationPath,
    pullRequest: binding.pullRequest,
    admission: binding.admission ?? null,
    cleanupResources: binding.cleanupResources ?? [],
    expectedMergeSha: binding.expectedMergeSha ?? null
  }
  if (binding.resourceTopologyVersion !== undefined) {
    value.resourceTopologyVersion = binding.resourceTopologyVersion
    value.ownerResourceBinding = binding.ownerResourceBinding ?? null
  }
  return objectFingerprint(value, '__none__')
}

/** Binds stable remote artifacts to one profile-sealed owner topology and action directory. */
function validateRemoteResourceTopology(
  binding: RemoteDriverBinding,
  trust: RemoteTrustRoots
): void {
  const version = trustTopologyVersion(trust)
  if (version === 'pre-cutover-v1') {
    if (binding.resourceTopologyVersion !== undefined || binding.ownerResourceBinding !== undefined)
      fail('REMOTE_RESOURCE_TOPOLOGY_MIXED', binding.owner.taskId)
    return
  }
  if (
    binding.resourceTopologyVersion !== version ||
    !binding.ownerResourceBinding ||
    !trust.ownerResourceBinding ||
    canonicalJson(binding.ownerResourceBinding) !== canonicalJson(trust.ownerResourceBinding)
  )
    fail('REMOTE_STABLE_RESOURCE_BINDING_MISMATCH', binding.owner.taskId)
  const ownerResources = loadOwnerResourceBindingReference(binding.ownerResourceBinding)
  const headRef = ownerResources.ownerRef.replace(/^refs\/heads\//, '')
  if (
    ownerResources.resourceTopologyVersion !== version ||
    ownerResources.ownerTaskId !== binding.owner.taskId ||
    ownerResources.repositoryRoot !== binding.repositoryRoot ||
    ownerResources.repositoryRemoteUrl !== `https://github.com/${binding.repositorySlug}.git` ||
    ownerResources.artifactRoot !== binding.artifactRoot ||
    headRef !== binding.headRef
  )
    fail('REMOTE_STABLE_OWNER_IDENTITY_MISMATCH', binding.owner.taskId)
  const actionRoot = stableRemoteActionRoot(ownerResources, binding.action, binding.singleUseNonce)
  const expected = [
    join(actionRoot, 'checkpoint.json'),
    join(actionRoot, 'result.json'),
    join(actionRoot, 'invalidated.json')
  ]
  const actual = [binding.checkpointPath, binding.resultPath, binding.invalidationPath]
  if (expected.some((path, index) => path !== actual[index]))
    fail('REMOTE_STABLE_ACTION_PATH_MISMATCH', actionRoot)
}

/** Verifies one immutable artifact reference within the configured authorization root. */
function verifyTrustedReference(
  reference: TrustedAuthorizationReference,
  authorizationRoot: string,
  fingerprintField: string
): Record<string, unknown> {
  requireExactKeys(reference, ['path', 'sha256', 'fingerprint'], 'authorizationReference')
  if (!isAbsolute(reference.path)) fail('AUTHORIZATION_PATH_NOT_ABSOLUTE', reference.path)
  assertPathWithin(authorizationRoot, reference.path)
  assertPathWithin(realpathSync(authorizationRoot), realpathSync(reference.path))
  requireFingerprint(reference.sha256, 'authorization.sha256')
  requireFingerprint(reference.fingerprint, 'authorization.fingerprint')
  const bytes = readFileSync(reference.path)
  if (sha256(bytes) !== reference.sha256) fail('AUTHORIZATION_SHA_MISMATCH', reference.path)
  const record = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>
  if (record[fingerprintField] !== reference.fingerprint)
    fail('AUTHORIZATION_FINGERPRINT_MISMATCH', reference.path)
  if (objectFingerprint(record, fingerprintField) !== reference.fingerprint)
    fail('AUTHORIZATION_CANONICAL_FINGERPRINT_MISMATCH', reference.path)
  return record
}

/** Compares the binding to an independently stored, profile-read-only action authorization. */
function validateTrustedAuthorization(
  binding: RemoteDriverBinding,
  trust: RemoteTrustRoots
): RemoteActionAuthorization {
  const authorizationRoot = trust.authorizationRoot
  if (!authorizationRoot || !isAbsolute(authorizationRoot))
    fail('TRUSTED_AUTHORIZATION_ROOT_REQUIRED', 'runtime trust context')
  const raw = verifyTrustedReference(
    binding.authorization,
    authorizationRoot,
    'authorizationFingerprint'
  )
  const authority = raw as unknown as RemoteActionAuthorization
  requireExactKeys(
    authority,
    [
      'schemaVersion',
      'kind',
      'authorizationFingerprint',
      'status',
      'issuedBeforeRemoteMutation',
      'issuerTaskId',
      'rootAuthorization',
      'owner',
      'expectedState',
      'stateVersion',
      'transitionId',
      'rootConfirmationFingerprint',
      'scopeFingerprint',
      'truthBaseline',
      'integrationBase',
      'candidateSha',
      'allowedAction',
      'repositoryRoot',
      'repositorySlug',
      'artifactRoot',
      'headRef',
      'baseRef',
      'singleUseNonce',
      'resourceSetFingerprint',
      'postcondition',
      'mergeAuthorizationFingerprint',
      'cleanupAuthorizationFingerprint',
      'resourceTopologyVersion',
      'ownerResourceBinding'
    ],
    'remoteAuthorization'
  )
  if (
    authority.schemaVersion !== 1 ||
    authority.kind !== 'OES_REMOTE_ACTION_AUTHORIZATION' ||
    authority.status !== 'ISSUED' ||
    authority.issuedBeforeRemoteMutation !== true
  )
    fail('REMOTE_AUTHORIZATION_NOT_ISSUED', binding.authorization.path)
  const root = verifyTrustedReference(
    authority.rootAuthorization,
    authorizationRoot,
    'recordFingerprint'
  ) as unknown as RemoteAuthorizationRoot
  requireExactKeys(
    root,
    [
      'schemaVersion',
      'kind',
      'recordFingerprint',
      'status',
      'issuerTaskId',
      'owner',
      'expectedState',
      'stateVersion',
      'transitionId',
      'rootConfirmationFingerprint',
      'scopeFingerprint',
      'truthBaseline',
      'repositoryRoot',
      'repositorySlug',
      'artifactRoot',
      'allowedActions',
      'mergeAuthorizationFingerprint',
      'cleanupAuthorizationFingerprint',
      'resourceTopologyVersion',
      'ownerResourceBinding'
    ],
    'remoteAuthorizationRoot'
  )
  if (
    root.schemaVersion !== 1 ||
    root.kind !== 'OES_REMOTE_AUTHORIZATION_ROOT' ||
    root.status !== 'ACTIVE'
  )
    fail('REMOTE_AUTHORIZATION_ROOT_NOT_ACTIVE', authority.rootAuthorization.path)
  requireExactKeys(root.owner, ['role', 'taskId'], 'remoteAuthorizationRoot.owner')
  requireExactKeys(authority.owner, ['role', 'taskId'], 'remoteAuthorization.owner')
  requireString(root.issuerTaskId, 'root.issuerTaskId')
  requireString(authority.issuerTaskId, 'issuerTaskId')
  requireString(root.owner.taskId, 'root.owner.taskId')
  requireString(root.expectedState, 'root.expectedState')
  requireString(root.transitionId, 'root.transitionId')
  requireString(root.repositoryRoot, 'root.repositoryRoot')
  requireString(root.repositorySlug, 'root.repositorySlug')
  requireString(root.artifactRoot, 'root.artifactRoot')
  if (!Array.isArray(root.allowedActions)) fail('REMOTE_AUTHORIZATION_ROOT_ACTIONS_INVALID', '')
  requireFingerprint(root.rootConfirmationFingerprint, 'root.rootConfirmationFingerprint')
  requireFingerprint(root.scopeFingerprint, 'root.scopeFingerprint')
  requireGitSha(root.truthBaseline, 'root.truthBaseline')
  requireFingerprint(authority.rootConfirmationFingerprint, 'rootConfirmationFingerprint')
  const exactPairs: Array<[unknown, unknown, string]> = [
    [root.issuerTaskId, authority.issuerTaskId, 'issuerTaskId'],
    [root.owner.role, authority.owner.role, 'root.owner.role'],
    [root.owner.taskId, authority.owner.taskId, 'root.owner.taskId'],
    [root.expectedState, authority.expectedState, 'root.expectedState'],
    [root.stateVersion, authority.stateVersion, 'root.stateVersion'],
    [root.transitionId, authority.transitionId, 'root.transitionId'],
    [
      root.rootConfirmationFingerprint,
      authority.rootConfirmationFingerprint,
      'rootConfirmationFingerprint'
    ],
    [root.scopeFingerprint, authority.scopeFingerprint, 'root.scopeFingerprint'],
    [root.truthBaseline, authority.truthBaseline, 'root.truthBaseline'],
    [root.repositoryRoot, authority.repositoryRoot, 'root.repositoryRoot'],
    [root.repositorySlug, authority.repositorySlug, 'root.repositorySlug'],
    [root.artifactRoot, authority.artifactRoot, 'root.artifactRoot'],
    [authority.owner.role, binding.owner.role, 'owner.role'],
    [authority.owner.taskId, binding.owner.taskId, 'owner.taskId'],
    [authority.expectedState, binding.expectedState, 'expectedState'],
    [authority.stateVersion, binding.stateVersion, 'stateVersion'],
    [authority.transitionId, binding.transitionId, 'transitionId'],
    [authority.scopeFingerprint, binding.scopeFingerprint, 'scopeFingerprint'],
    [authority.truthBaseline, binding.truthBaseline, 'truthBaseline'],
    [authority.integrationBase, binding.integrationBase, 'integrationBase'],
    [authority.candidateSha, binding.candidateSha, 'candidateSha'],
    [authority.allowedAction, binding.action, 'action'],
    [authority.repositoryRoot, binding.repositoryRoot, 'repositoryRoot'],
    [authority.repositorySlug, binding.repositorySlug, 'repositorySlug'],
    [authority.artifactRoot, binding.artifactRoot, 'artifactRoot'],
    [authority.headRef, binding.headRef, 'headRef'],
    [authority.baseRef, binding.baseRef, 'baseRef'],
    [authority.singleUseNonce, binding.singleUseNonce, 'singleUseNonce'],
    [authority.resourceTopologyVersion, binding.resourceTopologyVersion, 'resourceTopologyVersion'],
    [
      authority.mergeAuthorizationFingerprint,
      binding.mergeAuthorizationFingerprint,
      'mergeAuthorizationFingerprint'
    ],
    [
      authority.cleanupAuthorizationFingerprint,
      binding.cleanupAuthorizationFingerprint,
      'cleanupAuthorizationFingerprint'
    ]
  ]
  for (const [actual, expected, field] of exactPairs)
    if (actual !== expected) fail('REMOTE_AUTHORIZATION_CAS_MISMATCH', field)
  if (
    !root.allowedActions.includes(authority.allowedAction) ||
    new Set(root.allowedActions).size !== root.allowedActions.length ||
    root.allowedActions.some((action) => !REMOTE_ACTIONS.includes(action))
  )
    fail('REMOTE_AUTHORIZATION_ACTION_NOT_ROOT_AUTHORIZED', authority.allowedAction)
  if (
    root.mergeAuthorizationFingerprint !== authority.mergeAuthorizationFingerprint ||
    root.cleanupAuthorizationFingerprint !== authority.cleanupAuthorizationFingerprint
  )
    fail('REMOTE_AUTHORIZATION_HUMAN_GATE_MISMATCH', authority.allowedAction)
  const version = trustTopologyVersion(trust)
  if (version === 'stable-owner-exclusive-v1') {
    if (
      root.resourceTopologyVersion !== version ||
      authority.resourceTopologyVersion !== version ||
      !root.ownerResourceBinding ||
      !authority.ownerResourceBinding ||
      canonicalJson(root.ownerResourceBinding) !== canonicalJson(binding.ownerResourceBinding) ||
      canonicalJson(authority.ownerResourceBinding) !== canonicalJson(binding.ownerResourceBinding)
    )
      fail('REMOTE_AUTHORIZATION_RESOURCE_TOPOLOGY_MISMATCH', binding.owner.taskId)
  } else if (
    root.resourceTopologyVersion !== undefined ||
    authority.resourceTopologyVersion !== undefined ||
    root.ownerResourceBinding !== undefined ||
    authority.ownerResourceBinding !== undefined
  )
    fail('REMOTE_AUTHORIZATION_LEGACY_TOPOLOGY_MIXED', binding.owner.taskId)
  const resourceSetFingerprint = remoteResourceSetFingerprint(binding)
  if (authority.resourceSetFingerprint !== resourceSetFingerprint)
    fail('REMOTE_AUTHORIZATION_RESOURCE_SET_MISMATCH', resourceSetFingerprint)
  return authority
}

/** Validates and fingerprints one exact remote-driver binding. */
export function validateRemoteBinding(
  binding: RemoteDriverBinding,
  trust: RemoteTrustRoots
): RemoteDriverBinding {
  if (!trust) fail('TRUSTED_RUNTIME_CONTEXT_REQUIRED', 'installed effective profile')
  requireExactKeys(
    binding,
    [
      'schemaVersion',
      'kind',
      'bindingFingerprint',
      'authorization',
      'action',
      'owner',
      'expectedState',
      'stateVersion',
      'transitionId',
      'scopeFingerprint',
      'truthBaseline',
      'integrationBase',
      'candidateSha',
      'repositoryRoot',
      'repositorySlug',
      'artifactRoot',
      'checkpointPath',
      'resultPath',
      'invalidationPath',
      'singleUseNonce',
      'headRef',
      'baseRef',
      'pullRequest',
      'mergeMethod',
      'expectedMergeSha',
      'admission',
      'mergeAuthorizationFingerprint',
      'cleanupAuthorizationFingerprint',
      'cleanupResources',
      'resourceTopologyVersion',
      'ownerResourceBinding'
    ],
    'remoteBinding'
  )
  if (binding.schemaVersion !== 1 || binding.kind !== 'OES_REMOTE_DRIVER_BINDING')
    fail('INVALID_BINDING_KIND', binding.kind)
  if (
    trust.ownerTaskId !== binding.owner.taskId ||
    trust.profileExpectedState !== 'DELIVERY_ACTIVE'
  )
    fail('RUNTIME_TRUST_OWNER_STATE_MISMATCH', binding.owner.taskId)
  requireFingerprint(trust.profileSha256, 'runtimeTrust.profileSha256')
  if (!isAbsolute(trust.profilePath)) fail('RUNTIME_TRUST_PROFILE_PATH_INVALID', trust.profilePath)
  if (!REMOTE_ACTIONS.includes(binding.action))
    fail('INVALID_REMOTE_ACTION', String(binding.action))
  const computed = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  requireFingerprint(binding.bindingFingerprint, 'bindingFingerprint')
  if (computed !== binding.bindingFingerprint) fail('BINDING_FINGERPRINT_MISMATCH', computed)
  requireExactKeys(binding.owner, ['role', 'taskId'], 'owner')
  requireString(binding.owner?.taskId, 'owner.taskId')
  if (
    !['Direct owner', 'Global Unified Design', 'Feature Lead', 'Stage Lead'].includes(
      binding.owner.role
    )
  )
    fail('INVALID_OWNER_ROLE', binding.owner.role)
  requireString(binding.expectedState, 'expectedState')
  if (!Number.isInteger(binding.stateVersion) || binding.stateVersion < 1)
    fail('INVALID_STATE_VERSION', String(binding.stateVersion))
  requireString(binding.transitionId, 'transitionId')
  requireFingerprint(binding.scopeFingerprint, 'scopeFingerprint')
  requireGitSha(binding.truthBaseline, 'truthBaseline')
  requireGitSha(binding.integrationBase, 'integrationBase')
  requireGitSha(binding.candidateSha, 'candidateSha')
  requireString(binding.repositorySlug, 'repositorySlug')
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(binding.repositorySlug))
    fail('INVALID_REPOSITORY_SLUG', binding.repositorySlug)
  if (!isAbsolute(binding.repositoryRoot) || !isAbsolute(binding.artifactRoot))
    fail('BOUND_PATH_NOT_ABSOLUTE', binding.repositoryRoot)
  validateRemoteResourceTopology(binding, trust)
  const artifactPaths = [binding.checkpointPath, binding.resultPath, binding.invalidationPath]
  for (const path of artifactPaths) assertPathWithin(binding.artifactRoot, path)
  if (new Set(artifactPaths).size !== artifactPaths.length)
    fail('REMOTE_ARTIFACT_PATH_COLLISION', binding.artifactRoot)
  if (isInvalidated(binding.invalidationPath))
    fail('REMOTE_BINDING_INVALIDATED', binding.invalidationPath)
  requireString(binding.singleUseNonce, 'singleUseNonce')
  requireOwnerRef(binding.headRef, 'headRef')
  requireExactKeys(
    binding.pullRequest,
    ['baseRef', 'draft', 'number', 'requiredChecks', 'title', 'body'],
    'pullRequest'
  )
  if (binding.baseRef !== 'main' || binding.pullRequest.baseRef !== 'main')
    fail('BASE_REF_NOT_MAIN', binding.baseRef)
  if (!binding.pullRequest.requiredChecks.includes('Baseline Checks'))
    fail('REQUIRED_CHECK_MISSING', 'Baseline Checks')
  if (
    new Set(binding.pullRequest.requiredChecks).size !== binding.pullRequest.requiredChecks.length
  )
    fail('DUPLICATE_REQUIRED_CHECK', binding.headRef)
  if (
    binding.pullRequest.number !== null &&
    (!Number.isInteger(binding.pullRequest.number) || binding.pullRequest.number < 1)
  )
    fail('INVALID_PULL_REQUEST_NUMBER', String(binding.pullRequest.number))
  requireString(binding.pullRequest.title, 'pullRequest.title')
  if (typeof binding.pullRequest.body !== 'string')
    fail('INVALID_BINDING_FIELD', 'pullRequest.body')
  if (binding.mergeMethod !== 'merge') fail('MERGE_METHOD_NOT_ALLOWED', binding.mergeMethod)
  if (binding.action === 'publish-pr' && binding.pullRequest.draft !== true)
    fail('PUBLISH_MUST_CREATE_DRAFT', binding.headRef)
  if (binding.action === 'merge-pr') {
    requireFingerprint(binding.mergeAuthorizationFingerprint, 'mergeAuthorizationFingerprint')
    if (binding.pullRequest.number === null) fail('MERGE_PR_NUMBER_REQUIRED', binding.headRef)
    if (binding.pullRequest.draft) fail('MERGE_PR_MUST_BE_READY', binding.headRef)
    if (!binding.admission) fail('MERGE_ADMISSION_REQUIRED', binding.headRef)
    requireExactKeys(
      binding.admission,
      ['mode', 'lockPath', 'mergeGroupSha', 'mergeGroupBaseSha'],
      'admission'
    )
    if (binding.admission.mode === 'serial-latest-main') {
      if (!binding.admission.lockPath) fail('SERIAL_ADMISSION_LOCK_REQUIRED', binding.headRef)
      const admissionRoot = trust.admissionRoot
      if (!admissionRoot || !isAbsolute(admissionRoot))
        fail('SERIAL_ADMISSION_ROOT_REQUIRED', 'runtime trust context')
      assertPathWithin(admissionRoot, binding.admission.lockPath)
      if (binding.admission.lockPath !== join(admissionRoot, 'latest-main.lock'))
        fail('SERIAL_ADMISSION_LOCK_IDENTITY_MISMATCH', binding.admission.lockPath)
      if (binding.admission.mergeGroupSha !== null || binding.admission.mergeGroupBaseSha !== null)
        fail('SERIAL_ADMISSION_MERGE_GROUP_FORBIDDEN', binding.headRef)
    } else if (binding.admission.mode === 'merge-queue') {
      if (binding.admission.lockPath !== null)
        fail('MERGE_QUEUE_MUST_NOT_USE_LOCAL_LOCK', binding.headRef)
      if (
        (binding.admission.mergeGroupSha === null) !==
        (binding.admission.mergeGroupBaseSha === null)
      )
        fail('MERGE_GROUP_INPUT_PAIR_REQUIRED', binding.headRef)
      if (binding.admission.mergeGroupSha !== null) {
        requireGitSha(binding.admission.mergeGroupSha, 'admission.mergeGroupSha')
        requireGitSha(binding.admission.mergeGroupBaseSha, 'admission.mergeGroupBaseSha')
      }
    } else fail('INVALID_ADMISSION_MODE', String(binding.admission.mode))
  }
  if (binding.action === 'verify-main') {
    requireGitSha(binding.expectedMergeSha, 'expectedMergeSha')
    if (binding.pullRequest.number === null) fail('VERIFY_MAIN_PR_NUMBER_REQUIRED', binding.headRef)
  }
  if (binding.action === 'cleanup') {
    requireFingerprint(binding.cleanupAuthorizationFingerprint, 'cleanupAuthorizationFingerprint')
    if (binding.cleanupResources?.length !== 1)
      fail('CLEANUP_EXACT_REMOTE_RESOURCE_REQUIRED', binding.headRef)
    const [resource] = binding.cleanupResources
    if (
      resource.kind !== 'remote-branch' ||
      resource.path !== binding.headRef ||
      resource.expectedSha !== binding.candidateSha
    )
      fail('CLEANUP_REMOTE_RESOURCE_MISMATCH', resource.path)
  }
  if (binding.owner.role === 'Stage Lead') {
    requireFingerprint(binding.cleanupAuthorizationFingerprint, 'cleanupAuthorizationFingerprint')
    if (!binding.headRef.startsWith('codex/cleanup/'))
      fail('STAGE_REMOTE_NOT_CLEANUP_ONLY', binding.headRef)
  }
  validateTrustedAuthorization(binding, trust)
  return binding
}

/** Loads and validates one remote binding from disk. */
export function loadRemoteBinding(path: string, trust: RemoteTrustRoots): RemoteDriverBinding {
  return validateRemoteBinding(readJson<RemoteDriverBinding>(path), trust)
}

/** Validates the structural envelope of an effective-profile report. */
export function validateProfileReportEnvelope(
  report: EffectiveProfileReport
): EffectiveProfileReport {
  requireExactKeys(
    report,
    [
      'schemaVersion',
      'kind',
      'ownerTaskId',
      'transitionId',
      'expectedState',
      'declaredCapabilities',
      'profile',
      'observations',
      'credentialReference',
      'telemetry',
      'resourceTopology'
    ],
    'profileReport'
  )
  if (report.schemaVersion !== 1 || report.kind !== 'OES_EFFECTIVE_PROFILE_REPORT')
    fail('INVALID_PROFILE_REPORT_KIND', report.kind)
  requireString(report.ownerTaskId, 'ownerTaskId')
  requireString(report.transitionId, 'transitionId')
  if (!['HANDOFF_PENDING', 'DELIVERY_ACTIVE'].includes(report.expectedState))
    fail('INVALID_PROFILE_EXPECTED_STATE', report.expectedState)
  requireExactKeys(report.profile, ['name', 'permission', 'path', 'sha256'], 'profile')
  requireString(report.profile.path, 'profile.path')
  requireFingerprint(report.profile.sha256, 'profile.sha256')
  if (new Set(report.declaredCapabilities).size !== report.declaredCapabilities.length)
    fail('DUPLICATE_DECLARED_CAPABILITY', report.ownerTaskId)
  for (const capability of report.declaredCapabilities)
    if (!CAPABILITY_NAMES.includes(capability)) fail('UNKNOWN_CAPABILITY', capability)
  if (report.resourceTopology !== undefined) {
    requireExactKeys(
      report.resourceTopology,
      ['resourceTopologyVersion', 'ownerResourceBinding'],
      'profileReport.resourceTopology'
    )
    if (!RESOURCE_TOPOLOGY_VERSIONS.includes(report.resourceTopology.resourceTopologyVersion))
      fail(
        'INVALID_PROFILE_RESOURCE_TOPOLOGY_VERSION',
        String(report.resourceTopology.resourceTopologyVersion)
      )
    if (report.resourceTopology.resourceTopologyVersion === 'stable-owner-exclusive-v1') {
      if (!report.resourceTopology.ownerResourceBinding)
        fail('STABLE_PROFILE_RESOURCE_BINDING_REQUIRED', report.ownerTaskId)
      validateOwnerResourceReference(report.resourceTopology.ownerResourceBinding)
    } else if (report.resourceTopology.ownerResourceBinding !== null)
      fail('PRE_CUTOVER_PROFILE_RESOURCE_BINDING_FORBIDDEN', report.ownerTaskId)
  }
  return report
}

const CLEANUP_RESOURCE_KINDS = ['remote-branch', 'local-branch', 'worktree', 'task-temp'] as const
const CURRENT_STAGE_CLEANUP_RECORD = 'current-stage-cleanup.json'

/** Requires one positive safe state version. */
function requireStateVersion(value: unknown, field: string): asserts value is number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) fail('INVALID_STATE_VERSION', field)
}

/** Enforces the executable cleanup resource contract before planning or verification. */
export function validateStageCleanupResource(
  value: StageCleanupResource,
  field = 'cleanupResource'
): StageCleanupResource {
  requireExactKeys(value, ['kind', 'path', 'expectedSha', 'resourceTopologyVersion'], field)
  if (!CLEANUP_RESOURCE_KINDS.includes(value.kind)) fail('INVALID_CLEANUP_RESOURCE_KIND', field)
  requireString(value.path, `${field}.path`)
  const stable = value.resourceTopologyVersion === 'stable-owner-exclusive-v1'
  if (value.resourceTopologyVersion !== undefined && !stable)
    fail('INVALID_CLEANUP_RESOURCE_TOPOLOGY', field)
  if (value.kind === 'remote-branch' || value.kind === 'local-branch') {
    requireOwnerRef(value.path, `${field}.path`)
    if (!stable && !STAGE_BRANCH.test(value.path))
      fail('INVALID_CLEANUP_OWNER_REF', `${field}.path`)
    requireGitSha(value.expectedSha, `${field}.expectedSha`)
  } else {
    if (!isAbsolute(value.path) || resolve(value.path) !== value.path)
      fail('CLEANUP_RESOURCE_PATH_NOT_CANONICAL', `${field}.path`)
    const expectedPattern = value.kind === 'worktree' ? STAGE_WORKTREE : STAGE_TASK_TEMP
    if (!stable && !expectedPattern.test(value.path))
      fail('CLEANUP_RESOURCE_PATH_NOT_OWNER_BOUND', field)
    if (value.kind === 'worktree') requireGitSha(value.expectedSha, `${field}.expectedSha`)
    else if (value.expectedSha !== null) fail('TASK_TEMP_SHA_FORBIDDEN', `${field}.expectedSha`)
  }
  return value
}

/** Validates and fingerprints one Stage cleanup batch authorization. */
export function validateStageCleanupAuthorization(
  value: StageCleanupAuthorization
): StageCleanupAuthorization {
  requireExactKeys(
    value,
    [
      'schemaVersion',
      'kind',
      'authorizationFingerprint',
      'status',
      'expectedState',
      'stateVersion',
      'stageKey',
      'stageOwnerTaskId',
      'transitionId',
      'confirmationFingerprint',
      'terminalFeatures',
      'cleanupOnlyBranch',
      'allowedDeletedFeaturePackets'
    ],
    'stageCleanupAuthorization'
  )
  if (
    value.schemaVersion !== 1 ||
    value.kind !== 'OES_STAGE_CLEANUP_AUTHORIZATION' ||
    value.status !== 'ISSUED' ||
    value.expectedState !== 'STAGE_CLEANUP_AUTHORIZED'
  )
    fail('INVALID_CLEANUP_AUTHORIZATION_KIND', value.kind)
  requireFingerprint(value.authorizationFingerprint, 'authorizationFingerprint')
  const actual = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (actual !== value.authorizationFingerprint) fail('CLEANUP_FINGERPRINT_MISMATCH', actual)
  requireStateVersion(value.stateVersion, 'stateVersion')
  requireString(value.stageKey, 'stageKey')
  if (!FEATURE_KEY.test(value.stageKey)) fail('INVALID_STAGE_KEY', value.stageKey)
  requireString(value.stageOwnerTaskId, 'stageOwnerTaskId')
  requireString(value.transitionId, 'transitionId')
  requireFingerprint(value.confirmationFingerprint, 'confirmationFingerprint')
  requireOwnerRef(value.cleanupOnlyBranch, 'cleanupOnlyBranch')
  if (value.cleanupOnlyBranch !== `codex/cleanup/${value.stageKey}`)
    fail('INVALID_CLEANUP_ONLY_BRANCH', value.cleanupOnlyBranch)
  if (!Array.isArray(value.terminalFeatures) || value.terminalFeatures.length === 0)
    fail('CLEANUP_TERMINAL_FEATURES_REQUIRED', value.stageKey)
  if (
    !Array.isArray(value.allowedDeletedFeaturePackets) ||
    value.allowedDeletedFeaturePackets.length === 0
  )
    fail('CLEANUP_PACKETS_REQUIRED', value.stageKey)
  if (!TASK_PATH.test(value.stageOwnerTaskId) && !UUID_TASK.test(value.stageOwnerTaskId))
    fail('INVALID_STAGE_OWNER_TASK_ID', value.stageOwnerTaskId)
  const topologyVersions = new Set<string>()
  const featureKeys = new Set<string>()
  const featureOwners = new Set<string>()
  const packets = new Set<string>()
  const resourceKeys = new Set<string>()
  for (const feature of value.terminalFeatures) {
    requireExactKeys(
      feature,
      [
        'featureKey',
        'ownerTaskId',
        'candidateSha',
        'mergeSha',
        'featurePacket',
        'resources',
        'resourceTopologyVersion',
        'ownerResourceBinding'
      ],
      'terminalFeature'
    )
    requireString(feature.featureKey, 'terminalFeature.featureKey')
    if (!FEATURE_KEY.test(feature.featureKey)) fail('INVALID_FEATURE_KEY', feature.featureKey)
    if (featureKeys.has(feature.featureKey)) fail('DUPLICATE_TERMINAL_FEATURE', feature.featureKey)
    featureKeys.add(feature.featureKey)
    requireString(feature.ownerTaskId, 'terminalFeature.ownerTaskId')
    if (!TASK_PATH.test(feature.ownerTaskId) && !UUID_TASK.test(feature.ownerTaskId))
      fail('INVALID_CLEANUP_FEATURE_OWNER_TASK_ID', feature.ownerTaskId)
    const stable = feature.resourceTopologyVersion === 'stable-owner-exclusive-v1'
    topologyVersions.add(feature.resourceTopologyVersion ?? 'pre-cutover-v1')
    if (feature.resourceTopologyVersion !== undefined && !stable)
      fail('INVALID_CLEANUP_RESOURCE_TOPOLOGY', feature.ownerTaskId)
    const directOwnerPrefix = `${value.stageOwnerTaskId}/`
    const childSegment = feature.ownerTaskId.slice(directOwnerPrefix.length)
    if (stable) {
      if (!feature.ownerResourceBinding)
        fail('STABLE_CLEANUP_RESOURCE_BINDING_REQUIRED', feature.ownerTaskId)
      const resources = validateOwnerResourceBinding(feature.ownerResourceBinding)
      if (
        resources.resourceTopologyVersion !== 'stable-owner-exclusive-v1' ||
        resources.ownerTaskId !== feature.ownerTaskId ||
        resources.directParentTaskId !== value.stageOwnerTaskId ||
        resources.featurePacket !== feature.featurePacket
      )
        fail('STABLE_CLEANUP_OWNER_BINDING_MISMATCH', feature.ownerTaskId)
    } else {
      if (feature.ownerResourceBinding !== undefined)
        fail('PRE_CUTOVER_CLEANUP_RESOURCE_BINDING_FORBIDDEN', feature.ownerTaskId)
      if (
        !TASK_PATH.test(feature.ownerTaskId) ||
        !feature.ownerTaskId.startsWith(directOwnerPrefix) ||
        !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(childSegment)
      )
        fail('CLEANUP_FEATURE_OWNER_NOT_STAGE_CHILD', feature.ownerTaskId)
    }
    if (featureOwners.has(feature.ownerTaskId))
      fail('DUPLICATE_CLEANUP_FEATURE_OWNER', feature.ownerTaskId)
    featureOwners.add(feature.ownerTaskId)
    requireGitSha(feature.candidateSha, 'terminalFeature.candidateSha')
    requireGitSha(feature.mergeSha, 'terminalFeature.mergeSha')
    requireString(feature.featurePacket, 'terminalFeature.featurePacket')
    if (feature.featurePacket !== `docs/plans/features/${feature.featureKey}.md`)
      fail('INVALID_FEATURE_PACKET_PATH', feature.featurePacket)
    if (packets.has(feature.featurePacket)) fail('DUPLICATE_FEATURE_PACKET', feature.featurePacket)
    packets.add(feature.featurePacket)
    if (!Array.isArray(feature.resources) || feature.resources.length === 0)
      fail('CLEANUP_FEATURE_RESOURCES_REQUIRED', feature.featureKey)
    const featureResourceKinds = new Set<StageCleanupResource['kind']>()
    for (const resource of feature.resources) {
      validateStageCleanupResource(resource)
      if (featureResourceKinds.has(resource.kind))
        fail('CLEANUP_RESOURCE_KIND_DUPLICATE', `${feature.featureKey}:${resource.kind}`)
      featureResourceKinds.add(resource.kind)
      if (stable !== (resource.resourceTopologyVersion === 'stable-owner-exclusive-v1'))
        fail('CLEANUP_RESOURCE_TOPOLOGY_MIXED', `${feature.featureKey}:${resource.path}`)
      const ownerResources = feature.ownerResourceBinding
      const expectedPath =
        resource.kind === 'remote-branch' || resource.kind === 'local-branch'
          ? stable
            ? ownerResources?.ownerRef.replace(/^refs\/heads\//, '')
            : `codex/feature/${feature.featureKey}`
          : resource.kind === 'worktree'
            ? stable
              ? ownerResources?.ownerClone
              : `/private/tmp/oes-fl-${feature.featureKey}`
            : stable
              ? ownerResources?.taskTempRoot
              : `/private/tmp/oes-fl-${feature.featureKey}-artifacts`
      if (resource.path !== expectedPath)
        fail('CLEANUP_RESOURCE_OWNER_BINDING_MISMATCH', `${feature.featureKey}:${resource.path}`)
      if (resource.expectedSha !== null && resource.expectedSha !== feature.candidateSha)
        fail('CLEANUP_RESOURCE_SHA_NOT_CANDIDATE', `${feature.featureKey}:${resource.kind}`)
      const key = `${resource.resourceTopologyVersion ?? 'pre-cutover-v1'}:${resource.kind}:${resource.path}`
      if (resourceKeys.has(key)) fail('CLEANUP_RESOURCE_OWNER_AMBIGUOUS', key)
      resourceKeys.add(key)
    }
    if (
      featureResourceKinds.size !== CLEANUP_RESOURCE_KINDS.length ||
      CLEANUP_RESOURCE_KINDS.some((kind) => !featureResourceKinds.has(kind))
    )
      fail('CLEANUP_RESOURCE_KIND_SET_INCOMPLETE', feature.featureKey)
  }
  if (topologyVersions.size !== 1) fail('CLEANUP_BATCH_TOPOLOGY_MIXED', value.stageKey)
  for (const packet of value.allowedDeletedFeaturePackets) {
    requireString(packet, 'allowedDeletedFeaturePacket')
    if (!packet.startsWith('docs/plans/features/') || !packet.endsWith('.md'))
      fail('INVALID_FEATURE_PACKET_PATH', packet)
  }
  if (
    new Set(value.allowedDeletedFeaturePackets).size !== value.allowedDeletedFeaturePackets.length
  )
    fail('DUPLICATE_CLEANUP_PACKET', value.stageKey)
  if (packets.size !== value.allowedDeletedFeaturePackets.length)
    fail('CLEANUP_PACKET_SET_MISMATCH', value.stageKey)
  for (const packet of value.allowedDeletedFeaturePackets)
    if (!packets.has(packet)) fail('UNAUTHORIZED_CLEANUP_PACKET', packet)
  return value
}

/** Loads the one current protected Stage cleanup CAS record at its fixed trust-root identity. */
function loadCurrentStageCleanupAuthorization(
  trust: RemoteTrustRoots
): StageCleanupCurrentAuthorization {
  if (!trust.authorizationRoot || !isAbsolute(trust.authorizationRoot))
    fail('TRUSTED_AUTHORIZATION_ROOT_REQUIRED', 'runtime trust context')
  const path = join(trust.authorizationRoot, CURRENT_STAGE_CLEANUP_RECORD)
  assertPathWithin(realpathSync(trust.authorizationRoot), realpathSync(path))
  const current = readJson<StageCleanupCurrentAuthorization>(path)
  requireExactKeys(
    current,
    [
      'schemaVersion',
      'kind',
      'recordFingerprint',
      'status',
      'purpose',
      'rootAuthorization',
      'childAuthorization',
      'stageKey',
      'stageOwnerTaskId',
      'ownerTaskId',
      'expectedState',
      'stateVersion',
      'transitionId',
      'confirmationFingerprint',
      'postcondition'
    ],
    'stageCleanupCurrentAuthorization'
  )
  if (
    current.schemaVersion !== 1 ||
    current.kind !== 'OES_STAGE_CLEANUP_CURRENT_AUTHORIZATION' ||
    current.status !== 'ACTIVE' ||
    !['CHILD_SELF_CLEANUP', 'STAGE_CLEANUP_VERIFY'].includes(current.purpose) ||
    current.expectedState !== 'STAGE_CLEANUP_AUTHORIZED' ||
    current.postcondition !== 'CURRENT_STAGE_CLEANUP'
  )
    fail('STAGE_CLEANUP_CURRENT_NOT_ACTIVE', path)
  requireFingerprint(current.recordFingerprint, 'current.recordFingerprint')
  const actual = objectFingerprint(
    current as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  if (actual !== current.recordFingerprint) fail('STAGE_CLEANUP_CURRENT_FINGERPRINT_MISMATCH', path)
  requireStateVersion(current.stateVersion, 'current.stateVersion')
  requireString(current.stageKey, 'current.stageKey')
  requireString(current.stageOwnerTaskId, 'current.stageOwnerTaskId')
  requireString(current.ownerTaskId, 'current.ownerTaskId')
  requireString(current.transitionId, 'current.transitionId')
  requireFingerprint(current.confirmationFingerprint, 'current.confirmationFingerprint')
  if (current.ownerTaskId !== trust.ownerTaskId)
    fail('STAGE_CLEANUP_CURRENT_CAS_MISMATCH', 'ownerTaskId')
  return current
}

/** Reopens the exact root card selected by the current protected CAS record. */
function loadCurrentStageCleanupRoot(
  current: StageCleanupCurrentAuthorization,
  trust: RemoteTrustRoots
): StageCleanupAuthorization {
  const raw = verifyTrustedReference(
    current.rootAuthorization,
    trust.authorizationRoot,
    'authorizationFingerprint'
  )
  const root = validateStageCleanupAuthorization(raw as unknown as StageCleanupAuthorization)
  const exactPairs: Array<[unknown, unknown, string]> = [
    [root.stageKey, current.stageKey, 'stageKey'],
    [root.stageOwnerTaskId, current.stageOwnerTaskId, 'stageOwnerTaskId'],
    [root.expectedState, current.expectedState, 'expectedState'],
    [root.stateVersion, current.stateVersion, 'stateVersion'],
    [root.transitionId, current.transitionId, 'transitionId'],
    [root.confirmationFingerprint, current.confirmationFingerprint, 'confirmationFingerprint']
  ]
  for (const [actual, expected, field] of exactPairs)
    if (actual !== expected) fail('STAGE_CLEANUP_CURRENT_CAS_MISMATCH', field)
  return root
}

/** Loads one current Human-gated Stage cleanup card for the exact Stage verifier profile. */
export function loadTrustedStageCleanupAuthorization(
  path: string,
  trust: RemoteTrustRoots
): StageCleanupAuthorization {
  if (!isAbsolute(path)) fail('CLEANUP_AUTHORIZATION_PATH_NOT_ABSOLUTE', path)
  const current = loadCurrentStageCleanupAuthorization(trust)
  if (
    current.purpose !== 'STAGE_CLEANUP_VERIFY' ||
    current.childAuthorization !== null ||
    current.ownerTaskId !== current.stageOwnerTaskId ||
    current.rootAuthorization.path !== path
  )
    fail('STAGE_CLEANUP_CURRENT_PURPOSE_MISMATCH', path)
  return loadCurrentStageCleanupRoot(current, trust)
}

/** Validates one protected child assignment against the current root card and exact profile owner. */
export function loadTrustedStageChildCleanupAuthorization(
  rootPath: string,
  childPath: string,
  trust: RemoteTrustRoots
): { root: StageCleanupAuthorization; child: StageChildCleanupAuthorization } {
  if (!isAbsolute(rootPath)) fail('CLEANUP_AUTHORIZATION_PATH_NOT_ABSOLUTE', rootPath)
  if (!isAbsolute(childPath)) fail('CHILD_CLEANUP_AUTHORIZATION_PATH_NOT_ABSOLUTE', childPath)
  const current = loadCurrentStageCleanupAuthorization(trust)
  if (
    current.purpose !== 'CHILD_SELF_CLEANUP' ||
    current.childAuthorization === null ||
    current.rootAuthorization.path !== rootPath ||
    current.childAuthorization.path !== childPath
  )
    fail('STAGE_CLEANUP_CURRENT_PURPOSE_MISMATCH', childPath)
  const root = loadCurrentStageCleanupRoot(current, trust)
  const child = verifyTrustedReference(
    current.childAuthorization,
    trust.authorizationRoot,
    'authorizationFingerprint'
  ) as unknown as StageChildCleanupAuthorization
  requireExactKeys(
    child,
    [
      'schemaVersion',
      'kind',
      'authorizationFingerprint',
      'status',
      'rootAuthorization',
      'expectedState',
      'stateVersion',
      'stageKey',
      'stageOwnerTaskId',
      'ownerTaskId',
      'transitionId',
      'confirmationFingerprint',
      'resources',
      'postcondition',
      'resourceTopologyVersion',
      'ownerResourceBinding'
    ],
    'stageChildCleanupAuthorization'
  )
  if (
    child.schemaVersion !== 1 ||
    child.kind !== 'OES_STAGE_CHILD_CLEANUP_AUTHORIZATION' ||
    child.status !== 'ISSUED' ||
    child.expectedState !== 'STAGE_CLEANUP_AUTHORIZED' ||
    child.postcondition !== 'CHILD_SELF_CLEANUP'
  )
    fail('CHILD_CLEANUP_AUTHORIZATION_NOT_ISSUED', childPath)
  requireFingerprint(child.authorizationFingerprint, 'child.authorizationFingerprint')
  const actualFingerprint = objectFingerprint(
    child as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (actualFingerprint !== child.authorizationFingerprint)
    fail('CHILD_CLEANUP_AUTHORIZATION_FINGERPRINT_MISMATCH', childPath)
  requireStateVersion(child.stateVersion, 'child.stateVersion')
  if (canonicalJson(child.rootAuthorization) !== canonicalJson(current.rootAuthorization))
    fail('CHILD_CLEANUP_ROOT_REFERENCE_MISMATCH', childPath)
  const exactPairs: Array<[unknown, unknown, string]> = [
    [child.stageKey, root.stageKey, 'stageKey'],
    [child.stageOwnerTaskId, root.stageOwnerTaskId, 'stageOwnerTaskId'],
    [child.expectedState, root.expectedState, 'expectedState'],
    [child.stateVersion, root.stateVersion, 'stateVersion'],
    [child.transitionId, root.transitionId, 'transitionId'],
    [child.confirmationFingerprint, root.confirmationFingerprint, 'confirmationFingerprint'],
    [child.ownerTaskId, current.ownerTaskId, 'current.ownerTaskId'],
    [child.ownerTaskId, trust.ownerTaskId, 'ownerTaskId']
  ]
  for (const [actual, expected, field] of exactPairs)
    if (actual !== expected) fail('CHILD_CLEANUP_AUTHORIZATION_CAS_MISMATCH', field)
  if (!Array.isArray(child.resources))
    fail('CHILD_CLEANUP_RESOURCE_SET_MISMATCH', child.ownerTaskId)
  for (const resource of child.resources)
    validateStageCleanupResource(resource, 'childCleanupResource')
  const expectedResources = root.terminalFeatures
    .filter((feature) => feature.ownerTaskId === child.ownerTaskId)
    .flatMap((feature) => feature.resources)
  const ownerFeature = root.terminalFeatures.find(
    (feature) => feature.ownerTaskId === child.ownerTaskId
  )
  if (ownerFeature?.resourceTopologyVersion === 'stable-owner-exclusive-v1') {
    if (
      child.resourceTopologyVersion !== 'stable-owner-exclusive-v1' ||
      !child.ownerResourceBinding ||
      canonicalJson(child.ownerResourceBinding) !== canonicalJson(ownerFeature.ownerResourceBinding)
    )
      fail('CHILD_CLEANUP_STABLE_RESOURCE_BINDING_MISMATCH', child.ownerTaskId)
  } else if (
    child.resourceTopologyVersion !== undefined ||
    child.ownerResourceBinding !== undefined
  )
    fail('CHILD_CLEANUP_LEGACY_TOPOLOGY_MIXED', child.ownerTaskId)
  if (expectedResources.length === 0) fail('CLEANUP_OWNER_NOT_IN_BATCH', child.ownerTaskId)
  const sortedResources = (resources: typeof child.resources) =>
    [...resources].sort((left, right) =>
      `${left.kind}:${left.path}:${left.expectedSha ?? ''}`.localeCompare(
        `${right.kind}:${right.path}:${right.expectedSha ?? ''}`
      )
    )
  if (
    canonicalJson(sortedResources(child.resources)) !==
    canonicalJson(sortedResources(expectedResources))
  )
    fail('CHILD_CLEANUP_RESOURCE_SET_MISMATCH', child.ownerTaskId)
  return { root, child }
}
