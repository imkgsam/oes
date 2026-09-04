import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  assertAdditiveInventoryMigration,
  assertReceiptOwnerFacts,
  classifyInventoryState,
  inventoryDigest,
  normalizeInventory
} from '../machine-workload-inventory-lib.mjs'

const load = async (version) =>
  JSON.parse(
    await readFile(
      new URL(`../runtime-config/machine-workload-inventory/v${version}.json`, import.meta.url)
    )
  )

test('fresh v2 provisions directly and exact v2 retry is a no-op', async () => {
  const v2 = await load(2)
  const fresh = classifyInventoryState({ receipts: [], manifest: v2 })
  assert.equal(fresh.action, 'PROVISION_FRESH')
  const receipts = v2.entries.map((entry) => ({
    inventoryEntryKey: entry.inventoryEntryKey,
    manifestVersion: '2',
    manifestDigest: inventoryDigest(v2)
  }))
  assert.equal(classifyInventoryState({ receipts, manifest: v2 }).action, 'NOOP')
})

test('v1 to v2 is exact additive and rejects changed, reordered, removed or repointed entries', async () => {
  const v1 = await load(1)
  const v2 = await load(2)
  assert.deepEqual(
    assertAdditiveInventoryMigration(v1, v2).added.map((entry) => entry.inventoryEntryKey),
    ['collaboration-service']
  )
  for (const invalid of [
    { ...v2, entries: [v2.entries[1], v2.entries[0]] },
    { version: '2', entries: [v1.entries[0]] },
    { ...v2, entries: [{ ...v2.entries[0], displayName: 'Changed' }, v2.entries[1]] },
    {
      ...v2,
      entries: [{ ...v2.entries[0], workloadSpiffeId: 'spiffe://oes/repointed' }, v2.entries[1]]
    }
  ])
    assert.throws(() => assertAdditiveInventoryMigration(v1, invalid))
})

test('complete v1 migrates while partial, mixed and divergent receipt state fails before mutation', async () => {
  const v1 = await load(1)
  const v2 = await load(2)
  const receiptsV1 = v1.entries.map((entry) => ({
    inventoryEntryKey: entry.inventoryEntryKey,
    manifestVersion: '1',
    manifestDigest: inventoryDigest(v1)
  }))
  assert.equal(
    classifyInventoryState({ receipts: receiptsV1, manifest: v2, previousManifest: v1 }).action,
    'MIGRATE_ADDITIVE'
  )
  for (const receipts of [
    receiptsV1.slice(0, -1),
    receiptsV1.map((receipt, index) => index === 0 ? { ...receipt, manifestDigest: 'wrong' } : receipt),
    [
      ...receiptsV1,
      {
        ...receiptsV1[0],
        inventoryEntryKey: 'collaboration-service',
        manifestVersion: '2',
        manifestDigest: inventoryDigest(v2)
      }
    ],
    [{ ...receiptsV1[0], inventoryEntryKey: 'unknown-service' }]
  ])
    assert.throws(
      () => classifyInventoryState({ receipts, manifest: v2, previousManifest: v1 }),
      /DIVERGED/
    )
})

test('owner facts preserve exact principal, binding, audit and immutable SPIFFE invariants', async () => {
  const [entry] = normalizeInventory(await load(1)).entries
  const receipt = {
    inventoryEntryKey: entry.inventoryEntryKey,
    serviceAccountId: 'principal-1',
    machineWorkloadBindingId: 'binding-1',
    auditReference: 'audit-1',
    serviceAccount: {
      id: 'principal-1',
      type: 'INTERNAL_SERVICE',
      scopeLevel: 'SYSTEM',
      tenantId: null,
      status: 'ACTIVE'
    },
    machineWorkloadBinding: {
      id: 'binding-1',
      serviceAccountId: 'principal-1',
      workloadSpiffeId: entry.workloadSpiffeId,
      status: 'ACTIVE',
      version: 1n
    },
    audit: { eventId: 'audit-1' }
  }
  assert.doesNotThrow(() => assertReceiptOwnerFacts([receipt], [entry]))
  assert.throws(
    () =>
      assertReceiptOwnerFacts(
        [
          {
            ...receipt,
            machineWorkloadBinding: {
              ...receipt.machineWorkloadBinding,
              workloadSpiffeId: 'spiffe://oes/wrong'
            }
          }
        ],
        [entry]
      ),
    /OWNER_FACT_MISMATCH/
  )
})

test('inventory rejects wildcard, tenant and bot authority', () => {
  const base = {
    version: '1',
    entries: [
      {
        inventoryEntryKey: 'x',
        displayName: 'X',
        machineType: 'INTERNAL_SERVICE',
        scopeLevel: 'SYSTEM',
        workloadSpiffeId: 'spiffe://oes/x'
      }
    ]
  }
  assert.throws(() =>
    normalizeInventory({
      ...base,
      entries: [{ ...base.entries[0], workloadSpiffeId: 'spiffe://oes/*' }]
    })
  )
  assert.throws(() =>
    normalizeInventory({ ...base, entries: [{ ...base.entries[0], scopeLevel: 'TENANT' }] })
  )
  assert.throws(() =>
    normalizeInventory({
      ...base,
      entries: [{ ...base.entries[0], machineType: 'AUTOMATION_BOT' }]
    })
  )
})
