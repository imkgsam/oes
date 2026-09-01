import { objectFingerprint } from './canonical.ts'
import { fail } from './errors.ts'
import type {
  StageArchiveDecision,
  StageArchiveResult,
  StageLifecycleInventory,
  StageLifecyclePlan,
  StageLifecycleRole,
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

/** Validates the task-native created/terminal roster captured when cleanup intent is detected. */
export function validateStageLifecycleInventory(
  value: StageLifecycleInventory
): StageLifecycleInventory {
  if (
    value.schemaVersion !== 1 ||
    value.kind !== 'OES_STAGE_LIFECYCLE_INVENTORY' ||
    value.cleanupIntentDetected !== true ||
    value.stageKey.length === 0 ||
    value.stageOwnerTaskId.length === 0 ||
    !Array.isArray(value.createdRoster) ||
    value.createdRoster.length === 0 ||
    !Array.isArray(value.terminalTaskIds)
  )
    fail('STAGE_LIFECYCLE_INVENTORY_INVALID', value.stageKey)
  const tasks = new Map<string, StageLifecycleTask>()
  for (const task of value.createdRoster) {
    if (
      task.taskId.length === 0 ||
      task.taskId === task.ownerTaskId ||
      !['TERMINAL', 'ACTIVE', 'UNKNOWN'].includes(task.state)
    )
      fail('STAGE_LIFECYCLE_TASK_INVALID', task.taskId)
    if (tasks.has(task.taskId)) fail('STAGE_LIFECYCLE_TASK_DUPLICATE', task.taskId)
    tasks.set(task.taskId, task)
  }
  const stageLeads = value.createdRoster.filter((task) => task.role === 'SL')
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
  for (const task of value.createdRoster)
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

/** Plans automatic archive only after Stage exit and resource cleanup, preserving partial success. */
export function planStageLifecycle(
  inventoryInput: StageLifecycleInventory,
  priorResults: StageArchiveResult[] = []
): StageLifecyclePlan {
  const inventory = validateStageLifecycleInventory(inventoryInput)
  const excluded = inventory.createdRoster.filter((task) => task.role === 'GLOBAL_UD')
  const archiveRoster = inventory.createdRoster.filter((task) => task.role !== 'GLOBAL_UD')
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
    const expected = objectFingerprint(
      { taskId: result.taskId, role: result.role, state: result.state },
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
