import { readFileSync } from 'node:fs'
import { sha256, writeJsonAtomic } from './canonical.ts'
import { validateProfileReportEnvelope } from './binding.ts'
import { fail } from './errors.ts'
import {
  CAPABILITY_NAMES,
  type ApprovalTelemetry,
  type CapabilityName,
  type CapabilityObservation,
  type EffectiveProfileReport
} from './types.ts'

export type CapabilityFailureRoute =
  | 'EXECUTION_ENVIRONMENT_NOT_READY'
  | 'EXECUTION_PROFILE_DEFECT'
  | 'PERMISSION_EXPANSION_REQUIRED'

export interface CapabilityIssue {
  expectedState: 'HANDOFF_PENDING' | 'DELIVERY_ACTIVE'
  capabilityDeclared: boolean
  operation: string
  literalFailure: string
}

export interface ProfileRepairPlan {
  route: CapabilityFailureRoute
  preserveOwner: boolean
  sameTransitionRetry: boolean
  additions: {
    filesystemRoots: string[]
    networkDomains: string[]
    allowLocalBinding: boolean
  }
  retainedDenies: string[]
}

export interface PreflightProbeAdapter {
  observe(name: CapabilityName): Promise<CapabilityObservation>
  credentialReference(): Promise<EffectiveProfileReport['credentialReference']>
  approvalTelemetry(): Promise<ApprovalTelemetry>
}

export interface PreflightRequest {
  ownerTaskId: string
  transitionId: string
  expectedState: EffectiveProfileReport['expectedState']
  declaredCapabilities: CapabilityName[]
  profile: EffectiveProfileReport['profile']
  resultPath: string
}

/** Routes a capability failure without converting an existing authorization into a new gate. */
export function classifyCapabilityIssue(issue: CapabilityIssue): CapabilityFailureRoute {
  if (!issue.capabilityDeclared) return 'PERMISSION_EXPANSION_REQUIRED'
  return issue.expectedState === 'HANDOFF_PENDING'
    ? 'EXECUTION_ENVIRONMENT_NOT_READY'
    : 'EXECUTION_PROFILE_DEFECT'
}

/** Produces a minimal same-transition repair while retaining protected denies. */
export function planProfileRepair(
  issue: CapabilityIssue,
  requested: { filesystemRoots?: string[]; networkDomains?: string[]; allowLocalBinding?: boolean }
): ProfileRepairPlan {
  const route = classifyCapabilityIssue(issue)
  const roots = [...new Set(requested.filesystemRoots ?? [])]
  const domains = [...new Set(requested.networkDomains ?? [])]
  if (
    roots.some((root) => root === '/' || root.includes('**')) ||
    domains.some((domain) => domain === '*')
  ) {
    fail('UNBOUNDED_PROFILE_REPAIR_REJECTED', issue.operation)
  }
  return {
    route,
    preserveOwner: issue.expectedState === 'DELIVERY_ACTIVE',
    sameTransitionRetry: route !== 'PERMISSION_EXPANSION_REQUIRED',
    additions: {
      filesystemRoots: roots.sort(),
      networkDomains: domains.sort(),
      allowLocalBinding: requested.allowLocalBinding === true
    },
    retainedDenies: [
      'secret values',
      'private keys',
      'production/shared data',
      'cross-owner resources',
      'host/system privilege'
    ]
  }
}

/** Extracts credential field names while discarding all credential values. */
export function credentialReferenceKeys(output: string): string[] {
  return [
    ...new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.split('=', 1)[0])
        .filter(Boolean)
    )
  ].sort()
}

