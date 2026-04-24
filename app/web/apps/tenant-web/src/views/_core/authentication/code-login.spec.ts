/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routerReplace = vi.fn()
const routerPush = vi.fn()
const setFieldValue = vi.fn()
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
    emits: ['submit'],
    setup(_, { expose }) {
      expose({
        getFormApi: () => ({
          getValues: vi.fn().mockResolvedValue({}),
          setFieldValue
        })
      })

      return {}
    },
    template: '<section><slot name="form-prepend" /><slot name="submit-prepend" /></section>'
  }),
  SliderCaptcha: defineComponent({
    name: 'SliderCaptcha',
    template: '<div />'
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
    success: vi.fn()
  }
}))

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    authCodeLogin: vi.fn(),
    authEmailCodeLogin: vi.fn(),
    loginLoading: false,
    requestEmailOtpChallenge: vi.fn(),
    requestPhoneOtpChallenge: vi.fn()
  })
}))

describe('code login identifier handoff', () => {
  beforeEach(() => {
    routerPush.mockReset()
    routerReplace.mockReset()
    setFieldValue.mockReset()
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
})
