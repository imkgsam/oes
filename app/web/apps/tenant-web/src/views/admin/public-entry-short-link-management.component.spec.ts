/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const changePublicEntryShortLinkStatusApi = vi.fn()
const createPublicEntryShortLinkApi = vi.fn()
const getPublicEntryShortLinkQrApi = vi.fn()
const getPublicEntryShortLinkStatsApi = vi.fn()
const listBusinessCardsApi = vi.fn()
const listManagedEmployeesApi = vi.fn()
const listPublicEntryShortLinksApi = vi.fn()
const listPublicEntryShortLinksByTargetApi = vi.fn()
const updatePublicEntryShortLinkMetadataApi = vi.fn()
const updatePublicEntryShortLinkTargetApi = vi.fn()

const authContextState = {
  sessionContext: {
    tenant: {
      tenantId: 'tenant_001'
    }
  }
}

vi.mock('#/api', () => ({
  changePublicEntryShortLinkStatusApi,
  createPublicEntryShortLinkApi,
  getPublicEntryShortLinkQrApi,
  getPublicEntryShortLinkStatsApi,
  listBusinessCardsApi,
  listManagedEmployeesApi,
  listPublicEntryShortLinksApi,
  listPublicEntryShortLinksByTargetApi,
  resolvePublicEntryShortLinkQrDownloadUrl: (tenantId: string, shortLinkId: string) =>
    `/public-entry/tenants/${tenantId}/short-links/${shortLinkId}/qr.png`,
  updatePublicEntryShortLinkMetadataApi,
  updatePublicEntryShortLinkTargetApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<main><h1>{{ title }}</h1><slot /></main>'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<i :data-icon="icon" />'
  }
}))

vi.mock('ant-design-vue', () => {
  const FormStub: { Item?: unknown; name: string; template: string } = {
    name: 'AForm',
    template: '<form><slot /></form>'
  }
  FormStub.Item = {
    name: 'AFormItem',
    props: ['label'],
    template: '<label>{{ label }}<slot /></label>'
  }

  return {
    Alert: {
      name: 'AAlert',
      props: ['message'],
      template: '<div class="ant-alert">{{ message }}</div>'
    },
    Button: {
      emits: ['click'],
      name: 'AButton',
      props: ['danger', 'disabled', 'href', 'loading', 'size', 'target', 'type'],
      template:
        '<a v-if="href" :href="href" :target="target"><slot name="icon" /><slot /></a><button v-else type="button" :disabled="disabled || loading" @click="$emit(\'click\', $event)"><slot name="icon" /><slot /></button>'
    },
    Dropdown: {
      name: 'ADropdown',
      props: ['trigger'],
      template:
        '<div class="ant-dropdown-stub"><slot /><div class="ant-dropdown-overlay-stub"><slot name="overlay" /></div></div>'
    },
    Descriptions: {
      Item: {
        name: 'ADescriptionsItem',
        props: ['label'],
        template: '<div><strong>{{ label }}</strong><slot /></div>'
      },
      name: 'ADescriptions',
      template: '<section><slot /></section>'
    },
    Drawer: {
      name: 'ADrawer',
      props: ['open', 'title', 'width'],
      template:
        '<aside v-if="open"><h2>{{ title }}</h2><slot /><footer><slot name="footer" /></footer></aside>'
    },
    Empty: {
      name: 'AEmpty',
      props: ['description'],
      template: '<div class="ant-empty">{{ description }}</div>'
    },
    Form: FormStub,
    Input: {
      emits: ['update:value'],
      name: 'AInput',
      props: ['placeholder', 'value'],
      template:
        '<input :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
    },
    Modal: {
      confirm: vi.fn(),
      name: 'AModal',
      props: ['open', 'title', 'width'],
      template:
        '<section v-if="open" class="ant-modal-stub"><h2>{{ title }}</h2><slot /><footer><slot name="footer" /></footer></section>'
    },
    Menu: {
      Item: {
        emits: ['click'],
        name: 'AMenuItem',
        props: ['danger'],
        template:
          '<button class="ant-menu-item" type="button" @click="$emit(\'click\', $event)"><slot /></button>'
      },
      name: 'AMenu',
      template: '<nav class="ant-menu"><slot /></nav>'
    },
    QRCode: {
      name: 'AQrCode',
      props: ['value'],
      template: '<div data-testid="short-link-qr">{{ value }}</div>'
    },
    Radio: Object.assign(
      {
        name: 'ARadio',
        props: ['value'],
        template: '<label><input type="radio" :value="value" /><slot /></label>'
      },
      {
        Button: {
          emits: ['click'],
          name: 'ARadioButton',
          props: ['value'],
          template:
            '<button class="ant-radio-button-stub" type="button" @click="$emit(\'click\', value)"><slot /></button>'
        },
        Group: {
          emits: ['update:value'],
          name: 'ARadioGroup',
          props: ['value'],
          template:
            '<div class="ant-radio-group-stub"><slot /><button type="button" data-testid="target-mode-external" @click="$emit(\'update:value\', \'EXTERNAL_URL\')">外部链接</button><button type="button" data-testid="target-mode-card" @click="$emit(\'update:value\', \'BUSINESS_CARD\')">数字名片</button><button type="button" data-testid="target-mode-internal" @click="$emit(\'update:value\', \'INTERNAL_PAGE\')">内部页面</button></div>'
        }
      }
    ),
    Select: {
      emits: ['update:value'],
      name: 'ASelect',
      props: ['options', 'value'],
      template:
        '<select :value="value" @change="$emit(\'update:value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>'
    },
    Skeleton: {
      name: 'ASkeleton',
      template: '<div data-testid="short-link-loading" />'
    },
    Space: {
      name: 'ASpace',
      template: '<div><slot /></div>'
    },
    Statistic: {
      name: 'AStatistic',
      props: ['title', 'value'],
      template: '<div><span>{{ title }}</span><strong>{{ value }}</strong></div>'
    },
    Table: {
      name: 'ATable',
      props: ['columns', 'dataSource', 'loading', 'pagination', 'rowKey', 'scroll', 'size'],
      template: `
        <table :data-scroll-x="scroll?.x ?? ''">
          <tbody>
            <tr v-for="record in dataSource" :key="record.id" @click="$attrs.onRow?.(record)?.onClick?.()">
              <td v-for="column in columns" :key="column.key">
                <slot name="bodyCell" :column="column" :record="record" />
              </td>
            </tr>
          </tbody>
        </table>
      `
    },
    Tag: {
      name: 'ATag',
      props: ['color'],
      template: '<span class="ant-tag"><slot /></span>'
    },
    Tooltip: {
      name: 'ATooltip',
      props: ['title'],
      template: '<span class="ant-tooltip-stub"><slot /></span>'
    },
    message: {
      error: vi.fn(),
      success: vi.fn()
    }
  }
})

