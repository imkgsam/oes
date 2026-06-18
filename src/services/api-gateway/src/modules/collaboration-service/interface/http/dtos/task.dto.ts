import { Type } from 'class-transformer'
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator'

export type TaskPriorityDto = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type TaskStatusDto = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type TaskScopeDto = 'MY_TODO' | 'ASSIGNED_TO_ME' | 'CREATED_BY_ME'

const TASK_PRIORITIES: TaskPriorityDto[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
const TASK_STATUSES: TaskStatusDto[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const TASK_SCOPES: TaskScopeDto[] = ['MY_TODO', 'ASSIGNED_TO_ME', 'CREATED_BY_ME']
const BOOLEAN_QUERY_VALUES = ['true', 'false', true, false] as const

/** CreateTaskDto exposes only Task P1 creation fields to tenant-web. */
export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string

  @IsOptional()
  @IsUUID()
  assigneeAccountId?: string

  @IsOptional()
  @IsISO8601()
  dueAt?: string

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriorityDto
}

/** UpdateTaskDto exposes only Task P1 mutable basics. */
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string

  @IsOptional()
  @IsISO8601()
  dueAt?: string

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriorityDto
}

/** CompleteTaskDto carries the optional pure-text completion note. */
export class CompleteTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  completionNote?: string
}

/** CancelTaskDto carries the optional pure-text cancellation reason. */
export class CancelTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancelReason?: string
}

/** ReopenTaskDto carries the optional pure-text reopen reason. */
export class ReopenTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reopenReason?: string
}

/** ListTasksDto captures Task P1 personal scope filters. */
export class ListTasksDto {
  @IsIn(TASK_SCOPES)
  scope!: TaskScopeDto

  @IsOptional()
  @IsIn(TASK_STATUSES, { each: true })
  status?: TaskStatusDto | TaskStatusDto[]

  @IsOptional()
  @IsIn(TASK_PRIORITIES, { each: true })
  priority?: TaskPriorityDto | TaskPriorityDto[]

  @IsOptional()
  @IsISO8601()
  dueBefore?: string

  @IsOptional()
  @IsISO8601()
  dueAfter?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  keyword?: string

  @IsOptional()
  @IsIn(BOOLEAN_QUERY_VALUES)
  overdueOnly?: boolean | string

  @IsOptional()
  @IsIn(BOOLEAN_QUERY_VALUES)
  includeArchived?: boolean | string

  @IsOptional()
  @IsIn(BOOLEAN_QUERY_VALUES)
  archivedOnly?: boolean | string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number | string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number | string
}
