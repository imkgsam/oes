import { canonicalJson, objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import {
  assessDrift,
  createEvidenceKey,
  validateEvidenceKey,
  type CompleteEvidenceKey,
  type CompleteEvidenceKeyInput
} from './evidence.ts'
import type { RiskCoverage } from './types.ts'

export const VALIDATION_TIERS = ['FOCUSED_DEVELOPMENT', 'CANDIDATE_AFFECTED', 'FULL_GATE'] as const
export type ValidationTier = (typeof VALIDATION_TIERS)[number]
export type ValidationGateContext = 'NONE' | 'FEATURE' | 'STAGE'

/** Binds one runnable validation command to one exact evidence identity and coverage map. */
export interface ValidationCommandRequest {
  commandId: string
  command: string
  tier: ValidationTier
  coverage: RiskCoverage[]
  previousEvidence: CompleteEvidenceKey | null
  nextEvidence: CompleteEvidenceKeyInput
}

/** Supplies one bounded lifecycle-tier planning request. */
export interface ValidationPlanInput {
  tier: ValidationTier
  gateContext: ValidationGateContext
  changedPaths: string[]
  dependencyChanged: boolean
  profileChanged: boolean
  commandChanged: boolean
  contractChanged: boolean
  semanticConflict: boolean
  commands: ValidationCommandRequest[]
}

/** Records one command that must execute because its prior evidence is missing or invalidated. */
export interface ValidationRunAction {
  commandId: string
  command: string
  tier: ValidationTier
  driftDecision: 'FOCUSED' | 'FULL'
  coverageIds: string[]
  affectedCoverageIds: string[]
  priorEvidenceFingerprint: string | null
  reason: string
}

/** Records one exact or baseline-refreshed evidence result that remains reusable. */
export interface ValidationReuseAction {
  commandId: string
  command: string
  tier: ValidationTier
  driftDecision: 'REUSE_EXACT' | 'REFRESH_BASELINE'
  coverageIds: string[]
  priorEvidenceFingerprint: string
  evidence: CompleteEvidenceKey
  reason: string
}

/** Records one frozen semantic conflict that stops execution planning. */
export interface ValidationDesignGap {
  reason: 'frozen semantic conflict'
  commandIds: string[]
  affectedCoverageIds: string[]
}

/** Persists the deterministic decision for one validation lifecycle tier. */
export interface ValidationPlan {
  schemaVersion: 1
  kind: 'OES_VALIDATION_PLAN'
  result: 'PLAN_READY' | 'DESIGN_GAP'
  tier: ValidationTier
  gateContext: ValidationGateContext
  candidateSha: string
  candidateTreeSha: string
  changedPaths: string[]
  runActions: ValidationRunAction[]
  reuseActions: ValidationReuseAction[]
  invalidatedEvidenceFingerprints: string[]
  reusableEvidenceFingerprints: string[]
  designGap: ValidationDesignGap | null
  planFingerprint: string
}

const SHA1_PATTERN = /^[0-9a-f]{40}$/
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const PLAN_KEYS = [
  'schemaVersion',
  'kind',
  'result',
  'tier',
  'gateContext',
  'candidateSha',
  'candidateTreeSha',
  'changedPaths',
  'runActions',
  'reuseActions',
  'invalidatedEvidenceFingerprints',
  'reusableEvidenceFingerprints',
  'designGap',
  'planFingerprint'
] as const
const RUN_ACTION_KEYS = [
  'commandId',
  'command',
  'tier',
  'driftDecision',
  'coverageIds',
  'affectedCoverageIds',
  'priorEvidenceFingerprint',
  'reason'
] as const
const REUSE_ACTION_KEYS = [
  'commandId',
  'command',
  'tier',
  'driftDecision',
  'coverageIds',
  'priorEvidenceFingerprint',
  'evidence',
  'reason'
] as const

/** Fails when a persisted plan record contains missing or unknown fields. */
function requireExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  code: string
): void {
  if (canonicalJson(Object.keys(value).sort()) !== canonicalJson([...expected].sort()))
    fail(code, Object.keys(value).sort().join(','))
}

/** Requires one canonical non-empty identifier. */
function requireIdentity(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value)
    fail('VALIDATION_PLAN_IDENTITY_INVALID', field)
  return value
}