/** Reads Codex rollout telemetry and counts approval events and normal user prompts. */
export function readApprovalTelemetry(eventSource: string): ApprovalTelemetry {
  const bytes = readFileSync(eventSource)
  let approvalPolicy: string | undefined
  let approvalsReviewer: string | undefined
  let approvalEventCount = 0
  let normalPermissionPromptCount = 0
  for (const line of bytes.toString('utf8').split(/\r?\n/)) {
    if (!line) continue
    let event: Record<string, unknown>
    try {
      event = JSON.parse(line) as Record<string, unknown>
    } catch {
      continue
    }
    const payload =
      event.payload && typeof event.payload === 'object'
        ? (event.payload as Record<string, unknown>)
        : undefined
    if (event.type === 'turn_context' && payload) {
      approvalPolicy = String(payload.approval_policy)
      approvalsReviewer = String(payload.approvals_reviewer)
    }
    const payloadType = payload?.type
    if (
      ['exec_approval_request', 'apply_patch_approval_request', 'mcp_approval_request'].includes(
        String(payloadType)
      )
    )
      approvalEventCount += 1
    if (['request_user_input', 'user_approval_request'].includes(String(payloadType)))
      normalPermissionPromptCount += 1
  }
  if (approvalPolicy !== 'on-request' || approvalsReviewer !== 'auto_review') {
    fail('APPROVAL_TELEMETRY_PROFILE_MISMATCH', `${approvalPolicy}/${approvalsReviewer}`)
  }
  return {
    eventSource,
    eventSourceSha256: sha256(bytes),
    approvalPolicy: 'on-request',
    approvalsReviewer: 'auto_review',
    approvalEventCount,
    normalPermissionPromptCount
  }
}

/** Validates exact capability observations, credential keys and zero-prompt telemetry. */
export function verifyEffectiveProfileReport(
  input: EffectiveProfileReport
): EffectiveProfileReport {
  const report = validateProfileReportEnvelope(input)
  const declared = new Set(report.declaredCapabilities)
  const observed = new Map<CapabilityName, CapabilityObservation>()
  for (const observation of report.observations) {
    if (observed.has(observation.name)) fail('DUPLICATE_CAPABILITY_OBSERVATION', observation.name)
    observed.set(observation.name, observation)
  }
  for (const capability of declared) {
    const observation = observed.get(capability)
    if (!observation) fail('CAPABILITY_OBSERVATION_MISSING', capability)
    if (observation.exitCode !== 0 || observation.result !== 'PASS') {
      fail('DECLARED_CAPABILITY_FAILED', `${capability}: ${observation.literalOutput}`)
    }
  }
  if (observed.size !== declared.size)
    fail('UNDECLARED_CAPABILITY_OBSERVATION', String(observed.size))
  const credentialKeys = [...report.credentialReference.keys].sort()
  if (
    report.credentialReference.secretValuesRecorded !== false ||
    !credentialKeys.includes('username') ||
    !credentialKeys.includes('password')
  ) {
    fail('CREDENTIAL_REFERENCE_INVALID', report.credentialReference.reference)
  }
  if (
    report.telemetry.approvalPolicy !== 'on-request' ||
    report.telemetry.approvalsReviewer !== 'auto_review' ||
    report.telemetry.normalPermissionPromptCount !== 0 ||
    !/^[0-9a-f]{64}$/.test(report.telemetry.eventSourceSha256)
  ) {
    fail('APPROVAL_TELEMETRY_INVALID', String(report.telemetry.normalPermissionPromptCount))
  }
  return report
}

/** Executes every declared probe, verifies the complete report, and atomically records it. */
export async function runEffectiveProfilePreflight(
  request: PreflightRequest,
  adapter: PreflightProbeAdapter
): Promise<EffectiveProfileReport> {
  const observations: CapabilityObservation[] = []
  for (const capability of request.declaredCapabilities)
    observations.push(await adapter.observe(capability))
  const report: EffectiveProfileReport = {
    schemaVersion: 1,
    kind: 'OES_EFFECTIVE_PROFILE_REPORT',
    ownerTaskId: request.ownerTaskId,
    transitionId: request.transitionId,
    expectedState: request.expectedState,
    declaredCapabilities: [...request.declaredCapabilities],
    profile: request.profile,
    observations,
    credentialReference: await adapter.credentialReference(),
    telemetry: await adapter.approvalTelemetry()
  }
  verifyEffectiveProfileReport(report)
  writeJsonAtomic(request.resultPath, report)
  return verifyEffectiveProfileReport(report)
}

/** Provides the full default capability set used by root delivery handoff smoke. */
export function defaultDeliveryCapabilities(): CapabilityName[] {
  return [...CAPABILITY_NAMES]
}
