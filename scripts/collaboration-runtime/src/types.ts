export const REMOTE_ACTIONS = [
  'preflight',
  'publish-pr',
  'verify-pr',
  'merge-pr',
  'verify-main',
  'cleanup'
] as const
export type RemoteAction = (typeof REMOTE_ACTIONS)[number]

export const REMOTE_STAGES = [
  'REMOTE_PREFLIGHT_VERIFIED',
  'REMOTE_MUTATION_RECORDED',
  'REMOTE_VERIFICATION_PENDING',
  'REMOTE_VERIFIED'
] as const
export type RemoteStage = (typeof REMOTE_STAGES)[number]

export interface RemoteOwner {
  role: 'Direct owner' | 'Global Unified Design' | 'Feature Lead' | 'Stage Lead'
  taskId: string
}

export interface PullRequestBinding {
  baseRef: 'main'
  draft: boolean
  number: number | null
  requiredChecks: string[]
  title: string
  body: string
}

export interface CleanupResourceBinding {
  kind: 'remote-branch' | 'local-branch' | 'worktree' | 'feature-packet'
  path: string
  expectedSha: string | null
}

export interface RemoteAdmissionBinding {
  mode: 'merge-queue' | 'serial-latest-main'
  lockPath: string | null
  mergeGroupSha: string | null
  mergeGroupBaseSha: string | null
}

export interface TrustedAuthorizationReference {
  path: string
  sha256: string
  fingerprint: string
}

export interface RemoteTrustRoots {
  authorizationRoot: string
  admissionRoot: string
  profilePath: string
  profileSha256: string
  ownerTaskId: string
  profileTransitionId: string
  profileExpectedState: EffectiveProfileReport['expectedState']
}

export interface RemoteAuthorizationRoot {
  schemaVersion: 1
  kind: 'OES_REMOTE_AUTHORIZATION_ROOT'
  recordFingerprint: string
  status: 'ACTIVE'
  issuerTaskId: string
  owner: RemoteOwner
  expectedState: string
  stateVersion: number
  transitionId: string
  rootConfirmationFingerprint: string
  scopeFingerprint: string
  truthBaseline: string
  repositoryRoot: string
  repositorySlug: string
  artifactRoot: string
  allowedActions: RemoteAction[]
  mergeAuthorizationFingerprint?: string
  cleanupAuthorizationFingerprint?: string
}

export interface RemoteActionAuthorization {
  schemaVersion: 1
  kind: 'OES_REMOTE_ACTION_AUTHORIZATION'
  authorizationFingerprint: string
  status: 'ISSUED'
  issuedBeforeRemoteMutation: true
  issuerTaskId: string
  rootAuthorization: TrustedAuthorizationReference
  owner: RemoteOwner
  expectedState: string
  stateVersion: number
  transitionId: string
  rootConfirmationFingerprint: string
  scopeFingerprint: string
  truthBaseline: string
  integrationBase: string
  candidateSha: string
  allowedAction: RemoteAction
  repositoryRoot: string
  repositorySlug: string
  artifactRoot: string
  headRef: string
  baseRef: 'main'
  singleUseNonce: string
  resourceSetFingerprint: string
  postcondition: string
  mergeAuthorizationFingerprint?: string
  cleanupAuthorizationFingerprint?: string
}

export interface RemoteDriverBinding {
  schemaVersion: 1
  kind: 'OES_REMOTE_DRIVER_BINDING'
  bindingFingerprint: string
  authorization: TrustedAuthorizationReference
  action: RemoteAction
  owner: RemoteOwner
  expectedState: string
  stateVersion: number
  transitionId: string
  scopeFingerprint: string
  truthBaseline: string
  integrationBase: string
  candidateSha: string
  repositoryRoot: string
  repositorySlug: string
  artifactRoot: string
  checkpointPath: string
  resultPath: string
  invalidationPath: string
  singleUseNonce: string
  headRef: string
  baseRef: 'main'
  pullRequest: PullRequestBinding
  mergeMethod: 'merge'
  expectedMergeSha?: string
  admission?: RemoteAdmissionBinding
  mergeAuthorizationFingerprint?: string
  cleanupAuthorizationFingerprint?: string
  cleanupResources?: CleanupResourceBinding[]
}

