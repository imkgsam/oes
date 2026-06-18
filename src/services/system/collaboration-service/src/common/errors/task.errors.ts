export const TASK_NOT_FOUND = 'TASK_NOT_FOUND'
export const TASK_PERMISSION_DENIED = 'TASK_PERMISSION_DENIED'
export const TASK_INVALID_STATE = 'TASK_INVALID_STATE'
export const TASK_INVALID_ARGUMENT = 'TASK_INVALID_ARGUMENT'
export const TASK_ASSIGNEE_NOT_ACTIVE = 'TASK_ASSIGNEE_NOT_ACTIVE'

/** TaskDomainError carries a stable Task P1 error code across application and interface layers. */
export class TaskDomainError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
  }
}

/** TaskNotFoundError reports a missing task inside the requested tenant boundary. */
export class TaskNotFoundError extends TaskDomainError {
  constructor(message = 'task not found') {
    super(TASK_NOT_FOUND, message)
  }
}

/** TaskPermissionDeniedError reports participant or capability rule failures. */
export class TaskPermissionDeniedError extends TaskDomainError {
  constructor(message = 'task permission denied') {
    super(TASK_PERMISSION_DENIED, message)
  }
}

/** TaskInvalidStateError reports lifecycle and archive precondition failures. */
export class TaskInvalidStateError extends TaskDomainError {
  constructor(message = 'task state does not allow this operation') {
    super(TASK_INVALID_STATE, message)
  }
}

/** TaskInvalidArgumentError reports invalid Task P1 command or query input. */
export class TaskInvalidArgumentError extends TaskDomainError {
  constructor(message = 'task input is invalid') {
    super(TASK_INVALID_ARGUMENT, message)
  }
}

/** TaskAssigneeNotActiveError reports an invalid assignment target from identity-service truth. */
export class TaskAssigneeNotActiveError extends TaskDomainError {
  constructor(message = 'task assignee is not an active tenant account') {
    super(TASK_ASSIGNEE_NOT_ACTIVE, message)
  }
}
