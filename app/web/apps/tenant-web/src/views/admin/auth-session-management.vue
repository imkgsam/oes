<script lang="ts" setup>
import type { AdminSecurityApi } from '#/api';
import type { Dayjs } from 'dayjs';
import type { TableColumnsType } from 'ant-design-vue';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  listAdminAuditEventsApi,
  listAdminUserSessionsApi,
  revokeAdminSessionApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';

type AuditResultTagColor = 'blue' | 'default' | 'error' | 'orange' | 'success';

interface AuditFilterState {
  eventType: string;
  occurredRange: [] | [string, string];
  operatorId: string;
  pageSize: number;
  resourceType: string;
  result: string;
  service: string;
  tenantId: string;
}

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const authContextStore = useAuthContextStore();

const auditLoading = ref(false);
const sessionLoading = ref(false);
const revoking = ref(false);
const sessionDrawerOpen = ref(false);
const revokeModalOpen = ref(false);

const auditItems = ref<AdminSecurityApi.AuditEvent[]>([]);
const sessionItems = ref<AdminSecurityApi.Session[]>([]);
const auditNextCursor = ref<null | string>(null);
const auditCursor = ref<null | string>(null);
const auditCursorHistory = ref<string[]>([]);
const selectedUserId = ref('');
const selectedUserTenantId = ref('');
const manualUserId = ref('');
const revokeReason = ref('');
const pendingRevokeSession = ref<AdminSecurityApi.Session | null>(null);

const filters = reactive<AuditFilterState>({
  eventType: '',
  occurredRange: [],
  operatorId: '',
  pageSize: 20,
  resourceType: '',
  result: '',
  service: '',
  tenantId: '',
});

// Determines whether the current session can inspect another user's sessions.
const canViewUserSessions = computed(() =>
  authContextStore.actionCodes.includes('auth.session.admin.view'),
);

// Determines whether the current session can revoke another user's sessions.
const canRevokeUserSession = computed(() =>
  authContextStore.actionCodes.includes('auth.session.admin.revoke'),
);

// Determines whether the current session can query auth-domain audit events.
const canListAuditEvents = computed(() =>
  authContextStore.actionCodes.includes('auth.audit.list'),
);

// Exposes whether the page should present a global tenant filter or the current tenant scope.
const isPlatformScope = computed(() => authContextStore.isPlatformScope);

// Resolves the tenant constraint that should actually be sent to the BFF.
const effectiveTenantId = computed(() => {
  if (isPlatformScope.value) {
    return filters.tenantId.trim() || undefined;
  }

  return authContextStore.sessionContext?.tenant?.tenantId || undefined;
});

// Summarizes the number of rejected login attempts visible in the current audit page.
const failedAuditCount = computed(() =>
  auditItems.value.filter(
    (item) =>
      item.eventType === 'LOGIN_FAILED' || item.result?.toUpperCase() === 'REJECTED',
  ).length,
);

// Summarizes the number of currently active sessions in the loaded user investigation drawer.
const activeSessionCount = computed(() =>
  sessionItems.value.filter((session) => !session.isRevoked).length,
);

// Summarizes the number of revoked sessions in the current user investigation drawer.
const revokedSessionCount = computed(() =>
  sessionItems.value.filter((session) => session.isRevoked).length,
);

// Normalizes unknown request failures into a stable user-facing message.
function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}

// Builds the compact tag color used across audit and session status chips.
function getAuditResultTagColor(result?: string): AuditResultTagColor {
  switch (result?.toUpperCase()) {
    case 'ACCEPTED':
    case 'SUCCESS':
      return 'success';
    case 'REJECTED':
    case 'FAILED':
      return 'error';
    case 'PENDING':
      return 'orange';
    default:
      return 'default';
  }
}

// Formats ISO timestamps into a concise local string for the admin tables.
function formatTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
  });
}

