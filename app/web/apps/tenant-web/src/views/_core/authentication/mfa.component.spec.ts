/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const replaceMock = vi.fn()
const pushMock = vi.fn()

const authStoreMock = reactive({
  loginLoading: false,
  pendingChallengeId: 'challenge-1',
  pendingMfaAvailableFactors: [
    { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
    { type: 'TOTP', label: '认证器 App', priority: 2 },
    { type: 'BACKUP_CODE', label: '恢复码', priority: 4 }
  ],
  pendingMfaDestination: 'a***@example.com',
  pendingMfaExpiresAt: '',
  pendingMfaFactor: 'EMAIL_OTP' as 'BACKUP_CODE' | 'EMAIL_OTP' | 'SMS_OTP' | 'TOTP',
  pendingMfaFactorChallengeId: 'factor-1',
  pendingMfaResendCooldown: 0,
  pendingMfaScenario: 'LOGIN' as 'LOGIN' | 'NEW_DEVICE_LOGIN',
  cyclePendingMfaFactor: vi.fn(),
  completeMfa: vi.fn(),
  requestPendingMfaFactorChallenge: vi.fn(),
  resetPendingAuthFlow: vi.fn(),
  switchPendingMfaFactor: vi.fn()
})

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock
  })
}))

vi.mock('#/store', () => ({
  useAuthStore: () => authStoreMock
}))

vi.mock('ant-design-vue', async () => {
  const actual = await vi.importActual<any>('ant-design-vue')
  return {
    ...actual,
    Button: {
      emits: ['click'],
      props: ['block', 'disabled', 'loading', 'size', 'type'],
      template:
        '<button :data-type="type" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
    },
    Form: Object.assign(
      {
        emits: ['submit'],
        template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>'
      },
      {
        Item: {
          template: '<div><slot /></div>'
        }
      }
    ),
    Input: {
      emits: ['press-enter', 'update:value'],
      props: ['maxlength', 'placeholder', 'value'],
      template:
        '<input :value="value" :placeholder="placeholder" @input="$emit(\'update:value\', $event.target.value)" @keyup.enter="$emit(\'press-enter\')" />'
    },
    Checkbox: {
      emits: ['update:checked'],
      props: ['checked'],
      template:
        '<label><input class="trust-device-checkbox" type="checkbox" :checked="checked" @change="$emit(\'update:checked\', $event.target.checked)" /><slot /></label>'
    },
    Tooltip: {
      props: ['placement', 'title'],
      template: '<div class="tooltip" :data-title="title"><slot /></div>'
    },
    Tag: {
      template: '<span><slot /></span>'
    },
    message: {
      warning: vi.fn()
    }
  }
})

