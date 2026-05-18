/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as antd from '../__tests__/ant-design-vue-mock';

const changeTerminalDeviceStatusApi = vi.fn();
const createTerminalDeviceEnrollmentApi = vi.fn();
const getTerminalDeviceApi = vi.fn();
const getTerminalDeviceVersionPolicyApi = vi.fn();
const listTerminalDeviceAuditEventsApi = vi.fn();
const listTerminalDeviceDiagnosticLogsApi = vi.fn();
const listTerminalDeviceEnrollmentsApi = vi.fn();
const listTerminalDeviceHeartbeatRecordsApi = vi.fn();
const listTerminalDevicesApi = vi.fn();
const revokeTerminalDeviceEnrollmentApi = vi.fn();
const updateTerminalDeviceVersionPolicyApi = vi.fn();

vi.mock('ant-design-vue', () => antd);

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<main><h1>{{ title }}</h1><slot /></main>',
  },
}));

vi.mock('#/api', () => ({
  changeTerminalDeviceStatusApi,
  createTerminalDeviceEnrollmentApi,
  getTerminalDeviceApi,
  getTerminalDeviceVersionPolicyApi,
  listTerminalDeviceAuditEventsApi,
  listTerminalDeviceDiagnosticLogsApi,
  listTerminalDeviceEnrollmentsApi,
  listTerminalDeviceHeartbeatRecordsApi,
  listTerminalDevicesApi,
  revokeTerminalDeviceEnrollmentApi,
  updateTerminalDeviceVersionPolicyApi,
}));

