/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    userInfo: {
      homePath: '/workbench/home',
      realName: '陈双鹏',
      username: 'chen-shuangpeng',
    },
  }),
}));

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => ({
    accountName: '陈双鹏',
    homePath: '/workbench/home',
    isPlatformScope: false,
    operatorName: '陈双鹏',
    tenantName: '广东美隆陶瓷有限公司',
  }),
}));

vi.mock('ant-design-vue', () => ({
  Card: {
    name: 'Card',
    template: '<section class="ant-card"><slot name="title" /><slot /></section>',
  },
  Tag: {
    name: 'Tag',
    template: '<span class="ant-tag"><slot /></span>',
  },
}));

// Verifies the workbench keeps top-level sections separated with a real layout gap.
describe('tenant workbench home layout', () => {
  it('uses an explicit column gap between top-level blocks', async () => {
    const view = await import('./index.vue');

    const wrapper = mount(view.default);

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['flex', 'flex-col', 'gap-5', 'p-5']),
    );
    expect(wrapper.classes()).not.toContain('space-y-5');
  });
});