export interface PullRequestTruth {
  number: number
  state: 'OPEN' | 'CLOSED' | 'MERGED'
  draft: boolean
  baseRef: string
  headRef: string
  headSha: string
  mergeCommitSha: string | null
  title: string
  body: string
}

export interface RequiredCheckTruth {
  sha: string
  name: string
  status: string
  conclusion: string | null
  id: number
  startedAt?: string
  completedAt?: string | null
}

export interface RemoteTruth {
  branchHead: string | null
  mergeQueueEntry: {
    id: string
    position: number | null
    state: string
    baseSha: string
    headSha: string
  } | null
  mainHead: string
  pullRequest: PullRequestTruth | null
  requiredChecks: RequiredCheckTruth[]
  mainParents: string[]
  pullMergeParents: string[]
  reviewGate: {
    annotations: number
    issueComments: number
    reviewComments: number
    blockingReviews: number
    unresolvedThreads: number
  }
}

export interface RemoteReceipt {
  action: RemoteAction
  mutationPerformed: boolean
  recoveredFromRemoteTruth: boolean
  branchHead: string | null
  pullRequestNumber: number | null
  mergeCommitSha: string | null
  mergeGroupBaseSha?: string | null
  mergeGroupHeadSha?: string | null
  cleanupResources?: CleanupResourceBinding[]
}

export interface RemoteVerification {
  passed: boolean
  status: string
  literalResult: unknown
}

export interface RemoteCheckpoint {
  schemaVersion: 1
  kind: 'OES_REMOTE_DRIVER_CHECKPOINT'
  bindingFingerprint: string
  action: RemoteAction
  singleUseNonce: string
  stage: RemoteStage
  receipt: RemoteReceipt | null
  remoteTruthFingerprint: string
  updatedAt: string
}

export interface RemoteDriverResult {
  schemaVersion: 1
  kind: 'OES_REMOTE_DRIVER_RESULT'
  bindingFingerprint: string
  action: RemoteAction
  ownerTaskId: string
  singleUseNonce: string
  status: 'REMOTE_VERIFICATION_PENDING' | 'REMOTE_VERIFIED'
  stage: RemoteStage
  receipt: RemoteReceipt
  verification: RemoteVerification
  remoteTruth: RemoteTruth
  remoteMutation: boolean
}

export const CAPABILITY_NAMES = [
  'filesystemWrite',
  'gitSwitchAddCommit',
  'standardBuildTest',
  'taskOwnedDatabase',
  'localhostBind',
  'approvedNetworkRead',
  'credentialReference',
  'approvalTelemetry'
] as const
export type CapabilityName = (typeof CAPABILITY_NAMES)[number]

export interface CapabilityObservation {
  name: CapabilityName
  command: string
  literalOutput: string
  exitCode: number
  evidencePath: string
  evidenceSha256: string
  result: 'PASS' | 'FAIL'
}

export interface ApprovalTelemetry {
  eventSource: string
  eventSourceSha256: string
  approvalPolicy: 'on-request'
  approvalsReviewer: 'auto_review'
  approvalEventCount: number
  normalPermissionPromptCount: number
}

export interface EffectiveProfileReport {
  schemaVersion: 1
  kind: 'OES_EFFECTIVE_PROFILE_REPORT'
  ownerTaskId: string
  transitionId: string
  expectedState: 'HANDOFF_PENDING' | 'DELIVERY_ACTIVE'
  declaredCapabilities: CapabilityName[]
  profile: {
    name: string
    permission: string
    path: string
    sha256: string
  }
  observations: CapabilityObservation[]
  credentialReference: {
    reference: string
    keys: string[]
    secretValuesRecorded: false
  }
  telemetry: ApprovalTelemetry
}

export interface EvidenceKeyInput {
  candidateSha: string
  candidateTreeSha: string
  dependencyCandidates: DependencyCandidate[]
  dependencyFingerprint: string
  lockfileFingerprint: string
  toolchainFingerprint: string
  testConfigFingerprint: string
  environmentFingerprint: string
  literalInputsFingerprint: string
  executionProfileFingerprint: string
  commandFingerprint: string
  commandVersion: string
  literalResultFingerprint: string
  exitCode: number
  coverageIds: string[]
}

