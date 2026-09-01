import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { objectFingerprint } from '../src/canonical.ts'
import { planStageLifecycle } from '../src/stage-lifecycle.ts'
import { validateJsonSchema } from '../src/schema-validation.ts'
import type { StageArchiveResult, StageLifecycleInventory } from '../src/types.ts'

/** Creates a complete terminal Stage roster plus a long-lived Global UD. */
function inventory(): StageLifecycleInventory {
  const createdRoster: StageLifecycleInventory['createdRoster'] = [
    { taskId: '/root/sl/it', role: 'IT', ownerTaskId: '/root/sl/fl', state: 'TERMINAL' },
    { taskId: '/root/sl/ri', role: 'FEATURE_RI', ownerTaskId: '/root/sl/fl', state: 'TERMINAL' },
    { taskId: '/root/sl/fl', role: 'FL', ownerTaskId: '/root/sl', state: 'TERMINAL' },
    { taskId: '/root/sl/design', role: 'STAGE_DESIGN', ownerTaskId: '/root/sl', state: 'TERMINAL' },
    { taskId: '/root/sl/stage-ri', role: 'STAGE_RI', ownerTaskId: '/root/sl', state: 'TERMINAL' },
    { taskId: '/root/sl', role: 'SL', ownerTaskId: null, state: 'TERMINAL' },
    { taskId: '/root/ud', role: 'GLOBAL_UD', ownerTaskId: null, state: 'ACTIVE' }
  ]
  const value: StageLifecycleInventory = {
    schemaVersion: 1,
    kind: 'OES_STAGE_LIFECYCLE_INVENTORY',
    inventoryFingerprint: '',
    stageKey: 'stage-one',
    stageOwnerTaskId: '/root/sl',
    cleanupIntentDetected: true,
    stageExit: 'PASSED',
    resourceCleanup: 'VERIFIED',
    createdRoster,
    terminalTaskIds: createdRoster
      .filter((task) => task.state === 'TERMINAL')
      .map((task) => task.taskId)
  }
  value.inventoryFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'inventoryFingerprint'
  )
  return value
}

/** Seals one exact archive result. */
function result(
  taskId: string,
  role: StageArchiveResult['role'],
  state: StageArchiveResult['state']
): StageArchiveResult {
  return {
    taskId,
    role,
    state,
    resultFingerprint: objectFingerprint({ taskId, role, state }, '__none__')
  }
}

test('automatic archive exposes only the earliest incomplete dependency tier', () => {
  const value = inventory()
  const first = planStageLifecycle(value)
  assert.equal(first.status, 'ARCHIVE_READY')
  assert.deepEqual(
    first.decisions
      .filter((decision) => decision.decision === 'ARCHIVE')
      .map((decision) => decision.role)
      .sort(),
    ['FEATURE_RI', 'IT']
  )
  assert.equal(first.decisions.at(-1)?.decision, 'EXCLUDE_GLOBAL_UD')
  const second = planStageLifecycle(value, [
    result('/root/sl/it', 'IT', 'ARCHIVED'),
    result('/root/sl/ri', 'FEATURE_RI', 'ARCHIVED')
  ])
  assert.deepEqual(
    second.decisions
      .filter((decision) => decision.decision === 'ARCHIVE')
      .map((decision) => decision.role),
    ['FL']
  )
})

test('archive partial failure retries only the failed tier and preserves completed tasks', () => {
  const value = inventory()
  const plan = planStageLifecycle(value, [
    result('/root/sl/it', 'IT', 'ARCHIVED'),
    result('/root/sl/ri', 'FEATURE_RI', 'FAILED')
  ])
  assert.equal(plan.status, 'ARCHIVE_PARTIAL_FAILURE')
  assert.equal(
    plan.decisions.find((item) => item.taskId === '/root/sl/it')?.decision,
    'SKIP_ARCHIVED'
  )
  assert.equal(plan.decisions.find((item) => item.taskId === '/root/sl/ri')?.decision, 'ARCHIVE')
  assert.equal(plan.decisions.find((item) => item.role === 'FL')?.decision, 'PRESERVE_BLOCKED')
})

test('archive waits for full terminal roster and verified resource cleanup', () => {
  const value = inventory()
  value.createdRoster[2].state = 'UNKNOWN'
  value.terminalTaskIds = value.terminalTaskIds.filter((taskId) => taskId !== '/root/sl/fl')
  value.inventoryFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'inventoryFingerprint'
  )
  assert.equal(planStageLifecycle(value).status, 'WAIT_TERMINAL_ROSTER')
  value.createdRoster[2].state = 'TERMINAL'
  value.terminalTaskIds.push('/root/sl/fl')
  value.resourceCleanup = 'PARTIAL_FAILURE'
  value.inventoryFingerprint = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'inventoryFingerprint'
  )
  assert.equal(planStageLifecycle(value).status, 'WAIT_RESOURCE_CLEANUP')
})

test('Stage lifecycle schema rejects undeclared or missing roster state', () => {
  const schema = JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', 'schemas', 'stage-lifecycle-inventory.schema.json'),
      'utf8'
    )
  ) as Record<string, unknown>
  const value = inventory()
  assert.doesNotThrow(() => validateJsonSchema(schema, value))
  assert.throws(() => validateJsonSchema(schema, { ...value, extra: true }), /additionalProperties/)
})
