import assert from 'node:assert/strict'
import test from 'node:test'
import { createVerificationTopology } from '../verification-topology.ts'

test('RV and Baseline Checks run in parallel on the same exact PR candidate', () => {
  const sha = 'a'.repeat(40)
  const plan = createVerificationTopology({
    candidateSha: sha,
    ownerRole: 'DO',
    changedRiskClasses: ['STATIC', 'UNIT'],
    selfTestClasses: ['UNIT'],
    rvClasses: ['STATIC'],
    ciClasses: ['STATIC', 'UNIT'],
    pullRequestCandidateExists: true,
    fullRequired: false,
    fullReason: null,
    estimatedFullCost: null,
    fullConfirmed: false
  })
  assert.equal(plan.rv.exactCandidateSha, sha)
  assert.equal(plan.ci.exactCandidateSha, sha)
  assert.equal(plan.parallelRvAndCi, true)
  assert.equal(plan.ci.requiredStatus, 'Baseline Checks')
})

test('PR-triggered FULL remains non-runnable until disclosed confirmation', () => {
  const plan = createVerificationTopology({
    candidateSha: 'b'.repeat(40),
    ownerRole: 'CO',
    changedRiskClasses: ['INTEGRATION'],
    selfTestClasses: ['INTEGRATION'],
    rvClasses: ['INTEGRATION'],
    ciClasses: ['INTEGRATION'],
    pullRequestCandidateExists: true,
    fullRequired: true,
    fullReason: 'global selector changed',
    estimatedFullCost: '45 minutes',
    fullConfirmed: false
  })
  assert.equal(plan.fullDisposition, 'HUMAN_CONFIRMATION_REQUIRED')
  assert.equal(plan.runnable, false)
})
