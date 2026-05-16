<script lang="ts" setup>
import type { TerminalDeviceApi } from '#/api';
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  changeTerminalDeviceStatusApi,
  createTerminalDeviceEnrollmentApi,
  getTerminalDeviceApi,
  getTerminalDeviceVersionPolicyApi,
  listTerminalDeviceAuditEventsApi,
  listTerminalDeviceEnrollmentsApi,
  listTerminalDevicesApi,
  revokeTerminalDeviceEnrollmentApi,
  updateTerminalDeviceVersionPolicyApi,
} from '#/api';

interface SelectOption {
  label: string;
  value: string;
}

const devices = ref<TerminalDeviceApi.DeviceListItem[]>([]);
const enrollments = ref<TerminalDeviceApi.Enrollment[]>([]);
const auditEvents = ref<TerminalDeviceApi.AuditEvent[]>([]);
const selectedDeviceDetail = ref<null | TerminalDeviceApi.DeviceDetail>(null);
const loading = ref(false);
const detailLoading = ref(false);
const savingEnrollment = ref(false);
const revokingEnrollment = ref(false);
const savingVersionPolicy = ref(false);
const changingStatus = ref(false);
const statusModalOpen = ref(false);
const loadError = ref('');

const deviceFilters = reactive({
  keyword: '',
  status: '',
});
const enrollmentForm = reactive({
  displayName: '',
  expectedManufacturerSerial: '',
  expiresAt: '',
  notes: '',
});
const revokeEnrollmentReason = ref('');
const versionPolicyForm = reactive({
  apkDownloadUrl: '',
  latestAppVersion: '',
  minSupportedAppVersion: '',
  reason: '',
  releaseNotesUrl: '',
  upgradeRecommended: true,
  upgradeRequired: false,
});
const statusForm = reactive({
  reason: '',
  targetStatus: 'DISABLED',
});

const statusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'DISABLED', value: 'DISABLED' },
  { label: 'LOST', value: 'LOST' },
  { label: 'MAINTENANCE', value: 'MAINTENANCE' },
  { label: 'PENDING_APPROVAL', value: 'PENDING_APPROVAL' },
  { label: 'DECOMMISSIONED', value: 'DECOMMISSIONED' },
];

const deviceColumns = computed<TableColumnsType>(() => [
  { dataIndex: 'displayName', title: '设备' },
  { dataIndex: 'status', title: '状态', width: 140 },
  { dataIndex: 'presenceStatus', title: '在线状态', width: 120 },
  { dataIndex: 'appVersion', title: 'App 版本', width: 120 },
  { dataIndex: 'lastReportedAccount', title: '最近上报账号（非当前会话）' },
  { dataIndex: 'lastHeartbeatAt', title: '最近 heartbeat', width: 180 },
  { key: 'actions', title: '操作', width: 120 },
]);

const enrollmentColumns = computed<TableColumnsType>(() => [
  { dataIndex: 'displayName', title: 'Enrollment' },
  { dataIndex: 'status', title: '状态', width: 120 },
  { dataIndex: 'expiresAt', title: '过期时间', width: 180 },
  { dataIndex: 'usedByTerminalDeviceId', title: '使用设备', width: 160 },
  { key: 'actions', title: '操作', width: 120 },
]);

const auditColumns = computed<TableColumnsType>(() => [
  { dataIndex: 'action', title: '动作' },
  { dataIndex: 'operatorAccountId', title: '管理员账号' },
  { dataIndex: 'reason', title: '原因' },
  { dataIndex: 'occurredAt', title: '发生时间' },
]);

const selectedCurrentSessions = computed(() => selectedDeviceDetail.value?.currentSessions ?? []);

// Loads device, enrollment, and version policy data from the Admin BFF read contracts.
async function loadDashboard(): Promise<void> {
  loading.value = true;
  loadError.value = '';
  try {
    const [deviceResult, enrollmentResult, versionPolicy] = await Promise.all([
      listTerminalDevicesApi({
        keyword: deviceFilters.keyword.trim() || undefined,
        page: 1,
        pageSize: 20,
        status: (deviceFilters.status || undefined) as TerminalDeviceApi.TerminalDeviceStatus | undefined,
        terminalDeviceType: 'PDA',
      }),
      listTerminalDeviceEnrollmentsApi({
        page: 1,
        pageSize: 20,
        terminalDeviceType: 'PDA',
      }),
      getTerminalDeviceVersionPolicyApi({ terminalDeviceType: 'PDA' }),
    ]);
    devices.value = deviceResult.items;
    enrollments.value = enrollmentResult.items;
    applyVersionPolicy(versionPolicy);
  } catch (error) {
    loadError.value = getErrorMessage(error, '加载终端设备管理数据失败');
  } finally {
    loading.value = false;
  }
}