/** Requires one repository-relative changed path without traversal aliases. */
function requireRepositoryPath(path: string): void {
  const segments = path.split('/')
  if (
    path.length === 0 ||
    path.startsWith('/') ||
    path.endsWith('/') ||
    segments.some((segment) => segment === '' || segment === '.' || segment === '..')
  )
    fail('VALIDATION_PLAN_CHANGED_PATH_INVALID', path)
}

/** Requires one lowercase Git object id. */
function requireSha1(value: unknown, field: string): string {
  if (typeof value !== 'string' || !SHA1_PATTERN.test(value))
    fail('VALIDATION_PLAN_SHA_INVALID', field)
  return value
}

/** Requires one lowercase SHA-256 fingerprint. */
function requireSha256(value: unknown, field: string): string {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value))
    fail('VALIDATION_PLAN_FINGERPRINT_INVALID', field)
  return value
}

/** Requires a non-empty, unique, canonically sorted identifier array. */
function requireCanonicalIdentifiers(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0)
    fail('VALIDATION_PLAN_IDENTIFIERS_INVALID', field)
  const identifiers = value.map((item, index) => requireIdentity(item, `${field}[${index}]`))
  const canonical = [...new Set(identifiers)].sort()
  if (canonicalJson(identifiers) !== canonicalJson(canonical))
    fail('VALIDATION_PLAN_IDENTIFIERS_NON_CANONICAL', field)
  return identifiers
}

/** Requires a unique, canonically sorted SHA-256 array. */
function requireCanonicalFingerprints(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) fail('VALIDATION_PLAN_FINGERPRINTS_INVALID', field)
  const fingerprints = value.map((item, index) => requireSha256(item, `${field}[${index}]`))
  const canonical = [...new Set(fingerprints)].sort()
  if (canonicalJson(fingerprints) !== canonicalJson(canonical))
    fail('VALIDATION_PLAN_FINGERPRINTS_NON_CANONICAL', field)
  return fingerprints
}

/** Enforces the exact gate context allowed by each lifecycle tier. */
function validateGateContext(tier: ValidationTier, gateContext: ValidationGateContext): void {
  if (tier === 'FULL_GATE' && !['FEATURE', 'STAGE'].includes(gateContext))
    fail('VALIDATION_PLAN_GATE_CONTEXT_INVALID', `${tier}:${gateContext}`)
  if (tier !== 'FULL_GATE' && gateContext !== 'NONE')
    fail('VALIDATION_PLAN_GATE_CONTEXT_INVALID', `${tier}:${gateContext}`)
}

