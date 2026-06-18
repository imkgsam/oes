export type TaskAuditAction =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_CANCELLED'
  | 'TASK_REOPENED'
  | 'TASK_ARCHIVED'
  | 'TASK_UNARCHIVED'

/** TaskAuditPort records command audit envelopes for Task P1 actions. */
export interface TaskAuditPort {
  record(input: {
    tenantId: string
    taskId: string
    action: TaskAuditAction
    result: 'SUCCEEDED' | 'REJECTED' | 'FAILED'
    operatorAccountId: string
    createdByAccountId: string
    assigneeAccountId: string
    traceId?: string
    auditId?: string
    reasonSnapshot?: string
    payload?: Record<string, unknown>
  }): Promise<void>
}

export const TASK_AUDIT_PORT = Symbol('TASK_AUDIT_PORT')
