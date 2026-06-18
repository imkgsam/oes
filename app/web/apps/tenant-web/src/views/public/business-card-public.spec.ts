/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const renderPublicBusinessCardApi = vi.fn()
const routeState = {
  params: {
    businessCardId: 'card_001'
  }
}

vi.mock('#/api', () => ({
  renderPublicBusinessCardApi
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState
}))

vi.mock('ant-design-vue', () => ({
  Button: {
    name: 'AButton',
    props: ['href', 'size', 'type'],
    template: '<a :href="href"><slot /></a>'
  },
  QRCode: defineComponent({
    name: 'AQrCode',
    props: ['size', 'value'],
    template: '<div data-testid="public-card-qr" :data-size="size">{{ value }}</div>'
  }),
  Skeleton: {
    name: 'ASkeleton',
    template: '<div data-testid="public-card-loading" />'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />'
  }
}))

describe('public BusinessCard page', () => {
  beforeEach(() => {
    renderPublicBusinessCardApi.mockReset()
    routeState.params.businessCardId = 'card_001'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders a generic unavailable state without leaking internal reasons', async () => {
    renderPublicBusinessCardApi.mockResolvedValue({ state: 'PUBLIC_CARD_UNAVAILABLE' })
    const view = await import('./business-card-public.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(renderPublicBusinessCardApi).toHaveBeenCalledWith('card_001')
    expect(wrapper.text()).toContain('名片暂不可用')
    expect(wrapper.text()).toContain('该公开名片当前无法展示，请稍后再试。')
    expect(wrapper.text()).not.toContain('EMPLOYEE_NOT_ACTIVE')
    expect(wrapper.text()).not.toContain('CARD_DISABLED')
  })

  it('renders contract-provided public actions including the vCard href', async () => {
    renderPublicBusinessCardApi.mockResolvedValue({
      state: 'AVAILABLE',
      view: {
        businessCardId: 'card_001',
        company: {
          companyDisplayName: 'OES Manufacturing'
        },
        contactActions: [
          {
            actionUrl: 'mailto:alex.chen@example.com',
            contactActionType: 'SEND_EMAIL',
            displayValue: 'alex.chen@example.com',
            displayOrder: 10
          },
          {
            actionUrl: 'https://app.oes.local/public/business-cards/card_001.vcf',
            contactActionType: 'SAVE_VCARD',
            displayOrder: 20
          }
        ],
        person: {
          accountAvatarUrl: 'https://account-avatar.example.com/alex.png',
          department: 'Enterprise Sales',
          displayName: 'Alex Chen',
          englishName: 'Alex Chen',
          officialPhotoUrl: 'https://cdn.example.com/alex.jpg',
          title: 'Sales Manager'
        },
        publicUrl: 'https://go.oes.local/c/ABC1234',
        templateKey: 'TENANT_STANDARD'
      }
    })
    const view = await import('./business-card-public.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.text()).toContain('Alex Chen')
    expect(wrapper.text()).toContain('OES Manufacturing')
    expect(wrapper.find('.public-card__portrait').exists()).toBe(true)
    expect(wrapper.find('.public-card__portrait--photo-background').attributes('style')).toContain(
      'https://cdn.example.com/alex.jpg'
    )
    expect(wrapper.find('.public-card__portrait .public-card__brand').exists()).toBe(false)
    expect(wrapper.find('.public-card__panel').exists()).toBe(true)
    expect(wrapper.find('.public-card__panel--angled').exists()).toBe(true)
    expect(wrapper.find('.public-card__portrait img[src="https://cdn.example.com/alex.jpg"]').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('account-avatar.example.com')
    expect(wrapper.text()).toContain('alex.chen@example.com')
    expect(wrapper.text()).toContain('下载标准 vCard')
    expect(wrapper.text()).toContain('扫码查看最新名片')
    expect(wrapper.find('[data-testid="public-card-qr"]').attributes('data-size')).toBe('86')
    expect(wrapper.find('[data-testid="public-card-qr"]').text()).toContain('https://go.oes.local/c/ABC1234')
    expect(wrapper.find('a[href="mailto:alex.chen@example.com"]').exists()).toBe(true)
    expect(wrapper.find('a[href="https://app.oes.local/public/business-cards/card_001.vcf"]').exists()).toBe(true)
  })

  it('does not synthesize vCard actions when the public contract omits them', async () => {
    renderPublicBusinessCardApi.mockResolvedValue({
      state: 'AVAILABLE',
      view: {
        businessCardId: 'card_001',
        company: {
          companyDisplayName: 'OES Manufacturing'
        },
        contactActions: [
          {
            actionUrl: 'tel:+13128471928',
            contactActionType: 'CALL_PHONE',
            displayValue: '+1 (312) 847-1928',
            displayOrder: 10
          }
        ],
        person: {
          accountAvatarUrl: 'https://account-avatar.example.com/alex.png',
          department: 'Enterprise Sales',
          displayName: 'Alex Chen',
          title: 'Sales Manager'
        },
        templateKey: 'TENANT_STANDARD'
      }
    })
    const view = await import('./business-card-public.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.find('a[href="/public-entry/public/business-cards/card_001.vcf"]').exists()).toBe(false)
    expect(wrapper.find('.public-card__photo--placeholder').exists()).toBe(true)
    expect(wrapper.find('.public-card__photo--placeholder').text()).toBe('A')
    expect(wrapper.html()).not.toContain('account-avatar.example.com')
    expect(wrapper.findAll('.public-card__contact-row').some((row) => row.text().includes('保存通讯录'))).toBe(false)
  })
})
