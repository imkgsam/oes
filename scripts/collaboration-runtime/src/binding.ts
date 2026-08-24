import { isAbsolute } from 'node:path'
import {
  CAPABILITY_NAMES,
  REMOTE_ACTIONS,
  type EffectiveProfileReport,
  type RemoteDriverBinding,
  type StageCleanupAuthorization
} from './types.ts'
import { assertPathWithin, isInvalidated, objectFingerprint, readJson } from './canonical.ts'
import { fail } from './errors.ts'

const SHA256 = /^[0-9a-f]{64}$/
const GIT_SHA = /^[0-9a-f]{40}$/
const SAFE_REF =
  /^(?!.*(?:\.\.|@\{|\\|\s|~|\^|:|\?|\*|\[))(?!\/)(?!.*\/\/)(?!.*\.$)[A-Za-z0-9._/-]+$/

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

/** Validates a safe non-main owner branch name. */
function requireOwnerRef(value: unknown, field: string): asserts value is string {
  requireString(value, field)
  if (
    !SAFE_REF.test(value) ||
    value === 'main' ||
    value.startsWith('refs/') ||
    value.startsWith('-')
  ) {
    fail('INVALID_OWNER_REF', field)
  }
}

/** Validates and fingerprints one exact remote-driver binding. */
export function validateRemoteBinding(binding: RemoteDriverBinding): RemoteDriverBinding {
  if (binding.schemaVersion !== 1 || binding.kind !== 'OES_REMOTE_DRIVER_BINDING')
    fail('INVALID_BINDING_KIND', binding.kind)
  if (!REMOTE_ACTIONS.includes(binding.action))
    fail('INVALID_REMOTE_ACTION', String(binding.action))
  const computed = objectFingerprint(
    binding as unknown as Record<string, unknown>,
    'bindingFingerprint'
  )
  requireFingerprint(binding.bindingFingerprint, 'bindingFingerprint')
  if (computed !== binding.bindingFingerprint) fail('BINDING_FINGERPRINT_MISMATCH', computed)
  requireString(binding.owner?.taskId, 'owner.taskId')
  if (
    !['Direct owner', 'Global Unified Design', 'Feature Lead', 'Stage Lead'].includes(
      binding.owner.role
    )
  ) {
    fail('INVALID_OWNER_ROLE', binding.owner.role)
  }
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
  const artifactPaths = [binding.checkpointPath, binding.resultPath, binding.invalidationPath]
  for (const path of artifactPaths) assertPathWithin(binding.artifactRoot, path)
  if (new Set(artifactPaths).size !== artifactPaths.length)
    fail('REMOTE_ARTIFACT_PATH_COLLISION', binding.artifactRoot)
  if (isInvalidated(binding.invalidationPath))
    fail('REMOTE_BINDING_INVALIDATED', binding.invalidationPath)
  requireString(binding.singleUseNonce, 'singleUseNonce')
  requireOwnerRef(binding.headRef, 'headRef')
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
    if (binding.admission.mode === 'serial-latest-main') {
      if (!binding.admission.lockPath) fail('SERIAL_ADMISSION_LOCK_REQUIRED', binding.headRef)
      assertPathWithin(binding.artifactRoot, binding.admission.lockPath)
    } else if (binding.admission.mode === 'merge-queue') {
      if (binding.admission.lockPath !== null)
        fail('MERGE_QUEUE_MUST_NOT_USE_LOCAL_LOCK', binding.headRef)
      if (binding.admission.mergeGroupSha !== null)
        requireGitSha(binding.admission.mergeGroupSha, 'admission.mergeGroupSha')
    } else {
      fail('INVALID_ADMISSION_MODE', String(binding.admission.mode))
    }
  }
  if (binding.action === 'cleanup') {
    requireFingerprint(binding.cleanupAuthorizationFingerprint, 'cleanupAuthorizationFingerprint')
    if (!binding.cleanupResources?.length) fail('CLEANUP_RESOURCES_REQUIRED', binding.headRef)
  }
  if (binding.owner.role === 'Stage Lead' && !binding.cleanupAuthorizationFingerprint) {
    fail('STAGE_REMOTE_REQUIRES_CLEANUP_AUTHORIZATION', binding.action)
  }
  return binding
}

/** Loads and validates one remote binding from disk. */
export function loadRemoteBinding(path: string): RemoteDriverBinding {
  return validateRemoteBinding(readJson<RemoteDriverBinding>(path))
}

/** Validates the structural envelope of an effective-profile report. */
export function validateProfileReportEnvelope(
  report: EffectiveProfileReport
): EffectiveProfileReport {
  if (report.schemaVersion !== 1 || report.kind !== 'OES_EFFECTIVE_PROFILE_REPORT')
    fail('INVALID_PROFILE_REPORT_KIND', report.kind)
  requireString(report.ownerTaskId, 'ownerTaskId')
  requireString(report.transitionId, 'transitionId')
  requireFingerprint(report.profile.sha256, 'profile.sha256')
  for (const capability of report.declaredCapabilities) {
    if (!CAPABILITY_NAMES.includes(capability)) fail('UNKNOWN_CAPABILITY', capability)
  }
  return report
}

/** Validates and fingerprints one Stage cleanup batch authorization. */
export function validateStageCleanupAuthorization(
  value: StageCleanupAuthorization
): StageCleanupAuthorization {
  if (value.schemaVersion !== 1 || value.kind !== 'OES_STAGE_CLEANUP_AUTHORIZATION')
    fail('INVALID_CLEANUP_AUTHORIZATION_KIND', value.kind)
  requireFingerprint(value.authorizationFingerprint, 'authorizationFingerprint')
  const actual = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (actual !== value.authorizationFingerprint) fail('CLEANUP_FINGERPRINT_MISMATCH', actual)
  requireString(value.stageKey, 'stageKey')
  requireString(value.stageOwnerTaskId, 'stageOwnerTaskId')
  requireString(value.transitionId, 'transitionId')
  requireFingerprint(value.confirmationFingerprint, 'confirmationFingerprint')
  requireOwnerRef(value.cleanupOnlyBranch, 'cleanupOnlyBranch')
  if (!value.cleanupOnlyBranch.startsWith('codex/cleanup/'))
    fail('INVALID_CLEANUP_ONLY_BRANCH', value.cleanupOnlyBranch)
  const featureKeys = new Set<string>()
  const packets = new Set<string>()
  const resourceKeys = new Set<string>()
  for (const feature of value.terminalFeatures) {
    if (featureKeys.has(feature.featureKey)) fail('DUPLICATE_TERMINAL_FEATURE', feature.featureKey)
    featureKeys.add(feature.featureKey)
    requireString(feature.ownerTaskId, 'terminalFeature.ownerTaskId')
    requireGitSha(feature.candidateSha, 'terminalFeature.candidateSha')
    requireGitSha(feature.mergeSha, 'terminalFeature.mergeSha')
    if (
      !feature.featurePacket.startsWith('docs/plans/features/') ||
      !feature.featurePacket.endsWith('.md')
    ) {
      fail('INVALID_FEATURE_PACKET_PATH', feature.featurePacket)
    }
    packets.add(feature.featurePacket)
    if (feature.resources.length === 0)
      fail('CLEANUP_FEATURE_RESOURCES_REQUIRED', feature.featureKey)
    for (const resource of feature.resources) {
      const key = `${resource.kind}:${resource.path}`
      if (resourceKeys.has(key)) fail('CLEANUP_RESOURCE_OWNER_AMBIGUOUS', key)
      resourceKeys.add(key)
      if (resource.expectedSha !== null)
        requireGitSha(resource.expectedSha, 'cleanupResource.expectedSha')
    }
  }
  if (packets.size !== value.allowedDeletedFeaturePackets.length)
    fail('CLEANUP_PACKET_SET_MISMATCH', value.stageKey)
  for (const packet of value.allowedDeletedFeaturePackets) {
    if (!packets.has(packet)) fail('UNAUTHORIZED_CLEANUP_PACKET', packet)
  }
  return value
}
