import {
  TaskPriority as ProtoTaskPriority,
  TaskStatus as ProtoTaskStatus,
  TaskView,
  TaskVisibility as ProtoTaskVisibility
} from '@oes/common/generated/collaboration_service'
import { TaskEntity } from '../../domain/entities/task.entity'
import { TaskPriority, TaskStatus, TaskVisibility } from '../../domain/value-objects/task.enums'

/** presentTask maps a Task aggregate and derived query fields to the gRPC TaskView contract. */
export function presentTask(task: TaskEntity, overdue = false): TaskView {
  return {
    taskId: task.id,
    tenantId: task.tenantId,
    title: task.title,
    description: task.description ?? undefined,
    createdByAccountId: task.createdByAccountId,
    assigneeAccountId: task.assigneeAccountId,
    visibility: toProtoVisibility(task.visibility),
    status: toProtoStatus(task.status),
    priority: toProtoPriority(task.priority),
    dueAt: task.dueAt?.toISOString(),
    overdue,
    startedAt: task.startedAt?.toISOString(),
    completedAt: task.completedAt?.toISOString(),
    completedByAccountId: task.completedByAccountId ?? undefined,
    completionNote: task.completionNote ?? undefined,
    cancelledAt: task.cancelledAt?.toISOString(),
    cancelledByAccountId: task.cancelledByAccountId ?? undefined,
    cancelReason: task.cancelReason ?? undefined,
    archivedAt: task.archivedAt?.toISOString(),
    archivedByAccountId: task.archivedByAccountId ?? undefined,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  }
}

/** toProtoVisibility maps domain visibility to generated gRPC enum values. */
export function toProtoVisibility(value: TaskVisibility): ProtoTaskVisibility {
  return value === TaskVisibility.PRIVATE
    ? ProtoTaskVisibility.TASK_VISIBILITY_PRIVATE
    : ProtoTaskVisibility.TASK_VISIBILITY_ASSIGNMENT_PARTICIPANTS
}

/** toProtoStatus maps domain status to generated gRPC enum values. */
export function toProtoStatus(value: TaskStatus): ProtoTaskStatus {
  const map = {
    [TaskStatus.OPEN]: ProtoTaskStatus.TASK_STATUS_OPEN,
    [TaskStatus.IN_PROGRESS]: ProtoTaskStatus.TASK_STATUS_IN_PROGRESS,
    [TaskStatus.COMPLETED]: ProtoTaskStatus.TASK_STATUS_COMPLETED,
    [TaskStatus.CANCELLED]: ProtoTaskStatus.TASK_STATUS_CANCELLED
  } as const
  return map[value]
}

/** toProtoPriority maps domain priority to generated gRPC enum values. */
export function toProtoPriority(value: TaskPriority): ProtoTaskPriority {
  const map = {
    [TaskPriority.LOW]: ProtoTaskPriority.TASK_PRIORITY_LOW,
    [TaskPriority.NORMAL]: ProtoTaskPriority.TASK_PRIORITY_NORMAL,
    [TaskPriority.HIGH]: ProtoTaskPriority.TASK_PRIORITY_HIGH,
    [TaskPriority.URGENT]: ProtoTaskPriority.TASK_PRIORITY_URGENT
  } as const
  return map[value]
}
