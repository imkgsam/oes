import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fingerprint, sha256, writeAtomic } from '../canonical.mjs'
import { applyLegacyCleanup, observeLegacyResidue, planLegacyCleanup } from '../legacy-reconcile.mjs'

function inventory(resources) {
  const raw = { schemaVersion: 2, kind: 'OES_LEGACY_RUNTIME_INVENTORY', observedAt: '2026-09-06T00:00:00.000Z', readOnly: true, resources }
  return { ...raw, inventoryFingerprint: fingerprint(raw) }
}
const base = { name: 'oes-old', labels: { 'com.docker.compose.project': 'oes-old' }, state: 'exited', active: false, attachments: [], mounts: [], reason: 'fixture', evidenceDigest: 'a'.repeat(64) }

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

test('legacy apply rejects caller-fabricated confirmation and reopens a protected owner binding', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'oes-legacy-confirmation-'))
  const source = inventory([{ ...base, type: 'volume', objectId: 'v1', classification: 'UNKNOWN_OR_INSUFFICIENT_EVIDENCE', plannedAction: 'PRESERVE_AND_RESOLVE_OWNER' }])
  const plan = planLegacyCleanup(source, { ownerTaskId: '/do/runtime-fixture' })
  const planPath = path.join(directory, 'plan.json')
  writeAtomic(planPath, plan)
  const fabricated = { kind: 'OES_LEGACY_CLEANUP_CONFIRMATION', status: 'CONFIRMED', planFingerprint: plan.planFingerprint }
  fabricated.confirmationFingerprint = fingerprint(fabricated)
  const fabricatedPath = path.join(directory, 'fabricated.json')
  writeAtomic(fabricatedPath, fabricated)

  assert.throws(() => applyLegacyCleanup({ plan, planPath, confirmation: fabricated, confirmationPath: fabricatedPath }), /PLAN_PATH_REQUIRED|CONFIRMATION_INVALID/u)

  const planReference = { path: planPath, sha256: sha256(fs.readFileSync(planPath)), fingerprint: plan.planFingerprint }
  const bindingRaw = {
    schemaVersion: 2,
    kind: 'OES_LEGACY_CLEANUP_CURRENT_BINDING',
    status: 'ACTIVE',
    expectedState: 'LEGACY_CLEANUP_AUTHORIZED',
    ownerTaskId: '/do/runtime-fixture',
    stateVersion: 7,
    transitionId: 'cleanup-transition-7',
    humanConfirmationFingerprint: 'a'.repeat(64),
    planReference
  }
  const binding = { ...bindingRaw, recordFingerprint: fingerprint(bindingRaw) }
  const bindingPath = path.join(directory, 'current-binding.json')
  writeAtomic(bindingPath, binding)
  const confirmationRaw = {
    schemaVersion: 2,
    kind: 'OES_LEGACY_CLEANUP_CONFIRMATION',
    status: 'CONFIRMED',
    expectedState: 'LEGACY_CLEANUP_AUTHORIZED',
    ownerTaskId: '/do/runtime-fixture',
    stateVersion: 7,
    transitionId: 'cleanup-transition-7',
    humanConfirmationFingerprint: 'a'.repeat(64),
    planReference,
    collaborationBindingReference: { path: bindingPath, sha256: sha256(fs.readFileSync(bindingPath)), fingerprint: binding.recordFingerprint }
  }
  const confirmation = { ...confirmationRaw, confirmationFingerprint: fingerprint(confirmationRaw) }
  const confirmationPath = path.join(directory, 'confirmation.json')
  writeAtomic(confirmationPath, confirmation)

  const result = applyLegacyCleanup({ plan, planPath, confirmation, confirmationPath })
  assert.equal(result.results[0].disposition, 'PRESERVED_NOT_AUTHORIZED_DELETE_SET')
})
