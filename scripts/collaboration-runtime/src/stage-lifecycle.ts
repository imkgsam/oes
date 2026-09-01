import { objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import type {
  StageArchiveDecision,
  StageArchiveResult,
  StageLifecycleCreatedTask,
  StageLifecycleInventory,
  StageLifecyclePlan,
  StageLifecycleRole,
  StageLifecycleRosterAuthority,
  StageLifecycleTask
} from './types.ts'

const ROLE_TIER: Record<Exclude<StageLifecycleRole, 'GLOBAL_UD'>, number> = {
  IT: 0,
  FEATURE_RI: 0,
  FL: 1,
  STAGE_DESIGN: 2,
  STAGE_RI: 3,
  SL: 4
}
const DIGEST = /^[0-9a-f]{64}$/

/** Validates the immutable task-native creation receipts captured before cleanup intent. */
export function validateStageLifecycleRosterAuthority(
  value: StageLifecycleRosterAuthority
): StageLifecycleRosterAuthority {
  if (
    value.schemaVersion !== 1 ||
    value.kind !== 'OES_STAGE_LIFECYCLE_ROSTER_AUTHORITY' ||
    value.source !== 'TASK_NATIVE_CREATION_RECEIPTS' ||
    value.stageKey.length === 0 ||
    value.stageOwnerTaskId.length === 0 ||
    !Array.isArray(value.createdRoster) ||
    value.createdRoster.length === 0
  )
    fail('STAGE_LIFECYCLE_ROSTER_AUTHORITY_INVALID', value.stageKey)
  const tasks = new Map<string, StageLifecycleCreatedTask>()
  for (const task of value.createdRoster) {
    if (
      task.taskId.length === 0 ||
      task.taskId === task.ownerTaskId ||
      !['IT', 'FEATURE_RI', 'FL', 'STAGE_DESIGN', 'STAGE_RI', 'SL', 'GLOBAL_UD'].includes(
        task.role
      ) ||
      !DIGEST.test(task.creationReceiptFingerprint)
    )
      fail('STAGE_LIFECYCLE_CREATION_RECEIPT_INVALID', task.taskId)
    if (tasks.has(task.taskId)) fail('STAGE_LIFECYCLE_TASK_DUPLICATE', task.taskId)
    tasks.set(task.taskId, task)
  }
  validateStageTopology(value.stageOwnerTaskId, value.createdRoster, tasks)
  const expected = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'authorityFingerprint'
  )
  if (!DIGEST.test(value.authorityFingerprint) || value.authorityFingerprint !== expected)
    fail('STAGE_LIFECYCLE_ROSTER_AUTHORITY_FINGERPRINT_MISMATCH', value.stageKey)
  return value
}

/** Validates a current task-native readback against the immutable creation authority. */
export function validateStageLifecycleInventory(
  authorityInput: StageLifecycleRosterAuthority,
  value: StageLifecycleInventory
): StageLifecycleInventory {
  const authority = validateStageLifecycleRosterAuthority(authorityInput)
  if (
    value.schemaVersion !== 1 ||
    value.kind !== 'OES_STAGE_LIFECYCLE_INVENTORY' ||
    value.cleanupIntentDetected !== true ||
    value.stageKey.length === 0 ||
    value.stageOwnerTaskId.length === 0 ||
    !['PASSED', 'PENDING', 'FAILED'].includes(value.stageExit) ||
    !['PENDING', 'VERIFIED', 'PARTIAL_FAILURE'].includes(value.resourceCleanup) ||
    value.taskReadbackSource !== 'CODEX_TASK_NATIVE' ||
    value.stageKey !== authority.stageKey ||
    value.stageOwnerTaskId !== authority.stageOwnerTaskId ||
    value.rosterAuthorityFingerprint !== authority.authorityFingerprint ||
    !Array.isArray(value.terminalTaskIds)
  )
    fail('STAGE_LIFECYCLE_INVENTORY_INVALID', value.stageKey)
  if (!Array.isArray(value.readbackRoster) || value.readbackRoster.length === 0)
    fail('STAGE_LIFECYCLE_READBACK_ROSTER_INVALID', value.stageKey)
  const createdTasks = new Map(authority.createdRoster.map((task) => [task.taskId, task]))
  const readbackTasks = validateRoster(value.readbackRoster)
  if (createdTasks.size !== readbackTasks.size)
    fail('STAGE_LIFECYCLE_ROSTER_SIZE_MISMATCH', value.stageKey)
  for (const [taskId, created] of createdTasks) {
    const readback = readbackTasks.get(taskId)
    if (!readback || readback.role !== created.role || readback.ownerTaskId !== created.ownerTaskId)
      fail('STAGE_LIFECYCLE_READBACK_CLOSURE_MISMATCH', taskId)
  }
  const readbackRosterFingerprint = objectFingerprint(
    value.readbackRoster as unknown as Record<string, unknown>,
    '__none__'
  )
  if (
    !DIGEST.test(value.readbackRosterFingerprint) ||
    value.readbackRosterFingerprint !== readbackRosterFingerprint
  )
    fail('STAGE_LIFECYCLE_READBACK_ROSTER_FINGERPRINT_MISMATCH', value.stageKey)
  const tasks = readbackTasks
  const stageLeads = value.readbackRoster.filter((task) => task.role === 'SL')
  if (
    stageLeads.length !== 1 ||
    stageLeads[0].taskId !== value.stageOwnerTaskId ||
    stageLeads[0].ownerTaskId !== null
  )
    fail('STAGE_LIFECYCLE_SL_MISMATCH', value.stageOwnerTaskId)
  const terminal = new Set<string>()
  for (const taskId of value.terminalTaskIds) {
    if (terminal.has(taskId)) fail('STAGE_LIFECYCLE_TERMINAL_DUPLICATE', taskId)
    const task = tasks.get(taskId)
    if (!task || task.state !== 'TERMINAL') fail('STAGE_LIFECYCLE_TERMINAL_MISMATCH', taskId)
    terminal.add(taskId)
  }
  for (const task of value.readbackRoster)
    if ((task.state === 'TERMINAL') !== terminal.has(task.taskId))
      fail('STAGE_LIFECYCLE_TERMINAL_COVERAGE_MISMATCH', task.taskId)
  const expected = objectFingerprint(
    value as unknown as Record<string, unknown>,
    'inventoryFingerprint'
  )
  if (value.inventoryFingerprint !== expected)
    fail('STAGE_LIFECYCLE_INVENTORY_FINGERPRINT_MISMATCH', value.stageKey)
  return value
}

