<script lang="ts" setup>
import type { TerminalDeviceApi } from '#/api';
import type { TableColumnsType } from 'ant-design-vue';

import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Menu,
  Modal,
  QRCode,
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
  listTerminalDeviceDiagnosticLogsApi,
  listTerminalDeviceHeartbeatRecordsApi,
  listTerminalDeviceEnrollmentsApi,
  listTerminalDevicesApi,
  revokeTerminalDeviceEnrollmentApi,
  updateTerminalDeviceVersionPolicyApi,
} from '#/api';
import { $t } from '#/locales';

interface SelectOption {
  label: string;
  value: string;
}

const operationColumnTitle = '操作';
type DeviceActionKey = 'detail' | 'diagnostic-logs' | 'heartbeats' | 'status';
type RegistrationStep = 'device-info' | 'qr-binding' | 'success';

interface StatusOperationTarget {
  displayName?: null | string;
  status?: null | TerminalDeviceApi.TerminalDeviceStatus;
  terminalDeviceId: string;
}

interface TableActionMenuItem<ActionKey extends string> {
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  key: ActionKey;
  label: string;
  testId?: string;
}

const devices = ref<TerminalDeviceApi.DeviceListItem[]>([]);
const auditEvents = ref<TerminalDeviceApi.AuditEvent[]>([]);
const diagnosticLogs = ref<TerminalDeviceApi.DiagnosticLog[]>([]);
const heartbeatRecords = ref<TerminalDeviceApi.HeartbeatRecord[]>([]);
const issuedEnrollment = ref<null | TerminalDeviceApi.Enrollment>(null);
const selectedDeviceDetail = ref<null | TerminalDeviceApi.DeviceDetail>(null);
const selectedStatusDevice = ref<null | StatusOperationTarget>(null);
const selectedDiagnosticsDeviceId = ref('');
const loading = ref(false);
const detailLoading = ref(false);
const diagnosticLoading = ref(false);
const savingEnrollment = ref(false);
const closingRegistration = ref(false);
const savingVersionPolicy = ref(false);
const changingStatus = ref(false);
const registrationModalOpen = ref(false);
const deviceDetailDrawerOpen = ref(false);
const diagnosticLogsModalOpen = ref(false);
const heartbeatRecordsModalOpen = ref(false);
const statusModalOpen = ref(false);
const versionPolicyDrawerOpen = ref(false);
const registrationStep = ref<RegistrationStep>('device-info');
const loadError = ref('');
const heartbeatRecordsRefreshTimer = ref<number | null>(null);
const registrationPollingTimer = ref<number | null>(null);

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

const statusTargetValues: TerminalDeviceApi.TerminalDeviceStatus[] = [
  'ACTIVE',
  'DISABLED',
  'LOST',
  'MAINTENANCE',
  'DECOMMISSIONED',
];
const statusFilterValues: Array<'' | TerminalDeviceApi.TerminalDeviceStatus> = [
  '',
  'ACTIVE',
  'DISABLED',
  'LOST',
  'MAINTENANCE',
  'PENDING_APPROVAL',
  'DECOMMISSIONED',
];

const deviceColumns = computed<TableColumnsType>(() => [
  { dataIndex: 'displayName', title: '设备' },
  { dataIndex: 'status', title: '状态', width: 140 },
  { dataIndex: 'presenceStatus', title: '在线状态', width: 120 },
  { dataIndex: 'appVersion', title: 'App 版本', width: 120 },
  { dataIndex: 'lastReportedAccount', title: '最近上报账号（非当前会话）' },
  { dataIndex: 'lastHeartbeatAt', title: '最近 heartbeat', width: 180 },
  { align: 'center', fixed: 'right', key: 'actions', title: operationColumnTitle, width: 120 },
]);

const auditColumns = computed<TableColumnsType>(() => [
  { dataIndex: 'action', title: '动作' },
  { dataIndex: 'operatorAccountId', title: '管理员账号' },
  { dataIndex: 'reason', title: '原因' },
  { dataIndex: 'occurredAt', title: '发生时间' },
]);
const heartbeatColumns = computed<TableColumnsType>(() => [
  { dataIndex: 'receivedAt', title: '接收时间', width: 180 },
  { dataIndex: 'appVersion', title: 'App', width: 110 },
  { dataIndex: 'networkType', title: '网络', width: 100 },
  { dataIndex: 'batteryLevel', title: '电量', width: 90 },
  { dataIndex: 'reportedAccountId', title: '上报账号' },
]);
const diagnosticLogColumns = computed<TableColumnsType>(() => [
  { dataIndex: 'receivedAt', title: '上传时间', width: 180 },
  { dataIndex: 'level', title: '级别', width: 90 },
  { dataIndex: 'eventType', title: '事件' },
  { dataIndex: 'message', title: '消息' },
]);

