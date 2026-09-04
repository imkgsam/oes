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
    props: ['bordered', 'size', 'value'],
    template:
      '<div data-testid="public-card-qr" :data-bordered="String(bordered)" :data-size="size">{{ value }}</div>'
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

  it('keeps unavailable public cards inside the anonymous public shell', async () => {
    renderPublicBusinessCardApi.mockResolvedValue({ state: 'PUBLIC_CARD_UNAVAILABLE' })
    const view = await import('./business-card-public.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(renderPublicBusinessCardApi).toHaveBeenCalledWith('card_001')
    expect(wrapper.find('[data-public-card-state="PUBLIC_CARD_UNAVAILABLE"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('名片暂不可用')
    expect(wrapper.text()).toContain('该公开名片当前无法展示，请稍后再试。')
    expect(wrapper.text()).not.toContain('EMPLOYEE_NOT_ACTIVE')
    expect(wrapper.text()).not.toContain('CARD_DISABLED')
    expect(wrapper.html()).not.toContain('/auth/login')
    expect(wrapper.html()).not.toContain('redirect=')
  })

  it('renders missing public cards as controlled anonymous not-found state', async () => {
    renderPublicBusinessCardApi.mockResolvedValue({ state: 'PUBLIC_CARD_NOT_FOUND' })
    const view = await import('./business-card-public.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.find('[data-public-card-state="PUBLIC_CARD_NOT_FOUND"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('名片不存在')
    expect(wrapper.text()).toContain('该公开名片不存在或链接已失效。')
    expect(wrapper.html()).not.toContain('businessCardId')
    expect(wrapper.html()).not.toContain('tenantId')
    expect(wrapper.html()).not.toContain('/auth/login')
    expect(wrapper.html()).not.toContain('%252F404')
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
            actionUrl: '/public-entry/public/business-cards/card_001.vcf',
            contactActionType: 'SAVE_VCARD',
            displayOrder: 20
          },
          {
            actionUrl: 'https://www.oes.example',
            contactActionType: 'OPEN_COMPANY_WEBSITE',
            displayValue: 'www.oes.example',
            displayOrder: 30
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
    expect(wrapper.find('.public-card > .public-card__qr-shell').exists()).toBe(true)
    expect(wrapper.find('.public-card__content-grid').exists()).toBe(true)
    expect(wrapper.find('.public-card__identity .public-card__role').exists()).toBe(true)
    expect(wrapper.find('.public-card__content-grid > .public-card__contact-list').exists()).toBe(
      true
    )
    expect(wrapper.find('.public-card__content-grid .public-card__contact-row')).toBeTruthy()
    expect(wrapper.find('.public-card__ornament').exists()).toBe(false)
    expect(wrapper.find('.public-card__name-grid').exists()).toBe(false)
    expect(wrapper.find('.public-card__footer').exists()).toBe(false)
    expect(wrapper.find('.public-card__eyebrow').exists()).toBe(false)
    expect(
      wrapper.find('.public-card__portrait img[src="https://cdn.example.com/alex.jpg"]').exists()
    ).toBe(false)
    expect(wrapper.html()).not.toContain('account-avatar.example.com')
    expect(wrapper.text()).toContain('alex.chen@example.com')
    expect(wrapper.text()).toContain('保存通讯录')
    expect(wrapper.text()).not.toContain('下载标准 vCard')
    expect(wrapper.text()).toContain('www.oes.example')
    expect(wrapper.text()).not.toContain('扫码查看最新名片')
    expect(wrapper.text()).not.toContain('保存通讯录后，可快速找到联系方式。')
    expect(wrapper.find('[data-testid="public-card-qr"]').attributes('data-bordered')).toBe('false')
    expect(wrapper.find('[data-testid="public-card-qr"]').attributes('data-size')).toBe('72')
    expect(wrapper.find('[data-testid="public-card-qr"]').text()).toContain(
      'https://go.oes.local/c/ABC1234'
    )
    expect(wrapper.find('a[href="mailto:alex.chen@example.com"]').exists()).toBe(true)
    expect(
      wrapper.find('a[href="/public-entry/public/business-cards/card_001.vcf"]').exists()
    ).toBe(true)
    expect(wrapper.find('a[href="https://www.oes.example"]').exists()).toBe(true)
    expect(wrapper.findAll('.public-card__contact-row')).toHaveLength(3)
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

    expect(
      wrapper.find('a[href="/public-entry/public/business-cards/card_001.vcf"]').exists()
    ).toBe(false)
    expect(wrapper.find('.public-card__photo--placeholder').exists()).toBe(true)
    expect(wrapper.find('.public-card__photo--placeholder').text()).toBe('A')
    expect(wrapper.html()).not.toContain('account-avatar.example.com')
    expect(
      wrapper.findAll('.public-card__contact-row').some((row) => row.text().includes('保存通讯录'))
    ).toBe(false)
  })
})