// Creates one administrator-issued PDA enrollment and refreshes the enrollment list.
async function createEnrollment(): Promise<void> {
  savingEnrollment.value = true;
  try {
    await createTerminalDeviceEnrollmentApi({
      displayName: enrollmentForm.displayName.trim(),
      expectedManufacturerSerial: enrollmentForm.expectedManufacturerSerial.trim(),
      expiresAt: enrollmentForm.expiresAt.trim(),
      notes: enrollmentForm.notes.trim(),
      terminalDeviceType: 'PDA',
    });
    message.success('Enrollment 已创建');
    await loadDashboard();
  } catch (error) {
    message.error(getErrorMessage(error, '创建 enrollment 失败'));
  } finally {
    savingEnrollment.value = false;
  }
}

// Revokes an unused enrollment with an explicit administrator reason.
async function revokeEnrollment(enrollment: Pick<TerminalDeviceApi.Enrollment, 'enrollmentId' | 'status'>): Promise<void> {
  if (enrollment.status !== 'ISSUED') {
    message.error('只有 ISSUED enrollment 可以撤销');
    return;
  }

  const reason = revokeEnrollmentReason.value.trim();
  if (!reason) {
    message.error('请先填写撤销原因');
    return;
  }

  revokingEnrollment.value = true;
  try {
    await revokeTerminalDeviceEnrollmentApi(enrollment.enrollmentId, { reason });
    message.success('Enrollment 已撤销');
    await loadDashboard();
  } catch (error) {
    message.error(getErrorMessage(error, '撤销 enrollment 失败'));
  } finally {
    revokingEnrollment.value = false;
  }
}

// Revokes enrollment from Ant Design table slot records after validating the required keys.
async function revokeEnrollmentFromRecord(record: Record<string, unknown>): Promise<void> {
  const enrollmentId = `${record.enrollmentId ?? ''}`.trim();
  const status = `${record.status ?? ''}`.trim() as TerminalDeviceApi.EnrollmentStatus;
  if (!enrollmentId || !status) {
    return;
  }

  await revokeEnrollment({ enrollmentId, status });
}

// Loads device detail, current sessions, and governance audit through their dedicated sources.
async function openDeviceDetail(device: Pick<TerminalDeviceApi.DeviceListItem, 'terminalDeviceId'>): Promise<void> {
  detailLoading.value = true;
  try {
    const [detail, auditResult] = await Promise.all([
      getTerminalDeviceApi(device.terminalDeviceId),
      listTerminalDeviceAuditEventsApi(device.terminalDeviceId, {
        page: 1,
        pageSize: 20,
      }),
    ]);
    selectedDeviceDetail.value = detail;
    auditEvents.value = auditResult.items;
  } catch (error) {
    message.error(getErrorMessage(error, '加载设备详情失败'));
  } finally {
    detailLoading.value = false;
  }
}

// Opens detail from Ant Design table slot records after narrowing the runtime record shape.
async function openDeviceDetailFromRecord(record: Record<string, unknown>): Promise<void> {
  const terminalDeviceId = `${record.terminalDeviceId ?? ''}`.trim();
  if (!terminalDeviceId) {
    return;
  }

  await openDeviceDetail({ terminalDeviceId });
}

