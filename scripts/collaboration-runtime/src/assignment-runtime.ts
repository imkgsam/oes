import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { canonicalJson, objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import {
  ASSIGNMENT_CHILD_ROLES,
  FEATURE_REPLAN_INVALIDATION_CONDITIONS,
  type ActiveChildAssignment,
  type AssignmentResult,
  type AssignmentResultInput,
  type AssignmentResultReceipt,
  type AssignmentRuntimeInitialization,
  type AssignmentRuntimeState,
  type AssignmentWipCeiling,
  type AssignmentWipSnapshot,
  type ChildAssignmentRequest,
  type CompletedSliceBinding,
  type FeatureOwnerResources,
  type FeatureReplanDecision,
  type FeatureReplanRequest,
  type FeatureReplanRequestInput,
  type FeatureReplanSibling,
  type FeatureReplanSiblingInput,
  type FeatureWipSnapshot,
  type StageWipAuthorityBinding
} from './assignment-runtime.types.ts'

const FINGERPRINT = /^[0-9a-f]{64}$/
const GIT_SHA = /^[0-9a-f]{40}$/
const FEATURE_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/
const ACTION = /^[A-Z][A-Z0-9_]*$/
const REPOSITORY_WRITE_RANGE = /^[A-Za-z0-9._@-]+(?:\/[A-Za-z0-9._@-]+)*(?:\/\*\*)?$/
const CANONICAL_MAXIMUMS: AssignmentWipCeiling = {
  maxActiveFeatureLeads: 3,
  maxActiveImplementationTasksPerFeature: 3,
  maxActiveFeatureReviewsPerFeature: 1
}

/** Requires an object to contain exactly the declared runtime fields. */
function requireExactKeys(
  value: unknown,
  allowed: string[],
  field: string
): asserts value is object {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('ASSIGNMENT_INVALID_OBJECT', field)
  const extra = Object.keys(value).filter((key) => !allowed.includes(key))
  const missing = allowed.filter((key) => !(key in value))
  if (extra.length || missing.length)
    fail(
      'ASSIGNMENT_OBJECT_KEYS_MISMATCH',
      `${field}:extra=${extra.sort().join(',')};missing=${missing.sort().join(',')}`
    )
}

/** Requires one non-empty stable identifier token. */
function requireToken(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !TOKEN.test(value)) fail('ASSIGNMENT_INVALID_TOKEN', field)
}

/** Requires one lowercase SHA-256 fingerprint. */
function requireFingerprint(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !FINGERPRINT.test(value))
    fail('ASSIGNMENT_INVALID_FINGERPRINT', field)
}

/** Requires one full Git object id. */
function requireGitSha(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !GIT_SHA.test(value)) fail('ASSIGNMENT_INVALID_GIT_SHA', field)
}

/** Requires one positive integer state version. */
function requireStateVersion(value: unknown, field: string): asserts value is number {
  if (!Number.isInteger(value) || Number(value) < 1) fail('ASSIGNMENT_INVALID_STATE_VERSION', field)
}

/** Requires one feature or Stage key. */
function requireFeatureKey(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !FEATURE_KEY.test(value))
    fail('ASSIGNMENT_INVALID_FEATURE_KEY', field)
}

/** Requires one explicit next action without embedding an interpreter payload. */
function requireAction(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || !ACTION.test(value)) fail('ASSIGNMENT_INVALID_ACTION', field)
}

/** Normalizes a non-empty unique string list for stable fingerprints. */
function normalizeStrings(values: unknown, field: string, allowEmpty = false): string[] {
  if (!Array.isArray(values) || (!allowEmpty && values.length === 0))
    fail('ASSIGNMENT_INVALID_STRING_LIST', field)
  if (values.some((value) => typeof value !== 'string' || value.length === 0))
    fail('ASSIGNMENT_INVALID_STRING_LIST', field)
  const normalized = [...new Set(values as string[])].sort()
  if (normalized.length !== values.length) fail('ASSIGNMENT_DUPLICATE_STRING', field)
  return normalized
}

/** Normalizes one conservative literal repository path or terminal recursive range. */
function normalizeWriteRanges(values: unknown, field: string, allowEmpty = false): string[] {
  const normalized = normalizeStrings(values, field, allowEmpty)
  for (const value of normalized) {
    const segments = value.replace(/\/\*\*$/, '').split('/')
    if (
      !REPOSITORY_WRITE_RANGE.test(value) ||
      segments.some((segment) => ['.', '..'].includes(segment))
    )
      fail('FEATURE_REPLAN_WRITE_RANGE_INVALID', `${field}:${value}`)
  }
  return normalized
}

/** Validates a configured ceiling against the frozen canonical maxima. */
function validateCeiling(ceiling: AssignmentWipCeiling): AssignmentWipCeiling {
  requireExactKeys(
    ceiling,
    [
      'maxActiveFeatureLeads',
      'maxActiveImplementationTasksPerFeature',
      'maxActiveFeatureReviewsPerFeature'
    ],
    'ceiling'
  )
  if (
    !Number.isInteger(ceiling.maxActiveFeatureLeads) ||
    ceiling.maxActiveFeatureLeads < 1 ||
    ceiling.maxActiveFeatureLeads > CANONICAL_MAXIMUMS.maxActiveFeatureLeads ||
    !Number.isInteger(ceiling.maxActiveImplementationTasksPerFeature) ||
    ceiling.maxActiveImplementationTasksPerFeature < 1 ||
    ceiling.maxActiveImplementationTasksPerFeature >
      CANONICAL_MAXIMUMS.maxActiveImplementationTasksPerFeature ||
    ceiling.maxActiveFeatureReviewsPerFeature !== 1
  )
    fail('ASSIGNMENT_WIP_CEILING_INVALID', canonicalJson(ceiling))
  return { ...ceiling }
}

/** Derives the complete WIP snapshot from active assignments only. */
export function deriveAssignmentWip(assignments: ActiveChildAssignment[]): AssignmentWipSnapshot {
  const byFeature = new Map<string, FeatureWipSnapshot>()
  let activeFeatureLeads = 0
  for (const assignment of assignments) {
    if (assignment.childRole === 'FEATURE_LEAD') {
      activeFeatureLeads += 1
      continue
    }
    const current = byFeature.get(assignment.featureKey) ?? {
      featureKey: assignment.featureKey,
      activeImplementationTasks: 0,
      activeFeatureReviews: 0
    }
    if (assignment.childRole === 'IMPLEMENTATION_TASK') current.activeImplementationTasks += 1
    if (assignment.childRole === 'FEATURE_REVIEW') current.activeFeatureReviews += 1
    byFeature.set(assignment.featureKey, current)
  }
  return {
    activeFeatureLeads,
    features: [...byFeature.values()].sort((left, right) =>
      left.featureKey.localeCompare(right.featureKey)
    )
  }
}

/** Fails before persistence when any derived WIP count exceeds its ceiling. */
function requireWipWithinCeiling(wip: AssignmentWipSnapshot, ceiling: AssignmentWipCeiling): void {
  if (wip.activeFeatureLeads > ceiling.maxActiveFeatureLeads)
    fail('ASSIGNMENT_FEATURE_LEAD_WIP_EXCEEDED', String(wip.activeFeatureLeads))
  for (const feature of wip.features) {
    if (feature.activeImplementationTasks > ceiling.maxActiveImplementationTasksPerFeature)
      fail(
        'ASSIGNMENT_IMPLEMENTATION_TASK_WIP_EXCEEDED',
        `${feature.featureKey}:${feature.activeImplementationTasks}`
      )
    if (feature.activeFeatureReviews > ceiling.maxActiveFeatureReviewsPerFeature)
      fail(
        'ASSIGNMENT_FEATURE_REVIEW_WIP_EXCEEDED',
        `${feature.featureKey}:${feature.activeFeatureReviews}`
      )
  }
}

