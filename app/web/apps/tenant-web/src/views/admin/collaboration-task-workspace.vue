<script setup lang="ts">
import type { CollaborationTaskApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onMounted, reactive, ref, watch } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import {
  Alert,
  Button,
  Empty,
  Input,
  InputSearch,
  Select,
  SelectOption,
  Segmented,
  Table,
  Tabs,
  Tag
} from 'ant-design-vue'

import {
  archiveCollaborationTaskApi,
  cancelCollaborationTaskApi,
  completeCollaborationTaskApi,
  createCollaborationTaskApi,
  listCollaborationTasksApi,
  reopenCollaborationTaskApi,
  startCollaborationTaskApi,
  unarchiveCollaborationTaskApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type TaskScope = CollaborationTaskApi.TaskScope
type TaskStatus = CollaborationTaskApi.TaskStatus
type TaskPriority = CollaborationTaskApi.TaskPriority
type TaskView = CollaborationTaskApi.TaskView

interface TaskFilterState {
  keyword: string
  statuses: TaskStatus[]
  priorities: TaskPriority[]
  archiveMode: 'ACTIVE' | 'INCLUDE_ARCHIVED' | 'ARCHIVED_ONLY'
  overdueOnly: boolean
}

interface CreateTaskFormState {
  assignmentMode: 'SELF' | 'ASSIGN'
  title: string
  description: string
  assigneeAccountId: string
  dueAt: string
  priority: TaskPriority
}

interface PendingTaskAction {
  kind: 'cancel' | 'complete' | 'reopen'
  task: TaskView
  note: string
}

const authContextStore = useAuthContextStore()
const Textarea = Input.TextArea
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canAssignTask = computed(() =>
  authContextStore.actionCodes.includes('collaboration.task.assign')
)
const canOpenWorkspace = computed(() =>
  authContextStore.visibleEntries.includes('collaboration.tasks')
)

const activeScope = ref<TaskScope>('MY_TODO')
const filters = reactive<TaskFilterState>({
  keyword: '',
  statuses: [],
  priorities: [],
  archiveMode: 'ACTIVE',
  overdueOnly: false
})
const createForm = reactive<CreateTaskFormState>(emptyCreateForm())
const tasks = ref<TaskView[]>([])
const total = ref(0)
const loading = ref(false)
const creating = ref(false)
const mutatingTaskId = ref('')
const createPanelOpen = ref(false)
const errorMessage = ref('')
const noticeMessage = ref('')
const pendingAction = ref<PendingTaskAction | null>(null)

const scopeTabs: Array<{ key: TaskScope; label: string }> = [
  { key: 'MY_TODO', label: '我的待办' },
  { key: 'ASSIGNED_TO_ME', label: '别人指派给我的' },
  { key: 'CREATED_BY_ME', label: '我创建的' }
]
const statusOptions: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
const priorityOptions: TaskPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT']

const taskColumns = computed<TableColumnsType<TaskView>>(() => [
  {
    dataIndex: 'title',
    key: 'title',
    title: '任务',
    width: 300,
    customRender: ({ record }) =>
      h('div', { class: 'task-title-cell' }, [
        h('strong', record.title || '-'),
        h('span', record.description || '无说明')
      ])
  },
  {
    dataIndex: 'status',
    key: 'status',
    title: '状态',
    width: 140,
    customRender: ({ record }) =>
      h('div', { class: 'task-state-stack' }, [
        h(Tag, { color: statusColor(record.status) }, () => statusLabel(record.status)),
        record.archivedAt ? h(Tag, { color: 'default' }, () => '已归档') : null
      ])
  },
  {
    dataIndex: 'priority',
    key: 'priority',
    title: '优先级',
    width: 120,
    customRender: ({ record }) =>
      h(Tag, { color: priorityColor(record.priority) }, () => priorityLabel(record.priority))
  },
  {
    dataIndex: 'dueAt',
    key: 'dueAt',
    title: '到期',
    width: 180,
    customRender: ({ record }) =>
      h('div', { class: record.overdue ? 'task-due task-due--overdue' : 'task-due' }, [
        h('span', formatDateTime(record.dueAt) || '未设置'),
        record.overdue ? h('small', '已超期') : null
      ])
  },
  {
    dataIndex: 'createdByAccountId',
    key: 'participants',
    title: '参与人',
    width: 220,
    customRender: ({ record }) =>
      h('div', { class: 'task-participants' }, [
        h('span', `创建 ${record.createdByAccountId || '-'}`),
        h('span', `处理 ${record.assigneeAccountId || '-'}`)
      ])
  },
  {
    fixed: 'right',
    key: 'actions',
    title: '',
    width: 360,
    customRender: ({ record }) => h('div', { class: 'task-row-actions' }, renderTaskActions(record))
  }
])

/** emptyCreateForm returns the default low-friction private todo form state. */
function emptyCreateForm(): CreateTaskFormState {
  return {
    assignmentMode: 'SELF',
    title: '',
    description: '',
    assigneeAccountId: '',
    dueAt: '',
    priority: 'NORMAL'
  }
}

/** loadTasks refreshes the current personal task scope through the Gateway BFF. */
async function loadTasks() {
  if (!activeTenantId.value || !canOpenWorkspace.value) {
    tasks.value = []
    total.value = 0
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const archiveFlags = resolveArchiveFlags(filters.archiveMode)
    const result = await listCollaborationTasksApi(activeTenantId.value, {
      scope: activeScope.value,
      status: filters.statuses,
      priority: filters.priorities,
      keyword: normalize(filters.keyword),
      overdueOnly: filters.overdueOnly,
      includeArchived: archiveFlags.includeArchived,
      archivedOnly: archiveFlags.archivedOnly,
      page: 1,
      pageSize: 20
    })
    tasks.value = result.items ?? []
    total.value = result.total ?? tasks.value.length
  } catch (error: any) {
    errorMessage.value = resolveTaskError(error)
    tasks.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** openCreatePanel resets and opens the task creation form. */
function openCreatePanel() {
  Object.assign(createForm, emptyCreateForm())
  createPanelOpen.value = true
  errorMessage.value = ''
}

/** submitCreateTask creates a self todo or an assigned task depending on the local form mode. */
async function submitCreateTask() {
  if (!activeTenantId.value) return
  if (createForm.assignmentMode === 'ASSIGN' && !canAssignTask.value) {
    errorMessage.value = '当前账号不能指派给他人'
    return
  }
  creating.value = true
  errorMessage.value = ''
  try {
    await createCollaborationTaskApi(activeTenantId.value, {
      title: createForm.title.trim(),
      description: normalize(createForm.description),
      assigneeAccountId:
        createForm.assignmentMode === 'ASSIGN'
          ? normalize(createForm.assigneeAccountId)
          : undefined,
      dueAt: normalize(createForm.dueAt),
      priority: createForm.priority
    })
    noticeMessage.value = '任务已创建'
    createPanelOpen.value = false
    await loadTasks()
  } catch (error: any) {
    errorMessage.value = resolveTaskError(error)
  } finally {
    creating.value = false
  }
}

/** runDirectTaskCommand executes command buttons that do not need a note panel. */
async function runDirectTaskCommand(kind: 'archive' | 'start' | 'unarchive', task: TaskView) {
  if (!activeTenantId.value) return
  mutatingTaskId.value = `${kind}:${task.taskId}`
  errorMessage.value = ''
  try {
    if (kind === 'start') await startCollaborationTaskApi(activeTenantId.value, task.taskId)
    if (kind === 'archive') await archiveCollaborationTaskApi(activeTenantId.value, task.taskId)
    if (kind === 'unarchive') await unarchiveCollaborationTaskApi(activeTenantId.value, task.taskId)
    noticeMessage.value = '任务状态已更新'
    await loadTasks()
  } catch (error: any) {
    errorMessage.value = resolveTaskError(error)
  } finally {
    mutatingTaskId.value = ''
  }
}

/** openPendingAction opens the note panel for commands that carry optional command text. */
function openPendingAction(kind: PendingTaskAction['kind'], task: TaskView) {
  pendingAction.value = { kind, task, note: '' }
}

/** submitPendingAction sends complete, cancel, or reopen commands with the current note text. */
async function submitPendingAction() {
  if (!pendingAction.value || !activeTenantId.value) return
  const action = pendingAction.value
  mutatingTaskId.value = `${action.kind}:${action.task.taskId}`
  errorMessage.value = ''
  try {
    if (action.kind === 'complete') {
      await completeCollaborationTaskApi(activeTenantId.value, action.task.taskId, {
        completionNote: normalize(action.note)
      })
    }
    if (action.kind === 'cancel') {
      await cancelCollaborationTaskApi(activeTenantId.value, action.task.taskId, {
        cancelReason: normalize(action.note)
      })
    }
    if (action.kind === 'reopen') {
      await reopenCollaborationTaskApi(activeTenantId.value, action.task.taskId, {
        reopenReason: normalize(action.note)
      })
    }
    noticeMessage.value = '任务状态已更新'
    pendingAction.value = null
    await loadTasks()
  } catch (error: any) {
    errorMessage.value = resolveTaskError(error)
  } finally {
    mutatingTaskId.value = ''
  }
}

/** renderTaskActions creates stable row action buttons for the frozen P1 command set. */
function renderTaskActions(task: TaskView) {
  const archived = Boolean(task.archivedAt)
  const status = task.status
  const actions = []

  if (!archived && status === 'OPEN') {
    actions.push(
      h(
        Button,
        {
          'data-testid': `task-action-start-${task.taskId}`,
          loading: mutatingTaskId.value === `start:${task.taskId}`,
          size: 'small',
          onClick: () => runDirectTaskCommand('start', task)
        },
        () => '开始'
      )
    )
  }
  if (!archived && ['OPEN', 'IN_PROGRESS'].includes(`${status}`)) {
    actions.push(
      h(
        Button,
        {
          'data-testid': `task-action-complete-${task.taskId}`,
          size: 'small',
          type: 'primary',
          onClick: () => openPendingAction('complete', task)
        },
        () => '完成'
      ),
      h(
        Button,
        {
          'data-testid': `task-action-cancel-${task.taskId}`,
          danger: true,
          size: 'small',
          onClick: () => openPendingAction('cancel', task)
        },
        () => '取消'
      )
    )
  }
  if (!archived && ['COMPLETED', 'CANCELLED'].includes(`${status}`)) {
    actions.push(
      h(
        Button,
        {
          'data-testid': `task-action-reopen-${task.taskId}`,
          size: 'small',
          onClick: () => openPendingAction('reopen', task)
        },
        () => '重开'
      ),
      h(
        Button,
        {
          'data-testid': `task-action-archive-${task.taskId}`,
          loading: mutatingTaskId.value === `archive:${task.taskId}`,
          size: 'small',
          onClick: () => runDirectTaskCommand('archive', task)
        },
        () => '归档'
      )
    )
  }
  if (archived) {
    actions.push(
      h(
        Button,
        {
          'data-testid': `task-action-unarchive-${task.taskId}`,
          loading: mutatingTaskId.value === `unarchive:${task.taskId}`,
          size: 'small',
          onClick: () => runDirectTaskCommand('unarchive', task)
        },
        () => '恢复归档'
      )
    )
  }
  return actions
}

/** handleScopeChange switches personal task views and reloads the list. */
function handleScopeChange(scope: string | number) {
  activeScope.value = scope as TaskScope
  loadTasks()
}

/** resolveArchiveFlags converts the archive filter selector to BFF query flags. */
function resolveArchiveFlags(mode: TaskFilterState['archiveMode']) {
  if (mode === 'ARCHIVED_ONLY') return { archivedOnly: true, includeArchived: false }
  if (mode === 'INCLUDE_ARCHIVED') return { archivedOnly: false, includeArchived: true }
  return { archivedOnly: false, includeArchived: false }
}

/** normalize trims optional user-entered text and returns undefined for empty values. */
function normalize(value: string | undefined | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

/** resolveTaskError turns gateway errors into concise workspace messages. */
function resolveTaskError(error: any) {
  const raw = `${error?.response?.data?.message ?? error?.message ?? ''}`
  if (/permission|forbidden|denied|PERMISSION/i.test(raw)) return '权限不足，当前账号不能执行该任务操作'
  return raw || '任务操作失败，请稍后重试'
}

/** formatDateTime renders ISO timestamps for compact table scanning. */
function formatDateTime(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit'
  })
}

/** statusColor maps task lifecycle states to quiet table tags. */
function statusColor(status: string) {
  if (status === 'IN_PROGRESS') return 'processing'
  if (status === 'COMPLETED') return 'success'
  if (status === 'CANCELLED') return 'default'
  return 'blue'
}

/** statusLabel maps backend task statuses to concise Chinese labels. */
function statusLabel(status: string) {
  const labels: Record<string, string> = {
    CANCELLED: '已取消',
    COMPLETED: '已完成',
    IN_PROGRESS: '进行中',
    OPEN: '待处理'
  }
  return labels[status] ?? status
}

/** priorityColor maps task priorities to restrained enterprise tags. */
function priorityColor(priority: string) {
  if (priority === 'URGENT') return 'red'
  if (priority === 'HIGH') return 'orange'
  if (priority === 'LOW') return 'default'
  return 'green'
}

/** priorityLabel maps backend priorities to concise Chinese labels. */
function priorityLabel(priority: string) {
  const labels: Record<string, string> = {
    HIGH: '高',
    LOW: '低',
    NORMAL: '普通',
    URGENT: '紧急'
  }
  return labels[priority] ?? priority
}

watch(
  () => createForm.assignmentMode,
  (mode) => {
    if (mode === 'ASSIGN' && !canAssignTask.value) createForm.assignmentMode = 'SELF'
  }
)

onMounted(loadTasks)
</script>

<template>
  <Page>
    <section class="task-workspace">
      <header class="task-workspace__header">
        <div>
          <p class="task-workspace__tenant">{{ activeTenantName }}</p>
          <h1>任务工作台</h1>
        </div>
        <Button
          data-testid="task-create-open"
          type="primary"
          @click="openCreatePanel"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          新建任务
        </Button>
      </header>

      <Alert
        v-if="!canOpenWorkspace"
        class="task-workspace__alert"
        message="权限不足，当前账号不能访问任务工作台"
        show-icon
        type="warning"
      />
      <Alert
        v-else-if="!activeTenantId"
        class="task-workspace__alert"
        message="缺少租户上下文，无法加载任务"
        show-icon
        type="warning"
      />

      <template v-else>
        <Alert
          v-if="noticeMessage"
          class="task-workspace__alert"
          :message="noticeMessage"
          show-icon
          type="success"
          closable
          @close="noticeMessage = ''"
        />
        <Alert
          v-if="errorMessage"
          class="task-workspace__alert"
          :message="errorMessage"
          show-icon
          type="error"
          closable
          @close="errorMessage = ''"
        />

        <div class="task-workspace__toolbar">
          <Tabs :active-key="activeScope" @change="handleScopeChange">
            <Tabs.TabPane
              v-for="scope in scopeTabs"
              :key="scope.key"
              :tab="scope.label"
            />
          </Tabs>

          <div class="task-filter-row">
            <InputSearch
              v-model:value="filters.keyword"
              allow-clear
              class="task-filter-row__search"
              data-testid="task-filter-keyword"
              placeholder="搜索标题或说明"
              @search="loadTasks"
            />
            <Select
              v-model:value="filters.statuses"
              class="task-filter-row__select"
              mode="multiple"
              placeholder="状态"
            >
              <SelectOption
                v-for="status in statusOptions"
                :key="status"
                :value="status"
              >
                {{ statusLabel(status) }}
              </SelectOption>
            </Select>
            <Select
              v-model:value="filters.priorities"
              class="task-filter-row__select"
              mode="multiple"
              placeholder="优先级"
            >
              <SelectOption
                v-for="priority in priorityOptions"
                :key="priority"
                :value="priority"
              >
                {{ priorityLabel(priority) }}
              </SelectOption>
            </Select>
            <Select
              v-model:value="filters.archiveMode"
              class="task-filter-row__archive"
            >
              <SelectOption value="ACTIVE">未归档</SelectOption>
              <SelectOption value="INCLUDE_ARCHIVED">包含归档</SelectOption>
              <SelectOption value="ARCHIVED_ONLY">仅归档</SelectOption>
            </Select>
            <Button @click="filters.overdueOnly = !filters.overdueOnly">
              {{ filters.overdueOnly ? '只看超期' : '包含未超期' }}
            </Button>
            <Button data-testid="task-filter-search" @click="loadTasks">
              刷新
            </Button>
          </div>
        </div>

        <section v-if="createPanelOpen" class="task-editor">
          <div class="task-editor__heading">
            <strong>新建任务</strong>
            <Button size="small" @click="createPanelOpen = false">关闭</Button>
          </div>
          <div class="task-editor__grid">
            <label class="task-field">
              <span>任务类型</span>
              <Segmented
                v-model:value="createForm.assignmentMode"
                :options="[
                  { label: '我的待办', value: 'SELF' },
                  { disabled: !canAssignTask, label: '指派给他人', value: 'ASSIGN' },
                ]"
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
              <span>处理人账号 ID</span>
              <Input
                v-model:value="createForm.assigneeAccountId"
                data-testid="task-assignee-input"
                placeholder="account id"
              />
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
              <Input
                v-model:value="createForm.dueAt"
                placeholder="2026-06-15T10:00:00.000Z"
              />
            </label>
            <label class="task-field task-field--wide">
              <span>说明</span>
              <Textarea
                v-model:value="createForm.description"
                data-testid="task-description-input"
                :rows="3"
                placeholder="纯文本说明"
              />
            </label>
          </div>
          <div class="task-editor__actions">
            <Button @click="createPanelOpen = false">取消</Button>
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
        </section>

        <section v-if="pendingAction" class="task-editor task-editor--action">
          <div class="task-editor__heading">
            <strong>{{ statusLabel(pendingAction.task.status) }} / {{ pendingAction.task.title }}</strong>
            <Button size="small" @click="pendingAction = null">关闭</Button>
          </div>
          <label class="task-field task-field--wide">
            <span>操作说明</span>
            <Textarea
              v-model:value="pendingAction.note"
              data-testid="task-action-note"
              :rows="3"
              placeholder="可选，作为命令审计摘要"
            />
          </label>
          <div class="task-editor__actions">
            <Button @click="pendingAction = null">取消</Button>
            <Button
              data-testid="task-action-submit"
              :loading="Boolean(mutatingTaskId)"
              type="primary"
              @click="submitPendingAction"
            >
              提交
            </Button>
          </div>
        </section>

        <div class="task-table-wrap">
          <Table
            :columns="taskColumns"
            :data-source="tasks"
            :loading="loading"
            :pagination="{ current: 1, pageSize: 20, total, showSizeChanger: false }"
            row-key="taskId"
            size="middle"
            :scroll="{ x: 1280 }"
          >
            <template #emptyText>
              <Empty description="当前视图没有任务" />
            </template>
          </Table>
        </div>
      </template>
    </section>
  </Page>
</template>

<style scoped>
.task-workspace {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 8px 0 24px;
}

.task-workspace__header {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.task-workspace__header h1 {
  color: #172033;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
}

.task-workspace__tenant {
  color: #64748b;
  font-size: 13px;
  margin: 0 0 4px;
}

.task-workspace__alert {
  max-width: 960px;
}

.task-workspace__toolbar,
.task-editor,
.task-table-wrap {
  background: #ffffff;
  border: 1px solid #dfe5ee;
  border-radius: 8px;
}

.task-workspace__toolbar {
  padding: 12px 14px;
}

.task-filter-row {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(220px, 1.4fr) minmax(160px, 0.8fr) minmax(160px, 0.8fr) 150px auto auto;
}

.task-filter-row__archive,
.task-filter-row__search,
.task-filter-row__select {
  min-width: 0;
}

.task-editor {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.task-editor--action {
  border-color: #b9c7d8;
}

.task-editor__heading,
.task-editor__actions {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.task-editor__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.task-field {
  color: #334155;
  display: grid;
  gap: 6px;
  min-width: 0;
}

.task-field > span {
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.task-field > small {
  color: #8a6d28;
}

.task-field--wide {
  grid-column: 1 / -1;
}

.task-table-wrap {
  overflow: hidden;
}

.task-title-cell,
.task-participants,
.task-state-stack,
.task-due {
  display: grid;
  gap: 4px;
}

.task-title-cell strong {
  color: #172033;
  font-size: 14px;
}

.task-title-cell span,
.task-participants span,
.task-due small {
  color: #64748b;
  font-size: 12px;
}

.task-due--overdue span,
.task-due--overdue small {
  color: #b42318;
}

.task-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .task-workspace__header {
    align-items: stretch;
    flex-direction: column;
  }

  .task-filter-row,
  .task-editor__grid {
    grid-template-columns: 1fr;
  }

  .task-row-actions {
    justify-content: flex-start;
  }
}
</style>
