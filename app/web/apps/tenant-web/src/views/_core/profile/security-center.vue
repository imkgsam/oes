<script setup lang="ts">
import type { SelfSecurityApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  List,
  ListItem,
  message,
  Modal,
  QRCode,
  Space,
  Statistic,
  TabPane,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  activateTotpBindingApi,
  disableMfaBindingApi,
  enableMfaBindingApi,
  initializeRecoveryCodesApi,
  initializeTotpBindingApi,
  listMfaBindingsApi,
  listSelfSessionsApi,
  logoutAllDevicesApi,
  logoutOtherDevicesApi,
  regenerateRecoveryCodesApi,
} from '#/api';
import { useAuthStore } from '#/store';
import { useAuthContextStore } from '#/store/auth-context';

const accessStore = useAccessStore();
const authStore = useAuthStore();
const authContextStore = useAuthContextStore();

const activeTab = ref('sessions');
const loading = ref(false);
const mutationLoading = ref(false);
const sessions = ref<SelfSecurityApi.Session[]>([]);
const mfaBindings = ref<SelfSecurityApi.MfaBinding[]>([]);
const totpSetup = ref<null | SelfSecurityApi.InitializeTotpResult>(null);
const totpCode = ref('');
const recoveryCodes = ref<string[]>([]);

const currentSession = computed(() =>
  sessions.value.find((session) => session.isCurrent),
);

const enabledMfaCount = computed(
  () => mfaBindings.value.filter((binding) => binding.enabled).length,
);

const activeSessions = computed(() =>
  sessions.value.filter((session) => !session.isRevoked),
);

const hasOtherSessions = computed(() =>
  sessions.value.some((session) => !session.isCurrent && !session.isRevoked),
);

const mfaTypeLabel: Record<SelfSecurityApi.MfaBindingType, string> = {
  BACKUP_CODE: '恢复码',
  EMAIL_OTP: '邮箱验证码',
  SMS_OTP: '手机验证码',
  TOTP: '认证器 App',
};

// Loads the self-service security snapshot from auth-bff.
async function loadSecuritySnapshot() {
  loading.value = true;
  try {
    const [sessionResult, mfaResult] = await Promise.all([
      listSelfSessionsApi(),
      listMfaBindingsApi(),
    ]);
    sessions.value = sessionResult.sessions ?? [];
    mfaBindings.value = mfaResult.bindings ?? [];
  } finally {
    loading.value = false;
  }
}

// Formats ISO timestamps for compact security cards.
function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