/** Creates a deterministic focused, affected, or full-gate validation plan. */
export function createValidationPlan(input: ValidationPlanInput): ValidationPlan {
  if (!VALIDATION_TIERS.includes(input.tier)) fail('VALIDATION_PLAN_TIER_INVALID', input.tier)
  validateGateContext(input.tier, input.gateContext)
  if (input.commands.length === 0) fail('VALIDATION_PLAN_COMMANDS_EMPTY', input.tier)
  const changedPaths = [...new Set(input.changedPaths)].sort()
  changedPaths.forEach(requireRepositoryPath)
  const commands = [...input.commands].sort((left, right) =>
    left.commandId.localeCompare(right.commandId)
  )
  const duplicate = commands.find(
    (command, index) => commands.findIndex((item) => item.commandId === command.commandId) !== index
  )
  if (duplicate) fail('VALIDATION_PLAN_COMMAND_DUPLICATE', duplicate.commandId)
  for (const command of commands) {
    requireIdentity(command.commandId, 'commandId')
    requireIdentity(command.command, command.commandId)
    if (command.tier !== input.tier)
      fail('VALIDATION_PLAN_COMMAND_TIER_MISMATCH', `${command.commandId}:${command.tier}`)
  }
  const candidateSha = commands[0].nextEvidence.candidateSha
  const candidateTreeSha = commands[0].nextEvidence.candidateTreeSha
  if (
    commands.some(
      (command) =>
        command.nextEvidence.candidateSha !== candidateSha ||
        command.nextEvidence.candidateTreeSha !== candidateTreeSha
    )
  )
    fail('VALIDATION_PLAN_CANDIDATE_MISMATCH', candidateSha)

  const assessments = commands.map((command) => ({
    command,
    assessment: assessDrift({
      previousEvidence: command.previousEvidence,
      nextEvidence: command.nextEvidence,
      changedPaths,
      coverage: command.coverage,
      dependencyChanged: input.dependencyChanged,
      profileChanged: input.profileChanged,
      commandChanged: input.commandChanged,
      contractChanged: input.contractChanged,
      semanticConflict: input.semanticConflict
    })
  }))
  const gapAssessments = assessments.filter(
    ({ assessment }) => assessment.decision === 'DESIGN_GAP'
  )
  if (gapAssessments.length > 0) {
    const base = {
      schemaVersion: 1 as const,
      kind: 'OES_VALIDATION_PLAN' as const,
      result: 'DESIGN_GAP' as const,
      tier: input.tier,
      gateContext: input.gateContext,
      candidateSha,
      candidateTreeSha,
      changedPaths,
      runActions: [],
      reuseActions: [],
      invalidatedEvidenceFingerprints: [
        ...new Set(
          commands.flatMap((command) =>
            command.previousEvidence ? [command.previousEvidence.evidenceFingerprint] : []
          )
        )
      ].sort(),
      reusableEvidenceFingerprints: [],
      designGap: {
        reason: 'frozen semantic conflict' as const,
        commandIds: gapAssessments.map(({ command }) => command.commandId),
        affectedCoverageIds: [
          ...new Set(gapAssessments.flatMap(({ assessment }) => assessment.affectedCoverageIds))
        ].sort()
      }
    }
    return {
      ...base,
      planFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
    }
  }

  const runActions: ValidationRunAction[] = []
  const reuseActions: ValidationReuseAction[] = []
  const invalidatedEvidenceFingerprints: string[] = []
  for (const { command, assessment } of assessments) {
    if (assessment.decision === 'REUSE_EXACT' || assessment.decision === 'REFRESH_BASELINE') {
      if (!command.previousEvidence)
        fail('VALIDATION_PLAN_REUSE_WITHOUT_PRIOR_EVIDENCE', command.commandId)
      const evidence =
        assessment.decision === 'REUSE_EXACT'
          ? command.previousEvidence
          : createEvidenceKey(command.nextEvidence)
      reuseActions.push({
        commandId: command.commandId,
        command: command.command,
        tier: command.tier,
        driftDecision: assessment.decision,
        coverageIds: [...command.nextEvidence.coverageIds].sort(),
        priorEvidenceFingerprint: command.previousEvidence.evidenceFingerprint,
        evidence,
        reason: assessment.reason
      })
      continue
    }
    if (assessment.decision !== 'FOCUSED' && assessment.decision !== 'FULL')
      fail('VALIDATION_PLAN_DRIFT_DECISION_INVALID', assessment.decision)
    runActions.push({
      commandId: command.commandId,
      command: command.command,
      tier: command.tier,
      driftDecision: assessment.decision,
      coverageIds: [...command.nextEvidence.coverageIds].sort(),
      affectedCoverageIds: assessment.affectedCoverageIds,
      priorEvidenceFingerprint: command.previousEvidence?.evidenceFingerprint ?? null,
      reason: assessment.reason
    })
    if (command.previousEvidence)
      invalidatedEvidenceFingerprints.push(command.previousEvidence.evidenceFingerprint)
  }
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_VALIDATION_PLAN' as const,
    result: 'PLAN_READY' as const,
    tier: input.tier,
    gateContext: input.gateContext,
    candidateSha,
    candidateTreeSha,
    changedPaths,
    runActions,
    reuseActions,
    invalidatedEvidenceFingerprints: [...new Set(invalidatedEvidenceFingerprints)].sort(),
    reusableEvidenceFingerprints: [
      ...new Set(reuseActions.map((action) => action.evidence.evidenceFingerprint))
    ].sort(),
    designGap: null
  }
  return {
    ...base,
    planFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
}

