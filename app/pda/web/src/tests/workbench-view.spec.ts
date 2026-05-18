import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkbenchView from '@/views/workbench-view.vue';
import { useSessionStore } from '@/stores/session.store';
import { setBridgeClient } from '@/bridge/bridge-client';

const mockApi = vi.hoisted(() => {
  class MockPdaBffError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
      this.name = 'PdaBffError';
    }
  }

  return {
    fetchPdaBootstrap: vi.fn(),
    MockPdaBffError,
    routerPush: vi.fn(),
  };
});

vi.mock('@/api/pda-bff.client', () => ({
  PdaBffError: mockApi.MockPdaBffError,
  fetchPdaBootstrap: mockApi.fetchPdaBootstrap,
  logoutPda: vi.fn().mockResolvedValue({ success: true }),
  postPdaDiagnosticLogs: vi.fn().mockResolvedValue({ accepted: true, serverTime: '2026-05-18T10:00:00.000Z' }),
  refreshPdaSession: vi.fn(),
  toManagedPdaDeviceDescriptor: vi.fn((deviceInfo, terminalDeviceId) => ({
    ...deviceInfo,
    terminalDeviceId,
  })),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockApi.routerPush,
  }),
}));

vi.mock('@/services/pda-heartbeat', () => ({
  sendPdaHeartbeat: vi.fn().mockResolvedValue(undefined),
  startPdaHeartbeat: vi.fn(),
  stopPdaHeartbeat: vi.fn(),
}));

vi.mock('@/services/pda-session-lifecycle', () => ({
  startPdaSessionLifecycle: vi.fn(),
  stopPdaSessionLifecycle: vi.fn(),
}));

describe('workbench view session refresh', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    setBridgeClient(undefined);
    installMemoryStorage();
    mockApi.fetchPdaBootstrap.mockReset();
    mockApi.routerPush.mockReset();

    const sessionStore = useSessionStore();
    await sessionStore.signIn(
      {
        accessToken: 'access-token-1',
        refreshToken: 'refresh-token-1',
        expiresIn: 900,
        terminal: 'PDA',
      },
      'operator-a',
    );
    await sessionStore.setTerminalDeviceBinding({ terminalDeviceId: 'terminal-device-1' });
  });

  it('refreshes the protected PDA bootstrap from the workbench', async () => {
    mockApi.fetchPdaBootstrap.mockResolvedValue({
      account: {
        accountId: 'account-1',
        displayName: 'operator-refreshed',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
      },
      access: {
        actionCodes: ['pda.home'],
        roles: ['role-1'],
      },
      device: {
        deviceStatus: 'ACTIVE',
        displayName: 'PDA-01',
        terminalDeviceId: 'terminal-device-1',
        terminalDeviceType: 'PDA',
        tenantId: 'tenant-1',
      },
      decision: {
        allowed: true,
        decisionCode: 'ALLOWED',
        shouldClearLocalSession: false,
        shouldClearLocalTerminalDeviceId: false,
      },
      serverTime: '2026-05-18T10:00:00.000Z',
      session: {
        idleTimeoutSeconds: 900,
        sessionId: 'session-1',
        terminal: 'PDA',
        terminalDeviceId: 'terminal-device-1',
      },
      workbench: {
        enabledCards: ['SESSION'],
        mode: 'PDA_MANAGED_DEVICE',
      },
    });

    const wrapper = mountWorkbench();
    await wrapper.get('[data-test-id="pda-workbench-refresh"]').trigger('click');
    await flushPromises();

    expect(mockApi.fetchPdaBootstrap).toHaveBeenCalledWith('access-token-1', 'terminal-device-1');
    expect(useSessionStore().operatorName).toBe('operator-refreshed');
    expect(useSessionStore().terminalDeviceDisplayName).toBe('PDA-01');
  });

  it('clears the local PDA session when protected bootstrap rejects the revoked session', async () => {
    mockApi.fetchPdaBootstrap.mockRejectedValue(new mockApi.MockPdaBffError('Unauthorized', 401));

    const wrapper = mountWorkbench();
    await wrapper.get('[data-test-id="pda-workbench-refresh"]').trigger('click');
    await flushPromises();

    expect(useSessionStore().isAuthenticated).toBe(false);
    expect(localStorage.getItem('oes:pda:session-tokens')).toBe(null);
    expect(mockApi.routerPush).toHaveBeenCalledWith('/login');
  });
});

function mountWorkbench() {
  return mount(WorkbenchView, {
    global: {
      stubs: {
        CameraDiagnosticCard: true,
        DeviceStatusCard: true,
        LogDiagnosticCard: true,
        NetworkStatusStrip: true,
        ScanDiagnosticCard: true,
        SessionStatusCard: true,
        VanButton: {
          props: ['loading'],
          template: '<button :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });
}

function installMemoryStorage(): void {
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
}
