import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { DownstreamSource } from '../../../../../common/decorators/downstream-source.decorator'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { TaskBffService } from '../../../application/task-bff.service'
import { CancelTaskDto, CompleteTaskDto, CreateTaskDto, ListTasksDto, ReopenTaskDto, UpdateTaskDto } from '../dtos/task.dto'

/** TaskController exposes tenant Task P1 workflows through the API Gateway. */
@ApiBearerAuth('JWT')
@ApiTags('collaboration-tasks')
@Controller('collaboration/tenants/:tenantId/tasks')
export class TaskController {
  constructor(private readonly taskBffService: TaskBffService) {}

  @Get()
  @ApiOperation({ summary: 'List Task P1 personal workspace tasks' })
  listTasks(@Param('tenantId') tenantId: string, @Query() query: ListTasksDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.listTasks(tenantId, query, source)
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get one Task P1 detail' })
  getTask(@Param('tenantId') tenantId: string, @Param('taskId') taskId: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.getTask(tenantId, taskId, source)
  }

  @Post()
  @ApiOperation({ summary: 'Create a private todo or assigned Task P1 task' })
  createTask(@Param('tenantId') tenantId: string, @Body() body: CreateTaskDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.createTask(tenantId, body, source)
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update Task P1 basics' })
  updateTask(@Param('tenantId') tenantId: string, @Param('taskId') taskId: string, @Body() body: UpdateTaskDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.updateTask(tenantId, taskId, body, source)
  }

  @Post(':taskId/start')
  @ApiOperation({ summary: 'Start a Task P1 task' })
  startTask(@Param('tenantId') tenantId: string, @Param('taskId') taskId: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.startTask(tenantId, taskId, source)
  }

  @Post(':taskId/complete')
  @ApiOperation({ summary: 'Complete a Task P1 task' })
  completeTask(@Param('tenantId') tenantId: string, @Param('taskId') taskId: string, @Body() body: CompleteTaskDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.completeTask(tenantId, taskId, body, source)
  }

  @Post(':taskId/cancel')
  @ApiOperation({ summary: 'Cancel a Task P1 task' })
  cancelTask(@Param('tenantId') tenantId: string, @Param('taskId') taskId: string, @Body() body: CancelTaskDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.cancelTask(tenantId, taskId, body, source)
  }

  @Post(':taskId/reopen')
  @ApiOperation({ summary: 'Reopen a terminal Task P1 task' })
  reopenTask(@Param('tenantId') tenantId: string, @Param('taskId') taskId: string, @Body() body: ReopenTaskDto, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.reopenTask(tenantId, taskId, body, source)
  }

  @Post(':taskId/archive')
  @ApiOperation({ summary: 'Archive a terminal Task P1 task' })
  archiveTask(@Param('tenantId') tenantId: string, @Param('taskId') taskId: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.archiveTask(tenantId, taskId, source)
  }

  @Post(':taskId/unarchive')
  @ApiOperation({ summary: 'Unarchive a Task P1 task' })
  unarchiveTask(@Param('tenantId') tenantId: string, @Param('taskId') taskId: string, @DownstreamSource() source: DownstreamRequestSource) {
    return this.taskBffService.unarchiveTask(tenantId, taskId, source)
  }
}
