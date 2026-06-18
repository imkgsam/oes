export type TaskFactEventType =
  | 'TaskCreated'
  | 'TaskAssigned'
  | 'TaskUpdated'
  | 'TaskStarted'
  | 'TaskCompleted'
  | 'TaskCancelled'
  | 'TaskReopened'
  | 'TaskArchived'
  | 'TaskUnarchived'

/** TaskFactEvent describes the frozen Task P1 facts published after successful local commands. */
export interface TaskFactEvent {
  eventId: string
  eventType: TaskFactEventType
  occurredAt: string
  tenantId: string
  taskId: string
  actorAccountId: string
  createdByAccountId: string
  assigneeAccountId: string
  status: string
  previousStatus?: string
  priority: string
  dueAt?: string
  titleSnapshot: string
  traceId?: string
}
