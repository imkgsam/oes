import { readFileSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { canonicalJson, objectFingerprint, sha256 } from './canonical.ts'
import { fail } from './errors.ts'
import type { TrustedAuthorizationReference } from './types.ts'

export type DeliveryExecutionMode = 'REPOSITORY' | 'HOST_LOCAL'
export type DeliveryEvidenceStatus =
  | 'PENDING'
  | 'PASSED'
  | 'FAILED'
  | 'INVALIDATED'
  | 'NOT_APPLICABLE'

export interface DeliveryPackageDependency {
  deliveryKey: string
  acceptedCandidateSha: string | null
  acceptedOperationFingerprint: string | null
}

export interface DeliveryActivation {
  confirmationFingerprint: string
  objective: string
  scope: string[]
  nonGoals: string[]
  acceptance: string[]
  designReferences: TrustedAuthorizationReference[]
  protectedScope: string[]
  dependencies: DeliveryPackageDependency[]
  writeSet: string[]
  risk: { level: 'LOW' | 'MEDIUM' | 'HIGH'; reasons: string[] }
  rollback: string[]
}

export interface DeliveryEvidence {
  status: DeliveryEvidenceStatus
  basisFingerprint: string | null
  evidence: TrustedAuthorizationReference | null
}

export interface RepositoryDeliveryState {
  baseSha: string
  candidateSha: string | null
  branch: string
  worktree: string
  pullRequestNumber: number | null
  mergeQueueEntryId: string | null
  mergeSha: string | null
}

export interface HostLocalDeliveryState {
  cohesiveOperation: string
  operationFingerprint: string
  repositoryModified: false
  resourceKinds: string[]
}

export interface DeliveryExecution {
  slices: { sliceId: string; status: 'PENDING' | 'COMPLETE' }[]
  repository: RepositoryDeliveryState | null
  hostLocal: HostLocalDeliveryState | null
  selfTest: DeliveryEvidence
  rv: DeliveryEvidence
  ci: DeliveryEvidence
  postCheck: DeliveryEvidence
  remainingRisk: string[]
  cleanup: 'PENDING' | 'VERIFIED'
}

export interface DeliveryPackage {
  schemaVersion: 2
  kind: 'OES_DELIVERY_PACKAGE'
  packageFingerprint: string
  packageVersion: number
  evidenceGeneration: number
  invalidatedEvidence: string[]
  deliveryKey: string
  ownerTaskId: string
  executionMode: DeliveryExecutionMode
  artifactRoot: string
  packagePath: string
  activationFingerprint: string
  evidenceBasisFingerprint: string
  activation: DeliveryActivation
  execution: DeliveryExecution
}

export interface DeliveryPackageReference {
  deliveryKey: string
  ownerTaskId: string
  packagePath: string
  packageSha256: string
  packageFingerprint: string
  acceptedCandidateSha: string | null
  acceptedOperationFingerprint: string | null
}

export interface AggregateRepositoryState {
  baseSha: string
  aggregateCandidateSha: string | null
  aggregateBranch: string
  pullRequestNumber: number | null
  mergeQueueEntryId: string | null
  mergeSha: string | null
}

export interface AggregateHostLocalState {
  operationSetFingerprint: string
  repositoryModified: false
  realParallelism: boolean
  crossOperationIntegration: boolean
}

export interface AggregateExecution {
  repository: AggregateRepositoryState | null
  hostLocal: AggregateHostLocalState | null
  aggregateRv: DeliveryEvidence
  aggregateCi: DeliveryEvidence
  postCheck: DeliveryEvidence
  remainingRisk: string[]
  cleanup: 'PENDING' | 'VERIFIED'
}

export interface AggregateDeliveryPackage {
  schemaVersion: 2
  kind: 'OES_AGGREGATE_DELIVERY_PACKAGE'
  packageFingerprint: string
  packageVersion: number
  evidenceGeneration: number
  invalidatedEvidence: string[]
  coordinationKey: string
  ownerTaskId: string
  executionMode: DeliveryExecutionMode
  artifactRoot: string
  packagePath: string
  confirmationFingerprint: string
  deliveryPackages: DeliveryPackageReference[]
  dependencyOrder: string[]
  integrationContract: string[]
  aggregateAcceptance: string[]
  evidenceBasisFingerprint: string
  execution: AggregateExecution
}

export interface AggregateRvInput {
  schemaVersion: 2
  kind: 'OES_AGGREGATE_RV_INPUT'
  inputFingerprint: string
  aggregatePackage: TrustedAuthorizationReference
  executionMode: DeliveryExecutionMode
  aggregateCandidateSha: string | null
  aggregateOperationSetFingerprint: string | null
}

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SHA = /^[0-9a-f]{40}$/
const DIGEST = /^[0-9a-f]{64}$/
const TASK = /^(?:\/[A-Za-z0-9][A-Za-z0-9_-]*){2,}$/
const REPOSITORY_BRANCH = /^codex\/delivery\/[a-z0-9]+(?:-[a-z0-9]+)*$/
const AGGREGATE_BRANCH = /^codex\/coordination\/[a-z0-9]+(?:-[a-z0-9]+)*$/
const EVIDENCE_NAMES = ['selfTest', 'rv', 'ci', 'postCheck'] as const
const AGGREGATE_EVIDENCE_NAMES = ['aggregateRv', 'aggregateCi', 'postCheck'] as const
const trustedAggregatePackages = new WeakMap<object, string>()

/** Seals one DO Delivery Package and invalidates evidence affected by changed control inputs. */
export function createDeliveryPackage(
  draft: Omit<
    DeliveryPackage,
    | 'schemaVersion'
    | 'kind'
    | 'packageFingerprint'
    | 'activationFingerprint'
    | 'evidenceBasisFingerprint'
    | 'invalidatedEvidence'
  >,
  previous: DeliveryPackage | null = null
): DeliveryPackage {
  if (previous) validateDeliveryPackage(previous)
  if (
    (previous === null && (draft.packageVersion !== 1 || draft.evidenceGeneration !== 1)) ||
    (previous !== null &&
      (draft.packageVersion !== previous.packageVersion + 1 ||
        draft.evidenceGeneration !== previous.evidenceGeneration))
  )
    fail('DELIVERY_PACKAGE_VERSION_TRANSITION_INVALID', draft.deliveryKey)
  if (
    previous &&
    (draft.deliveryKey !== previous.deliveryKey ||
      draft.ownerTaskId !== previous.ownerTaskId ||
      draft.artifactRoot !== previous.artifactRoot ||
      draft.packagePath !== previous.packagePath)
  )
    fail('DELIVERY_PACKAGE_IDENTITY_IMMUTABLE', draft.deliveryKey)
  const activationFingerprint = objectFingerprint(
    draft.activation as unknown as Record<string, unknown>,
    '__none__'
  )
  const evidenceBasisFingerprint = deliveryEvidenceBasis(
    draft.executionMode,
    activationFingerprint,
    draft.execution
  )
  const invalidation = previous
    ? deliveryInvalidationReasons(previous, draft, activationFingerprint, evidenceBasisFingerprint)
    : []
  if (
    previous &&
    previous.activationFingerprint !== activationFingerprint &&
    previous.activation.confirmationFingerprint === draft.activation.confirmationFingerprint
  )
    fail('DELIVERY_PACKAGE_ACTIVATION_RECONFIRMATION_REQUIRED', draft.deliveryKey)
  const execution = clone(draft.execution)
  if (invalidation.length) invalidateEvidence(execution, EVIDENCE_NAMES, evidenceBasisFingerprint)
  else normalizeEvidenceBasis(execution, EVIDENCE_NAMES, evidenceBasisFingerprint)
  const raw: Omit<DeliveryPackage, 'packageFingerprint'> = {
    schemaVersion: 2,
    kind: 'OES_DELIVERY_PACKAGE',
    packageVersion: draft.packageVersion,
    evidenceGeneration: draft.evidenceGeneration + (invalidation.length ? 1 : 0),
    invalidatedEvidence: invalidation,
    deliveryKey: draft.deliveryKey,
    ownerTaskId: draft.ownerTaskId,
    executionMode: draft.executionMode,
    artifactRoot: draft.artifactRoot,
    packagePath: draft.packagePath,
    activationFingerprint,
    evidenceBasisFingerprint,
    activation: clone(draft.activation),
    execution
  }
  return validateDeliveryPackage({
    ...raw,
    packageFingerprint: objectFingerprint(raw as unknown as Record<string, unknown>, '__none__')
  })
}

/** Validates the closed DP contract for repository and host-local execution modes. */
export function validateDeliveryPackage(value: DeliveryPackage): DeliveryPackage {
  requireExactKeys(
    value,
    [
      'schemaVersion',
      'kind',
      'packageFingerprint',
      'packageVersion',
      'evidenceGeneration',
      'invalidatedEvidence',
      'deliveryKey',
      'ownerTaskId',
      'executionMode',
      'artifactRoot',
      'packagePath',
      'activationFingerprint',
      'evidenceBasisFingerprint',
      'activation',
      'execution'
    ],
    'deliveryPackage'
  )
  if (
    value.schemaVersion !== 2 ||
    value.kind !== 'OES_DELIVERY_PACKAGE' ||
    !Number.isSafeInteger(value.packageVersion) ||
    value.packageVersion < 1 ||
    !Number.isSafeInteger(value.evidenceGeneration) ||
    value.evidenceGeneration < 1 ||
    !Array.isArray(value.invalidatedEvidence) ||
    value.invalidatedEvidence.some((item) => typeof item !== 'string' || item.length === 0) ||
    new Set(value.invalidatedEvidence).size !== value.invalidatedEvidence.length ||
    !KEY.test(value.deliveryKey) ||
    !TASK.test(value.ownerTaskId) ||
    !['REPOSITORY', 'HOST_LOCAL'].includes(value.executionMode)
  )
    fail('DELIVERY_PACKAGE_ENVELOPE_INVALID', value.deliveryKey)
  validatePackagePath(value.artifactRoot, value.packagePath, 'delivery-package.json')
  validateActivation(value.activation, value.executionMode)
  const activationFingerprint = objectFingerprint(
    value.activation as unknown as Record<string, unknown>,
    '__none__'
  )
  if (value.activationFingerprint !== activationFingerprint)
    fail('DELIVERY_PACKAGE_ACTIVATION_FINGERPRINT_MISMATCH', value.deliveryKey)
  validateDeliveryExecution(value.execution, value.executionMode, value.deliveryKey)
  const basis = deliveryEvidenceBasis(value.executionMode, activationFingerprint, value.execution)
  if (value.evidenceBasisFingerprint !== basis)
    fail('DELIVERY_PACKAGE_EVIDENCE_BASIS_MISMATCH', value.deliveryKey)
  validateEvidenceBindings(value.execution, EVIDENCE_NAMES, basis)
  validateFingerprint(value.packageFingerprint, 'deliveryPackage.packageFingerprint')
  if (
    value.packageFingerprint !==
    objectFingerprint(value as unknown as Record<string, unknown>, 'packageFingerprint')
  )
    fail('DELIVERY_PACKAGE_FINGERPRINT_MISMATCH', value.deliveryKey)
  return value
}

/** Seals one CO Aggregate Delivery Package and invalidates aggregate evidence on binding drift. */
export function createAggregateDeliveryPackage(
  draft: Omit<
    AggregateDeliveryPackage,
    | 'schemaVersion'
    | 'kind'
    | 'packageFingerprint'
    | 'evidenceBasisFingerprint'
    | 'invalidatedEvidence'
  >,
  previous: AggregateDeliveryPackage | null = null
): AggregateDeliveryPackage {
  if (previous) validateAggregateDeliveryPackage(previous)
  if (
    (previous === null && (draft.packageVersion !== 1 || draft.evidenceGeneration !== 1)) ||
    (previous !== null &&
      (draft.packageVersion !== previous.packageVersion + 1 ||
        draft.evidenceGeneration !== previous.evidenceGeneration))
  )
    fail('AGGREGATE_PACKAGE_VERSION_TRANSITION_INVALID', draft.coordinationKey)
  if (
    previous &&
    (draft.coordinationKey !== previous.coordinationKey ||
      draft.ownerTaskId !== previous.ownerTaskId ||
      draft.artifactRoot !== previous.artifactRoot ||
      draft.packagePath !== previous.packagePath)
  )
    fail('AGGREGATE_PACKAGE_IDENTITY_IMMUTABLE', draft.coordinationKey)
  const evidenceBasisFingerprint = aggregateEvidenceBasis(draft)
  const invalidation = previous
    ? aggregateInvalidationReasons(previous, draft, evidenceBasisFingerprint)
    : []
  const controlChanged =
    previous !== null &&
    canonicalJson({
      deliveryPackages: previous.deliveryPackages,
      dependencyOrder: previous.dependencyOrder,
      integrationContract: previous.integrationContract,
      aggregateAcceptance: previous.aggregateAcceptance
    }) !==
      canonicalJson({
        deliveryPackages: draft.deliveryPackages,
        dependencyOrder: draft.dependencyOrder,
        integrationContract: draft.integrationContract,
        aggregateAcceptance: draft.aggregateAcceptance
      })
  if (
    controlChanged &&
    previous?.confirmationFingerprint === draft.confirmationFingerprint
  )
    fail('AGGREGATE_PACKAGE_RECONFIRMATION_REQUIRED', draft.coordinationKey)
  const execution = clone(draft.execution)
  if (invalidation.length)
    invalidateEvidence(execution, AGGREGATE_EVIDENCE_NAMES, evidenceBasisFingerprint)
  else normalizeEvidenceBasis(execution, AGGREGATE_EVIDENCE_NAMES, evidenceBasisFingerprint)
  const raw: Omit<AggregateDeliveryPackage, 'packageFingerprint'> = {
    schemaVersion: 2,
    kind: 'OES_AGGREGATE_DELIVERY_PACKAGE',
    packageVersion: draft.packageVersion,
    evidenceGeneration: draft.evidenceGeneration + (invalidation.length ? 1 : 0),
    invalidatedEvidence: invalidation,
    coordinationKey: draft.coordinationKey,
    ownerTaskId: draft.ownerTaskId,
    executionMode: draft.executionMode,
    artifactRoot: draft.artifactRoot,
    packagePath: draft.packagePath,
    confirmationFingerprint: draft.confirmationFingerprint,
    deliveryPackages: clone(draft.deliveryPackages),
    dependencyOrder: [...draft.dependencyOrder],
    integrationContract: [...draft.integrationContract],
    aggregateAcceptance: [...draft.aggregateAcceptance],
    evidenceBasisFingerprint,
    execution
  }
  return validateAggregateDeliveryPackage({
    ...raw,
    packageFingerprint: objectFingerprint(raw as unknown as Record<string, unknown>, '__none__')
  })
}

/** Validates the closed ADP contract and its complete ordered DP set. */
export function validateAggregateDeliveryPackage(
  value: AggregateDeliveryPackage
): AggregateDeliveryPackage {
  requireExactKeys(
    value,
    [
      'schemaVersion',
      'kind',
      'packageFingerprint',
      'packageVersion',
      'evidenceGeneration',
      'invalidatedEvidence',
      'coordinationKey',
      'ownerTaskId',
      'executionMode',
      'artifactRoot',
      'packagePath',
      'confirmationFingerprint',
      'deliveryPackages',
      'dependencyOrder',
      'integrationContract',
      'aggregateAcceptance',
      'evidenceBasisFingerprint',
      'execution'
    ],
    'aggregateDeliveryPackage'
  )
  if (
    value.schemaVersion !== 2 ||
    value.kind !== 'OES_AGGREGATE_DELIVERY_PACKAGE' ||
    !Number.isSafeInteger(value.packageVersion) ||
    value.packageVersion < 1 ||
    !Number.isSafeInteger(value.evidenceGeneration) ||
    value.evidenceGeneration < 1 ||
    !Array.isArray(value.invalidatedEvidence) ||
    value.invalidatedEvidence.some((item) => typeof item !== 'string' || item.length === 0) ||
    new Set(value.invalidatedEvidence).size !== value.invalidatedEvidence.length ||
    !KEY.test(value.coordinationKey) ||
    !TASK.test(value.ownerTaskId) ||
    !DIGEST.test(value.confirmationFingerprint) ||
    !['REPOSITORY', 'HOST_LOCAL'].includes(value.executionMode) ||
    !Array.isArray(value.deliveryPackages) ||
    value.deliveryPackages.length < 2 ||
    !nonEmptyStrings(value.integrationContract) ||
    !nonEmptyStrings(value.aggregateAcceptance)
  )
    fail('AGGREGATE_PACKAGE_ENVELOPE_INVALID', value.coordinationKey)
  validatePackagePath(value.artifactRoot, value.packagePath, 'aggregate-delivery-package.json')
  const keys = new Set<string>()
  const owners = new Set<string>()
  for (const item of value.deliveryPackages) {
    validatePackageReference(item, value.executionMode)
    if (keys.has(item.deliveryKey)) fail('AGGREGATE_PACKAGE_DUPLICATE_DP', item.deliveryKey)
    if (
      owners.has(item.ownerTaskId) ||
      !item.ownerTaskId.startsWith(`${value.ownerTaskId}/`)
    )
      fail('AGGREGATE_PACKAGE_DP_OWNER_INVALID', item.deliveryKey)
    keys.add(item.deliveryKey)
    owners.add(item.ownerTaskId)
  }
  if (
    value.dependencyOrder.length !== keys.size ||
    new Set(value.dependencyOrder).size !== keys.size ||
    value.dependencyOrder.some((key) => !keys.has(key))
  )
    fail('AGGREGATE_PACKAGE_DEPENDENCY_ORDER_INVALID', value.coordinationKey)
  validateAggregateExecution(value.execution, value.executionMode, value.coordinationKey)
  const basis = aggregateEvidenceBasis(value)
  if (value.evidenceBasisFingerprint !== basis)
    fail('AGGREGATE_PACKAGE_EVIDENCE_BASIS_MISMATCH', value.coordinationKey)
  validateEvidenceBindings(value.execution, AGGREGATE_EVIDENCE_NAMES, basis)
  validateFingerprint(value.packageFingerprint, 'aggregatePackage.packageFingerprint')
  if (
    value.packageFingerprint !==
    objectFingerprint(value as unknown as Record<string, unknown>, 'packageFingerprint')
  )
    fail('AGGREGATE_PACKAGE_FINGERPRINT_MISMATCH', value.coordinationKey)
  return value
}

/** Reopens an exact DP reference and checks its owner, mode, and accepted candidate identity. */
export function loadDeliveryPackageReference(
  reference: DeliveryPackageReference,
  executionMode: DeliveryExecutionMode
): DeliveryPackage {
  validatePackageReference(reference, executionMode)
  const bytes = readFileSync(reference.packagePath)
  if (sha256(bytes) !== reference.packageSha256)
    fail('DELIVERY_PACKAGE_REFERENCE_SHA_MISMATCH', reference.deliveryKey)
  const value = validateDeliveryPackage(JSON.parse(bytes.toString('utf8')) as DeliveryPackage)
  if (
    value.deliveryKey !== reference.deliveryKey ||
    value.ownerTaskId !== reference.ownerTaskId ||
    value.executionMode !== executionMode ||
    value.packagePath !== reference.packagePath ||
    value.packageFingerprint !== reference.packageFingerprint ||
    (executionMode === 'REPOSITORY'
      ? value.execution.repository?.candidateSha !== reference.acceptedCandidateSha
      : value.execution.hostLocal?.operationFingerprint !== reference.acceptedOperationFingerprint) ||
    value.execution.selfTest.status !== 'PASSED' ||
    value.execution.rv.status !== 'PASSED'
  )
    fail('DELIVERY_PACKAGE_REFERENCE_BINDING_MISMATCH', reference.deliveryKey)
  reopenCompletedEvidence(value.execution, EVIDENCE_NAMES, value.deliveryKey)
  return deepFreeze(value)
}

/** Reopens an ADP and every exact accepted DP before it may drive Aggregate RV. */
export function loadAggregateDeliveryPackageReference(
  reference: TrustedAuthorizationReference
): AggregateDeliveryPackage {
  validateReference(reference, 'aggregateDeliveryPackageReference')
  const bytes = readFileSync(reference.path)
  if (sha256(bytes) !== reference.sha256)
    fail('AGGREGATE_PACKAGE_REFERENCE_SHA_MISMATCH', reference.path)
  const value = validateAggregateDeliveryPackage(
    JSON.parse(bytes.toString('utf8')) as AggregateDeliveryPackage
  )
  if (value.packagePath !== reference.path || value.packageFingerprint !== reference.fingerprint)
    fail('AGGREGATE_PACKAGE_REFERENCE_BINDING_MISMATCH', value.coordinationKey)
  const packages = new Map(
    value.deliveryPackages.map((item) => [
      item.deliveryKey,
      loadDeliveryPackageReference(item, value.executionMode)
    ])
  )
  validateLoadedDependencyOrder(value, packages)
  reopenCompletedEvidence(value.execution, AGGREGATE_EVIDENCE_NAMES, value.coordinationKey)
  const frozen = deepFreeze(value)
  trustedAggregatePackages.set(frozen, canonicalJson(reference))
  return frozen
}

/** Creates the exact ADP-plus-candidate input that Aggregate RV must review. */
export function createAggregateRvInput(
  aggregatePackage: TrustedAuthorizationReference,
  valueInput: AggregateDeliveryPackage
): AggregateRvInput {
  const value = validateAggregateDeliveryPackage(valueInput)
  if (trustedAggregatePackages.get(valueInput) !== canonicalJson(aggregatePackage))
    fail('AGGREGATE_RV_TRUSTED_PACKAGE_REQUIRED', value.coordinationKey)
  validateReference(aggregatePackage, 'aggregateRv.aggregatePackage')
  if (
    aggregatePackage.path !== value.packagePath ||
    aggregatePackage.fingerprint !== value.packageFingerprint
  )
    fail('AGGREGATE_RV_PACKAGE_REFERENCE_MISMATCH', value.coordinationKey)
  const raw: Omit<AggregateRvInput, 'inputFingerprint'> = {
    schemaVersion: 2,
    kind: 'OES_AGGREGATE_RV_INPUT',
    aggregatePackage: clone(aggregatePackage),
    executionMode: value.executionMode,
    aggregateCandidateSha: value.execution.repository?.aggregateCandidateSha ?? null,
    aggregateOperationSetFingerprint: value.execution.hostLocal?.operationSetFingerprint ?? null
  }
  if (value.executionMode === 'REPOSITORY' && raw.aggregateCandidateSha === null)
    fail('AGGREGATE_RV_CANDIDATE_REQUIRED', value.coordinationKey)
  return {
    ...raw,
    inputFingerprint: objectFingerprint(raw as unknown as Record<string, unknown>, '__none__')
  }
}

/** Revalidates an Aggregate RV input against the exact current ADP and candidate identity. */
export function validateAggregateRvInput(
  input: AggregateRvInput,
  aggregatePackage: TrustedAuthorizationReference,
  valueInput: AggregateDeliveryPackage
): AggregateRvInput {
  const expected = createAggregateRvInput(aggregatePackage, valueInput)
  if (canonicalJson(input) !== canonicalJson(expected))
    fail('AGGREGATE_RV_EXACT_INPUT_MISMATCH', valueInput.coordinationKey)
  return input
}

/** Renders only the PR-facing summary derived from a DP or ADP, never the active package state. */
export function renderPackagePrSummary(value: DeliveryPackage | AggregateDeliveryPackage): string {
  if (value.kind === 'OES_DELIVERY_PACKAGE') {
    validateDeliveryPackage(value)
    return [
      '## Delivery Package summary',
      `- Delivery: \`${value.deliveryKey}\``,
      `- Objective: ${value.activation.objective}`,
      `- Acceptance: ${value.activation.acceptance.join('; ')}`,
      `- Candidate: \`${value.execution.repository?.candidateSha ?? 'host-local'}\``,
      `- DP fingerprint: \`${value.packageFingerprint}\``
    ].join('\n')
  }
  validateAggregateDeliveryPackage(value)
  return [
    '## Aggregate Delivery Package summary',
    `- Coordination: \`${value.coordinationKey}\``,
    `- Delivery Packages: ${value.dependencyOrder.map((key) => `\`${key}\``).join(', ')}`,
    `- Aggregate acceptance: ${value.aggregateAcceptance.join('; ')}`,
    `- Aggregate candidate: \`${value.execution.repository?.aggregateCandidateSha ?? 'host-local'}\``,
    `- ADP fingerprint: \`${value.packageFingerprint}\``
  ].join('\n')
}