// Formats a duration in seconds into a short, readable label for the session drawer.
function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) {
    return '-';
  }

  const value = Math.max(0, Math.floor(seconds));
  const days = Math.floor(value / 86_400);
  const hours = Math.floor((value % 86_400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);

  if (days > 0) {
    return `${days}天 ${hours}小时`;
  }

  if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  }

  return `${minutes}分钟`;
}

// Builds the drawer header description for the currently investigated target user.
const selectedUserScopeText = computed(() => {
  if (!selectedUserId.value) {
    return '未选择目标用户';
  }

  if (selectedUserTenantId.value) {
    return `目标用户：${selectedUserId.value} · 租户：${selectedUserTenantId.value}`;
  }

  return `目标用户：${selectedUserId.value} · 系统范围`;
});

// Converts the date range picker value into the BFF query fields.
function handleOccurredRangeChange(value: null | [Dayjs, Dayjs] | string[]) {
  if (!value || value.length !== 2) {
    filters.occurredRange = [];
    return;
  }

  const [start, end] = value as string[];

  if (!start || !end) {
    filters.occurredRange = [];
    return;
  }

  filters.occurredRange = [start, end];
}

// Resets the audit filters back to the current scope defaults and reloads the first page.
async function resetAuditFilters() {
  filters.eventType = '';
  filters.occurredRange = [];
  filters.operatorId = '';
  filters.resourceType = '';
  filters.result = '';
  filters.service = '';
  filters.tenantId = '';
  await loadAuditEvents({ resetCursor: true });
}

// Loads one cursor page of audit events according to the current scope-aware filter state.
async function loadAuditEvents(options?: {
  cursor?: null | string;
  resetCursor?: boolean;
}) {
  if (!canListAuditEvents.value) {
    auditItems.value = [];
    auditNextCursor.value = null;
    return;
  }

  const resetCursor = options?.resetCursor ?? false;
  const cursor = resetCursor ? undefined : options?.cursor ?? auditCursor.value ?? undefined;

  auditLoading.value = true;

  try {
    const result = await listAdminAuditEventsApi({
      cursor,
      eventType: filters.eventType.trim() || undefined,
      occurredAtFrom: filters.occurredRange[0],
      occurredAtTo: filters.occurredRange[1],
      operatorId: filters.operatorId.trim() || undefined,
      pageSize: filters.pageSize,
      resourceType: filters.resourceType.trim() || undefined,
      result: filters.result.trim() || undefined,
      service: filters.service.trim() || undefined,
      tenantId: effectiveTenantId.value,
    });

    auditItems.value = result.items ?? [];
    auditNextCursor.value = result.nextCursor || null;
    auditCursor.value = cursor ?? null;

    if (resetCursor) {
      auditCursorHistory.value = [];
    }
  } catch (error) {
    auditItems.value = [];
    auditNextCursor.value = null;
    message.error(getErrorMessage(error, '加载认证审计事件失败，请稍后重试'));
  } finally {
    auditLoading.value = false;
  }
}

// Advances the cursor-based audit pagination and records the previous cursor for back navigation.
async function loadNextAuditPage() {
  if (!auditNextCursor.value) {
    return;
  }

  auditCursorHistory.value.push(auditCursor.value ?? '');
  await loadAuditEvents({ cursor: auditNextCursor.value });
}

// Returns to the previous cursor page of audit events.
async function loadPreviousAuditPage() {
  const previousCursor = auditCursorHistory.value.pop();

  if (previousCursor === undefined) {
    return;
  }

  await loadAuditEvents({ cursor: previousCursor || null });
}

