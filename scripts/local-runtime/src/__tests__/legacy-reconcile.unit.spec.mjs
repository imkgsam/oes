import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fingerprint, sha256, writeAtomic } from '../canonical.mjs'
import { applyLegacyCleanup, observeLegacyResidue, planLegacyCleanup } from '../legacy-reconcile.mjs'

function inventory(resources) {
  const raw = { schemaVersion: 2, kind: 'OES_LEGACY_RUNTIME_INVENTORY', observedAt: '2026-09-06T00:00:00.000Z', readOnly: true, resources }
  return { ...raw, inventoryFingerprint: fingerprint(raw) }
}
const base = { name: 'oes-old', labels: { 'com.docker.compose.project': 'oes-old' }, state: 'exited', active: false, attachments: [], mounts: [], reason: 'fixture', evidenceDigest: 'a'.repeat(64) }
const launcher = path.resolve(import.meta.dirname, '../../launcher.mjs')

test('dry-run is deterministic and child-first while unknown resources remain preserved', () => {
  const source = inventory([
    { ...base, type: 'volume', objectId: 'v1', classification: 'UNKNOWN_OR_INSUFFICIENT_EVIDENCE', plannedAction: 'PRESERVE_AND_RESOLVE_OWNER' },
    { ...base, type: 'network', objectId: 'n1', classification: 'CONFIRMED_IDLE_LEGACY_RESIDUE', plannedAction: 'DELETE_AFTER_CLEANUP_CONFIRMATION' },
    { ...base, type: 'container', objectId: 'c1', classification: 'CONFIRMED_IDLE_LEGACY_RESIDUE', plannedAction: 'DELETE_AFTER_CLEANUP_CONFIRMATION' }
  ])
  const first = planLegacyCleanup(source, { ownerTaskId: '/do/runtime-fixture' })
  const second = planLegacyCleanup(source, { ownerTaskId: '/do/runtime-fixture' })
  assert.deepEqual(first, second)
  assert.deepEqual(first.actions.map((action) => action.type), ['container', 'network', 'volume'])
  assert.deepEqual(first.residueExpectation.preservedSet, ['volume:v1'])
  const observation = observeLegacyResidue(first, source)
  assert.equal(observation.observations.find((item) => item.key === 'volume:v1').disposition, 'PRESERVED_OUTSIDE_DELETE_SET')
})


/** Writes one independently reopenable current Collaboration binding fixture. */
function writeBinding(directory, planReference, { filename = 'current-binding.json', stateVersion = 7, transitionId = 'cleanup-transition-7', humanConfirmationFingerprint = 'a'.repeat(64) } = {}) {
  const bindingRaw = {
    schemaVersion: 2,
    kind: 'OES_LEGACY_CLEANUP_CURRENT_BINDING',
    status: 'ACTIVE',
    expectedState: 'LEGACY_CLEANUP_AUTHORIZED',
    ownerTaskId: '/do/runtime-fixture',
    stateVersion,
    transitionId,
    humanConfirmationFingerprint,
    planReference
  }
  const binding = { ...bindingRaw, recordFingerprint: fingerprint(bindingRaw) }
  const bindingPath = path.join(directory, filename)
  writeAtomic(bindingPath, binding)
  return { binding, bindingPath }
}

/** Writes one Human confirmation that binds facts but carries no trust-root path. */
function writeConfirmation(directory, planReference, { filename = 'confirmation.json', stateVersion = 7, transitionId = 'cleanup-transition-7', humanConfirmationFingerprint = 'a'.repeat(64) } = {}) {
  const confirmationRaw = {
    schemaVersion: 2,
    kind: 'OES_LEGACY_CLEANUP_CONFIRMATION',
    status: 'CONFIRMED',
    expectedState: 'LEGACY_CLEANUP_AUTHORIZED',
    ownerTaskId: '/do/runtime-fixture',
    stateVersion,
    transitionId,
    humanConfirmationFingerprint,
    planReference
  }
  const confirmation = { ...confirmationRaw, confirmationFingerprint: fingerprint(confirmationRaw) }
  const confirmationPath = path.join(directory, filename)
  writeAtomic(confirmationPath, confirmation)
  return { confirmation, confirmationPath }
}