// Persists version policy changes without implying APK distribution or automatic upgrade.
async function saveVersionPolicy(): Promise<void> {
  savingVersionPolicy.value = true;
  try {
    const updated = await updateTerminalDeviceVersionPolicyApi({
      apkDownloadUrl: nullableText(versionPolicyForm.apkDownloadUrl),
      latestAppVersion: versionPolicyForm.latestAppVersion.trim(),
      minSupportedAppVersion: versionPolicyForm.minSupportedAppVersion.trim(),
      reason: versionPolicyForm.reason.trim(),
      releaseNotesUrl: nullableText(versionPolicyForm.releaseNotesUrl),
      terminalDeviceType: 'PDA',
      upgradeRecommended: versionPolicyForm.upgradeRecommended,
      upgradeRequired: versionPolicyForm.upgradeRequired,
    });
    applyVersionPolicy(updated);
    message.success('版本策略已保存');
  } catch (error) {
    message.error(getErrorMessage(error, '保存版本策略失败'));
  } finally {
    savingVersionPolicy.value = false;
  }
}

// Sends a status command with reason while leaving lifecycle rules to terminal-device-service.
async function changeSelectedDeviceStatus(): Promise<void> {
  if (!selectedDeviceDetail.value) {
    return;
  }
  changingStatus.value = true;
  try {
    await changeTerminalDeviceStatusApi(selectedDeviceDetail.value.device.terminalDeviceId, {
      reason: statusForm.reason.trim(),
      targetStatus: statusForm.targetStatus as TerminalDeviceApi.TerminalDeviceStatus,
    });
    message.success('设备状态变更已提交');
    await openDeviceDetail({
      terminalDeviceId: selectedDeviceDetail.value.device.terminalDeviceId,
    });
    await loadDashboard();
    statusModalOpen.value = false;
  } catch (error) {
    message.error(getErrorMessage(error, '变更设备状态失败'));
  } finally {
    changingStatus.value = false;
  }
}

// Opens the status operation dialog and resets the reason field for a fresh audited command.
function openStatusOperationDialog(): void {
  statusForm.reason = '';
  statusModalOpen.value = true;
}

// Copies server version policy fields into the local edit form.
function applyVersionPolicy(policy: TerminalDeviceApi.VersionPolicy): void {
  versionPolicyForm.apkDownloadUrl = policy.apkDownloadUrl ?? '';
  versionPolicyForm.latestAppVersion = policy.latestAppVersion;
  versionPolicyForm.minSupportedAppVersion = policy.minSupportedAppVersion;
  versionPolicyForm.releaseNotesUrl = policy.releaseNotesUrl ?? '';
  versionPolicyForm.upgradeRecommended = policy.upgradeRecommended;
  versionPolicyForm.upgradeRequired = policy.upgradeRequired;
}

// Normalizes optional text fields to the Admin BFF null convention.
function nullableText(value: string): null | string {
  return value.trim() || null;
}

// Converts unknown request failures into concise admin-facing copy.
function getErrorMessage(error: unknown, fallback: string): string {
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

// Maps terminal device statuses to compact Ant Design tag colors.
function getStatusColor(status?: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'DISABLED':
    case 'LOST':
      return 'red';
    case 'MAINTENANCE':
    case 'PENDING_APPROVAL':
      return 'orange';
    case 'DECOMMISSIONED':
      return 'default';
    default:
      return 'blue';
  }
}

// Formats optional ISO timestamps without hiding malformed diagnostic values.
function formatTime(value?: null | string): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

// Reads a scalar table cell for Ant Design columns whose dataIndex may be absent or nested.
function getTableText(record: Record<string, unknown>, dataIndex: unknown): string {
  if (typeof dataIndex !== 'string') {
    return '-';
  }

  const value = record[dataIndex];
  return value === undefined || value === null || value === '' ? '-' : `${value}`;
}

onMounted(() => {
  void loadDashboard();
});

defineExpose({
  createEnrollment,
  enrollmentForm,
  openDeviceDetail,
  revokeEnrollment,
  revokeEnrollmentReason,
  saveVersionPolicy,
});
</script>