/** Proves package disposal is external to the repository and therefore has an empty repository diff. */
export function planPackageCleanup(
  value: DeliveryPackage | AggregateDeliveryPackage,
  repositoryRoot: string | null
): { packagePath: string; repositoryDiff: []; decision: 'REMOVE_EXTERNAL_PACKAGE' } {
  if (value.kind === 'OES_DELIVERY_PACKAGE') validateDeliveryPackage(value)
  else validateAggregateDeliveryPackage(value)
  if (repositoryRoot !== null) {
    requireAbsolute(repositoryRoot, 'repositoryRoot')
    if (isWithin(repositoryRoot, value.packagePath))
      fail('PACKAGE_CLEANUP_REPOSITORY_PATH_FORBIDDEN', value.packagePath)
  }
  return { packagePath: value.packagePath, repositoryDiff: [], decision: 'REMOVE_EXTERNAL_PACKAGE' }
}

/** Validates activation-fixed control fields shared by repository and host-local deliveries. */
function validateActivation(value: DeliveryActivation, mode: DeliveryExecutionMode): void {
  requireExactKeys(
    value,
    [
      'confirmationFingerprint',
      'objective',
      'scope',
      'nonGoals',
      'acceptance',
      'designReferences',
      'protectedScope',
      'dependencies',
      'writeSet',
      'risk',
      'rollback'
    ],
    'deliveryActivation'
  )
  validateFingerprint(value.confirmationFingerprint, 'activation.confirmationFingerprint')
  if (
    !value.objective ||
    !nonEmptyStrings(value.scope) ||
    !nonEmptyStrings(value.acceptance) ||
    !nonEmptyStrings(value.protectedScope) ||
    !nonEmptyStrings(value.rollback) ||
    !Array.isArray(value.nonGoals) ||
    !Array.isArray(value.designReferences) ||
    !Array.isArray(value.dependencies) ||
    !Array.isArray(value.writeSet)
  )
    fail('DELIVERY_PACKAGE_ACTIVATION_INVALID', value.objective)
  if (mode === 'REPOSITORY' && value.writeSet.length === 0)
    fail('DELIVERY_PACKAGE_REPOSITORY_WRITE_SET_REQUIRED', value.objective)
  if (mode === 'HOST_LOCAL' && value.writeSet.length !== 0)
    fail('HOST_LOCAL_PACKAGE_REPOSITORY_WRITE_FORBIDDEN', value.objective)
  value.designReferences.forEach((item) => validateReference(item, 'activation.designReference'))
  const dependencyKeys = new Set<string>()
  for (const dependency of value.dependencies) {
    requireExactKeys(
      dependency,
      ['deliveryKey', 'acceptedCandidateSha', 'acceptedOperationFingerprint'],
      'activation.dependency'
    )
    if (!KEY.test(dependency.deliveryKey) || dependencyKeys.has(dependency.deliveryKey))
      fail('DELIVERY_PACKAGE_DEPENDENCY_INVALID', dependency.deliveryKey)
    if (mode === 'REPOSITORY') {
      if (!dependency.acceptedCandidateSha || !SHA.test(dependency.acceptedCandidateSha))
        fail('DELIVERY_PACKAGE_DEPENDENCY_CANDIDATE_REQUIRED', dependency.deliveryKey)
      if (dependency.acceptedOperationFingerprint !== null)
        fail('DELIVERY_PACKAGE_DEPENDENCY_MODE_MISMATCH', dependency.deliveryKey)
    } else {
      if (
        dependency.acceptedCandidateSha !== null ||
        !dependency.acceptedOperationFingerprint ||
        !DIGEST.test(dependency.acceptedOperationFingerprint)
      )
        fail('DELIVERY_PACKAGE_DEPENDENCY_OPERATION_REQUIRED', dependency.deliveryKey)
    }
    dependencyKeys.add(dependency.deliveryKey)
  }
  requireExactKeys(value.risk, ['level', 'reasons'], 'activation.risk')
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(value.risk.level) || !Array.isArray(value.risk.reasons))
    fail('DELIVERY_PACKAGE_RISK_INVALID', value.objective)
}