/** Verifies one persisted active assignment and its immutable route. */
function validateActiveAssignment(assignment: ActiveChildAssignment): void {
  requireExactKeys(
    assignment,
    [
      'assignmentId',
      'requestFingerprint',
      'directExecutionParentTaskId',
      'childTaskId',
      'childRole',
      'featureKey',
      'transitionId',
      'dispatchStateVersion',
      'expectedTypedResult',
      'nextLegalActionOnResult',
      'scopeFingerprint'
    ],
    'activeAssignment'
  )
  requireFingerprint(assignment.assignmentId, 'activeAssignment.assignmentId')
  requireFingerprint(assignment.requestFingerprint, 'activeAssignment.requestFingerprint')
  requireToken(assignment.directExecutionParentTaskId, 'activeAssignment.directParent')
  requireToken(assignment.childTaskId, 'activeAssignment.childTaskId')
  if (!ASSIGNMENT_CHILD_ROLES.includes(assignment.childRole))
    fail('ASSIGNMENT_CHILD_ROLE_INVALID', String(assignment.childRole))
  requireFeatureKey(assignment.featureKey, 'activeAssignment.featureKey')
  requireToken(assignment.transitionId, 'activeAssignment.transitionId')
  requireStateVersion(assignment.dispatchStateVersion, 'activeAssignment.dispatchStateVersion')
  requireToken(assignment.expectedTypedResult, 'activeAssignment.expectedTypedResult')
  requireAction(assignment.nextLegalActionOnResult, 'activeAssignment.nextLegalActionOnResult')
  requireFingerprint(assignment.scopeFingerprint, 'activeAssignment.scopeFingerprint')
  const actual = objectFingerprint(assignment as unknown as Record<string, unknown>, 'assignmentId')
  if (actual !== assignment.assignmentId)
    fail('ASSIGNMENT_ID_FINGERPRINT_MISMATCH', assignment.assignmentId)
  const requestFingerprint = objectFingerprint(
    {
      expectedStateVersion: assignment.dispatchStateVersion - 1,
      childTaskId: assignment.childTaskId,
      childRole: assignment.childRole,
      featureKey: assignment.featureKey,
      expectedTypedResult: assignment.expectedTypedResult,
      nextLegalActionOnResult: assignment.nextLegalActionOnResult,
      scopeFingerprint: assignment.scopeFingerprint
    },
    '__none__'
  )
  if (requestFingerprint !== assignment.requestFingerprint)
    fail('ASSIGNMENT_REQUEST_FINGERPRINT_MISMATCH', assignment.assignmentId)
}

/** Rejects self-routes and duplicate active Feature ownership before state is trusted. */
function validateActiveOwnerRoutes(state: AssignmentRuntimeState): void {
  if (state.activeAssignments.some((assignment) => assignment.childTaskId === state.owner.taskId))
    fail('ASSIGNMENT_SELF_CHILD_ROUTE', state.owner.taskId)
  const featureKeys = state.activeAssignments
    .filter((assignment) => assignment.childRole === 'FEATURE_LEAD')
    .map((assignment) => assignment.featureKey)
  if (new Set(featureKeys).size !== featureKeys.length)
    fail('ASSIGNMENT_DUPLICATE_ACTIVE_FEATURE_OWNER', state.stageKey)
}

/** Verifies one immutable result receipt retained for transition-local idempotency. */
function validateReceipt(receipt: AssignmentResultReceipt): void {
  requireExactKeys(
    receipt,
    [
      'schemaVersion',
      'kind',
      'assignmentId',
      'resultFingerprint',
      'appliedStateVersion',
      'remainingAssignments',
      'wip',
      'nextLegalAction'
    ],
    'resultReceipt'
  )
  if (receipt.schemaVersion !== 1 || receipt.kind !== 'OES_ASSIGNMENT_RESULT_RECEIPT')
    fail('ASSIGNMENT_RESULT_RECEIPT_INVALID', receipt.kind)
  requireFingerprint(receipt.assignmentId, 'resultReceipt.assignmentId')
  requireFingerprint(receipt.resultFingerprint, 'resultReceipt.resultFingerprint')
  requireStateVersion(receipt.appliedStateVersion, 'resultReceipt.appliedStateVersion')
  if (!Number.isInteger(receipt.remainingAssignments) || receipt.remainingAssignments < 0)
    fail('ASSIGNMENT_RESULT_RECEIPT_INVALID', 'remainingAssignments')
  validateWipSnapshot(receipt.wip, 'resultReceipt.wip')
  requireAction(receipt.nextLegalAction, 'resultReceipt.nextLegalAction')
}