const shortLinks = [
  {
    campaignRef: 'name-card',
    createdAt: '2026-06-18T00:00:00.000Z',
    displayName: 'Business card card_001',
    entryPurpose: 'BUSINESS_CARD',
    id: 'sl_001',
    publicUrl: 'https://go.oes.local/c/sctGfcF',
    shortCode: 'sctGfcF',
    sourcePlacement: 'MAIN_PROFILE',
    status: 'ACTIVE',
    targetKind: 'INTERNAL_REF',
    targetResourceId: 'card_001',
    targetType: 'BUSINESS_CARD',
    tenantId: 'tenant_001',
    updatedAt: '2026-06-18T08:00:00.000Z'
  },
  {
    campaignRef: 'supplier-open',
    createdAt: '2026-06-16T00:00:00.000Z',
    displayName: '供应商外部登记入口',
    entryPurpose: 'SUPPLIER_ONBOARDING',
    id: 'sl_003',
    publicUrl: 'https://go.oes.local/c/EXT620A',
    shortCode: 'EXT620A',
    sourcePlacement: 'EMAIL',
    status: 'ACTIVE',
    targetKind: 'EXTERNAL_URL',
    targetUrl: 'https://supplier.example.com/onboarding',
    tenantId: 'tenant_001',
    updatedAt: '2026-06-16T08:00:00.000Z'
  },
  {
    campaignRef: 'supplier',
    createdAt: '2026-06-17T00:00:00.000Z',
    displayName: 'Business card card_002',
    entryPurpose: 'SUPPLIER_PORTAL',
    id: 'sl_002',
    publicUrl: 'https://go.oes.local/c/SRM620A',
    shortCode: 'SRM620A',
    sourcePlacement: 'WECHAT_POSTER',
    status: 'DISABLED',
    targetKind: 'INTERNAL_REF',
    targetResourceId: 'card_002',
    targetType: 'BUSINESS_CARD',
    tenantId: 'tenant_001',
    updatedAt: '2026-06-17T08:00:00.000Z'
  }
] as const

