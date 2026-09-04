#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { TEST_TYPES } from './test-infrastructure.mjs'

/** Requires a job to succeed when selected and to be skipped otherwise. */
function validateResult(name, selected, actual, failures) {
  if (selected && actual !== 'success') failures.push(`${name} expected=success actual=${actual}`)
  if (!selected && !['skipped', 'success'].includes(actual)) failures.push(`${name} expected=skipped actual=${actual}`)
}

const plan = JSON.parse(readFileSync(resolve(process.argv[2] || '.tmp/change-plan.json'), 'utf8'))
const results = JSON.parse(process.env.OES_JOB_RESULTS || '{}')
const failures = []
if (results.changePlan !== 'success') failures.push(`change-plan actual=${results.changePlan}`)
if (plan.requiresHumanConfirmation) failures.push(`FULL_CONFIRMATION_REQUIRED token=${plan.fullApprovalToken}`)
if (plan.planningBlocked) failures.push(`CHANGE_PLAN_BLOCKED risks=${plan.risks.join(',')}`)

const candidate = plan.phase === 'candidate' && !plan.requiresHumanConfirmation
validateResult('full-confirmation', !plan.requiresHumanConfirmation, results.confirmation, failures)
validateResult('static', candidate || plan.mode === 'DOCS', results.static, failures)
validateResult('build', candidate && plan.mode !== 'DOCS', results.build, failures)
for (const type of TEST_TYPES) {
  validateResult(type, candidate && plan.selectedTests[type].length > 0, results[type], failures)
}
validateResult('quick-smoke', plan.phase === 'quick-smoke', results.quick, failures)

if (failures.length) {
  for (const failure of failures) console.error(`GATE_FAILURE ${failure}`)
  console.error(`BASELINE_CHECKS=FAIL count=${failures.length}`)
  process.exitCode = 1
} else {
  console.log(`BASELINE_CHECKS=PASS mode=${plan.mode} phase=${plan.phase} plan=${plan.planIdentity}`)
}
