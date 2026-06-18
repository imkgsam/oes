import { TaskInvalidArgumentError, TaskInvalidStateError, TaskPermissionDeniedError } from '../../common/errors/task.errors'
import { TaskListScope, TaskPriority, TaskStatus, TaskVisibility } from '../value-objects/task.enums'

export type TaskEntityProps = {
  id: string
  tenantId: string
  title: string
  description: string | null
  createdByAccountId: string
  assigneeAccountId: string
  visibility: TaskVisibility
  status: TaskStatus
  priority: TaskPriority
  dueAt: Date | null
  startedAt: Date | null
  completedAt: Date | null
  completedByAccountId: string | null
  completionNote: string | null
  cancelledAt: Date | null
  cancelledByAccountId: string | null
  cancelReason: string | null
  archivedAt: Date | null
  archivedByAccountId: string | null
  createdAt: Date
  updatedAt: Date
}

export type TaskListFilter = {
  tenantId: string
  operatorAccountId: string
  scope: TaskListScope
  statuses?: TaskStatus[]
  priorities?: TaskPriority[]
  dueBefore?: Date
  dueAfter?: Date
  keyword?: string
  overdueOnly?: boolean
  includeArchived?: boolean
  archivedOnly?: boolean
  page: number
  pageSize: number
  now: Date
}

export type TaskListResult = {
  items: TaskEntity[]
  page: number
  pageSize: number
  total: number
}

const TERMINAL_STATUSES = new Set<TaskStatus>([TaskStatus.COMPLETED, TaskStatus.CANCELLED])

/** TaskEntity enforces the Task P1 lifecycle, participant rules, and archive invariants. */
export class TaskEntity {
  constructor(private readonly props: TaskEntityProps) {
    this.assertValidCoreFields(props)
  }

  get id() {
    return this.props.id
  }

  get tenantId() {
    return this.props.tenantId
  }

  get title() {
    return this.props.title
  }

  get description() {
    return this.props.description
  }

  get createdByAccountId() {
    return this.props.createdByAccountId
  }

  get assigneeAccountId() {
    return this.props.assigneeAccountId
  }

  get visibility() {
    return this.props.visibility
  }

  get status() {
    return this.props.status
  }

  get priority() {
    return this.props.priority
  }

  get dueAt() {
    return this.props.dueAt
  }

  get startedAt() {
    return this.props.startedAt
  }

  get completedAt() {
    return this.props.completedAt
  }

  get completedByAccountId() {
    return this.props.completedByAccountId
  }

  get completionNote() {
    return this.props.completionNote
  }

  get cancelledAt() {
    return this.props.cancelledAt
  }

  get cancelledByAccountId() {
    return this.props.cancelledByAccountId
  }

  get cancelReason() {
    return this.props.cancelReason
  }

  get archivedAt() {
    return this.props.archivedAt
  }

