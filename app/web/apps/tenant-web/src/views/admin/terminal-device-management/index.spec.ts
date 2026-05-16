/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as antd from '../__tests__/ant-design-vue-mock';

const createTerminalDeviceEnrollmentApi = vi.fn();
const getTerminalDeviceApi = vi.fn();
const getTerminalDeviceVersionPolicyApi = vi.fn();
const listTerminalDeviceAuditEventsApi = vi.fn();
const listTerminalDeviceEnrollmentsApi = vi.fn();
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
  createTerminalDeviceEnrollmentApi,
  getTerminalDeviceApi,
  getTerminalDeviceVersionPolicyApi,
  listTerminalDeviceAuditEventsApi,
  listTerminalDeviceEnrollmentsApi,
  listTerminalDevicesApi,
  revokeTerminalDeviceEnrollmentApi,
  updateTerminalDeviceVersionPolicyApi,
}));

// Verifies the managed terminal device admin page keeps management truth separate from runtime diagnostics.
describe('terminal device management page', () => {
  beforeEach(() => {
    createTerminalDeviceEnrollmentApi.mockReset();
    getTerminalDeviceApi.mockReset();
    getTerminalDeviceVersionPolicyApi.mockReset();
    listTerminalDeviceAuditEventsApi.mockReset();
    listTerminalDeviceEnrollmentsApi.mockReset();
    listTerminalDevicesApi.mockReset();
    revokeTerminalDeviceEnrollmentApi.mockReset();
    updateTerminalDeviceVersionPolicyApi.mockReset();

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
    updateTerminalDeviceVersionPolicyApi.mockResolvedValue({
      latestAppVersion: '2.1.0',
      minSupportedAppVersion: '2.0.0',
      tenantId: 'tenant_001',
      terminalDeviceType: 'PDA',
      upgradeRecommended: true,
      upgradeRequired: false,
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
    expect(listTerminalDeviceEnrollmentsApi).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      terminalDeviceType: 'PDA',
    });
    expect(getTerminalDeviceVersionPolicyApi).toHaveBeenCalledWith({
      terminalDeviceType: 'PDA',
    });
    expect(wrapper.text()).toContain('终端设备管理');
    expect(wrapper.text()).toContain('最近上报账号（非当前会话）');
    expect(wrapper.text()).toContain('版本策略');
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
    expect(wrapper.text()).toContain('当前有效会话');
    expect(wrapper.text()).toContain('设备治理审计');
  });

  it('creates enrollment and saves version policy through explicit admin actions', async () => {
    const view = await import('./index.vue');
    const wrapper = mount(view.default);

    await flushPromises();
    (wrapper.vm as any).enrollmentForm.displayName = 'PDA-Warehouse-03';
    (wrapper.vm as any).enrollmentForm.expiresAt = '2026-05-17T10:00:00Z';
    (wrapper.vm as any).revokeEnrollmentReason = 'Issued by mistake';
    await (wrapper.vm as any).createEnrollment();
    await (wrapper.vm as any).revokeEnrollment({ enrollmentId: 'enr_001', status: 'ISSUED' });
    await (wrapper.vm as any).saveVersionPolicy();

    expect(createTerminalDeviceEnrollmentApi).toHaveBeenCalledWith({
      displayName: 'PDA-Warehouse-03',
      expectedManufacturerSerial: '',
      expiresAt: '2026-05-17T10:00:00Z',
      notes: '',
      terminalDeviceType: 'PDA',
    });
    expect(updateTerminalDeviceVersionPolicyApi).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalDeviceType: 'PDA',
        upgradeRecommended: true,
        upgradeRequired: false,
      }),
    );
    expect(revokeTerminalDeviceEnrollmentApi).toHaveBeenCalledWith('enr_001', {
      reason: 'Issued by mistake',
    });
  });
});