test('legacy apply rejects a minimal caller-fabricated confirmation', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-legacy-confirmation-'))
  const source = inventory([{ ...base, type: 'volume', objectId: 'v1', classification: 'UNKNOWN_OR_INSUFFICIENT_EVIDENCE', plannedAction: 'PRESERVE_AND_RESOLVE_OWNER' }])
  const plan = planLegacyCleanup(source, { ownerTaskId: '/do/runtime-fixture' })
  const planPath = path.join(directory, 'plan.json')
  writeAtomic(planPath, plan)
  const fabricated = { kind: 'OES_LEGACY_CLEANUP_CONFIRMATION', status: 'CONFIRMED', planFingerprint: plan.planFingerprint }
  fabricated.confirmationFingerprint = fingerprint(fabricated)
  const fabricatedPath = path.join(directory, 'fabricated.json')
  writeAtomic(fabricatedPath, fabricated)

  assert.throws(() => applyLegacyCleanup({ plan, planPath, confirmation: fabricated, confirmationPath: fabricatedPath, collaborationBindingPath: path.join(directory, 'trusted-binding.json') }), /PLAN_PATH_REQUIRED|CONFIRMATION_INVALID/u)
})

test('legacy apply rejects a complete caller-signed chain before Docker inspection when the boundary binding differs', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-legacy-self-signed-'))
  const lifecycleRaw = { schemaVersion: 2, kind: 'OES_LEGACY_LIFECYCLE_EVIDENCE', objectId: 'caller-volume', ownerTaskId: '/do/runtime-fixture', lifecycle: 'IDLE' }
  const lifecycle = { ...lifecycleRaw, evidenceFingerprint: fingerprint(lifecycleRaw) }
  const lifecyclePath = path.join(directory, 'caller-lifecycle.json')
  writeAtomic(lifecyclePath, lifecycle)
  const lifecycleEvidenceReference = { path: lifecyclePath, sha256: sha256(fs.readFileSync(lifecyclePath)), fingerprint: lifecycle.evidenceFingerprint }
  const source = inventory([{ ...base, type: 'volume', objectId: 'caller-volume', classification: 'CONFIRMED_IDLE_LEGACY_RESIDUE', plannedAction: 'DELETE_AFTER_CLEANUP_CONFIRMATION', evidence: { ownerTaskId: '/do/runtime-fixture', lifecycleEvidenceReference } }])
  const plan = planLegacyCleanup(source, { ownerTaskId: '/do/runtime-fixture' })
  const planPath = path.join(directory, 'caller-plan.json')
  writeAtomic(planPath, plan)
  const planReference = { path: planPath, sha256: sha256(fs.readFileSync(planPath)), fingerprint: plan.planFingerprint }
  const { bindingPath: callerBindingPath } = writeBinding(directory, planReference, { filename: 'caller-binding.json' })
  const { confirmation, confirmationPath } = writeConfirmation(directory, planReference, { filename: 'caller-confirmation.json' })
  const { bindingPath: trustedBindingPath } = writeBinding(directory, planReference, { filename: 'trusted-binding.json', stateVersion: 8, transitionId: 'cleanup-transition-8', humanConfirmationFingerprint: 'b'.repeat(64) })

  const attempt = spawnSync(process.execPath, [launcher, 'legacy-apply', '--plan', planPath, '--confirmation', confirmationPath, '--collaboration-binding', callerBindingPath], {
    encoding: 'utf8',
    env: { ...process.env, OES_LEGACY_CLEANUP_CURRENT_BINDING: trustedBindingPath }
  })
  assert.notEqual(attempt.status, 0)
  assert.match(attempt.stderr, /LEGACY_CLEANUP_COLLABORATION_BINDING_MISMATCH/u)
  assert.doesNotMatch(attempt.stderr, /docker inspect|runChecked/u)
})

test('legacy apply accepts a matching binding supplied independently by the Collaboration boundary', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-legacy-trusted-binding-'))
  const source = inventory([{ ...base, type: 'volume', objectId: 'v1', classification: 'UNKNOWN_OR_INSUFFICIENT_EVIDENCE', plannedAction: 'PRESERVE_AND_RESOLVE_OWNER' }])
  const plan = planLegacyCleanup(source, { ownerTaskId: '/do/runtime-fixture' })
  const planPath = path.join(directory, 'plan.json')
  writeAtomic(planPath, plan)
  const planReference = { path: planPath, sha256: sha256(fs.readFileSync(planPath)), fingerprint: plan.planFingerprint }
  const { bindingPath } = writeBinding(directory, planReference)
  const { confirmation, confirmationPath } = writeConfirmation(directory, planReference)

  const attempt = spawnSync(process.execPath, [launcher, 'legacy-apply', '--plan', planPath, '--confirmation', confirmationPath], {
    encoding: 'utf8',
    env: { ...process.env, OES_LEGACY_CLEANUP_CURRENT_BINDING: bindingPath }
  })
  assert.equal(attempt.status, 0, attempt.stderr)
  const result = JSON.parse(attempt.stdout)
  assert.equal(result.results[0].disposition, 'PRESERVED_NOT_AUTHORIZED_DELETE_SET')
})
