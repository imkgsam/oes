/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listAdminAuditEventsApi = vi.fn();
const listAdminOnlineUsersApi = vi.fn();
const listAdminUserSessionsApi = vi.fn();
const revokeAdminSessionApi = vi.fn();

const authContextState = {
  actionCodes: ['auth.session.admin.view', 'auth.session.admin.revoke'],
  isPlatformScope: false,
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      tenantName: 'Tenant One',
    },
  },
  tenantName: 'Tenant One',
};

vi.mock('#/api', () => ({
  listAdminAuditEventsApi,
  listAdminOnlineUsersApi,
  listAdminUserSessionsApi,
  revokeAdminSessionApi,
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState,
}));

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><h1>{{ title }}</h1><slot /></div>',
  },
}));

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />',
  },
}));

function makeSession(overrides: Record<string, unknown>) {
  return {
    accessRemainingSeconds: 1800,
    accountId: 'account-1',
    accountName: '运营账号',
    browser: 'Firefox',
    createdAt: '2026-05-18T01:00:00.000Z',
    deviceName: 'MacBook',
    expiresAt: '2026-05-18T02:00:00.000Z',
    idleSeconds: 60,
    ipAddress: '127.0.0.1',
    isAccessExpired: false,
    isAdminControlled: false,
    isRefreshExpired: false,
    isRevoked: false,
    lastActiveAt: '2026-05-18T01:10:00.000Z',
    loginMethod: 'EMAIL_PASSWORD',
    platform: 'macOS',
    refreshExpiresAt: '2026-05-19T01:00:00.000Z',
    refreshRemainingSeconds: 86_400,
    sessionAgeSeconds: 600,
    sessionId: 'session-web',
    status: 'ACTIVE',
    tenantId: 'tenant-1',
    terminal: 'WEB',
    userAgent: 'Firefox',
    userId: 'user-1',
    ...overrides,
  };
}

describe('auth session management page', () => {
  beforeEach(() => {
    listAdminAuditEventsApi.mockReset();
    listAdminOnlineUsersApi.mockReset();
    listAdminUserSessionsApi.mockReset();
    revokeAdminSessionApi.mockReset();

    listAdminOnlineUsersApi.mockResolvedValue({
      items: [
        {
          activeAccountCount: 1,
          activeSessionCount: 2,
          displayName: '张三',
          lastActiveAt: '2026-05-18T01:10:00.000Z',
          tenantId: 'tenant-1',
          tenantName: 'Tenant One',
          userId: 'user-1',
        },
      ],
    });
    listAdminAuditEventsApi.mockResolvedValue({ items: [], nextCursor: null });
    listAdminUserSessionsApi.mockResolvedValue({
      sessions: [
        makeSession({ sessionId: 'session-web', terminal: 'WEB' }),
        makeSession({
          browser: undefined,
          deviceName: 'PDA-01',
          platform: 'Android',
          sessionId: 'session-pda',
          terminal: 'PDA',
          terminalDeviceId: 'terminal-device-1',
        }),
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('shows terminal tags and filters inspected sessions by terminal', async () => {
    const view = await import('./auth-session-management.vue');

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          access: {},
          loading: {},
        },
      },
    });

    await flushPromises();

    await (wrapper.vm as any).inspectUserSessions({
      displayName: '张三',
      tenantId: 'tenant-1',
      tenantName: 'Tenant One',
      userId: 'user-1',
    });
    await flushPromises();

    expect(document.body.textContent).toContain('终端');
    expect(document.body.textContent).toContain('Web');
    expect(document.body.textContent).toContain('PDA');

    (wrapper.vm as any).sessionFilters.terminal = 'PDA';
    await flushPromises();

    const filteredSessions = (wrapper.vm as any).filteredSessionItems;
    expect(filteredSessions).toHaveLength(1);
    expect(filteredSessions[0].sessionId).toBe('session-pda');
  });
});
