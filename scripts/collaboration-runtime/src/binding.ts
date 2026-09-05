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
  validateStableOwnerTaskTempRootShape,
  validateOwnerResourceBinding,
  validateOwnerResourceReference
} from './resource-topology.ts'
import { RESOURCE_TOPOLOGY_VERSIONS } from './resource-topology.types.ts'

const SHA256 = /^[0-9a-f]{64}$/
const GIT_SHA = /^[0-9a-f]{40}$/
const SAFE_REF =
  /^(?!main$)(?!HEAD$)(?!refs\/)(?!-)(?!\/)(?!\.)(?!.*\/\.)(?!.*\/\/)(?!.*\.\.)(?!.*@\{)(?!.*(?:^|\/)[^/]*\.lock(?:\/|$))(?!.*[/.]$)(?!@$)[A-Za-z0-9._\/@+-]+$/
const DELIVERY_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TASK_PATH = /^\/[A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9][A-Za-z0-9_-]*)+$/
const UUID_TASK = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

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

/** Returns the only active V2 owner-resource topology. */
function trustTopologyVersion(trust: RemoteTrustRoots): 'owner-exclusive-v2' {
  if (trust.resourceTopologyVersion !== 'owner-exclusive-v2')
    fail('V2_RESOURCE_TOPOLOGY_REQUIRED', trust.ownerTaskId)
  return 'owner-exclusive-v2'
}

/** Computes the action resource set while for the V2 owner identity. */
function remoteResourceSetFingerprint(binding: RemoteDriverBinding): string {
  const value: Record<string, unknown> = {
    checkpointPath: binding.checkpointPath,
    resultPath: binding.resultPath,
    invalidationPath: binding.invalidationPath,
    pullRequest: binding.pullRequest,
    admission: binding.admission ?? null,
    expectedMergeSha: binding.expectedMergeSha ?? null
  }
  value.resourceTopologyVersion = binding.resourceTopologyVersion
  value.ownerResourceBinding = binding.ownerResourceBinding ?? null
  return objectFingerprint(value, '__none__')
}

/** Binds stable remote artifacts to one profile-sealed owner topology and action directory. */
function validateRemoteResourceTopology(
  binding: RemoteDriverBinding,
  trust: RemoteTrustRoots
): void {
  const version = trustTopologyVersion(trust)
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
export function verifyTrustedReference(
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
  if (version === 'owner-exclusive-v2') {
    if (
      root.resourceTopologyVersion !== version ||
      authority.resourceTopologyVersion !== version ||
      !root.ownerResourceBinding ||
      !authority.ownerResourceBinding ||
      canonicalJson(root.ownerResourceBinding) !== canonicalJson(binding.ownerResourceBinding) ||
      canonicalJson(authority.ownerResourceBinding) !== canonicalJson(binding.ownerResourceBinding)
    )
      fail('REMOTE_AUTHORIZATION_RESOURCE_TOPOLOGY_MISMATCH', binding.owner.taskId)
  }
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
  if (!['DO', 'UD', 'DO', 'CO'].includes(binding.owner.role))
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
  if (![1, 2].includes(report.schemaVersion) || report.kind !== 'OES_EFFECTIVE_PROFILE_REPORT')
    fail('INVALID_PROFILE_REPORT_KIND', `${report.schemaVersion}:${report.kind}`)
  requireExactKeys(
    report,
    report.schemaVersion === 2
      ? [
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
          'resourceTopology',
          'approvalMode',
          'launchReceipt',
          'effectivePermissionSandboxFingerprint',
          'probeAttempt'
        ]
      : [
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
  requireString(report.ownerTaskId, 'ownerTaskId')
  requireString(report.transitionId, 'transitionId')
  if (!['HANDOFF_PENDING', 'DELIVERY_ACTIVE'].includes(report.expectedState))
    fail('INVALID_PROFILE_EXPECTED_STATE', report.expectedState)
  requireExactKeys(report.profile, ['name', 'permission', 'path', 'sha256'], 'profile')
  requireString(report.profile.path, 'profile.path')
  requireFingerprint(report.profile.sha256, 'profile.sha256')
  if (report.schemaVersion === 2) {
    if (!['ON_REQUEST_AUTO_REVIEW', 'NEVER_USER'].includes(String(report.approvalMode)))
      fail('INVALID_PROFILE_APPROVAL_MODE', String(report.approvalMode))
    if (!report.launchReceipt) fail('PROFILE_LAUNCH_RECEIPT_REQUIRED', report.ownerTaskId)
    requireExactKeys(report.launchReceipt, ['path', 'sha256', 'fingerprint'], 'launchReceipt')
    requireString(report.launchReceipt.path, 'launchReceipt.path')
    requireFingerprint(report.launchReceipt.sha256, 'launchReceipt.sha256')
    requireFingerprint(report.launchReceipt.fingerprint, 'launchReceipt.fingerprint')
    requireFingerprint(
      report.effectivePermissionSandboxFingerprint,
      'effectivePermissionSandboxFingerprint'
    )
    if (!report.probeAttempt) fail('PROFILE_PROBE_ATTEMPT_REQUIRED', report.ownerTaskId)
    requireExactKeys(report.probeAttempt, ['path', 'sha256', 'fingerprint'], 'probeAttempt')
    requireString(report.probeAttempt.path, 'probeAttempt.path')
    requireFingerprint(report.probeAttempt.sha256, 'probeAttempt.sha256')
    requireFingerprint(report.probeAttempt.fingerprint, 'probeAttempt.fingerprint')
  }
  if (new Set(report.declaredCapabilities).size !== report.declaredCapabilities.length)
    fail('DUPLICATE_DECLARED_CAPABILITY', report.ownerTaskId)
  for (const capability of report.declaredCapabilities)
    if (!CAPABILITY_NAMES.includes(capability)) fail('UNKNOWN_CAPABILITY', capability)
  if (!report.resourceTopology) fail('V2_PROFILE_RESOURCE_TOPOLOGY_REQUIRED', report.ownerTaskId)
  requireExactKeys(
    report.resourceTopology,
    ['resourceTopologyVersion', 'ownerResourceBinding'],
    'profileReport.resourceTopology'
  )
  if (
    report.resourceTopology.resourceTopologyVersion !== 'owner-exclusive-v2' ||
    !report.resourceTopology.ownerResourceBinding
  )
    fail(
      'INVALID_PROFILE_RESOURCE_TOPOLOGY_VERSION',
      String(report.resourceTopology.resourceTopologyVersion)
    )
  validateOwnerResourceReference(report.resourceTopology.ownerResourceBinding)
  return report
}
