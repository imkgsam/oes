<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, Checkbox, Empty, message, Modal, Switch, Tag } from 'ant-design-vue';

import {
  type AdminSecurityApi,
  getAdminTenantTerminalMfaPolicyApi,
  updateAdminTenantTerminalMfaPolicyApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';

import { getTenantMfaFactorLabel } from './login-mfa-settings.helpers';
import {
  type TerminalMfaFactorCode,
  getTerminalLabel,
  getTerminalMfaSourceLabel,
  orderTerminalEntries,
  requiresTerminalMfaOperationalConfirmation,
} from './terminal-security-settings.helpers';

type TerminalMfaEntry = AdminSecurityApi.TerminalMfaPolicyEntry;

const MFA_FACTORS: TerminalMfaFactorCode[] = [
  'EMAIL_OTP',
  'SMS_OTP',
  'TOTP',
  'BACKUP_CODE',
];

const authContextStore = useAuthContextStore();

const canManageTenantMfa = computed(() =>
  authContextStore.actionCodes.includes('auth.mfa_policy.manage'),
);
const hasTenantContext = computed(() =>
  authContextStore.sessionContext?.scopeLevel === 'TENANT',
);
const loading = ref(false);
const saving = ref(false);
const tenantId = ref('');
const entries = ref<TerminalMfaEntry[]>([]);

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

// Loads the current tenant-effective terminal MFA policy into the tenant settings page.
async function loadTenantTerminalMfaPolicy() {
  if (!hasTenantContext.value || !canManageTenantMfa.value) {
    tenantId.value = '';
    entries.value = [];
    return;
  }

  loading.value = true;

  try {
    const policy = await getAdminTenantTerminalMfaPolicyApi();
    tenantId.value = policy.tenantId;
    entries.value = orderTerminalEntries(policy.entries ?? []);
  } catch (error) {
    tenantId.value = '';
    entries.value = [];
    message.error(getErrorMessage(error, '加载租户终端 MFA 配置失败'));
  } finally {
    loading.value = false;
  }
}

// Rewrites one terminal MFA switch while preserving auth-service owned policy shape.
function updateMfaEntry(
  terminal: string,
  patch: Pick<TerminalMfaEntry, 'loginMfaRequired'> | Pick<TerminalMfaEntry, 'newDeviceMfaRequired'>,
) {
  entries.value = entries.value.map((entry) =>
    entry.terminal === terminal
      ? {
          ...entry,
          ...patch,
        }
      : entry,
  );
}

// Replaces allowed MFA factors and keeps the saved priority list aligned with the selected factors.
function updateAllowedFactors(terminal: string, factors: string[]) {
  const nextFactors = MFA_FACTORS.filter((factor) => factors.includes(factor));
  entries.value = entries.value.map((entry) =>
    entry.terminal === terminal
      ? {
          ...entry,
          allowedFactors: nextFactors,
          factorPriority: [
            ...entry.factorPriority.filter((factor) => nextFactors.includes(factor)),
            ...nextFactors.filter((factor) => !entry.factorPriority.includes(factor)),
          ],
        }
      : entry,
  );
}

// Wraps Ant Design's confirmation modal as an awaitable guard for high-throughput terminal changes.
function confirmOperationalImpact() {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      content: 'PDA / Kiosk 是一线高频操作入口，开启 MFA 可能明显增加登录耗时。',
      okText: '确认保存',
      onCancel: () => resolve(false),
      onOk: () => resolve(true),
      title: '确认保存终端 MFA 策略',
    });
  });
}

// Persists tenant terminal MFA overrides and marks PDA/KIOSK MFA enablement as explicitly confirmed.
async function saveTenantTerminalMfaPolicy() {
  const requiresConfirmation = requiresTerminalMfaOperationalConfirmation(entries.value);

  if (requiresConfirmation && !(await confirmOperationalImpact())) {
    return;
  }

  saving.value = true;

  try {
    const policy = await updateAdminTenantTerminalMfaPolicyApi({
      confirmOperationalImpact: requiresConfirmation || undefined,
      entries: entries.value.map((entry) => ({
        allowedFactors: entry.allowedFactors,
        factorPriority: entry.factorPriority,
        loginMfaRequired: entry.loginMfaRequired,
        newDeviceMfaRequired: entry.newDeviceMfaRequired,
        terminal: entry.terminal,
      })),
    });
    tenantId.value = policy.tenantId;
    entries.value = orderTerminalEntries(policy.entries ?? []);
    message.success('租户终端 MFA 配置已更新');
  } catch (error) {
    message.error(getErrorMessage(error, '保存租户终端 MFA 配置失败'));
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void loadTenantTerminalMfaPolicy();
});
</script>

