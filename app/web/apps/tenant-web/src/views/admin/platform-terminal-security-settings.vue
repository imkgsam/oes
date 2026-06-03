<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, Empty, message, Modal, Select, Switch, Tag } from 'ant-design-vue';

import {
  type AdminSecurityApi,
  getAdminPlatformTerminalLoginPolicyApi,
  getAdminPlatformTerminalMfaPolicyApi,
  updateAdminPlatformTerminalLoginPolicyApi,
  updateAdminPlatformTerminalMfaPolicyApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';

import {
  getTerminalLabel,
  getTerminalLoginFlowLabel,
  getTerminalMfaSourceLabel,
  orderTerminalEntries,
  requiresTerminalMfaOperationalConfirmation,
} from './terminal-security-settings.helpers';

type TerminalLoginEntry = AdminSecurityApi.TerminalLoginPolicyEntry;
type TerminalMfaEntry = AdminSecurityApi.TerminalMfaPolicyEntry;

const authContextStore = useAuthContextStore();

const canManagePlatformSecurity = computed(() =>
  authContextStore.actionCodes.includes('auth.platform_mfa_policy.manage'),
);
const hasPlatformContext = computed(() =>
  authContextStore.sessionContext?.scopeLevel === 'SYSTEM',
);
const loading = ref(false);
const savingLoginPolicy = ref(false);
const savingMfaPolicy = ref(false);
const loginEntries = ref<TerminalLoginEntry[]>([]);
const mfaEntries = ref<TerminalMfaEntry[]>([]);
const savingTerminalSecurity = computed(
  () => savingLoginPolicy.value || savingMfaPolicy.value,
);

// Normalizes terminal login rows so rendering remains stable across partial mutation responses.
function normalizeLoginEntries(entries: TerminalLoginEntry[]) {
  return orderTerminalEntries(
    entries.map((entry) => ({
      ...entry,
      enabledLoginFlows: entry.enabledLoginFlows ?? [],
      supportedLoginFlows: entry.supportedLoginFlows ?? [],
    })),
  );
}

// Normalizes terminal MFA rows so factor controls remain stable across partial mutation responses.
function normalizeMfaEntries(entries: TerminalMfaEntry[]) {
  return orderTerminalEntries(
    entries.map((entry) => ({
      ...entry,
      allowedFactors: entry.allowedFactors ?? [],
      factorPriority: entry.factorPriority ?? [],
    })),
  );
}

// Normalizes one unknown request failure into a stable user-facing message.
function getErrorMessage(error: unknown, fallback: string) {
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

// Loads platform-owned terminal login policy and terminal MFA defaults for the system admin page.
async function loadPlatformTerminalSecurity() {
  if (!hasPlatformContext.value || !canManagePlatformSecurity.value) {
    loginEntries.value = [];
    mfaEntries.value = [];
    return;
  }

  loading.value = true;

  try {
    const [loginPolicy, mfaPolicy] = await Promise.all([
      getAdminPlatformTerminalLoginPolicyApi(),
      getAdminPlatformTerminalMfaPolicyApi(),
    ]);
    loginEntries.value = normalizeLoginEntries(loginPolicy.entries ?? []);
    mfaEntries.value = normalizeMfaEntries(mfaPolicy.entries ?? []);
  } catch (error) {
    loginEntries.value = [];
    mfaEntries.value = [];
    message.error(getErrorMessage(error, '加载平台 Terminal 登录策略失败'));
  } finally {
    loading.value = false;
  }
}

// Replaces the enabled login-flow allowlist for one fixed terminal entry.
function updateLoginFlows(terminal: string, flows: string[]) {
  loginEntries.value = loginEntries.value.map((entry) =>
    entry.terminal === terminal
      ? {
          ...entry,
          enabledLoginFlows: flows,
        }
      : entry,
  );
}

// Builds compact select options for one terminal's supported login flows.
function getLoginFlowOptions(entry: TerminalLoginEntry) {
  return entry.supportedLoginFlows.map((flow) => ({
    label: getTerminalLoginFlowLabel(flow),
    value: flow,
  }));
}

// Rewrites one terminal MFA switch while preserving the current factor order returned by auth-service.
function updateMfaEntry(
  terminal: string,
  patch: Pick<TerminalMfaEntry, 'loginMfaRequired'> | Pick<TerminalMfaEntry, 'newDeviceMfaRequired'>,
) {
  mfaEntries.value = mfaEntries.value.map((entry) =>
    entry.terminal === terminal
      ? {
          ...entry,
          ...patch,
        }
      : entry,
  );
}

// Wraps Ant Design's confirmation modal as an awaitable guard for high-impact policy saves.
function confirmDangerousSave(options: { content: string; title: string }) {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      content: options.content,
      okText: '确认保存',
      onCancel: () => resolve(false),
      onOk: () => resolve(true),
      title: options.title,
    });
  });
}

