/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';

import { nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import taskWorkbenchSource from './task-workbench-section.vue?raw';

const apiMock = vi.hoisted(() => ({
  archiveCollaborationTaskApi: vi.fn(),
  cancelCollaborationTaskApi: vi.fn(),
  completeCollaborationTaskApi: vi.fn(),
  createCollaborationTaskApi: vi.fn(),
  listAdminAccountsApi: vi.fn(),
  listCollaborationTasksApi: vi.fn(),
  reopenCollaborationTaskApi: vi.fn(),
  startCollaborationTaskApi: vi.fn(),
  unarchiveCollaborationTaskApi: vi.fn(),
}));

const authContextState = vi.hoisted(() => ({
  actionCodes: ['collaboration.task.assign'],
  sessionContext: {
    account: {
      accountId: 'account-creator',
      name: '陈双鹏',
      scopeLevel: 'TENANT',
    },
    operator: {
      displayName: '陈双鹏',
      scopeLevel: 'TENANT',
      userId: 'user-creator',
    },
    tenant: {
      name: '广东美隆陶瓷有限公司',
      tenantId: '00000000-0000-4000-8000-000000000001',
    },
  },
  tenantName: '广东美隆陶瓷有限公司',
}));

const preferenceState = vi.hoisted(() => ({
  isDark: false,
}));

const antMessageMock = vi.hoisted(() => ({
  success: vi.fn(),
}));

vi.mock('#/api', () => apiMock);

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState,
}));

vi.mock('@vben/preferences', () => ({
  usePreferences: () => ({
    isDark: preferenceState.isDark,
  }),
}));

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<i :data-icon="icon" />',
  },
}));

vi.mock('ant-design-vue', () => {
  const Button = {
    emits: ['click'],
    name: 'Button',
    props: ['disabled', 'loading', 'shape', 'title', 'type'],
    template:
      '<button v-bind="$attrs" :disabled="disabled || loading" :title="title" @click="$emit(\'click\', $event)"><slot name="icon" /><slot /></button>',
  };
  const Input = {
    emits: ['update:value'],
    name: 'Input',
    props: ['value'],
    template:
      '<input :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
  };
  const TextArea = {
    emits: ['update:value'],
    name: 'Textarea',
    props: ['value'],
    template:
      '<textarea :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
  };
  (Input as any).TextArea = TextArea;

  return {
    Alert: {
      name: 'Alert',
      props: ['message'],
      template: '<div class="ant-alert">{{ message }}<slot /></div>',
    },
    Button,
    Card: {
      name: 'Card',
      template:
        '<section class="ant-card"><header><slot name="title" /></header><slot /></section>',
    },
    DatePicker: {
      emits: ['update:value'],
      name: 'DatePicker',
      props: ['format', 'placeholder', 'showTime', 'value', 'valueFormat'],
      template:
        '<input v-bind="$attrs" :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
    },
    Drawer: {
      emits: ['close', 'update:open'],
      name: 'Drawer',
      props: ['open', 'title'],
      template: '<aside class="ant-drawer"><h2>{{ title }}</h2><slot /></aside>',
    },
    Dropdown: {
      name: 'Dropdown',
      template:
        '<div class="ant-dropdown"><slot /><div class="ant-dropdown-overlay"><slot name="overlay" /></div></div>',
    },
    Empty: {
      name: 'Empty',
      props: ['description'],
      template: '<div class="ant-empty">{{ description }}</div>',
    },
    Input,
    Menu: Object.assign(
      {
        emits: ['click'],
        name: 'Menu',
        template:
          '<div class="ant-menu" @click="$emit(\'click\', { key: $event.target.getAttribute(\'data-menu-key\') })"><slot /></div>',
      },
      {
        Item: {
          name: 'MenuItem',
          props: ['disabled'],
          template:
            '<button v-bind="$attrs" class="ant-menu-item" :disabled="disabled"><slot /></button>',
        },
      },
    ),
    message: antMessageMock,
    Modal: {
      emits: ['cancel', 'update:open'],
      name: 'Modal',
      props: ['footer', 'open', 'title'],
      template: '<section v-if="open" class="ant-modal"><h2>{{ title }}</h2><slot /></section>',
    },
    Select: {
      emits: ['focus', 'search', 'update:value'],
      name: 'Select',
      props: {
        filterOption: [Boolean, Function],
        loading: Boolean,
        showSearch: Boolean,
        value: null,
      },
      template:
        '<select v-bind="$attrs" :value="value" @change="$emit(\'update:value\', $event.target.value)" @focus="$emit(\'focus\')" @input="$emit(\'search\', $event.target.value)"><slot /></select>',
    },
    SelectOption: {
      name: 'SelectOption',
      props: ['value'],
      template: '<option :value="value"><slot /></option>',
    },
    Segmented: {
      emits: ['change', 'update:value'],
      name: 'Segmented',
      props: ['options', 'value'],
      template:
        '<div class="ant-segmented"><button v-for="option in options" :key="option.value" :disabled="option.disabled" @click="$emit(\'update:value\', option.value); $emit(\'change\', option.value)">{{ option.label }}</button></div>',
    },
    Skeleton: {
      name: 'Skeleton',
      template: '<div class="ant-skeleton">loading</div>',
    },
    Tag: {
      name: 'Tag',
      template: '<span class="ant-tag"><slot /></span>',
    },
  };
});

