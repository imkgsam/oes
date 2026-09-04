import { TaskBffService } from '../../../../../../../src/modules/collaboration-service/application/task-bff.service'
import { TaskController } from '../../../../../../../src/modules/collaboration-service/interface/http/controllers/task.controller'

describe('TaskController', () => {
  const source = {
    user: { aid: 'account-1', userId: 'user-1', tenantId: 'tenant-1' },
    requestId: 'request-1',
    traceId: 'trace-1'
  }
  let service: jest.Mocked<TaskBffService>
  let controller: TaskController

  beforeEach(() => {
    service = {
      listTasks: jest.fn(),
      getTask: jest.fn(),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      startTask: jest.fn(),
      completeTask: jest.fn(),
      cancelTask: jest.fn(),
      reopenTask: jest.fn(),
      archiveTask: jest.fn(),
      unarchiveTask: jest.fn()
    } as unknown as jest.Mocked<TaskBffService>
    controller = new TaskController(service)
  })

  it('forwards list and detail routes to the BFF service', () => {
    controller.listTasks('tenant-1', { scope: 'MY_TODO' }, source)
    controller.getTask('tenant-1', 'task-1', source)

    expect(service.listTasks).toHaveBeenCalledWith('tenant-1', { scope: 'MY_TODO' }, source)
    expect(service.getTask).toHaveBeenCalledWith('tenant-1', 'task-1', source)
  })

  it('forwards create and update task routes without adding deferred P2 fields', () => {
    controller.createTask(
      'tenant-1',
      {
        title: 'Review supplier quote',
        assigneeAccountId: 'account-2',
        dueAt: '2026-06-15T10:00:00.000Z',
        priority: 'HIGH'
      },
      source
    )
    controller.updateTask('tenant-1', 'task-1', { title: 'Review supplier quote v2' }, source)

    expect(service.createTask).toHaveBeenCalledWith(
      'tenant-1',
      expect.not.objectContaining({ businessObjectRef: expect.anything() }),
      source
    )
    expect(service.updateTask).toHaveBeenCalledWith(
      'tenant-1',
      'task-1',
      { title: 'Review supplier quote v2' },
      source
    )
  })

  it('forwards all frozen Task P1 command routes', () => {
    controller.startTask('tenant-1', 'task-1', source)
    controller.completeTask('tenant-1', 'task-1', { completionNote: 'done' }, source)
    controller.cancelTask('tenant-1', 'task-1', { cancelReason: 'duplicate' }, source)
    controller.reopenTask('tenant-1', 'task-1', { reopenReason: 'needs revision' }, source)
    controller.archiveTask('tenant-1', 'task-1', source)
    controller.unarchiveTask('tenant-1', 'task-1', source)

    expect(service.startTask).toHaveBeenCalledWith('tenant-1', 'task-1', source)
    expect(service.completeTask).toHaveBeenCalledWith(
      'tenant-1',
      'task-1',
      { completionNote: 'done' },
      source
    )
    expect(service.cancelTask).toHaveBeenCalledWith(
      'tenant-1',
      'task-1',
      { cancelReason: 'duplicate' },
      source
    )
    expect(service.reopenTask).toHaveBeenCalledWith(
      'tenant-1',
      'task-1',
      { reopenReason: 'needs revision' },
      source
    )
    expect(service.archiveTask).toHaveBeenCalledWith('tenant-1', 'task-1', source)
    expect(service.unarchiveTask).toHaveBeenCalledWith('tenant-1', 'task-1', source)
  })
})
