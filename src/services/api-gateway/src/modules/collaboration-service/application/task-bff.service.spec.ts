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
    const identity = { getAccountById: jest.fn() }
    const service = new TaskBffService(command, query, identity as any)

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
    const identity = {
      getAccountById: jest.fn().mockResolvedValue({
        account: { id: 'account-1', displayName: '陈双鹏', userId: 'user-1' }
      })
    }
    const service = new TaskBffService(command, query, identity as any)

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

  it('hydrates task participant labels through identity account reads', async () => {
    const command = { call: jest.fn() } as unknown as TaskCommandGrpcAdapter
    const query = {
      listTasks: jest.fn().mockResolvedValue({
        items: [
          {
            taskId: 'task-1',
            createdByAccountId: 'account-creator',
            assigneeAccountId: 'account-assignee'
          }
        ],
        page: 1,
        pageSize: 20,
        total: 1
      }),
      getTask: jest.fn()
    } as unknown as TaskQueryGrpcAdapter
    const identity = {
      getAccountById: jest.fn(async (accountId: string) => ({
        account: {
          id: accountId,
          displayName:
            accountId === 'account-creator' ? '陈双鹏' : '林晓雯',
          userId: `user-${accountId}`
        }
      }))
    }
    const service = new TaskBffService(command, query, identity as any)

    const result = await service.listTasks(
      'tenant-1',
      { scope: 'CREATED_BY_ME' },
      source
    )

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        assigneeDisplayName: '林晓雯',
        createdByDisplayName: '陈双鹏'
      })
    )
    expect(identity.getAccountById).toHaveBeenCalledWith('account-creator', source)
    expect(identity.getAccountById).toHaveBeenCalledWith('account-assignee', source)
  })
})
