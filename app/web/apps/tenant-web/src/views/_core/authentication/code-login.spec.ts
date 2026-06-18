/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routerReplace = vi.fn()
const routerPush = vi.fn()
const setFieldValue = vi.fn()
const storageState = vi.hoisted(() => new Map<string, string>())
const requestEmailOtpChallengeMock = vi.hoisted(() => vi.fn())
const requestPhoneOtpChallengeMock = vi.hoisted(() => vi.fn())
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
          getValues: vi.fn().mockResolvedValue({
            email: 'user@example.com',
            phoneNumber: '+8613800138000'
          }),
          setFieldValue
        })
      })

      async function triggerSendCode() {
        const codeField = (props.formSchema as Array<any>).find(
          (item) => item?.fieldName === 'code'
        )
        await codeField?.componentProps?.handleSendCode?.()
      }

      return {
        triggerSendCode
      }
    },
    template: `
      <section>
        <slot name="form-prepend" />
        <button class="send-code" type="button" @click="triggerSendCode">send-code</button>
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
    warning: vi.fn(),
    success: vi.fn()
  }
}))

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    authCodeLogin: vi.fn(),
    authEmailCodeLogin: vi.fn(),
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
  })
})