// Loads the selected target user's session inventory and opens the investigation drawer.
async function inspectUserSessions(params: {
  tenantId?: string;
  userId: string;
}) {
  if (!canViewUserSessions.value) {
    return;
  }

  const userId = params.userId.trim();

  if (!userId) {
    message.warning('请先输入有效的目标用户 ID');
    return;
  }

  sessionLoading.value = true;
  selectedUserId.value = userId;
  selectedUserTenantId.value = params.tenantId ?? '';
  sessionDrawerOpen.value = true;

  try {
    const result = await listAdminUserSessionsApi(userId);
    sessionItems.value = result.sessions ?? [];
  } catch (error) {
    sessionItems.value = [];
    message.error(getErrorMessage(error, '加载目标用户会话失败，请稍后重试'));
  } finally {
    sessionLoading.value = false;
  }
}

// Uses the manual investigation field as a direct session lookup入口.
async function inspectManualUserSessions() {
  await inspectUserSessions({
    tenantId: effectiveTenantId.value,
    userId: manualUserId.value,
  });
}

// Opens the revocation modal for one concrete target session.
function openRevokeModal(session: AdminSecurityApi.Session) {
  pendingRevokeSession.value = session;
  revokeReason.value = session.adminRevokeReason || '';
  revokeModalOpen.value = true;
}

// Persists one administrator-driven session revocation and refreshes the current drawer state.
async function submitSessionRevoke() {
  if (!pendingRevokeSession.value) {
    return;
  }

  const reason = revokeReason.value.trim();

  if (!reason) {
    message.warning('请填写撤销原因');
    return;
  }

  revoking.value = true;

  try {
    await revokeAdminSessionApi(pendingRevokeSession.value.sessionId, reason);
    message.success('目标会话已撤销');
    revokeModalOpen.value = false;
    await inspectUserSessions({
      tenantId: selectedUserTenantId.value || undefined,
      userId: selectedUserId.value,
    });
  } catch (error) {
    message.error(getErrorMessage(error, '撤销目标会话失败，请稍后重试'));
  } finally {
    revoking.value = false;
  }
}

// Safely formats the opaque audit details JSON payload into readable pretty text.
function formatAuditDetails(detailsJson?: string) {
  if (!detailsJson) {
    return '无详情';
  }

  try {
    return JSON.stringify(JSON.parse(detailsJson), null, 2);
  } catch {
    return detailsJson;
  }
}

const auditColumns: TableColumnsType<AdminSecurityApi.AuditEvent> = [
  {
    dataIndex: 'occurredAt',
    key: 'occurredAt',
    title: '发生时间',
    width: 180,
    customRender: ({ value }) => formatTime(value as string | undefined),
  },
  {
    dataIndex: 'eventType',
    key: 'eventType',
    title: '事件类型',
    width: 180,
  },
  {
    dataIndex: 'result',
    key: 'result',
    title: '结果',
    width: 110,
    customRender: ({ value }) => {
      const result = (value as string | undefined) || 'UNKNOWN';
      return h(
        Tag,
        { color: getAuditResultTagColor(result) },
        { default: () => result },
      );
    },
  },
  {
    dataIndex: 'operatorId',
    key: 'operatorId',
    title: '操作人',
    width: 180,
    ellipsis: true,
  },
  {
    dataIndex: 'tenantId',
    key: 'tenantId',
    title: '租户',
    width: 180,
    ellipsis: true,
  },
  {
    dataIndex: 'resourceType',
    key: 'resourceType',
    title: '资源类型',
    width: 140,
  },
  {
    dataIndex: 'resourceId',
    key: 'resourceId',
    title: '资源标识',
    width: 180,
    ellipsis: true,
  },
  {
    key: 'actions',
    title: '操作',
    width: 150,
    fixed: 'right',
    customRender: ({ record }) => {
      const item = record as AdminSecurityApi.AuditEvent;

      if (!canViewUserSessions.value || !item.operatorId) {
        return h('span', { class: 'text-xs text-gray-400' }, '无可用操作');
      }

      return h(
        Button,
        {
          size: 'small',
          type: 'link',
          onClick: () =>
            inspectUserSessions({
              tenantId: item.tenantId,
              userId: item.operatorId!,
            }),
        },
        { default: () => '查看会话' },
      );
    },
  },
];