/** Verifies one persisted validation plan has not been altered. */
export function validateValidationPlan(plan: ValidationPlan): ValidationPlan {
  const record = plan as unknown as Record<string, unknown>
  requireExactKeys(record, PLAN_KEYS, 'VALIDATION_PLAN_SHAPE_INVALID')
  if (record.schemaVersion !== 1 || record.kind !== 'OES_VALIDATION_PLAN')
    fail('VALIDATION_PLAN_KIND_INVALID', `${String(record.schemaVersion)}:${String(record.kind)}`)
  if (!VALIDATION_TIERS.includes(record.tier as ValidationTier))
    fail('VALIDATION_PLAN_TIER_INVALID', String(record.tier))
  const tier = record.tier as ValidationTier
  if (!['NONE', 'FEATURE', 'STAGE'].includes(String(record.gateContext)))
    fail('VALIDATION_PLAN_GATE_CONTEXT_INVALID', String(record.gateContext))
  const gateContext = record.gateContext as ValidationGateContext
  validateGateContext(tier, gateContext)
  const candidateSha = requireSha1(record.candidateSha, 'candidateSha')
  const candidateTreeSha = requireSha1(record.candidateTreeSha, 'candidateTreeSha')
  if (!Array.isArray(record.changedPaths))
    fail('VALIDATION_PLAN_CHANGED_PATHS_INVALID', 'not an array')
  const changedPaths = record.changedPaths.map((path, index) => {
    if (typeof path !== 'string')
      fail('VALIDATION_PLAN_CHANGED_PATH_INVALID', `changedPaths[${index}]`)
    requireRepositoryPath(path)
    return path
  })
  if (canonicalJson(changedPaths) !== canonicalJson([...new Set(changedPaths)].sort()))
    fail('VALIDATION_PLAN_CHANGED_PATHS_NON_CANONICAL', changedPaths.join(','))
  if (!Array.isArray(record.runActions) || !Array.isArray(record.reuseActions))
    fail('VALIDATION_PLAN_ACTIONS_INVALID', 'not arrays')

  const runActions = record.runActions.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      fail('VALIDATION_PLAN_RUN_ACTION_INVALID', String(index))
    const action = value as unknown as Record<string, unknown>
    requireExactKeys(action, RUN_ACTION_KEYS, 'VALIDATION_PLAN_RUN_ACTION_SHAPE_INVALID')
    const commandId = requireIdentity(action.commandId, `runActions[${index}].commandId`)
    requireIdentity(action.command, `runActions[${index}].command`)
    if (action.tier !== tier)
      fail('VALIDATION_PLAN_ACTION_TIER_MISMATCH', `${commandId}:${String(action.tier)}`)
    if (action.driftDecision !== 'FOCUSED' && action.driftDecision !== 'FULL')
      fail('VALIDATION_PLAN_DRIFT_DECISION_INVALID', String(action.driftDecision))
    const coverageIds = requireCanonicalIdentifiers(
      action.coverageIds,
      `runActions[${index}].coverageIds`
    )
    const affectedCoverageIds = requireCanonicalIdentifiers(
      action.affectedCoverageIds,
      `runActions[${index}].affectedCoverageIds`
    )
    if (affectedCoverageIds.some((id) => !coverageIds.includes(id)))
      fail('VALIDATION_PLAN_AFFECTED_COVERAGE_INVALID', commandId)
    if (
      action.driftDecision === 'FULL' &&
      canonicalJson(affectedCoverageIds) !== canonicalJson(coverageIds)
    )
      fail('VALIDATION_PLAN_FULL_COVERAGE_INCOMPLETE', commandId)
    if (action.priorEvidenceFingerprint !== null)
      requireSha256(
        action.priorEvidenceFingerprint,
        `runActions[${index}].priorEvidenceFingerprint`
      )
    requireIdentity(action.reason, `runActions[${index}].reason`)
    return action as unknown as ValidationRunAction
  })

  const reuseActions = record.reuseActions.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      fail('VALIDATION_PLAN_REUSE_ACTION_INVALID', String(index))
    const action = value as unknown as Record<string, unknown>
    requireExactKeys(action, REUSE_ACTION_KEYS, 'VALIDATION_PLAN_REUSE_ACTION_SHAPE_INVALID')
    const commandId = requireIdentity(action.commandId, `reuseActions[${index}].commandId`)
    requireIdentity(action.command, `reuseActions[${index}].command`)
    if (action.tier !== tier)
      fail('VALIDATION_PLAN_ACTION_TIER_MISMATCH', `${commandId}:${String(action.tier)}`)
    if (action.driftDecision !== 'REUSE_EXACT' && action.driftDecision !== 'REFRESH_BASELINE')
      fail('VALIDATION_PLAN_DRIFT_DECISION_INVALID', String(action.driftDecision))
    const coverageIds = requireCanonicalIdentifiers(
      action.coverageIds,
      `reuseActions[${index}].coverageIds`
    )
    const priorEvidenceFingerprint = requireSha256(
      action.priorEvidenceFingerprint,
      `reuseActions[${index}].priorEvidenceFingerprint`
    )
    const evidence = validateEvidenceKey(action.evidence as CompleteEvidenceKey)
    if (evidence.candidateSha !== candidateSha || evidence.candidateTreeSha !== candidateTreeSha)
      fail('VALIDATION_PLAN_REUSE_CANDIDATE_MISMATCH', commandId)
    if (evidence.exitCode !== 0) fail('VALIDATION_PLAN_REUSE_FAILED_EVIDENCE', commandId)
    if (canonicalJson(evidence.coverageIds) !== canonicalJson(coverageIds))
      fail('VALIDATION_PLAN_REUSE_COVERAGE_MISMATCH', commandId)
    if (
      action.driftDecision === 'REUSE_EXACT' &&
      evidence.evidenceFingerprint !== priorEvidenceFingerprint
    )
      fail('VALIDATION_PLAN_EXACT_REUSE_FINGERPRINT_MISMATCH', commandId)
    requireIdentity(action.reason, `reuseActions[${index}].reason`)
    return action as unknown as ValidationReuseAction
  })

  for (const [actions, field] of [
    [runActions, 'runActions'],
    [reuseActions, 'reuseActions']
  ] as const) {
    const ids = actions.map((action) => action.commandId)
    if (canonicalJson(ids) !== canonicalJson([...new Set(ids)].sort()))
      fail('VALIDATION_PLAN_ACTIONS_NON_CANONICAL', field)
  }
  const commandIds = [...runActions, ...reuseActions].map((action) => action.commandId)
  if (new Set(commandIds).size !== commandIds.length)
    fail('VALIDATION_PLAN_COMMAND_DUPLICATE', commandIds.join(','))

  const invalidated = requireCanonicalFingerprints(
    record.invalidatedEvidenceFingerprints,
    'invalidatedEvidenceFingerprints'
  )
  const reusable = requireCanonicalFingerprints(
    record.reusableEvidenceFingerprints,
    'reusableEvidenceFingerprints'
  )
  if (invalidated.some((fingerprint) => reusable.includes(fingerprint)))
    fail('VALIDATION_PLAN_EVIDENCE_PARTITION_OVERLAP', invalidated.join(','))
  if (record.result === 'PLAN_READY') {
    if (record.designGap !== null) fail('VALIDATION_PLAN_READY_WITH_DESIGN_GAP', 'designGap')
    if (runActions.length + reuseActions.length === 0)
      fail('VALIDATION_PLAN_ACTIONS_EMPTY', 'PLAN_READY')
    const expectedInvalidated = [
      ...new Set(
        runActions.flatMap((action) =>
          action.priorEvidenceFingerprint ? [action.priorEvidenceFingerprint] : []
        )
      )
    ].sort()
    const expectedReusable = [
      ...new Set(reuseActions.map((action) => action.evidence.evidenceFingerprint))
    ].sort()
    if (canonicalJson(invalidated) !== canonicalJson(expectedInvalidated))
      fail('VALIDATION_PLAN_INVALIDATED_EVIDENCE_MISMATCH', invalidated.join(','))
    if (canonicalJson(reusable) !== canonicalJson(expectedReusable))
      fail('VALIDATION_PLAN_REUSABLE_EVIDENCE_MISMATCH', reusable.join(','))
  } else if (record.result === 'DESIGN_GAP') {
    if (runActions.length > 0 || reuseActions.length > 0 || reusable.length > 0)
      fail('VALIDATION_PLAN_DESIGN_GAP_ACTIONS_INVALID', 'actions or reusable evidence present')
    if (
      !record.designGap ||
      typeof record.designGap !== 'object' ||
      Array.isArray(record.designGap)
    )
      fail('VALIDATION_PLAN_DESIGN_GAP_INVALID', 'missing')
    const gap = record.designGap as Record<string, unknown>
    requireExactKeys(
      gap,
      ['reason', 'commandIds', 'affectedCoverageIds'],
      'VALIDATION_PLAN_DESIGN_GAP_SHAPE_INVALID'
    )
    if (gap.reason !== 'frozen semantic conflict')
      fail('VALIDATION_PLAN_DESIGN_GAP_REASON_INVALID', String(gap.reason))
    requireCanonicalIdentifiers(gap.commandIds, 'designGap.commandIds')
    requireCanonicalIdentifiers(gap.affectedCoverageIds, 'designGap.affectedCoverageIds')
  } else {
    fail('VALIDATION_PLAN_RESULT_INVALID', String(record.result))
  }
  requireSha256(record.planFingerprint, 'planFingerprint')
  const actual = objectFingerprint(plan as unknown as Record<string, unknown>, 'planFingerprint')
  if (actual !== plan.planFingerprint) fail('VALIDATION_PLAN_FINGERPRINT_MISMATCH', actual)
  return plan
}