/** Enforces mutually exclusive repository and host-local execution state. */
function validateDeliveryExecution(
  value: DeliveryExecution,
  mode: DeliveryExecutionMode,
  key: string
): void {
  requireExactKeys(
    value,
    [
      'slices',
      'repository',
      'hostLocal',
      'selfTest',
      'rv',
      'ci',
      'postCheck',
      'remainingRisk',
      'cleanup'
    ],
    'deliveryExecution'
  )
  if (!Array.isArray(value.slices) || !Array.isArray(value.remainingRisk))
    fail('DELIVERY_PACKAGE_EXECUTION_INVALID', key)
  const slices = new Set<string>()
  for (const slice of value.slices) {
    requireExactKeys(slice, ['sliceId', 'status'], 'deliveryExecution.slice')
    if (!slice.sliceId || slices.has(slice.sliceId) || !['PENDING', 'COMPLETE'].includes(slice.status))
      fail('DELIVERY_PACKAGE_SLICE_INVALID', slice.sliceId)
    slices.add(slice.sliceId)
  }
  if (!['PENDING', 'VERIFIED'].includes(value.cleanup))
    fail('DELIVERY_PACKAGE_CLEANUP_STATE_INVALID', key)
  if (mode === 'REPOSITORY') {
    if (!value.repository || value.hostLocal !== null)
      fail('DELIVERY_PACKAGE_REPOSITORY_STATE_REQUIRED', key)
    validateRepositoryState(value.repository, key)
    if (value.ci.status === 'NOT_APPLICABLE')
      fail('DELIVERY_PACKAGE_REPOSITORY_CI_REQUIRED', key)
  } else {
    if (!value.hostLocal || value.repository !== null)
      fail('HOST_LOCAL_PACKAGE_STATE_REQUIRED', key)
    validateHostLocalState(value.hostLocal, key)
    if (value.ci.status !== 'NOT_APPLICABLE' || value.ci.evidence !== null)
      fail('HOST_LOCAL_PACKAGE_REMOTE_CI_FORBIDDEN', key)
  }
}

