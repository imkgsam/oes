<script lang="ts" setup>
import type { Sortable } from '@vben/hooks';

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useSortable } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, Col, Empty, message, Row, Switch, Tooltip } from 'ant-design-vue';

import {
  getAdminTenantMfaPolicyApi,
  updateAdminTenantMfaPolicyApi,
} from '#/api';
import { useAuthContextStore } from '#/store/auth-context';

import {
  getTenantMfaFactorLabel,
  getTenantMfaFactorTooltip,
  getTenantMfaScenarioLabel,
  getTenantMfaScenarioTooltip,
  orderTenantMfaScenarioRequirements,
  reorderTenantMfaFactors,
  type TenantMfaScenarioCode,
  type TenantMfaScenarioRequirementItem,
} from './login-mfa-settings.helpers';

type TenantMfaFactorCode = 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP';

interface TenantMfaFactorItem {
  enabled: boolean;
  factor: TenantMfaFactorCode;
  priority: number;
}

interface TenantMfaPolicyState {
  factors: TenantMfaFactorItem[];
  loginRequired: boolean;
  scenarioRequirements: TenantMfaScenarioRequirementItem[];
  tenantId: string;
}

interface SortableEndEvent {
  newIndex?: number;
  oldIndex?: number;
}

const authContextStore = useAuthContextStore();

const canManageLoginMfa = computed(() =>
  authContextStore.actionCodes.includes('auth.mfa_policy.manage'),
);
const hasTenantContext = computed(() =>
  authContextStore.sessionContext?.scopeLevel === 'TENANT',
);
const tenantMfaLoading = ref(false);
const tenantMfaSaving = ref(false);
const loginRequired = ref(false);
const scenarioRequirements = ref<TenantMfaScenarioRequirementItem[]>([]);
const editableFactors = ref<TenantMfaFactorItem[]>([]);
const factorListRef = ref<HTMLElement | null>(null);
const sortableInstance = ref<null | Sortable>(null);
const editableScenarioRows = computed(() =>
  orderTenantMfaScenarioRequirements(
    scenarioRequirements.value.map((item) =>
      item.scenario === 'LOGIN'
        ? {
            ...item,
            required: loginRequired.value,
          }
        : item,
    ),
  ),
);

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

// Syncs one loaded tenant MFA policy snapshot into the editable view state.
function applyTenantMfaPolicy(policy: TenantMfaPolicyState) {
  const orderedScenarioRequirements = orderTenantMfaScenarioRequirements(
    policy.scenarioRequirements ?? [],
  );
  loginRequired.value = orderedScenarioRequirements.find(
    (item) => item.scenario === 'LOGIN',
  )?.required ?? policy.loginRequired;
  scenarioRequirements.value = orderedScenarioRequirements;
  editableFactors.value = reorderTenantMfaFactors(
    policy.factors ?? [],
    -1,
    -1,
  );
}

// Handles one factor drag completion and rewrites priorities into a contiguous order.
function handleFactorDragEnd(event: SortableEndEvent) {
  const oldIndex = event.oldIndex ?? -1;
  const newIndex = event.newIndex ?? -1;

  editableFactors.value = reorderTenantMfaFactors(
    editableFactors.value,
    oldIndex,
    newIndex,
  );
}

// Creates the sortable row behavior used by the tenant MFA factor priority list.
async function initFactorSortable() {
  sortableInstance.value?.destroy();
  sortableInstance.value = null;

  if (!factorListRef.value || editableFactors.value.length === 0) {
    return;
  }

  const { initializeSortable } = useSortable(factorListRef.value, {
    animation: 180,
    draggable: '.login-mfa-settings__factor-row',
    fallbackOnBody: true,
    forceFallback: true,
    ghostClass: 'login-mfa-settings__factor-row--ghost',
    handle: '.login-mfa-settings__drag-handle',
    onEnd: (event) => handleFactorDragEnd(event),
  });

  sortableInstance.value = await initializeSortable();
}