// makeTask creates compact Task P1 API records for workbench rendering tests.
function makeTask(
  taskId: string,
  title: string,
  status: 'CANCELLED' | 'COMPLETED' | 'IN_PROGRESS' | 'OPEN' = 'OPEN',
  priority: 'HIGH' | 'LOW' | 'NORMAL' | 'URGENT' = 'NORMAL',
) {
  return {
    assigneeAccountId: 'account-assignee',
    assigneeDisplayName: '林婉清',
    createdAt: '2026-06-14T08:00:00.000Z',
    createdByAccountId: 'account-creator',
    createdByDisplayName: '陈双鹏',
    description: `${title} description`,
    dueAt: '2026-06-15T10:00:00.000Z',
    overdue: false,
    priority,
    status,
    taskId,
    tenantId: authContextState.sessionContext.tenant.tenantId,
    title,
    updatedAt: '2026-06-14T09:00:00.000Z',
    visibility: 'PRIVATE',
  };
}

// mountSection renders the real Task workbench component with mocked Gateway calls.
async function mountSection() {
  const view = await import('./task-workbench-section.vue');
  const wrapper = mount(view.default);
  await flushPromises();
  return wrapper;
}

describe('task workbench section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preferenceState.isDark = false;
    authContextState.actionCodes = ['collaboration.task.assign'];
    authContextState.sessionContext = {
      account: {
        accountId: 'account-creator',
        name: '陈双鹏',
        scopeLevel: 'TENANT',
      },
      operator: {
        displayName: '陈双鹏',
        scopeLevel: 'TENANT',
        userId: 'user-creator',
      },
      tenant: {
        name: '广东美隆陶瓷有限公司',
        tenantId: '00000000-0000-4000-8000-000000000001',
      },
    };
    apiMock.listCollaborationTasksApi.mockImplementation(
      async (
        _tenantId: string,
        params: { pageSize?: number; scope: string; status?: string[] },
      ) => ({
        items:
          Array.isArray(params.status) && params.pageSize === 20
            ? [
                {
                  ...makeTask('task-history', '历史跟进任务', 'COMPLETED'),
                  completedAt: '2026-06-14T10:30:00.000Z',
                  createdAt: '2026-06-14T08:00:00.000Z',
                },
              ]
            : params.scope === 'MY_TODO'
              ? [makeTask('task-self', '复核交接事项')]
              : params.scope === 'ASSIGNED_TO_ME'
                ? [makeTask('task-assigned', '处理客户资料')]
                : [makeTask('task-created', '跟进报价审批', 'COMPLETED')],
        page: 1,
        pageSize: 5,
        total: 1,
      }),
    );
    apiMock.createCollaborationTaskApi.mockResolvedValue({
      task: makeTask('task-created-new', '新任务'),
    });
    apiMock.listAdminAccountsApi.mockResolvedValue({
      items: [
        {
          accountDisplayName: '陈双鹏',
          accountId: 'account-creator',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: authContextState.sessionContext.tenant.tenantId,
          tenantName: '广东美隆陶瓷有限公司',
          userDisplayName: '陈双鹏',
          userId: 'user-creator',
        },
        {
          accountDisplayName: '林婉清',
          accountId: 'account-assignee',
          isEnabled: true,
          scopeLevel: 'TENANT',
          tenantId: authContextState.sessionContext.tenant.tenantId,
          tenantName: '广东美隆陶瓷有限公司',
          userDisplayName: '林婉清',
          userId: 'user-assignee',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    apiMock.startCollaborationTaskApi.mockResolvedValue({
      task: makeTask('task-self', '复核交接事项', 'IN_PROGRESS'),
    });
    apiMock.completeCollaborationTaskApi.mockResolvedValue({
      task: makeTask('task-self', '复核交接事项', 'COMPLETED'),
    });
    apiMock.reopenCollaborationTaskApi.mockResolvedValue({
      task: makeTask('task-self', '复核交接事项', 'OPEN'),
    });
    apiMock.cancelCollaborationTaskApi.mockResolvedValue({
      task: makeTask('task-self', '复核交接事项', 'CANCELLED'),
    });
    apiMock.archiveCollaborationTaskApi.mockResolvedValue({
      task: {
        ...makeTask('task-created', '跟进报价审批', 'COMPLETED'),
        archivedAt: '2026-06-15T11:00:00.000Z',
      },
    });
    apiMock.unarchiveCollaborationTaskApi.mockResolvedValue({
      task: makeTask('task-created', '跟进报价审批', 'COMPLETED'),
    });
  });

  it('loads three Task P1 scopes as separate workbench blocks', async () => {
    const wrapper = await mountSection();

    expect(apiMock.listCollaborationTasksApi).toHaveBeenCalledTimes(3);
    expect(apiMock.listCollaborationTasksApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      expect.objectContaining({ pageSize: 5, scope: 'MY_TODO' }),
    );
    expect(wrapper.text()).toContain('我的待办');
    expect(wrapper.text()).toContain('指派给我的');
    expect(wrapper.text()).toContain('我分派的任务');
    expect(wrapper.text()).toContain('复核交接事项');
    expect(wrapper.text()).toContain('处理客户资料');
    expect(wrapper.text()).toContain('委派给 林婉清');
    expect(wrapper.text()).not.toContain('广东美隆陶瓷有限公司');
    expect(wrapper.find('.task-workbench-heading').exists()).toBe(false);
  });

  it('keeps creator-owned terminal tasks visible until they are archived', async () => {
    await mountSection();

    const initialScopeQueries = apiMock.listCollaborationTasksApi.mock.calls
      .map((call) => call[1])
      .filter((params) => params.pageSize === 5);

    expect(initialScopeQueries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          includeArchived: false,
          scope: 'CREATED_BY_ME',
          status: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        }),
        expect.objectContaining({
          includeArchived: false,
          scope: 'MY_TODO',
          status: undefined,
        }),
        expect.objectContaining({
          includeArchived: false,
          scope: 'ASSIGNED_TO_ME',
          status: undefined,
        }),
      ]),
    );
  });

  it('switches each task block through compact status views', async () => {
    const wrapper = await mountSection();
    vi.clearAllMocks();

    const assignedView = wrapper.find('[data-testid="task-status-view-ASSIGNED_TO_ME"]');
    expect(assignedView.exists()).toBe(true);
    expect(assignedView.text()).toContain('全部');
    expect(assignedView.text()).toContain('待处理');
    expect(assignedView.text()).toContain('进行中');
    expect(assignedView.text()).not.toContain('已完成');
    expect(assignedView.text()).not.toContain('已取消');

    await assignedView
      .findAll('button')
      .find((button) => button.text() === '进行中')
      ?.trigger('click');
    await flushPromises();

    expect(apiMock.listCollaborationTasksApi).toHaveBeenLastCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      expect.objectContaining({
        includeArchived: false,
        scope: 'ASSIGNED_TO_ME',
        status: ['IN_PROGRESS'],
      }),
    );

    const createdView = wrapper.find('[data-testid="task-status-view-CREATED_BY_ME"]');
    expect(createdView.text()).toContain('已完成');
    expect(createdView.text()).toContain('已取消');

    await createdView
      .findAll('button')
      .find((button) => button.text() === '已完成')
      ?.trigger('click');
    await flushPromises();

    expect(apiMock.listCollaborationTasksApi).toHaveBeenLastCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      expect.objectContaining({
        includeArchived: false,
        scope: 'CREATED_BY_ME',
        status: ['COMPLETED'],
      }),
    );

    const myTodoView = wrapper.find('[data-testid="task-status-view-MY_TODO"]');
    await myTodoView
      .findAll('button')
      .find((button) => button.text() === '待处理')
      ?.trigger('click');
    await flushPromises();

    expect(apiMock.listCollaborationTasksApi).toHaveBeenLastCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      expect.objectContaining({
        includeArchived: false,
        scope: 'MY_TODO',
        status: ['OPEN'],
      }),
    );
  });

  it('keeps the current task list visible while a status switch refresh is pending', async () => {
    const wrapper = await mountSection();
    const pendingStatusRefresh = new Promise(() => {});
    apiMock.listCollaborationTasksApi.mockImplementation(
      async (
        _tenantId: string,
        params: { pageSize?: number; scope: string; status?: string[] },
      ) => {
        if (params.scope === 'MY_TODO' && params.status?.[0] === 'OPEN') {
          return pendingStatusRefresh;
        }
        return {
          items: [makeTask('task-fallback', '兜底任务')],
          page: 1,
          pageSize: params.pageSize ?? 5,
          total: 1,
        };
      },
    );

    await wrapper
      .find('[data-testid="task-status-view-MY_TODO"]')
      .findAll('button')
      .find((button) => button.text() === '待处理')
      ?.trigger('click');
    await nextTick();

    const myTodoScope = wrapper.find('[data-testid="task-scope-MY_TODO"]');
    expect(myTodoScope.text()).toContain('复核交接事项');
    expect(myTodoScope.find('.ant-skeleton').exists()).toBe(false);
  });

  it('renders in-progress tasks with a distinct status tag class', async () => {
    apiMock.listCollaborationTasksApi.mockImplementation(
      async (
        _tenantId: string,
        params: { pageSize?: number; scope: string; status?: string[] },
      ) => ({
        items:
          params.scope === 'MY_TODO'
            ? [makeTask('task-self', '复核交接事项')]
            : params.scope === 'ASSIGNED_TO_ME'
              ? [makeTask('task-progress', '推进客户资料', 'IN_PROGRESS')]
              : [makeTask('task-created', '跟进报价审批', 'COMPLETED')],
        page: 1,
        pageSize: params.pageSize ?? 5,
        total: 1,
      }),
    );

    const wrapper = await mountSection();

    const inProgressTag = wrapper.find('.task-status-tag--in-progress');
    expect(inProgressTag.exists()).toBe(true);
    expect(inProgressTag.text()).toContain('进行中');
    expect(inProgressTag.classes()).not.toContain('task-status-tag--open');
    expect(wrapper.find('.task-status-tag--open').text()).toContain('待处理');
    expect(taskWorkbenchSource).toContain('.task-status-tag--in-progress');
  });

  it('renders priority tags with distinct visual classes in dark mode', async () => {
    apiMock.listCollaborationTasksApi.mockImplementation(
      async (
        _tenantId: string,
        params: { pageSize?: number; scope: string; status?: string[] },
      ) => ({
        items:
          params.scope === 'MY_TODO'
            ? [makeTask('task-urgent', '紧急交接事项', 'OPEN', 'URGENT')]
            : params.scope === 'ASSIGNED_TO_ME'
              ? [makeTask('task-high', '高优先级资料', 'IN_PROGRESS', 'HIGH')]
              : [makeTask('task-normal', '普通报价审批', 'OPEN', 'NORMAL')],
        page: 1,
        pageSize: params.pageSize ?? 5,
        total: 1,
      }),
    );

    const wrapper = await mountSection();

    expect(wrapper.find('.task-priority-tag--urgent').text()).toContain('紧急');
    expect(wrapper.find('.task-priority-tag--high').text()).toContain('高');
    expect(wrapper.find('.task-priority-tag--normal').text()).toContain('普通');
    expect(taskWorkbenchSource).toContain('function priorityTagClass(priority: string)');
    expect(taskWorkbenchSource).toContain(
      '.task-workbench-section--dark :deep(.ant-tag.task-priority-tag--normal)',
    );
    expect(taskWorkbenchSource).toContain(
      '.task-workbench-section--dark :deep(.ant-tag.task-priority-tag--urgent)',
    );
    expect(taskWorkbenchSource).toContain(
      '.task-workbench-section--dark :deep(.ant-tag.task-priority-tag--high)',
    );
  });

  it('keeps scoped blocks equal-height with icon create actions and fixed task rows', async () => {
    const wrapper = await mountSection();

    expect(wrapper.findAll('[data-icon="lucide:more-horizontal"]')).toHaveLength(3);
    expect(wrapper.find('[data-testid="task-create-open-MY_TODO"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="task-create-open-CREATED_BY_ME"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="task-create-open-ASSIGNED_TO_ME"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="task-history-open-ASSIGNED_TO_ME"]').exists()).toBe(true);

    expect(taskWorkbenchSource).toContain('--task-block-height: 432px;');
    expect(taskWorkbenchSource).toContain('height: var(--task-block-height);');
    expect(taskWorkbenchSource).toContain('max-height: var(--task-block-height);');
    expect(taskWorkbenchSource).toContain('overflow-y: auto;');
    expect(taskWorkbenchSource).toContain('--task-row-height: 92px;');
    expect(taskWorkbenchSource).toContain('grid-auto-rows: var(--task-row-height);');
    expect(taskWorkbenchSource).toContain('height: var(--task-row-height);');
    expect(taskWorkbenchSource).toContain('max-height: var(--task-row-height);');
  });

  it('constrains status tabs inside the scope header when terminal statuses are visible', async () => {
    const wrapper = await mountSection();

    expect(
      wrapper.find('[data-testid="task-status-view-CREATED_BY_ME"]').text(),
    ).toContain('已取消');
    expect(taskWorkbenchSource).toContain('grid-template-columns: minmax(0, 1fr);');
    expect(taskWorkbenchSource).toContain('width: 100%;');
    expect(taskWorkbenchSource).toContain(
      '.task-scope-block__status-tabs :deep(.ant-segmented)',
    );
    expect(taskWorkbenchSource).toContain('width: max-content;');
    expect(taskWorkbenchSource).toContain('max-width: 100%;');
  });

  it('keeps task blocks dark-mode native instead of forcing light panels', () => {
    expect(taskWorkbenchSource).toContain(':global(html.dark) .task-scope-block');
    expect(taskWorkbenchSource).toContain('background: #111827;');
    expect(taskWorkbenchSource).toContain('background: #172033;');
    expect(taskWorkbenchSource).not.toContain(':global(html.dark) .task-scope-block {\n  background: #e5e7eb;');
    expect(taskWorkbenchSource).not.toContain(':global(html.dark) .task-card-row {\n  background: #f1f5f9;');
  });

  it('binds a component-level dark class so task panels do not depend on Ant CSS variable fallbacks', async () => {
    preferenceState.isDark = true;

    const wrapper = await mountSection();

    expect(wrapper.find('[data-testid="task-workbench-section"]').classes()).toContain(
      'task-workbench-section--dark',
    );
    expect(taskWorkbenchSource).toContain("import { usePreferences } from '@vben/preferences';");
    expect(taskWorkbenchSource).toContain(':class="{ \'task-workbench-section--dark\': isDark }"');
    expect(taskWorkbenchSource).toContain('.task-workbench-section--dark .task-scope-block');
    expect(taskWorkbenchSource).toContain('.task-workbench-section--dark .task-card-row');
    expect(taskWorkbenchSource).toContain(
      '.task-workbench-section--dark .task-scope-block__status-tabs :deep(.ant-segmented-item-selected)',
    );
    expect(taskWorkbenchSource).toContain(
      '.task-workbench-section--dark .task-card-row__meta :deep(.ant-tag)',
    );
  });

  it('creates a self todo from the workbench drawer command path', async () => {
    const wrapper = await mountSection();

    await wrapper.find('[data-testid="task-create-open-MY_TODO"]').trigger('click');
    await wrapper.find('[data-testid="task-title-input"]').setValue('准备周会材料');
    const dueAtPicker = wrapper.findComponent({ name: 'DatePicker' });
    expect(dueAtPicker.exists()).toBe(true);
    expect(dueAtPicker.props('showTime')).toEqual({ format: 'HH:mm' });
    expect(dueAtPicker.props('valueFormat')).toBe('YYYY-MM-DDTHH:mm:ssZ');
    await wrapper.find('[data-testid="task-due-at-input"]').setValue('2026-06-16T09:30:00+08:00');
    await wrapper.find('[data-testid="task-create-submit"]').trigger('click');
    await flushPromises();

    expect(apiMock.createCollaborationTaskApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      expect.objectContaining({
        dueAt: '2026-06-16T09:30:00+08:00',
        priority: 'NORMAL',
        title: '准备周会材料',
      }),
    );
  });

  it('opens assignment creation from a scope add icon and searches account options', async () => {
    const wrapper = await mountSection();

    await wrapper.find('[data-testid="task-create-open-CREATED_BY_ME"]').trigger('click');
    await flushPromises();

    expect(apiMock.listAdminAccountsApi).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 20,
        scopeLevel: 'TENANT',
        status: 'ENABLED',
        tenantId: authContextState.sessionContext.tenant.tenantId,
      }),
    );
    expect(wrapper.text()).toContain('林婉清');
    const accountOptionTexts = wrapper
      .findAll('.task-account-option')
      .map((option) => option.text());
    expect(accountOptionTexts).toEqual(['林婉清']);
    expect(accountOptionTexts.join(' ')).not.toContain('陈双鹏');
    expect(accountOptionTexts.join(' ')).not.toContain('广东美隆陶瓷有限公司');
    expect(wrapper.text()).not.toContain('处理人账号 ID');
    const assigneeSelect = wrapper
      .findAllComponents({ name: 'Select' })
      .find((select) => select.attributes('data-testid') === 'task-assignee-input');
    expect(assigneeSelect?.props('showSearch')).toBe(true);
    expect(assigneeSelect?.props('filterOption')).toBe(false);

    await wrapper.find('[data-testid="task-title-input"]').setValue('指派跟进资料');
    await wrapper.find('[data-testid="task-assignee-input"]').setValue('account-assignee');
    await wrapper.find('[data-testid="task-create-submit"]').trigger('click');
    await flushPromises();

    expect(apiMock.createCollaborationTaskApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      expect.objectContaining({
        assigneeAccountId: 'account-assignee',
        title: '指派跟进资料',
      }),
    );
  });

  it('opens a terminal-task history modal from the scope dropdown with duration', async () => {
    const wrapper = await mountSection();

    await wrapper.find('[data-testid="task-history-open-MY_TODO"]').trigger('click');
    await flushPromises();

    expect(apiMock.listCollaborationTasksApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      expect.objectContaining({
        includeArchived: true,
        scope: 'MY_TODO',
        status: ['COMPLETED', 'CANCELLED'],
      }),
    );
    expect(wrapper.text()).toContain('我的待办历史');
    expect(wrapper.text()).toContain('历史跟进任务');
    expect(wrapper.text()).toContain('花费 2小时30分钟');
  });

  it('opens task detail and sends a start command through the BFF API', async () => {
    const wrapper = await mountSection();

    await wrapper.find('.task-card-row').trigger('click');
    expect(wrapper.text()).not.toContain('account-assignee');
    expect(wrapper.text()).not.toContain('account-creator');
    expect(wrapper.text()).toContain('陈双鹏');
    expect(wrapper.text()).toContain('林婉清');
    expect(wrapper.text()).not.toContain('未加载成员信息');

    await wrapper.findAll('button').find((button) => button.text() === '开始')?.trigger('click');
    await flushPromises();

    expect(apiMock.startCollaborationTaskApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      'task-self',
    );
    expect(antMessageMock.success).toHaveBeenCalledWith('任务状态已更新');
    expect(wrapper.text()).not.toContain('任务状态已更新');
  });

  it('drives terminal and archive task commands from the detail drawer', async () => {
    const wrapper = await mountSection();

    await wrapper.find('.task-card-row').trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === '完成')?.trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === '提交')?.trigger('click');
    await flushPromises();

    expect(apiMock.completeCollaborationTaskApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      'task-self',
      expect.objectContaining({ completionNote: undefined }),
    );

    await wrapper.findAll('button').find((button) => button.text() === '重开')?.trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === '提交')?.trigger('click');
    await flushPromises();

    expect(apiMock.reopenCollaborationTaskApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      'task-self',
      expect.objectContaining({ reopenReason: undefined }),
    );

    const cancelButtons = wrapper
      .findAll('button')
      .filter((button) => button.text() === '取消');
    await cancelButtons[cancelButtons.length - 1]?.trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === '提交')?.trigger('click');
    await flushPromises();

    expect(apiMock.cancelCollaborationTaskApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      'task-self',
      expect.objectContaining({ cancelReason: undefined }),
    );

    await wrapper.findAll('.task-card-row').find((row) => row.text().includes('跟进报价审批'))?.trigger('click');
    await flushPromises();
    await wrapper.findAll('button').find((button) => button.text() === '归档')?.trigger('click');
    await flushPromises();

    expect(apiMock.archiveCollaborationTaskApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      'task-created',
    );

    await wrapper.findAll('button').find((button) => button.text() === '恢复归档')?.trigger('click');
    await flushPromises();

    expect(apiMock.unarchiveCollaborationTaskApi).toHaveBeenCalledWith(
      authContextState.sessionContext.tenant.tenantId,
      'task-created',
    );
  });

  it('shows permission-denied state when task list calls are rejected by policy', async () => {
    apiMock.listCollaborationTasksApi.mockRejectedValueOnce(
      new Error('PERMISSION_DENIED'),
    );

    const wrapper = await mountSection();

    expect(wrapper.text()).toContain('当前账号没有访问协同任务的权限');
  });

  it('disables assignment creation when the operator lacks assign permission', async () => {
    authContextState.actionCodes = [];

    const wrapper = await mountSection();

    expect(wrapper.text()).toContain('当前账号不能指派给他人');
  });
});
