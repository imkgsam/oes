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
  dependencyFingerprint: string
  literalInputsFingerprint: string
  executionProfileFingerprint: string
  commandFingerprint: string
  literalResultFingerprint: string
  exitCode: number
  coverageIds: string[]
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
  kind: CleanupResourceBinding['kind']
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
  stageKey: string
  stageOwnerTaskId: string
  transitionId: string
  confirmationFingerprint: string
  terminalFeatures: TerminalFeatureCleanup[]
  cleanupOnlyBranch: string
  allowedDeletedFeaturePackets: string[]
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
