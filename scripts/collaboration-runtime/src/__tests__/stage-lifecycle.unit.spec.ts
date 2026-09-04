import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { objectFingerprint } from '../canonical.ts'
import {
  loadTrustedStageArchiveResults,
  loadTrustedStageLifecycleInventory,
  loadTrustedStageLifecycleRosterAuthority,
  planStageLifecycle
} from '../stage-lifecycle.ts'
import { validateJsonSchema } from '../schema-validation.ts'
import type {
  StageArchiveResult,
  StageArchiveResultSet,
  StageCleanupAuthorization,
  StageLifecycleInventory,
  StageLifecycleRosterAuthority,
  TrustedAuthorizationReference
} from '../types.ts'

const CLEANUP_FINGERPRINT = 'f'.repeat(64)
const TRANSITION_ID = 'stage:cleanup:1'

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
    transitionId: TRANSITION_ID,
    stageCleanupAuthorizationFingerprint: CLEANUP_FINGERPRINT,
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
    transitionId: TRANSITION_ID,
    stageCleanupAuthorizationFingerprint: CLEANUP_FINGERPRINT,
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

/** Reopens lifecycle inputs from one task-owner-read-only trust-root fixture. */
function trustedFixture(
  input = fixture(),
  priorResults: StageArchiveResult[] = []
): {
  authority: StageLifecycleRosterAuthority
  inventory: StageLifecycleInventory
  priorResults: StageArchiveResult[]
} {
  const root = mkdtempSync(join(tmpdir(), 'oes-stage-lifecycle-trust-'))
  const trust = {
    authorizationRoot: root,
    admissionRoot: root,
    profilePath: join(root, 'profile.toml'),
    profileSha256: 'a'.repeat(64),
    ownerTaskId: '/root/sl',
    profileTransitionId: TRANSITION_ID,
    profileExpectedState: 'DELIVERY_ACTIVE' as const
  }
  const cleanup = {
    authorizationFingerprint: CLEANUP_FINGERPRINT,
    stageKey: 'stage-one',
    stageOwnerTaskId: '/root/sl',
    transitionId: TRANSITION_ID
  } as unknown as StageCleanupAuthorization
  const authority = loadTrustedStageLifecycleRosterAuthority(
    writeTrustedReference(root, 'authority.json', input.authority, 'authorityFingerprint'),
    cleanup,
    trust
  )
  const inventory = loadTrustedStageLifecycleInventory(
    writeTrustedReference(root, 'inventory.json', input.inventory, 'inventoryFingerprint'),
    authority,
    cleanup,
    trust
  )
  if (priorResults.length === 0) return { authority, inventory, priorResults: [] }
  const set: StageArchiveResultSet = {
    schemaVersion: 1,
    kind: 'OES_STAGE_ARCHIVE_RESULT_SET',
    resultSetFingerprint: '',
    stageKey: inventory.stageKey,
    stageOwnerTaskId: inventory.stageOwnerTaskId,
    transitionId: inventory.transitionId,
    stageCleanupAuthorizationFingerprint: inventory.stageCleanupAuthorizationFingerprint,
    inventoryFingerprint: inventory.inventoryFingerprint,
    results: priorResults
  }
  set.resultSetFingerprint = objectFingerprint(
    set as unknown as Record<string, unknown>,
    'resultSetFingerprint'
  )
  return {
    authority,
    inventory,
    priorResults: loadTrustedStageArchiveResults(
      writeTrustedReference(root, 'results.json', set, 'resultSetFingerprint'),
      inventory,
      cleanup,
      trust
    )
  }
}

/** Writes one issuer-owned receipt and returns its exact digest/fingerprint reference. */
function writeTrustedReference(
  root: string,
  name: string,
  value: unknown,
  fingerprintField: string
): TrustedAuthorizationReference {
  const path = join(root, name)
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`)
  writeFileSync(path, bytes)
  return {
    path,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    fingerprint: (value as Record<string, string>)[fingerprintField]
  }
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
  const { authority, inventory } = trustedFixture()
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
  const plain = fixture()
  const trusted = trustedFixture(plain, [
    result(plain.inventory, '/root/sl/it', 'IT', 'ARCHIVED'),
    result(plain.inventory, '/root/sl/ri-a', 'FEATURE_RI', 'ARCHIVED'),
    result(plain.inventory, '/root/sl/ri-b', 'FEATURE_RI', 'ARCHIVED')
  ])
  const second = planStageLifecycle(trusted.authority, trusted.inventory, trusted.priorResults)
  assert.deepEqual(
    second.decisions
      .filter((decision) => decision.decision === 'ARCHIVE')
      .map((decision) => decision.role),
    ['FL', 'FL']
  )
})

test('archive partial failure retries only the failed tier and preserves completed tasks', () => {
  const plain = fixture()
  const trusted = trustedFixture(plain, [
    result(plain.inventory, '/root/sl/it', 'IT', 'ARCHIVED'),
    result(plain.inventory, '/root/sl/ri-a', 'FEATURE_RI', 'FAILED')
  ])
  const plan = planStageLifecycle(trusted.authority, trusted.inventory, trusted.priorResults)
  assert.equal(plan.status, 'ARCHIVE_PARTIAL_FAILURE')
  assert.equal(
    plan.decisions.find((item) => item.taskId === '/root/sl/it')?.decision,
    'SKIP_ARCHIVED'
  )
  assert.equal(plan.decisions.find((item) => item.taskId === '/root/sl/ri-a')?.decision, 'ARCHIVE')
  assert.equal(plan.decisions.find((item) => item.role === 'FL')?.decision, 'PRESERVE_BLOCKED')
})

test('archive waits for full terminal roster and verified resource cleanup', () => {
  const plain = fixture()
  const { authority, inventory } = plain
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
  let trusted = trustedFixture(plain)
  assert.equal(
    planStageLifecycle(trusted.authority, trusted.inventory).status,
    'WAIT_TERMINAL_ROSTER'
  )
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
  trusted = trustedFixture(plain)
  assert.equal(
    planStageLifecycle(trusted.authority, trusted.inventory).status,
    'WAIT_RESOURCE_CLEANUP'
  )
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
    () => trustedFixture({ authority, inventory }),
    /STAGE_LIFECYCLE_TOPOLOGY_INCOMPLETE/
  )
})

test('caller-computed lifecycle summaries cannot enter the archive planner', () => {
  const { authority, inventory } = fixture()
  assert.throws(
    () => planStageLifecycle(authority, inventory),
    /STAGE_LIFECYCLE_TRUSTED_AUTHORITY_REQUIRED/
  )
  const trusted = trustedFixture()
  const fakeResult = result(trusted.inventory, '/root/sl/it', 'IT', 'ARCHIVED')
  assert.throws(
    () => planStageLifecycle(trusted.authority, trusted.inventory, [fakeResult]),
    /STAGE_LIFECYCLE_TRUSTED_ARCHIVE_RESULTS_REQUIRED/
  )
})

test('Stage lifecycle schema rejects undeclared or missing roster state', () => {
  const schema = JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', '..', 'schemas', 'stage-lifecycle-inventory.schema.json'),
      'utf8'
    )
  ) as Record<string, unknown>
  const authoritySchema = JSON.parse(
    readFileSync(
      join(import.meta.dirname, '..', '..', 'schemas', 'stage-lifecycle-roster-authority.schema.json'),
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