/** Validates repository-only DP execution identity. */
function validateRepositoryState(value: RepositoryDeliveryState, key: string): void {
  requireExactKeys(
    value,
    [
      'baseSha',
      'candidateSha',
      'branch',
      'worktree',
      'pullRequestNumber',
      'mergeQueueEntryId',
      'mergeSha'
    ],
    'deliveryExecution.repository'
  )
  if (
    !SHA.test(value.baseSha) ||
    (value.candidateSha !== null && !SHA.test(value.candidateSha)) ||
    !REPOSITORY_BRANCH.test(value.branch) ||
    value.branch !== `codex/delivery/${key}` ||
    !isAbsolute(value.worktree) ||
    (value.pullRequestNumber !== null &&
      (!Number.isSafeInteger(value.pullRequestNumber) || value.pullRequestNumber < 1)) ||
    (value.mergeQueueEntryId !== null && !value.mergeQueueEntryId) ||
    (value.mergeSha !== null && !SHA.test(value.mergeSha))
  )
    fail('DELIVERY_PACKAGE_REPOSITORY_STATE_INVALID', key)
}

/** Validates repository-free host-local DP execution identity. */
function validateHostLocalState(value: HostLocalDeliveryState, key: string): void {
  requireExactKeys(
    value,
    ['cohesiveOperation', 'operationFingerprint', 'repositoryModified', 'resourceKinds'],
    'deliveryExecution.hostLocal'
  )
  if (
    !value.cohesiveOperation ||
    !DIGEST.test(value.operationFingerprint) ||
    value.repositoryModified !== false ||
    !nonEmptyStrings(value.resourceKinds)
  )
    fail('HOST_LOCAL_PACKAGE_OPERATION_INVALID', key)
}

