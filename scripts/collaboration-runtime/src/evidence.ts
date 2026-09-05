import { canonicalJson, objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import type {
  DriftAssessment,
  DriftAssessmentInput,
  DependencyCandidate,
  EvidenceKey,
  EvidenceKeyInput,
  RiskCoverage
} from './types.ts'

const SHA1_PATTERN = /^[0-9a-f]{40}$/
const SHA256_PATTERN = /^[0-9a-f]{64}$/
const DELIVERY_KEY_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

const COMPLETE_INPUT_KEYS = [
  'candidateSha',
  'candidateTreeSha',
  'dependencyCandidates',
  'dependencyFingerprint',
  'lockfileFingerprint',
  'toolchainFingerprint',
  'testConfigFingerprint',
  'environmentFingerprint',
  'literalInputsFingerprint',
  'executionProfileFingerprint',
  'commandFingerprint',
  'commandVersion',
  'literalResultFingerprint',
  'exitCode',
  'coverageIds'
] as const

export type { DependencyCandidate } from './types.ts'

/** Retains the delivery-local complete name while the shared public type is now equally complete. */
export type CompleteEvidenceKeyInput = EvidenceKeyInput
export type CompleteEvidenceKey = EvidenceKey
export type CompleteDriftAssessmentInput = DriftAssessmentInput

/** Fails when a runtime record does not contain exactly the allowed top-level fields. */
function requireExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  code: string
): void {
  const actual = Object.keys(value).sort()
  const canonical = [...expected].sort()
  if (canonicalJson(actual) !== canonicalJson(canonical)) fail(code, actual.join(','))
}

/** Requires one non-empty canonical identifier without hidden surrounding whitespace. */
function requireIdentifier(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.trim() !== value)
    fail('EVIDENCE_IDENTITY_INVALID', field)
  return value
}

/** Requires one lowercase Git object id. */
function requireSha1(value: unknown, field: string): string {
  if (typeof value !== 'string' || !SHA1_PATTERN.test(value)) fail('EVIDENCE_SHA_INVALID', field)
  return value
}

/** Requires one lowercase SHA-256 fingerprint. */
function requireSha256(value: unknown, field: string): string {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value))
    fail('EVIDENCE_FINGERPRINT_INVALID', field)
  return value
}

/** Requires one normalized repository-relative path without traversal aliases. */
function requireRepositoryPath(path: unknown, field: string): string {
  if (typeof path !== 'string') fail('EVIDENCE_CHANGED_PATH_INVALID', field)
  const segments = path.split('/')
  if (
    path.length === 0 ||
    path.startsWith('/') ||
    path.endsWith('/') ||
    segments.some((segment) => segment === '' || segment === '.' || segment === '..')
  )
    fail('EVIDENCE_CHANGED_PATH_INVALID', path)
  return path
}

/** Normalizes and validates the complete dependency candidate set. */
function normalizeDependencyCandidates(value: unknown): DependencyCandidate[] {
  if (!Array.isArray(value)) fail('EVIDENCE_DEPENDENCY_CANDIDATES_INVALID', 'not an array')
  const normalized = value.map((candidate, index) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
      fail('EVIDENCE_DEPENDENCY_CANDIDATE_INVALID', String(index))
    const record = candidate as Record<string, unknown>
    requireExactKeys(
      record,
      ['deliveryKey', 'candidateSha', 'candidateTreeSha'],
      'EVIDENCE_DEPENDENCY_CANDIDATE_SHAPE_INVALID'
    )
    const deliveryKey = requireIdentifier(
      record.deliveryKey,
      `dependencyCandidates[${index}].deliveryKey`
    )
    if (!DELIVERY_KEY_PATTERN.test(deliveryKey))
      fail('EVIDENCE_DEPENDENCY_DELIVERY_KEY_INVALID', deliveryKey)
    return {
      deliveryKey,
      candidateSha: requireSha1(record.candidateSha, `dependencyCandidates[${index}].candidateSha`),
      candidateTreeSha: requireSha1(
        record.candidateTreeSha,
        `dependencyCandidates[${index}].candidateTreeSha`
      )
    }
  })
  const duplicate = normalized.find(
    (candidate, index) =>
      normalized.findIndex((item) => item.deliveryKey === candidate.deliveryKey) !== index
  )
  if (duplicate) fail('EVIDENCE_DEPENDENCY_CANDIDATE_DUPLICATE', duplicate.deliveryKey)
  return normalized.sort((left, right) => left.deliveryKey.localeCompare(right.deliveryKey))
}

/** Normalizes and validates the exact risk coverage identity set. */
function normalizeCoverageIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0)
    fail('EVIDENCE_COVERAGE_IDS_INVALID', 'empty or not an array')
  const normalized = value.map((id, index) => requireIdentifier(id, `coverageIds[${index}]`))
  if (new Set(normalized).size !== normalized.length)
    fail('EVIDENCE_COVERAGE_ID_DUPLICATE', normalized.join(','))
  return normalized.sort()
}

