/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createSiteApi = vi.fn()
const listSiteCardsApi = vi.fn()
const routerPush = vi.fn()

const authContextState = {
  sessionContext: {
    tenant: {
      tenantId: 'tenant_001'
    }
  }
}

vi.mock('#/api', () => ({
  createSiteApi,
  listSiteCardsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPush
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<main><slot /></main>'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />'
  }
}))

vi.mock('#/locales', () => ({
  $t: (key: string) => key
}))

const FormStub: { Item?: unknown; name: string; template: string } = {
  name: 'AForm',
  template: '<form @submit.prevent="$emit(\'submit\', $event)"><slot /></form>'
}
FormStub.Item = {
  name: 'AFormItem',
  props: ['label'],
  template: '<label>{{ label }}<slot /></label>'
}

vi.mock('ant-design-vue', () => ({
  Alert: { name: 'AAlert', props: ['message'], template: '<div>{{ message }}</div>' },
  Button: {
    name: 'AButton',
    props: ['htmlType', 'loading', 'type'],
    emits: ['click'],
    template: '<button :type="htmlType || \'button\'" @click="$emit(\'click\', $event)"><slot name="icon" /><slot /></button>'
  },
  Empty: { name: 'AEmpty', props: ['description'], template: '<div>{{ description }}</div>' },
  Form: FormStub,
  Input: {
    name: 'AInput',
    props: ['placeholder', 'value'],
    emits: ['update:value'],
    template: '<input :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  },
  Modal: {
    name: 'AModal',
    props: ['open', 'title'],
    emits: ['update:open'],
    template: '<section v-if="open" role="dialog" :aria-label="title"><slot /></section>'
  },
  Select: {
    name: 'ASelect',
    props: ['options', 'value'],
    emits: ['update:value'],
    template: '<select :value="value" @change="$emit(\'update:value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>'
  },
  Skeleton: { name: 'ASkeleton', template: '<div data-testid="site-loading" />' },
  Tag: { name: 'ATag', props: ['color'], template: '<span><slot /></span>' },
  message: { success: vi.fn() }
}))

const siteCards = [
  {
    siteId: 'site_001',
    siteName: 'North America Brand',
    siteType: 'brand',
    primaryDomain: 'brand.example.com',
    status: 'draft',
    activeLocales: ['en-US'],
    preparingLocales: [],
    runtimeStatus: 'healthy',
    pendingSyncCount: 2,
    latestPublishVersion: 3,
    runtimePublishVersion: 2
  }
]

describe('site-management list view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listSiteCardsApi.mockResolvedValue({ cards: siteCards })
    createSiteApi.mockResolvedValue({ siteId: 'site_created' })
  })

  it('renders the filterable site table without mounting the heavy detail surface', async () => {
    const { default: SiteManagement } = await import('./site-management.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    expect(listSiteCardsApi).toHaveBeenCalledWith('tenant_001')
    expect(wrapper.find('.site-table').exists()).toBe(true)
    expect(wrapper.find('.site-detail').exists()).toBe(false)
    expect(wrapper.text()).toContain('North America Brand')

    await wrapper.find('[data-testid="site-open-detail"]').trigger('click')
    await flushPromises()

    expect(routerPush).toHaveBeenCalledWith({
      name: 'AdminSiteManagementDetail',
      params: {
        siteId: 'site_001'
      }
    })
  })

  it('filters the site table by keyword without changing the Admin BFF contract', async () => {
    listSiteCardsApi.mockResolvedValue({
      cards: [
        ...siteCards,
        {
          siteId: 'site_002',
          siteName: 'China Regional Storefront',
          siteType: 'regional',
          primaryDomain: 'cn.example.com',
          status: 'active',
          activeLocales: ['zh-CN'],
          preparingLocales: [],
          runtimeStatus: 'healthy',
          pendingSyncCount: 0,
          latestPublishVersion: 7,
          runtimePublishVersion: 7
        }
      ]
    })
    const { default: SiteManagement } = await import('./site-management.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    expect(wrapper.find('.site-card').exists()).toBe(false)
    expect(wrapper.find('.site-table').text()).toContain('North America Brand')
    expect(wrapper.find('.site-table').text()).toContain('China Regional Storefront')

    await wrapper.find('input[placeholder="搜索站点名称或域名"]').setValue('china')
    await flushPromises()

    expect(wrapper.find('.site-table').text()).not.toContain('North America Brand')
    expect(wrapper.find('.site-table').text()).toContain('China Regional Storefront')
    expect(listSiteCardsApi).toHaveBeenCalledWith('tenant_001')
  })

  it('opens create site in a modal instead of rendering a permanent page block', async () => {
    const { default: SiteManagement } = await import('./site-management.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    expect(wrapper.find('input[placeholder="North America Brand Site"]').exists()).toBe(false)

    await wrapper.find('[data-testid="site-open-create"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    await wrapper.find('input[placeholder="North America Brand Site"]').setValue('China Brand Site')
    await wrapper.find('input[placeholder="brand.example.com"]').setValue('cn.example.com')
    await wrapper.find('[role="dialog"] form').trigger('submit')
    await flushPromises()

    expect(createSiteApi).toHaveBeenCalledWith('tenant_001', {
      siteName: 'China Brand Site',
      siteType: 'brand',
      defaultLocale: 'zh-CN',
      primaryDomain: 'cn.example.com',
      previewBaseUrl: undefined
    })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