/** Validates mutually exclusive repository and host-local ADP aggregate state. */
function validateAggregateExecution(
  value: AggregateExecution,
  mode: DeliveryExecutionMode,
  key: string
): void {
  requireExactKeys(
    value,
    [
      'repository',
      'hostLocal',
      'aggregateRv',
      'aggregateCi',
      'postCheck',
      'remainingRisk',
      'cleanup'
    ],
    'aggregateExecution'
  )
  if (!Array.isArray(value.remainingRisk) || !['PENDING', 'VERIFIED'].includes(value.cleanup))
    fail('AGGREGATE_PACKAGE_EXECUTION_INVALID', key)
  if (mode === 'REPOSITORY') {
    if (!value.repository || value.hostLocal !== null)
      fail('AGGREGATE_PACKAGE_REPOSITORY_STATE_REQUIRED', key)
    requireExactKeys(
      value.repository,
      [
        'baseSha',
        'aggregateCandidateSha',
        'aggregateBranch',
        'pullRequestNumber',
        'mergeQueueEntryId',
        'mergeSha'
      ],
      'aggregateExecution.repository'
    )
    if (
      !SHA.test(value.repository.baseSha) ||
      (value.repository.aggregateCandidateSha !== null &&
        !SHA.test(value.repository.aggregateCandidateSha)) ||
      value.repository.aggregateBranch !== `codex/coordination/${key}` ||
      !AGGREGATE_BRANCH.test(value.repository.aggregateBranch) ||
      (value.repository.pullRequestNumber !== null &&
        (!Number.isSafeInteger(value.repository.pullRequestNumber) ||
          value.repository.pullRequestNumber < 1)) ||
      (value.repository.mergeSha !== null && !SHA.test(value.repository.mergeSha))
    )
      fail('AGGREGATE_PACKAGE_REPOSITORY_STATE_INVALID', key)
    if (value.aggregateCi.status === 'NOT_APPLICABLE')
      fail('AGGREGATE_PACKAGE_REPOSITORY_CI_REQUIRED', key)
  } else {
    if (!value.hostLocal || value.repository !== null)
      fail('AGGREGATE_HOST_LOCAL_STATE_REQUIRED', key)
    requireExactKeys(
      value.hostLocal,
      [
        'operationSetFingerprint',
        'repositoryModified',
        'realParallelism',
        'crossOperationIntegration'
      ],
      'aggregateExecution.hostLocal'
    )
    if (
      !DIGEST.test(value.hostLocal.operationSetFingerprint) ||
      value.hostLocal.repositoryModified !== false ||
      (!value.hostLocal.realParallelism && !value.hostLocal.crossOperationIntegration) ||
      value.aggregateCi.status !== 'NOT_APPLICABLE' ||
      value.aggregateCi.evidence !== null
    )
      fail('AGGREGATE_HOST_LOCAL_CONTRACT_INVALID', key)
  }
}