/** Validates one complete roster snapshot and returns its exact task index. */
function validateRoster(roster: StageLifecycleTask[]): Map<string, StageLifecycleTask> {
  const tasks = new Map<string, StageLifecycleTask>()
  for (const task of roster) {
    if (
      task.taskId.length === 0 ||
      task.taskId === task.ownerTaskId ||
      !['IT', 'FEATURE_RI', 'FL', 'STAGE_DESIGN', 'STAGE_RI', 'SL', 'GLOBAL_UD'].includes(
        task.role
      ) ||
      !['TERMINAL', 'ACTIVE', 'UNKNOWN'].includes(task.state)
    )
      fail('STAGE_LIFECYCLE_READBACK_TASK_INVALID', task.taskId)
    if (tasks.has(task.taskId)) fail('STAGE_LIFECYCLE_TASK_DUPLICATE', task.taskId)
    tasks.set(task.taskId, task)
  }
  return tasks
}

/** Enforces the complete Stage owner graph captured at task creation. */
function validateStageTopology(
  stageOwnerTaskId: string,
  roster: Array<Pick<StageLifecycleCreatedTask, 'taskId' | 'role' | 'ownerTaskId'>>,
  tasks: Map<string, Pick<StageLifecycleCreatedTask, 'taskId' | 'role' | 'ownerTaskId'>>
): void {
  const byRole = (role: StageLifecycleRole) => roster.filter((task) => task.role === role)
  const stageLeads = byRole('SL')
  const featureLeads = byRole('FL')
  const featureReviews = byRole('FEATURE_RI')
  if (
    stageLeads.length !== 1 ||
    stageLeads[0].taskId !== stageOwnerTaskId ||
    stageLeads[0].ownerTaskId !== null ||
    featureLeads.length < 2 ||
    byRole('STAGE_RI').length !== 1
  )
    fail('STAGE_LIFECYCLE_TOPOLOGY_INCOMPLETE', stageOwnerTaskId)
  for (const task of roster) {
    const owner = task.ownerTaskId === null ? null : tasks.get(task.ownerTaskId)
    if (task.role === 'SL' || task.role === 'GLOBAL_UD') {
      if (task.ownerTaskId !== null) fail('STAGE_LIFECYCLE_ROOT_OWNER_INVALID', task.taskId)
    } else if (!owner) {
      fail('STAGE_LIFECYCLE_OWNER_ABSENT', task.taskId)
    } else if (
      (['IT', 'FEATURE_RI'].includes(task.role) && owner.role !== 'FL') ||
      (['FL', 'STAGE_DESIGN', 'STAGE_RI'].includes(task.role) && owner.role !== 'SL')
    ) {
      fail('STAGE_LIFECYCLE_OWNER_ROLE_INVALID', task.taskId)
    }
  }
  for (const lead of featureLeads)
    if (featureReviews.filter((review) => review.ownerTaskId === lead.taskId).length !== 1)
      fail('STAGE_LIFECYCLE_FEATURE_RI_CLOSURE_INVALID', lead.taskId)
}