// Persists both platform terminal login policy groups behind one page-level save action.
async function savePlatformTerminalSecurity() {
  const hasDisabledTerminal = loginEntries.value.some(
    (entry) => entry.enabledLoginFlows.length === 0,
  );
  const requiresConfirmation = requiresTerminalMfaOperationalConfirmation(
    mfaEntries.value,
  );
  const confirmationMessages: string[] = [];

  if (hasDisabledTerminal) {
    confirmationMessages.push(
      '至少一个 terminal 将没有任何可用登录流程，命中该入口的用户将无法继续登录。',
    );
  }

  if (requiresConfirmation) {
    confirmationMessages.push(
      'PDA / Kiosk 是一线高频操作入口，开启 MFA 可能明显增加登录耗时。',
    );
  }

  if (
    confirmationMessages.length > 0 &&
    !(await confirmDangerousSave({
      content: confirmationMessages.join(' '),
      title: '确认保存平台 Terminal 登录策略',
    }))
  ) {
    return;
  }

  savingLoginPolicy.value = true;
  savingMfaPolicy.value = true;

  try {
    const loginPolicy = await updateAdminPlatformTerminalLoginPolicyApi({
      entries: loginEntries.value.map((entry) => ({
        enabledLoginFlows: entry.enabledLoginFlows,
        terminal: entry.terminal,
      })),
    });
    const mfaPolicy = await updateAdminPlatformTerminalMfaPolicyApi({
      confirmOperationalImpact: requiresConfirmation || undefined,
      entries: mfaEntries.value.map((entry) => ({
        allowedFactors: entry.allowedFactors,
        factorPriority: entry.factorPriority,
        loginMfaRequired: entry.loginMfaRequired,
        newDeviceMfaRequired: entry.newDeviceMfaRequired,
        terminal: entry.terminal,
      })),
    });
    loginEntries.value = normalizeLoginEntries(loginPolicy.entries ?? []);
    mfaEntries.value = normalizeMfaEntries(mfaPolicy.entries ?? []);
    message.success('平台 Terminal 登录策略已保存');
  } catch (error) {
    message.error(getErrorMessage(error, '保存平台 Terminal 登录策略失败'));
  } finally {
    savingLoginPolicy.value = false;
    savingMfaPolicy.value = false;
  }
}

onMounted(() => {
  void loadPlatformTerminalSecurity();
});
</script>

