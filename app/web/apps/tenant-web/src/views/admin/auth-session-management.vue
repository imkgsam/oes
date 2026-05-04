<script lang="ts" setup>
import type { AdminSecurityApi } from '#/api';
import type { Dayjs } from 'dayjs';
import type { TableColumnsType, TablePaginationConfig } from 'ant-design-vue';

import { computed, h, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
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
  Tabs,
  Tooltip,
  message,
} from 'ant-design-vue';

import {
  listAdminAuditEventsApi,
  listAdminOnlineUsersApi,
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
const onlineUsersLoading = ref(false);
const sessionLoading = ref(false);
const revoking = ref(false);
const sessionDrawerOpen = ref(false);
const revokeModalOpen = ref(false);
const activeTab = ref('sessions');

const auditItems = ref<AdminSecurityApi.AuditEvent[]>([]);
const onlineUsers = ref<AdminSecurityApi.OnlineUser[]>([]);
const sessionItems = ref<AdminSecurityApi.Session[]>([]);
const auditNextCursor = ref<null | string>(null);
const auditCursor = ref<null | string>(null);
const auditCursorHistory = ref<string[]>([]);
const selectedUserId = ref('');
const selectedUserTenantId = ref('');
const selectedUserDisplayName = ref('');
const selectedUserTenantName = ref('');
const revokeReason = ref('');
const pendingRevokeSession = ref<AdminSecurityApi.Session | null>(null);
const onlineUserQuery = reactive({
  query: '',
  tenantId: '',
});
const sessionFilters = reactive({
  deviceQuery: '',
  status: '',
});

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

// Summarizes the number of currently active sessions in the loaded user investigation drawer.
const activeSessionCount = computed(() =>
  sessionItems.value.filter((session) => !session.isRevoked).length,
);

// Summarizes how many online-user rows are visible in the current scope-aware overview.
const onlineUserCount = computed(() => onlineUsers.value.length);

// Summarizes the number of online accounts across the current user-centric overview page.
const onlineAccountCount = computed(() =>
  onlineUsers.value.reduce((total, user) => total + (user.activeAccountCount || 0), 0),
);

// Summarizes the number of online sessions across the current user-centric overview page.
const onlineSessionTotal = computed(() =>
  onlineUsers.value.reduce((total, user) => total + (user.activeSessionCount || 0), 0),
);

// Summarizes the number of revoked sessions in the current user investigation drawer.
const revokedSessionCount = computed(() =>
  sessionItems.value.filter((session) => session.isRevoked).length,
);

// Summarizes how many accounts remain after applying the local drawer filters.
const filteredAccountCount = computed(() => filteredSessionGroups.value.length);

// Maps the cursor-based audit history to a compact one-based page number for the footer pager.
const currentAuditPage = computed(() => auditCursorHistory.value.length + 1);

// Keeps the audit table pagination aligned with the permission-management table style.
const auditTablePagination = computed<TablePaginationConfig>(() => ({
  current: currentAuditPage.value,
  hideOnSinglePage: false,
  pageSize: filters.pageSize,
  pageSizeOptions: ['20', '50', '100'],
  position: ['bottomRight'],
  showQuickJumper: true,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
  total:
    ((currentAuditPage.value - 1) * filters.pageSize) +
    auditItems.value.length +
    (auditNextCursor.value ? 1 : 0),
}));

// Normalizes unknown request failures into a stable user-facing message.
function getErrorMessage(error: unknown, fallback: string) {
  if (error === 'CANNOT_REVOKE_CURRENT_SESSION') {
    return '不能撤销当前正在使用的会话';
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim() === 'CANNOT_REVOKE_CURRENT_SESSION'
      ? '不能撤销当前正在使用的会话'
      : error;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message.trim() === 'CANNOT_REVOKE_CURRENT_SESSION'
      ? '不能撤销当前正在使用的会话'
      : error.message;
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

// Formats a compact tenant summary so the online-user table stays readable in both scopes.
function formatTenantSummary(user: AdminSecurityApi.OnlineUser) {
  if (!user.visibleTenantCount || user.visibleTenantCount <= 1) {
    return user.tenantName || user.tenantId || '系统范围';
  }

  const names = (user.tenantNames ?? []).filter(Boolean);

  if (names.length <= 2) {
    return names.join(' / ');
  }

  return `${names.slice(0, 2).join(' / ')} 等 ${user.visibleTenantCount} 个租户`;
}

// Resolves the display label used for one account group inside the session drawer.
function getSessionAccountLabel(session: AdminSecurityApi.Session) {
  return session.accountName || session.accountId || '未命名账号';
}

// Builds the drawer header description for the currently investigated target user.
const selectedUserScopeText = computed(() => {
  if (!selectedUserId.value) {
    return '未选择目标用户';
  }

  const displayName = selectedUserDisplayName.value || selectedUserId.value;
  const tenantLabel = selectedUserTenantName.value || selectedUserTenantId.value;

  if (tenantLabel) {
    return `目标用户：${displayName} · 租户：${tenantLabel}`;
  }

  return `目标用户：${displayName} · 系统范围`;
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

// Loads the scope-aware online-user overview used as the first layer of session management.
async function loadOnlineUsers() {
  if (!canViewUserSessions.value) {
    onlineUsers.value = [];
    return;
  }

  onlineUsersLoading.value = true;

  try {
    const result = await listAdminOnlineUsersApi({
      query: onlineUserQuery.query.trim() || undefined,
      tenantId: isPlatformScope.value
        ? onlineUserQuery.tenantId.trim() || undefined
        : effectiveTenantId.value,
      pageSize: 50,
    });

    onlineUsers.value = result.items ?? [];
  } catch (error) {
    onlineUsers.value = [];
    message.error(getErrorMessage(error, '加载在线用户失败，请稍后重试'));
  } finally {
    onlineUsersLoading.value = false;
  }
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

// Bridges the footer pagination control to the cursor-based audit navigation helpers.
async function handleAuditTableChange(pager: { current?: number; pageSize?: number }) {
  if ((pager.pageSize ?? filters.pageSize) !== filters.pageSize) {
    filters.pageSize = pager.pageSize ?? filters.pageSize;
    auditCursor.value = null;
    auditNextCursor.value = null;
    auditCursorHistory.value = [];
    await loadAuditEvents({ resetCursor: true });
    return;
  }

  const page = pager.current ?? currentAuditPage.value;

  if (page === currentAuditPage.value) {
    return;
  }

  if (page > currentAuditPage.value) {
    await loadNextAuditPage();
    return;
  }

  await loadPreviousAuditPage();
}

// Loads the selected target user's session inventory and opens the investigation drawer.
async function inspectUserSessions(params: {
  displayName?: string;
  tenantId?: string;
  tenantName?: null | string;
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
  selectedUserDisplayName.value = params.displayName ?? '';
  selectedUserTenantName.value = params.tenantName ?? '';
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
        return h('span', { class: 'session-muted-action' }, '无可用操作');
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

// Defines the first-layer online-user overview columns for administrator session management.
const onlineUserColumns: TableColumnsType<AdminSecurityApi.OnlineUser> = [
  {
    dataIndex: 'displayName',
    key: 'displayName',
    title: '用户',
    width: 220,
    customRender: ({ record }) => {
      const user = record as AdminSecurityApi.OnlineUser;
      return user.displayName || user.userId;
    },
  },
  {
    dataIndex: 'activeAccountCount',
    key: 'activeAccountCount',
    title: '在线账号数',
    width: 120,
  },
  {
    dataIndex: 'activeSessionCount',
    key: 'activeSessionCount',
    title: '在线会话数',
    width: 120,
  },
  {
    dataIndex: 'tenantNames',
    key: 'tenantNames',
    title: '可见范围',
    width: 240,
    ellipsis: true,
    customRender: ({ record }) => {
      const user = record as AdminSecurityApi.OnlineUser;
      return formatTenantSummary(user);
    },
  },
  {
    dataIndex: 'lastActiveAt',
    key: 'lastActiveAt',
    title: '最近活跃',
    width: 180,
    customRender: ({ value }) => formatTime(value as string | undefined),
  },
  {
    key: 'actions',
    title: '操作',
    width: 150,
    fixed: 'right',
    customRender: ({ record }) => {
      const user = record as AdminSecurityApi.OnlineUser;

      return h(
        Button,
        {
          size: 'small',
          type: 'link',
          onClick: () =>
            inspectUserSessions({
              displayName: user.displayName,
              tenantId: user.tenantId,
              tenantName: user.tenantName,
              userId: user.userId,
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
        return h('span', { class: 'session-muted-action' }, '无可用操作');
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

// Applies the current local session filters without pushing extra complexity into the first implementation slice.
const filteredSessionItems = computed(() => {
  const deviceQuery = sessionFilters.deviceQuery.trim().toLowerCase();
  const status = sessionFilters.status.trim().toUpperCase();

  return sessionItems.value.filter((session) => {
    if (status) {
      const sessionStatus = session.isRevoked
        ? 'REVOKED'
        : session.isAccessExpired
          ? 'EXPIRED'
          : 'ACTIVE';

      if (sessionStatus !== status) {
        return false;
      }
    }

    if (!deviceQuery) {
      return true;
    }

    return [
      session.deviceName,
      session.platform,
      session.browser,
      session.userAgent,
      session.ipAddress,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(deviceQuery));
  });
});

// Groups the filtered sessions by account so administrators can inspect one user through its active identities.
const filteredSessionGroups = computed(() => {
  const groups = new Map<
    string,
    {
      accountId?: string;
      accountName: string;
      sessions: AdminSecurityApi.Session[];
    }
  >();

  for (const session of filteredSessionItems.value) {
    const key = session.accountId || `unknown:${session.sessionId}`;
    const existing = groups.get(key);

    if (existing) {
      existing.sessions.push(session);
      continue;
    }

    groups.set(key, {
      accountId: session.accountId,
      accountName: getSessionAccountLabel(session),
      sessions: [session],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      sessions: [...group.sessions].sort((left, right) =>
        right.lastActiveAt.localeCompare(left.lastActiveAt),
      ),
    }))
    .sort((left, right) => {
      const leftLatest = left.sessions[0]?.lastActiveAt || '';
      const rightLatest = right.sessions[0]?.lastActiveAt || '';
      return rightLatest.localeCompare(leftLatest);
    });
});

onMounted(async () => {
  if (!isPlatformScope.value) {
    filters.tenantId = authContextStore.sessionContext?.tenant?.tenantId ?? '';
    onlineUserQuery.tenantId = filters.tenantId;
  }

  try {
    await loadOnlineUsers();
    await loadAuditEvents({ resetCursor: true });
  } catch {
    // Nested loaders already emit stable user-facing error state.
  }
});
</script>

<template>
  <Page auto-content-height>
    <div class="admin-session-page space-y-5 p-5">
      <Card v-if="!canListAuditEvents && !canViewUserSessions">
        <Empty description="当前账号没有管理员认证与会话管理权限" />
      </Card>

      <div
        v-access:code="['auth.audit.list', 'auth.session.admin.view']"
        v-if="canListAuditEvents || canViewUserSessions"
        class="grid gap-4 xl:grid-cols-[1.4fr_1fr]"
      >
        <Card :bordered="false" class="summary-hero">
          <div class="summary-hero__eyebrow">Admin Security Console</div>
          <div class="summary-hero__title-row">
            <div>
              <div class="summary-hero__title">认证与会话管理</div>
              <div class="summary-hero__description">
                先定位在线用户，再下钻到账号和会话；审计查询作为辅助入口保留在独立标签页。
              </div>
            </div>
            <Tag :color="isPlatformScope ? 'blue' : 'green'">
              {{ isPlatformScope ? 'System Scope' : 'Tenant Scope' }}
            </Tag>
          </div>

          <div class="summary-hero__meta">
            <span class="summary-pill">当前安全范围：{{ authContextStore.scopeLabel }}</span>
            <span class="summary-pill">主路径：在线用户 -> 账号 -> 会话</span>
            <span class="summary-pill">审计：独立标签页</span>
          </div>
        </Card>

        <div class="grid gap-4 sm:grid-cols-3">
          <Card :bordered="false" class="summary-card">
            <Statistic title="在线用户" :value="onlineUserCount" />
          </Card>
          <Card :bordered="false" class="summary-card">
            <Statistic title="在线账号" :value="onlineAccountCount" />
          </Card>
          <Card :bordered="false" class="summary-card">
            <Statistic title="在线会话" :value="onlineSessionTotal" />
          </Card>
        </div>
      </div>

      <Card
        v-access:code="['auth.audit.list', 'auth.session.admin.view']"
        v-if="canListAuditEvents || canViewUserSessions"
        :bordered="false"
        class="panel-surface"
      >
        <Tabs v-model:active-key="activeTab">
          <Tabs.TabPane key="sessions" tab="会话管理">
            <div class="space-y-4">
              <Form
                v-access:code="'auth.session.admin.view'"
                v-if="canViewUserSessions"
                layout="vertical"
                class="filter-shell"
              >
                <Row :gutter="16">
                  <Col :span="isPlatformScope ? 8 : 12">
                    <Form.Item v-if="isPlatformScope" label="租户 ID">
                      <Input
                        v-model:value="onlineUserQuery.tenantId"
                        placeholder="系统管理员可按租户收敛在线用户范围"
                      />
                    </Form.Item>
                    <Form.Item v-else label="当前租户">
                      <Input
                        :value="authContextStore.tenantName || effectiveTenantId || '-'"
                        disabled
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="isPlatformScope ? 10 : 12">
                    <Form.Item label="在线用户关键词">
                      <Input
                        v-model:value="onlineUserQuery.query"
                        placeholder="按用户、租户或范围关键词过滤"
                        @press-enter="loadOnlineUsers"
                      />
                    </Form.Item>
                  </Col>
                  <Col :span="6">
                    <Form.Item label=" " :colon="false">
                      <Space>
                        <Button type="primary" @click="loadOnlineUsers">查询</Button>
                        <Button
                          @click="
                            onlineUserQuery.query = '';
                            if (isPlatformScope) onlineUserQuery.tenantId = '';
                            loadOnlineUsers();
                          "
                        >
                          重置
                        </Button>
                      </Space>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <div class="section-caption">
                <span>在线用户总览</span>
                <span>{{ onlineUserCount }} 个用户</span>
              </div>

              <Table
                v-access:code="'auth.session.admin.view'"
                v-if="canViewUserSessions"
                :columns="onlineUserColumns"
                :data-source="onlineUsers"
                :loading="onlineUsersLoading"
                :pagination="false"
                class="clean-table"
                :row-key="(record) => record.userId"
                :scroll="{ x: 980, y: 420 }"
                size="small"
              />

              <Empty
                v-else
                description="当前账号没有查看管理员会话的权限"
              />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="audit" tab="审计">
            <div
              v-access:code="'auth.audit.list'"
              v-if="canListAuditEvents"
              class="space-y-4"
            >
              <div class="audit-toolbar">
                <div class="section-caption">
                  <span>审计事件</span>
                  <Tooltip placement="left">
                    <template #title>
                      审计查询保留在独立标签页，避免干扰管理员查看在线用户与会话主路径。
                    </template>
                    <span class="help-dot">?</span>
                  </Tooltip>
                </div>
              </div>

              <Form layout="vertical" class="filter-shell">
                <Row :gutter="[10, 10]">
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

                <Row :gutter="[10, 10]">
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
                      <div class="filter-button-pair">
                        <Button class="filter-action-button" type="primary" @click="loadAuditEvents({ resetCursor: true })">
                          查询
                        </Button>
                        <Button class="filter-action-button" @click="resetAuditFilters">重置</Button>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>

              <Table
                :columns="auditColumns"
                :data-source="auditItems"
                :loading="auditLoading"
                :pagination="auditTablePagination"
                class="clean-table"
                :row-key="(record) => record.eventId"
                :scroll="{ x: 1180, y: 520 }"
                size="small"
                @change="handleAuditTableChange"
              >
                <template #expandedRowRender="{ record }">
                  <pre class="audit-json-block">{{
                    formatAuditDetails(record.detailsJson)
                  }}</pre>
                </template>
              </Table>
            </div>

            <Empty
              v-else
              description="当前账号没有认证审计查询权限"
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>

    <Drawer
      :open="sessionDrawerOpen"
      :title="selectedUserScopeText"
      width="68%"
      @close="sessionDrawerOpen = false"
    >
      <Spin :spinning="sessionLoading">
        <div class="session-drawer-shell">
          <div class="session-drawer-hero">
            <div class="session-drawer-hero__main">
              <div class="session-drawer-hero__eyebrow">Session Inspection</div>
              <div class="session-drawer-hero__title">
                {{ selectedUserDisplayName || selectedUserId || '未选择目标用户' }}
              </div>
              <div class="session-drawer-hero__meta">
                <span class="session-drawer-meta-pill">
                  用户 ID：{{ selectedUserId || '-' }}
                </span>
                <span class="session-drawer-meta-pill">
                  范围：{{ selectedUserTenantName || selectedUserTenantId || '系统范围' }}
                </span>
              </div>
            </div>
            <Tag color="blue" class="session-drawer-hero__tag">按账号聚合查看</Tag>
          </div>

          <div class="session-drawer-stats">
            <Card size="small" :bordered="false" class="summary-card summary-card--compact">
              <Statistic title="可见账号数" :value="filteredAccountCount" />
            </Card>
            <Card size="small" :bordered="false" class="summary-card summary-card--compact">
              <Statistic title="当前有效会话" :value="activeSessionCount" />
            </Card>
            <Card size="small" :bordered="false" class="summary-card summary-card--compact">
              <Statistic title="已撤销会话" :value="revokedSessionCount" />
            </Card>
          </div>

          <Empty
            v-if="!sessionLoading && filteredSessionItems.length === 0"
            description="当前目标用户暂无可见会话"
          />

          <Form layout="vertical" class="filter-shell filter-shell--drawer">
            <div class="session-filter-header">
              <div class="session-filter-header__title">会话筛选</div>
              <div class="session-filter-header__hint">按状态、设备、浏览器或 IP 缩小列表</div>
            </div>
            <Row :gutter="16">
              <Col :span="10">
                <Form.Item label="状态">
                  <Input
                    v-model:value="sessionFilters.status"
                    placeholder="ACTIVE / REVOKED / EXPIRED"
                  />
                </Form.Item>
              </Col>
              <Col :span="10">
                <Form.Item label="设备关键词">
                  <Input
                    v-model:value="sessionFilters.deviceQuery"
                    placeholder="按设备、浏览器、平台或 IP 过滤"
                  />
                </Form.Item>
              </Col>
              <Col :span="4">
                <Form.Item label=" " :colon="false">
                  <Button
                    @click="
                      sessionFilters.status = '';
                      sessionFilters.deviceQuery = '';
                    "
                  >
                    清空
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <div v-if="filteredSessionGroups.length > 0" class="session-group-stack">
            <Card
              v-for="group in filteredSessionGroups"
              :key="group.accountId || group.accountName"
              size="small"
              :bordered="false"
              class="account-group-card"
            >
              <template #title>
                <div class="account-group-header">
                  <div class="account-group-header__main">
                    <div class="account-group-header__name">
                      {{ group.accountName }}
                    </div>
                    <div class="account-group-header__id">
                      {{ group.accountId || '未提供账号 ID' }}
                    </div>
                  </div>
                  <Tag color="blue">{{ group.sessions.length }} 个会话</Tag>
                </div>
              </template>

              <Table
                :columns="sessionColumns"
                :data-source="group.sessions"
                :pagination="false"
                class="clean-table"
                :row-key="(record) => record.sessionId"
                :scroll="{ x: 1080 }"
                size="small"
              />
            </Card>
          </div>
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
        <div class="revoke-modal-text">
          即将撤销会话：
          <span class="revoke-modal-session-id">
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

<style scoped>
.admin-session-page {
  max-width: 1440px;
  margin: 0 auto;
  --session-border: hsl(var(--border));
  --session-card-bg: hsl(var(--card));
  --session-card-bg-soft: hsl(var(--muted) / 0.55);
  --session-card-bg-strong: hsl(var(--muted) / 0.82);
  --session-card-bg-accent:
    radial-gradient(circle at top left, hsl(var(--primary) / 0.16) 0%, transparent 42%),
    linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.72) 100%);
  --session-text: hsl(var(--foreground) / 0.92);
  --session-title: hsl(var(--foreground));
  --session-muted: hsl(var(--muted-foreground));
}

.summary-hero {
  background: var(--session-card-bg-accent);
  border: 1px solid var(--session-border);
  box-shadow: 0 16px 40px rgb(15 23 42 / 0.06);
}

.summary-hero__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: hsl(var(--primary));
  margin-bottom: 12px;
}

.summary-hero__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.summary-hero__title {
  font-size: 24px;
  font-weight: 700;
  color: var(--session-title);
  line-height: 1.2;
}

.summary-hero__description {
  margin-top: 8px;
  max-width: 640px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--session-muted);
}

.summary-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--session-card-bg-soft);
  border: 1px solid var(--session-border);
  color: var(--session-text);
  font-size: 12px;
}

.help-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--session-card-bg-strong);
  color: var(--session-muted);
  font-size: 11px;
  font-weight: 700;
  cursor: help;
}

.summary-card {
  border: 1px solid var(--session-border);
  background: var(--session-card-bg);
  box-shadow: 0 10px 28px rgb(15 23 42 / 0.04);
}

.summary-card--compact {
  background: var(--session-card-bg-soft);
}

.panel-surface {
  border: 1px solid var(--session-border);
  background: var(--session-card-bg);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.filter-shell {
  padding: 12px;
  border: 1px solid var(--session-border);
  border-radius: 10px;
  background: var(--session-card-bg-soft);
}

.filter-shell :deep(.ant-form-item) {
  margin-bottom: 0;
}

.filter-shell--drawer {
  background: var(--session-card-bg-soft);
}

.session-drawer-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.session-drawer-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border: 1px solid var(--session-border);
  border-radius: 18px;
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.72) 100%);
}

.session-drawer-hero__main {
  min-width: 0;
}

.session-drawer-hero__eyebrow {
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--primary));
}

.session-drawer-hero__title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--session-title);
}

.session-drawer-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.session-drawer-meta-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--session-border);
  background: var(--session-card-bg-soft);
  font-size: 12px;
  color: var(--session-muted);
}

