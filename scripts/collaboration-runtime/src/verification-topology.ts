import { objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'

export const TEST_CLASSES = [
  'STATIC',
  'UNIT',
  'COMPONENT',
  'CONTRACT',
  'INTEGRATION',
  'JOURNEY'
] as const
export type TestClass = (typeof TEST_CLASSES)[number]

export interface VerificationTopologyInput {
  candidateSha: string
  ownerRole: 'DO' | 'CO'
  changedRiskClasses: TestClass[]
  selfTestClasses: TestClass[]
  rvClasses: TestClass[]
  ciClasses: TestClass[]
  pullRequestCandidateExists: boolean
  fullRequired: boolean
  fullReason: string | null
  estimatedFullCost: string | null
  fullConfirmed: boolean
}

export interface VerificationTopology {
  schemaVersion: 2
  kind: 'OES_V2_VERIFICATION_TOPOLOGY'
  candidateSha: string
  doSelfTest: { owner: 'DO' | 'CO'; classes: TestClass[] }
  rv: { owner: 'RV'; independent: true; exactCandidateSha: string; classes: TestClass[] }
  ci: { requiredStatus: 'Baseline Checks'; exactCandidateSha: string; classes: TestClass[] }
  parallelRvAndCi: boolean
  fullDisposition: 'NOT_REQUIRED' | 'HUMAN_CONFIRMATION_REQUIRED' | 'CONFIRMED'
  fullReason: string | null
  estimatedFullCost: string | null
  runnable: boolean
  planFingerprint: string
}

const SHA = /^[0-9a-f]{40}$/

/** Builds the three-layer, exact-candidate verification topology without mechanically selecting every class. */
export function createVerificationTopology(input: VerificationTopologyInput): VerificationTopology {
  if (!SHA.test(input.candidateSha)) fail('VERIFICATION_CANDIDATE_SHA_INVALID', input.candidateSha)
  for (const [name, values] of Object.entries({
    selfTestClasses: input.selfTestClasses,
    rvClasses: input.rvClasses,
    ciClasses: input.ciClasses,
    changedRiskClasses: input.changedRiskClasses
  })) {
    if (
      new Set(values).size !== values.length ||
      values.some((value) => !TEST_CLASSES.includes(value))
    )
      fail('VERIFICATION_CLASS_SET_INVALID', name)
  }
  const covered = new Set([...input.selfTestClasses, ...input.rvClasses, ...input.ciClasses])
  const missing = input.changedRiskClasses.filter((value) => !covered.has(value))
  if (missing.length) fail('VERIFICATION_RISK_UNCOVERED', missing.join(','))
  if (input.fullRequired && (!input.fullReason?.trim() || !input.estimatedFullCost?.trim()))
    fail('VERIFICATION_FULL_DISCLOSURE_REQUIRED', input.candidateSha)
  const fullDisposition: VerificationTopology['fullDisposition'] = !input.fullRequired
    ? 'NOT_REQUIRED'
    : input.fullConfirmed
      ? 'CONFIRMED'
      : 'HUMAN_CONFIRMATION_REQUIRED'
  const base = {
    schemaVersion: 2 as const,
    kind: 'OES_V2_VERIFICATION_TOPOLOGY' as const,
    candidateSha: input.candidateSha,
    doSelfTest: { owner: input.ownerRole, classes: input.selfTestClasses },
    rv: {
      owner: 'RV' as const,
      independent: true as const,
      exactCandidateSha: input.candidateSha,
      classes: input.rvClasses
    },
    ci: {
      requiredStatus: 'Baseline Checks' as const,
      exactCandidateSha: input.candidateSha,
      classes: input.ciClasses
    },
    parallelRvAndCi: input.pullRequestCandidateExists,
    fullDisposition,
    fullReason: input.fullReason,
    estimatedFullCost: input.estimatedFullCost,
    runnable: fullDisposition !== 'HUMAN_CONFIRMATION_REQUIRED'
  }
  return {
    ...base,
    planFingerprint: objectFingerprint(base as unknown as Record<string, unknown>, '__none__')
  }
}
