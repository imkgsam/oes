import { Controller, UseFilters } from '@nestjs/common'
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
import { fromProtoPriority, mapTaskError, parseOptionalDate, requireCommandContext } from './task-grpc.mapping'
import { presentTask } from './task-grpc.presenter'

/** TaskCommandGrpcController exposes Task P1 write commands over internal gRPC. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@TaskCommandServiceControllerMethods()
export class TaskCommandGrpcController implements TaskCommandServiceController {
  constructor(private readonly taskCommandService: TaskCommandService) {}

  async createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    try {
      const context = requireCommandContext(request)
      const task = await this.taskCommandService.createTask({
        ...context,
        title: request.title ?? '',
        description: request.description,
        assigneeAccountId: request.assigneeAccountId,
        dueAt: parseOptionalDate(request.dueAt, 'due_at') ?? null,
        priority: fromProtoPriority(request.priority)
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  async updateTask(request: UpdateTaskRequest): Promise<UpdateTaskResponse> {
    try {
      const context = requireCommandContext(request)
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

  async startTask(request: StartTaskRequest): Promise<StartTaskResponse> {
    try {
      const task = await this.taskCommandService.startTask({
        ...requireCommandContext(request),
        taskId: request.taskId ?? ''
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  async completeTask(request: CompleteTaskRequest): Promise<CompleteTaskResponse> {
    try {
      const task = await this.taskCommandService.completeTask({
        ...requireCommandContext(request),
        taskId: request.taskId ?? '',
        completionNote: request.completionNote
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  async cancelTask(request: CancelTaskRequest): Promise<CancelTaskResponse> {
    try {
      const task = await this.taskCommandService.cancelTask({
        ...requireCommandContext(request),
        taskId: request.taskId ?? '',
        cancelReason: request.cancelReason
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  async reopenTask(request: ReopenTaskRequest): Promise<ReopenTaskResponse> {
    try {
      const task = await this.taskCommandService.reopenTask({
        ...requireCommandContext(request),
        taskId: request.taskId ?? '',
        reopenReason: request.reopenReason
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  async archiveTask(request: ArchiveTaskRequest): Promise<ArchiveTaskResponse> {
    try {
      const task = await this.taskCommandService.archiveTask({
        ...requireCommandContext(request),
        taskId: request.taskId ?? ''
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }

  async unarchiveTask(request: UnarchiveTaskRequest): Promise<UnarchiveTaskResponse> {
    try {
      const task = await this.taskCommandService.unarchiveTask({
        ...requireCommandContext(request),
        taskId: request.taskId ?? ''
      })
      return { task: presentTask(task) }
    } catch (error) {
      mapTaskError(error)
    }
  }
}