<template>
  <Page auto-content-height title="终端 MFA 配置">
    <div class="terminal-mfa-page">
      <Card :bordered="false" class="terminal-mfa__panel">
        <div class="terminal-mfa__header">
          <div>
            <div class="terminal-mfa__title">终端 MFA 配置</div>
            <div class="terminal-mfa__description">
              按 terminal 管理当前租户的 MFA 要求，未覆盖时展示平台默认来源。
            </div>
          </div>
          <Tag color="green">Tenant</Tag>
        </div>

        <div
          v-if="!hasTenantContext || !canManageTenantMfa"
          class="terminal-mfa__empty"
        >
          <Empty description="当前上下文暂不支持管理终端 MFA 配置" />
        </div>

        <div v-else-if="loading" class="terminal-mfa__empty">
          正在加载终端 MFA 配置...
        </div>

        <div v-else class="terminal-mfa__content">
          <div class="terminal-mfa__toolbar">
            <div class="terminal-mfa__meta">
              Tenant ID: {{ tenantId || '-' }}
            </div>
            <Button :loading="saving" type="primary" @click="saveTenantTerminalMfaPolicy">
              <template #icon>
                <IconifyIcon icon="lucide:save" />
              </template>
              保存配置
            </Button>
          </div>

          <div class="terminal-mfa__terminal-list">
            <div
              v-for="entry in entries"
              :key="entry.terminal"
              class="terminal-mfa__terminal-row"
            >
              <div class="terminal-mfa__terminal-head">
                <div>
                  <div class="terminal-mfa__terminal-name">
                    {{ getTerminalLabel(entry.terminal) }}
                  </div>
                  <div class="terminal-mfa__meta">
                    来源：{{ getTerminalMfaSourceLabel(entry.source) }}
                  </div>
                </div>
                <Tag :color="entry.source === 'TENANT_OVERRIDE' ? 'blue' : 'default'">
                  {{ getTerminalMfaSourceLabel(entry.source) }}
                </Tag>
              </div>

              <div class="terminal-mfa__controls">
                <label class="terminal-mfa__switch-row">
                  <span>登录 MFA</span>
                  <Switch
                    :checked="entry.loginMfaRequired"
                    @update:checked="(checked) => updateMfaEntry(entry.terminal, { loginMfaRequired: Boolean(checked) })"
                  />
                </label>
                <label class="terminal-mfa__switch-row">
                  <span>新设备 MFA</span>
                  <Switch
                    :checked="entry.newDeviceMfaRequired"
                    @update:checked="(checked) => updateMfaEntry(entry.terminal, { newDeviceMfaRequired: Boolean(checked) })"
                  />
                </label>
              </div>

              <div class="terminal-mfa__factor-block">
                <div class="terminal-mfa__factor-title">允许因子</div>
                <Checkbox.Group
                  :value="entry.allowedFactors"
                  class="terminal-mfa__factor-group"
                  @change="(factors) => updateAllowedFactors(entry.terminal, factors as string[])"
                >
                  <Checkbox
                    v-for="factor in MFA_FACTORS"
                    :key="factor"
                    :value="factor"
                  >
                    {{ getTenantMfaFactorLabel(factor) }}
                  </Checkbox>
                </Checkbox.Group>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.terminal-mfa-page {
  --terminal-mfa-border: hsl(var(--border) / 0.9);
  --terminal-mfa-muted: hsl(var(--muted-foreground));
  --terminal-mfa-surface: hsl(var(--card));
  --terminal-mfa-surface-soft: hsl(var(--muted) / 0.54);
  --terminal-mfa-text: hsl(var(--foreground) / 0.92);
}

.terminal-mfa__panel :deep(.ant-card-body) {
  display: grid;
  gap: 22px;
  padding: 24px;
}

.terminal-mfa__header,
.terminal-mfa__toolbar,
.terminal-mfa__terminal-head,
.terminal-mfa__controls,
.terminal-mfa__switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.terminal-mfa__header {
  padding: 20px 22px;
  border: 1px solid var(--terminal-mfa-border);
  border-radius: 8px;
  background: var(--terminal-mfa-surface-soft);
}

.terminal-mfa__title {
  color: var(--terminal-mfa-text);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0;
}

.terminal-mfa__description,
.terminal-mfa__meta {
  color: var(--terminal-mfa-muted);
  font-size: 13px;
  line-height: 1.6;
}

.terminal-mfa__content,
.terminal-mfa__terminal-list,
.terminal-mfa__terminal-row,
.terminal-mfa__factor-block {
  display: grid;
  gap: 14px;
}

.terminal-mfa__terminal-row {
  padding: 16px;
  border: 1px solid var(--terminal-mfa-border);
  border-radius: 8px;
  background: var(--terminal-mfa-surface);
}

.terminal-mfa__terminal-name,
.terminal-mfa__factor-title {
  color: var(--terminal-mfa-text);
  font-size: 14px;
  font-weight: 650;
}

.terminal-mfa__controls {
  justify-content: flex-start;
}

.terminal-mfa__switch-row {
  min-width: 170px;
  color: var(--terminal-mfa-text);
  font-size: 13px;
}

.terminal-mfa__factor-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.terminal-mfa__empty {
  padding: 32px;
  color: var(--terminal-mfa-muted);
  text-align: center;
}

@media (max-width: 768px) {
  .terminal-mfa__header,
  .terminal-mfa__toolbar,
  .terminal-mfa__terminal-head,
  .terminal-mfa__controls,
  .terminal-mfa__switch-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .terminal-mfa__switch-row {
    width: 100%;
  }
}
</style>

