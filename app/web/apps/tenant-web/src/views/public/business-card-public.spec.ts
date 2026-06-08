/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const renderPublicBusinessCardApi = vi.fn()
const resolveBusinessCardVCardUrl = vi.fn()
const routeState = {
  params: {
    businessCardId: 'card_001'
  }
}

vi.mock('#/api', () => ({
  renderPublicBusinessCardApi,
  resolveBusinessCardVCardUrl
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
  Skeleton: {
    name: 'ASkeleton',
    template: '<div data-testid="public-card-loading" />'
  }
}))

describe('public BusinessCard page', () => {
  beforeEach(() => {
    renderPublicBusinessCardApi.mockReset()
    resolveBusinessCardVCardUrl.mockReset()
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
            displayOrder: 10
          },
          {
            actionUrl: 'https://app.oes.local/public/business-cards/card_001.vcf',
            contactActionType: 'SAVE_VCARD',
            displayOrder: 20
          }
        ],
        person: {
          department: 'Enterprise Sales',
          displayName: 'Alex Chen',
          englishName: 'Alex Chen',
          title: 'Sales Manager'
        },
        templateKey: 'TENANT_STANDARD'
      }
    })
    const view = await import('./business-card-public.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.text()).toContain('Alex Chen')
    expect(wrapper.text()).toContain('OES Manufacturing')
    expect(wrapper.find('a[href="mailto:alex.chen@example.com"]').exists()).toBe(true)
    expect(wrapper.find('a[href="https://app.oes.local/public/business-cards/card_001.vcf"]').exists()).toBe(true)
    expect(resolveBusinessCardVCardUrl).not.toHaveBeenCalled()
  })
})
