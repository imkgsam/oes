/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const archiveCollaborationTaskApi = vi.fn()
const cancelCollaborationTaskApi = vi.fn()
const completeCollaborationTaskApi = vi.fn()
const createCollaborationTaskApi = vi.fn()
const listCollaborationTasksApi = vi.fn()
const reopenCollaborationTaskApi = vi.fn()
const startCollaborationTaskApi = vi.fn()
const unarchiveCollaborationTaskApi = vi.fn()

const authContextState: any = {
  actionCodes: ['collaboration.task.assign'],
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
    }
  },
  tenantName: 'Alpha Tenant',
  visibleEntries: ['collaboration.tasks']
}

vi.mock('#/api', () => ({
  archiveCollaborationTaskApi,
  cancelCollaborationTaskApi,
  completeCollaborationTaskApi,
  createCollaborationTaskApi,
  listCollaborationTasksApi,
  reopenCollaborationTaskApi,
  startCollaborationTaskApi,
  unarchiveCollaborationTaskApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    template: '<div><slot /></div>'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    template: '<span />'
  }
}))

describe('collaboration task workspace', () => {
  beforeEach(() => {
    archiveCollaborationTaskApi.mockReset()
    cancelCollaborationTaskApi.mockReset()
    completeCollaborationTaskApi.mockReset()
    createCollaborationTaskApi.mockReset()
    listCollaborationTasksApi.mockReset()
    reopenCollaborationTaskApi.mockReset()
    startCollaborationTaskApi.mockReset()
    unarchiveCollaborationTaskApi.mockReset()
    authContextState.actionCodes = ['collaboration.task.assign']
    authContextState.visibleEntries = ['collaboration.tasks']
    authContextState.sessionContext = { tenant: { tenantId: 'tenant-1', name: 'Alpha Tenant' } }
    listCollaborationTasksApi.mockResolvedValue({
      items: [
        {
          taskId: 'task-1',
          tenantId: 'tenant-1',
          title: 'Review supplier quotation',
          description: 'Check landed cost',
          createdByAccountId: 'account-2',
          assigneeAccountId: 'account-1',
          visibility: 'ASSIGNMENT_PARTICIPANTS',
          status: 'OPEN',
          priority: 'HIGH',
          dueAt: '2026-06-15T10:00:00.000Z',
          overdue: false,
          createdAt: '2026-06-14T09:00:00.000Z',
          updatedAt: '2026-06-14T09:00:00.000Z'
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    })
    createCollaborationTaskApi.mockResolvedValue({ taskId: 'task-new' })
    startCollaborationTaskApi.mockResolvedValue({ taskId: 'task-1' })
    completeCollaborationTaskApi.mockResolvedValue({ taskId: 'task-1' })
  })

  it('loads scoped tasks and can create a private self todo', async () => {
    const page = (await import('./collaboration-task-workspace.vue')).default
    const wrapper = mount(page)

    await flushPromises()

    expect(listCollaborationTasksApi).toHaveBeenCalledWith('tenant-1', {
      scope: 'MY_TODO',
      status: [],
      priority: [],
      keyword: undefined,
      overdueOnly: false,
      includeArchived: false,
      archivedOnly: false,
      page: 1,
      pageSize: 20
    })
    expect(wrapper.text()).toContain('Review supplier quotation')

    await wrapper.get('[data-testid="task-create-open"]').trigger('click')
    await wrapper.get('[data-testid="task-title-input"]').setValue('Prepare shift handoff')
    await wrapper.get('[data-testid="task-description-input"]').setValue('Night shift summary')
    await wrapper.get('[data-testid="task-create-submit"]').trigger('click')
    await flushPromises()

    expect(createCollaborationTaskApi).toHaveBeenCalledWith('tenant-1', {
      title: 'Prepare shift handoff',
      description: 'Night shift summary',
      assigneeAccountId: undefined,
      dueAt: undefined,
      priority: 'NORMAL'
    })
  })

  it('prevents assigned-task submission when assign permission is missing', async () => {
    authContextState.actionCodes = []
    const page = (await import('./collaboration-task-workspace.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="task-create-open"]').trigger('click')

    expect(wrapper.text()).toContain('当前账号不能指派给他人')
    expect(wrapper.find('[data-testid="task-assignee-input"]').exists()).toBe(false)
  })

  it('sends start and complete commands from row actions', async () => {
    const page = (await import('./collaboration-task-workspace.vue')).default
    const wrapper = mount(page)

    await flushPromises()
    await wrapper.get('[data-testid="task-action-start-task-1"]').trigger('click')
    await flushPromises()

    expect(startCollaborationTaskApi).toHaveBeenCalledWith('tenant-1', 'task-1')

    await wrapper.get('[data-testid="task-action-complete-task-1"]').trigger('click')
    await wrapper.get('[data-testid="task-action-note"]').setValue('Done after review')
    await wrapper.get('[data-testid="task-action-submit"]').trigger('click')
    await flushPromises()

    expect(completeCollaborationTaskApi).toHaveBeenCalledWith('tenant-1', 'task-1', {
      completionNote: 'Done after review'
    })
  })
})