/** Reopens and validates every invariant of a persisted runtime state. */
export function validateAssignmentRuntimeState(
  state: AssignmentRuntimeState
): AssignmentRuntimeState {
  requireExactKeys(
    state,
    [
      'schemaVersion',
      'kind',
      'recordFingerprint',
      'owner',
      'stageKey',
      'featureKey',
      'transitionId',
      'scopeFingerprint',
      'stateVersion',
      'status',
      'ceiling',
      'activeAssignments',
      'resultTombstones',
      'wip',
      'featureReplan',
      'nextLegalAction'
    ],
    'runtimeState'
  )
  if (state.schemaVersion !== 1 || state.kind !== 'OES_ASSIGNMENT_RUNTIME_STATE')
    fail('ASSIGNMENT_STATE_KIND_INVALID', state.kind)
  requireFingerprint(state.recordFingerprint, 'runtimeState.recordFingerprint')
  const stateFingerprint = objectFingerprint(
    state as unknown as Record<string, unknown>,
    'recordFingerprint'
  )
  if (stateFingerprint !== state.recordFingerprint)
    fail('ASSIGNMENT_STATE_FINGERPRINT_MISMATCH', stateFingerprint)
  requireExactKeys(state.owner, ['role', 'taskId', 'directExecutionParentTaskId'], 'owner')
  if (!['STAGE_LEAD', 'FEATURE_LEAD'].includes(state.owner.role))
    fail('ASSIGNMENT_OWNER_ROLE_INVALID', state.owner.role)
  requireToken(state.owner.taskId, 'owner.taskId')
  requireToken(state.owner.directExecutionParentTaskId, 'owner.directExecutionParentTaskId')
  requireFeatureKey(state.stageKey, 'runtimeState.stageKey')
  requireFeatureKey(state.featureKey, 'runtimeState.featureKey')
  requireToken(state.transitionId, 'runtimeState.transitionId')
  requireFingerprint(state.scopeFingerprint, 'runtimeState.scopeFingerprint')
  requireStateVersion(state.stateVersion, 'runtimeState.stateVersion')
  if (!['ACTIVE', 'WAITING_ON_CHILD', 'FEATURE_REPLAN_REQUIRED'].includes(state.status))
    fail('ASSIGNMENT_STATE_STATUS_INVALID', state.status)
  validateCeiling(state.ceiling)
  if (!Array.isArray(state.activeAssignments) || !Array.isArray(state.resultTombstones))
    fail('ASSIGNMENT_STATE_COLLECTION_INVALID', 'assignments/results')
  for (const assignment of state.activeAssignments) {
    validateActiveAssignment(assignment)
    if (
      assignment.directExecutionParentTaskId !== state.owner.taskId ||
      assignment.transitionId !== state.transitionId
    )
      fail('ASSIGNMENT_STATE_ROUTE_MISMATCH', assignment.assignmentId)
    if (
      (state.owner.role === 'STAGE_LEAD' && assignment.childRole !== 'FEATURE_LEAD') ||
      (state.owner.role === 'FEATURE_LEAD' && assignment.childRole === 'FEATURE_LEAD')
    )
      fail('ASSIGNMENT_OWNER_CHILD_ROUTE_INVALID', assignment.childRole)
    if (state.owner.role === 'FEATURE_LEAD' && assignment.featureKey !== state.featureKey)
      fail('ASSIGNMENT_FEATURE_OWNER_SCOPE_MISMATCH', assignment.featureKey)
    if (assignment.dispatchStateVersion > state.stateVersion)
      fail('ASSIGNMENT_DISPATCH_VERSION_FUTURE', assignment.assignmentId)
  }
  const assignmentIds = state.activeAssignments.map((assignment) => assignment.assignmentId)
  if (new Set(assignmentIds).size !== assignmentIds.length)
    fail('ASSIGNMENT_DUPLICATE_ACTIVE_ID', state.featureKey)
  const activeChildren = state.activeAssignments.map((assignment) => assignment.childTaskId)
  if (new Set(activeChildren).size !== activeChildren.length)
    fail('ASSIGNMENT_DUPLICATE_ACTIVE_CHILD', state.featureKey)
  const activeRequests = state.activeAssignments.map((assignment) => assignment.requestFingerprint)
  if (new Set(activeRequests).size !== activeRequests.length)
    fail('ASSIGNMENT_DUPLICATE_ACTIVE_REQUEST', state.featureKey)
  validateActiveOwnerRoutes(state)
  for (const tombstone of state.resultTombstones) {
    requireExactKeys(tombstone, ['assignment', 'resultFingerprint', 'receipt'], 'resultTombstone')
    validateActiveAssignment(tombstone.assignment)
    if (
      tombstone.assignment.directExecutionParentTaskId !== state.owner.taskId ||
      tombstone.assignment.transitionId !== state.transitionId ||
      tombstone.assignment.dispatchStateVersion > state.stateVersion
    )
      fail('ASSIGNMENT_TOMBSTONE_ROUTE_MISMATCH', tombstone.assignment.assignmentId)
    if (
      (state.owner.role === 'STAGE_LEAD' && tombstone.assignment.childRole !== 'FEATURE_LEAD') ||
      (state.owner.role === 'FEATURE_LEAD' &&
        (tombstone.assignment.childRole === 'FEATURE_LEAD' ||
          tombstone.assignment.featureKey !== state.featureKey))
    )
      fail('ASSIGNMENT_TOMBSTONE_OWNER_SCOPE_MISMATCH', tombstone.assignment.assignmentId)
    requireFingerprint(tombstone.resultFingerprint, 'resultTombstone.resultFingerprint')
    validateReceipt(tombstone.receipt)
    if (
      tombstone.receipt.assignmentId !== tombstone.assignment.assignmentId ||
      tombstone.receipt.resultFingerprint !== tombstone.resultFingerprint
    )
      fail('ASSIGNMENT_TOMBSTONE_RECEIPT_MISMATCH', tombstone.assignment.assignmentId)
    const receiptWipCount =
      tombstone.receipt.wip.activeFeatureLeads +
      tombstone.receipt.wip.features.reduce(
        (total, feature) =>
          total + feature.activeImplementationTasks + feature.activeFeatureReviews,
        0
      )
    if (receiptWipCount !== tombstone.receipt.remainingAssignments)
      fail('ASSIGNMENT_TOMBSTONE_RECEIPT_WIP_MISMATCH', tombstone.assignment.assignmentId)
    requireWipWithinCeiling(tombstone.receipt.wip, state.ceiling)
    if (
      tombstone.receipt.appliedStateVersion > state.stateVersion ||
      tombstone.receipt.appliedStateVersion <= tombstone.assignment.dispatchStateVersion
    )
      fail('ASSIGNMENT_TOMBSTONE_RECEIPT_FUTURE', tombstone.assignment.assignmentId)
  }
  const completedIds = state.resultTombstones.map((entry) => entry.assignment.assignmentId)
  const completedRequests = state.resultTombstones.map(
    (entry) => entry.assignment.requestFingerprint
  )
  if (
    new Set(completedIds).size !== completedIds.length ||
    completedIds.some((id) => assignmentIds.includes(id))
  )
    fail('ASSIGNMENT_TOMBSTONE_ID_CONFLICT', state.featureKey)
  if (new Set(completedRequests).size !== completedRequests.length)
    fail('ASSIGNMENT_TOMBSTONE_REQUEST_CONFLICT', state.featureKey)
  if (completedRequests.some((request) => activeRequests.includes(request)))
    fail('ASSIGNMENT_ACTIVE_COMPLETED_REQUEST_CONFLICT', state.featureKey)
  if (
    [...assignmentIds].sort().join() !== assignmentIds.join() ||
    [...completedIds].sort().join() !== completedIds.join()
  )
    fail('ASSIGNMENT_STATE_COLLECTION_ORDER_INVALID', state.featureKey)
  const derived = deriveAssignmentWip(state.activeAssignments)
  if (canonicalJson(derived) !== canonicalJson(state.wip))
    fail('ASSIGNMENT_WIP_SNAPSHOT_MISMATCH', state.featureKey)
  requireWipWithinCeiling(derived, state.ceiling)
  requireAction(state.nextLegalAction, 'runtimeState.nextLegalAction')
  if (state.featureReplan !== null) {
    requireExactKeys(
      state.featureReplan,
      ['decision', 'requestFingerprint', 'decisionFingerprint'],
      'featureReplan'
    )
    if (!['FEATURE_REPLAN_REQUIRED', 'ATOMIC_CONTINUATION'].includes(state.featureReplan.decision))
      fail('FEATURE_REPLAN_DECISION_INVALID', state.featureReplan.decision)
    requireFingerprint(state.featureReplan.requestFingerprint, 'featureReplan.requestFingerprint')
    requireFingerprint(state.featureReplan.decisionFingerprint, 'featureReplan.decisionFingerprint')
  }
  const expectedStatus =
    state.featureReplan?.decision === 'FEATURE_REPLAN_REQUIRED'
      ? 'FEATURE_REPLAN_REQUIRED'
      : state.activeAssignments.length
        ? 'WAITING_ON_CHILD'
        : 'ACTIVE'
  if (state.status !== expectedStatus)
    fail('ASSIGNMENT_STATE_MARKER_MISMATCH', `${state.status}/${expectedStatus}`)
  if (
    state.status === 'FEATURE_REPLAN_REQUIRED' &&
    state.nextLegalAction !== 'RETURN_FEATURE_REPLAN_REQUIRED_TO_DIRECT_PARENT'
  )
    fail('ASSIGNMENT_NEXT_ACTION_STATE_MISMATCH', state.nextLegalAction)
  return state
}

/** Builds and fingerprints one direct assignment result envelope. */
export function createAssignmentResult(input: AssignmentResultInput): AssignmentResult {
  requireExactKeys(
    input,
    [
      'assignmentId',
      'directExecutionParentTaskId',
      'childTaskId',
      'transitionId',
      'dispatchStateVersion',
      'typedResult',
      'resultArtifact'
    ],
    'assignmentResultInput'
  )
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_ASSIGNMENT_RESULT' as const,
    ...input
  }
  const result = {
    ...base,
    resultFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
  return validateAssignmentResult(result)
}

/** Validates the self-hash and exact fields of one direct child result. */
export function validateAssignmentResult(result: AssignmentResult): AssignmentResult {
  requireExactKeys(
    result,
    [
      'schemaVersion',
      'kind',
      'resultFingerprint',
      'assignmentId',
      'directExecutionParentTaskId',
      'childTaskId',
      'transitionId',
      'dispatchStateVersion',
      'typedResult',
      'resultArtifact'
    ],
    'assignmentResult'
  )
  if (result.schemaVersion !== 1 || result.kind !== 'OES_ASSIGNMENT_RESULT')
    fail('ASSIGNMENT_RESULT_KIND_INVALID', result.kind)
  requireFingerprint(result.resultFingerprint, 'assignmentResult.resultFingerprint')
  requireFingerprint(result.assignmentId, 'assignmentResult.assignmentId')
  requireToken(result.directExecutionParentTaskId, 'assignmentResult.directParent')
  requireToken(result.childTaskId, 'assignmentResult.childTaskId')
  requireToken(result.transitionId, 'assignmentResult.transitionId')
  requireStateVersion(result.dispatchStateVersion, 'assignmentResult.dispatchStateVersion')
  requireToken(result.typedResult, 'assignmentResult.typedResult')
  requireExactKeys(result.resultArtifact, ['path', 'sha256', 'fingerprint'], 'resultArtifact')
  if (typeof result.resultArtifact.path !== 'string' || result.resultArtifact.path.length === 0)
    fail('ASSIGNMENT_RESULT_ARTIFACT_INVALID', 'path')
  requireFingerprint(result.resultArtifact.sha256, 'resultArtifact.sha256')
  requireFingerprint(result.resultArtifact.fingerprint, 'resultArtifact.fingerprint')
  const actual = objectFingerprint(
    result as unknown as Record<string, unknown>,
    'resultFingerprint'
  )
  if (actual !== result.resultFingerprint) fail('ASSIGNMENT_RESULT_FINGERPRINT_MISMATCH', actual)
  return result
}