/** Validates one immutable DP reference included by an ADP. */
function validatePackageReference(
  value: DeliveryPackageReference,
  mode: DeliveryExecutionMode
): void {
  requireExactKeys(
    value,
    [
      'deliveryKey',
      'ownerTaskId',
      'packagePath',
      'packageSha256',
      'packageFingerprint',
      'acceptedCandidateSha',
      'acceptedOperationFingerprint'
    ],
    'aggregateDeliveryPackage.deliveryPackage'
  )
  if (
    !KEY.test(value.deliveryKey) ||
    !TASK.test(value.ownerTaskId) ||
    !isAbsolute(value.packagePath) ||
    resolve(value.packagePath) !== value.packagePath ||
    !DIGEST.test(value.packageSha256) ||
    !DIGEST.test(value.packageFingerprint)
  )
    fail('AGGREGATE_PACKAGE_DP_REFERENCE_INVALID', value.deliveryKey)
  if (
    (mode === 'REPOSITORY' &&
      (!value.acceptedCandidateSha ||
        !SHA.test(value.acceptedCandidateSha) ||
        value.acceptedOperationFingerprint !== null)) ||
    (mode === 'HOST_LOCAL' &&
      (value.acceptedCandidateSha !== null ||
        !value.acceptedOperationFingerprint ||
        !DIGEST.test(value.acceptedOperationFingerprint)))
  )
    fail('AGGREGATE_PACKAGE_DP_MODE_MISMATCH', value.deliveryKey)
}

