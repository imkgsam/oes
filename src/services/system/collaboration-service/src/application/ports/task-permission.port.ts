/** TaskPermissionPort evaluates conditional Task P1 permissions through the platform permission model. */
export interface TaskPermissionPort {
  canAssignTask(input: { tenantId: string; operatorAccountId: string }): Promise<boolean>
}

export const TASK_PERMISSION_PORT = Symbol('TASK_PERMISSION_PORT')
