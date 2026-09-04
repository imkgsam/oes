/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../ui', () => ({
  PinInput: {
    template: '<div><slot /></div>',
  },
  PinInputGroup: {
    template: '<div><slot /></div>',
  },
  PinInputInput: {
    props: ['index'],
    template: '<input :data-index="index" />',
  },
}));

vi.mock('../button', () => ({
  VbenButton: {
    emits: ['click'],
    props: ['disabled', 'loading', 'size', 'variant'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
  },
}));

describe('PinInput send-code countdown', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('does not start the resend countdown when send-code is blocked', async () => {
    const handleSendCode = vi.fn().mockResolvedValue(false);
    const view = await import('./input.vue');
    const wrapper = mount(view.default, {
      props: {
        createText: (countdown: number) =>
          countdown > 0 ? `${countdown}s` : '发送验证码',
        handleSendCode,
      },
    });

    await wrapper.get('button').trigger('click');

    expect(handleSendCode).toHaveBeenCalledTimes(1);
    expect(wrapper.get('button').text()).toBe('发送验证码');
  });
});