/** Builds a normalized sibling extraction binding and its scope fingerprint. */
export function createFeatureReplanSibling(input: FeatureReplanSiblingInput): FeatureReplanSibling {
  requireExactKeys(
    input,
    [
      'featureKey',
      'objective',
      'scope',
      'protectedScope',
      'writeSet',
      'dependencies',
      'acceptance',
      'requiredCapabilityFingerprint',
      'independenceProof'
    ],
    'featureReplanSiblingInput'
  )
  requireFeatureKey(input.featureKey, 'sibling.featureKey')
  if (typeof input.objective !== 'string' || input.objective.length === 0)
    fail('FEATURE_REPLAN_OBJECTIVE_INVALID', input.featureKey)
  requireFingerprint(input.requiredCapabilityFingerprint, 'sibling.requiredCapabilityFingerprint')
  requireExactKeys(
    input.independenceProof,
    [
      'independentCandidate',
      'independentFeatureReview',
      'independentPullRequest',
      'safeIndependentMainMerge'
    ],
    'sibling.independenceProof'
  )
  if (Object.values(input.independenceProof).some((value) => typeof value !== 'boolean'))
    fail('FEATURE_REPLAN_PROOF_INVALID', input.featureKey)
  const core = {
    featureKey: input.featureKey,
    objective: input.objective,
    scope: normalizeStrings(input.scope, 'sibling.scope'),
    protectedScope: normalizeStrings(input.protectedScope, 'sibling.protectedScope'),
    writeSet: normalizeWriteRanges(input.writeSet, 'sibling.writeSet'),
    dependencies: normalizeStrings(input.dependencies, 'sibling.dependencies', true),
    acceptance: normalizeStrings(input.acceptance, 'sibling.acceptance'),
    requiredCapabilityFingerprint: input.requiredCapabilityFingerprint,
    independenceProof: { ...input.independenceProof }
  }
  return {
    ...core,
    scopeFingerprint: objectFingerprint(core as unknown as Record<string, unknown>, '__none__')
  }
}

/** Extracts an exact self-hashed Stage WIP authority from one validated Stage-owned state. */
export function createStageWipAuthorityBinding(
  stageState: AssignmentRuntimeState
): StageWipAuthorityBinding {
  validateAssignmentRuntimeState(stageState)
  if (stageState.owner.role !== 'STAGE_LEAD')
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_ROLE_INVALID', stageState.owner.role)
  const featureAssignments = stageState.activeAssignments.filter(
    (assignment) => assignment.childRole === 'FEATURE_LEAD'
  )
  const activeFeatureKeys = featureAssignments
    .map((assignment) => assignment.featureKey)
    .sort((left, right) => left.localeCompare(right))
  if (
    featureAssignments.length !== stageState.wip.activeFeatureLeads ||
    new Set(activeFeatureKeys).size !== activeFeatureKeys.length
  )
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_WIP_INVALID', stageState.stageKey)
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_STAGE_WIP_AUTHORITY_BINDING' as const,
    stageLeadTaskId: stageState.owner.taskId,
    stageKey: stageState.stageKey,
    transitionId: stageState.transitionId,
    stageStateVersion: stageState.stateVersion,
    stageStateFingerprint: stageState.recordFingerprint,
    activeFeatureLeads: stageState.wip.activeFeatureLeads,
    activeFeatureKeys,
    ceiling: { ...stageState.ceiling }
  }
  return {
    ...base,
    authorityFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
}

/** Reopens the exact Stage WIP authority binding and its self-hash. */
function validateStageWipAuthorityBinding(
  authority: StageWipAuthorityBinding
): StageWipAuthorityBinding {
  requireExactKeys(
    authority,
    [
      'schemaVersion',
      'kind',
      'authorityFingerprint',
      'stageLeadTaskId',
      'stageKey',
      'transitionId',
      'stageStateVersion',
      'stageStateFingerprint',
      'activeFeatureLeads',
      'activeFeatureKeys',
      'ceiling'
    ],
    'stageWipAuthority'
  )
  if (authority.schemaVersion !== 1 || authority.kind !== 'OES_STAGE_WIP_AUTHORITY_BINDING')
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_KIND_INVALID', authority.kind)
  requireFingerprint(authority.authorityFingerprint, 'stageWipAuthority.authorityFingerprint')
  requireToken(authority.stageLeadTaskId, 'stageWipAuthority.stageLeadTaskId')
  requireFeatureKey(authority.stageKey, 'stageWipAuthority.stageKey')
  requireToken(authority.transitionId, 'stageWipAuthority.transitionId')
  requireStateVersion(authority.stageStateVersion, 'stageWipAuthority.stageStateVersion')
  requireFingerprint(authority.stageStateFingerprint, 'stageWipAuthority.stageStateFingerprint')
  if (!Number.isInteger(authority.activeFeatureLeads) || authority.activeFeatureLeads < 1)
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_WIP_INVALID', authority.stageKey)
  const activeFeatureKeys = normalizeStrings(
    authority.activeFeatureKeys,
    'stageWipAuthority.activeFeatureKeys'
  )
  activeFeatureKeys.forEach((key) => requireFeatureKey(key, 'stageWipAuthority.activeFeatureKey'))
  if (activeFeatureKeys.length !== authority.activeFeatureLeads)
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_WIP_INVALID', authority.stageKey)
  validateCeiling(authority.ceiling)
  if (authority.activeFeatureLeads > authority.ceiling.maxActiveFeatureLeads)
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_WIP_INVALID', authority.stageKey)
  const actual = objectFingerprint(
    authority as unknown as Record<string, unknown>,
    'authorityFingerprint'
  )
  if (actual !== authority.authorityFingerprint)
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_FINGERPRINT_MISMATCH', authority.stageKey)
  return authority
}

/** Authenticates one persisted authority against the exact Stage-owned runtime state. */
export function verifyStageWipAuthorityBinding(
  authorityInput: StageWipAuthorityBinding,
  exactStageState: AssignmentRuntimeState
): StageWipAuthorityBinding {
  const authority = validateStageWipAuthorityBinding(authorityInput)
  const expected = createStageWipAuthorityBinding(exactStageState)
  if (canonicalJson(authority) !== canonicalJson(expected))
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_NOT_EXACT_STATE', authority.stageKey)
  return authority
}

/** Validates one normalized sibling and its complete extraction fingerprint. */
function validateFeatureReplanSibling(sibling: FeatureReplanSibling): FeatureReplanSibling {
  requireExactKeys(
    sibling,
    [
      'featureKey',
      'objective',
      'scope',
      'protectedScope',
      'writeSet',
      'dependencies',
      'acceptance',
      'requiredCapabilityFingerprint',
      'independenceProof',
      'scopeFingerprint'
    ],
    'featureReplanSibling'
  )
  const { scopeFingerprint, ...input } = sibling
  const recreated = createFeatureReplanSibling(input)
  requireFingerprint(sibling.scopeFingerprint, 'sibling.scopeFingerprint')
  if (recreated.scopeFingerprint !== scopeFingerprint)
    fail('FEATURE_REPLAN_SIBLING_FINGERPRINT_MISMATCH', sibling.featureKey)
  return sibling
}

/** Validates a WIP snapshot used as an exact topology binding. */
function validateWipSnapshot(wip: AssignmentWipSnapshot, field: string): AssignmentWipSnapshot {
  requireExactKeys(wip, ['activeFeatureLeads', 'features'], field)
  if (!Number.isInteger(wip.activeFeatureLeads) || wip.activeFeatureLeads < 0)
    fail('ASSIGNMENT_WIP_SNAPSHOT_INVALID', `${field}.activeFeatureLeads`)
  if (!Array.isArray(wip.features)) fail('ASSIGNMENT_WIP_SNAPSHOT_INVALID', `${field}.features`)
  for (const feature of wip.features) {
    requireExactKeys(
      feature,
      ['featureKey', 'activeImplementationTasks', 'activeFeatureReviews'],
      `${field}.feature`
    )
    requireFeatureKey(feature.featureKey, `${field}.featureKey`)
    if (
      !Number.isInteger(feature.activeImplementationTasks) ||
      feature.activeImplementationTasks < 0 ||
      !Number.isInteger(feature.activeFeatureReviews) ||
      feature.activeFeatureReviews < 0
    )
      fail('ASSIGNMENT_WIP_SNAPSHOT_INVALID', feature.featureKey)
  }
  const keys = wip.features.map((feature) => feature.featureKey)
  if (new Set(keys).size !== keys.length || [...keys].sort().join() !== keys.join())
    fail('ASSIGNMENT_WIP_FEATURE_ORDER_INVALID', field)
  return wip
}