  get archivedByAccountId() {
    return this.props.archivedByAccountId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  /** snapshot returns a detached copy suitable for persistence and presenters. */
  snapshot(): TaskEntityProps {
    return { ...this.props }
  }

  /** canRead checks whether the account participates in this P1 task. */
  canRead(operatorAccountId: string): boolean {
    return (
      this.props.createdByAccountId === operatorAccountId ||
      this.props.assigneeAccountId === operatorAccountId
    )
  }

  /** start moves an open task into progress when the assignee requests it. */
  start(operatorAccountId: string, now: Date): void {
    this.assertNotArchived()
    this.assertAssignee(operatorAccountId)
    if (this.props.status === TaskStatus.IN_PROGRESS) {
      this.props.startedAt = now
      this.touch(now)
      return
    }
    if (this.props.status !== TaskStatus.OPEN) {
      throw new TaskInvalidStateError('only open tasks can be started')
    }
    this.props.status = TaskStatus.IN_PROGRESS
    this.props.startedAt = now
    this.touch(now)
  }

  /** complete moves an open or in-progress task to completed by creator or assignee. */
  complete(operatorAccountId: string, note: string | null, now: Date): void {
    this.assertNotArchived()
    this.assertCreatorOrAssignee(operatorAccountId)
    if (this.props.status === TaskStatus.COMPLETED) {
      return
    }
    if (![TaskStatus.OPEN, TaskStatus.IN_PROGRESS].includes(this.props.status)) {
      throw new TaskInvalidStateError('only open or in-progress tasks can be completed')
    }
    this.props.status = TaskStatus.COMPLETED
    this.props.completedAt = now
    this.props.completedByAccountId = operatorAccountId
    this.props.completionNote = normalizeOptionalText(note)
    this.touch(now)
  }

  /** cancel moves an open or in-progress task to cancelled by creator only. */
  cancel(operatorAccountId: string, reason: string | null, now: Date): void {
    this.assertNotArchived()
    this.assertCreator(operatorAccountId)
    if (this.props.status === TaskStatus.CANCELLED) {
      return
    }
    if (![TaskStatus.OPEN, TaskStatus.IN_PROGRESS].includes(this.props.status)) {
      throw new TaskInvalidStateError('only open or in-progress tasks can be cancelled')
    }
    this.props.status = TaskStatus.CANCELLED
    this.props.cancelledAt = now
    this.props.cancelledByAccountId = operatorAccountId
    this.props.cancelReason = normalizeOptionalText(reason)
    this.touch(now)
  }

  /** reopen moves completed or cancelled tasks back to open under P1 participant rules. */
  reopen(operatorAccountId: string, now = new Date()): void {
    this.assertNotArchived()
    if (this.props.status === TaskStatus.COMPLETED) {
      this.assertCreatorOrAssignee(operatorAccountId)
    } else if (this.props.status === TaskStatus.CANCELLED) {
      this.assertCreator(operatorAccountId)
    } else {
      throw new TaskInvalidStateError('only completed or cancelled tasks can be reopened')
    }

    this.props.status = TaskStatus.OPEN
    this.props.completedAt = null
    this.props.completedByAccountId = null
    this.props.completionNote = null
    this.props.cancelledAt = null
    this.props.cancelledByAccountId = null
    this.props.cancelReason = null
    this.touch(now)
  }

  /** archive marks terminal tasks as archived by creator only. */
  archive(operatorAccountId: string, now: Date): void {
    this.assertCreator(operatorAccountId)
    if (!TERMINAL_STATUSES.has(this.props.status)) {
      throw new TaskInvalidStateError('only completed or cancelled tasks can be archived')
    }
    if (this.props.archivedAt) {
      return
    }
    this.props.archivedAt = now
    this.props.archivedByAccountId = operatorAccountId
    this.touch(now)
  }

  /** unarchive clears archive markers by creator only. */
  unarchive(operatorAccountId: string, now = new Date()): void {
    this.assertCreator(operatorAccountId)
    if (!this.props.archivedAt) {
      return
    }
    this.props.archivedAt = null
    this.props.archivedByAccountId = null
    this.touch(now)
  }

  /** updateBasics changes mutable content fields while the task is active and unarchived. */
  updateBasics(
    input: {
      title?: string
      description?: string | null
      dueAt?: Date | null
      priority?: TaskPriority
    },
    now = new Date()
  ): void {
    this.assertNotArchived()
    if (![TaskStatus.OPEN, TaskStatus.IN_PROGRESS].includes(this.props.status)) {
      throw new TaskInvalidStateError('only open or in-progress tasks can be updated')
    }
    if (input.title !== undefined) {
      this.props.title = normalizeRequiredText(input.title, 'title')
    }
    if (input.description !== undefined) {
      this.props.description = normalizeOptionalText(input.description)
    }
    if (input.dueAt !== undefined) {
      this.props.dueAt = input.dueAt
    }
    if (input.priority !== undefined) {
      this.props.priority = input.priority
    }
    this.touch(now)
  }

  /** isOverdue derives overdue from active status and dueAt without persisting it as state. */
  isOverdue(now: Date): boolean {
    return (
      [TaskStatus.OPEN, TaskStatus.IN_PROGRESS].includes(this.props.status) &&
      Boolean(this.props.dueAt && this.props.dueAt.getTime() < now.getTime())
    )
  }

  /** touch updates the aggregate updatedAt timestamp after a state-changing operation. */
  private touch(now: Date): void {
    this.props.updatedAt = now
  }

  /** assertNotArchived blocks mutations that require unarchived tasks. */
  private assertNotArchived(): void {
    if (this.props.archivedAt) {
      throw new TaskInvalidStateError('archived task must be unarchived before this operation')
    }
  }

  /** assertCreator enforces creator-only Task P1 operations. */
  private assertCreator(operatorAccountId: string): void {
    if (this.props.createdByAccountId !== operatorAccountId) {
      throw new TaskPermissionDeniedError('only task creator can perform this operation')
    }
  }

  /** assertAssignee enforces assignee-only Task P1 operations. */
  private assertAssignee(operatorAccountId: string): void {
    if (this.props.assigneeAccountId !== operatorAccountId) {
      throw new TaskPermissionDeniedError('only task assignee can perform this operation')
    }
  }

  /** assertCreatorOrAssignee enforces participant-only Task P1 operations. */
  private assertCreatorOrAssignee(operatorAccountId: string): void {
    if (!this.canRead(operatorAccountId)) {
      throw new TaskPermissionDeniedError('only task creator or assignee can perform this operation')
    }
  }

  /** assertValidCoreFields validates required immutable Task P1 identity fields. */
  private assertValidCoreFields(props: TaskEntityProps): void {
    normalizeRequiredText(props.id, 'id')
    normalizeRequiredText(props.tenantId, 'tenantId')
    normalizeRequiredText(props.title, 'title')
    normalizeRequiredText(props.createdByAccountId, 'createdByAccountId')
    normalizeRequiredText(props.assigneeAccountId, 'assigneeAccountId')
  }
}

/** normalizeRequiredText trims required text values and rejects blanks. */
function normalizeRequiredText(value: string, fieldName: string): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new TaskInvalidArgumentError(`${fieldName} is required`)
  }
  return normalized
}

/** normalizeOptionalText trims optional text values and converts blanks to null. */
function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}