/** Plans automatic archive only after Stage exit and resource cleanup, preserving partial success. */
export function planStageLifecycle(
  rosterAuthorityInput: StageLifecycleRosterAuthority,
  inventoryInput: StageLifecycleInventory,
  priorResults: StageArchiveResult[] = []
): StageLifecyclePlan {
  const inventory = validateStageLifecycleInventory(rosterAuthorityInput, inventoryInput)
  const excluded = inventory.readbackRoster.filter((task) => task.role === 'GLOBAL_UD')
  const archiveRoster = inventory.readbackRoster.filter((task) => task.role !== 'GLOBAL_UD')
  const excludedDecisions: StageArchiveDecision[] = excluded.map((task) => ({
    taskId: task.taskId,
    role: task.role,
    decision: 'EXCLUDE_GLOBAL_UD',
    reason: 'global canonical design owner is outside the Stage archive roster'
  }))
  if (inventory.stageExit !== 'PASSED')
    return {
      status: 'WAIT_STAGE_EXIT',
      decisions: [
        ...archiveRoster.map((task) => blocked(task, 'Stage exit has not passed')),
        ...excludedDecisions
      ]
    }
  if (archiveRoster.some((task) => task.state !== 'TERMINAL'))
    return {
      status: 'WAIT_TERMINAL_ROSTER',
      decisions: [
        ...archiveRoster.map((task) =>
          blocked(
            task,
            task.state === 'TERMINAL'
              ? 'another Stage task is not terminal'
              : `task state is ${task.state}`
          )
        ),
        ...excludedDecisions
      ]
    }
  if (inventory.resourceCleanup !== 'VERIFIED')
    return {
      status: 'WAIT_RESOURCE_CLEANUP',
      decisions: [
        ...archiveRoster.map((task) =>
          blocked(task, `resource cleanup is ${inventory.resourceCleanup}`)
        ),
        ...excludedDecisions
      ]
    }

  const byTask = new Map<string, StageArchiveResult>()
  for (const result of priorResults) {
    if (byTask.has(result.taskId)) fail('STAGE_ARCHIVE_RESULT_DUPLICATE', result.taskId)
    const task = archiveRoster.find((candidate) => candidate.taskId === result.taskId)
    if (!task || task.role !== result.role) fail('STAGE_ARCHIVE_RESULT_UNBOUND', result.taskId)
    if (
      result.inventoryFingerprint !== inventory.inventoryFingerprint ||
      !DIGEST.test(result.taskNativeReadbackFingerprint)
    )
      fail('STAGE_ARCHIVE_RESULT_READBACK_UNBOUND', result.taskId)
    const expected = objectFingerprint(
      {
        taskId: result.taskId,
        role: result.role,
        state: result.state,
        inventoryFingerprint: result.inventoryFingerprint,
        taskNativeReadbackFingerprint: result.taskNativeReadbackFingerprint
      },
      '__none__'
    )
    if (result.resultFingerprint !== expected)
      fail('STAGE_ARCHIVE_RESULT_FINGERPRINT_MISMATCH', result.taskId)
    byTask.set(result.taskId, result)
  }

  const incompleteTiers = archiveRoster
    .filter((task) => byTask.get(task.taskId)?.state !== 'ARCHIVED')
    .map((task) => roleTier(task.role))
  const activeTier = incompleteTiers.length === 0 ? null : Math.min(...incompleteTiers)
  const activeTierFailed = archiveRoster.some(
    (task) => roleTier(task.role) === activeTier && byTask.get(task.taskId)?.state === 'FAILED'
  )
  const decisions = [...archiveRoster]
    .sort(
      (left, right) =>
        roleTier(left.role) - roleTier(right.role) || left.taskId.localeCompare(right.taskId)
    )
    .map((task): StageArchiveDecision => {
      const result = byTask.get(task.taskId)
      if (result?.state === 'ARCHIVED')
        return {
          taskId: task.taskId,
          role: task.role,
          decision: 'SKIP_ARCHIVED',
          reason: 'prior exact archive result was verified'
        }
      if (activeTier !== null && roleTier(task.role) > activeTier)
        return blocked(task, 'an earlier archive dependency tier is incomplete')
      if (activeTier !== null && roleTier(task.role) < activeTier)
        fail('STAGE_ARCHIVE_PRIOR_TIER_INCOMPLETE', task.taskId)
      return {
        taskId: task.taskId,
        role: task.role,
        decision: 'ARCHIVE',
        reason:
          result?.state === 'FAILED'
            ? 'retry the exact failed archive item'
            : 'next automatic archive action'
      }
    })
  decisions.push(...excludedDecisions)
  if (archiveRoster.every((task) => byTask.get(task.taskId)?.state === 'ARCHIVED'))
    return { status: 'COMPLETE', decisions }
  return {
    status: activeTierFailed ? 'ARCHIVE_PARTIAL_FAILURE' : 'ARCHIVE_READY',
    decisions
  }
}

/** Returns the fixed dependency tier for a Stage-owned archive role. */
function roleTier(role: StageLifecycleRole): number {
  if (role === 'GLOBAL_UD') fail('GLOBAL_UD_ARCHIVE_FORBIDDEN', role)
  return ROLE_TIER[role]
}

/** Creates one preservation decision without mutating the task. */
function blocked(task: StageLifecycleTask, reason: string): StageArchiveDecision {
  return { taskId: task.taskId, role: task.role, decision: 'PRESERVE_BLOCKED', reason }
}