/** Identifies one exact dependency candidate included in an evidence execution. */
export interface DependencyCandidate {
  featureKey: string
  candidateSha: string
  candidateTreeSha: string
}

export interface EvidenceKey extends EvidenceKeyInput {
  schemaVersion: 1
  kind: 'OES_TEST_EVIDENCE_KEY'
  evidenceFingerprint: string
}

export interface RiskCoverage {
  id: string
  pathPatterns: string[]
  contractSensitive: boolean
}

export interface DriftAssessmentInput {
  previousEvidence: EvidenceKey | null
  nextEvidence: EvidenceKeyInput
  changedPaths: string[]
  coverage: RiskCoverage[]
  dependencyChanged: boolean
  profileChanged: boolean
  commandChanged: boolean
  contractChanged: boolean
  semanticConflict: boolean
}

export interface DriftAssessment {
  decision: 'REUSE_EXACT' | 'REFRESH_BASELINE' | 'FOCUSED' | 'FULL' | 'DESIGN_GAP'
  affectedCoverageIds: string[]
  reusableCoverageIds: string[]
  reason: string
}

export interface StageCleanupResource {
  kind: 'remote-branch' | 'local-branch' | 'worktree' | 'task-temp'
  path: string
  expectedSha: string | null
}

export interface TerminalFeatureCleanup {
  featureKey: string
  ownerTaskId: string
  candidateSha: string
  mergeSha: string
  featurePacket: string
  resources: StageCleanupResource[]
}

export interface StageCleanupAuthorization {
  schemaVersion: 1
  kind: 'OES_STAGE_CLEANUP_AUTHORIZATION'
  authorizationFingerprint: string
  status: 'ISSUED'
  expectedState: 'STAGE_CLEANUP_AUTHORIZED'
  stateVersion: number
  stageKey: string
  stageOwnerTaskId: string
  transitionId: string
  confirmationFingerprint: string
  terminalFeatures: TerminalFeatureCleanup[]
  cleanupOnlyBranch: string
  allowedDeletedFeaturePackets: string[]
}

export interface StageChildCleanupAuthorization {
  schemaVersion: 1
  kind: 'OES_STAGE_CHILD_CLEANUP_AUTHORIZATION'
  authorizationFingerprint: string
  status: 'ISSUED'
  rootAuthorization: TrustedAuthorizationReference
  expectedState: 'STAGE_CLEANUP_AUTHORIZED'
  stateVersion: number
  stageKey: string
  stageOwnerTaskId: string
  ownerTaskId: string
  transitionId: string
  confirmationFingerprint: string
  resources: StageCleanupResource[]
  postcondition: 'CHILD_SELF_CLEANUP'
}

export interface StageCleanupCurrentAuthorization {
  schemaVersion: 1
  kind: 'OES_STAGE_CLEANUP_CURRENT_AUTHORIZATION'
  recordFingerprint: string
  status: 'ACTIVE' | 'INVALIDATED' | 'COMPLETED'
  purpose: 'CHILD_SELF_CLEANUP' | 'STAGE_CLEANUP_VERIFY'
  rootAuthorization: TrustedAuthorizationReference
  childAuthorization: TrustedAuthorizationReference | null
  stageKey: string
  stageOwnerTaskId: string
  ownerTaskId: string
  expectedState: 'STAGE_CLEANUP_AUTHORIZED'
  stateVersion: number
  transitionId: string
  confirmationFingerprint: string
  postcondition: 'CURRENT_STAGE_CLEANUP'
}

export interface ObservedCleanupResource extends StageCleanupResource {
  exists: boolean
  clean: boolean
  actualSha: string | null
}

export interface CleanupResourceDecision {
  resource: StageCleanupResource
  decision: 'REMOVE' | 'ALREADY_ABSENT' | 'PRESERVE_FAILURE' | 'SKIP_COMPLETED'
  reason: string
  observedBefore: ObservedCleanupResource | null
  observedAfter: ObservedCleanupResource | null
  completionFingerprint?: string
}

export interface CompletedCleanupResource {
  resource: StageCleanupResource
  observedAfter: ObservedCleanupResource
  completionFingerprint: string
}