const sessionColumns: TableColumnsType<AdminSecurityApi.Session> = [
  {
    dataIndex: 'status',
    key: 'status',
    title: '状态',
    width: 120,
    customRender: ({ record }) => {
      const session = record as AdminSecurityApi.Session;
      const color = session.isRevoked
        ? 'error'
        : session.isAccessExpired
          ? 'orange'
          : 'success';
      const label = session.isRevoked
        ? '已撤销'
        : session.isAccessExpired
          ? '已过期'
          : session.status || 'ACTIVE';
      return h(Tag, { color }, { default: () => label });
    },
  },
  {
    dataIndex: 'loginMethod',
    key: 'loginMethod',
    title: '登录方式',
    width: 140,
  },
  {
    dataIndex: 'deviceName',
    key: 'deviceName',
    title: '设备',
    width: 180,
    ellipsis: true,
    customRender: ({ record }) => {
      const session = record as AdminSecurityApi.Session;
      return (
        session.deviceName ||
        [session.platform, session.browser].filter(Boolean).join(' / ') ||
        session.userAgent ||
        '-'
      );
    },
  },
  {
    dataIndex: 'ipAddress',
    key: 'ipAddress',
    title: 'IP',
    width: 150,
    ellipsis: true,
  },
  {
    dataIndex: 'lastActiveAt',
    key: 'lastActiveAt',
    title: '最近活跃',
    width: 180,
    customRender: ({ value }) => formatTime(value as string | undefined),
  },
  {
    dataIndex: 'idleSeconds',
    key: 'idleSeconds',
    title: '空闲时长',
    width: 120,
    customRender: ({ value }) => formatDuration(value as number | undefined),
  },
  {
    key: 'actions',
    title: '操作',
    width: 150,
    fixed: 'right',
    customRender: ({ record }) => {
      const session = record as AdminSecurityApi.Session;

      if (!canRevokeUserSession.value || session.isRevoked) {
        return h('span', { class: 'text-xs text-gray-400' }, '无可用操作');
      }

      return h(
        Button,
        {
          size: 'small',
          type: 'link',
          onClick: () => openRevokeModal(session),
        },
        { default: () => '强制下线' },
      );
    },
  },
];

