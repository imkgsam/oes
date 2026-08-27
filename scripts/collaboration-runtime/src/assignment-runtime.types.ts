export const ASSIGNMENT_CHILD_ROLES = [
  'FEATURE_LEAD',
  'IMPLEMENTATION_TASK',
  'FEATURE_REVIEW'
] as const
export type AssignmentChildRole = (typeof ASSIGNMENT_CHILD_ROLES)[number]

export type AssignmentOwnerRole = 'STAGE_LEAD' | 'FEATURE_LEAD'

export interface AssignmentOwnerBinding {
  role: AssignmentOwnerRole
  taskId: string
  directExecutionParentTaskId: string
}

export interface AssignmentWipCeiling {
  maxActiveFeatureLeads: number
  maxActiveImplementationTasksPerFeature: number
  maxActiveFeatureReviewsPerFeature: 1
}

export interface FeatureWipSnapshot {
  featureKey: string
  activeImplementationTasks: number
  activeFeatureReviews: number
}

export interface AssignmentWipSnapshot {
  activeFeatureLeads: number
  features: FeatureWipSnapshot[]
}

export interface StageWipAuthorityBinding {
  schemaVersion: 1
  kind: 'OES_STAGE_WIP_AUTHORITY_BINDING'
  authorityFingerprint: string
  stageLeadTaskId: string
  stageKey: string
  transitionId: string
  stageStateVersion: number
  stageStateFingerprint: string
  activeFeatureLeads: number
  activeFeatureKeys: string[]
  ceiling: AssignmentWipCeiling
}

export interface AssignmentRuntimeInitialization {
  owner: AssignmentOwnerBinding
  stageKey: string
  featureKey: string
  transitionId: string
  scopeFingerprint: string
  ceiling: AssignmentWipCeiling
  nextLegalAction: string
}

export interface ChildAssignmentRequest {
  expectedStateVersion: number
  childTaskId: string
  childRole: AssignmentChildRole
  featureKey: string
  expectedTypedResult: string
  nextLegalActionOnResult: string
  scopeFingerprint: string
  resultArtifactRoot: string
}

export interface AssignmentResultArtifactRootIdentity {
  physicalPath: string
  device: string
  inode: string
  fileType: 'DIRECTORY'
}

export interface ActiveChildAssignment {
  assignmentId: string
  requestFingerprint: string
  directExecutionParentTaskId: string
  childTaskId: string
  childRole: AssignmentChildRole
  featureKey: string
  transitionId: string
  dispatchStateVersion: number
  expectedTypedResult: string
  nextLegalActionOnResult: string
  scopeFingerprint: string
  resultArtifactRoot: string
  resultArtifactRootIdentity: AssignmentResultArtifactRootIdentity
}

export interface AssignmentResultArtifact {
  path: string
  sha256: string
  fingerprint: string
}

export interface AssignmentResultArtifactPayloadInput {
  assignmentId: string
  directExecutionParentTaskId: string
  childTaskId: string
  transitionId: string
  dispatchStateVersion: number
  typedResult: string
  scopeFingerprint: string
}

export interface AssignmentResultArtifactPayload extends AssignmentResultArtifactPayloadInput {
  schemaVersion: 1
  kind: 'OES_ASSIGNMENT_RESULT_ARTIFACT'
  artifactFingerprint: string
}

export interface AssignmentResultInput {
  assignmentId: string
  directExecutionParentTaskId: string
  childTaskId: string
  transitionId: string
  dispatchStateVersion: number
  typedResult: string
  resultArtifact: AssignmentResultArtifact
}

export interface AssignmentResult extends AssignmentResultInput {
  schemaVersion: 1
  kind: 'OES_ASSIGNMENT_RESULT'
  resultFingerprint: string
  assignmentId: string
  directExecutionParentTaskId: string
  childTaskId: string
  transitionId: string
  dispatchStateVersion: number
  typedResult: string
  resultArtifact: AssignmentResultArtifact
}

export interface AssignmentResultReceipt {
  schemaVersion: 1
  kind: 'OES_ASSIGNMENT_RESULT_RECEIPT'
  assignmentId: string
  resultFingerprint: string
  appliedStateVersion: number
  remainingAssignments: number
  wip: AssignmentWipSnapshot
  nextLegalAction: string
}

