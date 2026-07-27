import type { OesEventContract } from '../../events'

/** Identifies the sole owner service for Collaboration public event descriptors. */
export const COLLABORATION_SERVICE_EVENT_OWNER = 'collaboration-service' as const

/** Defines the frozen common Task payload snapshot shared by all Collaboration Task facts. */
export interface CollaborationTaskEventData {
  readonly taskId: string
  readonly createdByAccountId: string
  readonly assigneeAccountId: string
  readonly status: string
  readonly previousStatus?: string | null
  readonly priority: string
  readonly dueAt?: string | null
  readonly titleSnapshot: string
}

/** Defines the public data carried when a Task is assigned during creation. */
export interface CollaborationTaskAssignedEventData extends CollaborationTaskEventData {
  readonly status: 'OPEN'
  readonly previousStatus?: null
}

/** Defines the public data carried when a Task transitions to completed. */
export interface CollaborationTaskCompletedEventData extends CollaborationTaskEventData {
  readonly status: 'COMPLETED'
  readonly previousStatus: string
  readonly completedByAccountId: string
  readonly completedAt: string
}

/** Defines the public data carried when a Task transitions to cancelled. */
export interface CollaborationTaskCancelledEventData extends CollaborationTaskEventData {
  readonly status: 'CANCELLED'
  readonly previousStatus: string
  readonly cancelledByAccountId: string
  readonly cancelledAt: string
  readonly cancelReasonSnapshot?: string | null
}

/** Describes the single frozen assigned fact shared by Collaboration producers and subscribers. */
export const COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT: OesEventContract<CollaborationTaskAssignedEventData> = {
  eventType: 'collaboration.task.assigned',
  eventVersion: 1,
  ownerService: COLLABORATION_SERVICE_EVENT_OWNER,
  validateData: isCollaborationTaskAssignedEventData,
}

/** Describes the single frozen completed fact shared by Collaboration producers and subscribers. */
export const COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT: OesEventContract<CollaborationTaskCompletedEventData> = {
  eventType: 'collaboration.task.completed',
  eventVersion: 1,
  ownerService: COLLABORATION_SERVICE_EVENT_OWNER,
  validateData: isCollaborationTaskCompletedEventData,
}

/** Describes the single frozen cancelled fact shared by Collaboration producers and subscribers. */
export const COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT: OesEventContract<CollaborationTaskCancelledEventData> = {
  eventType: 'collaboration.task.cancelled',
  eventVersion: 1,
  ownerService: COLLABORATION_SERVICE_EVENT_OWNER,
  validateData: isCollaborationTaskCancelledEventData,
}

/** Lists every and only every Collaboration Task fact frozen for public subscription in P1. */
export const COLLABORATION_TASK_EVENT_CONTRACTS = [
  COLLABORATION_TASK_ASSIGNED_EVENT_CONTRACT,
  COLLABORATION_TASK_COMPLETED_EVENT_CONTRACT,
  COLLABORATION_TASK_CANCELLED_EVENT_CONTRACT,
] as const

/** Validates the assigned payload without expanding the frozen Task public snapshot. */
function isCollaborationTaskAssignedEventData(value: unknown): value is CollaborationTaskAssignedEventData {
  return hasTaskSnapshot(value, 'OPEN', ['taskId', 'createdByAccountId', 'assigneeAccountId', 'status', 'priority', 'titleSnapshot'], ['previousStatus', 'dueAt'])
    && (value.previousStatus === undefined || value.previousStatus === null)
}

/** Validates the completed transition payload without accepting uncontracted Task data. */
function isCollaborationTaskCompletedEventData(value: unknown): value is CollaborationTaskCompletedEventData {
  return hasTaskSnapshot(value, 'COMPLETED', ['taskId', 'createdByAccountId', 'assigneeAccountId', 'status', 'previousStatus', 'priority', 'titleSnapshot', 'completedByAccountId', 'completedAt'], ['dueAt'])
    && isNonBlankString(value.previousStatus)
}

/** Validates the cancelled transition payload without accepting uncontracted Task data. */
function isCollaborationTaskCancelledEventData(value: unknown): value is CollaborationTaskCancelledEventData {
  return hasTaskSnapshot(value, 'CANCELLED', ['taskId', 'createdByAccountId', 'assigneeAccountId', 'status', 'previousStatus', 'priority', 'titleSnapshot', 'cancelledByAccountId', 'cancelledAt'], ['dueAt', 'cancelReasonSnapshot'])
    && isNonBlankString(value.previousStatus)
}

/** Validates the shared frozen snapshot fields, their exact allowed keys, and transition-specific status. */
function hasTaskSnapshot(
  value: unknown,
  expectedStatus: string,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[],
): value is Record<string, unknown> {
  if (!isRecord(value) || !hasExactKeys(value, requiredKeys, optionalKeys) || value.status !== expectedStatus) return false
  return isNonBlankString(value.taskId)
    && isNonBlankString(value.createdByAccountId)
    && isNonBlankString(value.assigneeAccountId)
    && isNonBlankString(value.priority)
    && isNonBlankString(value.titleSnapshot)
    && (value.previousStatus === undefined || value.previousStatus === null || isNonBlankString(value.previousStatus))
    && (value.dueAt === undefined || value.dueAt === null || isNonBlankString(value.dueAt))
    && (value.completedByAccountId === undefined || isNonBlankString(value.completedByAccountId))
    && (value.completedAt === undefined || isNonBlankString(value.completedAt))
    && (value.cancelledByAccountId === undefined || isNonBlankString(value.cancelledByAccountId))
    && (value.cancelledAt === undefined || isNonBlankString(value.cancelledAt))
    && (value.cancelReasonSnapshot === undefined || value.cancelReasonSnapshot === null || isNonBlankString(value.cancelReasonSnapshot))
}

/** Ensures payloads have no version aliases or business fields outside their frozen contract. */
function hasExactKeys(value: Record<string, unknown>, requiredKeys: readonly string[], optionalKeys: readonly string[]): boolean {
  const allowedKeys = new Set([...requiredKeys, ...optionalKeys])
  return requiredKeys.every((key) => Object.hasOwn(value, key)) && Object.keys(value).every((key) => allowedKeys.has(key))
}

/** Narrows decoded JSON data to an object payload rather than arrays or primitives. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Rejects blank string data values that cannot identify a Task snapshot or transition actor. */
function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
