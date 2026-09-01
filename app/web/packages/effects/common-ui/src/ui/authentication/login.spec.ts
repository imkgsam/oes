/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routerPush = vi.fn()
const localStorageGetItem = vi.fn()
const localStorageSetItem = vi.fn()
const formApi = vi.hoisted(() => ({
  getValues: vi.fn(),
  setFieldValue: vi.fn(),
  validate: vi.fn()
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush
  })
}))

vi.mock('@vben/locales', () => ({
  $t: (value: string) => value
}))

vi.mock('@vben-core/form-ui', () => ({
  useVbenForm: () => [
    defineComponent({
      name: 'MockVbenForm',
      template: '<form><slot /></form>'
    }),
    formApi
  ]
}))

vi.mock('@vben-core/shadcn-ui', () => ({
  VbenButton: defineComponent({
    name: 'VbenButton',
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>'
  }),
  VbenCheckbox: defineComponent({
    name: 'VbenCheckbox',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<label><input type="checkbox" :checked="modelValue" /> <slot /></label>'
  })
}))

vi.mock('./auth-title.vue', () => ({
  default: defineComponent({
    name: 'AuthTitle',
    template: '<div><slot /><slot name="desc" /></div>'
  })
}))

vi.mock('./third-party-login.vue', () => ({
  default: defineComponent({
    name: 'ThirdPartyLogin',
    template: '<div />'
  })
}))

// Verifies the shared login shell exposes current form values before custom recovery navigation.
describe('AuthenticationLogin forget password action', () => {
  beforeEach(() => {
    routerPush.mockReset()
    formApi.getValues.mockReset()
    formApi.setFieldValue.mockReset()
    formApi.validate.mockReset()
    localStorageGetItem.mockReset()
    localStorageSetItem.mockReset()
    vi.stubGlobal('localStorage', {
      getItem: localStorageGetItem,
      setItem: localStorageSetItem
    })
  })

  it('emits current form values instead of navigating directly when a consumer handles recovery', async () => {
    formApi.getValues.mockResolvedValue({ username: 'user@example.com' })
    const onForgetPassword = vi.fn()
    const view = await import('./login.vue')

    const wrapper = mount(view.default, {
      props: {
        onForgetPassword,
        showRememberMe: false
      }
    })

    await wrapper.find('.vben-link').trigger('click')
    await flushPromises()

    expect(onForgetPassword).toHaveBeenCalledWith({ username: 'user@example.com' })
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('does not emit submit when field validation fails', async () => {
    formApi.validate.mockResolvedValue({
      errors: { password: 'authentication.passwordTip' },
      valid: false
    })
    formApi.getValues.mockResolvedValue({ password: '', username: '' })
    const onSubmit = vi.fn()
    const view = await import('./login.vue')

    const wrapper = mount(view.default, {
      props: {
        onSubmit,
        showRememberMe: false
      }
    })

    await wrapper.get('[aria-label="login"]').trigger('click')
    await flushPromises()

    expect(formApi.validate).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('emits current values when field validation succeeds', async () => {
    const values = {
      password: 'correct-password',
      username: 'user@example.com'
    }
    formApi.validate.mockResolvedValue({ errors: {}, valid: true })
    formApi.getValues.mockResolvedValue(values)
    const onSubmit = vi.fn()
    const view = await import('./login.vue')

    const wrapper = mount(view.default, {
      props: {
        onSubmit,
        showRememberMe: false
      }
    })

    await wrapper.get('[aria-label="login"]').trigger('click')
    await flushPromises()

    expect(onSubmit).toHaveBeenCalledWith(values)
  })
})
