import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginView from '@/views/login-view.vue';
import { useSessionStore } from '@/stores/session.store';

const mockRuntime = vi.hoisted(() => ({
  routerPush: vi.fn(),
  sendPdaHeartbeat: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRuntime.routerPush,
  }),
}));

vi.mock('@/bridge/bridge-client', () => ({
  getBridgeClient: () => ({
    getDeviceInfo: vi.fn(),
  }),
  onScanResult: vi.fn(() => vi.fn()),
}));

vi.mock('@/services/pda-heartbeat', () => ({
  sendPdaHeartbeat: mockRuntime.sendPdaHeartbeat,
}));

vi.mock('@/services/camera-scanner', () => ({
  openCameraScanner: vi.fn(),
}));

vi.mock('@/services/pda-diagnostic-log-buffer', () => ({
  recordPdaDiagnosticLog: vi.fn(),
}));

vi.mock('@/api/pda-bff.client', () => ({
  fetchPdaBootstrap: vi.fn(),
  loginPda: vi.fn(),
  loginPdaWithEmployeeCodePin: vi.fn(),
  preflightPdaEmployeeCodePin: vi.fn(),
  toManagedPdaDeviceDescriptor: vi.fn(),
}));

describe('login view managed device restriction', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    installMemoryStorage();
    mockRuntime.routerPush.mockReset();
    mockRuntime.sendPdaHeartbeat.mockReset();
  });

  it('routes a logged-out bound PDA to restricted when login-page heartbeat reports disabled', async () => {
    const sessionStore = useSessionStore();
    await sessionStore.setTerminalDeviceBinding({
      terminalDeviceId: 'terminal-device-1',
      deviceStatus: 'ACTIVE',
    });
    mockRuntime.sendPdaHeartbeat.mockImplementation(async () => {
      await sessionStore.applyDeviceDecision({
        allowed: false,
        decisionCode: 'DEVICE_DISABLED',
        deviceStatus: 'DISABLED',
        requiredAction: 'CLEAR_LOCAL_SESSION',
        shouldClearLocalSession: true,
        shouldClearLocalTerminalDeviceId: false,
      });
      return true;
    });

    mountLoginView();
    await flushPromises();

    expect(mockRuntime.sendPdaHeartbeat).toHaveBeenCalledWith('FOREGROUND');
    expect(mockRuntime.routerPush).toHaveBeenCalledWith('/device-restricted');
  });
});

function mountLoginView() {
  return mount(LoginView, {
    global: {
      stubs: {
        VanButton: {
          props: ['loading'],
          template: '<button :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
        },
        VanField: {
          template: '<label><slot name="right-icon" /><input /></label>',
        },
        VanForm: {
          template: '<form><slot /></form>',
        },
        VanIcon: true,
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
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(`session:${key}`) ?? null,
      setItem: (key: string, value: string) => values.set(`session:${key}`, value),
      removeItem: (key: string) => values.delete(`session:${key}`),
    },
  });
}
