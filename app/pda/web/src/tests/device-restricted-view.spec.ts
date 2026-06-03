import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DeviceRestrictedView from '@/views/device-restricted-view.vue';
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

vi.mock('@/services/pda-heartbeat', () => ({
  sendPdaHeartbeat: mockRuntime.sendPdaHeartbeat,
}));

describe('device restricted view', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    installMemoryStorage();
    mockRuntime.routerPush.mockReset();
    mockRuntime.sendPdaHeartbeat.mockReset();

    const sessionStore = useSessionStore();
    await sessionStore.setTerminalDeviceBinding({
      terminalDeviceId: 'terminal-device-1',
      deviceStatus: 'DISABLED',
    });
    await sessionStore.applyDeviceDecision({
      allowed: false,
      decisionCode: 'DEVICE_DISABLED',
      deviceStatus: 'DISABLED',
      requiredAction: 'CLEAR_LOCAL_SESSION',
      shouldClearLocalSession: true,
      shouldClearLocalTerminalDeviceId: false,
    });
  });

  it('revalidates the managed device before leaving restricted after an administrator enables it', async () => {
    const sessionStore = useSessionStore();
    mockRuntime.sendPdaHeartbeat.mockImplementation(async () => {
      await sessionStore.applyDeviceDecision({
        allowed: true,
        decisionCode: 'ALLOW',
        deviceStatus: 'ACTIVE',
        requiredAction: 'NONE',
        shouldClearLocalSession: false,
        shouldClearLocalTerminalDeviceId: false,
      });
      return true;
    });

    const wrapper = mountRestrictedView();
    await wrapper.get('[data-test-id="pda-restricted-retry"]').trigger('click');
    await flushPromises();

    expect(mockRuntime.sendPdaHeartbeat).toHaveBeenCalledWith('FOREGROUND');
    expect(sessionStore.decisionCode).toBe('ALLOW');
    expect(mockRuntime.routerPush).toHaveBeenCalledWith('/login');
  });
});

function mountRestrictedView() {
  return mount(DeviceRestrictedView, {
    global: {
      stubs: {
        VanButton: {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
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
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(`session:${key}`) ?? null,
      setItem: (key: string, value: string) => values.set(`session:${key}`, value),
      removeItem: (key: string) => values.delete(`session:${key}`),
    },
  });
}
