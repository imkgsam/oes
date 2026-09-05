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
import {
  loadOwnerResourceBindingReference,
  validateOwnerResourceReference
} from './resource-topology.ts'
import type { OwnerResourceBinding, OwnerResourceReference } from './resource-topology.types.ts'

const SHA = /^[0-9a-f]{40}$/
const DIGEST = /^[0-9a-f]{64}$/
const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TASK = /^(?:\/[A-Za-z0-9][A-Za-z0-9_-]*){2,}$/
const REF = /^codex\/(?:delivery|coordination)\/[a-z0-9]+(?:-[a-z0-9]+)*$/
const CURRENT_RECORD = 'current-coordination-cleanup.json'
const trustedCleanupAuthorizations = new WeakSet<object>()
const KINDS: CoordinationCleanupResource['kind'][] = [
  'remote-branch',
  'local-branch',
  'worktree',
  'task-temp',
  'delivery-package'
]

/** Requires one cleanup envelope to contain exactly the closed schema fields. */
function requireExactKeys(value: unknown, allowed: string[], field: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('CLEANUP_OBJECT_INVALID', field)
  if (canonicalJson(Object.keys(value).sort()) !== canonicalJson([...allowed].sort()))
    fail('CLEANUP_OBJECT_SHAPE_INVALID', field)
}

/** Validates one immutable cleanup reference before following it. */
function validateCleanupReference(
  value: { path: string; sha256: string; fingerprint: string },
  field: string
): void {
  requireExactKeys(value, ['path', 'sha256', 'fingerprint'], field)
  if (
    !isAbsolute(value.path) ||
    resolve(value.path) !== value.path ||
    !DIGEST.test(value.sha256) ||
    !DIGEST.test(value.fingerprint)
  )
    fail('CLEANUP_REFERENCE_INVALID', field)
}

/** Reads and authenticates one immutable cleanup record under the profile-selected trust root. */
function trustedRecord(
  reference: { path: string; sha256: string; fingerprint: string },
  root: string,
  field: string
): Record<string, unknown> {
  validateCleanupReference(reference, field)
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
    if (value.kind === 'delivery-package' && value.expectedSha !== null)
      fail('CLEANUP_DELIVERY_PACKAGE_SHA_FORBIDDEN', value.path)
  }
  return value
}

/** Validates a stable owner binding only to narrow resources; it provides no recovery operation. */
function validateOwnerBinding(
  value: OwnerResourceReference,
  ownerTaskId: string,
  _candidateSha: string
): void {
  if (
    !value ||
    typeof value !== 'object' ||
    Object.keys(value).sort().join(',') !== 'fingerprint,path,sha256'
  )
    fail('CLEANUP_OWNER_BINDING_INVALID', ownerTaskId)
  try {
    validateOwnerResourceReference(value, `cleanup.ownerResourceBinding:${ownerTaskId}`)
  } catch {
    fail('CLEANUP_OWNER_BINDING_INVALID', ownerTaskId)
  }
}

