import { Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ArchiveTaskRequest,
  ArchiveTaskResponse,
  CancelTaskRequest,
  CancelTaskResponse,
  CompleteTaskRequest,
  CompleteTaskResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  ReopenTaskRequest,
  ReopenTaskResponse,
  StartTaskRequest,
  StartTaskResponse,
  TaskCommandServiceController,
  TaskCommandServiceControllerMethods,
  UnarchiveTaskRequest,
  UnarchiveTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse
} from '@oes/common/generated/collaboration_service'
import { TaskCommandService } from '../../application/services/task-command.service'
import {
  fromProtoPriority,
  mapTaskError,
  parseOptionalDate,
  requireCommandContext,
  resolveTaskDelegatedAuthority
} from './task-grpc.mapping'
import { presentTask } from './task-grpc.presenter'

/** TaskCommandGrpcController exposes Task P1 write commands over internal gRPC. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@TaskCommandServiceControllerMethods()
export class TaskCommandGrpcController implements TaskCommandServiceController {
  constructor(private readonly taskCommandService: TaskCommandService) {}

  /** Maps CreateTask transport fields and verified delegated metadata into the Task command boundary. */
  async createTask(request: CreateTaskRequest, metadata?: Metadata): Promise<CreateTaskResponse> {
    try {
      const context = this.commandContext(request, metadata)
      const task = await this.taskCommandService.createTask({
        ...context,
        title: request.title ?? '',
        description: request.description,
        assigneeAccountId: request.assigneeAccountId,
        dueAt: parseOptionalDate(request.dueAt, 'due_at') ?? null,
        priority: fromProtoPriority(request.priority),
        idempotencyKey: request.idempotencyKey
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  /** Maps UpdateTask while preserving the application layer's delegated-operation prohibition. */
  async updateTask(request: UpdateTaskRequest, metadata?: Metadata): Promise<UpdateTaskResponse> {
    try {
      const context = this.commandContext(request, metadata)
      const task = await this.taskCommandService.updateTask({
        ...context,
        taskId: request.taskId ?? '',
        title: request.title,
        description: request.description,
        dueAt: parseOptionalDate(request.dueAt, 'due_at'),
        priority: fromProtoPriority(request.priority)
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  /** Maps StartTask with transport-derived authority and stable Task error conversion. */
  async startTask(request: StartTaskRequest, metadata?: Metadata): Promise<StartTaskResponse> {
    try {
      const task = await this.taskCommandService.startTask({
        ...this.commandContext(request, metadata),
        taskId: request.taskId ?? ''
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  /** Maps CompleteTask with transport-derived authority and optional completion evidence. */
  async completeTask(
    request: CompleteTaskRequest,
    metadata?: Metadata
  ): Promise<CompleteTaskResponse> {
    try {
      const task = await this.taskCommandService.completeTask({
        ...this.commandContext(request, metadata),
        taskId: request.taskId ?? '',
        completionNote: request.completionNote
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  /** Maps CancelTask with transport-derived authority and the caller's safe reason snapshot. */
  async cancelTask(request: CancelTaskRequest, metadata?: Metadata): Promise<CancelTaskResponse> {
    try {
      const task = await this.taskCommandService.cancelTask({
        ...this.commandContext(request, metadata),
        taskId: request.taskId ?? '',
        cancelReason: request.cancelReason
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  /** Maps ReopenTask while retaining the owner-defined Task state transition rules. */
  async reopenTask(request: ReopenTaskRequest, metadata?: Metadata): Promise<ReopenTaskResponse> {
    try {
      const task = await this.taskCommandService.reopenTask({
        ...this.commandContext(request, metadata),
        taskId: request.taskId ?? '',
        reopenReason: request.reopenReason
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  /** Maps ArchiveTask while preserving the application layer's HUMAN-only enforcement. */
  async archiveTask(
    request: ArchiveTaskRequest,
    metadata?: Metadata
  ): Promise<ArchiveTaskResponse> {
    try {
      const task = await this.taskCommandService.archiveTask({
        ...this.commandContext(request, metadata),
        taskId: request.taskId ?? ''
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  /** Maps UnarchiveTask while preserving the application layer's HUMAN-only enforcement. */
  async unarchiveTask(
    request: UnarchiveTaskRequest,
    metadata?: Metadata
  ): Promise<UnarchiveTaskResponse> {
    try {
      const task = await this.taskCommandService.unarchiveTask({
        ...this.commandContext(request, metadata),
        taskId: request.taskId ?? ''
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  /** Combines required command correlation with transport-derived delegated authority when present. */
  private commandContext(
    request: Parameters<typeof requireCommandContext>[0],
    metadata?: Metadata
  ) {
    const context = requireCommandContext(request)
    const delegated = resolveTaskDelegatedAuthority(request, metadata)
    return { ...context, ...(delegated ?? {}) }
  }
}