/** Normalizes one completed-slice evidence binding. */
function normalizeCompletedSlice(slice: CompletedSliceBinding): CompletedSliceBinding {
  requireExactKeys(
    slice,
    ['sliceId', 'commitSha', 'candidateSha', 'evidenceFingerprints'],
    'completedSlice'
  )
  requireToken(slice.sliceId, 'completedSlice.sliceId')
  requireGitSha(slice.commitSha, 'completedSlice.commitSha')
  if (slice.candidateSha !== null) requireGitSha(slice.candidateSha, 'completedSlice.candidateSha')
  const evidenceFingerprints = normalizeStrings(
    slice.evidenceFingerprints,
    'completedSlice.evidenceFingerprints',
    true
  )
  evidenceFingerprints.forEach((value) =>
    requireFingerprint(value, 'completedSlice.evidenceFingerprint')
  )
  return { ...slice, evidenceFingerprints }
}

/** Validates one exact owner resource set without mutating any referenced locator. */
function validateResources(resources: FeatureOwnerResources): FeatureOwnerResources {
  requireExactKeys(resources, ['ownerRef', 'ownerClone', 'taskTemp', 'featurePacket'], 'resources')
  for (const [key, value] of Object.entries(resources))
    if (typeof value !== 'string' || value.length === 0)
      fail('FEATURE_REPLAN_RESOURCE_INVALID', key)
  return { ...resources }
}

/** Builds a complete exact Feature topology decision request. */
export function createFeatureReplanRequest(input: FeatureReplanRequestInput): FeatureReplanRequest {
  requireExactKeys(
    input,
    [
      'stageLeadTaskId',
      'featureLeadTaskId',
      'stageKey',
      'featureKey',
      'transitionId',
      'stateVersion',
      'scopeFingerprint',
      'rootAuthorizationFingerprint',
      'stageWipAuthority',
      'oldTopology',
      'delegationCeiling',
      'retainedWriteSet',
      'currentResources',
      'completedSlices',
      'proposedSiblings'
    ],
    'featureReplanRequestInput'
  )
  requireToken(input.stageLeadTaskId, 'request.stageLeadTaskId')
  requireToken(input.featureLeadTaskId, 'request.featureLeadTaskId')
  requireFeatureKey(input.stageKey, 'request.stageKey')
  requireFeatureKey(input.featureKey, 'request.featureKey')
  requireToken(input.transitionId, 'request.transitionId')
  requireStateVersion(input.stateVersion, 'request.stateVersion')
  requireFingerprint(input.scopeFingerprint, 'request.scopeFingerprint')
  requireFingerprint(input.rootAuthorizationFingerprint, 'request.rootAuthorizationFingerprint')
  const stageWipAuthority = validateStageWipAuthorityBinding(input.stageWipAuthority)
  const oldTopology = validateWipSnapshot(input.oldTopology, 'request.oldTopology')
  const delegationCeiling = validateCeiling(input.delegationCeiling)
  const retainedWriteSet = normalizeWriteRanges(
    input.retainedWriteSet,
    'request.retainedWriteSet',
    true
  )
  if (
    stageWipAuthority.stageLeadTaskId !== input.stageLeadTaskId ||
    stageWipAuthority.stageKey !== input.stageKey ||
    stageWipAuthority.transitionId !== input.transitionId ||
    stageWipAuthority.activeFeatureLeads !== oldTopology.activeFeatureLeads ||
    canonicalJson(stageWipAuthority.ceiling) !== canonicalJson(delegationCeiling) ||
    !stageWipAuthority.activeFeatureKeys.includes(input.featureKey)
  )
    fail('FEATURE_REPLAN_STAGE_AUTHORITY_MISMATCH', input.featureKey)
  requireWipWithinCeiling(oldTopology, delegationCeiling)
  if (oldTopology.activeFeatureLeads < 1)
    fail('FEATURE_REPLAN_ORIGINAL_FEATURE_MISSING', input.featureKey)
  const currentResources = validateResources(input.currentResources)
  if (!Array.isArray(input.completedSlices) || !Array.isArray(input.proposedSiblings))
    fail('FEATURE_REPLAN_COLLECTION_INVALID', input.featureKey)
  const completedSlices = input.completedSlices
    .map(normalizeCompletedSlice)
    .sort((left, right) => left.sliceId.localeCompare(right.sliceId))
  const completedIds = completedSlices.map((slice) => slice.sliceId)
  if (new Set(completedIds).size !== completedIds.length)
    fail('FEATURE_REPLAN_DUPLICATE_SLICE', input.featureKey)
  const proposedSiblings = input.proposedSiblings
    .map(validateFeatureReplanSibling)
    .sort((left, right) => left.featureKey.localeCompare(right.featureKey))
  const siblingKeys = proposedSiblings.map((sibling) => sibling.featureKey)
  if (new Set(siblingKeys).size !== siblingKeys.length || siblingKeys.includes(input.featureKey))
    fail('FEATURE_REPLAN_DUPLICATE_FEATURE', input.featureKey)
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_FEATURE_REPLAN_REQUEST' as const,
    stageLeadTaskId: input.stageLeadTaskId,
    featureLeadTaskId: input.featureLeadTaskId,
    stageKey: input.stageKey,
    featureKey: input.featureKey,
    transitionId: input.transitionId,
    stateVersion: input.stateVersion,
    scopeFingerprint: input.scopeFingerprint,
    rootAuthorizationFingerprint: input.rootAuthorizationFingerprint,
    stageWipAuthority,
    oldTopology,
    delegationCeiling,
    retainedWriteSet,
    currentResources,
    completedSlices,
    proposedSiblings,
    invalidationConditions: [...FEATURE_REPLAN_INVALIDATION_CONDITIONS]
  }
  return {
    ...base,
    requestFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
}

/** Recomputes every nested fingerprint of one persisted replan request. */
export function validateFeatureReplanRequest(request: FeatureReplanRequest): FeatureReplanRequest {
  requireExactKeys(
    request,
    [
      'schemaVersion',
      'kind',
      'requestFingerprint',
      'stageLeadTaskId',
      'featureLeadTaskId',
      'stageKey',
      'featureKey',
      'transitionId',
      'stateVersion',
      'scopeFingerprint',
      'rootAuthorizationFingerprint',
      'stageWipAuthority',
      'oldTopology',
      'delegationCeiling',
      'retainedWriteSet',
      'currentResources',
      'completedSlices',
      'proposedSiblings',
      'invalidationConditions'
    ],
    'featureReplanRequest'
  )
  if (request.schemaVersion !== 1 || request.kind !== 'OES_FEATURE_REPLAN_REQUEST')
    fail('FEATURE_REPLAN_REQUEST_KIND_INVALID', request.kind)
  requireFingerprint(request.requestFingerprint, 'request.requestFingerprint')
  if (
    canonicalJson(request.invalidationConditions) !==
    canonicalJson(FEATURE_REPLAN_INVALIDATION_CONDITIONS)
  )
    fail('FEATURE_REPLAN_INVALIDATION_SET_MISMATCH', request.featureKey)
  const {
    schemaVersion: _schemaVersion,
    kind: _kind,
    requestFingerprint: _requestFingerprint,
    invalidationConditions: _invalidationConditions,
    ...input
  } = request
  const recreated = createFeatureReplanRequest(input)
  if (recreated.requestFingerprint !== request.requestFingerprint)
    fail('FEATURE_REPLAN_REQUEST_FINGERPRINT_MISMATCH', request.featureKey)
  return request
}