/** Converts an input into the complete canonical evidence identity. */
function normalizeEvidenceInput(input: EvidenceKeyInput): CompleteEvidenceKeyInput {
  const record = input as unknown as Record<string, unknown>
  requireExactKeys(record, COMPLETE_INPUT_KEYS, 'EVIDENCE_KEY_INPUT_SHAPE_INVALID')
  if (!Number.isInteger(record.exitCode))
    fail('EVIDENCE_EXIT_CODE_INVALID', String(record.exitCode))
  return {
    candidateSha: requireSha1(record.candidateSha, 'candidateSha'),
    candidateTreeSha: requireSha1(record.candidateTreeSha, 'candidateTreeSha'),
    dependencyCandidates: normalizeDependencyCandidates(record.dependencyCandidates),
    dependencyFingerprint: requireSha256(record.dependencyFingerprint, 'dependencyFingerprint'),
    lockfileFingerprint: requireSha256(record.lockfileFingerprint, 'lockfileFingerprint'),
    toolchainFingerprint: requireSha256(record.toolchainFingerprint, 'toolchainFingerprint'),
    testConfigFingerprint: requireSha256(record.testConfigFingerprint, 'testConfigFingerprint'),
    environmentFingerprint: requireSha256(record.environmentFingerprint, 'environmentFingerprint'),
    literalInputsFingerprint: requireSha256(
      record.literalInputsFingerprint,
      'literalInputsFingerprint'
    ),
    executionProfileFingerprint: requireSha256(
      record.executionProfileFingerprint,
      'executionProfileFingerprint'
    ),
    commandFingerprint: requireSha256(record.commandFingerprint, 'commandFingerprint'),
    commandVersion: requireIdentifier(record.commandVersion, 'commandVersion'),
    literalResultFingerprint: requireSha256(
      record.literalResultFingerprint,
      'literalResultFingerprint'
    ),
    exitCode: record.exitCode as number,
    coverageIds: normalizeCoverageIds(record.coverageIds)
  }
}

/** Creates one exact evidence key from all canonical reuse inputs. */
export function createEvidenceKey(input: EvidenceKeyInput): CompleteEvidenceKey {
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_TEST_EVIDENCE_KEY' as const,
    ...normalizeEvidenceInput(input)
  }
  return {
    ...base,
    evidenceFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
}

/** Matches one repository path against the deliberately small glob subset used by risk coverage. */
function pathMatches(pattern: string, path: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replaceAll('**', '::DOUBLE::')
    .replaceAll('*', '[^/]*')
    .replaceAll('::DOUBLE::', '.*')
  return new RegExp(`^${escaped}$`).test(path)
}

/** Validates and canonically orders the bounded coverage map. */
function normalizeCoverage(coverage: RiskCoverage[]): RiskCoverage[] {
  const normalized = coverage.map((risk, index) => {
    const id = requireIdentifier(risk.id, `coverage[${index}].id`)
    if (!Array.isArray(risk.pathPatterns) || risk.pathPatterns.length === 0)
      fail('EVIDENCE_COVERAGE_PATTERNS_INVALID', id)
    const pathPatterns = risk.pathPatterns.map((pattern, patternIndex) =>
      requireIdentifier(pattern, `coverage[${index}].pathPatterns[${patternIndex}]`)
    )
    if (new Set(pathPatterns).size !== pathPatterns.length)
      fail('EVIDENCE_COVERAGE_PATTERN_DUPLICATE', id)
    if (typeof risk.contractSensitive !== 'boolean')
      fail('EVIDENCE_COVERAGE_CONTRACT_FLAG_INVALID', id)
    return { id, pathPatterns: [...pathPatterns].sort(), contractSensitive: risk.contractSensitive }
  })
  if (new Set(normalized.map((risk) => risk.id)).size !== normalized.length)
    fail('EVIDENCE_COVERAGE_ID_DUPLICATE', normalized.map((risk) => risk.id).join(','))
  return normalized.sort((left, right) => left.id.localeCompare(right.id))
}

/** Returns coverage ids touched by changed repository paths. */
function affectedCoverage(changedPaths: string[], coverage: RiskCoverage[]): string[] {
  return coverage
    .filter((risk) =>
      changedPaths.some((path) => risk.pathPatterns.some((pattern) => pathMatches(pattern, path)))
    )
    .map((risk) => risk.id)
    .sort()
}

/** Verifies a persisted evidence key is complete, canonical and unaltered. */
export function validateEvidenceKey(key: EvidenceKey): CompleteEvidenceKey {
  const record = key as unknown as Record<string, unknown>
  requireExactKeys(
    record,
    ['schemaVersion', 'kind', ...COMPLETE_INPUT_KEYS, 'evidenceFingerprint'],
    'EVIDENCE_KEY_SHAPE_INVALID'
  )
  if (record.schemaVersion !== 1 || record.kind !== 'OES_TEST_EVIDENCE_KEY')
    fail('EVIDENCE_KEY_KIND_INVALID', `${String(record.schemaVersion)}:${String(record.kind)}`)
  requireSha256(record.evidenceFingerprint, 'evidenceFingerprint')
  const input = Object.fromEntries(COMPLETE_INPUT_KEYS.map((field) => [field, record[field]]))
  const canonical = createEvidenceKey(input as unknown as EvidenceKeyInput)
  if (canonicalJson(canonical) !== canonicalJson(key))
    fail('EVIDENCE_KEY_FINGERPRINT_MISMATCH', canonical.evidenceFingerprint)
  return canonical
}