// Exposes terminal device row operations for the native Ant Design dropdown.
function getDeviceActionItems(
  device: Record<string, unknown>,
): TableActionMenuItem<DeviceActionKey>[] {
  const terminalDeviceId = `${device.terminalDeviceId ?? ''}`;

  return [
    {
      key: 'detail',
      label: '详情',
      testId: `terminal-device-detail-${terminalDeviceId}`,
    },
    {
      key: 'heartbeats',
      label: 'Heartbeat 记录',
      testId: `terminal-device-heartbeats-${terminalDeviceId}`,
    },
    {
      key: 'diagnostic-logs',
      label: '上传日志',
      testId: `terminal-device-diagnostic-logs-${terminalDeviceId}`,
    },
    {
      key: 'status',
      label: '修改状态',
      testId: `terminal-device-status-${terminalDeviceId}`,
    },
  ];
}

// Filters hidden table actions before handing them to Ant Design Menu.
function getVisibleTableActionItems<ActionKey extends string>(items: TableActionMenuItem<ActionKey>[]) {
  return items.filter((item) => !item.hidden);
}

const selectedCurrentSessions = computed(() => selectedDeviceDetail.value?.currentSessions ?? []);
const selectedDeviceTitle = computed(() => selectedDeviceDetail.value?.device.displayName || '未命名设备');
const selectedStatusDeviceTitle = computed(() => selectedStatusDevice.value?.displayName || selectedStatusDevice.value?.terminalDeviceId || '-');
const statusTargetOptions = computed(() => resolveStatusTargetOptions(selectedStatusDevice.value?.status ?? null));
const statusOptions = computed<SelectOption[]>(() =>
  statusFilterValues.map((status) => ({
    label: status ? formatDeviceStatus(status) : $t('page.terminalDevice.status.all'),
    value: status,
  })),
);
const statusModalTitle = computed(() =>
  statusForm.targetStatus === 'DECOMMISSIONED'
    ? $t('page.terminalDevice.statusOperation.decommissionTitle')
    : $t('page.terminalDevice.statusOperation.title'),
);
const issuedEnrollmentQrValue = computed(
  () => issuedEnrollment.value?.qrPayload || issuedEnrollment.value?.enrollmentCode || '',
);
const registeredTerminalDeviceId = computed(() => issuedEnrollment.value?.usedByTerminalDeviceId || '');
const registrationStepView = computed(() => {
  switch (registrationStep.value) {
    case 'qr-binding':
      return {
        index: 2,
        title: 'PDA 扫码',
      };
    case 'success':
      return {
        index: 3,
        title: '完成注册',
      };
    default:
      return {
        index: 1,
        title: '设备信息',
      };
  }
});

// Loads device, enrollment, and version policy data from the Admin BFF read contracts.
async function loadDashboard(): Promise<void> {
  loading.value = true;
  loadError.value = '';
  try {
    const deviceResult = await listTerminalDevicesApi({
      keyword: deviceFilters.keyword.trim() || undefined,
      page: 1,
      pageSize: 20,
      status: (deviceFilters.status || undefined) as TerminalDeviceApi.TerminalDeviceStatus | undefined,
      terminalDeviceType: 'PDA',
    });
    devices.value = deviceResult.items;
  } catch (error) {
    loadError.value = getErrorMessage(error, '加载终端设备管理数据失败');
  } finally {
    loading.value = false;
  }
}

