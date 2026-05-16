import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const request = vi.fn();

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    put,
    request,
  },
}));

// Verifies the tenant-web terminal device API client stays aligned with the Admin Terminal Device BFF contract.
describe('tenant-web terminal device api', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    request.mockReset();
  });

  it('creates, lists, and revokes PDA enrollments', async () => {
    const {
      createTerminalDeviceEnrollmentApi,
      listTerminalDeviceEnrollmentsApi,
      revokeTerminalDeviceEnrollmentApi,
    } = await import('./index');

    await createTerminalDeviceEnrollmentApi({
      displayName: 'PDA-Warehouse-01',
      expectedManufacturerSerial: 'SEUIC-SN-123456',
      expiresAt: '2026-05-17T10:00:00Z',
      notes: 'Issued for warehouse pilot',
      terminalDeviceType: 'PDA',
    });
    await listTerminalDeviceEnrollmentsApi({
      page: 1,
      pageSize: 20,
      status: 'ISSUED',
      terminalDeviceType: 'PDA',
    });
    await revokeTerminalDeviceEnrollmentApi('enr_001', {
      reason: 'Issued by mistake',
    });

    expect(post).toHaveBeenCalledWith('/admin/terminal-devices/enrollments', {
      displayName: 'PDA-Warehouse-01',
      expectedManufacturerSerial: 'SEUIC-SN-123456',
      expiresAt: '2026-05-17T10:00:00Z',
      notes: 'Issued for warehouse pilot',
      terminalDeviceType: 'PDA',
    });
    expect(get).toHaveBeenCalledWith('/admin/terminal-devices/enrollments', {
      params: {
        page: 1,
        pageSize: 20,
        status: 'ISSUED',
        terminalDeviceType: 'PDA',
      },
    });
    expect(post).toHaveBeenCalledWith('/admin/terminal-devices/enrollments/enr_001/revoke', {
      reason: 'Issued by mistake',
    });
  });

  it('lists devices, loads detail, updates metadata, and changes lifecycle status', async () => {
    const {
      changeTerminalDeviceStatusApi,
      getTerminalDeviceApi,
      listTerminalDevicesApi,
      updateTerminalDeviceApi,
    } = await import('./index');

    await listTerminalDevicesApi({
      keyword: 'warehouse',
      page: 2,
      pageSize: 30,
      presenceStatus: 'ONLINE',
      status: 'ACTIVE',
      terminalDeviceType: 'PDA',
    });
    await getTerminalDeviceApi('tdv_001');
    await updateTerminalDeviceApi('tdv_001', {
      displayName: 'PDA-Warehouse-01',
      notes: 'Assigned to warehouse pilot shelf',
    });
    await changeTerminalDeviceStatusApi('tdv_001', {
      reason: 'Device temporarily removed from pilot',
      targetStatus: 'DISABLED',
    });

    expect(get).toHaveBeenCalledWith('/admin/terminal-devices', {
      params: {
        keyword: 'warehouse',
        page: 2,
        pageSize: 30,
        presenceStatus: 'ONLINE',
        status: 'ACTIVE',
        terminalDeviceType: 'PDA',
      },
    });
    expect(get).toHaveBeenCalledWith('/admin/terminal-devices/tdv_001');
    expect(request).toHaveBeenCalledWith('/admin/terminal-devices/tdv_001', {
      data: {
        displayName: 'PDA-Warehouse-01',
        notes: 'Assigned to warehouse pilot shelf',
      },
      method: 'PATCH',
    });
    expect(request).toHaveBeenCalledWith('/admin/terminal-devices/tdv_001/status', {
      data: {
        reason: 'Device temporarily removed from pilot',
        targetStatus: 'DISABLED',
      },
      method: 'PATCH',
    });
  });

  it('reads and updates PDA version policy and lists audit events', async () => {
    const {
      getTerminalDeviceVersionPolicyApi,
      listTerminalDeviceAuditEventsApi,
      updateTerminalDeviceVersionPolicyApi,
    } = await import('./index');

    await getTerminalDeviceVersionPolicyApi({ terminalDeviceType: 'PDA' });
    await updateTerminalDeviceVersionPolicyApi({
      apkDownloadUrl: null,
      latestAppVersion: '2.1.0',
      minSupportedAppVersion: '2.0.0',
      reason: 'Pilot rollout baseline',
      releaseNotesUrl: null,
      terminalDeviceType: 'PDA',
      upgradeRecommended: true,
      upgradeRequired: false,
    });
    await listTerminalDeviceAuditEventsApi('tdv_001', {
      page: 1,
      pageSize: 20,
    });

    expect(get).toHaveBeenCalledWith('/admin/terminal-devices/version-policy', {
      params: { terminalDeviceType: 'PDA' },
    });
    expect(put).toHaveBeenCalledWith('/admin/terminal-devices/version-policy', {
      apkDownloadUrl: null,
      latestAppVersion: '2.1.0',
      minSupportedAppVersion: '2.0.0',
      reason: 'Pilot rollout baseline',
      releaseNotesUrl: null,
      terminalDeviceType: 'PDA',
      upgradeRecommended: true,
      upgradeRequired: false,
    });
    expect(get).toHaveBeenCalledWith('/admin/terminal-devices/tdv_001/audit-events', {
      params: {
        page: 1,
        pageSize: 20,
      },
    });
  });
});
