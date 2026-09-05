import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { objectFingerprint } from '../canonical.ts'
import {
  validateCoordinationLifecycleInventory,
  validateCoordinationLifecycleRosterAuthority
} from '../coordination-lifecycle.ts'
import { validateJsonSchema } from '../schema-validation.ts'
import type {
  CoordinationLifecycleCreatedTask,
  CoordinationLifecycleRosterAuthority,
  CoordinationLifecycleTask
} from '../types.ts'

const fingerprint = 'a'.repeat(64)
const schema = (name: string) =>
  JSON.parse(
    readFileSync(join(import.meta.dirname, '..', '..', 'schemas', name), 'utf8')
  ) as Record<string, unknown>

function authority(): CoordinationLifecycleRosterAuthority {
  const createdRoster: CoordinationLifecycleCreatedTask[] = [
    {
      taskId: '/root/co',
      taskKind: 'CO',
      ownerTaskId: null,
      creationReceiptFingerprint: fingerprint
    },
    {
      taskId: '/root/co/do-a',
      taskKind: 'DO',
      ownerTaskId: '/root/co',
      creationReceiptFingerprint: fingerprint
    },
    {
      taskId: '/root/co/do-b',
      taskKind: 'DO',
      ownerTaskId: '/root/co',
      creationReceiptFingerprint: fingerprint
    },
    {
      taskId: '/root/co/do-a/rv',
      taskKind: 'RV',
      ownerTaskId: '/root/co/do-a',
      creationReceiptFingerprint: fingerprint
    },
    {
      taskId: '/root/co/do-b/rv',
      taskKind: 'RV',
      ownerTaskId: '/root/co/do-b',
      creationReceiptFingerprint: fingerprint
    },
    {
      taskId: '/root/co/rv',
      taskKind: 'RV',
      ownerTaskId: '/root/co',
      creationReceiptFingerprint: fingerprint
    },
    {
      taskId: '/root/co/do-a/helper',
      taskKind: 'BOUNDED_HELPER',
      ownerTaskId: '/root/co/do-a',
      creationReceiptFingerprint: fingerprint
    }
  ]
  const value = {
    schemaVersion: 2 as const,
    kind: 'OES_COORDINATION_LIFECYCLE_ROSTER_AUTHORITY' as const,
    authorityFingerprint: '',
    coordinationKey: 'release',
    coordinationOwnerTaskId: '/root/co',
    transitionId: 'coordination:cleanup:1',
    coordinationCleanupAuthorizationFingerprint: 'b'.repeat(64),
    source: 'TASK_NATIVE_CREATION_RECEIPTS' as const,
    createdRoster
  }
  return {
    ...value,
    authorityFingerprint: objectFingerprint(
      value as unknown as Record<string, unknown>,
      'authorityFingerprint'
    )
  }
}

test('closed coordination topology requires two DOs, each scoped RV, and one aggregate RV', () => {
  const value = authority()
  validateCoordinationLifecycleRosterAuthority(value)
  validateJsonSchema(schema('coordination-lifecycle-roster-authority.schema.json'), value)
  const missing = authority()
  missing.createdRoster = missing.createdRoster.filter((task) => task.taskId !== '/root/co/rv')
  missing.authorityFingerprint = objectFingerprint(
    missing as unknown as Record<string, unknown>,
    'authorityFingerprint'
  )
  assert.throws(() => validateCoordinationLifecycleRosterAuthority(missing), /AGGREGATE_RV_MISSING/)
})

test('inventory binds every terminal task to the immutable creation roster', () => {
  const auth = authority()
  const readbackRoster: CoordinationLifecycleTask[] = auth.createdRoster.map(
    ({ creationReceiptFingerprint: _, ...task }) => ({ ...task, state: 'TERMINAL' })
  )
  const value = {
    schemaVersion: 2 as const,
    kind: 'OES_COORDINATION_LIFECYCLE_INVENTORY' as const,
    inventoryFingerprint: '',
    coordinationKey: auth.coordinationKey,
    coordinationOwnerTaskId: auth.coordinationOwnerTaskId,
    transitionId: auth.transitionId,
    coordinationCleanupAuthorizationFingerprint: auth.coordinationCleanupAuthorizationFingerprint,
    cleanupIntentDetected: true as const,
    coordinationExit: 'PASSED' as const,
    resourceCleanup: 'VERIFIED' as const,
    rosterAuthorityFingerprint: auth.authorityFingerprint,
    taskReadbackSource: 'CODEX_TASK_NATIVE' as const,
    readbackRosterFingerprint: objectFingerprint(
      readbackRoster as unknown as Record<string, unknown>,
      '__none__'
    ),
    readbackRoster,
    terminalTaskIds: readbackRoster.map((task) => task.taskId)
  }
  const inventory = {
    ...value,
    inventoryFingerprint: objectFingerprint(
      value as unknown as Record<string, unknown>,
      'inventoryFingerprint'
    )
  }
  validateCoordinationLifecycleInventory(auth, inventory)
  validateJsonSchema(schema('coordination-lifecycle-inventory.schema.json'), inventory)
  validateJsonSchema(schema('coordination-archive-result-set.schema.json'), {
    schemaVersion: 2,
    kind: 'OES_COORDINATION_ARCHIVE_RESULT_SET',
    resultSetFingerprint: 'c'.repeat(64),
    coordinationKey: auth.coordinationKey,
    coordinationOwnerTaskId: auth.coordinationOwnerTaskId,
    transitionId: auth.transitionId,
    coordinationCleanupAuthorizationFingerprint: auth.coordinationCleanupAuthorizationFingerprint,
    inventoryFingerprint: inventory.inventoryFingerprint,
    results: [
      {
        taskId: '/root/co/do-a/helper',
        taskKind: 'BOUNDED_HELPER',
        state: 'ARCHIVED',
        inventoryFingerprint: inventory.inventoryFingerprint,
        taskNativeReadbackFingerprint: 'd'.repeat(64),
        resultFingerprint: 'e'.repeat(64)
      }
    ]
  })
})