<template>
  <Page auto-content-height title="平台 Terminal 登录策略">
    <div class="terminal-security-page">
      <Card :bordered="false" class="terminal-security__panel">
        <div
          v-if="hasPlatformContext && canManagePlatformSecurity"
          class="terminal-security__page-actions"
        >
          <Button
            :disabled="loading"
            :loading="savingTerminalSecurity"
            class="terminal-security__save-button"
            type="primary"
            @click="savePlatformTerminalSecurity"
          >
            <template #icon>
              <IconifyIcon icon="lucide:save" />
            </template>
            保存配置
          </Button>
        </div>

        <div class="terminal-security__header">
          <div>
            <div class="terminal-security__title">平台 Terminal 登录策略</div>
            <div class="terminal-security__description">
              管理全平台 terminal 登录流，以及各 terminal 登录入口是否要求 MFA。
            </div>
          </div>
          <Tag color="blue">Platform</Tag>
        </div>

        <div
          v-if="!hasPlatformContext || !canManagePlatformSecurity"
          class="terminal-security__empty"
        >
          <Empty description="当前上下文暂不支持管理平台 Terminal 登录策略" />
        </div>

        <div v-else-if="loading" class="terminal-security__empty">
          正在加载平台 Terminal 登录策略...
        </div>

        <div v-else class="terminal-security__content">
          <section class="terminal-security__section">
            <div class="terminal-security__section-head">
              <div>
                <div class="terminal-security__section-title">Terminal 登录入口</div>
                <div class="terminal-security__meta">
                  这里只控制固定前端入口可使用哪些已实现登录流，不配置租户级主登录方式。
                </div>
              </div>
            </div>

            <div class="terminal-security__terminal-list">
              <div
                v-for="entry in loginEntries"
                :key="entry.terminal"
                class="terminal-security__terminal-row"
              >
                <div class="terminal-security__terminal-main">
                  <div class="terminal-security__terminal-name">
                    {{ getTerminalLabel(entry.terminal) }}
                  </div>
                  <div class="terminal-security__meta">
                    {{ entry.enabledLoginFlows.length }} / {{ entry.supportedLoginFlows.length }}
                    个登录流已启用
                  </div>
                </div>
                <Select
                  :value="entry.enabledLoginFlows"
                  :max-tag-count="'responsive'"
                  :options="getLoginFlowOptions(entry)"
                  class="terminal-security__flow-group"
                  mode="multiple"
                  placeholder="选择允许的登录流"
                  @change="(flows) => updateLoginFlows(entry.terminal, flows as string[])"
                />
              </div>
            </div>
          </section>

          <section class="terminal-security__section">
            <div class="terminal-security__section-head">
              <div>
                <div class="terminal-security__section-title">Terminal 登录 MFA</div>
                <div class="terminal-security__meta">
                  这里只决定各 terminal 登录入口是否触发 MFA；实际可用因子取决于当前账号 scope 的 MFA 配置。
                </div>
              </div>
            </div>

            <div class="terminal-security__mfa-grid">
              <div
                v-for="entry in mfaEntries"
                :key="entry.terminal"
                class="terminal-security__mfa-row"
              >
                <div class="terminal-security__mfa-main">
                  <div class="terminal-security__terminal-name">
                    {{ getTerminalLabel(entry.terminal) }}
                  </div>
                  <div class="terminal-security__meta">
                    {{ getTerminalMfaSourceLabel(entry.source) }}
                  </div>
                </div>
                <div class="terminal-security__switch-stack">
                  <label class="terminal-security__switch-row">
                    <span>登录 MFA</span>
                    <Switch
                      :checked="entry.loginMfaRequired"
                      @update:checked="(checked) => updateMfaEntry(entry.terminal, { loginMfaRequired: Boolean(checked) })"
                    />
                  </label>
                  <label class="terminal-security__switch-row">
                    <span>新设备 MFA</span>
                    <Switch
                      :checked="entry.newDeviceMfaRequired"
                      @update:checked="(checked) => updateMfaEntry(entry.terminal, { newDeviceMfaRequired: Boolean(checked) })"
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.terminal-security-page {
  --terminal-security-border: hsl(var(--border) / 0.9);
  --terminal-security-muted: hsl(var(--muted-foreground));
  --terminal-security-surface: hsl(var(--card));
  --terminal-security-surface-soft: hsl(var(--muted) / 0.54);
  --terminal-security-text: hsl(var(--foreground) / 0.92);
}

.terminal-security__panel :deep(.ant-card-body) {
  display: grid;
  gap: 22px;
  padding: 24px;
}

.terminal-security__page-actions {
  display: flex;
  justify-content: flex-end;
}

.terminal-security__save-button {
  width: auto;
}

.terminal-security__header,
.terminal-security__section-head,
.terminal-security__terminal-row,
.terminal-security__mfa-row,
.terminal-security__switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.terminal-security__header {
  padding: 20px 22px;
  border: 1px solid var(--terminal-security-border);
  border-radius: 8px;
  background: var(--terminal-security-surface-soft);
}

.terminal-security__title {
  color: var(--terminal-security-text);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0;
}

.terminal-security__description,
.terminal-security__meta {
  color: var(--terminal-security-muted);
  font-size: 13px;
  line-height: 1.6;
}

.terminal-security__content,
.terminal-security__section,
.terminal-security__terminal-list,
.terminal-security__mfa-grid,
.terminal-security__switch-stack {
  display: grid;
  gap: 14px;
}

.terminal-security__terminal-list,
.terminal-security__mfa-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
}

.terminal-security__section {
  padding-top: 4px;
}

.terminal-security__section-title,
.terminal-security__terminal-name {
  color: var(--terminal-security-text);
  font-size: 14px;
  font-weight: 650;
}

.terminal-security__terminal-row,
.terminal-security__mfa-row {
  min-height: 86px;
  padding: 16px;
  border: 1px solid var(--terminal-security-border);
  border-radius: 8px;
  background: var(--terminal-security-surface);
}

.terminal-security__terminal-row {
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 132px;
}

.terminal-security__mfa-row {
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 132px;
}

.terminal-security__terminal-main {
  min-width: 0;
  width: 100%;
}

.terminal-security__mfa-main {
  min-width: 0;
  width: 100%;
}

.terminal-security__flow-group {
  width: 100%;
}

.terminal-security__switch-stack {
  min-width: 0;
  width: 100%;
}

.terminal-security__switch-row {
  color: var(--terminal-security-text);
  font-size: 13px;
}

.terminal-security__empty {
  padding: 32px;
  color: var(--terminal-security-muted);
  text-align: center;
}

@media (max-width: 768px) {
  .terminal-security__header,
  .terminal-security__section-head,
  .terminal-security__terminal-row,
  .terminal-security__mfa-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .terminal-security__flow-group {
    width: 100%;
  }

  .terminal-security__switch-stack {
    width: 100%;
  }
}
</style>
