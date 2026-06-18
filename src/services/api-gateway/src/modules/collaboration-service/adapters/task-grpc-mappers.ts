import {
  TaskListScope as ProtoTaskListScope,
  TaskPriority as ProtoTaskPriority,
  TaskStatus as ProtoTaskStatus,
  TaskView
} from '@oes/common/generated/collaboration_service'

/** mapTaskView maps collaboration-service TaskView messages to gateway JSON DTOs. */
export function mapTaskView(task: TaskView | undefined) {
  if (!task) return undefined
  return {
    taskId: task.taskId ?? '',
    tenantId: task.tenantId ?? '',
    title: task.title ?? '',
    description: task.description ?? '',
    createdByAccountId: task.createdByAccountId ?? '',
    assigneeAccountId: task.assigneeAccountId ?? '',
    visibility:
      task.visibility === 1 ? 'PRIVATE' : 'ASSIGNMENT_PARTICIPANTS',
    status: mapStatus(task.status),
    priority: mapPriority(task.priority),
    dueAt: task.dueAt,
    overdue: Boolean(task.overdue),
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    completedByAccountId: task.completedByAccountId,
    completionNote: task.completionNote,
    cancelledAt: task.cancelledAt,
    cancelledByAccountId: task.cancelledByAccountId,
    cancelReason: task.cancelReason,
    archivedAt: task.archivedAt,
    archivedByAccountId: task.archivedByAccountId,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }
}

/** toProtoPriority maps gateway priority filters and inputs to gRPC enums. */
export function toProtoPriority(value?: string): ProtoTaskPriority | undefined {
  const map: Record<string, ProtoTaskPriority> = {
    LOW: ProtoTaskPriority.TASK_PRIORITY_LOW,
    NORMAL: ProtoTaskPriority.TASK_PRIORITY_NORMAL,
    HIGH: ProtoTaskPriority.TASK_PRIORITY_HIGH,
    URGENT: ProtoTaskPriority.TASK_PRIORITY_URGENT
  }
  return value ? map[value] : undefined
}

/** toProtoStatus maps gateway status filters to gRPC enums. */
export function toProtoStatus(value: string): ProtoTaskStatus {
  const map: Record<string, ProtoTaskStatus> = {
    OPEN: ProtoTaskStatus.TASK_STATUS_OPEN,
    IN_PROGRESS: ProtoTaskStatus.TASK_STATUS_IN_PROGRESS,
    COMPLETED: ProtoTaskStatus.TASK_STATUS_COMPLETED,
    CANCELLED: ProtoTaskStatus.TASK_STATUS_CANCELLED
  }
  return map[value] ?? ProtoTaskStatus.TASK_STATUS_UNSPECIFIED
}

/** toProtoScope maps gateway list scopes to gRPC enums. */
export function toProtoScope(value: string): ProtoTaskListScope {
  const map: Record<string, ProtoTaskListScope> = {
    MY_TODO: ProtoTaskListScope.TASK_LIST_SCOPE_MY_TODO,
    ASSIGNED_TO_ME: ProtoTaskListScope.TASK_LIST_SCOPE_ASSIGNED_TO_ME,
    CREATED_BY_ME: ProtoTaskListScope.TASK_LIST_SCOPE_CREATED_BY_ME
  }
  return map[value] ?? ProtoTaskListScope.TASK_LIST_SCOPE_UNSPECIFIED
}

/** mapStatus maps gRPC status enum values to stable gateway strings. */
function mapStatus(value?: ProtoTaskStatus) {
  const map: Record<number, string> = {
    [ProtoTaskStatus.TASK_STATUS_OPEN]: 'OPEN',
    [ProtoTaskStatus.TASK_STATUS_IN_PROGRESS]: 'IN_PROGRESS',
    [ProtoTaskStatus.TASK_STATUS_COMPLETED]: 'COMPLETED',
    [ProtoTaskStatus.TASK_STATUS_CANCELLED]: 'CANCELLED'
  }
  return map[value ?? 0] ?? 'OPEN'
}

/** mapPriority maps gRPC priority enum values to stable gateway strings. */
function mapPriority(value?: ProtoTaskPriority) {
  const map: Record<number, string> = {
    [ProtoTaskPriority.TASK_PRIORITY_LOW]: 'LOW',
    [ProtoTaskPriority.TASK_PRIORITY_NORMAL]: 'NORMAL',
    [ProtoTaskPriority.TASK_PRIORITY_HIGH]: 'HIGH',
    [ProtoTaskPriority.TASK_PRIORITY_URGENT]: 'URGENT'
  }
  return map[value ?? 0] ?? 'NORMAL'
}