/** Reopens every child owner binding from the protected root and checks its physical resource set. */
function validateLoadedOwnerResources(
  value: CoordinationCleanupAuthorization,
  authorizationRoot: string
): void {
  const entries = [
    ...value.terminalDeliveries.map((delivery) => ({
      ownerTaskId: delivery.ownerTaskId,
      candidateSha: delivery.candidateSha,
      resources: delivery.resources,
      ownerResourceBinding: delivery.ownerResourceBinding,
      deliveryKey: delivery.deliveryKey
    })),
    {
      ownerTaskId: value.coordinationOwner.ownerTaskId,
      candidateSha: value.coordinationOwner.candidateSha,
      resources: value.coordinationOwner.resources,
      ownerResourceBinding: value.coordinationOwner.ownerResourceBinding,
      deliveryKey: 'coordination-owner'
    }
  ]
  for (const delivery of entries) {
    const binding = loadOwnerResourceBindingReference(delivery.ownerResourceBinding)
    assertPathWithin(binding.artifactRoot, delivery.ownerResourceBinding.path)
    assertPathWithin(realpathSync(binding.artifactRoot), realpathSync(delivery.ownerResourceBinding.path))
    if (
      binding.ownerTaskId !== delivery.ownerTaskId ||
      binding.resourceTopologyVersion !== 'owner-exclusive-v2' ||
      !SHA.test(delivery.candidateSha)
    )
      fail('CLEANUP_OWNER_BINDING_CONTENT_MISMATCH', delivery.ownerTaskId)
    const expected: Record<CoordinationCleanupResource['kind'], string> = {
      'remote-branch': binding.ownerRef.slice(11),
      'local-branch': binding.ownerRef.slice(11),
      worktree: binding.ownerClone,
      'task-temp': binding.taskTempRoot,
      'delivery-package': binding.deliveryPackagePath
    }
    for (const resource of delivery.resources)
      if (resource.path !== expected[resource.kind])
        fail('COORDINATION_CLEANUP_RESOURCE_NOT_OWNER_BOUND', `${delivery.deliveryKey}:${resource.path}`)
  }
  if (!authorizationRoot) fail('CLEANUP_TRUST_ROOT_REQUIRED', value.coordinationKey)
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
    'coordinationOwner',
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
    !value.terminalDeliveries.length ||
    !value.coordinationOwner
  )
    fail('COORDINATION_CLEANUP_AUTHORIZATION_INVALID', value?.coordinationKey ?? 'NONE')
  const owners = new Set<string>()
  const resources = new Set<string>()
  for (const delivery of value.terminalDeliveries) {
    requireExactKeys(
      delivery,
      [
        'deliveryKey',
        'ownerTaskId',
        'terminalState',
        'candidateSha',
        'mergeSha',
        'ownerResourceBinding',
        'resources'
      ],
      'coordinationCleanupDelivery'
    )
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
      delivery.resources.length !== 5
    )
      fail('COORDINATION_CLEANUP_DELIVERY_INVALID', delivery.deliveryKey)
    if (!delivery.ownerTaskId.startsWith(`${value.coordinationOwnerTaskId}/`))
      fail('COORDINATION_CLEANUP_OWNER_NOT_CHILD', delivery.ownerTaskId)
    validateOwnerBinding(delivery.ownerResourceBinding, delivery.ownerTaskId, delivery.candidateSha)
    const seen = new Set<string>()
    for (const resource of delivery.resources) {
      validateCoordinationCleanupResource(resource)
      if (
        seen.has(resource.kind) ||
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
  const owner = value.coordinationOwner
  requireExactKeys(
    owner,
    [
      'ownerTaskId',
      'terminalState',
      'candidateSha',
      'mergeSha',
      'ownerResourceBinding',
      'resources'
    ],
    'coordinationCleanupOwner'
  )
  if (
    owner.ownerTaskId !== value.coordinationOwnerTaskId ||
    !['MERGED', 'ABANDONED'].includes(owner.terminalState) ||
    !SHA.test(owner.candidateSha) ||
    (owner.terminalState === 'MERGED' ? !SHA.test(String(owner.mergeSha)) : owner.mergeSha !== null) ||
    !Array.isArray(owner.resources) ||
    owner.resources.length !== 5
  )
    fail('COORDINATION_CLEANUP_OWNER_INVALID', value.coordinationOwnerTaskId)
  validateOwnerBinding(owner.ownerResourceBinding, owner.ownerTaskId, owner.candidateSha)
  const ownerKinds = new Set<string>()
  for (const resource of owner.resources) {
    validateCoordinationCleanupResource(resource, 'coordinationCleanupResource')
    if (ownerKinds.has(resource.kind)) fail('COORDINATION_CLEANUP_RESOURCE_AMBIGUOUS', resource.kind)
    if (
      resource.expectedSha !== null &&
      resource.expectedSha !== owner.candidateSha
    )
      fail('COORDINATION_CLEANUP_RESOURCE_NOT_OWNER_BOUND', resource.path)
    ownerKinds.add(resource.kind)
    const identity = `${resource.kind}:${resource.path}`
    if (resources.has(identity)) fail('COORDINATION_CLEANUP_RESOURCE_AMBIGUOUS', identity)
    resources.add(identity)
  }
  if (KINDS.some((kind) => !ownerKinds.has(kind)))
    fail('COORDINATION_CLEANUP_RESOURCE_SET_INCOMPLETE', value.coordinationOwnerTaskId)
  const actual = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorizationFingerprint'
  )
  if (!DIGEST.test(value.authorizationFingerprint) || value.authorizationFingerprint !== actual)
    fail('COORDINATION_CLEANUP_FINGERPRINT_MISMATCH', actual)
  return value
}

/** Requires cleanup planning and verification to use the exact current protected authorization. */
export function requireTrustedCoordinationCleanupAuthorization(
  value: CoordinationCleanupAuthorization
): void {
  if (!trustedCleanupAuthorizations.has(value))
    fail('COORDINATION_CLEANUP_TRUSTED_AUTHORIZATION_REQUIRED', value.coordinationKey)
}

