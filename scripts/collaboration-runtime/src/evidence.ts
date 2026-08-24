import { objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import type {
  DriftAssessment,
  DriftAssessmentInput,
  EvidenceKey,
  EvidenceKeyInput,
  RiskCoverage
} from './types.ts'

/** Creates one exact evidence key from all canonical reuse inputs. */
export function createEvidenceKey(input: EvidenceKeyInput): EvidenceKey {
  const base = {
    schemaVersion: 1 as const,
    kind: 'OES_TEST_EVIDENCE_KEY' as const,
    ...input,
    coverageIds: [...new Set(input.coverageIds)].sort()
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

/** Returns coverage ids touched by changed repository paths. */
function affectedCoverage(changedPaths: string[], coverage: RiskCoverage[]): string[] {
  return coverage
    .filter((risk) =>
      changedPaths.some((path) => risk.pathPatterns.some((pattern) => pathMatches(pattern, path)))
    )
    .map((risk) => risk.id)
    .sort()
}

/** Verifies a persisted evidence key has not been altered. */
export function validateEvidenceKey(key: EvidenceKey): EvidenceKey {
  const actual = objectFingerprint(key as unknown as Record<string, unknown>, 'evidenceFingerprint')
  if (actual !== key.evidenceFingerprint) fail('EVIDENCE_KEY_FINGERPRINT_MISMATCH', actual)
  return key
}

/** Selects exact reuse, baseline refresh, focused, full, or design-gap validation. */
export function assessDrift(input: DriftAssessmentInput): DriftAssessment {
  const allCoverage = input.coverage.map((risk) => risk.id).sort()
  if (input.previousEvidence) validateEvidenceKey(input.previousEvidence)
  if (input.semanticConflict) {
    return {
      decision: 'DESIGN_GAP',
      affectedCoverageIds: allCoverage,
      reusableCoverageIds: [],
      reason: 'frozen semantic conflict'
    }
  }
  if (!input.previousEvidence) {
    return {
      decision: 'FULL',
      affectedCoverageIds: allCoverage,
      reusableCoverageIds: [],
      reason: 'no prior evidence exists'
    }
  }
  if (
    input.dependencyChanged ||
    input.profileChanged ||
    input.commandChanged ||
    input.contractChanged
  ) {
    return {
      decision: 'FULL',
      affectedCoverageIds: allCoverage,
      reusableCoverageIds: [],
      reason: 'dependency, profile, command, or contract input changed'
    }
  }
  const next = createEvidenceKey(input.nextEvidence)
  if (
    input.previousEvidence?.evidenceFingerprint === next.evidenceFingerprint &&
    input.changedPaths.length === 0
  ) {
    return {
      decision: 'REUSE_EXACT',
      affectedCoverageIds: [],
      reusableCoverageIds: allCoverage,
      reason: 'all evidence-key fields are identical'
    }
  }
  const affected = affectedCoverage(input.changedPaths, input.coverage)
  const reusable = allCoverage.filter((id) => !affected.includes(id))
  if (affected.length === 0) {
    return {
      decision: 'REFRESH_BASELINE',
      affectedCoverageIds: [],
      reusableCoverageIds: reusable,
      reason: 'main advanced only through unrelated paths'
    }
  }
  return {
    decision: 'FOCUSED',
    affectedCoverageIds: affected,
    reusableCoverageIds: reusable,
    reason: 'changed paths intersect bounded risk coverage'
  }
}