/** Maps one write expression to a conservative repository range root. */
function writeRangeRoot(value: string): string {
  return value.replace(/\/\*\*$/, '')
}

/** Returns whether two sibling write ranges can select a common path. */
function writeRangesOverlap(left: string, right: string): boolean {
  const a = writeRangeRoot(left)
  const b = writeRangeRoot(right)
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)
}

/** Produces the bounded automatic replan or atomic-continuation decision. */
export function decideFeatureReplan(
  request: FeatureReplanRequest,
  exactStageState: AssignmentRuntimeState
): FeatureReplanDecision {
  validateFeatureReplanRequest(request)
  verifyStageWipAuthorityBinding(request.stageWipAuthority, exactStageState)
  const independent =
    request.proposedSiblings.length > 0 &&
    request.proposedSiblings.every((sibling) =>
      Object.values(sibling.independenceProof).every((value) => value === true)
    )
  if (independent) {
    const newActiveFeatureLeads =
      request.oldTopology.activeFeatureLeads + request.proposedSiblings.length
    if (newActiveFeatureLeads > request.delegationCeiling.maxActiveFeatureLeads)
      fail('FEATURE_REPLAN_WIP_CEILING_EXCEEDED', String(newActiveFeatureLeads))
    for (let left = 0; left < request.proposedSiblings.length; left += 1)
      for (let right = left + 1; right < request.proposedSiblings.length; right += 1)
        if (
          request.proposedSiblings[left].writeSet.some((a) =>
            request.proposedSiblings[right].writeSet.some((b) => writeRangesOverlap(a, b))
          )
        )
          fail(
            'FEATURE_REPLAN_WRITE_SET_CONFLICT',
            `${request.proposedSiblings[left].featureKey}/${request.proposedSiblings[right].featureKey}`
          )
    for (const sibling of request.proposedSiblings)
      if (
        sibling.writeSet.some((extracted) =>
          request.retainedWriteSet.some((retained) => writeRangesOverlap(extracted, retained))
        )
      )
        fail('FEATURE_REPLAN_RETAINED_WRITE_SET_CONFLICT', sibling.featureKey)
  }
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_FEATURE_REPLAN_DECISION' as const,
    decision: independent ? ('FEATURE_REPLAN_REQUIRED' as const) : ('ATOMIC_CONTINUATION' as const),
    request,
    newTopology: {
      activeFeatureLeads:
        request.oldTopology.activeFeatureLeads +
        (independent ? request.proposedSiblings.length : 0),
      features: request.oldTopology.features.map((feature) => ({ ...feature }))
    },
    nextLegalAction: independent
      ? ('RETURN_FEATURE_REPLAN_REQUIRED_TO_DIRECT_PARENT' as const)
      : ('CONTINUE_ORIGINAL_FEATURE_WITH_BOUNDED_ITS' as const),
    reason: independent
      ? 'all sibling deliveries are independently candidateable, reviewable, publishable, safely mergeable, and within the frozen ceiling'
      : 'the current slices remain one atomic feature under the original Feature Lead'
  }
  return {
    ...base,
    decisionFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
}

/** Revalidates one decision against the exact current request binding. */
export function validateFeatureReplanDecision(
  decision: FeatureReplanDecision,
  currentRequest: FeatureReplanRequest,
  exactStageState: AssignmentRuntimeState
): FeatureReplanDecision {
  requireExactKeys(
    decision,
    [
      'schemaVersion',
      'kind',
      'decisionFingerprint',
      'decision',
      'request',
      'newTopology',
      'nextLegalAction',
      'reason'
    ],
    'featureReplanDecision'
  )
  if (decision.schemaVersion !== 1 || decision.kind !== 'OES_FEATURE_REPLAN_DECISION')
    fail('FEATURE_REPLAN_DECISION_KIND_INVALID', decision.kind)
  requireFingerprint(decision.decisionFingerprint, 'decision.decisionFingerprint')
  validateFeatureReplanRequest(decision.request)
  validateFeatureReplanRequest(currentRequest)
  if (decision.request.requestFingerprint !== currentRequest.requestFingerprint)
    fail('FEATURE_REPLAN_DECISION_INVALIDATED', currentRequest.requestFingerprint)
  const recreated = decideFeatureReplan(decision.request, exactStageState)
  if (
    recreated.decisionFingerprint !== decision.decisionFingerprint ||
    canonicalJson(recreated) !== canonicalJson(decision)
  )
    fail('FEATURE_REPLAN_DECISION_FINGERPRINT_MISMATCH', decision.decisionFingerprint)
  return decision
}

/** Owns one exact persisted assignment state; it never discovers other owners. */
export class AssignmentRuntimeStore {
  readonly artifactRoot: string
  readonly featureKey: string
  readonly statePath: string

  constructor(artifactRoot: string, featureKey: string) {
    requireFeatureKey(featureKey, 'store.featureKey')
    this.artifactRoot = resolve(artifactRoot)
    this.featureKey = featureKey
    this.statePath = join(this.artifactRoot, 'assignment-runtime', `${featureKey}.sqlite`)
  }

  /** Initializes one immutable owner binding or idempotently reopens the exact existing state. */
  initialize(input: AssignmentRuntimeInitialization): AssignmentRuntimeState {
    this.validateInitialization(input)
    return this.withWriteTransaction((database) => {
      const existing = this.selectState(database)
      if (existing) {
        const immutable = {
          owner: existing.owner,
          stageKey: existing.stageKey,
          featureKey: existing.featureKey,
          transitionId: existing.transitionId,
          scopeFingerprint: existing.scopeFingerprint,
          ceiling: existing.ceiling
        }
        const requested = {
          owner: input.owner,
          stageKey: input.stageKey,
          featureKey: input.featureKey,
          transitionId: input.transitionId,
          scopeFingerprint: input.scopeFingerprint,
          ceiling: input.ceiling
        }
        if (canonicalJson(immutable) !== canonicalJson(requested))
          fail('ASSIGNMENT_STATE_BINDING_CONFLICT', this.statePath)
        return existing
      }
      const state = this.persistState(
        database,
        {
          schemaVersion: 1,
          kind: 'OES_ASSIGNMENT_RUNTIME_STATE',
          recordFingerprint: '',
          owner: { ...input.owner },
          stageKey: input.stageKey,
          featureKey: input.featureKey,
          transitionId: input.transitionId,
          scopeFingerprint: input.scopeFingerprint,
          stateVersion: 1,
          status: 'ACTIVE',
          ceiling: { ...input.ceiling },
          activeAssignments: [],
          resultTombstones: [],
          wip: { activeFeatureLeads: 0, features: [] },
          featureReplan: null,
          nextLegalAction: input.nextLegalAction
        },
        null
      )
      return state
    })
  }

  /** Loads the exact current state after fingerprint and invariant validation. */
  load(): AssignmentRuntimeState {
    if (!existsSync(this.statePath)) fail('ASSIGNMENT_STATE_NOT_FOUND', this.statePath)
    const database = this.openDatabase()
    try {
      const state = this.selectState(database)
      if (!state) fail('ASSIGNMENT_STATE_NOT_FOUND', this.statePath)
      return state
    } finally {
      database.close()
    }
  }