/** Deep-freezes a protected cleanup record before assigning its in-process trust mark. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
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
      'coordinationKey',
      'coordinationOwnerTaskId',
      'ownerTaskId',
      'expectedState',
      'stateVersion',
      'transitionId',
      'confirmationFingerprint',
      'postcondition'
    ],
    'coordinationCleanupCurrentAuthorization'
  )
  validateCleanupReference(current.rootAuthorization, 'current.rootAuthorization')
  if (current.childAuthorization)
    validateCleanupReference(current.childAuthorization, 'current.childAuthorization')
  if (
    current.schemaVersion !== 2 ||
    current.kind !== 'OES_COORDINATION_CLEANUP_CURRENT_AUTHORIZATION' ||
    current.status !== 'ACTIVE' ||
    current.expectedState !== 'COORDINATION_CLEANUP_AUTHORIZED' ||
    current.postcondition !== 'CURRENT_COORDINATION_CLEANUP' ||
    current.ownerTaskId !== trust.ownerTaskId ||
    !['CHILD_SELF_CLEANUP', 'COORDINATION_CLEANUP_VERIFY'].includes(current.purpose) ||
    !KEY.test(current.coordinationKey) ||
    !TASK.test(current.coordinationOwnerTaskId) ||
    !TASK.test(current.ownerTaskId) ||
    !current.transitionId ||
    !DIGEST.test(current.confirmationFingerprint) ||
    !Number.isSafeInteger(current.stateVersion) ||
    current.stateVersion < 1 ||
    objectFingerprint(current as unknown as Record<string, unknown>, 'recordFingerprint') !==
      current.recordFingerprint
  )
    fail('COORDINATION_CLEANUP_CURRENT_INVALID', path)
  const root = deepFreeze(validateCoordinationCleanupAuthorization(
    trustedRecord(
      current.rootAuthorization,
      trust.authorizationRoot,
      'authorizationFingerprint'
    ) as unknown as CoordinationCleanupAuthorization
  ))
  validateLoadedOwnerResources(root, trust.authorizationRoot)
  trustedCleanupAuthorizations.add(root)
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
  path: string,
  trust: RemoteTrustRoots
): CoordinationCleanupAuthorization {
  const { current, root } = loadCurrent(trust)
  if (
    path !== current.rootAuthorization.path ||
    current.purpose !== 'COORDINATION_CLEANUP_VERIFY' ||
    current.childAuthorization !== null ||
    current.ownerTaskId !== root.coordinationOwnerTaskId
  )
    fail('COORDINATION_CLEANUP_CURRENT_PURPOSE_MISMATCH', current.ownerTaskId)
  return root
}

/** Loads one child authorization narrowed to the exact DO resource set. */
export function loadTrustedCoordinationChildCleanupAuthorization(
  rootPath: string,
  childPath: string,
  trust: RemoteTrustRoots
): { root: CoordinationCleanupAuthorization; child: CoordinationChildCleanupAuthorization } {
  const { current, root } = loadCurrent(trust)
  if (
    current.purpose !== 'CHILD_SELF_CLEANUP' ||
    !current.childAuthorization ||
    rootPath !== current.rootAuthorization.path ||
    childPath !== current.childAuthorization.path
  )
    fail('COORDINATION_CLEANUP_CURRENT_PURPOSE_MISMATCH', current.ownerTaskId)
  const child = trustedRecord(
    current.childAuthorization,
    trust.authorizationRoot,
    'authorizationFingerprint'
  ) as unknown as CoordinationChildCleanupAuthorization
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
      'coordinationKey',
      'coordinationOwnerTaskId',
      'ownerTaskId',
      'transitionId',
      'confirmationFingerprint',
      'ownerResourceBinding',
      'resources',
      'postcondition'
    ],
    'coordinationChildCleanupAuthorization'
  )
  validateCleanupReference(child.rootAuthorization, 'child.rootAuthorization')
  const delivery = root.terminalDeliveries.find((item) => item.ownerTaskId === child.ownerTaskId)
  if (
    !delivery ||
    child.schemaVersion !== 2 ||
    child.kind !== 'OES_COORDINATION_CHILD_CLEANUP_AUTHORIZATION' ||
    child.status !== 'ISSUED' ||
    child.postcondition !== 'CHILD_SELF_CLEANUP' ||
    child.expectedState !== root.expectedState ||
    child.ownerTaskId !== trust.ownerTaskId ||
    canonicalJson(child.rootAuthorization) !== canonicalJson(current.rootAuthorization) ||
    child.coordinationKey !== root.coordinationKey ||
    child.coordinationOwnerTaskId !== root.coordinationOwnerTaskId ||
    child.transitionId !== root.transitionId ||
    child.stateVersion !== root.stateVersion ||
    child.confirmationFingerprint !== root.confirmationFingerprint ||
    canonicalJson(child.ownerResourceBinding) !== canonicalJson(delivery.ownerResourceBinding) ||
    canonicalJson(child.resources) !== canonicalJson(delivery.resources)
  )
    fail('COORDINATION_CHILD_CLEANUP_BINDING_MISMATCH', child.ownerTaskId)
  return { root, child }
}
