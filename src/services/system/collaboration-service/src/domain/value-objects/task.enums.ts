/** TaskStatus enumerates the manual task lifecycle states frozen for P1. */
export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/** TaskPriority enumerates the simple P1 priority levels. */
export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/** TaskVisibility enumerates the P1 visibility modes. */
export enum TaskVisibility {
  PRIVATE = 'PRIVATE',
  ASSIGNMENT_PARTICIPANTS = 'ASSIGNMENT_PARTICIPANTS'
}

/** TaskListScope enumerates the personal list views available in Task P1. */
export enum TaskListScope {
  MY_TODO = 'MY_TODO',
  ASSIGNED_TO_ME = 'ASSIGNED_TO_ME',
  CREATED_BY_ME = 'CREATED_BY_ME'
}