// Loads the current tenant MFA governance snapshot for the dedicated tenant settings page.
async function loadTenantMfaPolicy() {
  if (!hasTenantContext.value || !canManageLoginMfa.value) {
    loginRequired.value = false;
    editableFactors.value = [];
    return;
  }

  tenantMfaLoading.value = true;

  try {
    const policy = await getAdminTenantMfaPolicyApi();
    applyTenantMfaPolicy(policy);
  } catch (error) {
    editableFactors.value = [];
    message.error(getErrorMessage(error, '加载租户 MFA 配置失败'));
  } finally {
    tenantMfaLoading.value = false;
  }

  await nextTick();
  await initFactorSortable();
}

// Persists the current tenant login MFA toggle and factor ordering back to the admin-security API.
async function saveTenantMfaPolicy() {
  tenantMfaSaving.value = true;

  try {
    const policy = await updateAdminTenantMfaPolicyApi({
      factors: editableFactors.value.map((factor, index) => ({
        ...factor,
        priority: index + 1,
      })),
      loginRequired: loginRequired.value,
      scenarioRequirements: orderTenantMfaScenarioRequirements(
        scenarioRequirements.value.map((item) =>
          item.scenario === 'LOGIN'
            ? {
                ...item,
                required: loginRequired.value,
              }
            : item,
        ),
      ),
    });
    applyTenantMfaPolicy(policy);
    await nextTick();
    await initFactorSortable();
    message.success('租户 MFA 配置已更新');
  } catch (error) {
    message.error(getErrorMessage(error, '保存租户 MFA 配置失败'));
  } finally {
    tenantMfaSaving.value = false;
  }
}

// Rewrites one scenario switch while keeping LOGIN mirrored into the dedicated loginRequired field.
function updateScenarioRequirement(
  scenario: TenantMfaScenarioRequirementItem['scenario'],
  required: boolean,
) {
  if (scenario === 'LOGIN') {
    loginRequired.value = required;
  }

  const existing = new Map(
    scenarioRequirements.value.map((item) => [item.scenario, item.required]),
  );
  existing.set(scenario, required);

  const scenarioOrder: TenantMfaScenarioCode[] = [
    'LOGIN',
    'CHANGE_PASSWORD',
    'CHANGE_CONTACT',
    'NEW_DEVICE_LOGIN',
  ];
  scenarioRequirements.value = orderTenantMfaScenarioRequirements(
    scenarioOrder.map((code) => ({
      scenario: code,
      required:
        code === 'LOGIN'
          ? loginRequired.value
          : existing.get(code) ?? false,
    })),
  );
}

onMounted(() => {
  void loadTenantMfaPolicy();
});

onBeforeUnmount(() => {
  sortableInstance.value?.destroy();
});
</script>

