/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><slot /></div>'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />'
  }
}))

vi.mock('ant-design-vue', () => ({
  Alert: {
    name: 'AAlert',
    props: ['message'],
    template: '<div>{{ message }}</div>'
  },
  Button: {
    name: 'AButton',
    props: ['disabled', 'href', 'target'],
    template: '<a :href="href"><slot /></a>'
  },
  Empty: {
    name: 'AEmpty',
    props: ['description'],
    template: '<div>{{ description }}</div>'
  },
  QRCode: {
    name: 'AQrCode',
    props: ['value'],
    template: '<div data-testid="self-card-qr">{{ value }}</div>'
  },
  Skeleton: {
    name: 'ASkeleton',
    template: '<div data-testid="self-card-loading" />'
  },
  Space: {
    name: 'ASpace',
    template: '<div><slot /></div>'
  },
  Tag: {
    name: 'ATag',
    template: '<span><slot /></span>'
  }
}))

describe('employee BusinessCard self-view page', () => {
  beforeEach(() => {
    getOwnBusinessCardPreviewApi.mockReset()
    authContextState.sessionContext.tenant = { tenantId: 'tenant_001' }
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('loads only the authenticated tenant self-view endpoint without target ids', async () => {
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
            department: 'Enterprise Sales',
            displayName: 'Alex Chen',
            title: 'Sales Manager'
          }
        }
      },
      status: 'ACTIVE'
    })
    const view = await import('./business-card-self-view.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(getOwnBusinessCardPreviewApi).toHaveBeenCalledWith('tenant_001')
    expect(JSON.stringify(getOwnBusinessCardPreviewApi.mock.calls)).not.toContain('employeeId')
    expect(JSON.stringify(getOwnBusinessCardPreviewApi.mock.calls)).not.toContain('businessCardId')
    expect(wrapper.text()).toContain('Alex Chen')
    expect(wrapper.text()).toContain('https://go.oes.local/c/ABC1234')
    expect(wrapper.find('a[href="mailto:alex.chen@example.com"]').exists()).toBe(true)
  })

  it('shows a tenant-context error instead of calling the API when session tenant is missing', async () => {
    authContextState.sessionContext.tenant = null as never
    getOwnBusinessCardPreviewApi.mockResolvedValue(null)
    const view = await import('./business-card-self-view.vue')

    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(getOwnBusinessCardPreviewApi).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('当前会话缺少租户上下文。')
  })
})
