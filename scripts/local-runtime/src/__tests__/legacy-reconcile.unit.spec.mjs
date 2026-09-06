import assert from 'node:assert/strict'
import test from 'node:test'
import { fingerprint } from '../canonical.mjs'
import { observeLegacyResidue, planLegacyCleanup } from '../legacy-reconcile.mjs'

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
  const first = planLegacyCleanup(source)
  const second = planLegacyCleanup(source)
  assert.deepEqual(first, second)
  assert.deepEqual(first.actions.map((action) => action.type), ['container', 'network', 'volume'])
  assert.deepEqual(first.residueExpectation.preservedSet, ['volume:v1'])
  const observation = observeLegacyResidue(first, source)
  assert.equal(observation.observations.find((item) => item.key === 'volume:v1').disposition, 'PRESERVED_OUTSIDE_DELETE_SET')
})