const businessCards = [
  {
    businessCardId: 'card_001',
    contactActionConfigs: [],
    employeeId: 'emp_001',
    publicEntryRef: {
      publicEntryId: 'sl_001',
      publicUrl: 'https://go.oes.local/c/sctGfcF',
      qrContent: 'https://go.oes.local/c/sctGfcF',
      shortCode: 'sctGfcF',
      status: 'ACTIVE'
    },
    status: 'ACTIVE',
    templateKey: 'TENANT_STANDARD',
    tenantId: 'tenant_001',
    updatedAt: '2026-06-18T08:00:00.000Z',
    visibilityConfig: {
      showCompany: true,
      showDepartment: true,
      showOfficialPhoto: true,
      showTitle: true
    }
  },
  {
    businessCardId: 'card_002',
    contactActionConfigs: [],
    employeeId: 'emp_002',
    publicEntryRef: {
      publicEntryId: 'sl_002',
      publicUrl: 'https://go.oes.local/c/SRM620A',
      qrContent: 'https://go.oes.local/c/SRM620A',
      shortCode: 'SRM620A',
      status: 'DISABLED'
    },
    status: 'DISABLED',
    templateKey: 'TENANT_STANDARD',
    tenantId: 'tenant_001',
    updatedAt: '2026-06-17T08:00:00.000Z',
    visibilityConfig: {
      showCompany: true,
      showDepartment: true,
      showOfficialPhoto: false,
      showTitle: true
    }
  }
] as const

const employees = [
  {
    activeEmployment: {
      effectiveFrom: '2026-01-01',
      employeeId: 'emp_001',
      id: 'employment_001',
      orgUnitId: 'org_001',
      positionName: '销售经理',
      status: 'ACTIVE',
      tenantId: 'tenant_001'
    },
    employee: {
      displayName: 'Alex Chen',
      employeeCode: 'EMP-001',
      id: 'emp_001',
      lifecycleStatus: 'ACTIVE',
      tenantId: 'tenant_001',
      tenantPartyId: 'party_001'
    }
  },
  {
    activeEmployment: {
      effectiveFrom: '2026-01-01',
      employeeId: 'emp_002',
      id: 'employment_002',
      orgUnitId: 'org_001',
      positionName: '市场经理',
      status: 'ACTIVE',
      tenantId: 'tenant_001'
    },
    employee: {
      displayName: 'Mina Lin',
      employeeCode: 'EMP-002',
      id: 'emp_002',
      lifecycleStatus: 'ACTIVE',
      tenantId: 'tenant_001',
      tenantPartyId: 'party_002'
    }
  }
] as const