<template>
  <Page auto-content-height title="租户 MFA 配置">
    <div class="login-mfa-settings-page">
      <Card :bordered="false" class="login-mfa-settings__panel">
        <div class="login-mfa-settings__header">
          <div class="login-mfa-settings__title-row">
            <div>
              <div class="login-mfa-settings__title">租户 MFA 配置</div>
              <div class="login-mfa-settings__description">
                配置当前租户哪些场景需要 MFA，以及因子展示顺序。
              </div>
            </div>
            <Tooltip title="这里只管理当前租户的 MFA 场景与因子顺序，不处理平台级默认策略。">
              <span class="login-mfa-settings__help-dot">?</span>
            </Tooltip>
          </div>
        </div>

        <div
          v-if="!hasTenantContext || !canManageLoginMfa"
          class="login-mfa-settings__empty"
        >
          <Empty description="当前上下文暂不支持管理租户 MFA 配置" />
        </div>

        <div v-else-if="tenantMfaLoading" class="login-mfa-settings__empty">
          正在加载租户 MFA 配置...
        </div>

        <div v-else class="login-mfa-settings__content">
          <Row :gutter="[16, 16]" class="login-mfa-settings__split-grid">
            <Col :lg="12" :span="24">
              <Card :bordered="false" class="login-mfa-settings__section-card">
                <div class="login-mfa-settings__section">
                  <div class="login-mfa-settings__section-head">
                    <div>
                      <div class="login-mfa-settings__section-title">场景要求</div>
                      <div class="login-mfa-settings__meta">
                        控制当前租户哪些入口需要先完成 MFA。
                      </div>
                    </div>
                  </div>

                  <div class="login-mfa-settings__scenario-list">
                    <div
                      v-for="item in editableScenarioRows"
                      :key="item.scenario"
                      class="login-mfa-settings__scenario-row"
                    >
                      <div class="login-mfa-settings__row-main">
                        <div class="login-mfa-settings__row-title">
                          <span class="login-mfa-settings__factor-name">
                            {{ getTenantMfaScenarioLabel(item.scenario) }}
                          </span>
                          <Tooltip :title="getTenantMfaScenarioTooltip(item.scenario)">
                            <span class="login-mfa-settings__help-dot login-mfa-settings__help-dot--sm">?</span>
                          </Tooltip>
                        </div>
                      </div>
                      <Switch
                        :checked="item.required"
                        @update:checked="(checked) => updateScenarioRequirement(item.scenario, Boolean(checked))"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <Col :lg="12" :span="24">
              <Card :bordered="false" class="login-mfa-settings__section-card">
                <div class="login-mfa-settings__section">
                  <div class="login-mfa-settings__section-head">
                    <div>
                      <div class="login-mfa-settings__section-title">因子优先级</div>
                      <div class="login-mfa-settings__meta">
                        已启用因子会按当前顺序优先展示。
                      </div>
                    </div>
                    <div class="login-mfa-settings__drag-hint">
                      <IconifyIcon icon="lucide:grip" />
                      <span>拖拽排序</span>
                    </div>
                  </div>

                  <div ref="factorListRef" class="login-mfa-settings__factor-list">
                    <div
                      v-for="factor in editableFactors"
                      :key="factor.factor"
                      class="login-mfa-settings__factor-row"
                    >
                      <div class="login-mfa-settings__factor-leading">
                        <button
                          class="login-mfa-settings__drag-handle"
                          type="button"
                        >
                          <IconifyIcon icon="lucide:grip-vertical" />
                        </button>
                        <div class="login-mfa-settings__factor-order">{{ factor.priority }}</div>
                      </div>

                      <div class="login-mfa-settings__row-main">
                        <div class="login-mfa-settings__row-title">
                          <span class="login-mfa-settings__factor-name">
                            {{ getTenantMfaFactorLabel(factor.factor) }}
                          </span>
                          <Tooltip :title="getTenantMfaFactorTooltip(factor.factor)">
                            <span class="login-mfa-settings__help-dot login-mfa-settings__help-dot--sm">?</span>
                          </Tooltip>
                        </div>
                      </div>

                      <Switch v-model:checked="factor.enabled" />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <div class="login-mfa-settings__footer">
            <div class="login-mfa-settings__footer-meta">
              保存后，当前租户后续命中的 MFA 流程会按这里的配置执行。
            </div>
            <Button
              v-access:code="'auth.mfa_policy.manage'"
              v-if="canManageLoginMfa"
              :loading="tenantMfaSaving"
              size="large"
              type="primary"
              @click="saveTenantMfaPolicy"
            >
              保存配置
            </Button>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.login-mfa-settings-page {
  --tenant-settings-border: hsl(var(--border) / 0.92);
  --tenant-settings-card-bg: hsl(var(--card));
  --tenant-settings-card-bg-strong: hsl(var(--muted) / 0.78);
  --tenant-settings-card-bg-soft: linear-gradient(180deg, hsl(var(--muted) / 0.55), hsl(var(--card)));
  --tenant-settings-muted: hsl(var(--muted-foreground));
  --tenant-settings-text: hsl(var(--foreground) / 0.92);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-mfa-settings__panel :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: var(--tenant-settings-card-bg);
}

