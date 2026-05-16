/* @vitest-environment happy-dom */

import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'

const uploadAccountAvatarApi = vi.fn()
const messageError = vi.fn()
const messageSuccess = vi.fn()

vi.mock('#/api/bff/personal-center', () => ({
  uploadAccountAvatarApi
}))

vi.mock('ant-design-vue', () => {
  const CardStub = defineComponent({
    name: 'Card',
    template: '<section><slot /></section>'
  })
  const ButtonStub = defineComponent({
    name: 'Button',
    props: ['disabled', 'loading', 'size', 'type'],
    emits: ['click'],
    template: '<button :disabled="disabled" type="button" @click="$emit(\'click\', $event)"><slot /></button>'
  })
  const UploadStub = defineComponent({
    name: 'Upload',
    props: ['disabled'],
    template: '<div class="upload-stub"><slot /></div>'
  })
  const InputStub = defineComponent({
    name: 'Input',
    props: ['value', 'maxlength', 'placeholder'],
    emits: ['update:value'],
    template:
      '<input :maxlength="maxlength" :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  })
  const TextAreaStub = defineComponent({
    name: 'InputTextArea',
    props: ['value', 'maxlength', 'placeholder'],
    emits: ['update:value'],
    template:
      '<textarea :maxlength="maxlength" :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  })
  const FormItemStub = defineComponent({
    name: 'FormItem',
    template: '<label><slot /></label>'
  })
  const FormStub = Object.assign(
    defineComponent({
      name: 'Form',
      emits: ['finish'],
      template: '<form><slot /></form>'
    }),
    { Item: FormItemStub }
  )

  return {
    Avatar: defineComponent({
      name: 'Avatar',
      props: ['src', 'size'],
      template: '<div class="avatar-stub"><slot /></div>'
    }),
    Button: ButtonStub,
    Card: CardStub,
    Form: FormStub,
    Input: Object.assign(InputStub, { TextArea: TextAreaStub }),
    Tag: defineComponent({
      name: 'Tag',
      template: '<span><slot /></span>'
    }),
    Tooltip: defineComponent({
      name: 'Tooltip',
      template: '<span><slot /></span>'
    }),
    Upload: UploadStub,
    message: {
      error: messageError,
      success: messageSuccess
    }
  }
})

describe('personal account section', () => {
  it('shows the avatar upload action for system-scope accounts', async () => {
    const view = await import('./personal-account-section.vue')
    const wrapper = mount(view.default, {
      props: {
        accountContext: {
          accountId: 'account-1',
          accountName: 'Platform Admin',
          avatar: 'https://cdn.example.com/avatar.png',
          bio: 'system profile',
          displayName: 'Platform Admin',
          roles: [],
          scopeLevel: 'SYSTEM'
        }
      }
    })

    expect(wrapper.text()).toContain('上传头像')
  })

  it('shows the avatar upload action for tenant-scope accounts', async () => {
    const view = await import('./personal-account-section.vue')
    const wrapper = mount(view.default, {
      props: {
        accountContext: {
          accountId: 'account-1',
          accountName: 'Tenant Admin',
          avatar: 'https://cdn.example.com/avatar.png',
          bio: 'tenant profile',
          displayName: 'Tenant Admin',
          roles: [],
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant'
        }
      }
    })

    expect(wrapper.text()).toContain('上传头像')
  })

  it('shows read-only effective terminal access for the current account', async () => {
    const view = await import('./personal-account-section.vue')
    const wrapper = mount(view.default, {
      props: {
        accountContext: {
          accountId: 'account-1',
          accountName: 'Workshop Supervisor',
          roles: [],
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          tenantName: 'Alpha Tenant'
        },
        allowedTerminals: ['WEB', 'PDA']
      }
    })

    expect(wrapper.text()).toContain('终端准入')
    expect(wrapper.text()).toContain('WEB')
    expect(wrapper.text()).toContain('PDA')
    expect(wrapper.text()).not.toContain('保存终端')
  })
})