// Verifies the managed terminal device admin page keeps management truth separate from runtime diagnostics.
describe('terminal device management page', () => {
  beforeEach(() => {
    vi.useRealTimers();
    changeTerminalDeviceStatusApi.mockReset();
    createTerminalDeviceEnrollmentApi.mockReset();
    getTerminalDeviceApi.mockReset();
    getTerminalDeviceVersionPolicyApi.mockReset();
    listTerminalDeviceAuditEventsApi.mockReset();
    listTerminalDeviceDiagnosticLogsApi.mockReset();
    listTerminalDeviceEnrollmentsApi.mockReset();
    listTerminalDeviceHeartbeatRecordsApi.mockReset();
    listTerminalDevicesApi.mockReset();
    revokeTerminalDeviceEnrollmentApi.mockReset();
    updateTerminalDeviceVersionPolicyApi.mockReset();
    revokeTerminalDeviceEnrollmentApi.mockResolvedValue({
      enrollmentId: 'enr_003',
      revokedAt: '2026-05-16T10:05:00Z',
      revokedBy: 'acc_admin',
      status: 'REVOKED',
    });

    listTerminalDevicesApi.mockResolvedValue({
      items: [
        {
          appVersion: '2.0.0',
          displayName: 'PDA-Warehouse-01',
          lastHeartbeatAt: '2026-05-16T10:10:03Z',
          lastReportedAccount: {
            accountId: 'acc_001',
            displayName: 'Zhang San',
          },
          presenceStatus: 'ONLINE',
          registeredAt: '2026-05-16T10:00:03Z',
          status: 'ACTIVE',
          terminalDeviceId: 'tdv_001',
          terminalDeviceType: 'PDA',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    createTerminalDeviceEnrollmentApi.mockResolvedValue({
      createdAt: '2026-05-16T10:00:00Z',
      createdBy: 'acc_admin',
      displayName: 'PDA-Warehouse-03',
      enrollmentCode: 'ENR-123456',
      enrollmentId: 'enr_003',
      expiresAt: '2026-05-16T11:00:00Z',
      qrPayload: 'oes-pda-enrollment://ENR-123456',
      status: 'ISSUED',
      terminalDeviceType: 'PDA',
    });
    listTerminalDeviceEnrollmentsApi.mockResolvedValue({
      items: [
        {
          createdAt: '2026-05-16T10:00:00Z',
          displayName: 'PDA-Warehouse-02',
          enrollmentId: 'enr_001',
          expiresAt: '2026-05-17T10:00:00Z',
          status: 'ISSUED',
          terminalDeviceType: 'PDA',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    getTerminalDeviceVersionPolicyApi.mockResolvedValue({
      latestAppVersion: '2.1.0',
      minSupportedAppVersion: '2.0.0',
      tenantId: 'tenant_001',
      terminalDeviceType: 'PDA',
      upgradeRecommended: true,
      upgradeRequired: false,
    });
    getTerminalDeviceApi.mockResolvedValue({
      auditSummary: {},
      currentSessions: [
        {
          accountId: 'acc_001',
          createdAt: '2026-05-16T09:00:00Z',
          displayName: 'Zhang San',
          sessionId: 'sess_001',
        },
      ],
      device: {
        displayName: 'PDA-Warehouse-01',
        registeredAt: '2026-05-16T10:00:03Z',
        status: 'ACTIVE',
        tenantId: 'tenant_001',
        terminalDeviceId: 'tdv_001',
        terminalDeviceType: 'PDA',
      },
      identity: {
        identityConfidence: 'HIGH',
        manufacturer: 'Seuic',
        model: 'Cruise Ge',
      },
      runtime: {
        appVersion: '2.0.0',
        lastReportedAccount: {
          accountId: 'acc_001',
          displayName: 'Zhang San',
        },
        presenceStatus: 'ONLINE',
      },
    });
    listTerminalDeviceAuditEventsApi.mockResolvedValue({
      items: [
        {
          action: 'STATUS_CHANGED',
          auditEventId: 'tda_001',
          occurredAt: '2026-05-16T11:20:03Z',
          operatorAccountId: 'acc_admin',
          reason: 'Device temporarily removed from pilot',
          targetTerminalDeviceId: 'tdv_001',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    listTerminalDeviceHeartbeatRecordsApi.mockResolvedValue({
      items: [
        {
          appVersion: '2.0.0',
          heartbeatId: 'heartbeat-1',
          networkStatus: 'ONLINE',
          networkType: 'WIFI',
          presenceStatus: 'ONLINE',
          receivedAt: '2026-05-16T10:10:03Z',
          reportedAccountId: 'acc_001',
          terminalDeviceId: 'tdv_001',
        },
      ],
      page: 1,
      pageSize: 50,
      total: 1,
    });
    listTerminalDeviceDiagnosticLogsApi.mockResolvedValue({
      items: [
        {
          clientTime: '2026-05-16T10:09:00Z',
          details: {},
          diagnosticMode: false,
          eventType: 'SCAN_RECEIVED',
          level: 'INFO',
          message: 'Scan result received',
          receivedAt: '2026-05-16T10:10:00Z',
        },
      ],
      page: 1,
      pageSize: 50,
      total: 1,
    });
    updateTerminalDeviceVersionPolicyApi.mockResolvedValue({
      latestAppVersion: '2.1.0',
      minSupportedAppVersion: '2.0.0',
      tenantId: 'tenant_001',
      terminalDeviceType: 'PDA',
      upgradeRecommended: true,
      upgradeRequired: false,
    });
    changeTerminalDeviceStatusApi.mockResolvedValue({
      changedAt: '2026-05-16T12:00:00Z',
      previousStatus: 'ACTIVE',
      sessionRevokeRequired: true,
      status: 'DECOMMISSIONED',
      terminalDeviceId: 'tdv_001',
    });
  });

  it('loads dashboard data and labels runtime account as recently reported rather than current user', async () => {
    const view = await import('./index.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {},
        },
      },
    });

    await flushPromises();

    expect(listTerminalDevicesApi).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      terminalDeviceType: 'PDA',
    });
    expect(listTerminalDeviceEnrollmentsApi).not.toHaveBeenCalled();
    expect(getTerminalDeviceVersionPolicyApi).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('终端设备管理');
    expect(wrapper.text()).toContain('最近上报账号（非当前会话）');
    expect(wrapper.text()).toContain('版本策略');
    expect(wrapper.text()).toContain('注册新设备');
    expect(wrapper.text()).toContain('PDA-Warehouse-01');
  });

  it('loads device detail, current sessions, and audit events from their dedicated sources', async () => {
    const view = await import('./index.vue');
    const wrapper = mount(view.default);

    await flushPromises();
    await (wrapper.vm as any).openDeviceDetail({ terminalDeviceId: 'tdv_001' });
    await flushPromises();

    expect(getTerminalDeviceApi).toHaveBeenCalledWith('tdv_001');
    expect(listTerminalDeviceAuditEventsApi).toHaveBeenCalledWith('tdv_001', {
      page: 1,
      pageSize: 20,
    });
    expect(wrapper.find('.ant-drawer').exists()).toBe(true);
    expect(wrapper.text()).toContain('Seuic Cruise Ge');
    expect(wrapper.text()).not.toContain('生命周期');
    expect(wrapper.text()).toContain('当前有效会话');
    expect(wrapper.text()).toContain('设备治理审计');
    await (wrapper.vm as any).openHeartbeatRecords('tdv_001');
    await (wrapper.vm as any).openDiagnosticLogs('tdv_001');
    await flushPromises();

    expect(listTerminalDeviceHeartbeatRecordsApi).toHaveBeenCalledWith('tdv_001', {
      page: 1,
      pageSize: 50,
    });
    expect(listTerminalDeviceDiagnosticLogsApi).toHaveBeenCalledWith('tdv_001', {
      page: 1,
      pageSize: 50,
    });
    expect(wrapper.text()).toContain('Heartbeat 记录');
    expect(wrapper.text()).toContain('上传日志');
    expect(wrapper.text()).toContain('刷新');
    expect(wrapper.text()).toContain('WIFI');
    await (wrapper.vm as any).refreshHeartbeatRecords();
    expect(listTerminalDeviceHeartbeatRecordsApi).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('refreshes heartbeat records every 10 seconds while the heartbeat modal is open', async () => {
    vi.useFakeTimers();
    const view = await import('./index.vue');
    const wrapper = mount(view.default);

    await flushPromises();
    await (wrapper.vm as any).openHeartbeatRecords('tdv_001');
    await flushPromises();
    expect(listTerminalDeviceHeartbeatRecordsApi).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(10_000);
    await flushPromises();

    expect(listTerminalDeviceHeartbeatRecordsApi).toHaveBeenCalledTimes(2);
    wrapper.unmount();
    vi.useRealTimers();
  });

  it('opens status operation from the row action menu instead of the detail drawer', async () => {
    const view = await import('./index.vue');
    const wrapper = mount(view.default);

    await flushPromises();
    (wrapper.vm as any).handleDeviceRowActionMenu(
      { key: 'status' },
      {
        displayName: 'PDA-Warehouse-01',
        status: 'ACTIVE',
        terminalDeviceId: 'tdv_001',
      },
    );
    await flushPromises();

    expect(getTerminalDeviceApi).not.toHaveBeenCalled();
    expect((wrapper.vm as any).statusForm.targetStatus).toBe('DISABLED');
    expect(wrapper.text()).toContain('状态操作');

    (wrapper.vm as any).statusForm.reason = 'Device retired from Meilong tenant';
    (wrapper.vm as any).statusForm.targetStatus = 'DECOMMISSIONED';
    await (wrapper.vm as any).changeSelectedDeviceStatus();

    expect(changeTerminalDeviceStatusApi).toHaveBeenCalledWith('tdv_001', {
      reason: 'Device retired from Meilong tenant',
      targetStatus: 'DECOMMISSIONED',
    });
  });

  it('excludes the current lifecycle status from status operation targets', async () => {
    const view = await import('./index.vue');
    const wrapper = mount(view.default);

    await flushPromises();
    (wrapper.vm as any).handleDeviceRowActionMenu(
      { key: 'status' },
      {
        displayName: 'PDA-Warehouse-01',
        status: 'ACTIVE',
        terminalDeviceId: 'tdv_001',
      },
    );
    await flushPromises();

    expect((wrapper.vm as any).statusTargetOptions.map((option: any) => option.value)).not.toContain('ACTIVE');
    expect((wrapper.vm as any).statusForm.targetStatus).toBe('DISABLED');

    (wrapper.vm as any).handleDeviceRowActionMenu(
      { key: 'status' },
      {
        displayName: 'PDA-Warehouse-01',
        status: 'DISABLED',
        terminalDeviceId: 'tdv_001',
      },
    );
    await flushPromises();

    expect((wrapper.vm as any).statusTargetOptions.map((option: any) => option.value)).not.toContain('DISABLED');
    expect((wrapper.vm as any).statusForm.targetStatus).toBe('ACTIVE');
  });

  it('does not offer status targets for decommissioned terminal devices', async () => {
    const view = await import('./index.vue');
    const wrapper = mount(view.default);

    await flushPromises();
    (wrapper.vm as any).handleDeviceRowActionMenu(
      { key: 'status' },
      {
        displayName: 'PDA-Warehouse-01',
        status: 'DECOMMISSIONED',
        terminalDeviceId: 'tdv_001',
      },
    );
    await flushPromises();

    expect((wrapper.vm as any).statusTargetOptions).toHaveLength(0);
    expect((wrapper.vm as any).statusForm.targetStatus).toBe('');
    await (wrapper.vm as any).changeSelectedDeviceStatus();
    expect(changeTerminalDeviceStatusApi).not.toHaveBeenCalled();
  });

  it('creates a registration QR code and saves version policy through the device list action menu', async () => {
    const view = await import('./index.vue');
    const wrapper = mount(view.default);

    await flushPromises();
    await (wrapper.vm as any).handleDeviceListActionMenu({ key: 'enrollment' });
    await flushPromises();
    expect(wrapper.findAll('[data-registration-step]')).toHaveLength(1);
    expect(wrapper.find('[data-registration-step]').attributes('data-registration-step')).toBe('device-info');
    (wrapper.vm as any).enrollmentForm.displayName = 'PDA-Warehouse-03';
    listTerminalDeviceEnrollmentsApi.mockResolvedValueOnce({
      items: [
        {
          createdAt: '2026-05-16T10:00:00Z',
          displayName: 'PDA-Warehouse-03',
          enrollmentId: 'enr_003',
          expiresAt: '2026-05-16T11:00:00Z',
          status: 'USED',
          terminalDeviceType: 'PDA',
          usedByTerminalDeviceId: 'tdv_003',
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    await (wrapper.vm as any).createEnrollment();
    await (wrapper.vm as any).handleDeviceListActionMenu({ key: 'version-policy' });
    await flushPromises();
    await (wrapper.vm as any).saveVersionPolicy();

    expect(createTerminalDeviceEnrollmentApi).toHaveBeenCalledWith({
      displayName: 'PDA-Warehouse-03',
      expectedManufacturerSerial: null,
      expiresAt: expect.any(String),
      notes: null,
      terminalDeviceType: 'PDA',
    });
    expect((wrapper.vm as any).issuedEnrollment.enrollmentCode).toBe('ENR-123456');
    expect((wrapper.vm as any).registrationStep).toBe('success');
    expect(wrapper.findAll('[data-registration-step]')).toHaveLength(1);
    expect(wrapper.find('[data-registration-step]').attributes('data-registration-step')).toBe('success');
    expect(wrapper.text()).toContain('PDA-Warehouse-03 已完成注册');
    expect(wrapper.text()).toContain('tdv_003');
    expect(getTerminalDeviceVersionPolicyApi).toHaveBeenCalledWith({
      terminalDeviceType: 'PDA',
    });
    expect(updateTerminalDeviceVersionPolicyApi).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceType: 'PDA',
        upgradeRecommended: true,
        upgradeRequired: false,
      }),
    );
    expect(revokeTerminalDeviceEnrollmentApi).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('revokes an unused registration code when the wizard is cancelled', async () => {
    const view = await import('./index.vue');
    const wrapper = mount(view.default);

    await flushPromises();
    await (wrapper.vm as any).handleDeviceListActionMenu({ key: 'enrollment' });
    (wrapper.vm as any).enrollmentForm.displayName = 'PDA-Warehouse-04';
    await (wrapper.vm as any).createEnrollment();
    await flushPromises();
    expect(wrapper.findAll('[data-registration-step]')).toHaveLength(1);
    expect(wrapper.find('[data-registration-step]').attributes('data-registration-step')).toBe('qr-binding');
    expect(wrapper.text()).toContain('oes-pda-enrollment://ENR-123456');
    await (wrapper.vm as any).closeRegistrationModal();

    expect(revokeTerminalDeviceEnrollmentApi).toHaveBeenCalledWith('enr_003', {
      reason: 'Registration wizard closed before PDA activation',
    });
    expect((wrapper.vm as any).registrationStep).toBe('device-info');
    wrapper.unmount();
  });
});
