/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requestEmailBindingChallengeApi = vi.fn();
const requestPhoneBindingChallengeApi = vi.fn();
const verifyEmailBindingApi = vi.fn();
const verifyPhoneBindingApi = vi.fn();
const messageError = vi.fn();
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
  Alert: defineComponent({
    name: 'BindingAlert',
    props: ['message'],
    template: '<div class="binding-alert">{{ message }}</div>',
  }),
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
  Steps: defineComponent({
    name: 'BindingSteps',
    props: ['current', 'items'],
    template: `
      <div class="binding-steps">
        <div
          v-for="(item, index) in items"
          :key="item.title || index"
          :data-active="current === index"
        >
          {{ item.title }}
        </div>
      </div>
    `,
  }),
  Tooltip: defineComponent({
    name: 'Tooltip',
    template: '<span><slot /></span>',
  }),
  message: {
    error: messageError,
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
    messageError.mockReset();
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

  it('enters the verification step only after the user completes the destination step', async () => {
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

    expect(document.body.textContent).not.toContain('完成安全验证后发送验证码');

    await wrapper.find('input[placeholder="请输入要绑定的新邮箱"]').setValue('new@example.com');
    const nextButton = wrapper.findAll('button').find((item) => item.text() === '下一步');
    await nextButton?.trigger('click');
    await flushPromises();

    expect(document.body.textContent).toContain('完成安全验证后发送验证码');
    expect(document.body.textContent).toContain('验证码将发送至 new@example.com');
  });

  it('requests the otp challenge only after the inline captcha succeeds', async () => {
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
    const nextButton = wrapper.findAll('button').find((item) => item.text() === '下一步');
    await nextButton?.trigger('click');
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

  it('uses a neutral confirm action label in the verification step', async () => {
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
    await wrapper.find('input[placeholder="请输入要绑定的新邮箱"]').setValue('new@example.com');
    const nextButton = wrapper.findAll('button').find((item) => item.text() === '下一步');
    await nextButton?.trigger('click');
    await flushPromises();

    expect(document.body.textContent).toContain('确认');
    expect(document.body.textContent).not.toContain('确认更换');
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
    const nextButton = wrapper.findAll('button').find((item) => item.text() === '下一步');
    await nextButton?.trigger('click');
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

    await vi.advanceTimersByTimeAsync(60_000);
    await flushPromises();
    expect(document.body.textContent).toContain('可重新验证后发送');
    expect(document.body.textContent).toContain('重新验证后发送验证码');
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
    const nextButton = wrapper.findAll('button').find((item) => item.text() === '下一步');

    await emailInput.setValue('invalid-email');
    await flushPromises();
    expect(nextButton?.attributes('disabled')).toBeDefined();

    await emailInput.setValue('valid@example.com');
    await flushPromises();
    expect(nextButton?.attributes('disabled')).toBeUndefined();
  });

  it('keeps the next button disabled when the new email matches the current binding', async () => {
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

    const emailInput = wrapper.find('input[placeholder="请输入要绑定的新邮箱"]');
    const nextButton = wrapper.findAll('button').find((item) => item.text() === '下一步');

    await emailInput.setValue('current@example.com');
    await flushPromises();

    expect(nextButton?.attributes('disabled')).toBeDefined();
  });

  it('uses the shared phone input with country code and keeps the next button disabled for invalid phones', async () => {
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
    const nextButton = wrapper.findAll('button').find((item) => item.text() === '下一步');

    await phoneInput.setValue('1234');
    await flushPromises();
    expect(nextButton?.attributes('disabled')).toBeDefined();

    await phoneInput.setValue('+8613811112222');
    await flushPromises();
    expect(nextButton?.attributes('disabled')).toBeUndefined();
  });
});
