import { BadRequestException, ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import {
  TaskListScope as ProtoTaskListScope,
  TaskPriority as ProtoTaskPriority,
  TaskStatus as ProtoTaskStatus
} from '@oes/common/generated/collaboration_service'
import {
  TASK_ASSIGNEE_NOT_ACTIVE,
  TASK_INVALID_ARGUMENT,
  TASK_INVALID_STATE,
  TASK_NOT_FOUND,
  TASK_PERMISSION_DENIED,
  TaskDomainError
} from '../../common/errors/task.errors'
import { TaskListScope, TaskPriority, TaskStatus } from '../../domain/value-objects/task.enums'

export type GrpcCommandContext = {
  tenantId: string
  operatorAccountId: string
  traceId: string
  auditId?: string
}

/** requireCommandContext validates Task P1 command context fields from gRPC requests. */
export function requireCommandContext(input: object): GrpcCommandContext {
  const context = getAuthenticatedGrpcRequestContext(input)
  const token = context?.verifiedExecutionToken
  const tenantId = requireText(token?.tenantId, 'trusted tenant')
  const operatorAccountId = requireText(token?.subject, 'trusted subject')
  const traceId = requireText((context as ({ traceId?: string } | undefined))?.traceId, 'trusted trace')
  return {
    tenantId,
    operatorAccountId,
    traceId,
    auditId: requireText((context as ({ requestId?: string } | undefined))?.requestId, 'trusted request')
  }
}

/** requireQueryContext validates Task P1 query context fields from gRPC requests. */
export function requireQueryContext(input: object): Omit<GrpcCommandContext, 'auditId'> {
  const context = getAuthenticatedGrpcRequestContext(input)
  const token = context?.verifiedExecutionToken
  const tenantId = requireText(token?.tenantId, 'trusted tenant')
  const operatorAccountId = requireText(token?.subject, 'trusted subject')
  const traceId = requireText((context as ({ traceId?: string } | undefined))?.traceId, 'trusted trace')
  return { tenantId, operatorAccountId, traceId }
}

/** parseOptionalDate converts optional ISO date strings from gRPC requests. */
export function parseOptionalDate(value: string | undefined, fieldName: string): Date | null | undefined {
  const normalized = normalizeText(value)
  if (!normalized) return undefined
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} is invalid`)
  }
  return parsed
}

/** fromProtoPriority maps generated priority values to domain priority. */
export function fromProtoPriority(value: ProtoTaskPriority | undefined): TaskPriority | undefined {
  if (value === undefined || value === ProtoTaskPriority.TASK_PRIORITY_UNSPECIFIED) return undefined
  const map = {
    [ProtoTaskPriority.TASK_PRIORITY_LOW]: TaskPriority.LOW,
    [ProtoTaskPriority.TASK_PRIORITY_NORMAL]: TaskPriority.NORMAL,
    [ProtoTaskPriority.TASK_PRIORITY_HIGH]: TaskPriority.HIGH,
    [ProtoTaskPriority.TASK_PRIORITY_URGENT]: TaskPriority.URGENT
  } as const
  const mapped = map[value as keyof typeof map]
  if (!mapped) throw new BadRequestException('priority is invalid')
  return mapped
}

/** fromProtoStatus maps generated status values to domain status. */
export function fromProtoStatus(value: ProtoTaskStatus): TaskStatus {
  const map = {
    [ProtoTaskStatus.TASK_STATUS_OPEN]: TaskStatus.OPEN,
    [ProtoTaskStatus.TASK_STATUS_IN_PROGRESS]: TaskStatus.IN_PROGRESS,
    [ProtoTaskStatus.TASK_STATUS_COMPLETED]: TaskStatus.COMPLETED,
    [ProtoTaskStatus.TASK_STATUS_CANCELLED]: TaskStatus.CANCELLED
  } as const
  const mapped = map[value as keyof typeof map]
  if (!mapped) throw new BadRequestException('status is invalid')
  return mapped
}

/** fromProtoListScope maps generated list scope values to domain query scope. */
export function fromProtoListScope(value: ProtoTaskListScope | undefined): TaskListScope {
  const map = {
    [ProtoTaskListScope.TASK_LIST_SCOPE_MY_TODO]: TaskListScope.MY_TODO,
    [ProtoTaskListScope.TASK_LIST_SCOPE_ASSIGNED_TO_ME]: TaskListScope.ASSIGNED_TO_ME,
    [ProtoTaskListScope.TASK_LIST_SCOPE_CREATED_BY_ME]: TaskListScope.CREATED_BY_ME
  } as const
  const mapped = value ? map[value as keyof typeof map] : undefined
  if (!mapped) throw new BadRequestException('scope is invalid')
  return mapped
}

/** mapTaskError converts domain errors to Nest exceptions consumed by the gRPC exception filter. */
export function mapTaskError(error: unknown): never {
  if (error instanceof TaskDomainError) {
    if (error.code === TASK_NOT_FOUND) throw new NotFoundException(error.message)
    if (error.code === TASK_PERMISSION_DENIED) throw new ForbiddenException(error.message)
    if (error.code === TASK_INVALID_ARGUMENT || error.code === TASK_INVALID_STATE || error.code === TASK_ASSIGNEE_NOT_ACTIVE) {
      throw new BadRequestException(error.message)
    }
  }
  throw error instanceof Error ? error : new InternalServerErrorException('task operation failed')
}

/** requireText trims required gRPC scalar strings and rejects blanks. */
function requireText(value: string | undefined, fieldName: string): string {
  const normalized = normalizeText(value)
  if (!normalized) throw new BadRequestException(`${fieldName} is required`)
  return normalized
}

/** normalizeText trims optional gRPC scalar strings and returns undefined for blanks. */
function normalizeText(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