  /** Persists one child assignment with a state-version CAS and WIP enforcement. */
  dispatchChild(request: ChildAssignmentRequest): AssignmentRuntimeState {
    this.validateChildRequest(request)
    const requestFingerprint = objectFingerprint(
      request as unknown as Record<string, unknown>,
      '__none__'
    )
    return this.withWriteTransaction((database) => {
      const state = this.requireSelectedState(database)
      if (
        state.activeAssignments.some(
          (assignment) => assignment.requestFingerprint === requestFingerprint
        ) ||
        state.resultTombstones.some(
          (tombstone) => tombstone.assignment.requestFingerprint === requestFingerprint
        )
      )
        return state
      if (state.stateVersion !== request.expectedStateVersion)
        fail(
          'ASSIGNMENT_STATE_VERSION_MISMATCH',
          `${request.expectedStateVersion}/${state.stateVersion}`
        )
      if (state.status === 'FEATURE_REPLAN_REQUIRED')
        fail('ASSIGNMENT_DISPATCH_AFTER_FEATURE_REPLAN', request.childTaskId)
      if (
        (state.owner.role === 'STAGE_LEAD' && request.childRole !== 'FEATURE_LEAD') ||
        (state.owner.role === 'FEATURE_LEAD' && request.childRole === 'FEATURE_LEAD')
      )
        fail('ASSIGNMENT_OWNER_CHILD_ROUTE_INVALID', request.childRole)
      if (state.owner.role === 'FEATURE_LEAD' && request.featureKey !== state.featureKey)
        fail('ASSIGNMENT_FEATURE_OWNER_SCOPE_MISMATCH', request.featureKey)
      if (
        state.activeAssignments.some((assignment) => assignment.childTaskId === request.childTaskId)
      )
        fail('ASSIGNMENT_CHILD_ALREADY_ACTIVE', request.childTaskId)
      if (request.childTaskId === state.owner.taskId)
        fail('ASSIGNMENT_SELF_CHILD_ROUTE', request.childTaskId)
      if (
        request.childRole === 'FEATURE_LEAD' &&
        state.activeAssignments.some(
          (assignment) =>
            assignment.childRole === 'FEATURE_LEAD' && assignment.featureKey === request.featureKey
        )
      )
        fail('ASSIGNMENT_DUPLICATE_ACTIVE_FEATURE_OWNER', request.featureKey)
      const dispatchStateVersion = state.stateVersion + 1
      const base = {
        requestFingerprint,
        directExecutionParentTaskId: state.owner.taskId,
        childTaskId: request.childTaskId,
        childRole: request.childRole,
        featureKey: request.featureKey,
        transitionId: state.transitionId,
        dispatchStateVersion,
        expectedTypedResult: request.expectedTypedResult,
        nextLegalActionOnResult: request.nextLegalActionOnResult,
        scopeFingerprint: request.scopeFingerprint
      }
      const assignment: ActiveChildAssignment = {
        assignmentId: objectFingerprint(base as unknown as Record<string, unknown>, '__none__'),
        ...base
      }
      const activeAssignments = [...state.activeAssignments, assignment].sort((left, right) =>
        left.assignmentId.localeCompare(right.assignmentId)
      )
      const wip = deriveAssignmentWip(activeAssignments)
      requireWipWithinCeiling(wip, state.ceiling)
      return this.persistState(
        database,
        {
          ...state,
          stateVersion: dispatchStateVersion,
          status: 'WAITING_ON_CHILD',
          activeAssignments,
          wip,
          featureReplan: null,
          nextLegalAction: 'CONSUME_DIRECT_ASSIGNMENT_RESULT'
        },
        state.stateVersion
      )
    })
  }

  /** Applies an exact direct child result once and returns the stable original receipt on replay. */
  consumeResult(input: AssignmentResult): AssignmentResultReceipt {
    const result = validateAssignmentResult(input)
    return this.withWriteTransaction((database) => {
      const state = this.requireSelectedState(database)
      const completed = state.resultTombstones.find(
        (tombstone) => tombstone.assignment.assignmentId === result.assignmentId
      )
      if (completed) {
        if (completed.resultFingerprint !== result.resultFingerprint)
          fail('ASSIGNMENT_RESULT_CONFLICT', result.assignmentId)
        return completed.receipt
      }
      const assignment = state.activeAssignments.find(
        (candidate) => candidate.assignmentId === result.assignmentId
      )
      if (!assignment) fail('ASSIGNMENT_RESULT_STALE_OR_UNKNOWN', result.assignmentId)
      if (result.directExecutionParentTaskId !== state.owner.taskId)
        fail('ASSIGNMENT_RESULT_WRONG_PARENT', result.directExecutionParentTaskId)
      if (result.childTaskId !== assignment.childTaskId)
        fail('ASSIGNMENT_RESULT_WRONG_CHILD', result.childTaskId)
      if (result.transitionId !== state.transitionId)
        fail('ASSIGNMENT_RESULT_WRONG_TRANSITION', result.transitionId)
      if (result.dispatchStateVersion !== assignment.dispatchStateVersion)
        fail('ASSIGNMENT_RESULT_STALE_STATE', String(result.dispatchStateVersion))
      if (result.typedResult !== assignment.expectedTypedResult)
        fail('ASSIGNMENT_RESULT_UNEXPECTED_TYPE', result.typedResult)
      const activeAssignments = state.activeAssignments.filter(
        (candidate) => candidate.assignmentId !== assignment.assignmentId
      )
      const wip = deriveAssignmentWip(activeAssignments)
      requireWipWithinCeiling(wip, state.ceiling)
      const appliedStateVersion = state.stateVersion + 1
      const receipt: AssignmentResultReceipt = {
        schemaVersion: 1,
        kind: 'OES_ASSIGNMENT_RESULT_RECEIPT',
        assignmentId: assignment.assignmentId,
        resultFingerprint: result.resultFingerprint,
        appliedStateVersion,
        remainingAssignments: activeAssignments.length,
        wip,
        nextLegalAction: assignment.nextLegalActionOnResult
      }
      const resultTombstones = [
        ...state.resultTombstones,
        {
          assignment,
          resultFingerprint: result.resultFingerprint,
          receipt
        }
      ].sort((left, right) =>
        left.assignment.assignmentId.localeCompare(right.assignment.assignmentId)
      )
      const replanInvalidated = state.featureReplan !== null
      this.persistState(
        database,
        {
          ...state,
          stateVersion: appliedStateVersion,
          status: activeAssignments.length ? 'WAITING_ON_CHILD' : 'ACTIVE',
          activeAssignments,
          resultTombstones,
          wip,
          featureReplan: null,
          nextLegalAction: replanInvalidated
            ? 'REEVALUATE_FEATURE_REPLAN'
            : activeAssignments.length
              ? 'CONSUME_DIRECT_ASSIGNMENT_RESULT'
              : assignment.nextLegalActionOnResult
        },
        state.stateVersion
      )
      return receipt
    })
  }

  /** Evaluates and persists one exact bounded topology decision for this Feature owner. */
  recordFeatureReplanDecision(
    request: FeatureReplanRequest,
    exactStageState: AssignmentRuntimeState
  ): FeatureReplanDecision {
    const decision = decideFeatureReplan(request, exactStageState)
    return this.withWriteTransaction((database) => {
      const state = this.requireSelectedState(database)
      if (
        state.featureReplan?.decisionFingerprint === decision.decisionFingerprint &&
        state.stateVersion === request.stateVersion + 1
      )
        return decision
      if (state.featureReplan?.decision === 'FEATURE_REPLAN_REQUIRED')
        fail('FEATURE_REPLAN_ALREADY_RECORDED', state.featureReplan.decisionFingerprint)
      if (state.owner.role !== 'FEATURE_LEAD')
        fail('FEATURE_REPLAN_OWNER_ROLE_INVALID', state.owner.role)
      if (
        request.featureLeadTaskId !== state.owner.taskId ||
        request.stageLeadTaskId !== state.owner.directExecutionParentTaskId
      )
        fail('FEATURE_REPLAN_ROUTE_MISMATCH', request.featureLeadTaskId)
      if (
        request.stageKey !== state.stageKey ||
        request.featureKey !== state.featureKey ||
        request.transitionId !== state.transitionId ||
        request.scopeFingerprint !== state.scopeFingerprint
      )
        fail('FEATURE_REPLAN_BINDING_MISMATCH', request.requestFingerprint)
      if (request.stateVersion !== state.stateVersion)
        fail('FEATURE_REPLAN_STATE_VERSION_MISMATCH', String(request.stateVersion))
      if (canonicalJson(request.delegationCeiling) !== canonicalJson(state.ceiling))
        fail('FEATURE_REPLAN_CEILING_MISMATCH', request.featureKey)
      const storedFeature = state.wip.features.find(
        (feature) => feature.featureKey === state.featureKey
      ) ?? {
        featureKey: state.featureKey,
        activeImplementationTasks: 0,
        activeFeatureReviews: 0
      }
      const requestedFeature = request.oldTopology.features.find(
        (feature) => feature.featureKey === state.featureKey
      ) ?? {
        featureKey: state.featureKey,
        activeImplementationTasks: 0,
        activeFeatureReviews: 0
      }
      if (canonicalJson(storedFeature) !== canonicalJson(requestedFeature))
        fail('FEATURE_REPLAN_TOPOLOGY_MISMATCH', request.featureKey)
      const featureReplan = {
        decision: decision.decision,
        requestFingerprint: request.requestFingerprint,
        decisionFingerprint: decision.decisionFingerprint
      }
      const waiting = state.activeAssignments.length > 0
      this.persistState(
        database,
        {
          ...state,
          stateVersion: state.stateVersion + 1,
          status:
            decision.decision === 'FEATURE_REPLAN_REQUIRED'
              ? 'FEATURE_REPLAN_REQUIRED'
              : waiting
                ? 'WAITING_ON_CHILD'
                : 'ACTIVE',
          featureReplan,
          nextLegalAction:
            decision.decision === 'FEATURE_REPLAN_REQUIRED'
              ? decision.nextLegalAction
              : waiting
                ? 'CONSUME_DIRECT_ASSIGNMENT_RESULT'
                : decision.nextLegalAction
        },
        state.stateVersion
      )
      return decision
    })
  }

