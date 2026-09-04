/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
const clearAuthBlockReasonMock = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    clearAuthBlockReason: clearAuthBlockReasonMock,
  }),
}));

vi.mock('ant-design-vue', () => ({
  Button: {
    emits: ['click'],
    template:
      '<button type="button" @click="$emit(\'click\')"><slot /></button>',
  },
}));

describe('MfaFactorUnavailable view', () => {
  beforeEach(() => {
    pushMock.mockReset();
    clearAuthBlockReasonMock.mockReset();
  });

  it('shows the dedicated no-factor copy and returns to login', async () => {
    const view = await import('./mfa-factor-unavailable.vue');
    const wrapper = mount(view.default);

    expect(clearAuthBlockReasonMock).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('当前无法完成登录');
    expect(wrapper.text()).toContain('当前账号没有可用于本次登录验证的 MFA 因子');

    await wrapper.get('button').trigger('click');

    expect(pushMock).toHaveBeenCalledWith('/auth/login');
  });
});
