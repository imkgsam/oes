/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const completePasswordRecoveryApi = vi.fn()
const inspectPasswordRecoveryChannelsApi = vi.fn()
const requestPasswordRecoveryChallengeApi = vi.fn()
const verifyPasswordRecoveryChallengeApi = vi.fn()
const messageError = vi.fn()
const messageSuccess = vi.fn()
const routeState = vi.hoisted(() => ({
  query: {} as Record<string, string | undefined>
}))

vi.mock('#/api', () => ({
  completePasswordRecoveryApi,
  inspectPasswordRecoveryChannelsApi,
  requestPasswordRecoveryChallengeApi,
  verifyPasswordRecoveryChallengeApi
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('@vben/common-ui', () => ({
  SliderCaptcha: defineComponent({
    name: 'SliderCaptcha',
    props: ['disabled'],
    emits: ['success', 'update:modelValue'],
    template: `
      <button
        class="slider-pass"
        :disabled="disabled"
        type="button"
        @click="!disabled && ($emit('update:modelValue', true), $emit('success', { isPassing: true }))"
      >
        pass
      </button>
    `
  })
}))

vi.mock('ant-design-vue', () => ({
  Button: defineComponent({
    name: 'Button',
    props: ['disabled', 'loading', 'type'],
    emits: ['click'],
    template:
      '<button :disabled="disabled" type="button" @click="$emit(\'click\', $event)"><slot /></button>'
  }),
  Card: defineComponent({
    name: 'Card',
    template: '<section><slot /></section>'
  }),
  Step: defineComponent({
    name: 'Step',
    props: ['title'],
    template: '<div><slot />{{ title }}</div>'
  }),
  Steps: defineComponent({
    name: 'Steps',
    props: ['current', 'direction', 'size'],
    template: '<div><slot /></div>'
  }),
  Form: defineComponent({
    name: 'Form',
    template: '<form><slot /></form>'
  }),
  FormItem: defineComponent({
    name: 'FormItem',
    template: '<label><slot name="label" /><slot /></label>'
  }),
  Input: defineComponent({
    name: 'Input',
    props: ['value', 'placeholder'],
    emits: ['update:value'],
    template:
      '<input :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  }),
  InputPassword: defineComponent({
    name: 'InputPassword',
    props: ['value', 'placeholder'],
    emits: ['update:value'],
    template:
      '<input :placeholder="placeholder" :value="value" type="password" @input="$emit(\'update:value\', $event.target.value)" />'
  }),
  message: {
    error: messageError,
    success: messageSuccess
  }
}))

describe('forget password page', () => {
  beforeEach(() => {
    completePasswordRecoveryApi.mockReset()
    inspectPasswordRecoveryChannelsApi.mockReset()
    requestPasswordRecoveryChallengeApi.mockReset()
    verifyPasswordRecoveryChallengeApi.mockReset()
    messageError.mockReset()
    messageSuccess.mockReset()
    routeState.query = {}

    inspectPasswordRecoveryChannelsApi.mockResolvedValue({
      channels: [{ channel: 'EMAIL', maskedDestination: 'u***@example.com' }],
      defaultChannel: 'EMAIL'
    })
    requestPasswordRecoveryChallengeApi.mockResolvedValue({
      accepted: true,
      challengeId: 'challenge-1',
      expiresAt: '2026-04-20T08:30:00.000Z',
      maskedDestination: 'u***@example.com'
    })
    verifyPasswordRecoveryChallengeApi.mockResolvedValue({
      verified: true,
      resetToken: 'reset-token-1'
    })
    completePasswordRecoveryApi.mockResolvedValue({
      success: true,
      sessionsRevoked: true
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('prefills the identifier from the login page query', async () => {
    routeState.query = { identifier: 'user@example.com' }
    const view = await import('./forget-password.vue')
    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    const identifierInput = wrapper.find(
      'input[placeholder="name@company.com / +8613800138000"]'
    )

    expect((identifierInput.element as HTMLInputElement).value).toBe('user@example.com')
  })

  it('keeps the captcha disabled until the identifier input has content', async () => {
    const view = await import('./forget-password.vue')
    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    const sliderPassButton = document.body.querySelector('.slider-pass') as HTMLButtonElement | null
    const continueButton = wrapper.findAll('button').find((button) => button.text().includes('继续'))

    expect(sliderPassButton?.disabled).toBe(true)
    expect((continueButton?.element as HTMLButtonElement | undefined)?.disabled).toBe(true)

    sliderPassButton?.click()
    await flushPromises()

    expect(inspectPasswordRecoveryChannelsApi).not.toHaveBeenCalled()
  })

  it('auto-defaults the only verified recovery channel and progresses into otp verification', async () => {
    const view = await import('./forget-password.vue')
    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    expect(document.body.textContent).toContain('找回密码')
    expect(document.body.textContent).toContain('验证身份')

    await wrapper.find('input[placeholder="name@company.com / +8613800138000"]').setValue('user@example.com')
    const sliderPassButton = document.body.querySelector('.slider-pass') as HTMLButtonElement | null
    sliderPassButton?.click()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('继续'))?.trigger('click')
    await flushPromises()

    expect(inspectPasswordRecoveryChannelsApi).toHaveBeenCalledWith({
      identifier: 'user@example.com'
    })
    expect(requestPasswordRecoveryChallengeApi).toHaveBeenCalledWith({
      channel: 'EMAIL',
      identifier: 'user@example.com'
    })
    expect(document.body.textContent).toContain('输入验证码')

    await wrapper.find('input[placeholder="请输入 6 位验证码"]').setValue('123456')
    await wrapper.findAll('button').find((button) => button.text().includes('验证'))?.trigger('click')
    await flushPromises()

    expect(verifyPasswordRecoveryChallengeApi).toHaveBeenCalledWith({
      challengeId: 'challenge-1',
      otp: '123456'
    })
    expect(document.body.textContent).toContain('设置新密码')
  })

  it('lets the user choose the channel when both verified recovery destinations exist', async () => {
    inspectPasswordRecoveryChannelsApi.mockResolvedValue({
      channels: [
        { channel: 'EMAIL', maskedDestination: 'u***@example.com' },
        { channel: 'PHONE', maskedDestination: '+15****0100' }
      ]
    })

    const view = await import('./forget-password.vue')
    const wrapper = mount(view.default, {
      attachTo: document.body
    })

    await wrapper.find('input[placeholder="name@company.com / +8613800138000"]').setValue('user@example.com')
    const sliderPassButton = document.body.querySelector('.slider-pass') as HTMLButtonElement | null
    sliderPassButton?.click()
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text().includes('继续'))?.trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('选择接收方式')
    expect(document.body.textContent).toContain('+15****0100')

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('手机号'))?.trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text().includes('发送验证码'))?.trigger('click')
    await flushPromises()

    expect(requestPasswordRecoveryChallengeApi).toHaveBeenCalledWith({
      channel: 'PHONE',
      identifier: 'user@example.com'
    })
  })
})