describe('public entry short link management page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authContextState.sessionContext.tenant = { tenantId: 'tenant_001' }
    listBusinessCardsApi.mockResolvedValue({
      items: businessCards,
      page: 1,
      pageSize: 50,
      total: businessCards.length
    })
    listManagedEmployeesApi.mockResolvedValue({
      items: employees,
      page: 1,
      pageSize: 200,
      total: employees.length
    })
    listPublicEntryShortLinksApi.mockResolvedValue({
      items: shortLinks,
      page: 1,
      pageSize: 50,
      total: shortLinks.length
    })
    listPublicEntryShortLinksByTargetApi.mockImplementation((_tenantId, query) => {
      const items = shortLinks.filter(
        (link) => 'targetResourceId' in link && link.targetResourceId === query.targetResourceId
      )
      return Promise.resolve({
        items,
        page: 1,
        pageSize: 50,
        total: items.length
      })
    })
    getPublicEntryShortLinkStatsApi.mockResolvedValue({
      byDetectedChannel: [{ count: 9, key: 'QR' }],
      byDeviceType: [{ count: 7, key: 'mobile' }],
      byReferrer: [{ count: 5, key: 'direct' }],
      byResultStatus: [{ count: 12, key: 'SUCCESS' }],
      lastVisitedAt: '2026-06-19T09:30:00.000Z',
      shortLinkId: 'sl_001',
      totalVisits: 12
    })
    getPublicEntryShortLinkQrApi.mockResolvedValue({
      content: 'https://go.oes.local/c/sctGfcF',
      format: 'PNG',
      imageBase64: 'base64-png',
      shortLinkId: 'sl_001'
    })
  })

  it('renders an operations-focused short link workspace using the existing page shell', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    expect(listPublicEntryShortLinksApi).toHaveBeenCalledWith('tenant_001', {
      page: 1,
      pageSize: 50
    })
    expect(listBusinessCardsApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 50 })
    expect(listManagedEmployeesApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 200 })
    expect(listPublicEntryShortLinksByTargetApi).not.toHaveBeenCalled()
    expect(wrapper.find('.short-link-page__metrics').exists()).toBe(true)
    expect(wrapper.text()).toContain('全部短链')
    expect(wrapper.text()).toContain('启用中')
    expect(wrapper.text()).toContain('总访问')
    expect(wrapper.find('.short-link-page__detail-panel').exists()).toBe(false)
    expect(wrapper.text()).toContain('Alex Chen · 数字名片')
    expect(wrapper.text()).toContain('供应商外部登记入口')
    expect(wrapper.find('.short-link-page__name-cell').text()).not.toContain(shortLinks[0].publicUrl)
    expect(wrapper.find('.short-link-page__scope-strip').exists()).toBe(false)
  })

  it('renders business-card names and targets by employee name instead of internal resource ids', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    const targetTexts = wrapper
      .findAll('.short-link-page__target-text')
      .map((target) => target.text())

    expect(targetTexts).toContain('Alex Chen · 数字名片')
    expect(targetTexts).toContain('Mina Lin · 数字名片')
    expect(targetTexts).not.toContain('BUSINESS_CARD:card_001')
    expect(targetTexts).not.toContain('BUSINESS_CARD:card_002')

    const displayNames = wrapper.findAll('.short-link-page__name-cell strong').map((name) => name.text())
    expect(displayNames).toContain('Alex Chen · 数字名片')
    expect(displayNames).toContain('Mina Lin · 数字名片')
    expect(displayNames).not.toContain('Business card card_001')
    expect(displayNames).not.toContain('Business card card_002')
  })

  it('keeps a composed workbench shell when the current scope has no links', async () => {
    listPublicEntryShortLinksApi.mockResolvedValueOnce({
      items: [],
      page: 1,
      pageSize: 50,
      total: 0
    })
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    expect(wrapper.find('.short-link-page__workspace-head').exists()).toBe(true)
    expect(wrapper.text()).toContain('公开短链工作台')
    expect(wrapper.find('.short-link-page__scope-strip').exists()).toBe(false)
    expect(wrapper.find('.short-link-page__list-head').text()).toContain('短链列表')
    expect(wrapper.find('.short-link-page__list-head').text()).toContain('当前范围 · 0 条')
    expect(wrapper.find('.short-link-page__detail-panel').exists()).toBe(false)
  })

  it('opens short link details in a drawer after selecting a row', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    expect(wrapper.find('.short-link-page__detail-panel').exists()).toBe(false)

    await wrapper.find('tbody tr').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('短链详情')
    expect(wrapper.find('.short-link-page__detail-panel').exists()).toBe(true)
    expect(wrapper.text()).toContain('复制短链')
    expect(wrapper.text()).toContain(shortLinks[0].publicUrl)
    expect(
      wrapper.find('a[href="/public-entry/tenants/tenant_001/short-links/sl_001/qr.png"]').exists()
    ).toBe(true)
  })

  it('allows editing the short link display name from the detail metadata editor', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    await wrapper.find('tbody tr').trigger('click')
    await flushPromises()

    const metadataEditor = wrapper.find('.short-link-page__metadata-editor')
    expect(metadataEditor.text()).toContain('名称')

    await metadataEditor.find('input').setValue('员工主名片')
    await metadataEditor.find('button').trigger('click')
    await flushPromises()

    expect(updatePublicEntryShortLinkMetadataApi).toHaveBeenCalledWith(
      'tenant_001',
      'sl_001',
      expect.objectContaining({
        displayName: '员工主名片'
      })
    )
  })

  it('opens the create short link form in a modal instead of a drawer', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    const createButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('创建短链'))
    expect(createButton).toBeTruthy()
    await createButton!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.ant-modal-stub').exists()).toBe(true)
    expect(wrapper.find('.ant-modal-stub').text()).toContain('创建短链')
    expect(wrapper.find('aside h2').exists()).toBe(false)
  })

  it('renders target-type-specific create inputs without exposing internal metadata fields', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    const createButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('创建短链'))
    await createButton!.trigger('click')
    await flushPromises()

    const modal = wrapper.find('.ant-modal-stub')
    expect(modal.text()).toContain('1. 选择目标类型')
    expect(modal.text()).toContain('外部链接')
    expect(modal.text()).toContain('数字名片')
    expect(modal.text()).toContain('内部页面')
    expect(modal.text()).not.toContain('填写一个 HTTPS URL')
    expect(modal.text()).not.toContain('选择已有名片资源')
    expect(modal.text()).not.toContain('选择系统内部资源')
    expect(modal.text()).toContain('2. 填写外部链接配置')
    expect(modal.text()).toContain('短链名称')
    expect(modal.text()).toContain('目标 URL')
    expect(modal.text()).toContain('高级选项')
    expect(modal.text()).not.toContain('入口用途')
    expect(modal.text()).not.toContain('Target Kind')
    expect(modal.text()).not.toContain('campaignRef')
    expect(modal.text()).not.toContain('expiresAt')

    await wrapper.find('[data-testid="target-mode-card"]').trigger('click')
    await flushPromises()

    expect(listBusinessCardsApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 50 })
    expect(listManagedEmployeesApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 200 })
    expect(wrapper.find('.ant-modal-stub').text()).toContain('2. 选择数字名片')
    expect(wrapper.find('.ant-modal-stub').text()).toContain('名片资源')
    expect(wrapper.find('.ant-modal-stub').text()).toContain('Alex Chen')
    expect(wrapper.find('.ant-modal-stub').text()).not.toContain('emp_001')
    expect(wrapper.find('.ant-modal-stub').text()).not.toContain('目标 URL')
    expect(
      (
        wrapper
          .find('.ant-modal-stub input[placeholder="例如：供应商外部登记入口"]')
          .element as HTMLInputElement
      ).value
    ).toBe('Alex Chen · 数字名片')
  })

  it('uses an enum selector for target type instead of a free-form input', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    const targetTypeControl = wrapper.find('[data-testid="short-link-target-type-filter"]')
    expect(targetTypeControl.exists()).toBe(true)
    expect(targetTypeControl.element.tagName).toBe('SELECT')
    expect(targetTypeControl.text()).toContain('全部类型')
    expect(targetTypeControl.text()).toContain('外部链接')
    expect(targetTypeControl.text()).toContain('名片')
  })

  it('does not require a target resource selector for the default all-link scope', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    expect(wrapper.find('[data-testid="short-link-target-resource-filter"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('全部名片')
  })

  it('collapses row actions into a dropdown menu trigger', async () => {
    const originalLocation = window.location
    const assignSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignSpy }
    })
    try {
      const view = await import('./public-entry-short-link-management.vue')
      const wrapper = mount(view.default)
      await flushPromises()

      expect(wrapper.find('.short-link-page__row-actions').exists()).toBe(true)
      expect(wrapper.find('.ant-dropdown-stub .short-link-page__row-actions').text()).toBe('')
      expect(wrapper.find('.ant-dropdown-overlay-stub').text()).toContain('跳转')
      expect(wrapper.find('.ant-dropdown-overlay-stub').text()).not.toContain('复制短链')
      expect(wrapper.find('.ant-dropdown-overlay-stub').text()).toContain('更新目标')
      expect(wrapper.find('.ant-dropdown-overlay-stub').text()).toContain('归档')

      const jumpItems = wrapper.findAll('.ant-menu-item').filter((item) => item.text() === '跳转')
      expect(jumpItems.length).toBeGreaterThanOrEqual(2)

      await jumpItems[1]!.trigger('click')
      await flushPromises()

      expect(wrapper.find('.short-link-jump-modal').exists()).toBe(false)
      expect(assignSpy).toHaveBeenCalledWith(shortLinks[1].publicUrl)
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation
      })
    }
  })

  it('does not render unknown short link statuses as archived', async () => {
    listPublicEntryShortLinksApi.mockResolvedValue({
      items: shortLinks.map((link) => ({ ...link, status: 1 })),
      page: 1,
      pageSize: 50,
      total: shortLinks.length
    })
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    expect(wrapper.findAll('.ant-tag').some((tag) => tag.text() === '归档')).toBe(false)
    expect(wrapper.findAll('.ant-tag').some((tag) => tag.text() === '未知')).toBe(true)
  })

  it('filters the fetched short link table by keyword and lifecycle status without changing the BFF query', async () => {
    const view = await import('./public-entry-short-link-management.vue')
    const wrapper = mount(view.default)
    await flushPromises()

    await wrapper.find('input[placeholder="搜索短码、名称、目标"]').setValue('Mina')
    await wrapper.find('select[data-testid="short-link-status-filter"]').setValue('DISABLED')
    await flushPromises()

    expect(wrapper.text()).toContain('Mina Lin · 数字名片')
    expect(wrapper.text()).not.toContain('Alex Chen · 数字名片')
    expect(listPublicEntryShortLinksApi).toHaveBeenCalledTimes(1)
    expect(listPublicEntryShortLinksByTargetApi).not.toHaveBeenCalled()
  })
})