export interface CleanupDiffEntry {
  status: 'A' | 'C' | 'D' | 'M' | 'R' | 'T' | 'U' | 'X' | 'B'
  path: string
}

export interface StageMergeItem {
  order: number
  featureKey: string
  ownerTaskId: string
  pullRequestNumber: number
  integrationBase: string
  candidateSha: string
  patchFingerprint: string
  contentFingerprint: string
  scopeFingerprint: string
  riskFingerprint: string
  requiredChecks: ['Baseline Checks']
  featureRi: 'PASSED'
}

export interface StageMergeAuthorization {
  schemaVersion: 1
  kind: 'OES_STAGE_MERGE_AUTHORIZATION'
  authorizationFingerprint: string
  status: 'ISSUED'
  expectedState: 'STAGE_MERGE_AUTHORIZED'
  stateVersion: number
  stageKey: string
  stageOwnerTaskId: string
  transitionId: string
  confirmationFingerprint: string
  stageScopeFingerprint: string
  stageRiskFingerprint: string
  orderedSetFingerprint: string
  stageRi: 'PASSED'
  stopPoint: 'STOP_SAME_STAGE_SUFFIX_ON_FAILURE'
  items: StageMergeItem[]
}

export interface StageMergeItemResult {
  order: number
  featureKey: string
  candidateSha: string
  effectiveHeadSha: string
  state: 'PENDING' | 'FAILED' | 'MERGED_VERIFIED'
  acceptedMainSha: string | null
  mergeSha: string | null
  failureCode: string | null
}

export interface StageMergePlan {
  status: 'ADMIT_NEXT' | 'STOPPED_FAILURE' | 'COMPLETE'
  healthyPrefix: string[]
  nextItem: StageMergeItem | null
  blockedSuffix: string[]
  failure: StageMergeItemResult | null
}

export interface StageMergeTechnicalRevision {
  schemaVersion: 1
  kind: 'OES_STAGE_MERGE_TECHNICAL_REVISION'
  revisionFingerprint: string
  stageAuthorizationFingerprint: string
  featureKey: string
  order: number
  previousBase: string
  latestMain: string
  previousHead: string
  refreshedHead: string
  patchFingerprint: string
  contentFingerprint: string
  scopeFingerprint: string
  riskFingerprint: string
  orderedSetFingerprint: string
  decision: 'TECHNICALLY_EQUIVALENT'
}

export type StageLifecycleRole =
  | 'IT'
  | 'FEATURE_RI'
  | 'FL'
  | 'STAGE_DESIGN'
  | 'STAGE_RI'
  | 'SL'
  | 'GLOBAL_UD'

export interface StageLifecycleTask {
  taskId: string
  role: StageLifecycleRole
  ownerTaskId: string | null
  state: 'TERMINAL' | 'ACTIVE' | 'UNKNOWN'
}

export interface StageLifecycleInventory {
  schemaVersion: 1
  kind: 'OES_STAGE_LIFECYCLE_INVENTORY'
  inventoryFingerprint: string
  stageKey: string
  stageOwnerTaskId: string
  cleanupIntentDetected: true
  stageExit: 'PASSED' | 'PENDING' | 'FAILED'
  resourceCleanup: 'PENDING' | 'VERIFIED' | 'PARTIAL_FAILURE'
  createdRoster: StageLifecycleTask[]
  terminalTaskIds: string[]
}

export interface StageArchiveResult {
  taskId: string
  role: StageLifecycleRole
  state: 'ARCHIVED' | 'FAILED'
  resultFingerprint: string
}

export interface StageArchiveDecision {
  taskId: string
  role: StageLifecycleRole
  decision: 'ARCHIVE' | 'SKIP_ARCHIVED' | 'PRESERVE_BLOCKED' | 'EXCLUDE_GLOBAL_UD'
  reason: string
}

export interface StageLifecyclePlan {
  status:
    | 'WAIT_STAGE_EXIT'
    | 'WAIT_TERMINAL_ROSTER'
    | 'WAIT_RESOURCE_CLEANUP'
    | 'ARCHIVE_READY'
    | 'ARCHIVE_PARTIAL_FAILURE'
    | 'COMPLETE'
  decisions: StageArchiveDecision[]
}