// Converts a remaining duration into a readable label.
function formatDuration(seconds?: number) {
  if (seconds === undefined || seconds < 0) {
    return '-';
  }
  if (seconds < 60) {
    return `${seconds} 秒`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} 分钟`;
  }
  if (seconds < 86_400) {
    return `${Math.floor(seconds / 3600)} 小时`;
  }
  return `${Math.floor(seconds / 86_400)} 天`;
}

// Displays the most useful browser / device label for a session.
function getSessionDeviceLabel(session: SelfSecurityApi.Session) {
  return (
    session.deviceName ||
    [session.platform, session.browser].filter(Boolean).join(' / ') ||
    session.userAgent ||
    '未知设备'
  );
}

// Returns the product label for one MFA binding.
function getMfaBindingLabel(binding: SelfSecurityApi.MfaBinding) {
  return mfaTypeLabel[binding.type] ?? binding.type;
}

// Revokes all other sessions and refreshes the session list.
function confirmLogoutOtherDevices() {
  Modal.confirm({
    centered: true,
    content: '其他设备会被立即退出，当前浏览器会保留登录状态。',
    okButtonProps: {
      disabled: !hasOtherSessions.value,
    },
    okText: '退出其他设备',
    title: '确认退出其他设备？',
    async onOk() {
      mutationLoading.value = true;
      try {
        const result = await logoutOtherDevicesApi();
        message.success(`已退出 ${result.sessionCount ?? 0} 个其他会话`);
        await loadSecuritySnapshot();
      } finally {
        mutationLoading.value = false;
      }
    },
  });
}

// Revokes all sessions and returns the user to the login page.
function confirmLogoutAllDevices() {
  Modal.confirm({
    centered: true,
    content: '所有设备都会被退出，包括当前浏览器。你需要重新登录才能继续使用。',
    okText: '全部退出',
    okType: 'danger',
    title: '确认退出全部设备？',
    async onOk() {
      mutationLoading.value = true;
      try {
        await logoutAllDevicesApi();
        message.success('已退出全部设备');
        await authStore.logout(false);
      } finally {
        mutationLoading.value = false;
      }
    },
  });
}

// Enables or disables one self-service MFA binding.
async function toggleMfaBinding(binding: SelfSecurityApi.MfaBinding) {
  mutationLoading.value = true;
  try {
    if (binding.enabled) {
      await disableMfaBindingApi(binding.type);
      message.success(`${mfaTypeLabel[binding.type]} 已停用`);
    } else {
      await enableMfaBindingApi(binding.type);
      message.success(`${mfaTypeLabel[binding.type]} 已启用`);
    }
    await loadSecuritySnapshot();
  } finally {
    mutationLoading.value = false;
  }
}

// Starts the TOTP enrollment flow and keeps the secret visible until activation.
async function initializeTotp() {
  mutationLoading.value = true;
  try {
    totpSetup.value = await initializeTotpBindingApi();
    totpCode.value = '';
    message.success('认证器初始化成功，请扫码并输入验证码完成绑定');
  } finally {
    mutationLoading.value = false;
  }
}

// Activates a pending TOTP binding.
async function activateTotp() {
  if (!totpSetup.value?.binding.bindingId || !totpCode.value.trim()) {
    message.warning('请输入认证器 App 中的验证码');
    return;
  }

  mutationLoading.value = true;
  try {
    await activateTotpBindingApi({
      bindingId: totpSetup.value.binding.bindingId,
      code: totpCode.value.trim(),
    });
    totpSetup.value = null;
    totpCode.value = '';
    message.success('认证器 App 已绑定');
    await loadSecuritySnapshot();
  } finally {
    mutationLoading.value = false;
  }
}

// Generates or rotates recovery codes and keeps them visible for the current page session.
async function refreshRecoveryCodes(initial: boolean) {
  mutationLoading.value = true;
  try {
    const result = initial
      ? await initializeRecoveryCodesApi()
      : await regenerateRecoveryCodesApi();
    recoveryCodes.value = result.recoveryCodes ?? [];
    message.success(initial ? '恢复码已生成' : '恢复码已重新生成');
    await loadSecuritySnapshot();
  } finally {
    mutationLoading.value = false;
  }
}

onMounted(() => {
  void loadSecuritySnapshot().catch(() => {
    sessions.value = [];
    mfaBindings.value = [];
  });
});
</script>

<template>
  <div class="space-y-5 p-5">
    <div class="grid gap-4 md:grid-cols-3">
      <Card :bordered="false">
        <Statistic title="当前安全范围" :value="authContextStore.scopeLabel" />
        <p class="mt-3 text-sm text-gray-500">
          {{ authContextStore.accountName || authContextStore.operatorName || '当前账号' }}
        </p>
      </Card>
      <Card :bordered="false">
        <Statistic title="有效会话" :value="activeSessions.length" />
        <p class="mt-3 text-sm text-gray-500">
          当前会话：{{ currentSession?.sessionId || '-' }}
        </p>
      </Card>
      <Card :bordered="false">
        <Statistic title="已启用 MFA" :value="enabledMfaCount" />
        <p class="mt-3 text-sm text-gray-500">
          权限码：{{ accessStore.accessCodes.length }} 项
        </p>
      </Card>
    </div>

    <Card :bordered="false">
      <Tabs v-model:active-key="activeTab">
        <TabPane key="sessions" tab="会话管理">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Alert
              class="min-w-0 flex-1"
              message="这里只管理当前登录用户自己的设备会话。管理员代管会话属于另一组后台安全接口。"
              show-icon
              type="info"
            />
            <Space>
              <Button :loading="loading" @click="loadSecuritySnapshot">
                刷新
              </Button>
              <Button
                :disabled="!hasOtherSessions"
                :loading="mutationLoading"
                @click="confirmLogoutOtherDevices"
              >
                退出其他设备
              </Button>
              <Button
                danger
                :loading="mutationLoading"
                @click="confirmLogoutAllDevices"
              >
                全部退出
              </Button>
            </Space>
          </div>

          <Empty v-if="!loading && sessions.length === 0" description="暂无会话数据" />
          <List
            v-else
            :data-source="sessions"
            :loading="loading"
            class="max-h-[560px] overflow-auto"
          >
            <template #renderItem="{ item }">
              <ListItem>
                <div class="w-full rounded-lg border border-gray-100 p-4">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-medium">
                          {{ getSessionDeviceLabel(item) }}
                        </span>
                        <Tag v-if="item.isCurrent" color="blue">当前设备</Tag>
                        <Tag v-if="item.isRevoked" color="red">已撤销</Tag>
                        <Tag v-else color="green">{{ item.status }}</Tag>
                      </div>
                      <div class="mt-2 text-sm text-gray-500">
                        {{ item.ipAddress || '未知 IP' }} ·
                        {{ item.loginMethod }} ·
                        最后活跃 {{ formatDateTime(item.lastActiveAt) }}
                      </div>
                    </div>
                    <div class="text-right text-sm text-gray-500">
                      <div>Access 剩余 {{ formatDuration(item.accessRemainingSeconds) }}</div>
                      <div>Refresh 剩余 {{ formatDuration(item.refreshRemainingSeconds) }}</div>
                    </div>
                  </div>
                  <div class="mt-3 grid gap-2 text-xs text-gray-500 md:grid-cols-3">
                    <span>创建：{{ formatDateTime(item.createdAt) }}</span>
                    <span>Access 到期：{{ formatDateTime(item.expiresAt) }}</span>
                    <span>Refresh 到期：{{ formatDateTime(item.refreshExpiresAt) }}</span>
                  </div>
                </div>
              </ListItem>
            </template>
          </List>
        </TabPane>

        <TabPane key="mfa" tab="MFA 与恢复码">
          <div class="grid gap-4 lg:grid-cols-[1fr_380px]">
            <div class="space-y-4">
              <Alert
                message="当前页面只启停已登录用户自己的 MFA 绑定。安全策略、强制 MFA 和管理员审计后续由独立后台页面承接。"
                show-icon
                type="info"
              />

              <Empty
                v-if="!loading && mfaBindings.length === 0"
                description="暂无 MFA 绑定数据"
              />
              <List v-else :data-source="mfaBindings" :loading="loading">
                <template #renderItem="{ item }">
                  <ListItem>
                    <div class="w-full rounded-lg border border-gray-100 p-4">
                      <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="font-medium">
                              {{ getMfaBindingLabel(item) }}
                            </span>
                            <Tag v-if="item.enabled" color="green">已启用</Tag>
                            <Tag v-else color="default">未启用</Tag>
                            <Tag v-if="!item.available" color="orange">
                              暂不可用
                            </Tag>
                          </div>
                          <div class="mt-2 text-sm text-gray-500">
                            {{ item.destination || '未提供绑定目标' }}
                            <span v-if="item.updatedAt">
                              · 更新于 {{ formatDateTime(item.updatedAt) }}
                            </span>
                          </div>
                        </div>
                        <Button
                          :disabled="!item.available"
                          :loading="mutationLoading"
                          @click="toggleMfaBinding(item)"
                        >
                          {{ item.enabled ? '停用' : '启用' }}
                        </Button>
                      </div>
                    </div>
                  </ListItem>
                </template>
              </List>
            </div>

            <div class="space-y-4">
              <Card title="认证器 App">
                <Space direction="vertical" class="w-full" size="middle">
                  <Button
                    block
                    :loading="mutationLoading"
                    type="primary"
                    @click="initializeTotp"
                  >
                    初始化 TOTP 绑定
                  </Button>
                  <div v-if="totpSetup" class="space-y-3">
                    <QRCode :value="totpSetup.qrCodeUrl" />
                    <div class="break-all rounded bg-gray-50 p-2 text-xs text-gray-500">
                      Secret：{{ totpSetup.secret }}
                    </div>
                    <Input
                      v-model:value="totpCode"
                      :maxlength="64"
                      placeholder="请输入认证器验证码"
                    />
                    <Button
                      block
                      :loading="mutationLoading"
                      @click="activateTotp"
                    >
                      完成绑定
                    </Button>
                  </div>
                </Space>
              </Card>

              <Card title="恢复码">
                <Space direction="vertical" class="w-full" size="middle">
                  <Space wrap>
                    <Button
                      :loading="mutationLoading"
                      @click="refreshRecoveryCodes(true)"
                    >
                      初始化恢复码
                    </Button>
                    <Button
                      danger
                      :loading="mutationLoading"
                      @click="refreshRecoveryCodes(false)"
                    >
                      重新生成
                    </Button>
                  </Space>
                  <Alert
                    message="恢复码只在生成后展示，请妥善保存。"
                    show-icon
                    type="warning"
                  />
                  <div
                    v-if="recoveryCodes.length > 0"
                    class="grid grid-cols-2 gap-2"
                  >
                    <code
                      v-for="code in recoveryCodes"
                      :key="code"
                      class="rounded bg-gray-50 px-3 py-2 text-center text-sm"
                    >
                      {{ code }}
                    </code>
                  </div>
                </Space>
              </Card>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