// Creates one administrator-issued PDA registration code and starts waiting for PDA activation.
async function createEnrollment(): Promise<void> {
  const displayName = enrollmentForm.displayName.trim();
  if (!displayName) {
    message.error('请先填写设备显示名');
    return;
  }

  savingEnrollment.value = true;
  try {
    issuedEnrollment.value = await createTerminalDeviceEnrollmentApi({
      displayName,
      expectedManufacturerSerial: nullableText(enrollmentForm.expectedManufacturerSerial),
      expiresAt: defaultEnrollmentExpiresAt(),
      notes: nullableText(enrollmentForm.notes),
      terminalDeviceType: 'PDA',
    });
    message.success('设备注册码已生成');
    registrationStep.value = 'qr-binding';
    startRegistrationPolling();
    await loadDashboard();
  } catch (error) {
    message.error(getErrorMessage(error, '生成设备注册码失败'));
  } finally {
    savingEnrollment.value = false;
  }
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
    deviceDetailDrawerOpen.value = true;
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

// Opens the registration wizard with a fresh form for issuing one PDA registration authorization.
function openRegistrationModal(): void {
  stopRegistrationPolling();
  resetEnrollmentForm();
  issuedEnrollment.value = null;
  registrationStep.value = 'device-info';
  registrationModalOpen.value = true;
}

// Opens version policy governance lazily so it does not dominate daily device management.
async function openVersionPolicyDrawer(): Promise<void> {
  versionPolicyDrawerOpen.value = true;
  try {
    const policy = await getTerminalDeviceVersionPolicyApi({ terminalDeviceType: 'PDA' });
    applyVersionPolicy(policy);
  } catch (error) {
    message.error(getErrorMessage(error, '加载版本策略失败'));
  }
}

// Handles the device list action dropdown without adding secondary blocks to the page body.
function handleDeviceListActionMenu({ key }: { key: number | string }): void {
  if (key === 'enrollment') {
    openRegistrationModal();
    return;
  }

  if (key === 'version-policy') {
    void openVersionPolicyDrawer();
  }
}

// Polls the enrollment list until the one-time registration code is consumed by a PDA.
async function pollRegistrationStatus(): Promise<void> {
  if (!issuedEnrollment.value || registrationStep.value !== 'qr-binding') {
    return;
  }

  try {
    const result = await listTerminalDeviceEnrollmentsApi({
      page: 1,
      pageSize: 20,
      terminalDeviceType: 'PDA',
    });
    const latest = result.items.find((item) => item.enrollmentId === issuedEnrollment.value?.enrollmentId);
    if (!latest) {
      return;
    }

    issuedEnrollment.value = {
      ...issuedEnrollment.value,
      ...latest,
    };

    if (latest.status === 'USED') {
      registrationStep.value = 'success';
      stopRegistrationPolling();
      await loadDashboard();
    }
  } catch (error) {
    message.error(getErrorMessage(error, '刷新注册状态失败'));
  }
}

// Starts lightweight polling for QR activation status while the registration modal is open.
function startRegistrationPolling(): void {
  stopRegistrationPolling();
  void pollRegistrationStatus();
  registrationPollingTimer.value = window.setInterval(() => {
    void pollRegistrationStatus();
  }, 3000);
}

// Stops registration polling when the wizard is closed or reaches a terminal state.
function stopRegistrationPolling(): void {
  if (!registrationPollingTimer.value) {
    return;
  }

  window.clearInterval(registrationPollingTimer.value);
  registrationPollingTimer.value = null;
}

// Closes registration and revokes an unused issued code so interrupted flows must restart cleanly.
async function closeRegistrationModal(): Promise<void> {
  stopRegistrationPolling();
  if (issuedEnrollment.value?.status === 'ISSUED') {
    closingRegistration.value = true;
    try {
      await revokeTerminalDeviceEnrollmentApi(issuedEnrollment.value.enrollmentId, {
        reason: 'Registration wizard closed before PDA activation',
      });
    } catch (error) {
      message.error(getErrorMessage(error, '撤销未完成注册码失败'));
    } finally {
      closingRegistration.value = false;
    }
  }

  registrationModalOpen.value = false;
  issuedEnrollment.value = null;
  registrationStep.value = 'device-info';
}

// Handles one row action menu while preserving table row shape validation.
function handleDeviceRowActionMenu({ key }: { key: number | string }, record: Record<string, unknown>): void {
  if (key === 'detail') {
    void openDeviceDetailFromRecord(record);
    return;
  }

  if (key === 'heartbeats') {
    void openHeartbeatRecordsFromRecord(record);
    return;
  }

  if (key === 'diagnostic-logs') {
    void openDiagnosticLogsFromRecord(record);
    return;
  }

  if (key === 'status') {
    openStatusOperationDialog(undefined, normalizeStatusOperationTarget(record));
  }
}

// Dispatches one terminal device dropdown menu action after narrowing the row payload.
function handleDeviceRowAction(actionKey: DeviceActionKey, record: Record<string, unknown>): void {
  handleDeviceRowActionMenu({ key: actionKey }, record);
}

// Opens heartbeat diagnostics from Ant Design table slot records after validating the device id.
async function openHeartbeatRecordsFromRecord(record: Record<string, unknown>): Promise<void> {
  const terminalDeviceId = `${record.terminalDeviceId ?? ''}`.trim();
  if (!terminalDeviceId) {
    return;
  }

  await openHeartbeatRecords(terminalDeviceId);
}

// Opens uploaded diagnostic logs from Ant Design table slot records after validating the device id.
async function openDiagnosticLogsFromRecord(record: Record<string, unknown>): Promise<void> {
  const terminalDeviceId = `${record.terminalDeviceId ?? ''}`.trim();
  if (!terminalDeviceId) {
    return;
  }

  await openDiagnosticLogs(terminalDeviceId);
}

// Loads immutable heartbeat records into a compact diagnostic modal.
async function openHeartbeatRecords(terminalDeviceId: string): Promise<void> {
  selectedDiagnosticsDeviceId.value = terminalDeviceId;
  heartbeatRecordsModalOpen.value = true;
  await loadHeartbeatRecords(terminalDeviceId);
  startHeartbeatRecordsAutoRefresh();
}

// Refreshes heartbeat diagnostics for one selected terminal device.
async function loadHeartbeatRecords(terminalDeviceId: string): Promise<void> {
  diagnosticLoading.value = true;
  try {
    const result = await listTerminalDeviceHeartbeatRecordsApi(terminalDeviceId, {
      page: 1,
      pageSize: 50,
    });
    heartbeatRecords.value = result.items;
  } catch (error) {
    message.error(getErrorMessage(error, '加载 heartbeat 记录失败'));
  } finally {
    diagnosticLoading.value = false;
  }
}

// Manually reloads heartbeat diagnostics for the selected terminal device.
async function refreshHeartbeatRecords(): Promise<void> {
  if (!selectedDiagnosticsDeviceId.value) {
    return;
  }

  await loadHeartbeatRecords(selectedDiagnosticsDeviceId.value);
}

// Starts the heartbeat diagnostics refresh loop while the modal remains open.
function startHeartbeatRecordsAutoRefresh(): void {
  stopHeartbeatRecordsAutoRefresh();
  heartbeatRecordsRefreshTimer.value = window.setInterval(() => {
    if (!heartbeatRecordsModalOpen.value || !selectedDiagnosticsDeviceId.value) {
      return;
    }

    void loadHeartbeatRecords(selectedDiagnosticsDeviceId.value);
  }, 10_000);
}

// Stops heartbeat diagnostics refresh to avoid background API calls after close.
function stopHeartbeatRecordsAutoRefresh(): void {
  if (heartbeatRecordsRefreshTimer.value === null) {
    return;
  }

  window.clearInterval(heartbeatRecordsRefreshTimer.value);
  heartbeatRecordsRefreshTimer.value = null;
}

// Closes the heartbeat diagnostics modal and its refresh loop together.
function closeHeartbeatRecordsModal(): void {
  heartbeatRecordsModalOpen.value = false;
  stopHeartbeatRecordsAutoRefresh();
}

// Loads recently uploaded diagnostic logs into a compact diagnostic modal.
async function openDiagnosticLogs(terminalDeviceId: string): Promise<void> {
  diagnosticLoading.value = true;
  selectedDiagnosticsDeviceId.value = terminalDeviceId;
  diagnosticLogsModalOpen.value = true;
  try {
    const result = await listTerminalDeviceDiagnosticLogsApi(terminalDeviceId, {
      page: 1,
      pageSize: 50,
    });
    diagnosticLogs.value = result.items;
  } catch (error) {
    message.error(getErrorMessage(error, '加载上传日志失败'));
  } finally {
    diagnosticLoading.value = false;
  }
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
  const target = selectedStatusDevice.value;
  if (!target || !statusForm.targetStatus) {
    return;
  }
  changingStatus.value = true;
  try {
    await changeTerminalDeviceStatusApi(target.terminalDeviceId, {
      reason: nullableText(statusForm.reason),
      targetStatus: statusForm.targetStatus as TerminalDeviceApi.TerminalDeviceStatus,
    });
    message.success('设备状态变更已提交');
    if (deviceDetailDrawerOpen.value && selectedDeviceDetail.value?.device.terminalDeviceId === target.terminalDeviceId) {
      await openDeviceDetail({
        terminalDeviceId: target.terminalDeviceId,
      });
    }
    await loadDashboard();
    statusModalOpen.value = false;
    selectedStatusDevice.value = null;
  } catch (error) {
    message.error(getErrorMessage(error, '变更设备状态失败'));
  } finally {
    changingStatus.value = false;
  }
}

// Opens the status operation dialog with a preselected target and fresh audit reason.
function openStatusOperationDialog(
  targetStatus?: TerminalDeviceApi.TerminalDeviceStatus,
  targetDevice?: null | StatusOperationTarget,
): void {
  selectedStatusDevice.value =
    targetDevice ??
    (selectedDeviceDetail.value
      ? {
          displayName: selectedDeviceDetail.value.device.displayName,
          status: selectedDeviceDetail.value.device.status,
          terminalDeviceId: selectedDeviceDetail.value.device.terminalDeviceId,
        }
      : null);
  if (!selectedStatusDevice.value) {
    return;
  }
  if (targetStatus) {
    statusForm.targetStatus = targetStatus;
  } else {
    statusForm.targetStatus = statusTargetOptions.value[0]?.value ?? '';
  }
  statusForm.reason = '';
  statusModalOpen.value = true;
}

// Closes the status operation modal without keeping a stale device target in memory.
function closeStatusOperationDialog(): void {
  statusModalOpen.value = false;
  selectedStatusDevice.value = null;
}

// Narrows a table row into the minimal payload needed for a status command.
function normalizeStatusOperationTarget(record: Record<string, unknown>): StatusOperationTarget | null {
  const terminalDeviceId = `${record.terminalDeviceId ?? ''}`.trim();
  if (!terminalDeviceId) {
    return null;
  }

  return {
    displayName: typeof record.displayName === 'string' ? record.displayName : null,
    status: typeof record.status === 'string' ? (record.status as TerminalDeviceApi.TerminalDeviceStatus) : null,
    terminalDeviceId,
  };
}

// Resolves legal admin-facing target choices while leaving final lifecycle enforcement to the owner service.
function resolveStatusTargetOptions(status: TerminalDeviceApi.TerminalDeviceStatus | null): SelectOption[] {
  if (status === 'DECOMMISSIONED') {
    return [];
  }

  return statusTargetValues
    .filter((value) => value !== status)
    .map((value) => ({
      label: formatDeviceStatus(value),
      value,
    }));
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

// Clears the enrollment form after successful issue or before a fresh drawer open.
function resetEnrollmentForm(): void {
  enrollmentForm.displayName = '';
  enrollmentForm.expectedManufacturerSerial = '';
  enrollmentForm.expiresAt = '';
  enrollmentForm.notes = '';
}

// Provides a short default validity window so registration remains explicit without manual timestamp typing.
function defaultEnrollmentExpiresAt(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
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

// formatDeviceStatus renders lifecycle status with the active tenant-web locale catalog.
function formatDeviceStatus(status?: string): string {
  return status ? $t(`page.terminalDevice.status.${status}`) : '-';
}

// formatPresenceStatus renders heartbeat-derived presence with the active tenant-web locale catalog.
function formatPresenceStatus(status?: string): string {
  return status ? $t(`page.terminalDevice.presence.${status}`) : '-';
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

onBeforeUnmount(() => {
  stopRegistrationPolling();
  stopHeartbeatRecordsAutoRefresh();
});

defineExpose({
  changeSelectedDeviceStatus,
  closeRegistrationModal,
  createEnrollment,
  enrollmentForm,
  handleDeviceListActionMenu,
  handleDeviceRowActionMenu,
  formatDeviceStatus,
  formatPresenceStatus,
  issuedEnrollment,
  openDiagnosticLogs,
  openDeviceDetail,
  openHeartbeatRecords,
  openRegistrationModal,
  openStatusOperationDialog,
  openVersionPolicyDrawer,
  pollRegistrationStatus,
  registrationStep,
  refreshHeartbeatRecords,
  saveVersionPolicy,
  statusForm,
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

      <section class="terminal-device-management__main">
        <Card class="terminal-device-management__full-card" title="设备列表">
          <template #extra>
            <Dropdown trigger="click">
              <Button type="primary">设备操作</Button>
              <template #overlay>
                <Menu @click="handleDeviceListActionMenu">
                  <Menu.Item key="enrollment">注册新设备</Menu.Item>
                  <Menu.Item key="version-policy">版本策略</Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>

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
            :scroll="{ x: 1180 }"
            row-key="terminalDeviceId"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'status'">
                <Tag :color="getStatusColor(record.status)">{{ formatDeviceStatus(record.status) }}</Tag>
              </template>
              <template v-else-if="column.dataIndex === 'presenceStatus'">
                <Tag :color="record.presenceStatus === 'ONLINE' ? 'green' : 'default'">
                  {{ formatPresenceStatus(record.presenceStatus) }}
                </Tag>
              </template>
              <template v-else-if="column.dataIndex === 'lastReportedAccount'">
                {{ record.lastReportedAccount?.displayName || '-' }}
              </template>
              <template v-else-if="column.dataIndex === 'lastHeartbeatAt'">
                {{ formatTime(record.lastHeartbeatAt) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Dropdown
                  v-if="getVisibleTableActionItems(getDeviceActionItems(record)).length > 0"
                  :trigger="['click']"
                >
                  <Button aria-label="终端设备操作" shape="circle" size="small" type="text">
                    <IconifyIcon icon="ant-design:more-outlined" />
                  </Button>
                  <template #overlay>
                    <Menu @click="(info) => handleDeviceRowAction(String(info.key) as DeviceActionKey, record)">
                      <Menu.Item
                        v-for="item in getVisibleTableActionItems(getDeviceActionItems(record))"
                        :key="item.key"
                        :danger="item.danger"
                        :data-testid="item.testId"
                        :disabled="item.disabled"
                      >
                        {{ item.label }}
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
                <span v-else class="tenant-table-action-empty">无可用操作</span>
              </template>
              <template v-else>
                {{ getTableText(record, column.dataIndex) }}
              </template>
            </template>
          </Table>
        </Card>
      </section>

      <Modal
        :footer="null"
        :open="registrationModalOpen"
        title="注册新设备"
        :width="340"
        wrap-class-name="terminal-device-management__registration-modal-wrap"
        @cancel="() => void closeRegistrationModal()"
      >
        <div class="terminal-device-management__registration-wizard">
          <div class="terminal-device-management__registration-step-head">
            <span>步骤 {{ registrationStepView.index }}/3</span>
            <h3>{{ registrationStepView.title }}</h3>
          </div>

          <div class="terminal-device-management__registration-step-stage">
            <Transition mode="out-in" name="terminal-device-management__step-transition">
              <Form
                v-if="registrationStep === 'device-info'"
                key="device-info"
                class="terminal-device-management__form terminal-device-management__registration-step-panel"
                data-registration-step="device-info"
                @submit.prevent="createEnrollment"
              >
                <label>
                  <span>设备显示名</span>
                  <Input v-model:value="enrollmentForm.displayName" placeholder="PDA-Warehouse-01" />
                </label>
                <label>
                  <span>预期厂商序列号</span>
                  <Input
                    v-model:value="enrollmentForm.expectedManufacturerSerial"
                    placeholder="可选，留空则扫码时采集"
                  />
                </label>
                <label>
                  <span>备注</span>
                  <Input v-model:value="enrollmentForm.notes" placeholder="Issued for warehouse pilot" />
                </label>
                <div class="terminal-device-management__registration-actions">
                  <Button :loading="closingRegistration" @click="() => void closeRegistrationModal()">取消</Button>
                  <Button html-type="submit" :loading="savingEnrollment" type="primary">生成二维码</Button>
                </div>
              </Form>

              <div
                v-else-if="registrationStep === 'qr-binding'"
                key="qr-binding"
                class="terminal-device-management__registration-result terminal-device-management__registration-step-panel"
                data-registration-step="qr-binding"
              >
                <QRCode v-if="issuedEnrollmentQrValue" :value="issuedEnrollmentQrValue" />
                <div class="terminal-device-management__registration-code">
                  <span>注册码</span>
                  <strong>{{ issuedEnrollment?.enrollmentCode || '-' }}</strong>
                </div>
                <div class="terminal-device-management__registration-meta">
                  <span>有效期至</span>
                  <strong>{{ formatTime(issuedEnrollment?.expiresAt) }}</strong>
                </div>
                <div class="terminal-device-management__registration-actions">
                  <Button :loading="closingRegistration" @click="() => void closeRegistrationModal()">取消</Button>
                  <Button @click="() => void pollRegistrationStatus()">刷新状态</Button>
                </div>
              </div>

              <div
                v-else
                key="success"
                class="terminal-device-management__registration-success terminal-device-management__registration-step-panel"
                data-registration-step="success"
              >
                <Tag color="green">已绑定</Tag>
                <h3>{{ issuedEnrollment?.displayName || '设备' }} 已完成注册</h3>
                <p v-if="registeredTerminalDeviceId">{{ registeredTerminalDeviceId }}</p>
                <Button type="primary" @click="() => void closeRegistrationModal()">完成</Button>
              </div>
            </Transition>
          </div>
        </div>
      </Modal>

      <Drawer
        :open="deviceDetailDrawerOpen"
        title="设备详情"
        width="760"
        @close="deviceDetailDrawerOpen = false"
      >
        <div class="terminal-device-management__drawer-body">
          <Empty v-if="!selectedDeviceDetail && !detailLoading" description="选择一台设备查看详情、会话和审计" />
          <div v-else class="terminal-device-management__detail">
            <header class="terminal-device-management__detail-header">
              <div>
                <h3>{{ selectedDeviceTitle }}</h3>
                <p>{{ selectedDeviceDetail?.device.terminalDeviceId }}</p>
              </div>
              <Tag :color="getStatusColor(selectedDeviceDetail?.device.status)">
                {{ formatDeviceStatus(selectedDeviceDetail?.device.status) }}
              </Tag>
            </header>

            <div class="terminal-device-management__detail-actions">
              <Button
                size="small"
                @click="() => selectedDeviceDetail && openHeartbeatRecords(selectedDeviceDetail.device.terminalDeviceId)"
              >
                Heartbeat 记录
              </Button>
              <Button
                size="small"
                @click="() => selectedDeviceDetail && openDiagnosticLogs(selectedDeviceDetail.device.terminalDeviceId)"
              >
                上传日志
              </Button>
            </div>

            <div class="terminal-device-management__facts">
              <div>
                <span>类型</span>
                <strong>{{ selectedDeviceDetail?.device.terminalDeviceType || '-' }}</strong>
              </div>
              <div>
                <span>硬件</span>
                <strong>
                  {{ selectedDeviceDetail?.identity.manufacturer || '-' }}
                  {{ selectedDeviceDetail?.identity.model || '' }}
                </strong>
              </div>
              <div>
                <span>App</span>
                <strong>{{ selectedDeviceDetail?.runtime.appVersion || '-' }}</strong>
              </div>
              <div>
                <span>Android</span>
                <strong>{{ selectedDeviceDetail?.runtime.androidVersion || '-' }}</strong>
              </div>
              <div>
                <span>最近 heartbeat</span>
                <strong>{{ formatTime(selectedDeviceDetail?.runtime.lastHeartbeatAt) }}</strong>
              </div>
              <div>
                <span>最近上报账号</span>
                <strong>{{ selectedDeviceDetail?.runtime.lastReportedAccount?.displayName || '-' }}</strong>
              </div>
            </div>

            <section class="terminal-device-management__detail-section">
              <div class="terminal-device-management__section-title">
                <h4>当前有效会话</h4>
              </div>
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
            </section>

            <section class="terminal-device-management__detail-section">
              <div class="terminal-device-management__section-title">
                <h4>设备治理审计</h4>
              </div>
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
            </section>
          </div>
        </div>
      </Drawer>

      <Drawer
        :open="versionPolicyDrawerOpen"
        title="版本策略"
        width="560"
        @close="versionPolicyDrawerOpen = false"
      >
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
      </Drawer>

      <Modal
        :footer="null"
        :open="statusModalOpen"
        :title="statusModalTitle"
        @cancel="closeStatusOperationDialog"
      >
        <Form class="terminal-device-management__form" @submit.prevent="changeSelectedDeviceStatus">
          <div class="terminal-device-management__status-target">
            <span>目标设备</span>
            <strong>{{ selectedStatusDeviceTitle }}</strong>
          </div>
          <select v-model="statusForm.targetStatus" class="terminal-device-management__select">
            <option
              v-for="option in statusTargetOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <p v-if="statusTargetOptions.length === 0" class="terminal-device-management__status-empty">
            退役设备是终态，不能再变更生命周期状态。
          </p>
          <Input v-model:value="statusForm.reason" :placeholder="$t('page.terminalDevice.statusOperation.reasonPlaceholder')" />
          <Button
            html-type="submit"
            :disabled="statusTargetOptions.length === 0"
            :loading="changingStatus"
            type="primary"
          >
            提交状态变更
          </Button>
        </Form>
      </Modal>

      <Modal
        :footer="null"
        :open="heartbeatRecordsModalOpen"
        title="Heartbeat 记录"
        :width="720"
        @cancel="closeHeartbeatRecordsModal"
      >
        <div class="terminal-device-management__diagnostic-modal">
          <div class="terminal-device-management__diagnostic-toolbar">
            <p>{{ selectedDiagnosticsDeviceId }}</p>
            <Button size="small" :loading="diagnosticLoading" @click="refreshHeartbeatRecords">
              刷新
            </Button>
          </div>
          <Table
            :columns="heartbeatColumns"
            :data-source="heartbeatRecords"
            :loading="diagnosticLoading"
            :locale="{ emptyText: '暂无 heartbeat 记录' }"
            row-key="heartbeatId"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'receivedAt'">
                {{ formatTime(record.receivedAt) }}
              </template>
              <template v-else>
                {{ getTableText(record, column.dataIndex) }}
              </template>
            </template>
          </Table>
        </div>
      </Modal>

      <Modal
        :footer="null"
        :open="diagnosticLogsModalOpen"
        title="上传日志"
        :width="720"
        @cancel="diagnosticLogsModalOpen = false"
      >
        <div class="terminal-device-management__diagnostic-modal">
          <p>{{ selectedDiagnosticsDeviceId }}</p>
          <Table
            :columns="diagnosticLogColumns"
            :data-source="diagnosticLogs"
            :loading="diagnosticLoading"
            :locale="{ emptyText: '暂无上传日志' }"
            row-key="receivedAt"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'receivedAt'">
                {{ formatTime(record.receivedAt) }}
              </template>
              <template v-else>
                {{ getTableText(record, column.dataIndex) }}
              </template>
            </template>
          </Table>
        </div>
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

.terminal-device-management__main {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr);
}

.terminal-device-management__full-card {
  min-width: 0;
}

.terminal-device-management__filters,
.terminal-device-management__form {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.terminal-device-management__filters {
  align-items: center;
  grid-template-columns: minmax(240px, 1fr) minmax(150px, 220px) minmax(96px, 128px);
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

.terminal-device-management__status-target {
  border-bottom: 1px solid #f2f4f7;
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
}

.terminal-device-management__status-target span {
  color: #667085;
  font-size: 12px;
}

.terminal-device-management__status-target strong {
  color: #101828;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.terminal-device-management__status-empty {
  color: #667085;
  font-size: 12px;
  margin: -4px 0 0;
}

:deep(.terminal-device-management__registration-modal-wrap .ant-modal) {
  max-width: min(340px, calc(100vw - 72px));
}

:deep(.terminal-device-management__registration-modal-wrap .ant-modal-body) {
  padding: 16px 18px 18px;
}

.terminal-device-management__registration-wizard {
  display: grid;
  gap: 14px;
}

.terminal-device-management__registration-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.terminal-device-management__registration-step-head {
  border-bottom: 1px solid #eef2f6;
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
}

.terminal-device-management__registration-step-head span {
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}

.terminal-device-management__registration-step-head h3 {
  color: #101828;
  font-size: 16px;
  line-height: 1.35;
  margin: 0;
}

.terminal-device-management__registration-step-stage {
  min-height: 204px;
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.terminal-device-management__registration-step-panel {
  margin-bottom: 0;
  width: 100%;
}

.terminal-device-management__step-transition-enter-active,
.terminal-device-management__step-transition-leave-active {
  transition:
    opacity 180ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.terminal-device-management__step-transition-enter-from {
  opacity: 0;
  transform: translate3d(16px, 0, 0);
}

.terminal-device-management__step-transition-leave-to {
  opacity: 0;
  transform: translate3d(-10px, 0, 0);
}

.terminal-device-management__registration-result,
.terminal-device-management__registration-success {
  align-items: center;
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
}

.terminal-device-management__registration-code,
.terminal-device-management__registration-meta {
  align-items: center;
  border-bottom: 1px solid #f2f4f7;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  max-width: 320px;
  padding-bottom: 8px;
  width: 100%;
}

.terminal-device-management__registration-code span,
.terminal-device-management__registration-meta span {
  color: #667085;
  font-size: 12px;
}

.terminal-device-management__registration-code strong,
.terminal-device-management__registration-meta strong {
  color: #101828;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.terminal-device-management__registration-success h3 {
  color: #101828;
  font-size: 16px;
  line-height: 1.4;
  margin: 0;
}

.terminal-device-management__registration-success p {
  color: #667085;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  margin: 0;
}

.terminal-device-management__detail {
  color: #344054;
  display: grid;
  gap: 18px;
}

.terminal-device-management__drawer-body {
  min-width: 0;
}

.terminal-device-management__detail-header {
  align-items: flex-start;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding-bottom: 14px;
}

.terminal-device-management__detail-header h3 {
  color: #101828;
  font-size: 18px;
  font-weight: 650;
  line-height: 1.35;
  margin: 0;
}

.terminal-device-management__detail-header p {
  color: #667085;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  font-size: 12px;
  margin: 4px 0 0;
  word-break: break-all;
}

.terminal-device-management__detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.terminal-device-management__facts {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.terminal-device-management__facts div {
  border-bottom: 1px solid #f2f4f7;
  display: grid;
  gap: 4px;
  min-width: 0;
  padding-bottom: 10px;
}

.terminal-device-management__facts span {
  color: #667085;
  font-size: 12px;
}

.terminal-device-management__facts strong {
  color: #101828;
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
  overflow-wrap: anywhere;
}

.terminal-device-management__detail-section {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.terminal-device-management__section-title {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.terminal-device-management__section-title h4 {
  color: #101828;
  font-size: 14px;
  font-weight: 650;
  margin: 0;
}

.terminal-device-management__diagnostic-modal {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.terminal-device-management__diagnostic-toolbar {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-width: 0;
}

.terminal-device-management__diagnostic-modal p,
.terminal-device-management__diagnostic-toolbar p {
  color: #667085;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  flex: 1;
  font-size: 12px;
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  .terminal-device-management__filters {
    grid-template-columns: 1fr;
  }

  .terminal-device-management__facts {
    grid-template-columns: 1fr;
  }
}
</style>