.session-drawer-hero__tag {
  margin-top: 2px;
}

.session-drawer-stats {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.session-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.session-filter-header__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--session-text);
}

.session-filter-header__hint {
  font-size: 12px;
  color: var(--session-muted);
}

.section-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--session-muted);
}

.audit-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.account-group-card {
  border: 1px solid var(--session-border);
  background: var(--session-card-bg);
  box-shadow: 0 10px 28px rgb(15 23 42 / 0.04);
}

.session-group-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.account-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.account-group-header__main {
  min-width: 0;
}

.account-group-header__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 700;
  color: var(--session-title);
}

.account-group-header__id {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 4px;
  font-size: 12px;
  color: var(--session-muted);
}

:deep(.clean-table .ant-table) {
  border-radius: 14px;
  overflow: hidden;
  background: transparent;
}

:deep(.clean-table .ant-table-thead > tr > th) {
  background: var(--session-card-bg-strong);
  color: var(--session-text);
  font-size: 12px;
  font-weight: 700;
}

:deep(.clean-table .ant-table-tbody > tr > td) {
  vertical-align: top;
}

:deep(.summary-card .ant-statistic-title) {
  color: var(--session-muted);
}

:deep(.summary-card .ant-statistic-content),
:deep(.summary-card .ant-statistic-content-value) {
  color: var(--session-title);
}

