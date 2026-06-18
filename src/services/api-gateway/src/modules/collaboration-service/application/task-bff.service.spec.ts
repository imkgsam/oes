import { TaskPriority, TaskListScope } from '@oes/common/generated/collaboration_service'
import { TaskCommandGrpcAdapter } from '../adapters/task-command-grpc.adapter'
import { TaskQueryGrpcAdapter } from '../adapters/task-query-grpc.adapter'
import { TaskBffService } from './task-bff.service'

describe('TaskBffService', () => {
  const source = {
    user: {
      aid: 'account-1',
      userId: 'user-1',
      tenantId: 'tenant-1'
    },
    requestId: 'request-1',
    traceId: 'trace-1'
  }

  it('maps list query scope and filters to collaboration-service gRPC request shape', async () => {
    const command = { call: jest.fn() } as unknown as TaskCommandGrpcAdapter
    const query = {
      listTasks: jest.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 }),
      getTask: jest.fn()
    } as unknown as TaskQueryGrpcAdapter
    const service = new TaskBffService(command, query)

    await service.listTasks(
      'tenant-1',
      {
        scope: 'ASSIGNED_TO_ME',
        priority: ['HIGH'],
        includeArchived: 'true',
        page: '2',
        pageSize: '10'
      },
      source
    )

    expect(query.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        operatorContext: expect.objectContaining({ accountId: 'account-1' }),
        traceContext: expect.objectContaining({ traceId: 'trace-1' }),
        scope: TaskListScope.TASK_LIST_SCOPE_ASSIGNED_TO_ME,
        priority: [TaskPriority.TASK_PRIORITY_HIGH],
        includeArchived: true,
        page: 2,
        pageSize: 10
      }),
      source
    )
  })

  it('adds command audit context when creating tasks', async () => {
    const command = {
      call: jest.fn().mockResolvedValue({ task: { taskId: 'task-1' } })
    } as unknown as TaskCommandGrpcAdapter
    const query = { listTasks: jest.fn(), getTask: jest.fn() } as unknown as TaskQueryGrpcAdapter
    const service = new TaskBffService(command, query)

    await service.createTask(
      'tenant-1',
      {
        title: 'Prepare shift notes',
        priority: 'NORMAL'
      },
      source
    )

    expect(command.call).toHaveBeenCalledWith(
      'createTask',
      expect.objectContaining({
        tenantId: 'tenant-1',
        title: 'Prepare shift notes',
        priority: TaskPriority.TASK_PRIORITY_NORMAL,
        auditContext: expect.objectContaining({ auditId: 'request-1', source: 'api-gateway' })
      }),
      source
    )
  })
})
