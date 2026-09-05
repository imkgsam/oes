import { readFileSync, realpathSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import {
  assertPathWithin,
  canonicalJson,
  objectFingerprint,
  readJson,
  sha256
} from './canonical.ts'
import { fail } from './errors.ts'
import type {
  CoordinationChildCleanupAuthorization,
  CoordinationCleanupAuthorization,
  CoordinationCleanupCurrentAuthorization,
  CoordinationCleanupResource,
  RemoteTrustRoots
} from './types.ts'
import type { OwnerResourceBinding } from './resource-topology.types.ts'

const SHA = /^[0-9a-f]{40}$/
const DIGEST = /^[0-9a-f]{64}$/
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TASK = /^(?:\/[A-Za-z0-9][A-Za-z0-9_-]*){2,}$/
const REF = /^codex\/(?:delivery|coordination)\/[a-z0-9]+(?:-[a-z0-9]+)*$/
const CURRENT_RECORD = 'current-coordination-cleanup.json'
const KINDS: CoordinationCleanupResource['kind'][] = [
  'remote-branch',
  'local-branch',
  'worktree',
  'task-temp'
]

/** Reads and authenticates one immutable cleanup record under the profile-selected trust root. */
function trustedRecord(
  reference: { path: string; sha256: string; fingerprint: string },
  root: string,
  field: string
): Record<string, unknown> {
  if (!isAbsolute(reference.path)) fail('CLEANUP_TRUST_PATH_NOT_ABSOLUTE', reference.path)
  assertPathWithin(root, reference.path)
  assertPathWithin(realpathSync(root), realpathSync(reference.path))
  const bytes = readFileSync(reference.path)
  if (sha256(bytes) !== reference.sha256) fail('CLEANUP_TRUST_SHA_MISMATCH', reference.path)
  const value = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>
  if (
    value[field] !== reference.fingerprint ||
    objectFingerprint(value, field) !== reference.fingerprint
  )
    fail('CLEANUP_TRUST_FINGERPRINT_MISMATCH', reference.path)
  return value
}

/** Enforces a V2 cleanup resource identity with no repository-content target. */
export function validateCoordinationCleanupResource(
  value: CoordinationCleanupResource,
  field = 'cleanupResource'
): CoordinationCleanupResource {
  if (
    !value ||
    typeof value !== 'object' ||
    Object.keys(value).sort().join(',') !== 'expectedSha,kind,path'
  )
    fail('CLEANUP_RESOURCE_SHAPE_INVALID', field)
  if (!KINDS.includes(value.kind)) fail('CLEANUP_RESOURCE_KIND_INVALID', field)
  if (!value.path) fail('CLEANUP_RESOURCE_PATH_INVALID', field)
  if (value.kind === 'remote-branch' || value.kind === 'local-branch') {
    if (!REF.test(value.path) || !SHA.test(String(value.expectedSha)))
      fail('CLEANUP_BRANCH_IDENTITY_INVALID', value.path)
  } else {
    if (!isAbsolute(value.path) || resolve(value.path) !== value.path)
      fail('CLEANUP_PATH_NOT_CANONICAL', value.path)
    if (value.kind === 'worktree' && !SHA.test(String(value.expectedSha)))
      fail('CLEANUP_WORKTREE_SHA_INVALID', value.path)
    if (value.kind === 'task-temp' && value.expectedSha !== null)
      fail('CLEANUP_TASK_TEMP_SHA_FORBIDDEN', value.path)
  }
  return value
}

/** Validates a stable owner binding only to narrow resources; it provides no recovery operation. */
function validateOwnerBinding(
  value: OwnerResourceBinding,
  ownerTaskId: string,
  candidateSha: string
): void {
  if (
    value.schemaVersion !== 1 ||
    value.kind !== 'OES_OWNER_RESOURCE_BINDING' ||
    value.ownerTaskId !== ownerTaskId ||
    value.resourceTopologyVersion !== 'owner-exclusive-v2' ||
    !DIGEST.test(value.bindingFingerprint)
  )
    fail('CLEANUP_OWNER_BINDING_INVALID', ownerTaskId)
  if (!value.ownerRef.startsWith('refs/heads/') || value.ownerRef.slice(11) === 'main')
    fail('CLEANUP_OWNER_REF_INVALID', value.ownerRef)
  if (!SHA.test(candidateSha)) fail('CLEANUP_CANDIDATE_SHA_INVALID', ownerTaskId)
}

/** Validates one Human-confirmed terminal CO cleanup batch without any cleanup branch or document deletion. */
export function validateCoordinationCleanupAuthorization(
  value: CoordinationCleanupAuthorization
): CoordinationCleanupAuthorization {
  const keys = [
    'authorizationFingerprint',
    'confirmationFingerprint',
    'coordinationKey',
    'coordinationOwnerTaskId',
    'expectedState',
    'kind',
    'schemaVersion',
    'stateVersion',
    'status',
    'terminalDeliveries',
    'transitionId'
  ]
  if (
    !value ||
    typeof value !== 'object' ||
    canonicalJson(Object.keys(value).sort()) !== canonicalJson(keys.sort()) ||
    value.schemaVersion !== 2 ||
    value.kind !== 'OES_COORDINATION_CLEANUP_AUTHORIZATION' ||
    value.status !== 'ISSUED' ||
    value.expectedState !== 'COORDINATION_CLEANUP_AUTHORIZED' ||
    !KEY.test(value.coordinationKey) ||
    !TASK.test(value.coordinationOwnerTaskId) ||
    !value.transitionId ||
    !DIGEST.test(value.confirmationFingerprint) ||
    !Number.isSafeInteger(value.stateVersion) ||
    value.stateVersion < 1 ||
    !Array.isArray(value.terminalDeliveries) ||
    !value.terminalDeliveries.length
  )
    fail('COORDINATION_CLEANUP_AUTHORIZATION_INVALID', value?.coordinationKey ?? 'NONE')
  const owners = new Set<string>()
  const resources = new Set<string>()
  for (const delivery of value.terminalDeliveries) {
    if (
      !KEY.test(delivery.deliveryKey) ||
      !TASK.test(delivery.ownerTaskId) ||
      owners.has(delivery.ownerTaskId) ||
      !['MERGED', 'ABANDONED'].includes(delivery.terminalState) ||
      !SHA.test(delivery.candidateSha) ||
      (delivery.terminalState === 'MERGED'
        ? !SHA.test(String(delivery.mergeSha))
        : delivery.mergeSha !== null) ||
      !Array.isArray(delivery.resources) ||
      delivery.resources.length !== 4
    )
      fail('COORDINATION_CLEANUP_DELIVERY_INVALID', delivery.deliveryKey)
    if (!delivery.ownerTaskId.startsWith(`${value.coordinationOwnerTaskId}/`))
      fail('COORDINATION_CLEANUP_OWNER_NOT_CHILD', delivery.ownerTaskId)
    validateOwnerBinding(delivery.ownerResourceBinding, delivery.ownerTaskId, delivery.candidateSha)
    const binding = delivery.ownerResourceBinding
    const expected: Record<CoordinationCleanupResource['kind'], string> = {
      'remote-branch': binding.ownerRef.slice(11),
      'local-branch': binding.ownerRef.slice(11),
      worktree: binding.ownerClone,
      'task-temp': binding.taskTempRoot
    }
    const seen = new Set<string>()
    for (const resource of delivery.resources) {
      validateCoordinationCleanupResource(resource)
      if (
        seen.has(resource.kind) ||
        resource.path !== expected[resource.kind] ||
        (resource.expectedSha !== null && resource.expectedSha !== delivery.candidateSha)
      )
        fail(
          'COORDINATION_CLEANUP_RESOURCE_NOT_OWNER_BOUND',
          `${delivery.deliveryKey}:${resource.path}`
        )
      const identity = `${resource.kind}:${resource.path}`
      if (resources.has(identity)) fail('COORDINATION_CLEANUP_RESOURCE_AMBIGUOUS', identity)
      seen.add(resource.kind)
      resources.add(identity)
    }
    if (KINDS.some((kind) => !seen.has(kind)))
      fail('COORDINATION_CLEANUP_RESOURCE_SET_INCOMPLETE', delivery.deliveryKey)
    owners.add(delivery.ownerTaskId)
  }
  const actual = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (!DIGEST.test(value.authorizationFingerprint) || value.authorizationFingerprint !== actual)
    fail('COORDINATION_CLEANUP_FINGERPRINT_MISMATCH', actual)
  return value
}

/** Loads the single current cleanup CAS record and its exact root authorization. */
function loadCurrent(trust: RemoteTrustRoots): {
  current: CoordinationCleanupCurrentAuthorization
  root: CoordinationCleanupAuthorization
} {
  if (!isAbsolute(trust.authorizationRoot)) fail('CLEANUP_TRUST_ROOT_REQUIRED', trust.ownerTaskId)
  const path = join(trust.authorizationRoot, CURRENT_RECORD)
  const current = readJson<CoordinationCleanupCurrentAuthorization>(path)
  if (
    current.schemaVersion !== 2 ||
    current.kind !== 'OES_COORDINATION_CLEANUP_CURRENT_AUTHORIZATION' ||
    current.status !== 'ACTIVE' ||
    current.expectedState !== 'COORDINATION_CLEANUP_AUTHORIZED' ||
    current.postcondition !== 'CURRENT_COORDINATION_CLEANUP' ||
    current.ownerTaskId !== trust.ownerTaskId ||
    objectFingerprint(current as unknown as Record<string, unknown>, 'recordFingerprint') !==
      current.recordFingerprint
  )
    fail('COORDINATION_CLEANUP_CURRENT_INVALID', path)
  const root = validateCoordinationCleanupAuthorization(
    trustedRecord(
      current.rootAuthorization,
      trust.authorizationRoot,
      'authorizationFingerprint'
    ) as unknown as CoordinationCleanupAuthorization
  )
  for (const [a, b, name] of [
    [current.coordinationKey, root.coordinationKey, 'key'],
    [current.coordinationOwnerTaskId, root.coordinationOwnerTaskId, 'owner'],
    [current.transitionId, root.transitionId, 'transition'],
    [current.confirmationFingerprint, root.confirmationFingerprint, 'confirmation'],
    [current.stateVersion, root.stateVersion, 'state']
  ] as const)
    if (a !== b) fail('COORDINATION_CLEANUP_CURRENT_CAS_MISMATCH', name)
  return { current, root }
}

/** Loads the exact current root cleanup authorization for CO verification. */
export function loadTrustedCoordinationCleanupAuthorization(
  _path: string,
  trust: RemoteTrustRoots
): CoordinationCleanupAuthorization {
  const { current, root } = loadCurrent(trust)
  if (
    current.purpose !== 'COORDINATION_CLEANUP_VERIFY' ||
    current.childAuthorization !== null ||
    current.ownerTaskId !== root.coordinationOwnerTaskId
  )
    fail('COORDINATION_CLEANUP_CURRENT_PURPOSE_MISMATCH', current.ownerTaskId)
  return root
}

/** Loads one child authorization narrowed to the exact DO resource set. */
export function loadTrustedCoordinationChildCleanupAuthorization(
  _rootPath: string,
  _childPath: string,
  trust: RemoteTrustRoots
): { root: CoordinationCleanupAuthorization; child: CoordinationChildCleanupAuthorization } {
  const { current, root } = loadCurrent(trust)
  if (current.purpose !== 'CHILD_SELF_CLEANUP' || !current.childAuthorization)
    fail('COORDINATION_CLEANUP_CURRENT_PURPOSE_MISMATCH', current.ownerTaskId)
  const child = trustedRecord(
    current.childAuthorization,
    trust.authorizationRoot,
    'authorizationFingerprint'
  ) as unknown as CoordinationChildCleanupAuthorization
  const delivery = root.terminalDeliveries.find((item) => item.ownerTaskId === child.ownerTaskId)
  if (
    !delivery ||
    child.schemaVersion !== 2 ||
    child.kind !== 'OES_COORDINATION_CHILD_CLEANUP_AUTHORIZATION' ||
    child.status !== 'ISSUED' ||
    child.postcondition !== 'CHILD_SELF_CLEANUP' ||
    child.ownerTaskId !== trust.ownerTaskId ||
    child.coordinationKey !== root.coordinationKey ||
    child.coordinationOwnerTaskId !== root.coordinationOwnerTaskId ||
    child.transitionId !== root.transitionId ||
    child.stateVersion !== root.stateVersion ||
    canonicalJson(child.ownerResourceBinding) !== canonicalJson(delivery.ownerResourceBinding) ||
    canonicalJson(child.resources) !== canonicalJson(delivery.resources)
  )
    fail('COORDINATION_CHILD_CLEANUP_BINDING_MISMATCH', child.ownerTaskId)
  return { root, child }
}