onMounted(async () => {
  if (!isPlatformScope.value) {
    filters.tenantId = authContextStore.sessionContext?.tenant?.tenantId ?? '';
  }

  try {
    await loadAuditEvents({ resetCursor: true });
  } catch {
    // loadAuditEvents already emits the stable user-facing error state.
  }
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-5 p-5">
      <Card v-if="!canListAuditEvents && !canViewUserSessions">
        <Empty description="当前账号没有管理员认证与会话管理权限" />
      </Card>

      <div
        v-if="canListAuditEvents || canViewUserSessions"
        class="grid gap-4 md:grid-cols-4"
      >
        <Card>
          <Statistic title="当前安全范围" :value="authContextStore.scopeLabel" />
        </Card>
        <Card>
          <Statistic title="当前审计页事件数" :value="auditItems.length" />
        </Card>
        <Card>
          <Statistic title="当前页失败事件" :value="failedAuditCount" />
        </Card>
        <Card>
          <Statistic title="目标用户有效会话" :value="activeSessionCount" />
        </Card>
      </div>

      <Card v-if="canListAuditEvents || canViewUserSessions" :bordered="false">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-base font-semibold">认证与会话管理</span>
            <Tag :color="isPlatformScope ? 'blue' : 'green'">
              {{ isPlatformScope ? 'System Scope' : 'Tenant Scope' }}
            </Tag>
          </div>
        </template>

        <Alert
          show-icon
          type="info"
          message="当前页面使用单页双视角：系统管理员可按租户收敛审计范围，租户管理员自动限定在当前租户。"
        />

        <div class="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div class="space-y-3 text-sm leading-6 text-gray-600">
            <p>
              1. 审计事件是主入口，支持从事件中的 `operatorId`
              直接进入目标用户会话排查。
            </p>
            <p>
              2. 由于当前 BFF 还未开放管理员用户检索接口，这一版通过“审计事件跳转”与“手动输入用户
              ID”完成精确排查。
            </p>
          </div>

          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="mb-2 text-sm font-semibold text-gray-900">目标用户排查</div>
            <div class="flex gap-2">
              <Input
                v-model:value="manualUserId"
                class="flex-1"
                placeholder="请输入目标用户 ID"
                @press-enter="inspectManualUserSessions"
              />
              <Button
                type="primary"
                :disabled="!canViewUserSessions"
                @click="inspectManualUserSessions"
              >
                查看会话
              </Button>
            </div>
            <div class="mt-2 text-xs text-gray-500">
              {{ canViewUserSessions ? '支持手动输入 userId 直接排查。' : '当前账号没有查看用户会话的权限。' }}
            </div>
          </div>
        </div>
      </Card>

      <Card v-if="canListAuditEvents">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-base font-semibold">认证审计事件</span>
            <Space>
              <Button :disabled="auditCursorHistory.length === 0" @click="loadPreviousAuditPage">
                上一页
              </Button>
              <Button :disabled="!auditNextCursor" type="primary" ghost @click="loadNextAuditPage">
                下一页
              </Button>
            </Space>
          </div>
        </template>

        <Form layout="vertical">
          <Row :gutter="16">
            <Col :span="isPlatformScope ? 6 : 8">
              <Form.Item v-if="isPlatformScope" label="租户 ID">
                <Input v-model:value="filters.tenantId" placeholder="系统管理员可按租户收敛范围" />
              </Form.Item>
              <Form.Item v-else label="当前租户">
                <Input :value="authContextStore.tenantName || effectiveTenantId || '-'" disabled />
              </Form.Item>
            </Col>
            <Col :span="6">
              <Form.Item label="操作人 ID">
                <Input v-model:value="filters.operatorId" placeholder="按 operatorId 过滤" />
              </Form.Item>
            </Col>
            <Col :span="6">
              <Form.Item label="事件类型">
                <Input v-model:value="filters.eventType" placeholder="如 LOGIN_FAILED" />
              </Form.Item>
            </Col>
            <Col :span="6">
              <Form.Item label="结果">
                <Input v-model:value="filters.result" placeholder="如 SUCCESS / REJECTED" />
              </Form.Item>
            </Col>
          </Row>

          <Row :gutter="16">
            <Col :span="6">
              <Form.Item label="服务名">
                <Input v-model:value="filters.service" placeholder="如 auth-service" />
              </Form.Item>
            </Col>
            <Col :span="6">
              <Form.Item label="资源类型">
                <Input v-model:value="filters.resourceType" placeholder="如 login_attempt" />
              </Form.Item>
            </Col>
            <Col :span="8">
              <Form.Item label="发生时间范围">
                <RangePicker
                  class="w-full"
                  show-time
                  value-format="YYYY-MM-DDTHH:mm:ss[Z]"
                  @change="handleOccurredRangeChange"
                />
              </Form.Item>
            </Col>
            <Col :span="4">
              <Form.Item label=" " :colon="false">
                <Space>
                  <Button type="primary" @click="loadAuditEvents({ resetCursor: true })">
                    查询
                  </Button>
                  <Button @click="resetAuditFilters">重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Table
          :columns="auditColumns"
          :data-source="auditItems"
          :loading="auditLoading"
          :pagination="false"
          :row-key="(record) => record.eventId"
          :scroll="{ x: 1180, y: 520 }"
          size="small"
        >
          <template #expandedRowRender="{ record }">
            <pre class="overflow-x-auto rounded-lg bg-gray-950/90 p-4 text-xs leading-6 text-gray-100">{{
              formatAuditDetails(record.detailsJson)
            }}</pre>
          </template>
        </Table>
      </Card>

      <Card v-else>
        <Empty description="当前账号没有认证审计查询权限" />
      </Card>
    </div>

    <Drawer
      :open="sessionDrawerOpen"
      :title="selectedUserScopeText"
      width="72%"
      @close="sessionDrawerOpen = false"
    >
      <Spin :spinning="sessionLoading">
        <div class="space-y-5">
          <div class="grid gap-4 md:grid-cols-3">
            <Card size="small">
              <Statistic title="目标用户总会话" :value="sessionItems.length" />
            </Card>
            <Card size="small">
              <Statistic title="当前有效会话" :value="activeSessionCount" />
            </Card>
            <Card size="small">
              <Statistic title="已撤销会话" :value="revokedSessionCount" />
            </Card>
          </div>

          <Empty
            v-if="!sessionLoading && sessionItems.length === 0"
            description="当前目标用户暂无可见会话"
          />

          <Table
            v-if="sessionItems.length > 0"
            :columns="sessionColumns"
            :data-source="sessionItems"
            :pagination="false"
            :row-key="(record) => record.sessionId"
            :scroll="{ x: 1080, y: 520 }"
            size="small"
          >
            <template #expandedRowRender="{ record }">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <div><span class="font-medium">会话 ID：</span>{{ record.sessionId }}</div>
                  <div class="mt-2"><span class="font-medium">用户 ID：</span>{{ record.userId }}</div>
                  <div class="mt-2"><span class="font-medium">账户 ID：</span>{{ record.accountId || '-' }}</div>
                  <div class="mt-2"><span class="font-medium">租户 ID：</span>{{ record.tenantId || '-' }}</div>
                  <div class="mt-2"><span class="font-medium">创建时间：</span>{{ formatTime(record.createdAt) }}</div>
                  <div class="mt-2"><span class="font-medium">访问过期：</span>{{ formatTime(record.expiresAt) }}</div>
                  <div class="mt-2">
                    <span class="font-medium">刷新过期：</span>{{ formatTime(record.refreshExpiresAt) }}
                  </div>
                </div>
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <div><span class="font-medium">设备 ID：</span>{{ record.deviceId || '-' }}</div>
                  <div class="mt-2"><span class="font-medium">平台 / 浏览器：</span>{{ [record.platform, record.browser].filter(Boolean).join(' / ') || '-' }}</div>
                  <div class="mt-2"><span class="font-medium">User-Agent：</span>{{ record.userAgent || '-' }}</div>
                  <div class="mt-2"><span class="font-medium">剩余访问令牌：</span>{{ formatDuration(record.accessRemainingSeconds) }}</div>
                  <div class="mt-2"><span class="font-medium">剩余刷新令牌：</span>{{ formatDuration(record.refreshRemainingSeconds) }}</div>
                  <div class="mt-2"><span class="font-medium">管理员撤销原因：</span>{{ record.adminRevokeReason || '-' }}</div>
                </div>
              </div>
            </template>
          </Table>
        </div>
      </Spin>
    </Drawer>

    <Modal
      v-model:open="revokeModalOpen"
      title="强制下线目标会话"
      ok-text="确认撤销"
      cancel-text="取消"
      :confirm-loading="revoking"
      @cancel="revokeModalOpen = false"
      @ok="submitSessionRevoke"
    >
      <div class="space-y-3">
        <div class="text-sm text-gray-600">
          即将撤销会话：
          <span class="font-medium text-gray-900">
            {{ pendingRevokeSession?.sessionId || '-' }}
          </span>
        </div>
        <TextArea
          v-model:value="revokeReason"
          :maxlength="512"
          :rows="4"
          placeholder="请输入撤销原因，审计中会记录该内容"
          show-count
        />
      </div>
    </Modal>
  </Page>
</template>