<template>
  <Page title="终端设备管理">
    <div class="terminal-device-management">
      <Alert
        v-if="loadError"
        class="terminal-device-management__alert"
        :message="loadError"
        type="error"
      />

      <section class="terminal-device-management__layout">
        <Card title="设备列表">
          <Form class="terminal-device-management__filters" @submit.prevent="loadDashboard">
            <Input v-model:value="deviceFilters.keyword" placeholder="设备名称、型号、版本" />
            <select v-model="deviceFilters.status" class="terminal-device-management__select">
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <Button html-type="submit" :loading="loading" type="primary">查询</Button>
          </Form>

          <Table
            :columns="deviceColumns"
            :data-source="devices"
            :loading="loading"
            :locale="{ emptyText: '暂无终端设备' }"
            row-key="terminalDeviceId"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'status'">
                <Tag :color="getStatusColor(record.status)">{{ record.status }}</Tag>
              </template>
              <template v-else-if="column.dataIndex === 'presenceStatus'">
                <Tag :color="record.presenceStatus === 'ONLINE' ? 'green' : 'default'">
                  {{ record.presenceStatus }}
                </Tag>
              </template>
              <template v-else-if="column.dataIndex === 'lastReportedAccount'">
                {{ record.lastReportedAccount?.displayName || '-' }}
              </template>
              <template v-else-if="column.dataIndex === 'lastHeartbeatAt'">
                {{ formatTime(record.lastHeartbeatAt) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button size="small" type="link" @click="openDeviceDetailFromRecord(record)">详情</Button>
              </template>
              <template v-else>
                {{ getTableText(record, column.dataIndex) }}
              </template>
            </template>
          </Table>
        </Card>

        <Card title="Enrollment 发放">
          <Form class="terminal-device-management__form" @submit.prevent="createEnrollment">
            <label>
              <span>设备显示名</span>
              <Input v-model:value="enrollmentForm.displayName" placeholder="PDA-Warehouse-01" />
            </label>
            <label>
              <span>预期厂商序列号</span>
              <Input
                v-model:value="enrollmentForm.expectedManufacturerSerial"
                placeholder="可选，留空则 enrollment 时采集"
              />
            </label>
            <label>
              <span>过期时间</span>
              <Input v-model:value="enrollmentForm.expiresAt" placeholder="2026-05-17T10:00:00Z" />
            </label>
            <label>
              <span>备注</span>
              <Input v-model:value="enrollmentForm.notes" placeholder="Issued for warehouse pilot" />
            </label>
            <Button html-type="submit" :loading="savingEnrollment" type="primary">创建 Enrollment</Button>
          </Form>

          <Form class="terminal-device-management__compact-form" @submit.prevent>
            <label>
              <span>撤销原因</span>
              <Input v-model:value="revokeEnrollmentReason" placeholder="撤销 ISSUED enrollment 前必须填写" />
            </label>
          </Form>

          <Table
            class="terminal-device-management__subtable"
            :columns="enrollmentColumns"
            :data-source="enrollments"
            :locale="{ emptyText: '暂无 enrollment' }"
            row-key="enrollmentId"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'status'">
                <Tag :color="record.status === 'ISSUED' ? 'blue' : 'default'">{{ record.status }}</Tag>
              </template>
              <template v-else-if="column.dataIndex === 'expiresAt'">
                {{ formatTime(record.expiresAt) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button
                  :disabled="record.status !== 'ISSUED'"
                  :loading="revokingEnrollment"
                  size="small"
                  type="link"
                  @click="revokeEnrollmentFromRecord(record)"
                >
                  撤销
                </Button>
              </template>
              <template v-else>
                {{ getTableText(record, column.dataIndex) }}
              </template>
            </template>
          </Table>
        </Card>
      </section>

      <section class="terminal-device-management__layout">
        <Card title="版本策略">
          <p class="terminal-device-management__hint">
            Phase 2 只管理 min/latest 策略和提示字段，不做 MDM、热更新或自动安装。
          </p>
          <Form class="terminal-device-management__form" @submit.prevent="saveVersionPolicy">
            <label>
              <span>最低支持版本</span>
              <Input v-model:value="versionPolicyForm.minSupportedAppVersion" />
            </label>
            <label>
              <span>最新版本</span>
              <Input v-model:value="versionPolicyForm.latestAppVersion" />
            </label>
            <label>
              <span>APK 下载地址</span>
              <Input v-model:value="versionPolicyForm.apkDownloadUrl" placeholder="可选" />
            </label>
            <label>
              <span>Release Notes</span>
              <Input v-model:value="versionPolicyForm.releaseNotesUrl" placeholder="可选" />
            </label>
            <label>
              <span>变更原因</span>
              <Input v-model:value="versionPolicyForm.reason" placeholder="必填，用于审计" />
            </label>
            <Space>
              <label class="terminal-device-management__checkbox">
                <input v-model="versionPolicyForm.upgradeRequired" type="checkbox" />
                强制升级
              </label>
              <label class="terminal-device-management__checkbox">
                <input v-model="versionPolicyForm.upgradeRecommended" type="checkbox" />
                推荐升级
              </label>
            </Space>
            <Button html-type="submit" :loading="savingVersionPolicy" type="primary">保存版本策略</Button>
          </Form>
        </Card>

        <Card title="设备详情">
          <Empty v-if="!selectedDeviceDetail && !detailLoading" description="选择一台设备查看详情、会话和审计" />
          <div v-else class="terminal-device-management__detail">
            <Descriptions title="设备真相">
              <Descriptions.Item label="设备">
                {{ selectedDeviceDetail?.device.displayName || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {{ selectedDeviceDetail?.device.status || '-' }}
              </Descriptions.Item>
              <Descriptions.Item label="硬件">
                {{ selectedDeviceDetail?.identity.manufacturer || '-' }}
                {{ selectedDeviceDetail?.identity.model || '' }}
              </Descriptions.Item>
              <Descriptions.Item label="最近上报账号（非当前会话）">
                {{ selectedDeviceDetail?.runtime.lastReportedAccount?.displayName || '-' }}
              </Descriptions.Item>
            </Descriptions>

            <Card class="terminal-device-management__nested" title="当前有效会话">
              <Table
                :columns="[
                  { dataIndex: 'displayName', title: '账号' },
                  { dataIndex: 'sessionId', title: 'Session' },
                  { dataIndex: 'createdAt', title: '创建时间' },
                ]"
                :data-source="selectedCurrentSessions"
                :locale="{ emptyText: '没有当前有效会话' }"
                row-key="sessionId"
              />
            </Card>

            <Card class="terminal-device-management__nested" title="状态操作">
              <Button type="primary" @click="openStatusOperationDialog">打开状态操作</Button>
            </Card>

            <Card class="terminal-device-management__nested" title="设备治理审计">
              <Table
                :columns="auditColumns"
                :data-source="auditEvents"
                :locale="{ emptyText: '暂无设备治理审计' }"
                row-key="auditEventId"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'occurredAt'">
                    {{ formatTime(record.occurredAt) }}
                  </template>
                  <template v-else>
                    {{ getTableText(record, column.dataIndex) }}
                  </template>
                </template>
              </Table>
            </Card>
          </div>
        </Card>
      </section>

      <Modal
        :footer="null"
        :open="statusModalOpen"
        title="状态操作"
        @cancel="statusModalOpen = false"
      >
        <Form class="terminal-device-management__form" @submit.prevent="changeSelectedDeviceStatus">
          <select v-model="statusForm.targetStatus" class="terminal-device-management__select">
            <option value="DISABLED">DISABLED</option>
            <option value="LOST">LOST</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DECOMMISSIONED">DECOMMISSIONED</option>
          </select>
          <Input v-model:value="statusForm.reason" placeholder="状态变更原因，必须用于审计" />
          <Button html-type="submit" :loading="changingStatus" type="primary">提交状态变更</Button>
        </Form>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.terminal-device-management {
  display: grid;
  gap: 16px;
}

.terminal-device-management__alert {
  margin-bottom: 4px;
}

.terminal-device-management__layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1.4fr) minmax(360px, 0.8fr);
}

.terminal-device-management__filters,
.terminal-device-management__form {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.terminal-device-management__compact-form {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.terminal-device-management__filters {
  grid-template-columns: minmax(220px, 1fr) 180px 96px;
}

.terminal-device-management__form label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.terminal-device-management__select {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  min-height: 32px;
  padding: 0 10px;
}

.terminal-device-management__subtable,
.terminal-device-management__nested {
  margin-top: 16px;
}

.terminal-device-management__hint {
  color: #667085;
  margin: 0 0 16px;
}

.terminal-device-management__checkbox {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.terminal-device-management__detail {
  display: grid;
  gap: 12px;
}

@media (max-width: 1180px) {
  .terminal-device-management__layout,
  .terminal-device-management__filters {
    grid-template-columns: 1fr;
  }
}
</style>