.login-mfa-settings__header,
.login-mfa-settings__title-row,
.login-mfa-settings__section-head,
 .login-mfa-settings__factor-row,
 .login-mfa-settings__scenario-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.login-mfa-settings__meta,
 .login-mfa-settings__drag-hint,
 .login-mfa-settings__empty,
 .login-mfa-settings__footer-meta {
  color: var(--tenant-settings-muted);
  font-size: 13px;
}

.login-mfa-settings__title {
  color: var(--tenant-settings-text);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.login-mfa-settings__section-title,
.login-mfa-settings__factor-name {
  color: var(--tenant-settings-text);
  font-weight: 600;
}

.login-mfa-settings__description,
.login-mfa-settings__meta,
.login-mfa-settings__footer-meta {
  line-height: 1.6;
}

.login-mfa-settings__section-title,
.login-mfa-settings__factor-name {
  font-size: 14px;
  font-weight: 600;
}

.login-mfa-settings__help-dot,
.login-mfa-settings__factor-order,
.login-mfa-settings__drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.login-mfa-settings__help-dot {
  width: 22px;
  height: 22px;
  border: 1px solid var(--tenant-settings-border);
  background: hsl(var(--card));
  color: var(--tenant-settings-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: help;
  box-shadow: 0 8px 18px rgb(15 23 42 / 0.06);
}

.login-mfa-settings__content,
.login-mfa-settings__section,
.login-mfa-settings__factor-list,
.login-mfa-settings__scenario-list {
  display: grid;
  gap: 16px;
}

.login-mfa-settings__header {
  padding: 22px 24px;
  border: 1px solid var(--tenant-settings-border);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgb(59 130 246 / 0.1), transparent 30%),
    var(--tenant-settings-card-bg-soft);
}

.login-mfa-settings__section-card :deep(.ant-card-body) {
  padding: 20px;
  border: 1px solid var(--tenant-settings-border);
  border-radius: 20px;
  background: var(--tenant-settings-card-bg-soft);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.login-mfa-settings__factor-row,
.login-mfa-settings__scenario-row {
  border: 1px solid var(--tenant-settings-border);
  border-radius: 18px;
  background: hsl(var(--card) / 0.96);
  padding: 14px 16px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.6);
}

.login-mfa-settings__row-main {
  min-width: 0;
  flex: 1;
}

.login-mfa-settings__row-title,
.login-mfa-settings__factor-leading,
.login-mfa-settings__footer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.login-mfa-settings__split-grid {
  align-items: stretch;
}

.login-mfa-settings__drag-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: hsl(var(--accent));
  border: 1px solid hsl(var(--border) / 0.7);
}

.login-mfa-settings__drag-handle {
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  color: var(--tenant-settings-muted);
  cursor: grab;
  font-size: 16px;
}

.login-mfa-settings__drag-handle:active {
  cursor: grabbing;
}

.login-mfa-settings__drag-handle :deep(svg) {
  width: 18px;
  height: 18px;
}

.login-mfa-settings__factor-order {
  width: 32px;
  height: 32px;
  background: rgb(37 99 235 / 0.1);
  color: var(--tenant-settings-text);
  font-size: 13px;
  font-weight: 700;
}

.login-mfa-settings__footer {
  justify-content: space-between;
  padding: 18px 20px 4px;
}

.login-mfa-settings__factor-row--ghost {
  opacity: 0.65;
}

.login-mfa-settings__help-dot--sm {
  width: 18px;
  height: 18px;
  font-size: 11px;
}

@media (max-width: 768px) {
  .login-mfa-settings__header,
  .login-mfa-settings__section-head,
  .login-mfa-settings__factor-row,
  .login-mfa-settings__scenario-row,
  .login-mfa-settings__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .login-mfa-settings__factor-leading {
    width: 100%;
  }

  .login-mfa-settings__footer {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
