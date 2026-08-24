import test from 'node:test'
import assert from 'node:assert/strict'
import { assessDrift, createEvidenceKey } from '../src/evidence.ts'
import type { DriftAssessmentInput, EvidenceKeyInput } from '../src/types.ts'

const hash = (char: string) => char.repeat(64)
const input = (candidate = '1'.repeat(40)): EvidenceKeyInput => ({
  candidateSha: candidate,
  dependencyFingerprint: hash('a'),
  literalInputsFingerprint: hash('b'),
  executionProfileFingerprint: hash('c'),
  commandFingerprint: hash('d'),
  literalResultFingerprint: hash('e'),
  exitCode: 0,
  coverageIds: ['driver', 'cleanup']
})
const base = (): DriftAssessmentInput => ({
  previousEvidence: createEvidenceKey(input()),
  nextEvidence: input(),
  changedPaths: [],
  coverage: [
    {
      id: 'driver',
      pathPatterns: ['scripts/collaboration-runtime/src/**'],
      contractSensitive: true
    },
    { id: 'cleanup', pathPatterns: ['docs/plans/features/**'], contractSensitive: false }
  ],
  dependencyChanged: false,
  profileChanged: false,
  commandChanged: false,
  contractChanged: false,
  semanticConflict: false
})

test('identical evidence keys are reused exactly', () => {
  assert.equal(assessDrift(base()).decision, 'REUSE_EXACT')
})

test('unrelated main advancement refreshes only the baseline', () => {
  const value = base()
  value.nextEvidence = input('2'.repeat(40))
  value.changedPaths = ['README.md']
  assert.equal(assessDrift(value).decision, 'REFRESH_BASELINE')
})

test('changed paths invalidate only intersecting risk coverage', () => {
  const value = base()
  value.nextEvidence = input('2'.repeat(40))
  value.changedPaths = ['scripts/collaboration-runtime/src/remote-driver.ts']
  const result = assessDrift(value)
  assert.equal(result.decision, 'FOCUSED')
  assert.deepEqual(result.affectedCoverageIds, ['driver'])
  assert.deepEqual(result.reusableCoverageIds, ['cleanup'])
})

test('dependency/profile/command/contract changes require full evidence', () => {
  const value = base()
  value.dependencyChanged = true
  assert.equal(assessDrift(value).decision, 'FULL')
})

test('frozen semantic conflict returns a design gap', () => {
  const value = base()
  value.semanticConflict = true
  assert.equal(assessDrift(value).decision, 'DESIGN_GAP')
})

test('missing prior evidence requires full validation', () => {
  const value = base()
  value.previousEvidence = null
  assert.equal(assessDrift(value).decision, 'FULL')
})

test('tampered prior evidence is rejected rather than reused', () => {
  const value = base()
  if (!value.previousEvidence) throw new Error('fixture missing evidence')
  value.previousEvidence.commandFingerprint = hash('9')
  assert.throws(() => assessDrift(value), /EVIDENCE_KEY_FINGERPRINT_MISMATCH/)
})

test('changed or failing literal results invalidate all prior coverage', () => {
  const value = base()
  value.nextEvidence = {
    ...input('2'.repeat(40)),
    literalResultFingerprint: hash('9'),
    exitCode: 1
  }
  const result = assessDrift(value)
  assert.equal(result.decision, 'FULL')
  assert.deepEqual(result.reusableCoverageIds, [])
})

test('changed literal-input identity invalidates every prior coverage result', () => {
  const value = base()
  value.nextEvidence = {
    ...input('2'.repeat(40)),
    literalInputsFingerprint: hash('9')
  }
  value.changedPaths = ['README.md']
  const result = assessDrift(value)
  assert.equal(result.decision, 'FULL')
  assert.deepEqual(result.reusableCoverageIds, [])
})