export interface AssignmentResultTombstone {
  assignment: ActiveChildAssignment
  resultFingerprint: string
  receipt: AssignmentResultReceipt
}

export type AssignmentRuntimeStatus = 'ACTIVE' | 'WAITING_ON_CHILD' | 'FEATURE_REPLAN_REQUIRED'

export interface FeatureReplanStateMarker {
  decision: FeatureReplanDecisionKind
  requestFingerprint: string
  decisionFingerprint: string
}

export interface AssignmentRuntimeState {
  schemaVersion: 1
  kind: 'OES_ASSIGNMENT_RUNTIME_STATE'
  recordFingerprint: string
  owner: AssignmentOwnerBinding
  stageKey: string
  featureKey: string
  transitionId: string
  scopeFingerprint: string
  stateVersion: number
  status: AssignmentRuntimeStatus
  ceiling: AssignmentWipCeiling
  activeAssignments: ActiveChildAssignment[]
  resultTombstones: AssignmentResultTombstone[]
  wip: AssignmentWipSnapshot
  featureReplan: FeatureReplanStateMarker | null
  nextLegalAction: string
}

export interface IndependentDeliveryProof {
  independentCandidate: boolean
  independentFeatureReview: boolean
  independentPullRequest: boolean
  safeIndependentMainMerge: boolean
}

export interface FeatureReplanSiblingInput {
  featureKey: string
  objective: string
  scope: string[]
  protectedScope: string[]
  writeSet: string[]
  dependencies: string[]
  acceptance: string[]
  requiredCapabilityFingerprint: string
  independenceProof: IndependentDeliveryProof
}

export interface FeatureReplanSibling extends FeatureReplanSiblingInput {
  scopeFingerprint: string
}

export interface CompletedSliceBinding {
  sliceId: string
  commitSha: string
  candidateSha: string | null
  evidenceFingerprints: string[]
}

export interface FeatureOwnerResources {
  ownerRef: string
  ownerClone: string
  taskTemp: string
  featurePacket: string
}

export const FEATURE_REPLAN_INVALIDATION_CONDITIONS = [
  'OWNER_OR_PARENT_CHANGED',
  'STAGE_OR_FEATURE_KEY_CHANGED',
  'TRANSITION_OR_STATE_VERSION_CHANGED',
  'SCOPE_OR_PROTECTED_SCOPE_CHANGED',
  'ROOT_AUTHORIZATION_CHANGED',
  'TOPOLOGY_OR_CEILING_CHANGED',
  'SIBLING_BINDING_CHANGED',
  'COMPLETED_WORK_OR_EVIDENCE_CHANGED',
  'RESOURCE_BINDING_CHANGED'
] as const
export type FeatureReplanInvalidationCondition =
  (typeof FEATURE_REPLAN_INVALIDATION_CONDITIONS)[number]

export interface FeatureReplanRequestInput {
  stageLeadTaskId: string
  featureLeadTaskId: string
  stageKey: string
  featureKey: string
  transitionId: string
  stateVersion: number
  scopeFingerprint: string
  rootAuthorizationFingerprint: string
  stageWipAuthority: StageWipAuthorityBinding
  oldTopology: AssignmentWipSnapshot
  delegationCeiling: AssignmentWipCeiling
  retainedWriteSet: string[]
  currentResources: FeatureOwnerResources
  completedSlices: CompletedSliceBinding[]
  proposedSiblings: FeatureReplanSibling[]
}

export interface FeatureReplanRequest extends FeatureReplanRequestInput {
  schemaVersion: 1
  kind: 'OES_FEATURE_REPLAN_REQUEST'
  requestFingerprint: string
  invalidationConditions: FeatureReplanInvalidationCondition[]
}

export type FeatureReplanDecisionKind = 'FEATURE_REPLAN_REQUIRED' | 'ATOMIC_CONTINUATION'

export interface FeatureReplanDecision {
  schemaVersion: 1
  kind: 'OES_FEATURE_REPLAN_DECISION'
  decisionFingerprint: string
  decision: FeatureReplanDecisionKind
  request: FeatureReplanRequest
  newTopology: AssignmentWipSnapshot
  nextLegalAction:
    | 'RETURN_FEATURE_REPLAN_REQUIRED_TO_DIRECT_PARENT'
    | 'CONTINUE_ORIGINAL_FEATURE_WITH_BOUNDED_ITS'
  reason: string
}
