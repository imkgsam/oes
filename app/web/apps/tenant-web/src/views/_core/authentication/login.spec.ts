/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routerPush = vi.fn()
const routerReplace = vi.fn()
const loginFormValues = vi.hoisted(() => ({
  values: {} as Record<string, any>
}))
const routeState = vi.hoisted(() => ({
  query: {} as Record<string, string | undefined>
}))

const zString = () => ({
  email: () => zString(),
  max: () => zString(),
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
  AuthenticationLogin: defineComponent({
    name: 'AuthenticationLogin',
    emits: ['forgetPassword', 'submit'],
    setup(_, { expose }) {
      expose({
        getFormApi: () => ({
          getValues: vi.fn().mockResolvedValue(loginFormValues.values)
        })
      })

      return {}
    },
    template: `
      <section>
        <slot name="form-prepend" />
        <button
          class="forgot-email"
          type="button"
          @click="$emit('forgetPassword', { username: 'user@example.com' })"
        >
          forgot-email
        </button>
        <button
          class="forgot-phone"
          type="button"
          @click="$emit('forgetPassword', { phoneNumber: '+8613800138000' })"
        >
          forgot-phone
        </button>
        <slot name="submit-prepend" />
        <slot name="third-party-login" />
      </section>
    `
  }),
  SliderCaptcha: defineComponent({
    name: 'SliderCaptcha',
    template: '<div />'
  }),
  VbenButton: defineComponent({
    name: 'VbenButton',
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>'
  }),
  z: {
    string: zString
  }
}))

vi.mock('@vben/icons', () => ({
  SvgGithubIcon: defineComponent({ template: '<span />' }),
  SvgGoogleIcon: defineComponent({ template: '<span />' }),
  SvgQQChatIcon: defineComponent({ template: '<span />' }),
  SvgWeChatIcon: defineComponent({ template: '<span />' })
}))

vi.mock('@vben/locales', () => ({
  $t: (value: string) => value
}))

vi.mock('ant-design-vue', () => ({
  message: {
    info: vi.fn()
  }
}))

vi.mock('#/store', () => ({
  useAuthStore: () => ({
    authLogin: vi.fn(),
    authPhonePasswordLogin: vi.fn(),
    loginLoading: false
  })
}))

// Verifies the login page passes the current identifier into password recovery navigation.
describe('password login recovery navigation', () => {
  beforeEach(() => {
    routerPush.mockReset()
    routerReplace.mockReset()
    routeState.query = {}
    loginFormValues.values = {}
  })

  it('passes the email identifier to the forget password page', async () => {
    const view = await import('./login.vue')
    const wrapper = mount(view.default)

    await wrapper.find('.forgot-email').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'ForgetPassword',
      query: {
        identifier: 'user@example.com'
      }
    })
  })

  it('passes the phone identifier to the forget password page in phone login mode', async () => {
    routeState.query = { mode: 'phone' }
    const view = await import('./login.vue')
    const wrapper = mount(view.default)

    await wrapper.find('.forgot-phone').trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'ForgetPassword',
      query: {
        identifier: '+8613800138000'
      }
    })
  })

  it('passes the current email identifier to the code login page', async () => {
    loginFormValues.values = { username: 'user@example.com' }
    const view = await import('./login.vue')
    const wrapper = mount(view.default)

    const codeLoginButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('验证码登录'))
    await codeLoginButton?.trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'CodeLogin',
      query: {
        mode: 'email',
        identifier: 'user@example.com'
      }
    })
  })

  it('passes the current phone identifier to the code login page in phone login mode', async () => {
    routeState.query = { mode: 'phone' }
    loginFormValues.values = { phoneNumber: '+8613800138000' }
    const view = await import('./login.vue')
    const wrapper = mount(view.default)

    const codeLoginButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('验证码登录'))
    await codeLoginButton?.trigger('click')

    expect(routerPush).toHaveBeenCalledWith({
      name: 'CodeLogin',
      query: {
        mode: 'phone',
        identifier: '+8613800138000'
      }
    })
  })
})
