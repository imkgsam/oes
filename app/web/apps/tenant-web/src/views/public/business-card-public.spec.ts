/* @vitest-environment happy-dom */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const businessCardPublicSource = readFileSync(
  resolve(process.cwd(), 'apps/tenant-web/src/views/public/business-card-public.vue'),
  'utf8'
)

const renderPublicBusinessCardApi = vi.fn()
const routerReplace = vi.fn()
const routeState = {
  params: {
    businessCardId: 'card_001'
  }
}

vi.mock('#/api', () => ({
  renderPublicBusinessCardApi
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    replace: routerReplace
  })
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
    template: '<div data-testid="public-card-qr" :data-bordered="String(bordered)" :data-size="size">{{ value }}</div>'
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
    routerReplace.mockReset()
    routeState.params.businessCardId = 'card_001'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('redirects unavailable public cards to the 404 fallback', async () => {
    renderPublicBusinessCardApi.mockResolvedValue({ state: 'PUBLIC_CARD_UNAVAILABLE' })
    const view = await import('./business-card-public.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(renderPublicBusinessCardApi).toHaveBeenCalledWith('card_001')
    expect(routerReplace).toHaveBeenCalledWith({
      name: 'FallbackNotFound',
      params: { path: ['404'] }
    })
    expect(wrapper.text()).not.toContain('名片暂不可用')
    expect(wrapper.text()).not.toContain('该公开名片当前无法展示，请稍后再试。')
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
    expect(businessCardPublicSource).not.toContain('.public-card__portrait--photo-background::before')
    expect(businessCardPublicSource).not.toContain('margin-top: -38px;')
    expect(businessCardPublicSource).not.toContain('clip-path: polygon(0 38px')
    expect(businessCardPublicSource).toContain('margin-top: -16px;')
    expect(businessCardPublicSource).toContain('clip-path: polygon(0 16px')
    expect(businessCardPublicSource).toContain('min-height: 218px;')
    expect(businessCardPublicSource).toContain('padding: 58px 36px 44px;')
    expect(wrapper.find('.public-card__portrait .public-card__brand').exists()).toBe(false)
    expect(wrapper.find('.public-card__panel').exists()).toBe(true)
    expect(wrapper.find('.public-card__panel--angled').exists()).toBe(true)
    expect(wrapper.find('.public-card > .public-card__qr-shell').exists()).toBe(true)
    expect(wrapper.find('.public-card__content-grid').exists()).toBe(true)
    expect(wrapper.find('.public-card__identity .public-card__role').exists()).toBe(true)
    expect(wrapper.find('.public-card__content-grid > .public-card__contact-list').exists()).toBe(true)
    expect(wrapper.find('.public-card__content-grid .public-card__contact-row')).toBeTruthy()
    expect(wrapper.find('.public-card__ornament').exists()).toBe(false)
    expect(wrapper.find('.public-card__name-grid').exists()).toBe(false)
    expect(wrapper.find('.public-card__footer').exists()).toBe(false)
    expect(businessCardPublicSource).toContain('position: absolute;')
    expect(businessCardPublicSource).toContain('right: 18px;')
    expect(businessCardPublicSource).toContain('top: 18px;')
    expect(businessCardPublicSource).toContain('grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);')
    expect(businessCardPublicSource).toContain('max-width: 500px;')
    expect(businessCardPublicSource).toContain('font-size: 24px;')
    expect(businessCardPublicSource).toContain('max-width: 100%;')
    expect(businessCardPublicSource).toContain('padding-right: 10px;')
    expect(businessCardPublicSource).toContain('grid-template-columns: 18px 44px minmax(0, 1fr);')
    expect(businessCardPublicSource).toContain('public-card__contact-row--compact')
    expect(businessCardPublicSource).toContain('grid-template-columns: 18px minmax(0, 1fr);')
    expect(businessCardPublicSource).toContain('white-space: nowrap;')
    expect(wrapper.find('.public-card__eyebrow').exists()).toBe(false)
    expect(businessCardPublicSource).not.toContain('Business Card')
    expect(wrapper.find('.public-card__portrait img[src="https://cdn.example.com/alex.jpg"]').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('account-avatar.example.com')
    expect(wrapper.text()).toContain('alex.chen@example.com')
    expect(wrapper.text()).toContain('保存通讯录')
    expect(wrapper.text()).not.toContain('下载标准 vCard')
    expect(wrapper.text()).toContain('www.oes.example')
    expect(wrapper.text()).not.toContain('扫码查看最新名片')
    expect(wrapper.text()).not.toContain('保存通讯录后，可快速找到联系方式。')
    expect(wrapper.find('[data-testid="public-card-qr"]').attributes('data-bordered')).toBe('false')
    expect(wrapper.find('[data-testid="public-card-qr"]').attributes('data-size')).toBe('72')
    expect(wrapper.find('[data-testid="public-card-qr"]').text()).toContain('https://go.oes.local/c/ABC1234')
    expect(wrapper.find('a[href="mailto:alex.chen@example.com"]').exists()).toBe(true)
    expect(wrapper.find('a[href="https://app.oes.local/public/business-cards/card_001.vcf"]').exists()).toBe(true)
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

    expect(wrapper.find('a[href="/public-entry/public/business-cards/card_001.vcf"]').exists()).toBe(false)
    expect(wrapper.find('.public-card__photo--placeholder').exists()).toBe(true)
    expect(wrapper.find('.public-card__photo--placeholder').text()).toBe('A')
    expect(wrapper.html()).not.toContain('account-avatar.example.com')
    expect(wrapper.findAll('.public-card__contact-row').some((row) => row.text().includes('保存通讯录'))).toBe(false)
  })
})
