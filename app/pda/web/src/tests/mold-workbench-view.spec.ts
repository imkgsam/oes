import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MoldWorkbenchView from '@/views/mold-workbench-view.vue';
import { useSessionStore } from '@/stores/session.store';

const mockApi = vi.hoisted(() => ({
  confirmPdaInstalledMoldReady: vi.fn(),
  confirmPdaProductionMoldArrival: vi.fn(),
  installPdaProductionMold: vi.fn(),
  markPdaProductionMoldForScrap: vi.fn(),
  movePdaProductionMold: vi.fn(),
  recordPdaMoldUsageBatch: vi.fn(),
  routerPush: vi.fn(),
  unmountPdaProductionMold: vi.fn(),
}));

vi.mock('@/api/pda-bff.client', () => mockApi);
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockApi.routerPush,
  }),
}));

describe('PDA mold workbench view', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    Object.values(mockApi).forEach((item) => {
      if (typeof item === 'function') {
        item.mockReset?.();
        item.mockResolvedValue?.({});
      }
    });
    installMemoryStorage();

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
    await sessionStore.applyBootstrap({
      account: {
        accountId: 'account-1',
        tenantId: 'tenant-1',
      },
      session: {
        idleTimeoutSeconds: 900,
        terminal: 'PDA',
      },
    });
  });

  it('runs the first-stage mold execution flow with numeric line position and ready-gated usage', async () => {
    const wrapper = mountMoldWorkbench();

    await wrapper.get('[data-test-id="pda-mold-id"]').setValue('mold-1');
    await wrapper.get('[data-test-id="pda-tooling-installation-id"]').setValue('install-1');
    await wrapper.get('[data-test-id="pda-storage-resource-id"]').setValue('storage-1');
    await wrapper.get('[data-test-id="pda-work-center-id"]').setValue('wc-1');
    await wrapper.get('[data-test-id="pda-mold-position-index"]').setValue('2');
    await wrapper.get('[data-test-id="pda-usage-quantity"]').setValue('12');

    expect(wrapper.get('[data-test-id="pda-record-usage"]').attributes('disabled')).toBeDefined();

    await wrapper.get('[data-test-id="pda-confirm-arrival"]').trigger('click');
    await wrapper.get('[data-test-id="pda-move-mold"]').trigger('click');
    await wrapper.get('[data-test-id="pda-install-mold"]').trigger('click');
    await wrapper.get('[data-test-id="pda-confirm-ready"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-test-id="pda-record-usage"]').attributes('disabled')).toBeUndefined();
    await wrapper.get('[data-test-id="pda-record-usage"]').trigger('click');
    await wrapper.get('[data-test-id="pda-mark-scrap"]').trigger('click');
    await wrapper.get('[data-test-id="pda-unmount-mold"]').trigger('click');
    await flushPromises();

    expect(mockApi.confirmPdaProductionMoldArrival).toHaveBeenCalledWith('access-token-1', 'tenant-1', 'mold-1');
    expect(mockApi.movePdaProductionMold).toHaveBeenCalledWith('access-token-1', 'tenant-1', 'mold-1', {
      storageResourceId: 'storage-1',
    });
    expect(mockApi.installPdaProductionMold).toHaveBeenCalledWith('access-token-1', 'tenant-1', 'mold-1', {
      workCenterRef: { workCenterId: 'wc-1' },
      moldPositionIndex: 2,
    });
    expect(mockApi.confirmPdaInstalledMoldReady).toHaveBeenCalledWith('access-token-1', 'tenant-1', 'mold-1', 'install-1');
    expect(mockApi.recordPdaMoldUsageBatch).toHaveBeenCalledWith(
      'access-token-1',
      'tenant-1',
      { workCenterId: 'wc-1' },
      [{ checked: true, productionMoldId: 'mold-1', toolingInstallationId: 'install-1', usageQuantity: '12' }],
    );
    expect(mockApi.markPdaProductionMoldForScrap).toHaveBeenCalledWith('access-token-1', 'tenant-1', 'mold-1');
    expect(mockApi.unmountPdaProductionMold).toHaveBeenCalledWith('access-token-1', 'tenant-1', 'install-1');
  });
});

function mountMoldWorkbench() {
  return mount(MoldWorkbenchView, {
    global: {
      stubs: {
        VanButton: {
          props: ['disabled', 'loading'],
          template: '<button :disabled="disabled || loading" @click="$emit(\'click\')"><slot /></button>',
        },
        VanCellGroup: {
          template: '<section><slot /></section>',
        },
        VanField: {
          inheritAttrs: false,
          props: ['modelValue', 'label'],
          emits: ['update:modelValue'],
          template:
            '<label><span>{{ label }}</span><input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></label>',
        },
        VanNoticeBar: {
          props: ['text'],
          template: '<p>{{ text }}</p>',
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
