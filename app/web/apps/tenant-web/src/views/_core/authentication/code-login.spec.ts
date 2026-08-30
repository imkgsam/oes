/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routerReplace = vi.fn()
const routerPush = vi.fn()
const setFieldValue = vi.fn()
const storageState = vi.hoisted(() => new Map<string, string>())
const requestEmailOtpChallengeMock = vi.hoisted(() => vi.fn())
const requestPhoneOtpChallengeMock = vi.hoisted(() => vi.fn())
const authCodeLoginMock = vi.hoisted(() => vi.fn())
const authEmailCodeLoginMock = vi.hoisted(() => vi.fn())
const messageWarningMock = vi.hoisted(() => vi.fn())
const formState = vi.hoisted(() => ({
  validation: { valid: true } as Record<string, any>,
  values: {
    code: '123456',
    email: 'user@example.com',
    phoneNumber: '+8613800138000'
  } as Record<string, any>
}))
const validateField = vi.hoisted(() => vi.fn())
const routeState = vi.hoisted(() => ({
  query: {} as Record<string, string | undefined>
}))

const zString = () => ({
  email: () => zString(),
  length: () => zString(),
  min: () => zString(),
  refine: () => zString()
})

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace
  })
}))

vi.mock('@vben/common-ui', () => ({
  AuthenticationCodeLogin: defineComponent({
    name: 'AuthenticationCodeLogin',
    props: {
      formSchema: {
        type: Array,
        default: () => []
      }
    },
    emits: ['submit'],
    setup(props, { expose }) {
      expose({
        getFormApi: () => ({
          getValues: vi.fn().mockImplementation(async () => formState.values),
          validateField,
          setFieldValue
        })
      })

      async function triggerSendCode() {
        const codeField = (props.formSchema as Array<any>).find(
          (item) => item?.fieldName === 'code'
        )
        await codeField?.componentProps?.handleSendCode?.()
      }

      function submitPhone() {
        return {
          code: formState.values.code,
          phoneNumber: formState.values.phoneNumber
        }
      }

      function submitEmail() {
        return {
          code: formState.values.code,
          email: formState.values.email
        }
      }

      return {
        submitEmail,
        submitPhone,
        triggerSendCode
      }
    },
    template: `
      <section>
        <slot name="form-prepend" />
        <button class="send-code" type="button" @click="triggerSendCode">send-code</button>
        <button class="submit-phone" type="button" @click="$emit('submit', submitPhone())">submit-phone</button>
        <button class="submit-email" type="button" @click="$emit('submit', submitEmail())">submit-email</button>
        <slot name="submit-prepend" />
      </section>
    `
  }),
  z: {
    string: zString
  }
}))

vi.mock('@vben/locales', () => ({
  $t: (value: string) => value
}))

vi.mock('ant-design-vue', () => ({
  message: {
    warning: messageWarningMock,
    success: vi.fn()
  }
}))

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    authCodeLogin: authCodeLoginMock,
    authEmailCodeLogin: authEmailCodeLoginMock,
    loginLoading: false,
    requestEmailOtpChallenge: requestEmailOtpChallengeMock,
    requestPhoneOtpChallenge: requestPhoneOtpChallengeMock
  })
}))

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    clear: () => storageState.clear(),
    getItem: (key: string) => storageState.get(key) ?? null,
    removeItem: (key: string) => storageState.delete(key),
    setItem: (key: string, value: string) => storageState.set(key, value)
  },
  configurable: true
})