/** Verifies each internal DP dependency is present earlier and bound to the accepted identity. */
function validateLoadedDependencyOrder(
  aggregate: AggregateDeliveryPackage,
  packages: Map<string, DeliveryPackage>
): void {
  const positions = new Map(aggregate.dependencyOrder.map((key, index) => [key, index]))
  const references = new Map(aggregate.deliveryPackages.map((item) => [item.deliveryKey, item]))
  for (const [deliveryKey, value] of packages) {
    const position = positions.get(deliveryKey)
    if (position === undefined) fail('AGGREGATE_PACKAGE_DEPENDENCY_ORDER_INVALID', deliveryKey)
    for (const dependency of value.activation.dependencies) {
      const dependencyPosition = positions.get(dependency.deliveryKey)
      if (dependencyPosition === undefined) continue
      const reference = references.get(dependency.deliveryKey)
      if (
        dependencyPosition >= position ||
        !reference ||
        dependency.acceptedCandidateSha !== reference.acceptedCandidateSha ||
        dependency.acceptedOperationFingerprint !== reference.acceptedOperationFingerprint
      )
        fail(
          'AGGREGATE_PACKAGE_LOADED_DEPENDENCY_MISMATCH',
          `${deliveryKey}:${dependency.deliveryKey}`
        )
    }
  }
}

/** Computes the evidence binding for one DP without including evidence outputs. */
function deliveryEvidenceBasis(
  mode: DeliveryExecutionMode,
  activationFingerprint: string,
  execution: DeliveryExecution
): string {
  return objectFingerprint(
    {
      mode,
      activationFingerprint,
      candidateSha: execution.repository?.candidateSha ?? null,
      operationFingerprint: execution.hostLocal?.operationFingerprint ?? null
    },
    '__none__'
  )
}

/** Computes the evidence binding for one ADP without including evidence outputs. */
function aggregateEvidenceBasis(
  value: Pick<
    AggregateDeliveryPackage,
    | 'executionMode'
    | 'deliveryPackages'
    | 'dependencyOrder'
    | 'integrationContract'
    | 'aggregateAcceptance'
    | 'execution'
  >
): string {
  return objectFingerprint(
    {
      executionMode: value.executionMode,
      deliveryPackages: value.deliveryPackages,
      dependencyOrder: value.dependencyOrder,
      integrationContract: value.integrationContract,
      aggregateAcceptance: value.aggregateAcceptance,
      aggregateCandidateSha: value.execution.repository?.aggregateCandidateSha ?? null,
      aggregateOperationSetFingerprint: value.execution.hostLocal?.operationSetFingerprint ?? null
    },
    '__none__'
  )
}

/** Returns precise DP invalidation reasons for activation or candidate drift. */
function deliveryInvalidationReasons(
  previous: DeliveryPackage,
  next: Pick<DeliveryPackage, 'activation' | 'executionMode' | 'execution'>,
  activationFingerprint: string,
  basis: string
): string[] {
  const reasons: string[] = []
  if (
    canonicalJson(previous.activation.scope) !== canonicalJson(next.activation.scope) ||
    canonicalJson(previous.activation.protectedScope) !== canonicalJson(next.activation.protectedScope)
  )
    reasons.push('SCOPE_CHANGED')
  if (
    canonicalJson(previous.activation.designReferences) !==
    canonicalJson(next.activation.designReferences)
  )
    reasons.push('DESIGN_CHANGED')
  if (
    canonicalJson(previous.activation.dependencies) !== canonicalJson(next.activation.dependencies)
  )
    reasons.push('DEPENDENCY_CHANGED')
  if (
    previous.executionMode !== next.executionMode ||
    previous.execution.repository?.candidateSha !== next.execution.repository?.candidateSha ||
    previous.execution.hostLocal?.operationFingerprint !== next.execution.hostLocal?.operationFingerprint
  )
    reasons.push('CANDIDATE_CHANGED')
  if (
    previous.activationFingerprint !== activationFingerprint &&
    reasons.length === 0
  )
    reasons.push('ACTIVATION_CHANGED')
  if (previous.evidenceBasisFingerprint !== basis && reasons.length === 0)
    reasons.push('EVIDENCE_BASIS_CHANGED')
  return reasons
}

/** Returns precise ADP invalidation reasons for DP, order, integration, or aggregate drift. */
function aggregateInvalidationReasons(
  previous: AggregateDeliveryPackage,
  next: Pick<
    AggregateDeliveryPackage,
    | 'deliveryPackages'
    | 'dependencyOrder'
    | 'integrationContract'
    | 'aggregateAcceptance'
    | 'executionMode'
    | 'execution'
  >,
  basis: string
): string[] {
  const reasons: string[] = []
  if (canonicalJson(previous.deliveryPackages) !== canonicalJson(next.deliveryPackages))
    reasons.push('DELIVERY_PACKAGE_SET_CHANGED')
  if (canonicalJson(previous.dependencyOrder) !== canonicalJson(next.dependencyOrder))
    reasons.push('DEPENDENCY_ORDER_CHANGED')
  if (canonicalJson(previous.integrationContract) !== canonicalJson(next.integrationContract))
    reasons.push('INTEGRATION_CONTRACT_CHANGED')
  if (
    previous.executionMode !== next.executionMode ||
    previous.execution.repository?.aggregateCandidateSha !==
      next.execution.repository?.aggregateCandidateSha ||
    previous.execution.hostLocal?.operationSetFingerprint !==
      next.execution.hostLocal?.operationSetFingerprint
  )
    reasons.push('AGGREGATE_CANDIDATE_CHANGED')
  if (previous.evidenceBasisFingerprint !== basis && reasons.length === 0)
    reasons.push('AGGREGATE_EVIDENCE_BASIS_CHANGED')
  return reasons
}

