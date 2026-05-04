<script lang="ts" setup>
import type { Sortable } from '@vben/hooks';

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useSortable } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, Col, Empty, message, Row, Switch, Tooltip } from 'ant-design-vue';

import {
  getAdminPlatformMfaPolicyApi,
  updateAdminPlatformMfaPolicyApi,
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

interface PlatformMfaPolicyState {
  factors: TenantMfaFactorItem[];
  loginRequired: boolean;
  scenarioRequirements: TenantMfaScenarioRequirementItem[];
}

interface SortableEndEvent {
  newIndex?: number;
  oldIndex?: number;
}

const authContextStore = useAuthContextStore();

const canManagePlatformMfa = computed(() =>
  authContextStore.actionCodes.includes('auth.platform_mfa_policy.manage'),
);
const hasPlatformContext = computed(() =>
  authContextStore.sessionContext?.scopeLevel === 'SYSTEM',
);
const platformMfaLoading = ref(false);
const platformMfaSaving = ref(false);
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

// Syncs one loaded platform MFA policy snapshot into the editable view state.
function applyPlatformMfaPolicy(policy: PlatformMfaPolicyState) {
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

// Creates the sortable row behavior used by the platform MFA factor priority list.
async function initFactorSortable() {
  sortableInstance.value?.destroy();
  sortableInstance.value = null;

  if (!factorListRef.value || editableFactors.value.length === 0) {
    return;
  }

  const { initializeSortable } = useSortable(factorListRef.value, {
    animation: 180,
    draggable: '.platform-mfa-settings__factor-row',
    fallbackOnBody: true,
    forceFallback: true,
    ghostClass: 'platform-mfa-settings__factor-row--ghost',
    handle: '.platform-mfa-settings__drag-handle',
    onEnd: (event) => handleFactorDragEnd(event),
  });

  sortableInstance.value = await initializeSortable();
}

// Loads the current platform MFA governance snapshot for the dedicated system-admin settings page.
async function loadPlatformMfaPolicy() {
  if (!hasPlatformContext.value || !canManagePlatformMfa.value) {
    loginRequired.value = false;
    editableFactors.value = [];
    return;
  }

  platformMfaLoading.value = true;

  try {
    const policy = await getAdminPlatformMfaPolicyApi();
    applyPlatformMfaPolicy(policy);
  } catch (error) {
    editableFactors.value = [];
    message.error(getErrorMessage(error, '加载平台 MFA 配置失败'));
  } finally {
    platformMfaLoading.value = false;
  }

  await nextTick();
  await initFactorSortable();
}

// Persists the current platform MFA toggle and factor ordering back to the admin-security API.
async function savePlatformMfaPolicy() {
  platformMfaSaving.value = true;

  try {
    const policy = await updateAdminPlatformMfaPolicyApi({
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
    applyPlatformMfaPolicy(policy);
    await nextTick();
    await initFactorSortable();
    message.success('平台 MFA 配置已更新');
  } catch (error) {
    message.error(getErrorMessage(error, '保存平台 MFA 配置失败'));
  } finally {
    platformMfaSaving.value = false;
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
  void loadPlatformMfaPolicy();
});

onBeforeUnmount(() => {
  sortableInstance.value?.destroy();
});
</script>

<template>
  <Page auto-content-height title="平台 MFA 配置">
    <div class="platform-mfa-settings-page">
      <Card :bordered="false" class="platform-mfa-settings__panel">
        <div class="platform-mfa-settings__header">
          <div class="platform-mfa-settings__title-row">
            <div>
              <div class="platform-mfa-settings__title">平台 MFA 配置</div>
              <div class="platform-mfa-settings__description">
                配置系统账号哪些场景需要 MFA，以及因子展示顺序。
              </div>
            </div>
            <Tooltip title="这里只管理系统级账号的 MFA 场景与因子顺序，不处理租户策略。">
              <span class="platform-mfa-settings__help-dot">?</span>
            </Tooltip>
          </div>
        </div>

        <div
          v-if="!hasPlatformContext || !canManagePlatformMfa"
          class="platform-mfa-settings__empty"
        >
          <Empty description="当前上下文暂不支持管理平台 MFA 配置" />
        </div>

        <div v-else-if="platformMfaLoading" class="platform-mfa-settings__empty">
          正在加载平台 MFA 配置...
        </div>

        <div v-else class="platform-mfa-settings__content">
          <Row :gutter="[16, 16]" class="platform-mfa-settings__split-grid">
            <Col :lg="12" :span="24">
              <Card :bordered="false" class="platform-mfa-settings__section-card">
                <div class="platform-mfa-settings__section">
                  <div class="platform-mfa-settings__section-head">
                    <div>
                      <div class="platform-mfa-settings__section-title">场景要求</div>
                      <div class="platform-mfa-settings__meta">
                        控制系统账号哪些入口需要先完成 MFA。
                      </div>
                    </div>
                  </div>

                  <div class="platform-mfa-settings__scenario-list">
                    <div
                      v-for="item in editableScenarioRows"
                      :key="item.scenario"
                      class="platform-mfa-settings__scenario-row"
                    >
                      <div class="platform-mfa-settings__row-main">
                        <div class="platform-mfa-settings__row-title">
                          <span class="platform-mfa-settings__factor-name">
                            {{ getTenantMfaScenarioLabel(item.scenario) }}
                          </span>
                          <Tooltip :title="getTenantMfaScenarioTooltip(item.scenario)">
                            <span class="platform-mfa-settings__help-dot platform-mfa-settings__help-dot--sm">?</span>
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
              <Card :bordered="false" class="platform-mfa-settings__section-card">
                <div class="platform-mfa-settings__section">
                  <div class="platform-mfa-settings__section-head">
                    <div>
                      <div class="platform-mfa-settings__section-title">因子优先级</div>
                      <div class="platform-mfa-settings__meta">
                        已启用因子会按当前顺序优先展示。
                      </div>
                    </div>
                    <div class="platform-mfa-settings__drag-hint">
                      <IconifyIcon icon="lucide:grip" />
                      <span>拖拽排序</span>
                    </div>
                  </div>

                  <div ref="factorListRef" class="platform-mfa-settings__factor-list">
                    <div
                      v-for="factor in editableFactors"
                      :key="factor.factor"
                      class="platform-mfa-settings__factor-row"
                    >
                      <div class="platform-mfa-settings__factor-leading">
                        <button
                          class="platform-mfa-settings__drag-handle"
                          type="button"
                        >
                          <IconifyIcon icon="lucide:grip-vertical" />
                        </button>
                        <div class="platform-mfa-settings__factor-order">{{ factor.priority }}</div>
                      </div>

                      <div class="platform-mfa-settings__row-main">
                        <div class="platform-mfa-settings__row-title">
                          <span class="platform-mfa-settings__factor-name">
                            {{ getTenantMfaFactorLabel(factor.factor) }}
                          </span>
                          <Tooltip :title="getTenantMfaFactorTooltip(factor.factor)">
                            <span class="platform-mfa-settings__help-dot platform-mfa-settings__help-dot--sm">?</span>
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

          <div class="platform-mfa-settings__footer">
            <div class="platform-mfa-settings__footer-meta">
              保存后，系统账号后续命中的 MFA 流程会按这里的配置执行。
            </div>
            <Button
              v-access:code="'auth.platform_mfa_policy.manage'"
              v-if="canManagePlatformMfa"
              :loading="platformMfaSaving"
              size="large"
              type="primary"
              @click="savePlatformMfaPolicy"
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
.platform-mfa-settings-page {
  --platform-settings-border: hsl(var(--border) / 0.92);
  --platform-settings-card-bg: hsl(var(--card));
  --platform-settings-card-bg-strong: hsl(var(--muted) / 0.78);
  --platform-settings-card-bg-soft: linear-gradient(180deg, hsl(var(--muted) / 0.55), hsl(var(--card)));
  --platform-settings-muted: hsl(var(--muted-foreground));
  --platform-settings-text: hsl(var(--foreground) / 0.92);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.platform-mfa-settings__panel :deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: var(--platform-settings-card-bg);
}

.platform-mfa-settings__header,
.platform-mfa-settings__title-row,
.platform-mfa-settings__section-head,
.platform-mfa-settings__factor-row,
.platform-mfa-settings__scenario-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.platform-mfa-settings__meta,
.platform-mfa-settings__drag-hint,
.platform-mfa-settings__empty,
.platform-mfa-settings__footer-meta {
  color: var(--platform-settings-muted);
  font-size: 13px;
}

.platform-mfa-settings__title {
  color: var(--platform-settings-text);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.platform-mfa-settings__section-title,
.platform-mfa-settings__factor-name {
  color: var(--platform-settings-text);
  font-weight: 600;
}

.platform-mfa-settings__description,
.platform-mfa-settings__meta,
.platform-mfa-settings__footer-meta {
  line-height: 1.6;
}

.platform-mfa-settings__section-title,
.platform-mfa-settings__factor-name {
  font-size: 14px;
  font-weight: 600;
}

.platform-mfa-settings__help-dot,
.platform-mfa-settings__factor-order,
.platform-mfa-settings__drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}

.platform-mfa-settings__help-dot {
  width: 22px;
  height: 22px;
  border: 1px solid var(--platform-settings-border);
  background: hsl(var(--card));
  color: var(--platform-settings-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: help;
  box-shadow: 0 8px 18px rgb(15 23 42 / 0.06);
}

.platform-mfa-settings__content,
.platform-mfa-settings__section,
.platform-mfa-settings__factor-list,
.platform-mfa-settings__scenario-list {
  display: grid;
  gap: 16px;
}

.platform-mfa-settings__header {
  padding: 22px 24px;
  border: 1px solid var(--platform-settings-border);
  border-radius: 20px;
  background:
    radial-gradient(circle at top right, rgb(59 130 246 / 0.1), transparent 30%),
    var(--platform-settings-card-bg-soft);
}

.platform-mfa-settings__section-card :deep(.ant-card-body) {
  padding: 20px;
  border: 1px solid var(--platform-settings-border);
  border-radius: 20px;
  background: var(--platform-settings-card-bg-soft);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.platform-mfa-settings__factor-row,
.platform-mfa-settings__scenario-row {
  border: 1px solid var(--platform-settings-border);
  border-radius: 18px;
  background: hsl(var(--card) / 0.96);
  padding: 14px 16px;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.6);
}

.platform-mfa-settings__row-main {
  min-width: 0;
  flex: 1;
}

.platform-mfa-settings__row-title,
.platform-mfa-settings__factor-leading,
.platform-mfa-settings__footer {
  display: flex;
  align-items: center;
  gap: 10px;
}

.platform-mfa-settings__split-grid {
  align-items: stretch;
}

.platform-mfa-settings__drag-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: hsl(var(--accent));
  border: 1px solid hsl(var(--border) / 0.7);
}

.platform-mfa-settings__drag-handle {
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  color: var(--platform-settings-muted);
  cursor: grab;
  font-size: 16px;
}

.platform-mfa-settings__drag-handle:active {
  cursor: grabbing;
}

.platform-mfa-settings__drag-handle :deep(svg) {
  width: 18px;
  height: 18px;
}

.platform-mfa-settings__factor-order {
  width: 32px;
  height: 32px;
  background: rgb(37 99 235 / 0.1);
  color: var(--platform-settings-text);
  font-size: 13px;
  font-weight: 700;
}

.platform-mfa-settings__footer {
  justify-content: space-between;
  padding: 18px 20px 4px;
}

.platform-mfa-settings__factor-row--ghost {
  opacity: 0.65;
}

.platform-mfa-settings__help-dot--sm {
  width: 18px;
  height: 18px;
  font-size: 11px;
}

@media (max-width: 768px) {
  .platform-mfa-settings__header,
  .platform-mfa-settings__section-head,
  .platform-mfa-settings__factor-row,
  .platform-mfa-settings__scenario-row,
  .platform-mfa-settings__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .platform-mfa-settings__factor-leading {
    width: 100%;
  }

  .platform-mfa-settings__footer {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
