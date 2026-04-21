/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requestEmailBindingChallengeApi = vi.fn();
const requestPhoneBindingChallengeApi = vi.fn();
const verifyEmailBindingApi = vi.fn();
const verifyPhoneBindingApi = vi.fn();
const messageSuccess = vi.fn();
const messageWarning = vi.fn();

const FormItemStub = defineComponent({
  name: 'FormItem',
  template: '<label><slot name="label" /><slot /></label>',
});

const FormStub = Object.assign(
  defineComponent({
    name: 'Form',
    template: '<form><slot /></form>',
  }),
  {
    Item: FormItemStub,
  },
);

vi.mock('#/api', () => ({
  requestEmailBindingChallengeApi,
  requestPhoneBindingChallengeApi,
  verifyEmailBindingApi,
  verifyPhoneBindingApi,
}));

vi.mock('@vben/common-ui', () => ({
  SliderCaptcha: defineComponent({
    name: 'SliderCaptcha',
    emits: ['success', 'update:modelValue'],
    template: `
      <button
        class="slider-pass"
        type="button"
        @click="
          $emit('update:modelValue', true);
          $emit('success', { isPassing: true, time: '0.1' });
        "
      >
        pass
      </button>
    `,
  }),
}));

vi.mock('../../authentication/phone-number-input.vue', () => ({
  default: defineComponent({
    name: 'PhoneNumberInput',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: `
      <div class="phone-number-input-stub">
        <select class="phone-country-select">
          <option value="CN:+86">+86</option>
        </select>
        <input
          class="phone-number-input"
          :placeholder="placeholder"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      </div>
    `,
  }),
}));

vi.mock('ant-design-vue', () => ({
  Button: defineComponent({
    name: 'Button',
    props: ['disabled', 'loading', 'type', 'ghost'],
    emits: ['click'],
    template:
      '<button :disabled="disabled" type="button" @click="$emit(\'click\', $event)"><slot /></button>',
  }),
  Card: defineComponent({
    name: 'Card',
    template: '<section><slot /></section>',
  }),
  Form: FormStub,
  Input: defineComponent({
    name: 'Input',
    props: ['value', 'maxlength', 'placeholder'],
    emits: ['update:value'],
    template:
      '<input :maxlength="maxlength" :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />',
  }),
  Modal: defineComponent({
    name: 'Modal',
    props: ['open', 'title'],
    emits: ['cancel', 'update:open'],
    template: `
      <div v-if="open" class="modal-root">
        <div class="modal-title">
          <slot name="title">{{ title }}</slot>
        </div>
        <slot />
      </div>
    `,
  }),
  Tooltip: defineComponent({
    name: 'Tooltip',
    template: '<span><slot /></span>',
  }),
  message: {
    success: messageSuccess,
    warning: messageWarning,
  },
}));

describe('security contact binding card', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    requestEmailBindingChallengeApi.mockReset();
    requestPhoneBindingChallengeApi.mockReset();
    verifyEmailBindingApi.mockReset();
    verifyPhoneBindingApi.mockReset();
    messageSuccess.mockReset();
    messageWarning.mockReset();

    requestEmailBindingChallengeApi.mockResolvedValue({
      challengeId: 'challenge-1',
      destination: 'new@example.com',
      expiresAt: '2026-04-20T18:30:00.000Z',
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('does not render the captcha step until the user requests an otp', async () => {
    const view = await import('./security-contact-binding-card.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        kind: 'email',
        loginMethods: [
          {
            enabled: true,
            hasPassword: true,
            identifier: 'current@example.com',
            maskedIdentifier: 'c***@example.com',
            methodId: 'email-method:PASSWORD',
            type: 'EMAIL_PASSWORD',
            userId: 'user-1',
            verified: true,
          },
        ],
      },
    });

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(document.body.textContent).not.toContain('发送前验证');
    expect(document.body.textContent).not.toContain('滑动验证');

    await wrapper.find('input[placeholder="请输入要绑定的新邮箱"]').setValue('new@example.com');
    await wrapper.find('.otp-row__button').trigger('click');
    await flushPromises();

    expect(requestEmailBindingChallengeApi).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('发送前验证');
  });

  it('requests the otp challenge only after the popup captcha succeeds', async () => {
    const view = await import('./security-contact-binding-card.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        kind: 'email',
        loginMethods: [],
      },
    });

    await wrapper.find('button').trigger('click');
    await flushPromises();
    await wrapper.find('input[placeholder="请输入要绑定的新邮箱"]').setValue('new@example.com');
    await wrapper.find('.otp-row__button').trigger('click');
    await flushPromises();

    expect(requestEmailBindingChallengeApi).not.toHaveBeenCalled();

    const captchaPassButton = document.body.querySelector('.slider-pass') as HTMLButtonElement | null;
    captchaPassButton?.click();
    await flushPromises();

    expect(requestEmailBindingChallengeApi).toHaveBeenCalledWith({
      email: 'new@example.com',
    });
    expect(document.body.textContent).not.toContain('发送前验证');
  });

  it('shows resend countdown state after the otp challenge is sent', async () => {
    const view = await import('./security-contact-binding-card.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        kind: 'email',
        loginMethods: [],
      },
    });

    await wrapper.find('button').trigger('click');
    await flushPromises();
    await wrapper.find('input[placeholder="请输入要绑定的新邮箱"]').setValue('new@example.com');
    await wrapper.find('.otp-row__button').trigger('click');
    await flushPromises();

    const captchaPassButton = document.body.querySelector('.slider-pass') as HTMLButtonElement | null;
    captchaPassButton?.click();
    await flushPromises();

    const sendButton = wrapper.find('.otp-row__button');
    expect(sendButton.text()).toContain('60');
    expect(sendButton.attributes('disabled')).toBeDefined();

    await vi.advanceTimersByTimeAsync(1000);
    await flushPromises();
    expect(sendButton.text()).toContain('59');

    await vi.advanceTimersByTimeAsync(59_000);
    await flushPromises();
    expect(sendButton.text()).toContain('重新发送');
    expect(sendButton.attributes('disabled')).toBeUndefined();
  });

  it('keeps the email send button disabled until the destination format is valid', async () => {
    const view = await import('./security-contact-binding-card.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        kind: 'email',
        loginMethods: [],
      },
    });

    await wrapper.find('button').trigger('click');
    await flushPromises();

    const emailInput = wrapper.find('input[placeholder="请输入要绑定的新邮箱"]');
    const sendButton = wrapper.find('.otp-row__button');

    await emailInput.setValue('invalid-email');
    await flushPromises();
    expect(sendButton.attributes('disabled')).toBeDefined();

    await emailInput.setValue('valid@example.com');
    await flushPromises();
    expect(sendButton.attributes('disabled')).toBeUndefined();
  });

  it('uses the shared phone input with country code and keeps the send button disabled for invalid phones', async () => {
    const view = await import('./security-contact-binding-card.vue');
    const wrapper = mount(view.default, {
      attachTo: document.body,
      props: {
        kind: 'phone',
        loginMethods: [],
      },
    });

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(wrapper.find('.phone-number-input-stub').exists()).toBe(true);

    const phoneInput = wrapper.find('.phone-number-input');
    const sendButton = wrapper.find('.otp-row__button');

    await phoneInput.setValue('1234');
    await flushPromises();
    expect(sendButton.attributes('disabled')).toBeDefined();

    await phoneInput.setValue('+8613811112222');
    await flushPromises();
    expect(sendButton.attributes('disabled')).toBeUndefined();
  });
});
