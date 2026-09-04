/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getOwnBusinessCardPreviewApi = vi.fn()
const authContextState = {
  sessionContext: {
    tenant: {
      tenantId: 'tenant_001'
    }
  }
}

vi.mock('#/api', () => ({
  getOwnBusinessCardPreviewApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />'
  }
}))

const MenuStub = defineComponent({
  name: 'Menu',
  template: '<div data-testid="self-card-action-menu"><slot /></div>'
}) as ReturnType<typeof defineComponent> & { Item?: ReturnType<typeof defineComponent> }

MenuStub.Item = defineComponent({
  name: 'MenuItem',
  props: ['disabled'],
  template: '<div :aria-disabled="disabled"><slot name="icon" /><slot /></div>'
})

vi.mock('ant-design-vue', () => ({
  Alert: defineComponent({
    name: 'Alert',
    props: ['message'],
    template: '<div>{{ message }}</div>'
  }),
  Button: defineComponent({
    name: 'Button',
    props: ['ariaLabel', 'disabled', 'href', 'target', 'title', 'type'],
    emits: ['click'],
    template: '<a v-if="href" :aria-label="ariaLabel" :href="href" :target="target" :title="title"><slot name="icon" /><slot /></a><button v-else :aria-label="ariaLabel" :disabled="disabled" :title="title" type="button" @click="$emit(\'click\')"><slot name="icon" /><slot /></button>'
  }),
  Card: defineComponent({
    name: 'Card',
    template: '<section><slot /></section>'
  }),
  Dropdown: defineComponent({
    name: 'Dropdown',
    template: '<div data-testid="self-card-actions-dropdown"><slot /><div data-testid="self-card-actions-overlay"><slot name="overlay" /></div></div>'
  }),
  Empty: defineComponent({
    name: 'Empty',
    props: ['description'],
    template: '<div>{{ description }}</div>'
  }),
  Menu: MenuStub,
  QRCode: defineComponent({
    name: 'QRCode',
    props: ['size', 'value'],
    template: '<div data-testid="self-card-qr" :data-size="size" :data-value="value" />'
  }),
  Skeleton: defineComponent({
    name: 'Skeleton',
    template: '<div data-testid="self-card-loading" />'
  }),
  Tag: defineComponent({
    name: 'Tag',
    template: '<span><slot /></span>'
  })
}))

describe('personal business card section', () => {
  beforeEach(() => {
    getOwnBusinessCardPreviewApi.mockReset()
    authContextState.sessionContext.tenant = { tenantId: 'tenant_001' }
  })

  it('renders the authenticated employee card as a list-ready personal center block', async () => {
    getOwnBusinessCardPreviewApi.mockResolvedValue({
      publicEntryRef: {
        publicUrl: 'https://go.oes.local/c/ABC1234'
      },
      preview: {
        view: {
          contactActions: [
            {
              actionUrl: 'mailto:alex.chen@example.com',
              contactActionType: 'SEND_EMAIL'
            }
          ],
          person: {
            accountAvatarUrl: 'https://account-avatar.example.com/alex.png',
            department: 'Enterprise Sales',
            displayName: 'Alex Chen',
            officialPhotoUrl: 'https://cdn.example.com/hr/alex-official.webp',
            title: 'Sales Manager'
          }
        }
      },
      status: 'ACTIVE'
    })
    const view = await import('./personal-business-card-section.vue')

    const wrapper = mount(view.default)
    await flushPromises()

    expect(getOwnBusinessCardPreviewApi).toHaveBeenCalledWith('tenant_001')
    expect(wrapper.text()).toContain('我的名片')
    expect(wrapper.text()).not.toContain('刷新')
    expect(wrapper.text()).toContain('Alex Chen')
    expect(wrapper.text()).toContain('已启用')
    expect(wrapper.find('.personal-business-card-section__mini-card').exists()).toBe(true)
    expect(wrapper.find('.personal-business-card-section__mini-card--compact').exists()).toBe(true)
    expect(wrapper.find('.personal-business-card-section__visual').exists()).toBe(true)
    expect(wrapper.find('.personal-business-card-section__motion-sheen').exists()).toBe(true)
    expect(wrapper.find('.personal-business-card-section__ambient-ring').exists()).toBe(true)
    expect(wrapper.find('.personal-business-card-section__qr-tile').exists()).toBe(true)
    expect(wrapper.find('.personal-business-card-section__menu-trigger').attributes('aria-label')).toBe('名片操作')
    expect(wrapper.find('.personal-business-card-section__menu-trigger [data-icon="lucide:more-horizontal"]').exists()).toBe(true)
    expect(wrapper.find('.personal-business-card-section__actions').exists()).toBe(false)
    expect(wrapper.find('[data-testid="self-card-actions-dropdown"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('更多操作')
    expect(wrapper.text()).toContain('发送邮件')
    expect(wrapper.text()).toContain('预览名片')
    expect(wrapper.find('[data-testid="self-card-qr"]').attributes('data-size')).toBe('56')
    expect(wrapper.find('.personal-business-card-section__avatar').exists()).toBe(true)
    expect(wrapper.find('img[src="https://cdn.example.com/hr/alex-official.webp"]').exists()).toBe(true)
    expect(wrapper.find('a[href="https://go.oes.local/c/ABC1234"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('/c/ABC1234')
    expect(wrapper.text()).not.toContain('https://go.oes.local/c/ABC1234')
    expect(wrapper.text()).not.toContain('ACTIVE')
    expect(wrapper.text()).not.toContain('SEND_EMAIL')
    expect(wrapper.html()).not.toContain('account-avatar.example.com')
  })

  it('uses a formal placeholder instead of an account avatar when official photo is empty', async () => {
    getOwnBusinessCardPreviewApi.mockResolvedValue({
      publicEntryRef: {
        publicUrl: 'https://go.oes.local/c/DEF5678'
      },
      preview: {
        view: {
          contactActions: [],
          person: {
            accountAvatarUrl: 'https://account-avatar.example.com/bea.png',
            department: 'Finance',
            displayName: 'Bea Lin',
            officialPhotoUrl: null,
            title: 'Finance Lead'
          }
        }
      },
      status: 'ACTIVE'
    })
    const view = await import('./personal-business-card-section.vue')

    const wrapper = mount(view.default)
    await flushPromises()

    expect(wrapper.find('.personal-business-card-section__avatar').text()).toBe('B')
    expect(wrapper.find('.personal-business-card-section__avatar img').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('account-avatar.example.com')
  })

  it('shows an empty state when the current account has no business card preview', async () => {
    getOwnBusinessCardPreviewApi.mockResolvedValue(null)
    const view = await import('./personal-business-card-section.vue')

    const wrapper = mount(view.default)
    await flushPromises()

    expect(wrapper.text()).toContain('当前账号暂无可查看的员工名片')
  })

  it('keeps the personal center block compact and hides internal service errors', async () => {
    getOwnBusinessCardPreviewApi.mockRejectedValue(new Error('internal service is unreachable'))
    const view = await import('./personal-business-card-section.vue')

    const wrapper = mount(view.default)
    await flushPromises()

    expect(wrapper.text()).toContain('名片暂时不可用')
    expect(wrapper.text()).toContain('稍后重试')
    expect(wrapper.text()).not.toContain('internal service is unreachable')
    expect(wrapper.text()).not.toContain('后续多张名片会在这里并列展示')
  })
})
