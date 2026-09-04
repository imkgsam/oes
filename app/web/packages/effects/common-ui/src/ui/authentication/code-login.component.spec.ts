/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const routerPush = vi.fn()
const formApi = vi.hoisted(() => ({
  getValues: vi.fn(),
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
  })
}))

vi.mock('./auth-title.vue', () => ({
  default: defineComponent({
    name: 'AuthTitle',
    template: '<div><slot /><slot name="desc" /></div>'
  })
}))

describe('AuthenticationCodeLogin actions layout', () => {
  beforeEach(() => {
    routerPush.mockReset()
    formApi.getValues.mockReset()
    formApi.validate.mockReset()
  })

  it('renders login and back actions inside one horizontal actions row', async () => {
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default, {
      props: {
        formSchema: [],
        showBack: true
      }
    })

    const actions = wrapper.find('.auth-code-actions')

    expect(actions.exists()).toBe(true)
    expect(actions.findAll('button')).toHaveLength(2)
    expect(actions.classes()).toEqual(expect.arrayContaining(['flex', 'gap-4']))
  })

  it('does not emit submit when identifier or code validation fails', async () => {
    formApi.validate.mockResolvedValue({
      errors: { code: 'authentication.codeTip' },
      valid: false
    })
    formApi.getValues.mockResolvedValue({ code: '', phoneNumber: '' })
    const onSubmit = vi.fn()
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default, {
      props: {
        formSchema: [],
        onSubmit,
        showBack: false
      }
    })

    await wrapper.get('.auth-code-actions button').trigger('click')
    await flushPromises()

    expect(formApi.validate).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('emits current values when identifier and code validation succeeds', async () => {
    const values = { code: '123456', email: 'user@example.com' }
    formApi.validate.mockResolvedValue({ errors: {}, valid: true })
    formApi.getValues.mockResolvedValue(values)
    const onSubmit = vi.fn()
    const view = await import('./code-login.vue')
    const wrapper = mount(view.default, {
      props: {
        formSchema: [],
        onSubmit,
        showBack: false
      }
    })

    await wrapper.get('.auth-code-actions button').trigger('click')
    await flushPromises()

    expect(onSubmit).toHaveBeenCalledWith(values)
  })
})
