import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { objectFingerprint } from '../src/canonical.ts'
import { planStageLifecycle } from '../src/stage-lifecycle.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'
import type {
  StageArchiveResult,
  StageLifecycleInventory,
  StageLifecycleRosterAuthority
} from '../src/types.ts'

/** Creates a complete terminal Stage roster plus a long-lived Global UD. */
function fixture(): {
  authority: StageLifecycleRosterAuthority
  inventory: StageLifecycleInventory
} {
  const createdRoster: StageLifecycleInventory['readbackRoster'] = [
    { taskId: '/root/sl/it', role: 'IT', ownerTaskId: '/root/sl/fl-a', state: 'TERMINAL' },
    {
      taskId: '/root/sl/ri-a',
      role: 'FEATURE_RI',
      ownerTaskId: '/root/sl/fl-a',
      state: 'TERMINAL'
    },
    { taskId: '/root/sl/fl-a', role: 'FL', ownerTaskId: '/root/sl', state: 'TERMINAL' },
    {
      taskId: '/root/sl/ri-b',
      role: 'FEATURE_RI',
      ownerTaskId: '/root/sl/fl-b',
      state: 'TERMINAL'
    },
    { taskId: '/root/sl/fl-b', role: 'FL', ownerTaskId: '/root/sl', state: 'TERMINAL' },
    { taskId: '/root/sl/design', role: 'STAGE_DESIGN', ownerTaskId: '/root/sl', state: 'TERMINAL' },
    { taskId: '/root/sl/stage-ri', role: 'STAGE_RI', ownerTaskId: '/root/sl', state: 'TERMINAL' },
    { taskId: '/root/sl', role: 'SL', ownerTaskId: null, state: 'TERMINAL' },
    { taskId: '/root/ud', role: 'GLOBAL_UD', ownerTaskId: null, state: 'ACTIVE' }
  ]
  const authority: StageLifecycleRosterAuthority = {
    schemaVersion: 1,
    kind: 'OES_STAGE_LIFECYCLE_ROSTER_AUTHORITY',
    authorityFingerprint: '',
    stageKey: 'stage-one',
    stageOwnerTaskId: '/root/sl',
    source: 'TASK_NATIVE_CREATION_RECEIPTS',
    createdRoster: createdRoster.map(({ taskId, role, ownerTaskId }, index) => ({
      taskId,
      role,
      ownerTaskId,
      creationReceiptFingerprint: `${((index % 6) + 1).toString(16)}`.repeat(64)
    }))
  }
  authority.authorityFingerprint = objectFingerprint(
    authority as unknown as Record<string, unknown>,
    'authorityFingerprint'
  )
  const value: StageLifecycleInventory = {
    schemaVersion: 1,
    kind: 'OES_STAGE_LIFECYCLE_INVENTORY',
    inventoryFingerprint: '',
    stageKey: 'stage-one',
    stageOwnerTaskId: '/root/sl',
    cleanupIntentDetected: true,
    stageExit: 'PASSED',
    resourceCleanup: 'VERIFIED',
    rosterAuthorityFingerprint: authority.authorityFingerprint,
    taskReadbackSource: 'CODEX_TASK_NATIVE',
    readbackRosterFingerprint: objectFingerprint(
      createdRoster as unknown as Record<string, unknown>,
      '__none__'
    ),
    readbackRoster: structuredClone(createdRoster),
    terminalTaskIds: createdRoster
      .filter((task) => task.state === 'TERMINAL')
      .map((task) => task.taskId)
  }
  value.inventoryFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'inventoryFingerprint'
  )
  return { authority, inventory: value }
}

/** Seals one exact archive result. */
function result(
  inventory: StageLifecycleInventory,
  taskId: string,
  role: StageArchiveResult['role'],
  state: StageArchiveResult['state']
): StageArchiveResult {
  const taskNativeReadbackFingerprint = objectFingerprint(
    { taskId, archived: state === 'ARCHIVED' },
    '__none__'
  )
  return {
    taskId,
    role,
    state,
    inventoryFingerprint: inventory.inventoryFingerprint,
    taskNativeReadbackFingerprint,
    resultFingerprint: objectFingerprint(
      {
        taskId,
        role,
        state,
        inventoryFingerprint: inventory.inventoryFingerprint,
        taskNativeReadbackFingerprint
      },
      '__none__'
    )
  }
}

