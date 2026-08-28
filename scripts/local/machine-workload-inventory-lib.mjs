import { createHash } from 'node:crypto'

const REQUIRED_KEYS = [
  'inventoryEntryKey',
  'displayName',
  'machineType',
  'scopeLevel',
  'workloadSpiffeId'
]

// Canonicalizes and validates a fixed SYSTEM/INTERNAL_SERVICE inventory manifest.
export function normalizeInventory(manifest) {
  if (!manifest || typeof manifest.version !== 'string' || !/^[1-9]\d*$/.test(manifest.version)) {
    throw new Error('SYSTEM_MACHINE_INVENTORY_VERSION_INVALID')
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw new Error('SYSTEM_MACHINE_INVENTORY_EMPTY')
  }

  const keys = new Set()
  const spiffeIds = new Set()
  const entries = manifest.entries.map((entry) => {
    if (!entry || Object.keys(entry).sort().join(',') !== [...REQUIRED_KEYS].sort().join(',')) {
      throw new Error('SYSTEM_MACHINE_INVENTORY_ENTRY_SHAPE_INVALID')
    }
    const normalized = Object.fromEntries(
      REQUIRED_KEYS.map((key) => [key, typeof entry[key] === 'string' ? entry[key].trim() : ''])
    )
    if (Object.values(normalized).some((value) => !value)) {
      throw new Error('SYSTEM_MACHINE_INVENTORY_ENTRY_INVALID')
    }
    if (normalized.machineType !== 'INTERNAL_SERVICE' || normalized.scopeLevel !== 'SYSTEM') {
      throw new Error('SYSTEM_MACHINE_INVENTORY_AUTHORITY_INVALID')
    }
    if (!/^spiffe:\/\/oes\/[a-z0-9-]+$/.test(normalized.workloadSpiffeId)) {
      throw new Error('SYSTEM_MACHINE_INVENTORY_SPIFFE_INVALID')
    }
    if (keys.has(normalized.inventoryEntryKey) || spiffeIds.has(normalized.workloadSpiffeId)) {
      throw new Error('SYSTEM_MACHINE_INVENTORY_DUPLICATE')
    }
    keys.add(normalized.inventoryEntryKey)
    spiffeIds.add(normalized.workloadSpiffeId)
    return normalized
  })

  return { version: manifest.version, entries }
}

// Produces a stable digest without allowing array reordering to masquerade as an additive migration.
export function inventoryDigest(manifest) {
  return createHash('sha256')
    .update(JSON.stringify(normalizeInventory(manifest)))
    .digest('hex')
}

// Requires a version advance whose old ordered entries remain byte-for-byte semantically identical.
export function assertAdditiveInventoryMigration(previous, next) {
  const before = normalizeInventory(previous)
  const after = normalizeInventory(next)
  if (
    Number(after.version) !== Number(before.version) + 1 ||
    after.entries.length <= before.entries.length
  ) {
    throw new Error('SYSTEM_MACHINE_INVENTORY_MIGRATION_NOT_ADDITIVE')
  }
  for (let index = 0; index < before.entries.length; index += 1) {
    if (JSON.stringify(before.entries[index]) !== JSON.stringify(after.entries[index])) {
      throw new Error('SYSTEM_MACHINE_INVENTORY_EXISTING_ENTRY_CHANGED')
    }
  }
  return { previous: before, next: after, added: after.entries.slice(before.entries.length) }
}

// Classifies persisted owner facts before any write so partial/mixed/divergent state fails closed.
export function classifyInventoryState({ receipts, manifest, previousManifest }) {
  const target = normalizeInventory(manifest)
  const targetDigest = inventoryDigest(target)
  if (receipts.length === 0) return { action: 'PROVISION_FRESH', target, targetDigest }

  const targetKeys = new Set(target.entries.map((entry) => entry.inventoryEntryKey))
  if (receipts.some((receipt) => !targetKeys.has(receipt.inventoryEntryKey))) {
    throw new Error('SYSTEM_MACHINE_INVENTORY_DIVERGED')
  }
  if (
    receipts.length === target.entries.length &&
    receipts.every(
      (receipt) =>
        receipt.manifestVersion === target.version && receipt.manifestDigest === targetDigest
    )
  ) {
    return { action: 'NOOP', target, targetDigest }
  }

  if (!previousManifest) throw new Error('SYSTEM_MACHINE_INVENTORY_MIGRATION_REQUIRED')
  const migration = assertAdditiveInventoryMigration(previousManifest, target)
  const previousDigest = inventoryDigest(migration.previous)
  const previousKeys = migration.previous.entries.map((entry) => entry.inventoryEntryKey)
  if (
    receipts.length !== previousKeys.length ||
    !previousKeys.every((key) =>
      receipts.some(
        (receipt) =>
          receipt.inventoryEntryKey === key &&
          receipt.manifestVersion === migration.previous.version &&
          receipt.manifestDigest === previousDigest
      )
    )
  ) {
    throw new Error('SYSTEM_MACHINE_INVENTORY_DIVERGED')
  }
  return { action: 'MIGRATE_ADDITIVE', target, targetDigest, previousDigest, migration }
}

// Verifies receipt-linked live owner facts before selecting no-op or migration behavior.
export function assertReceiptOwnerFacts(receipts, entries) {
  const byKey = new Map(entries.map((entry) => [entry.inventoryEntryKey, entry]))
  for (const receipt of receipts) {
    const expected = byKey.get(receipt.inventoryEntryKey)
    if (
      !expected ||
      receipt.serviceAccount?.type !== 'INTERNAL_SERVICE' ||
      receipt.serviceAccount?.scopeLevel !== 'SYSTEM' ||
      receipt.serviceAccount?.tenantId != null ||
      receipt.serviceAccount?.status !== 'ACTIVE' ||
      receipt.machineWorkloadBinding?.serviceAccountId !== receipt.serviceAccountId ||
      receipt.machineWorkloadBinding?.workloadSpiffeId !== expected.workloadSpiffeId ||
      receipt.machineWorkloadBinding?.status !== 'ACTIVE' ||
      BigInt(receipt.machineWorkloadBinding?.version ?? 0) <= 0n ||
      receipt.audit?.eventId !== receipt.auditReference
    ) {
      throw new Error('SYSTEM_MACHINE_INVENTORY_OWNER_FACT_MISMATCH')
    }
  }
}