describe('code login identifier handoff', () => {
  beforeEach(() => {
    localStorage.clear()
    routerPush.mockReset()
    routerReplace.mockReset()
    setFieldValue.mockReset()
    requestEmailOtpChallengeMock.mockReset()
    requestPhoneOtpChallengeMock.mockReset()
    authCodeLoginMock.mockReset()
    authEmailCodeLoginMock.mockReset()
    messageWarningMock.mockReset()
    validateField.mockReset()
    validateField.mockImplementation(async () => formState.validation)
    formState.validation = { valid: true }
    formState.values = {
      code: '123456',
      email: 'user@example.com',
      phoneNumber: '+8613800138000'
    }
    routeState.query = {}
  })

  it('prefills the email field from route identifier in email code login mode', async () => {
    routeState.query = {
      mode: 'email',
      identifier: 'user@example.com'
    }
    const view = await import('./code-login.vue')

    mount(view.default)
    await Promise.resolve()

    expect(setFieldValue).toHaveBeenCalledWith('email', 'user@example.com')
  })

  it('prefills the phone field from route identifier in phone code login mode', async () => {
    routeState.query = {
      mode: 'phone',
      identifier: '+8613800138000'
    }
    const view = await import('./code-login.vue')

    mount(view.default)
    await Promise.resolve()

    expect(setFieldValue).toHaveBeenCalledWith('phoneNumber', '+8613800138000')
  })

  it('restores the last used phone otp login mode and identifier when no route query is provided', async () => {
    localStorage.setItem(
      'tenant-web.auth.login-preference.v1',
      JSON.stringify({
        otp: {
          mode: 'phone',
          phoneNumber: '+8613800138000'
        }
      })
    )
    const view = await import('./code-login.vue')

    mount(view.default)
    await Promise.resolve()

    expect(setFieldValue).toHaveBeenCalledWith('phoneNumber', '+8613800138000')
  })

  it('sends a phone otp challenge without requiring an extra gate', async () => {
    routeState.query = {
      mode: 'phone'
    }
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)

    await wrapper.get('.send-code').trigger('click')

    expect(requestPhoneOtpChallengeMock).toHaveBeenCalledWith('+8613800138000')
    expect(validateField).toHaveBeenCalledWith('phoneNumber')
  })

  it('binds empty phone feedback and does not request a challenge', async () => {
    routeState.query = { mode: 'phone' }
    formState.values.phoneNumber = ''
    formState.validation = {
      errors: ['authentication.mobileTip'],
      valid: false
    }
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)

    await wrapper.get('.send-code').trigger('click')

    expect(validateField).toHaveBeenCalledWith('phoneNumber')
    expect(requestPhoneOtpChallengeMock).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('binds malformed email feedback and does not request a challenge', async () => {
    routeState.query = { mode: 'email' }
    formState.values.email = 'invalid-email'
    formState.validation = {
      errors: ['请输入有效邮箱地址'],
      valid: false
    }
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)

    await wrapper.get('.send-code').trigger('click')

    expect(validateField).toHaveBeenCalledWith('email')
    expect(requestEmailOtpChallengeMock).not.toHaveBeenCalled()
  })

  it('sends an email challenge after field validation succeeds', async () => {
    routeState.query = { mode: 'email' }
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)

    await wrapper.get('.send-code').trigger('click')

    expect(validateField).toHaveBeenCalledWith('email')
    expect(requestEmailOtpChallengeMock).toHaveBeenCalledWith('user@example.com')
  })

  it('keeps the custom phone component out of Vue reactive schema proxies', async () => {
    routeState.query = { mode: 'phone' }
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)
    const schema = wrapper
      .findComponent({ name: 'AuthenticationCodeLogin' })
      .props('formSchema') as Array<any>
    const phoneField = schema.find((field) => field.fieldName === 'phoneNumber')

    expect(phoneField?.component?.__v_skip).toBe(true)
  })

  it('switches between phone and email routes without submitting', async () => {
    routeState.query = { mode: 'phone' }
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)
    const emailModeButton = wrapper
      .findAll('button')
      .find((button) => button.text() === '邮箱')

    await emailModeButton?.trigger('click')

    expect(routerReplace).toHaveBeenCalledWith({
      name: 'CodeLogin',
      query: { mode: 'email' }
    })
    expect(requestPhoneOtpChallengeMock).not.toHaveBeenCalled()
    expect(requestEmailOtpChallengeMock).not.toHaveBeenCalled()
  })

  it('preserves the successful phone send-code and submit path', async () => {
    routeState.query = { mode: 'phone' }
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)

    await wrapper.get('.send-code').trigger('click')
    await flushPromises()
    await wrapper.get('.submit-phone').trigger('click')
    await flushPromises()

    expect(requestPhoneOtpChallengeMock).toHaveBeenCalledWith('+8613800138000')
    expect(authCodeLoginMock).toHaveBeenCalledWith({
      code: '123456',
      phoneNumber: '+8613800138000'
    })
  })

  it('preserves the successful email send-code and submit path', async () => {
    routeState.query = { mode: 'email' }
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)

    await wrapper.get('.send-code').trigger('click')
    await flushPromises()
    await wrapper.get('.submit-email').trigger('click')
    await flushPromises()

    expect(requestEmailOtpChallengeMock).toHaveBeenCalledWith('user@example.com')
    expect(authEmailCodeLoginMock).toHaveBeenCalledWith({
      code: '123456',
      email: 'user@example.com'
    })
  })

  it('does not submit a valid code before a challenge was requested', async () => {
    routeState.query = { mode: 'phone' }
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default)

    await wrapper.get('.submit-phone').trigger('click')
    await flushPromises()

    expect(messageWarningMock).toHaveBeenCalledWith('请先发送验证码。')
    expect(authCodeLoginMock).not.toHaveBeenCalled()
  })
})
