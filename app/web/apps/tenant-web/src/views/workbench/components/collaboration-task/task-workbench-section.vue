<script setup lang="ts">
import type { AdminSecurityApi } from '#/api';
import type { CollaborationTaskApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { usePreferences } from '@vben/preferences';

import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Menu,
  message,
  Modal,
  Select,
  SelectOption,
  Segmented,
  Skeleton,
  Tag,
} from 'ant-design-vue';

import {
  archiveCollaborationTaskApi,
  cancelCollaborationTaskApi,
  completeCollaborationTaskApi,
  createCollaborationTaskApi,
  listAdminAccountsApi,
  listCollaborationTasksApi,
  reopenCollaborationTaskApi,
  startCollaborationTaskApi,
  unarchiveCollaborationTaskApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';

type TaskPriority = CollaborationTaskApi.TaskPriority;
type TaskScope = CollaborationTaskApi.TaskScope;
type TaskStatus = CollaborationTaskApi.TaskStatus;
type TaskView = CollaborationTaskApi.TaskView;
type ScopeStatusView = 'ALL' | TaskStatus;

interface ScopeState {
  error: string;
  items: TaskView[];
  loaded: boolean;
  loading: boolean;
  refreshing: boolean;
  total: number;
}

interface CreateTaskFormState {
  assigneeAccountId: string;
  assignmentMode: 'ASSIGN' | 'SELF';
  description: string;
  dueAt: string;
  priority: TaskPriority;
  title: string;
}

interface HistoryState {
  error: string;
  items: TaskView[];
  loading: boolean;
  scope: TaskScope;
  total: number;
}

interface AssignableAccountOption {
  accountId: string;
  label: string;
  subtitle: string;
}

type PendingActionKind = 'cancel' | 'complete' | 'reopen';

const Textarea = Input.TextArea;
const authContextStore = useAuthContextStore();
const { isDark } = usePreferences();
const activeTenantId = computed(
  () => authContextStore.sessionContext?.tenant?.tenantId ?? '',
);
const canAssignTask = computed(() =>
  authContextStore.actionCodes.includes('collaboration.task.assign'),
);

const taskScopes: Array<{
  key: TaskScope;
  tone: 'amber' | 'blue' | 'slate';
  title: string;
}> = [
  {
    key: 'MY_TODO',
    title: '我的待办',
    tone: 'blue',
  },
  {
    key: 'ASSIGNED_TO_ME',
    title: '指派给我的',
    tone: 'amber',
  },
  {
    key: 'CREATED_BY_ME',
    title: '我分派的任务',
    tone: 'slate',
  },
];
const priorityOptions: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const scopeStates = reactive<Record<TaskScope, ScopeState>>({
  ASSIGNED_TO_ME: emptyScopeState(),
  CREATED_BY_ME: emptyScopeState(),
  MY_TODO: emptyScopeState(),
});
const scopeStatusViews = reactive<Record<TaskScope, ScopeStatusView>>({
  ASSIGNED_TO_ME: 'ALL',
  CREATED_BY_ME: 'ALL',
  MY_TODO: 'ALL',
});
const createForm = reactive<CreateTaskFormState>(emptyCreateForm());
const createDrawerOpen = ref(false);
const detailDrawerOpen = ref(false);
const selectedTask = ref<TaskView | null>(null);
const globalError = ref('');
const creating = ref(false);
const mutatingKey = ref('');
const pendingActionKind = ref<PendingActionKind | ''>('');
const pendingActionNote = ref('');
const assignableAccounts = ref<AssignableAccountOption[]>([]);
const accountOptionsById = reactive<Record<string, AssignableAccountOption>>({});
const assignableAccountLoading = ref(false);
const loadingAccountOptionIds = new Set<string>();
const createDrawerScope = ref<TaskScope>('MY_TODO');
const historyModalOpen = ref(false);
const historyState = reactive<HistoryState>(emptyHistoryState());
const creatorVisibleStatuses: TaskStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

const hasAnyPermissionError = computed(() =>
  Object.values(scopeStates).some((state) => isPermissionMessage(state.error)),
);
const createDrawerTitle = computed(() =>
  createForm.assignmentMode === 'ASSIGN' ? '新建指派任务' : '新建我的待办',
);
const historyModalTitle = computed(() => `${scopeTitle(historyState.scope)}历史`);
const historyModalZIndex = 2000;
const taskDetailDrawerZIndex = 2100;

/** emptyScopeState returns a neutral list state for one workbench task block. */
function emptyScopeState(): ScopeState {
  return {
    error: '',
    items: [],
    loaded: false,
    loading: false,
    refreshing: false,
    total: 0,
  };
}

/** emptyCreateForm creates the default self-todo form for the workbench drawer. */
function emptyCreateForm(): CreateTaskFormState {
  return {
    assigneeAccountId: '',
    assignmentMode: 'SELF',
    description: '',
    dueAt: '',
    priority: 'NORMAL',
    title: '',
  };
}

/** emptyHistoryState returns the neutral modal state used before a scope history query runs. */
function emptyHistoryState(): HistoryState {
  return {
    error: '',
    items: [],
    loading: false,
    scope: 'MY_TODO',
    total: 0,
  };
}

/** refreshWorkbenchTasks loads every P1 task scope used by the login workbench. */
async function refreshWorkbenchTasks() {
  if (!activeTenantId.value) return;
  globalError.value = '';
  rememberCurrentAccountOption();
  await Promise.all(taskScopes.map((scope) => loadScopeTasks(scope.key)));
}

/** loadScopeTasks loads the default workbench slice for one P1 task scope. */
async function loadScopeTasks(scope: TaskScope) {
  const state = scopeStates[scope];
  const isInitialLoad = !state.loaded;
  state.loading = isInitialLoad;
  state.refreshing = !isInitialLoad;
  state.error = '';
  try {
    const result = await listCollaborationTasksApi(activeTenantId.value, {
      scope,
      includeArchived: false,
      overdueOnly: false,
      page: 1,
      pageSize: 5,
      status: statusFilterForScope(scope),
    });
    state.items = result.items ?? [];
    state.total = result.total ?? state.items.length;
    rememberTaskParticipantLabels(state.items);
    await hydrateTaskParticipantLabels(state.items);
  } catch (error: any) {
    if (isInitialLoad) {
      state.items = [];
      state.total = 0;
    }
    state.error = resolveTaskError(error);
  } finally {
    state.loaded = true;
    state.loading = false;
    state.refreshing = false;
  }
}

/** handleScopeStatusViewChange changes one block status lens and refreshes only that block. */
async function handleScopeStatusViewChange(scope: TaskScope, value: string | number) {
  const nextView = normalizeStatusView(value);
  if (!nextView || scopeStatusViews[scope] === nextView) return;
  scopeStatusViews[scope] = nextView;
  await loadScopeTasks(scope);
}

/** statusFilterForScope maps the current workbench view to the Task query status filter. */
function statusFilterForScope(scope: TaskScope): TaskStatus[] | undefined {
  const selectedView = scopeStatusViews[scope];
  if (selectedView !== 'ALL') return [selectedView];
  return scope === 'CREATED_BY_ME' ? creatorVisibleStatuses : undefined;
}

/** statusViewOptions returns compact status lenses that match each Task block's operator perspective. */
function statusViewOptions(scope: TaskScope) {
  const activeOptions = [
    { label: '全部', value: 'ALL' },
    { label: '待处理', value: 'OPEN' },
    { label: '进行中', value: 'IN_PROGRESS' },
  ];
  if (scope !== 'CREATED_BY_ME') return activeOptions;
  return [
    ...activeOptions,
    { label: '已完成', value: 'COMPLETED' },
    { label: '已取消', value: 'CANCELLED' },
  ];
}

/** normalizeStatusView accepts only frozen Task P1 statuses and the local aggregate view. */
function normalizeStatusView(value: string | number): ScopeStatusView | undefined {
  const normalized = String(value);
  if (
    normalized === 'ALL' ||
    normalized === 'OPEN' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'COMPLETED' ||
    normalized === 'CANCELLED'
  ) {
    return normalized;
  }
  return undefined;
}

/** openCreateDrawer resets task creation state for the requested workbench scope. */
function openCreateDrawer(scope: TaskScope = 'MY_TODO') {
  Object.assign(createForm, emptyCreateForm());
  createDrawerScope.value = scope;
  if (scope !== 'MY_TODO' && canAssignTask.value) {
    createForm.assignmentMode = 'ASSIGN';
  }
  globalError.value = '';
  createDrawerOpen.value = true;
  if (createForm.assignmentMode === 'ASSIGN') {
    loadAssignableAccounts();
  }
}

/** handleScopeMenuClick routes one Task block dropdown command. */
function handleScopeMenuClick(scope: TaskScope, actionKey: string) {
  if (actionKey === 'create') {
    openCreateDrawer(scope);
    return;
  }
  if (actionKey === 'history') {
    openHistoryModal(scope);
  }
}

/** openHistoryModal loads completed and cancelled tasks for the selected workbench scope. */
async function openHistoryModal(scope: TaskScope) {
  historyState.scope = scope;
  historyState.error = '';
  historyState.items = [];
  historyState.total = 0;
  historyModalOpen.value = true;
  await loadHistoryTasks(scope);
}

/** loadHistoryTasks queries terminal Task P1 records without changing active block counts. */
async function loadHistoryTasks(scope: TaskScope) {
  if (!activeTenantId.value) return;
  historyState.loading = true;
  historyState.error = '';
  try {
    const result = await listCollaborationTasksApi(activeTenantId.value, {
      scope,
      includeArchived: true,
      overdueOnly: false,
      page: 1,
      pageSize: 20,
      status: ['COMPLETED', 'CANCELLED'],
    });
    historyState.items = result.items ?? [];
    historyState.total = result.total ?? historyState.items.length;
    rememberTaskParticipantLabels(historyState.items);
    await hydrateTaskParticipantLabels(historyState.items);
  } catch (error: any) {
    historyState.items = [];
    historyState.total = 0;
    historyState.error = resolveTaskError(error);
  } finally {
    historyState.loading = false;
  }
}

/** handleAssignmentModeChange loads account options when the drawer switches to assignment mode. */
function handleAssignmentModeChange(value: string | number) {
  createForm.assignmentMode = value === 'ASSIGN' ? 'ASSIGN' : 'SELF';
  if (createForm.assignmentMode === 'ASSIGN') {
    loadAssignableAccounts();
  } else {
    createForm.assigneeAccountId = '';
  }
}

/** openTaskDetail opens one task as an actionable workbench drawer record. */
function openTaskDetail(task: TaskView) {
  rememberCurrentAccountOption();
  rememberTaskParticipantLabels([task]);
  hydrateTaskParticipantLabels([task]);
  selectedTask.value = task;
  pendingActionKind.value = '';
  pendingActionNote.value = '';
  globalError.value = '';
  detailDrawerOpen.value = true;
}

/** submitCreateTask sends the P1 create command through the Gateway BFF. */
async function submitCreateTask() {
  if (!activeTenantId.value || !createForm.title.trim()) return;
  if (createForm.assignmentMode === 'ASSIGN' && !canAssignTask.value) {
    globalError.value = '当前账号不能指派给他人';
    return;
  }

  creating.value = true;
  globalError.value = '';
  try {
    const result = await createCollaborationTaskApi(activeTenantId.value, {
      assigneeAccountId:
        createForm.assignmentMode === 'ASSIGN'
          ? normalize(createForm.assigneeAccountId)
          : undefined,
      description: normalize(createForm.description),
      dueAt: normalize(createForm.dueAt),
      priority: createForm.priority,
      title: createForm.title.trim(),
    });
    message.success('任务已创建');
    createDrawerOpen.value = false;
    if (result.task) openTaskDetail(result.task);
    await refreshWorkbenchTasks();
  } catch (error: any) {
    globalError.value = resolveTaskError(error);
  } finally {
    creating.value = false;
  }
}

/** loadAssignableAccounts searches enabled tenant accounts for assignment selection. */
async function loadAssignableAccounts(keyword = '') {
  if (!activeTenantId.value || !canAssignTask.value) return;
  assignableAccountLoading.value = true;
  try {
    const result = await listAdminAccountsApi({
      keyword: normalize(keyword),
      page: 1,
      pageSize: 20,
      scopeLevel: 'TENANT',
      status: 'ENABLED',
      tenantId: activeTenantId.value,
    });
    assignableAccounts.value = (result.items ?? [])
      .map(toAssignableAccountOption)
      .filter((account) => account.accountId !== currentAccountId());
    rememberAssignableAccounts(assignableAccounts.value);
  } catch (error: any) {
    globalError.value = resolveTaskError(error);
    assignableAccounts.value = [];
  } finally {
    assignableAccountLoading.value = false;
  }
}

/** toAssignableAccountOption turns account directory rows into selector options. */
function toAssignableAccountOption(
  account: AdminSecurityApi.AccountDirectoryItem,
): AssignableAccountOption {
  const label =
    account.accountDisplayName ||
    account.userDisplayName ||
    account.accountId;
  const subtitle = [account.userDisplayName, account.tenantName]
    .filter(Boolean)
    .join(' / ');
  return {
    accountId: account.accountId,
    label,
    subtitle,
  };
}

/** currentAccountId returns the active operator account so assignment choices can exclude self. */
function currentAccountId() {
  return authContextStore.sessionContext?.account?.accountId ?? '';
}

/** rememberAssignableAccounts keeps account labels available after a selector search closes. */
function rememberAssignableAccounts(accounts: AssignableAccountOption[]) {
  for (const account of accounts) {
    accountOptionsById[account.accountId] = account;
  }
}

/** rememberTaskParticipantLabels stores BFF-hydrated task participant names for drawer display. */
function rememberTaskParticipantLabels(tasks: TaskView[]) {
  for (const task of tasks) {
    rememberTaskParticipantLabel(task.createdByAccountId, task.createdByDisplayName);
    rememberTaskParticipantLabel(task.assigneeAccountId, task.assigneeDisplayName);
  }
}

/** rememberTaskParticipantLabel stores one display-only participant label when the BFF provides it. */
function rememberTaskParticipantLabel(accountId?: string, displayName?: string) {
  const normalizedAccountId = normalize(accountId);
  const normalizedDisplayName = normalize(displayName);
  if (!normalizedAccountId || !normalizedDisplayName) return;
  accountOptionsById[normalizedAccountId] = {
    accountId: normalizedAccountId,
    label: normalizedDisplayName,
    subtitle: '',
  };
}

/** rememberCurrentAccountOption seeds the member label cache from the active login context. */
function rememberCurrentAccountOption() {
  const account = authContextStore.sessionContext?.account;
  if (!account?.accountId) return;
  accountOptionsById[account.accountId] = {
    accountId: account.accountId,
    label:
      account.name ||
      authContextStore.sessionContext?.operator?.displayName ||
      '当前账号',
    subtitle: authContextStore.sessionContext?.tenant?.name ?? '',
  };
}

/** hydrateTaskParticipantLabels resolves visible task participants without changing Task contracts. */
async function hydrateTaskParticipantLabels(tasks: TaskView[]) {
  rememberCurrentAccountOption();
  if (!canAssignTask.value || tasks.length === 0) return;

  const accountIds = [
    ...new Set(
      tasks
        .flatMap((task) => [task.createdByAccountId, task.assigneeAccountId])
        .map(normalize)
        .filter(Boolean),
    ),
  ] as string[];
  await Promise.all(accountIds.map(loadAccountOptionById));
}

/** loadAccountOptionById fetches one tenant account label through the existing account directory boundary. */
async function loadAccountOptionById(accountId: string) {
  if (accountOptionsById[accountId] || loadingAccountOptionIds.has(accountId)) {
    return;
  }

  loadingAccountOptionIds.add(accountId);
  try {
    const result = await listAdminAccountsApi({
      keyword: accountId,
      page: 1,
      pageSize: 1,
      scopeLevel: 'TENANT',
      status: 'ENABLED',
      tenantId: activeTenantId.value,
    });
    const matchedAccount = (result.items ?? []).find(
      (account) => account.accountId === accountId,
    );
    if (matchedAccount) {
      rememberAssignableAccounts([toAssignableAccountOption(matchedAccount)]);
    }
  } catch {
    // Optional label hydration must not block the task command/query workflow.
  } finally {
    loadingAccountOptionIds.delete(accountId);
  }
}

/** accountDisplayName returns a member-facing label without exposing raw account ids in drawers. */
function accountDisplayName(accountId?: string) {
  if (!accountId) return '-';
  return accountOptionsById[accountId]?.label ?? '未加载成员信息';
}

/** accountDisplaySubtitle returns optional secondary member context for compact person fields. */
function accountDisplaySubtitle(accountId?: string) {
  if (!accountId) return '';
  return accountOptionsById[accountId]?.subtitle ?? '';
}

/** taskParticipantLabel returns the compact participant cue shown on non-self task rows. */
function taskParticipantLabel(task: TaskView, scope: TaskScope) {
  if (scope === 'CREATED_BY_ME') {
    const assigneeName = participantDisplayName(
      task.assigneeAccountId,
      task.assigneeDisplayName,
    );
    return assigneeName ? `委派给 ${assigneeName}` : '';
  }
  if (scope === 'ASSIGNED_TO_ME') {
    const creatorName = participantDisplayName(
      task.createdByAccountId,
      task.createdByDisplayName,
    );
    return creatorName ? `来自 ${creatorName}` : '';
  }
  return '';
}

/** participantDisplayName resolves one task row label without falling back to raw account ids. */
function participantDisplayName(accountId?: string, displayName?: string) {
  const hydratedName = normalize(displayName);
  if (hydratedName) return hydratedName;
  const cachedName = accountOptionsById[accountId ?? '']?.label;
  return cachedName && cachedName !== '未加载成员信息' ? cachedName : '';
}

/** runDirectTaskCommand executes P1 commands that do not need a command note. */
async function runDirectTaskCommand(kind: 'archive' | 'start' | 'unarchive') {
  if (!activeTenantId.value || !selectedTask.value) return;
  const taskId = selectedTask.value.taskId;
  mutatingKey.value = `${kind}:${taskId}`;
  globalError.value = '';
  try {
    const result =
      kind === 'start'
        ? await startCollaborationTaskApi(activeTenantId.value, taskId)
        : kind === 'archive'
          ? await archiveCollaborationTaskApi(activeTenantId.value, taskId)
          : await unarchiveCollaborationTaskApi(activeTenantId.value, taskId);
    selectedTask.value = result.task ?? selectedTask.value;
    message.success('任务状态已更新');
    await refreshWorkbenchTasks();
  } catch (error: any) {
    globalError.value = resolveTaskError(error);
  } finally {
    mutatingKey.value = '';
  }
}

/** preparePendingAction opens the inline command note area for audited actions. */
function preparePendingAction(kind: PendingActionKind) {
  pendingActionKind.value = kind;
  pendingActionNote.value = '';
}

/** submitPendingAction sends complete, cancel, or reopen with optional audit text. */
async function submitPendingAction() {
  if (!activeTenantId.value || !selectedTask.value || !pendingActionKind.value) {
    return;
  }

  const taskId = selectedTask.value.taskId;
  const kind = pendingActionKind.value;
  mutatingKey.value = `${kind}:${taskId}`;
  globalError.value = '';
  try {
    const result =
      kind === 'complete'
        ? await completeCollaborationTaskApi(activeTenantId.value, taskId, {
            completionNote: normalize(pendingActionNote.value),
          })
        : kind === 'cancel'
          ? await cancelCollaborationTaskApi(activeTenantId.value, taskId, {
              cancelReason: normalize(pendingActionNote.value),
            })
          : await reopenCollaborationTaskApi(activeTenantId.value, taskId, {
              reopenReason: normalize(pendingActionNote.value),
            });
    selectedTask.value = result.task ?? selectedTask.value;
    pendingActionKind.value = '';
    pendingActionNote.value = '';
    message.success('任务状态已更新');
    await refreshWorkbenchTasks();
  } catch (error: any) {
    globalError.value = resolveTaskError(error);
  } finally {
    mutatingKey.value = '';
  }
}

/** normalize trims optional form text and omits empty values from commands. */
function normalize(value: null | string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

/** resolveTaskError converts gateway failures into concise workbench copy. */
function resolveTaskError(error: any) {
  const raw = `${error?.response?.data?.message ?? error?.message ?? ''}`;
  if (isPermissionMessage(raw)) return '权限不足，当前账号不能访问或操作协同任务';
  return raw || '协同任务暂时不可用，请稍后重试';
}

/** isPermissionMessage detects BFF and service permission failures. */
function isPermissionMessage(message: string) {
  return /permission|forbidden|denied|PERMISSION|UNAUTHORIZED|权限/i.test(
    message,
  );
}

/** statusLabel maps frozen P1 statuses to workbench labels. */
function statusLabel(status: string) {
  const labels: Record<TaskStatus, string> = {
    CANCELLED: '已取消',
    COMPLETED: '已完成',
    IN_PROGRESS: '进行中',
    OPEN: '待处理',
  };
  return labels[status as TaskStatus] ?? status;
}

/** statusColor maps task statuses to Ant Design tag tones. */
function statusColor(status: string) {
  if (status === 'IN_PROGRESS') return 'cyan';
  if (status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'default';
  return 'blue';
}

/** statusTagClass provides stable visual hooks for status-specific workbench tags. */
function statusTagClass(status: string) {
  const classes: Record<TaskStatus, string> = {
    CANCELLED: 'task-status-tag--cancelled',
    COMPLETED: 'task-status-tag--completed',
    IN_PROGRESS: 'task-status-tag--in-progress',
    OPEN: 'task-status-tag--open',
  };
  return ['task-status-tag', classes[status as TaskStatus]].filter(Boolean);
}

/** priorityLabel maps frozen P1 priorities to workbench labels. */
function priorityLabel(priority: string) {
  const labels: Record<TaskPriority, string> = {
    HIGH: '高',
    LOW: '低',
    NORMAL: '普通',
    URGENT: '紧急',
  };
  return labels[priority as TaskPriority] ?? priority;
}

/** priorityColor maps priority values to restrained enterprise tags. */
function priorityColor(priority: string) {
  if (priority === 'URGENT') return 'red';
  if (priority === 'HIGH') return 'orange';
  if (priority === 'LOW') return 'default';
  return 'green';
}

/** priorityTagClass provides stable visual hooks for priority-specific workbench tags. */
function priorityTagClass(priority: string) {
  const classes: Record<TaskPriority, string> = {
    HIGH: 'task-priority-tag--high',
    LOW: 'task-priority-tag--low',
    NORMAL: 'task-priority-tag--normal',
    URGENT: 'task-priority-tag--urgent',
  };
  return ['task-priority-tag', classes[priority as TaskPriority]].filter(Boolean);
}

/** scopeToneClass returns the quiet accent style for one task block. */
function scopeToneClass(tone: 'amber' | 'blue' | 'slate') {
  return `task-scope-block--${tone}`;
}

/** scopeTitle returns the workbench label for one Task P1 scope. */
function scopeTitle(scope: TaskScope) {
  return taskScopes.find((candidate) => candidate.key === scope)?.title ?? scope;
}

/** formatDateTime renders compact dates for task cards and drawers. */
function formatDateTime(value?: string) {
  if (!value) return '未设置';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  });
}

/** formatTaskDuration renders terminal-task elapsed time from creation to completion or cancellation. */
function formatTaskDuration(task: TaskView) {
  const start = new Date(task.createdAt);
  const endValue = task.completedAt || task.cancelledAt;
  const end = endValue ? new Date(endValue) : null;
  if (Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return '未记录';
  }
  const totalMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [
    days ? `${days}天` : '',
    hours ? `${hours}小时` : '',
    minutes ? `${minutes}分钟` : '',
  ].filter(Boolean);
  return parts.join('') || '少于1分钟';
}

onMounted(refreshWorkbenchTasks);
</script>

<template>
  <section
    class="task-workbench-section"
    :class="{ 'task-workbench-section--dark': isDark }"
    data-testid="task-workbench-section"
  >
    <Alert
      v-if="!activeTenantId"
      class="task-workbench-alert"
      message="缺少租户上下文，无法加载协同任务"
      show-icon
      type="warning"
    />
    <Alert
      v-else-if="hasAnyPermissionError"
      class="task-workbench-alert"
      message="当前账号没有访问协同任务的权限"
      show-icon
      type="warning"
    />
    <Alert
      v-if="globalError"
      class="task-workbench-alert"
      :message="globalError"
      show-icon
      type="error"
      closable
      @close="globalError = ''"
    />
    <div class="task-scope-grid">
      <article
        v-for="scope in taskScopes"
        :key="scope.key"
        class="task-scope-block"
        :class="scopeToneClass(scope.tone)"
        :data-testid="`task-scope-${scope.key}`"
      >
        <header class="task-scope-block__header">
          <div class="task-scope-block__header-main">
            <div class="task-scope-block__header-top">
              <div class="task-scope-block__title">
                <h2>{{ scope.title }}</h2>
                <span>{{ scopeStates[scope.key].total }}</span>
              </div>
              <Dropdown trigger="click">
                <Button
                  class="task-scope-block__add"
                  :data-testid="`task-scope-menu-${scope.key}`"
                  shape="circle"
                  size="small"
                  title="任务操作"
                >
                  <template #icon>
                    <IconifyIcon icon="lucide:more-horizontal" />
                  </template>
                </Button>
                <template #overlay>
                  <Menu @click="(info) => handleScopeMenuClick(scope.key, String(info.key))">
                    <Menu.Item
                      v-if="scope.key !== 'ASSIGNED_TO_ME'"
                      key="create"
                      :data-menu-key="'create'"
                      :data-testid="`task-create-open-${scope.key}`"
                      :disabled="scope.key === 'CREATED_BY_ME' && !canAssignTask"
                    >
                      添加
                    </Menu.Item>
                    <Menu.Item
                      key="history"
                      :data-menu-key="'history'"
                      :data-testid="`task-history-open-${scope.key}`"
                    >
                      查看历史
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </div>
            <div
              class="task-scope-block__status-tabs"
              :data-testid="`task-status-view-${scope.key}`"
            >
              <Segmented
                :options="statusViewOptions(scope.key)"
                size="small"
                :value="scopeStatusViews[scope.key]"
                @change="(value) => handleScopeStatusViewChange(scope.key, value)"
              />
            </div>
          </div>
        </header>

        <div
          class="task-scope-block__body"
          :class="{
            'task-scope-block__body--refreshing': scopeStates[scope.key].refreshing,
          }"
          :aria-busy="scopeStates[scope.key].loading || scopeStates[scope.key].refreshing"
        >
          <Skeleton
            v-if="scopeStates[scope.key].loading"
            active
            :paragraph="{ rows: 3 }"
          />
          <Alert
            v-else-if="scopeStates[scope.key].error"
            :message="scopeStates[scope.key].error"
            show-icon
            type="error"
          />
          <Empty
            v-else-if="scopeStates[scope.key].items.length === 0"
            class="task-scope-block__empty"
            description="暂无任务"
          />
          <div v-else class="task-card-list">
            <button
              v-for="task in scopeStates[scope.key].items"
              :key="task.taskId"
              class="task-card-row"
              :class="{ 'task-card-row--overdue': task.overdue }"
              type="button"
              @click="openTaskDetail(task)"
            >
              <span class="task-card-row__main">
                <strong>{{ task.title }}</strong>
                <small>{{ task.description || '无说明' }}</small>
              </span>
              <span class="task-card-row__meta">
                <Tag
                  :class="statusTagClass(task.status)"
                  :color="statusColor(task.status)"
                >
                  {{ statusLabel(task.status) }}
                </Tag>
                <Tag
                  :class="priorityTagClass(task.priority)"
                  :color="priorityColor(task.priority)"
                >
                  {{ priorityLabel(task.priority) }}
                </Tag>
                <small
                  v-if="taskParticipantLabel(task, scope.key)"
                  class="task-card-row__participant"
                >
                  {{ taskParticipantLabel(task, scope.key) }}
                </small>
                <small>{{ formatDateTime(task.dueAt) }}</small>
              </span>
            </button>
          </div>
        </div>
      </article>
    </div>

    <Drawer
      v-model:open="createDrawerOpen"
      :title="createDrawerTitle"
      width="520"
    >
      <div class="task-drawer-form">
        <label class="task-field">
          <span>任务类型</span>
          <Segmented
            v-model:value="createForm.assignmentMode"
            :options="[
              { label: '我的待办', value: 'SELF' },
              {
                disabled: !canAssignTask,
                label: '指派给他人',
                value: 'ASSIGN',
              },
            ]"
            @change="handleAssignmentModeChange"
          />
          <small v-if="!canAssignTask">当前账号不能指派给他人</small>
        </label>
        <label class="task-field">
          <span>标题</span>
          <Input
            v-model:value="createForm.title"
            data-testid="task-title-input"
            placeholder="例如：复核今日交接事项"
          />
        </label>
        <label
          v-if="createForm.assignmentMode === 'ASSIGN' && canAssignTask"
          class="task-field"
        >
          <span>处理人</span>
          <Select
            v-model:value="createForm.assigneeAccountId"
            allow-clear
            class="task-assignee-select"
            data-testid="task-assignee-input"
            :dropdown-match-select-width="false"
            :filter-option="false"
            :loading="assignableAccountLoading"
            not-found-content="输入姓名或账号搜索"
            option-label-prop="label"
            placeholder="搜索账号或成员"
            show-search
            @focus="() => loadAssignableAccounts()"
            @search="loadAssignableAccounts"
          >
            <SelectOption
              v-for="account in assignableAccounts"
              :key="account.accountId"
              :label="account.label"
              :value="account.accountId"
            >
              <span class="task-account-option">
                <strong>{{ account.label }}</strong>
              </span>
            </SelectOption>
          </Select>
        </label>
        <label class="task-field">
          <span>优先级</span>
          <Select v-model:value="createForm.priority">
            <SelectOption
              v-for="priority in priorityOptions"
              :key="priority"
              :value="priority"
            >
              {{ priorityLabel(priority) }}
            </SelectOption>
          </Select>
        </label>
        <label class="task-field">
          <span>到期时间</span>
          <DatePicker
            v-model:value="createForm.dueAt"
            class="task-due-at-picker"
            data-testid="task-due-at-input"
            format="YYYY-MM-DD HH:mm"
            placeholder="选择到期日期时间"
            :show-time="{ format: 'HH:mm' }"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
          />
        </label>
        <label class="task-field">
          <span>说明</span>
          <Textarea
            v-model:value="createForm.description"
            data-testid="task-description-input"
            :rows="4"
            placeholder="纯文本说明"
          />
        </label>
        <div class="task-drawer-actions">
          <Button @click="createDrawerOpen = false">取消</Button>
          <Button
            data-testid="task-create-submit"
            :disabled="!createForm.title.trim()"
            :loading="creating"
            type="primary"
            @click="submitCreateTask"
          >
            创建
          </Button>
        </div>
      </div>
    </Drawer>

    <Modal
      v-model:open="historyModalOpen"
      :footer="null"
      :title="historyModalTitle"
      width="var(--task-history-modal-width)"
      wrap-class-name="task-history-modal"
      :z-index="historyModalZIndex"
    >
      <section class="task-history-panel">
        <Skeleton
          v-if="historyState.loading"
          active
          :paragraph="{ rows: 4 }"
        />
        <Alert
          v-else-if="historyState.error"
          :message="historyState.error"
          show-icon
          type="error"
        />
        <Empty
          v-else-if="historyState.items.length === 0"
          description="暂无历史任务"
        />
        <div v-else class="task-history-list">
          <button
            v-for="task in historyState.items"
            :key="task.taskId"
            class="task-history-row"
            type="button"
            @click="openTaskDetail(task)"
          >
            <span class="task-history-row__main">
              <strong>{{ task.title }}</strong>
              <small>{{ task.description || '无说明' }}</small>
            </span>
            <span class="task-history-row__meta">
              <Tag
                :class="statusTagClass(task.status)"
                :color="statusColor(task.status)"
              >
                {{ statusLabel(task.status) }}
              </Tag>
              <small>花费 {{ formatTaskDuration(task) }}</small>
              <small>{{ formatDateTime(task.completedAt || task.cancelledAt) }}</small>
            </span>
          </button>
        </div>
      </section>
    </Modal>

    <Drawer
      v-model:open="detailDrawerOpen"
      title="任务详情"
      width="560"
      :z-index="taskDetailDrawerZIndex"
      @close="pendingActionKind = ''"
    >
      <section v-if="selectedTask" class="task-detail-panel">
        <header class="task-detail-panel__header">
          <div>
            <h3>{{ selectedTask.title }}</h3>
            <p>{{ selectedTask.description || '无说明' }}</p>
          </div>
          <Tag v-if="selectedTask.archivedAt">已归档</Tag>
        </header>

        <dl class="task-detail-grid">
          <div>
            <dt>状态</dt>
            <dd>
              <Tag
                :class="statusTagClass(selectedTask.status)"
                :color="statusColor(selectedTask.status)"
              >
                {{ statusLabel(selectedTask.status) }}
              </Tag>
            </dd>
          </div>
          <div>
            <dt>优先级</dt>
            <dd>
              <Tag
                :class="priorityTagClass(selectedTask.priority)"
                :color="priorityColor(selectedTask.priority)"
              >
                {{ priorityLabel(selectedTask.priority) }}
              </Tag>
            </dd>
          </div>
          <div>
            <dt>到期</dt>
            <dd :class="{ 'task-detail-overdue': selectedTask.overdue }">
              {{ formatDateTime(selectedTask.dueAt) }}
            </dd>
          </div>
          <div>
            <dt>创建人</dt>
            <dd>
              <span class="task-person-chip">
                <strong>{{ accountDisplayName(selectedTask.createdByAccountId) }}</strong>
                <small v-if="accountDisplaySubtitle(selectedTask.createdByAccountId)">
                  {{ accountDisplaySubtitle(selectedTask.createdByAccountId) }}
                </small>
              </span>
            </dd>
          </div>
          <div>
            <dt>处理人</dt>
            <dd>
              <span class="task-person-chip">
                <strong>{{ accountDisplayName(selectedTask.assigneeAccountId) }}</strong>
                <small v-if="accountDisplaySubtitle(selectedTask.assigneeAccountId)">
                  {{ accountDisplaySubtitle(selectedTask.assigneeAccountId) }}
                </small>
              </span>
            </dd>
          </div>
          <div>
            <dt>更新时间</dt>
            <dd>{{ formatDateTime(selectedTask.updatedAt) }}</dd>
          </div>
        </dl>

        <div class="task-command-bar">
          <Button
            v-if="!selectedTask.archivedAt && selectedTask.status === 'OPEN'"
            :loading="mutatingKey === `start:${selectedTask.taskId}`"
            @click="runDirectTaskCommand('start')"
          >
            开始
          </Button>
          <Button
            v-if="
              !selectedTask.archivedAt &&
              ['OPEN', 'IN_PROGRESS'].includes(`${selectedTask.status}`)
            "
            type="primary"
            @click="preparePendingAction('complete')"
          >
            完成
          </Button>
          <Button
            v-if="
              !selectedTask.archivedAt &&
              ['OPEN', 'IN_PROGRESS'].includes(`${selectedTask.status}`)
            "
            danger
            @click="preparePendingAction('cancel')"
          >
            取消
          </Button>
          <Button
            v-if="
              !selectedTask.archivedAt &&
              ['COMPLETED', 'CANCELLED'].includes(`${selectedTask.status}`)
            "
            @click="preparePendingAction('reopen')"
          >
            重开
          </Button>
          <Button
            v-if="
              !selectedTask.archivedAt &&
              ['COMPLETED', 'CANCELLED'].includes(`${selectedTask.status}`)
            "
            :loading="mutatingKey === `archive:${selectedTask.taskId}`"
            @click="runDirectTaskCommand('archive')"
          >
            归档
          </Button>
          <Button
            v-if="selectedTask.archivedAt"
            :loading="mutatingKey === `unarchive:${selectedTask.taskId}`"
            @click="runDirectTaskCommand('unarchive')"
          >
            恢复归档
          </Button>
        </div>

        <section v-if="pendingActionKind" class="task-command-note">
          <label class="task-field">
            <span>操作说明</span>
            <Textarea
              v-model:value="pendingActionNote"
              data-testid="task-action-note"
              :rows="3"
              placeholder="可选，作为命令审计摘要"
            />
          </label>
          <div class="task-drawer-actions">
            <Button @click="pendingActionKind = ''">取消</Button>
            <Button
              data-testid="task-action-submit"
              :loading="Boolean(mutatingKey)"
              type="primary"
              @click="submitPendingAction"
            >
              提交
            </Button>
          </div>
        </section>
      </section>
    </Drawer>
  </section>