  /** Validates immutable initialization values before creating any state bytes. */
  private validateInitialization(input: AssignmentRuntimeInitialization): void {
    requireExactKeys(
      input,
      [
        'owner',
        'stageKey',
        'featureKey',
        'transitionId',
        'scopeFingerprint',
        'ceiling',
        'nextLegalAction'
      ],
      'initialization'
    )
    requireExactKeys(input.owner, ['role', 'taskId', 'directExecutionParentTaskId'], 'owner')
    if (!['STAGE_LEAD', 'FEATURE_LEAD'].includes(input.owner.role))
      fail('ASSIGNMENT_OWNER_ROLE_INVALID', input.owner.role)
    requireToken(input.owner.taskId, 'owner.taskId')
    requireToken(input.owner.directExecutionParentTaskId, 'owner.directExecutionParentTaskId')
    requireFeatureKey(input.stageKey, 'initialization.stageKey')
    requireFeatureKey(input.featureKey, 'initialization.featureKey')
    if (input.featureKey !== this.featureKey)
      fail('ASSIGNMENT_STORE_FEATURE_MISMATCH', input.featureKey)
    requireToken(input.transitionId, 'initialization.transitionId')
    requireFingerprint(input.scopeFingerprint, 'initialization.scopeFingerprint')
    validateCeiling(input.ceiling)
    requireAction(input.nextLegalAction, 'initialization.nextLegalAction')
  }

  /** Validates an exact dispatch request before taking the state lock. */
  private validateChildRequest(request: ChildAssignmentRequest): void {
    requireExactKeys(
      request,
      [
        'expectedStateVersion',
        'childTaskId',
        'childRole',
        'featureKey',
        'expectedTypedResult',
        'nextLegalActionOnResult',
        'scopeFingerprint'
      ],
      'childAssignmentRequest'
    )
    requireStateVersion(request.expectedStateVersion, 'request.expectedStateVersion')
    requireToken(request.childTaskId, 'request.childTaskId')
    if (!ASSIGNMENT_CHILD_ROLES.includes(request.childRole))
      fail('ASSIGNMENT_CHILD_ROLE_INVALID', request.childRole)
    requireFeatureKey(request.featureKey, 'request.featureKey')
    requireToken(request.expectedTypedResult, 'request.expectedTypedResult')
    requireAction(request.nextLegalActionOnResult, 'request.nextLegalActionOnResult')
    requireFingerprint(request.scopeFingerprint, 'request.scopeFingerprint')
  }

  /** Opens the single task-owned SQLite state file with immediate contention failure. */
  private openDatabase(): DatabaseSync {
    mkdirSync(dirname(this.statePath), { recursive: true })
    const database = new DatabaseSync(this.statePath)
    database.exec('PRAGMA busy_timeout = 0')
    return database
  }

  /** Runs one crash-safe SQLite mutation transaction without background retry. */
  private withWriteTransaction<T>(operation: (database: DatabaseSync) => T): T {
    const database = this.openDatabase()
    let transactionActive = false
    try {
      database.exec('BEGIN IMMEDIATE')
      transactionActive = true
      database.exec(
        'CREATE TABLE IF NOT EXISTS assignment_runtime_state (' +
          'feature_key TEXT PRIMARY KEY NOT NULL, ' +
          'state_version INTEGER NOT NULL, ' +
          'record_json TEXT NOT NULL)'
      )
      const result = operation(database)
      database.exec('COMMIT')
      transactionActive = false
      return result
    } catch (error) {
      if (transactionActive)
        try {
          database.exec('ROLLBACK')
        } catch {}
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
      const message = error instanceof Error ? error.message : String(error)
      if (code.includes('BUSY') || /database is locked/i.test(message))
        fail('ASSIGNMENT_STATE_BUSY', this.statePath)
      throw error
    } finally {
      database.close()
    }
  }

  /** Selects and validates the one exact feature row from the task-owned database. */
  private selectState(database: DatabaseSync): AssignmentRuntimeState | null {
    const table = database
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'assignment_runtime_state'"
      )
      .get() as { name: string } | undefined
    if (!table) return null
    const row = database
      .prepare(
        'SELECT state_version AS stateVersion, record_json AS recordJson ' +
          'FROM assignment_runtime_state WHERE feature_key = ?'
      )
      .get(this.featureKey) as { stateVersion: number; recordJson: string } | undefined
    if (!row) return null
    const state = validateAssignmentRuntimeState(
      JSON.parse(row.recordJson) as AssignmentRuntimeState
    )
    if (state.featureKey !== this.featureKey || state.stateVersion !== row.stateVersion)
      fail('ASSIGNMENT_SQLITE_ROW_BINDING_MISMATCH', this.featureKey)
    return state
  }

  /** Requires the initialized exact feature row inside a mutation transaction. */
  private requireSelectedState(database: DatabaseSync): AssignmentRuntimeState {
    const state = this.selectState(database)
    if (!state) fail('ASSIGNMENT_STATE_NOT_FOUND', this.statePath)
    return state
  }

  /** Normalizes, fingerprints, compare-and-swaps, and reopens one current state row. */
  private persistState(
    database: DatabaseSync,
    state: AssignmentRuntimeState,
    expectedPreviousStateVersion: number | null
  ): AssignmentRuntimeState {
    const normalized: AssignmentRuntimeState = {
      ...state,
      activeAssignments: [...state.activeAssignments].sort((left, right) =>
        left.assignmentId.localeCompare(right.assignmentId)
      ),
      resultTombstones: [...state.resultTombstones].sort((left, right) =>
        left.assignment.assignmentId.localeCompare(right.assignment.assignmentId)
      ),
      wip: deriveAssignmentWip(state.activeAssignments),
      recordFingerprint: ''
    }
    normalized.recordFingerprint = objectFingerprint(
      normalized as unknown as Record<string, unknown>,
      'recordFingerprint'
    )
    validateAssignmentRuntimeState(normalized)
    const recordJson = canonicalJson(normalized)
    const result =
      expectedPreviousStateVersion === null
        ? database
            .prepare(
              'INSERT INTO assignment_runtime_state(feature_key, state_version, record_json) ' +
                'VALUES (?, ?, ?)'
            )
            .run(this.featureKey, normalized.stateVersion, recordJson)
        : database
            .prepare(
              'UPDATE assignment_runtime_state SET state_version = ?, record_json = ? ' +
                'WHERE feature_key = ? AND state_version = ?'
            )
            .run(normalized.stateVersion, recordJson, this.featureKey, expectedPreviousStateVersion)
    if (Number(result.changes) !== 1) fail('ASSIGNMENT_STATE_VERSION_CAS_FAILED', this.featureKey)
    const reopened = this.requireSelectedState(database)
    if (canonicalJson(reopened) !== canonicalJson(normalized))
      fail('ASSIGNMENT_STATE_TRANSACTION_READBACK_MISMATCH', this.statePath)
    return reopened
  }
}
