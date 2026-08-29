#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import { chmod, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  assertReceiptOwnerFacts,
  classifyInventoryState,
  inventoryDigest,
  normalizeInventory
} from './machine-workload-inventory-lib.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

// Parses the deployment-only inventory command without accepting runtime workload input.
function parseArgs(argv) {
  const values = {}
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]
    const value = argv[index + 1]
    if (!key?.startsWith('--') || !value)
      throw new Error('SYSTEM_MACHINE_INVENTORY_ARGUMENT_INVALID')
    values[key.slice(2)] = value
  }
  for (const required of ['manifest', 'deployment-revision', 'output']) {
    if (!values[required]?.trim())
      throw new Error(
        `SYSTEM_MACHINE_INVENTORY_${required.toUpperCase().replaceAll('-', '_')}_REQUIRED`
      )
  }
  return values
}

async function loadManifest(path) {
  return normalizeInventory(JSON.parse(await readFile(resolve(root, path), 'utf8')))
}

function auditRow({ eventType, resourceType, resourceId, deploymentRevision, details }) {
  return {
    eventId: randomUUID(),
    service: 'identity-service',
    module: 'machine-workload-inventory',
    eventType,
    occurredAt: new Date(),
    result: 'SUCCEEDED',
    operatorType: 'SYSTEM',
    resourceType,
    resourceId,
    details: { deploymentRevision, ...details }
  }
}

// Creates one fixed SYSTEM principal, binding and immutable receipt in the caller's transaction.
async function provisionEntry(tx, entry, manifest, digest, deploymentRevision) {
  const principalId = randomUUID()
  const bindingId = randomUUID()
  const audit = auditRow({
    eventType: 'MACHINE_WORKLOAD_INVENTORY_ENTRY_PROVISIONED',
    resourceType: 'MACHINE_WORKLOAD_INVENTORY_ENTRY',
    resourceId: entry.inventoryEntryKey,
    deploymentRevision,
    details: {
      manifestVersion: manifest.version,
      manifestDigest: digest,
      workloadSpiffeId: entry.workloadSpiffeId
    }
  })
  await tx.auditEvent.create({ data: audit })
  await tx.serviceAccount.create({
    data: {
      id: principalId,
      tenantId: null,
      scopeLevel: 'SYSTEM',
      type: 'INTERNAL_SERVICE',
      name: entry.displayName,
      status: 'ACTIVE',
      createdBy: `deployment:${deploymentRevision}`
    }
  })
  await tx.machineWorkloadBinding.create({
    data: {
      id: bindingId,
      serviceAccountId: principalId,
      workloadSpiffeId: entry.workloadSpiffeId,
      idempotencyKey: `fixed-system:${entry.inventoryEntryKey}`,
      status: 'ACTIVE',
      version: 1n,
      createdBy: `deployment:${deploymentRevision}`,
      enrollmentAuditRef: audit.eventId
    }
  })
  await tx.machineWorkloadProvisioningReceipt.create({
    data: {
      inventoryEntryKey: entry.inventoryEntryKey,
      manifestVersion: manifest.version,
      manifestDigest: digest,
      serviceAccountId: principalId,
      machineWorkloadBindingId: bindingId,
      deploymentRevision,
      auditReference: audit.eventId
    }
  })
}

// Reconciles only empty, exact previous-version or exact current-version owner state atomically.
export async function reconcileMachineWorkloadInventory(
  prisma,
  { manifest, previousManifest, deploymentRevision }
) {
  return prisma.$transaction(async (tx) => {
    const receipts = await tx.machineWorkloadProvisioningReceipt.findMany({
      include: { serviceAccount: true, machineWorkloadBinding: true, audit: true },
      orderBy: { inventoryEntryKey: 'asc' }
    })
    const state = classifyInventoryState({ receipts, manifest, previousManifest })

    if (state.action === 'PROVISION_FRESH') {
      const [principalCount, bindingCount] = await Promise.all([
        tx.serviceAccount.count({ where: { type: 'INTERNAL_SERVICE', scopeLevel: 'SYSTEM' } }),
        tx.machineWorkloadBinding.count({
          where: { idempotencyKey: { startsWith: 'fixed-system:' } }
        })
      ])
      if (principalCount !== 0 || bindingCount !== 0)
        throw new Error('SYSTEM_MACHINE_INVENTORY_UNRECEIPTED_OWNER_FACTS')
      for (const entry of state.target.entries)
        await provisionEntry(tx, entry, state.target, state.targetDigest, deploymentRevision)
    } else {
      assertReceiptOwnerFacts(receipts, state.target.entries)
      if (state.action === 'MIGRATE_ADDITIVE') {
        const migrationAudit = auditRow({
          eventType: 'MACHINE_WORKLOAD_INVENTORY_MIGRATED',
          resourceType: 'MACHINE_WORKLOAD_INVENTORY',
          resourceId: `${state.migration.previous.version}->${state.target.version}`,
          deploymentRevision,
          details: { previousDigest: state.previousDigest, manifestDigest: state.targetDigest }
        })
        await tx.auditEvent.create({ data: migrationAudit })
        await tx.machineWorkloadProvisioningReceipt.updateMany({
          where: {
            manifestVersion: state.migration.previous.version,
            manifestDigest: state.previousDigest
          },
          data: { manifestVersion: state.target.version, manifestDigest: state.targetDigest }
        })
        for (const entry of state.migration.added)
          await provisionEntry(tx, entry, state.target, state.targetDigest, deploymentRevision)
      }
    }

    const ready = await tx.machineWorkloadProvisioningReceipt.findMany({
      include: { serviceAccount: true, machineWorkloadBinding: true, audit: true },
      orderBy: { inventoryEntryKey: 'asc' }
    })
    assertReceiptOwnerFacts(ready, state.target.entries)
    if (
      ready.length !== state.target.entries.length ||
      ready.some(
        (receipt) =>
          receipt.manifestVersion !== state.target.version ||
          receipt.manifestDigest !== state.targetDigest
      )
    )
      throw new Error('SYSTEM_MACHINE_INVENTORY_NOT_READY')
    return ready.map((receipt) => ({
      inventoryEntryKey: receipt.inventoryEntryKey,
      machinePrincipalId: receipt.serviceAccountId,
      machineWorkloadBindingId: receipt.machineWorkloadBindingId,
      machineWorkloadBindingVersion: receipt.machineWorkloadBinding.version.toString()
    }))
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const [{ PrismaClient }, manifest, previousManifest] = await Promise.all([
    import(
      pathToFileURL(
        resolve(root, 'src/services/system/identity-service/prisma/generated/prisma/index.js')
      ).href
    ),
    loadManifest(args.manifest),
    args['previous-manifest'] ? loadManifest(args['previous-manifest']) : Promise.resolve(undefined)
  ])
  const prisma = new PrismaClient()
  try {
    const selectors = await reconcileMachineWorkloadInventory(prisma, {
      manifest,
      previousManifest,
      deploymentRevision: args['deployment-revision']
    })
    const output = resolve(root, args.output)
    const temporary = `${output}.${process.pid}.tmp`
    await writeFile(
      temporary,
      `${JSON.stringify({ manifestVersion: manifest.version, manifestDigest: inventoryDigest(manifest), selectors }, null, 2)}\n`,
      { mode: 0o600 }
    )
    await chmod(temporary, 0o600)
    await rename(temporary, output)
  } finally {
    await prisma.$disconnect()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