</template>

<style scoped>
.task-workbench-section {
  --task-block-height: 432px;
  --task-row-height: 92px;
  display: grid;
  gap: 14px;
  min-width: 0;
  padding-bottom: 24px;
}

.task-workbench-alert {
  max-width: 760px;
}

:global(.task-history-modal) {
  --task-history-modal-width: min(560px, calc(100vw - 72px));
}

:global(.task-history-modal .ant-modal) {
  max-width: calc(100vw - 32px);
}

.task-scope-grid {
  align-items: stretch;
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
}

.task-scope-block {
  background: var(--ant-color-bg-container, #ffffff);
  border: 1px solid color-mix(in srgb, var(--ant-color-border, #dfe5ee) 82%, transparent);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  grid-template-rows: auto 1fr;
  height: var(--task-block-height);
  max-height: var(--task-block-height);
  min-height: var(--task-block-height);
  min-width: 0;
  overflow: hidden;
  padding: 14px;
  position: relative;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.task-scope-block:hover {
  border-color: color-mix(in srgb, var(--ant-color-primary, #2563eb) 36%, var(--ant-color-border, #dfe5ee));
  box-shadow: 0 14px 30px -24px rgba(15, 23, 42, 0.5);
}

.task-scope-block__header {
  display: block;
  min-height: 34px;
  min-width: 0;
}

.task-scope-block__header-main {
  align-content: start;
  display: grid;
  flex: 1 1 auto;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
}

.task-scope-block__header-top {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) auto;
  min-width: 0;
}

.task-scope-block__title {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 7px;
  min-width: 0;
}

.task-scope-block__header h2 {
  color: var(--ant-color-text, #172033);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-scope-block__title > span {
  align-items: center;
  background: var(--ant-color-bg-layout, #f8fafc);
  border: 1px solid var(--ant-color-border-secondary, #e2e8f0);
  border-radius: 999px;
  color: var(--ant-color-text-secondary, #64748b);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
  height: 22px;
  justify-content: center;
  min-width: 22px;
  padding: 0 6px;
}

.task-scope-block__add {
  align-items: center;
  color: var(--ant-color-text-secondary, #64748b);
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
}

.task-scope-block__add:hover {
  color: var(--ant-color-primary, #2563eb);
}

.task-scope-block__status-tabs {
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  width: 100%;
}

.task-scope-block__status-tabs::-webkit-scrollbar {
  display: none;
}

.task-scope-block__status-tabs :deep(.ant-segmented) {
  background: var(--ant-color-bg-layout, #f8fafc);
  border: 1px solid var(--ant-color-border-secondary, #e2e8f0);
  border-radius: 7px;
  max-width: 100%;
  width: max-content;
}

.task-scope-block__status-tabs :deep(.ant-segmented-item) {
  color: var(--ant-color-text-secondary, #64748b);
  font-size: 12px;
  line-height: 24px;
}

.task-scope-block__status-tabs :deep(.ant-segmented-item-selected) {
  color: var(--ant-color-text, #172033);
  font-weight: 650;
}

.task-scope-block__body {
  align-content: start;
  display: grid;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
  scrollbar-width: thin;
}

.task-scope-block__body::-webkit-scrollbar {
  width: 6px;
}

.task-scope-block__body::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--ant-color-text-tertiary, #94a3b8) 38%, transparent);
  border-radius: 999px;
}

.task-scope-block__body--refreshing .task-card-list,
.task-scope-block__body--refreshing .task-scope-block__empty {
  opacity: 0.76;
  transition: opacity 0.18s ease;
}

.task-scope-block__empty {
  align-self: start;
  padding-top: 44px;
}

.task-card-list {
  display: grid;
  gap: 8px;
  grid-auto-rows: var(--task-row-height);
  min-width: 0;
}

.task-card-row {
  background: var(--ant-color-bg-layout, #f8fafc);
  border: 1px solid color-mix(in srgb, var(--ant-color-border-secondary, #e2e8f0) 72%, transparent);
  border-radius: 8px;
  box-sizing: border-box;
  color: inherit;
  contain: layout paint;
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-rows: minmax(0, 1fr) auto;
  height: var(--task-row-height);
  max-height: var(--task-row-height);
  min-height: var(--task-row-height);
  min-width: 0;
  overflow: hidden;
  padding: 11px 12px;
  text-align: left;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.task-card-row:hover {
  background: var(--ant-color-bg-container, #ffffff);
  border-color: color-mix(in srgb, var(--ant-color-primary, #2563eb) 24%, var(--ant-color-border, #cbd5e1));
}

.task-card-row:active {
  transform: translateY(1px);
}

.task-card-row--overdue {
  border-color: #fecaca;
}

.task-card-row__main,
.task-card-row__meta {
  display: grid;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.task-card-row__main strong {
  color: var(--ant-color-text, #172033);
  font-size: 13.5px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-card-row__main small,
.task-card-row__meta small {
  color: var(--ant-color-text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-card-row__meta {
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  min-height: 24px;
}

.task-card-row__meta :deep(.ant-tag) {
  flex: 0 0 auto;
  line-height: 20px;
  margin-inline-end: 0;
  max-width: 76px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-status-tag {
  align-items: center;
  border-radius: 6px;
  display: inline-flex;
  font-weight: 700;
  gap: 5px;
}

.task-status-tag--in-progress {
  background: #ecfeff !important;
  border-color: #06b6d4 !important;
  color: #0e7490 !important;
}

.task-status-tag--in-progress::before {
  background: #0891b2;
  border-radius: 999px;
  box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.14);
  content: '';
  flex: 0 0 auto;
  height: 6px;
  width: 6px;
}

.task-status-tag--open {
  background: #eff6ff !important;
  border-color: #60a5fa !important;
  color: #1d4ed8 !important;
}

.task-workbench-section :deep(.ant-tag.task-priority-tag) {
  border-radius: 6px;
  font-weight: 700;
}

.task-workbench-section :deep(.ant-tag.task-priority-tag--urgent) {
  background: #fef2f2 !important;
  border-color: #f87171 !important;
  color: #b91c1c !important;
}

.task-workbench-section :deep(.ant-tag.task-priority-tag--high) {
  background: #fff7ed !important;
  border-color: #fb923c !important;
  color: #9a3412 !important;
}

.task-workbench-section :deep(.ant-tag.task-priority-tag--normal) {
  background: #f0fdf4 !important;
  border-color: #86efac !important;
  color: #166534 !important;
}

.task-workbench-section :deep(.ant-tag.task-priority-tag--low) {
  background: #f8fafc !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

.task-card-row__meta small {
  flex: 1 1 auto;
  min-width: 0;
  text-align: right;
}

.task-card-row__meta > small:last-child {
  flex: 0 0 auto;
}

.task-card-row__participant {
  color: var(--ant-color-text-tertiary, #8a97aa);
  flex: 1 1 auto;
  font-weight: 600;
  text-align: left;
}

.task-history-panel {
  max-height: min(620px, calc(100dvh - 180px));
  min-height: 180px;
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-width: thin;
}

.task-history-panel::-webkit-scrollbar {
  width: 6px;
}

.task-history-panel::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--ant-color-text-tertiary, #94a3b8) 38%, transparent);
  border-radius: 999px;
}

.task-history-list {
  display: grid;
  gap: 8px;
}

.task-history-row {
  align-items: center;
  background: var(--ant-color-bg-layout, #f8fafc);
  border: 1px solid var(--ant-color-border-secondary, #e2e8f0);
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  min-width: 0;
  padding: 10px 12px;
  text-align: left;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.task-history-row:hover {
  background: var(--ant-color-bg-container, #ffffff);
  border-color: color-mix(in srgb, var(--ant-color-primary, #2563eb) 24%, var(--ant-color-border, #cbd5e1));
}

.task-history-row:active {
  transform: translateY(1px);
}

.task-history-row__main {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.task-history-row__main strong,
.task-history-row__main small,
.task-history-row__meta small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-history-row__main strong {
  color: var(--ant-color-text, #172033);
  font-size: 13.5px;
  line-height: 1.35;
}

.task-history-row__main small,
.task-history-row__meta small {
  color: var(--ant-color-text-secondary, #64748b);
  font-size: 12px;
}

.task-history-row__meta {
  align-items: center;
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
  min-width: 0;
}

.task-history-row__meta :deep(.ant-tag) {
  margin-inline-end: 0;
}

.task-assignee-select {
  width: 100%;
}

.task-due-at-picker {
  width: 100%;
}

.task-assignee-select :deep(.ant-select-selector) {
  min-height: 36px;
}

.task-assignee-select :deep(.ant-select-selection-item) {
  font-weight: 600;
}

.task-account-option {
  display: grid;
  gap: 2px;
  line-height: 1.25;
}

.task-account-option strong {
  color: var(--ant-color-text, #111827);
  font-size: 13px;
  font-weight: 600;
}

.task-account-option small {
  color: var(--ant-color-text-secondary, #64748b);
  font-size: 12px;
}

.task-person-chip {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.task-person-chip strong {
  color: var(--ant-color-text, #172033);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
}

.task-person-chip small {
  color: var(--ant-color-text-secondary, #64748b);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-drawer-form,
.task-detail-panel,
.task-command-note {
  display: grid;
  gap: 14px;
}

.task-field {
  color: var(--ant-color-text, #334155);
  display: grid;
  gap: 6px;
  min-width: 0;
}

.task-field > span {
  color: var(--ant-color-text-secondary, #475569);
  font-size: 12px;
  font-weight: 600;
}

.task-field > small {
  color: #8a6d28;
}

.task-drawer-actions,
.task-command-bar {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.task-detail-panel__header {
  border-bottom: 1px solid var(--ant-color-border-secondary, #e2e8f0);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding-bottom: 14px;
}

.task-detail-panel__header h3 {
  color: var(--ant-color-text, #172033);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
}

.task-detail-panel__header p {
  color: var(--ant-color-text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.6;
  margin: 6px 0 0;
}

.task-detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.task-detail-grid div {
  border-bottom: 1px solid var(--ant-color-border-secondary, #edf2f7);
  display: grid;
  gap: 4px;
  padding-bottom: 8px;
}

.task-detail-grid dt {
  color: var(--ant-color-text-secondary, #64748b);
  font-size: 12px;
}

.task-detail-grid dd {
  color: var(--ant-color-text, #172033);
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

.task-detail-overdue {
  color: #b42318 !important;
}

.task-command-note {
  background: var(--ant-color-bg-layout, #f8fafc);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

@media (max-width: 1100px) {
  :global(.task-history-modal) {
    --task-history-modal-width: min(520px, calc(100vw - 48px));
  }

  .task-workbench-section {
    --task-block-height: 338px;
  }

  .task-scope-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  :global(.task-history-modal) {
    --task-history-modal-width: calc(100vw - 24px);
  }

  .task-history-panel {
    max-height: calc(100dvh - 156px);
  }

  .task-history-row {
    align-items: start;
    grid-template-columns: minmax(0, 1fr);
  }

  .task-history-row__meta {
    flex-wrap: wrap;
  }

  .task-detail-panel__header {
    align-items: stretch;
    flex-direction: column;
  }

  .task-command-bar,
  .task-drawer-actions {
    justify-content: flex-start;
  }

  .task-detail-grid {
    grid-template-columns: 1fr;
  }
}

:global(html.dark) .task-card-row__main small,
:global(html.dark) .task-card-row__meta small,
.task-workbench-section--dark .task-card-row__main small,
.task-workbench-section--dark .task-card-row__meta small {
  color: #9ca8ba;
}

:global(html.dark) .task-scope-block,
.task-workbench-section--dark .task-scope-block {
  background: #111827;
  border-color: rgb(71 85 105 / 0.78);
  box-shadow:
    0 18px 36px -30px rgb(0 0 0 / 0.78),
    inset 0 1px 0 rgb(255 255 255 / 0.04);
}

:global(html.dark) .task-scope-block:hover,
.task-workbench-section--dark .task-scope-block:hover {
  border-color: rgb(96 165 250 / 0.48);
  box-shadow:
    0 22px 44px -32px rgb(0 0 0 / 0.88),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
  transform: translateY(-1px);
}

:global(html.dark) .task-scope-block__header h2,
:global(html.dark) .task-card-row__main strong,
.task-workbench-section--dark .task-scope-block__header h2,
.task-workbench-section--dark .task-card-row__main strong {
  color: #f8fafc;
}

:global(html.dark) .task-scope-block__title > span,
.task-workbench-section--dark .task-scope-block__title > span {
  background: #172033;
  border-color: rgb(96 165 250 / 0.24);
  color: #bfdbfe;
}

:global(html.dark) .task-scope-block__add,
.task-workbench-section--dark .task-scope-block__add {
  background: #172033;
  border-color: rgb(71 85 105 / 0.74);
  color: #cbd5e1;
}

:global(html.dark) .task-scope-block__add:hover,
.task-workbench-section--dark .task-scope-block__add:hover {
  background: #1f2a44;
  border-color: rgb(96 165 250 / 0.46);
  color: #dbeafe;
}

:global(html.dark) .task-scope-block__status-tabs :deep(.ant-segmented),
.task-workbench-section--dark .task-scope-block__status-tabs :deep(.ant-segmented) {
  background: #172033;
  border-color: rgb(71 85 105 / 0.72);
}

:global(html.dark) .task-scope-block__status-tabs :deep(.ant-segmented-thumb),
.task-workbench-section--dark .task-scope-block__status-tabs :deep(.ant-segmented-thumb) {
  background: #1e3a5f;
  box-shadow:
    0 8px 18px -12px rgb(0 0 0 / 0.72),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
}

:global(html.dark) .task-scope-block__status-tabs :deep(.ant-segmented-item),
.task-workbench-section--dark .task-scope-block__status-tabs :deep(.ant-segmented-item) {
  color: #9ca8ba;
}

:global(html.dark) .task-scope-block__status-tabs :deep(.ant-segmented-item-label),
.task-workbench-section--dark .task-scope-block__status-tabs :deep(.ant-segmented-item-label) {
  color: inherit;
}

:global(html.dark) .task-scope-block__status-tabs :deep(.ant-segmented-item-selected),
.task-workbench-section--dark .task-scope-block__status-tabs :deep(.ant-segmented-item-selected) {
  background: #1e3a5f;
  color: #eff6ff;
}

:global(html.dark) .task-card-row,
.task-workbench-section--dark .task-card-row {
  background: #172033;
  border-color: rgb(71 85 105 / 0.7);
}

:global(html.dark) .task-card-row:hover,
.task-workbench-section--dark .task-card-row:hover {
  background: #1f2a44;
  border-color: rgb(96 165 250 / 0.42);
  transform: translateY(-1px);
}

:global(html.dark) .task-card-row__participant,
.task-workbench-section--dark .task-card-row__participant {
  color: #93a4ba;
}

:global(html.dark) .task-card-row--overdue,
.task-workbench-section--dark .task-card-row--overdue {
  border-color: rgb(248 113 113 / 0.58);
}

:global(html.dark) .task-card-row__meta :deep(.ant-tag),
.task-workbench-section--dark .task-card-row__meta :deep(.ant-tag) {
  background: rgb(30 41 59 / 0.76) !important;
  border-color: rgb(100 116 139 / 0.64) !important;
  color: #cbd5e1 !important;
}

:global(html.dark) .task-status-tag--open,
.task-workbench-section--dark .task-status-tag--open {
  background: rgb(37 99 235 / 0.18) !important;
  border-color: rgb(96 165 250 / 0.62) !important;
  color: #bfdbfe !important;
}

:global(html.dark) .task-status-tag--in-progress,
.task-workbench-section--dark .task-status-tag--in-progress {
  background: rgb(14 116 144 / 0.22) !important;
  border-color: rgb(34 211 238 / 0.54) !important;
  color: #a5f3fc !important;
}

:global(html.dark) .task-workbench-section :deep(.ant-tag.task-priority-tag--urgent),
.task-workbench-section--dark :deep(.ant-tag.task-priority-tag--urgent) {
  background: rgb(153 27 27 / 0.3) !important;
  border-color: rgb(248 113 113 / 0.66) !important;
  color: #fecaca !important;
}

:global(html.dark) .task-workbench-section :deep(.ant-tag.task-priority-tag--high),
.task-workbench-section--dark :deep(.ant-tag.task-priority-tag--high) {
  background: rgb(154 52 18 / 0.28) !important;
  border-color: rgb(251 146 60 / 0.62) !important;
  color: #fed7aa !important;
}

:global(html.dark) .task-workbench-section :deep(.ant-tag.task-priority-tag--normal),
.task-workbench-section--dark :deep(.ant-tag.task-priority-tag--normal) {
  background: rgb(22 101 52 / 0.24) !important;
  border-color: rgb(74 222 128 / 0.54) !important;
  color: #bbf7d0 !important;
}

:global(html.dark) .task-workbench-section :deep(.ant-tag.task-priority-tag--low),
.task-workbench-section--dark :deep(.ant-tag.task-priority-tag--low) {
  background: rgb(51 65 85 / 0.72) !important;
  border-color: rgb(148 163 184 / 0.54) !important;
  color: #d1d5db !important;
}
</style>