test('automatic archive exposes only the earliest incomplete dependency tier', () => {
  const { authority, inventory } = fixture()
  const first = planStageLifecycle(authority, inventory)
  assert.equal(first.status, 'ARCHIVE_READY')
  assert.deepEqual(
    first.decisions
      .filter((decision) => decision.decision === 'ARCHIVE')
      .map((decision) => decision.role)
      .sort(),
    ['FEATURE_RI', 'FEATURE_RI', 'IT']
  )
  assert.equal(first.decisions.at(-1)?.decision, 'EXCLUDE_GLOBAL_UD')
  const second = planStageLifecycle(authority, inventory, [
    result(inventory, '/root/sl/it', 'IT', 'ARCHIVED'),
    result(inventory, '/root/sl/ri-a', 'FEATURE_RI', 'ARCHIVED'),
    result(inventory, '/root/sl/ri-b', 'FEATURE_RI', 'ARCHIVED')
  ])
  assert.deepEqual(
    second.decisions
      .filter((decision) => decision.decision === 'ARCHIVE')
      .map((decision) => decision.role),
    ['FL', 'FL']
  )
})

test('archive partial failure retries only the failed tier and preserves completed tasks', () => {
  const { authority, inventory } = fixture()
  const plan = planStageLifecycle(authority, inventory, [
    result(inventory, '/root/sl/it', 'IT', 'ARCHIVED'),
    result(inventory, '/root/sl/ri-a', 'FEATURE_RI', 'FAILED')
  ])
  assert.equal(plan.status, 'ARCHIVE_PARTIAL_FAILURE')
  assert.equal(
    plan.decisions.find((item) => item.taskId === '/root/sl/it')?.decision,
    'SKIP_ARCHIVED'
  )
  assert.equal(plan.decisions.find((item) => item.taskId === '/root/sl/ri-a')?.decision, 'ARCHIVE')
  assert.equal(plan.decisions.find((item) => item.role === 'FL')?.decision, 'PRESERVE_BLOCKED')
})

test('archive waits for full terminal roster and verified resource cleanup', () => {
  const { authority, inventory } = fixture()
  inventory.readbackRoster[2].state = 'UNKNOWN'
  inventory.terminalTaskIds = inventory.terminalTaskIds.filter(
    (taskId) => taskId !== '/root/sl/fl-a'
  )
  inventory.readbackRosterFingerprint = objectFingerprint(
    inventory.readbackRoster as unknown as Record<string, unknown>,
    '__none__'
  )
  inventory.inventoryFingerprint = objectFingerprint(
    inventory as unknown as Record<string, unknown>,
    'inventoryFingerprint'
  )
  assert.equal(planStageLifecycle(authority, inventory).status, 'WAIT_TERMINAL_ROSTER')
  inventory.readbackRoster[2].state = 'TERMINAL'
  inventory.terminalTaskIds.push('/root/sl/fl-a')
  inventory.resourceCleanup = 'PARTIAL_FAILURE'
  inventory.readbackRosterFingerprint = objectFingerprint(
    inventory.readbackRoster as unknown as Record<string, unknown>,
    '__none__'
  )
  inventory.inventoryFingerprint = objectFingerprint(
    inventory as unknown as Record<string, unknown>,
    'inventoryFingerprint'
  )
  assert.equal(planStageLifecycle(authority, inventory).status, 'WAIT_RESOURCE_CLEANUP')
})

test('cleanup rejects a truncated self-consistent roster before SL archive', () => {
  const { authority, inventory } = fixture()
  const sl = authority.createdRoster.find((task) => task.role === 'SL')!
  authority.createdRoster = [sl]
  authority.authorityFingerprint = objectFingerprint(
    authority as unknown as Record<string, unknown>,
    'authorityFingerprint'
  )
  inventory.rosterAuthorityFingerprint = authority.authorityFingerprint
  inventory.readbackRoster = [
    { taskId: sl.taskId, role: sl.role, ownerTaskId: sl.ownerTaskId, state: 'TERMINAL' }
  ]
  inventory.terminalTaskIds = [sl.taskId]
  inventory.readbackRosterFingerprint = objectFingerprint(
    inventory.readbackRoster as unknown as Record<string, unknown>,
    '__none__'
  )
  inventory.inventoryFingerprint = objectFingerprint(
    inventory as unknown as Record<string, unknown>,
    'inventoryFingerprint'
  )
  assert.throws(
    () => planStageLifecycle(authority, inventory),
    /STAGE_LIFECYCLE_TOPOLOGY_INCOMPLETE/
  )
})

test('Stage lifecycle schema rejects undeclared or missing roster state', () => {
  const schema = JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', 'schemas', 'stage-lifecycle-inventory.schema.json'),
      'utf8'
    )
  ) as Record<string, unknown>
  const authoritySchema = JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', 'schemas', 'stage-lifecycle-roster-authority.schema.json'),
      'utf8'
    )
  ) as Record<string, unknown>
  const { authority, inventory } = fixture()
  assert.doesNotThrow(() => validateJsonSchema(authoritySchema, authority))
  assert.doesNotThrow(() => validateJsonSchema(schema, inventory))
  assert.throws(
    () => validateJsonSchema(schema, { ...inventory, extra: true }),
    /additionalProperties/
  )
})