:deep(.filter-shell .ant-input),
:deep(.filter-shell .ant-input-affix-wrapper),
:deep(.filter-shell .ant-select-selector),
:deep(.filter-shell .ant-picker) {
  background: hsl(var(--input-background));
  border-color: hsl(var(--input));
  color: var(--session-text);
  min-height: 36px;
  border-radius: 10px;
}

:deep(.filter-shell .ant-select-selector) {
  align-items: center;
  display: flex;
}

:deep(.filter-shell .ant-input-affix-wrapper) {
  padding-top: 0;
  padding-bottom: 0;
}

.filter-button-pair {
  display: grid;
  grid-template-columns: minmax(84px, 1fr) minmax(84px, 1fr);
  gap: 8px;
  margin-left: auto;
  width: min(100%, 184px);
}

.filter-action-button {
  height: 36px;
  min-width: 0;
  width: 100%;
  border-radius: 10px;
}

.session-muted-action {
  color: var(--session-muted);
  font-size: 12px;
}

.audit-json-block {
  overflow-x: auto;
  border: 1px solid var(--session-border);
  border-radius: 12px;
  background: hsl(var(--popover));
  color: var(--session-text);
  padding: 16px;
  font-size: 12px;
  line-height: 1.6;
}

.revoke-modal-text {
  color: var(--session-muted);
  font-size: 14px;
}

.revoke-modal-session-id {
  color: var(--session-title);
  font-weight: 600;
}

:deep(.ant-tabs-nav) {
  margin-bottom: 20px;
}

@media (max-width: 960px) {
  .summary-hero__title-row,
  .audit-toolbar,
  .section-caption,
  .session-drawer-hero,
  .session-filter-header,
  .account-group-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .session-drawer-stats {
    grid-template-columns: 1fr;
  }
}
</style>