/** Compares every non-baseline evidence dimension that can invalidate prior execution results. */
function fullInvalidationFieldsChanged(
  previous: CompleteEvidenceKey,
  next: CompleteEvidenceKey
): boolean {
  return (
    canonicalJson(previous.dependencyCandidates) !== canonicalJson(next.dependencyCandidates) ||
    previous.dependencyFingerprint !== next.dependencyFingerprint ||
    previous.lockfileFingerprint !== next.lockfileFingerprint ||
    previous.toolchainFingerprint !== next.toolchainFingerprint ||
    previous.testConfigFingerprint !== next.testConfigFingerprint ||
    previous.environmentFingerprint !== next.environmentFingerprint ||
    previous.literalInputsFingerprint !== next.literalInputsFingerprint ||
    previous.executionProfileFingerprint !== next.executionProfileFingerprint ||
    previous.commandFingerprint !== next.commandFingerprint ||
    previous.commandVersion !== next.commandVersion ||
    previous.literalResultFingerprint !== next.literalResultFingerprint ||
    previous.exitCode !== next.exitCode ||
    canonicalJson(previous.coverageIds) !== canonicalJson(next.coverageIds)
  )
}

/** Selects exact reuse, baseline refresh, focused, full, or design-gap validation. */
export function assessDrift(input: DriftAssessmentInput): DriftAssessment {
  const coverage = normalizeCoverage(input.coverage)
  const allCoverage = coverage.map((risk) => risk.id)
  const next = createEvidenceKey(input.nextEvidence)
  if (canonicalJson(next.coverageIds) !== canonicalJson(allCoverage))
    fail('EVIDENCE_COVERAGE_MAPPING_MISMATCH', next.coverageIds.join(','))
  const previous = input.previousEvidence ? validateEvidenceKey(input.previousEvidence) : null
  if (!Array.isArray(input.changedPaths)) fail('EVIDENCE_CHANGED_PATHS_INVALID', 'not an array')
  const changedPaths = [
    ...new Set(
      input.changedPaths.map((path, index) => requireRepositoryPath(path, `changedPaths[${index}]`))
    )
  ].sort()
  if (input.semanticConflict) {
    return {
      decision: 'DESIGN_GAP',
      affectedCoverageIds: allCoverage,
      reusableCoverageIds: [],
      reason: 'frozen semantic conflict'
    }
  }
  if (!previous) {
    return {
      decision: 'FULL',
      affectedCoverageIds: allCoverage,
      reusableCoverageIds: [],
      reason: 'no prior evidence exists'
    }
  }
  if (next.exitCode !== 0) {
    return {
      decision: 'FULL',
      affectedCoverageIds: allCoverage,
      reusableCoverageIds: [],
      reason: 'next evidence contains a failing exit status'
    }
  }
  if (
    input.dependencyChanged ||
    input.profileChanged ||
    input.commandChanged ||
    input.contractChanged ||
    fullInvalidationFieldsChanged(previous, next)
  ) {
    return {
      decision: 'FULL',
      affectedCoverageIds: allCoverage,
      reusableCoverageIds: [],
      reason:
        'contract, dependency, lockfile, toolchain, test config, environment, literal input/result, profile, command/version, exit status, or coverage identity changed'
    }
  }
  if (previous.candidateTreeSha !== next.candidateTreeSha && changedPaths.length === 0) {
    return {
      decision: 'FULL',
      affectedCoverageIds: allCoverage,
      reusableCoverageIds: [],
      reason: 'candidate tree changed without a changed-path proof'
    }
  }
  if (previous.evidenceFingerprint === next.evidenceFingerprint && changedPaths.length === 0) {
    return {
      decision: 'REUSE_EXACT',
      affectedCoverageIds: [],
      reusableCoverageIds: allCoverage,
      reason: 'all complete evidence-key fields are identical'
    }
  }
  const affected = affectedCoverage(changedPaths, coverage)
  const reusable = allCoverage.filter((id) => !affected.includes(id))
  if (affected.length === 0) {
    return {
      decision: 'REFRESH_BASELINE',
      affectedCoverageIds: [],
      reusableCoverageIds: reusable,
      reason: 'candidate baseline advanced only through unrelated paths'
    }
  }
  return {
    decision: 'FOCUSED',
    affectedCoverageIds: affected,
    reusableCoverageIds: reusable,
    reason: 'changed paths intersect bounded risk coverage'
  }
}