/** Marks previously applicable evidence invalid and binds its replacement slot to the new basis. */
function invalidateEvidence(
  execution: object,
  names: readonly string[],
  basis: string
): void {
  const record = execution as Record<string, unknown>
  for (const name of names) {
    const evidence = record[name] as DeliveryEvidence
    if (evidence.status === 'NOT_APPLICABLE') continue
    record[name] = { status: 'INVALIDATED', basisFingerprint: basis, evidence: null }
  }
}

/** Fills pending evidence slots with the exact current basis without altering completed evidence. */
function normalizeEvidenceBasis(
  execution: object,
  names: readonly string[],
  basis: string
): void {
  const record = execution as Record<string, unknown>
  for (const name of names) {
    const evidence = record[name] as DeliveryEvidence
    if (evidence.status !== 'NOT_APPLICABLE' && evidence.basisFingerprint === null)
      evidence.basisFingerprint = basis
  }
}

/** Validates evidence state, reference shape, and exact current basis. */
function validateEvidenceBindings(
  execution: object,
  names: readonly string[],
  basis: string
): void {
  const record = execution as Record<string, unknown>
  for (const name of names) {
    const value = record[name] as DeliveryEvidence
    requireExactKeys(value, ['status', 'basisFingerprint', 'evidence'], `evidence.${name}`)
    if (!['PENDING', 'PASSED', 'FAILED', 'INVALIDATED', 'NOT_APPLICABLE'].includes(value.status))
      fail('PACKAGE_EVIDENCE_STATUS_INVALID', name)
    if (value.status === 'NOT_APPLICABLE') {
      if (value.basisFingerprint !== null || value.evidence !== null)
        fail('PACKAGE_EVIDENCE_NOT_APPLICABLE_INVALID', name)
      continue
    }
    if (value.basisFingerprint !== basis) fail('PACKAGE_EVIDENCE_BASIS_MISMATCH', name)
    if (['PASSED', 'FAILED'].includes(value.status)) {
      if (!value.evidence) fail('PACKAGE_EVIDENCE_REFERENCE_REQUIRED', name)
      validateReference(value.evidence, `evidence.${name}`)
    } else if (value.evidence !== null) {
      fail('PACKAGE_EVIDENCE_REFERENCE_FORBIDDEN', name)
    }
  }
}

/** Reopens every completed evidence record and verifies its exact bytes and self-fingerprint. */
function reopenCompletedEvidence(execution: object, names: readonly string[], ownerKey: string): void {
  const record = execution as Record<string, unknown>
  for (const name of names) {
    const evidence = record[name] as DeliveryEvidence
    if (!['PASSED', 'FAILED'].includes(evidence.status) || !evidence.evidence) continue
    const reference = evidence.evidence
    const bytes = readFileSync(reference.path)
    if (sha256(bytes) !== reference.sha256)
      fail('PACKAGE_EVIDENCE_REFERENCE_SHA_MISMATCH', `${ownerKey}:${name}`)
    const value = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>
    const fingerprintField = Object.keys(value).find(
      (field) =>
        value[field] === reference.fingerprint &&
        objectFingerprint(value, field) === reference.fingerprint
    )
    if (!fingerprintField)
      fail('PACKAGE_EVIDENCE_REFERENCE_FINGERPRINT_MISMATCH', `${ownerKey}:${name}`)
  }
}

/** Validates one package's absolute external artifact location. */
function validatePackagePath(root: string, path: string, filename: string): void {
  requireAbsolute(root, 'artifactRoot')
  requireAbsolute(path, 'packagePath')
  if (!isWithin(root, path) || !path.endsWith(`/${filename}`))
    fail('PACKAGE_PATH_NOT_STABLE_ARTIFACT', path)
}

/** Returns whether a path is equal to or nested beneath one root. */
function isWithin(root: string, candidate: string): boolean {
  const child = relative(resolve(root), resolve(candidate))
  return child === '' || (!child.startsWith(`..${sep}`) && child !== '..' && !child.startsWith(sep))
}

/** Requires one absolute canonical path. */
function requireAbsolute(value: string, field: string): void {
  if (!isAbsolute(value) || resolve(value) !== value) fail('PACKAGE_PATH_INVALID', field)
}

/** Validates one trusted evidence reference shape. */
function validateReference(value: TrustedAuthorizationReference, field: string): void {
  requireExactKeys(value, ['path', 'sha256', 'fingerprint'], field)
  if (!isAbsolute(value.path) || !DIGEST.test(value.sha256) || !DIGEST.test(value.fingerprint))
    fail('PACKAGE_REFERENCE_INVALID', field)
}

/** Requires a lowercase SHA-256 fingerprint. */
function validateFingerprint(value: string, field: string): void {
  if (!DIGEST.test(value)) fail('PACKAGE_FINGERPRINT_INVALID', field)
}

/** Returns true for a nonempty unique string list. */
function nonEmptyStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.length > 0) &&
    new Set(value).size === value.length
  )
}

/** Requires an object to contain exactly the declared fields. */
function requireExactKeys(value: unknown, allowed: string[], field: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('PACKAGE_OBJECT_INVALID', field)
  const keys = Object.keys(value).sort()
  if (canonicalJson(keys) !== canonicalJson([...allowed].sort()))
    fail('PACKAGE_OBJECT_SHAPE_INVALID', field)
}

/** Produces a detached JSON-compatible copy for deterministic sealing. */
function clone<T>(value: T): T {
  return structuredClone(value)
}

/** Deep-freezes a reopened package so its trust mark cannot survive mutation. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
