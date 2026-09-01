/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { reactive } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();

const authStoreMock = reactive({
  accountSelectionOptions: [] as Array<{
    accountId: string;
    displayName?: string;
    scopeLevel?: 'SYSTEM' | 'TENANT';
    tenantId?: null | string;
    tenantName?: null | string;
  }>,
  authBlockReason: null as 'MFA_FACTOR_UNAVAILABLE' | null,
  hasPendingAccountSelection: false,
  loginLoading: false,
  submitAccountSelection: vi.fn(),
});

vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('#/store', () => ({
  useAuthStore: () => authStoreMock,
}));

vi.mock('ant-design-vue', () => ({
  Empty: {
    props: ['description'],
    template: '<div class="empty">{{ description }}</div>',
  },
  Tag: {
    template: '<span><slot /></span>',
  },
}));

describe('AccountSelection view', () => {
  let wrapper: null | ReturnType<typeof mount> = null;

  beforeEach(() => {
    replaceMock.mockReset();
    authStoreMock.accountSelectionOptions = [];
    authStoreMock.authBlockReason = null;
    authStoreMock.hasPendingAccountSelection = false;
    authStoreMock.loginLoading = false;
    authStoreMock.submitAccountSelection.mockReset();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('returns to login when no account options remain and no auth block page is taking over', async () => {
    const view = await import('./account-selection.vue');
    wrapper = mount(view.default);
    await flushPromises();

    expect(replaceMock).toHaveBeenCalledWith({ name: 'Login' });
    expect(wrapper.find('.space-y-5').exists()).toBe(false);
  });

  it('renders and submits a valid pending tenant option without redirecting', async () => {
    authStoreMock.accountSelectionOptions = [
      {
        accountId: 'account-1',
        displayName: 'Tenant Admin',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: 'Tenant 1',
      },
      {
        accountId: 'account-2',
        displayName: 'System Admin',
        scopeLevel: 'SYSTEM',
      },
    ];
    authStoreMock.hasPendingAccountSelection = true;
    const view = await import('./account-selection.vue');
    wrapper = mount(view.default);

    expect(wrapper.text()).toContain('Tenant 1');
    expect(wrapper.text()).toContain('租户账号');
    expect(wrapper.text()).toContain('System Admin');
    expect(wrapper.text()).toContain('平台账号');
    await wrapper.get('button').trigger('click');

    expect(authStoreMock.submitAccountSelection).toHaveBeenCalledWith(
      'account-1',
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('does not override the dedicated unavailable-mfa redirect while auth blocking is in progress', async () => {
    authStoreMock.accountSelectionOptions = [
      {
        accountId: 'account-1',
        displayName: 'Tenant Admin',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        tenantName: 'Tenant 1',
      },
    ];
    authStoreMock.hasPendingAccountSelection = true;
    const view = await import('./account-selection.vue');
    wrapper = mount(view.default);
    authStoreMock.authBlockReason = 'MFA_FACTOR_UNAVAILABLE';
    authStoreMock.accountSelectionOptions = [];
    authStoreMock.hasPendingAccountSelection = false;
    await flushPromises();

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