describe('CompleteMfa view', () => {
  beforeEach(() => {
    replaceMock.mockReset()
    pushMock.mockReset()
    authStoreMock.loginLoading = false
    authStoreMock.pendingChallengeId = 'challenge-1'
    authStoreMock.pendingMfaAvailableFactors = [
      { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 },
      { type: 'BACKUP_CODE', label: '恢复码', priority: 4 }
    ]
    authStoreMock.pendingMfaDestination = 'a***@example.com'
    authStoreMock.pendingMfaExpiresAt = ''
    authStoreMock.pendingMfaFactor = 'EMAIL_OTP'
    authStoreMock.pendingMfaFactorChallengeId = 'factor-1'
    authStoreMock.pendingMfaResendCooldown = 0
    authStoreMock.pendingMfaScenario = 'LOGIN'
    authStoreMock.cyclePendingMfaFactor.mockReset()
    authStoreMock.completeMfa.mockReset()
    authStoreMock.requestPendingMfaFactorChallenge.mockReset()
    authStoreMock.resetPendingAuthFlow.mockReset()
    authStoreMock.switchPendingMfaFactor.mockReset()
  })

  it('shows the rotate link inside the active factor panel without extra switch container copy', async () => {
    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    expect(wrapper.text()).toContain('验证邮箱验证码')
    expect(wrapper.text()).toContain('使用其他方式')
    expect(wrapper.text()).toContain('返回登录')
    expect(wrapper.text()).not.toContain('其他验证方式')
    expect(wrapper.find('a').text()).toBe('使用其他方式')
  })

  it('returns to the login page when the user clicks the back link', async () => {
    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    const backButton = wrapper
      .findAll('button')
      .find((button) => button.text() === '返回登录')

    expect(backButton).toBeTruthy()
    await backButton!.trigger('click')
    await flushPromises()

    expect(authStoreMock.resetPendingAuthFlow).toHaveBeenCalledTimes(1)
    expect(replaceMock).toHaveBeenCalledWith({ name: 'Login' })
  })

  it('shows a dedicated new-device notice before entering the MFA factor panel', async () => {
    authStoreMock.pendingMfaScenario = 'NEW_DEVICE_LOGIN'

    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    expect(wrapper.text()).toContain('检测到这是一个新的设备')
    expect(wrapper.text()).toContain('信任当前设备')
    expect(wrapper.text()).toContain('继续验证')
    expect(wrapper.text()).not.toContain('验证邮箱验证码')

    await wrapper.get('.trust-device-checkbox').setValue(true)
    const continueButton = wrapper
      .findAll('button')
      .find((button) => button.text() === '继续验证')

    expect(continueButton).toBeTruthy()
    await continueButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('验证邮箱验证码')
    expect(wrapper.text()).not.toContain('信任当前设备')
  })

  it('submits the remembered-device choice together with new-device MFA completion', async () => {
    authStoreMock.pendingMfaScenario = 'NEW_DEVICE_LOGIN'

    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    await wrapper.get('.trust-device-checkbox').setValue(true)
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '继续验证')!
      .trigger('click')
    await flushPromises()

    await wrapper.get('input').setValue('123456')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '验证并继续')!
      .trigger('click')
    await flushPromises()

    expect(authStoreMock.completeMfa).toHaveBeenCalledWith('123456', {
      trustCurrentDevice: true,
    })
  })

  it('rotates to the next factor when the user clicks the other-method link', async () => {
    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    await wrapper.get('a').trigger('click')
    await flushPromises()

    expect(authStoreMock.cyclePendingMfaFactor).toHaveBeenCalledTimes(1)
  })

  it('renders the totp-specific panel when the active factor changes', async () => {
    authStoreMock.pendingMfaFactor = 'TOTP'
    authStoreMock.pendingMfaAvailableFactors = [
      { type: 'TOTP', label: '认证器 App', priority: 1 },
      { type: 'EMAIL_OTP', label: '邮箱验证码', priority: 2 }
    ]

    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    expect(wrapper.text()).toContain('验证认证器验证码')
    expect(wrapper.text()).toContain('使用其他方式')
    expect(wrapper.text()).not.toContain('验证邮箱验证码')
    expect(wrapper.text()).not.toContain('打开已绑定的认证器应用')
    expect(wrapper.find('.tooltip').attributes('data-title')).toContain('打开已绑定的认证器应用')
  })

  it('masks the displayed email destination and resends without an extra gate', async () => {
    authStoreMock.pendingMfaDestination = 'alice@example.com'

    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    expect(wrapper.text()).toContain('a***@example.com')
    expect(wrapper.text()).not.toContain('alice@example.com')

    const resendButton = wrapper
      .findAll('button')
      .find((button) => button.text() === '重新发送验证码')

    expect(resendButton).toBeTruthy()
    await resendButton!.trigger('click')
    await flushPromises()

    expect(authStoreMock.requestPendingMfaFactorChallenge).toHaveBeenCalledTimes(1)
    expect(authStoreMock.requestPendingMfaFactorChallenge).toHaveBeenCalledWith('EMAIL_OTP')
  })

  it('sends the first email MFA OTP challenge without an extra gate', async () => {
    authStoreMock.pendingMfaDestination = ''
    authStoreMock.pendingMfaFactorChallengeId = ''

    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    expect(wrapper.text()).toContain('发送验证码')
    expect(authStoreMock.requestPendingMfaFactorChallenge).not.toHaveBeenCalled()

    const sendButton = wrapper
      .findAll('button')
      .find((button) => button.text() === '发送验证码')
    expect(sendButton).toBeTruthy()
    await sendButton!.trigger('click')
    await flushPromises()

    expect(authStoreMock.requestPendingMfaFactorChallenge).toHaveBeenCalledTimes(1)
    expect(authStoreMock.requestPendingMfaFactorChallenge).toHaveBeenCalledWith('EMAIL_OTP')
  })

  it('masks the displayed phone destination for sms otp', async () => {
    authStoreMock.pendingMfaFactor = 'SMS_OTP'
    authStoreMock.pendingMfaDestination = '+8613912345678'
    authStoreMock.pendingMfaAvailableFactors = [
      { type: 'SMS_OTP', label: '短信验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 }
    ]

    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    expect(wrapper.text()).toContain('+86****5678')
    expect(wrapper.text()).not.toContain('+8613912345678')
  })

  it('resends sms otp without an extra gate', async () => {
    authStoreMock.pendingMfaFactor = 'SMS_OTP'
    authStoreMock.pendingMfaDestination = '+8613912345678'
    authStoreMock.pendingMfaAvailableFactors = [
      { type: 'SMS_OTP', label: '短信验证码', priority: 1 },
      { type: 'TOTP', label: '认证器 App', priority: 2 }
    ]

    const view = await import('./mfa.vue')
    const wrapper = mount(view.default)

    const resendButton = wrapper
      .findAll('button')
      .find((button) => button.text() === '重新发送验证码')

    expect(resendButton).toBeTruthy()
    await resendButton!.trigger('click')
    await flushPromises()

    expect(authStoreMock.requestPendingMfaFactorChallenge).toHaveBeenCalledTimes(1)
    expect(authStoreMock.requestPendingMfaFactorChallenge).toHaveBeenCalledWith('SMS_OTP')
  })
})
