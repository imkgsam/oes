/* @vitest-environment happy-dom */

import { resolve } from 'node:path'

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const bindBusinessCardPublicEntryApi = vi.fn()
const disableBusinessCardApi = vi.fn()
const enableBusinessCardApi = vi.fn()
const ensurePrimaryBusinessCardApi = vi.fn()
const getBusinessCardDetailApi = vi.fn()
const getBusinessCardVisitSummaryApi = vi.fn()
const getManagedTenantByIdApi = vi.fn()
const listBusinessCardContactAssetCandidatesApi = vi.fn()
const listBusinessCardsApi = vi.fn()
const listManagedEmployeesApi = vi.fn()
const renderPublicBusinessCardApi = vi.fn()
const updateBusinessCardContactActionsApi = vi.fn()

const authContextState = {
  sessionContext: {
    tenant: {
      tenantId: 'tenant_001'
    }
  }
}

vi.mock('#/api', () => ({
  bindBusinessCardPublicEntryApi,
  disableBusinessCardApi,
  enableBusinessCardApi,
  ensurePrimaryBusinessCardApi,
  getBusinessCardDetailApi,
  getBusinessCardVisitSummaryApi,
  getManagedTenantByIdApi,
  listBusinessCardContactAssetCandidatesApi,
  listBusinessCardsApi,
  listManagedEmployeesApi,
  renderPublicBusinessCardApi,
  updateBusinessCardContactActionsApi
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

const FormStub: {
  Item?: unknown
  name: string
  template: string
} = {
  name: 'AForm',
  template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>'
}
FormStub.Item = {
  name: 'AFormItem',
  props: ['label'],
  template: '<label>{{ label }}<slot /></label>'
}

const DescriptionsStub: {
  Item?: unknown
  name: string
  template: string
} = {
  name: 'ADescriptions',
  template: '<dl><slot /></dl>'
}
DescriptionsStub.Item = {
  name: 'ADescriptionsItem',
  props: ['label'],
  template: '<div><dt>{{ label }}</dt><dd><slot /></dd></div>'
}

const MenuStub: {
  Item?: unknown
  emits: string[]
  name: string
  template: string
} = {
  emits: ['click'],
  name: 'AMenu',
  template: '<div><slot /></div>'
}
MenuStub.Item = {
  emits: ['click'],
  name: 'AMenuItem',
  props: ['danger', 'disabled', 'key'],
  template: '<button type="button" @click="$emit(\'click\', { key })"><slot /></button>'
}

const StepsStub: {
  name: string
  props: string[]
  template: string
} = {
  name: 'ASteps',
  props: ['current', 'items', 'size'],
  template: `
    <ol data-testid="business-card-create-steps">
      <li v-for="(item, index) in items" :key="item.title" :data-current="index === current">{{ item.title }}</li>
    </ol>
  `
}

vi.mock('ant-design-vue', () => ({
  Alert: {
    name: 'AAlert',
    props: ['message'],
    template: '<div>{{ message }}</div>'
  },
  Button: {
    name: 'AButton',
    props: ['ariaLabel', 'block', 'danger', 'href', 'loading', 'shape', 'size', 'target', 'type'],
    emits: ['click'],
    template: '<a v-if="href" :href="href" :target="target"><slot name="icon" /><slot /></a><button v-else :aria-label="ariaLabel" :data-shape="shape" :data-ui-type="type" type="button" @click="$emit(\'click\')"><slot name="icon" /><slot /></button>'
  },
  Card: {
    name: 'ACard',
    props: ['bordered', 'size'],
    template: '<section><slot /></section>'
  },
  Descriptions: DescriptionsStub,
  Divider: {
    name: 'ADivider',
    template: '<hr />'
  },
  Drawer: {
    name: 'ADrawer',
    props: ['open', 'title', 'width'],
    template: '<section v-if="open"><h3>{{ title }}</h3><slot /><footer><slot name="footer" /></footer></section>'
  },
  Dropdown: {
    name: 'ADropdown',
    template: '<div data-testid="business-card-row-actions"><slot /><slot name="overlay" /></div>'
  },
  Empty: {
    name: 'AEmpty',
    props: ['description'],
    template: '<div>{{ description }}</div>'
  },
  Form: FormStub,
  Input: {
    name: 'AInput',
    props: ['disabled', 'placeholder', 'type', 'value'],
    emits: ['update:value'],
    template: '<input :disabled="disabled" :placeholder="placeholder" :type="type || \'text\'" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  },
  Menu: MenuStub,
  Modal: {
    name: 'AModal',
    props: ['open', 'title', 'width'],
    emits: ['ok', 'cancel', 'update:open'],
    template: '<section v-if="open" :data-width="width"><h3>{{ title }}</h3><button data-testid="modal-open-update-close" type="button" @click="$emit(\'update:open\', false)">关闭弹窗</button><slot /><footer><slot name="footer" /><button type="button" @click="$emit(\'ok\')">确定</button></footer></section>'
  },
  QRCode: {
    name: 'AQrCode',
    props: ['size', 'value'],
    template: '<span class="ant-qrcode" data-testid="admin-card-qr"><canvas /></span>'
  },
  Select: {
    name: 'ASelect',
    props: ['disabled', 'loading', 'options', 'placeholder', 'value'],
    emits: ['update:value'],
    template: `
      <select
        v-bind="$attrs"
        :disabled="disabled"
        :data-placeholder="placeholder"
        :value="value ?? ''"
        @change="$emit('update:value', $event.target.value)"
      >
        <option value=""></option>
        <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    `
  },
  Skeleton: {
    name: 'ASkeleton',
    template: '<div data-testid="admin-card-loading" />'
  },
  Space: {
    name: 'ASpace',
    template: '<div><slot /></div>'
  },
  Steps: StepsStub,
  Statistic: {
    name: 'AStatistic',
    props: ['title', 'value'],
    template: '<div>{{ title }}: {{ value }}</div>'
  },
  Table: {
    name: 'ATable',
    props: ['columns', 'dataSource', 'loading', 'pagination', 'rowKey', 'scroll'],
    template: `
      <table :data-scroll-x="scroll?.x ?? ''">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">
              <component v-if="typeof column.title === 'object'" :is="column.title" />
              <template v-else>{{ column.title }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in dataSource" :key="record[rowKey]">
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
    template: '<span><slot /></span>'
  },
  Switch: {
    name: 'ASwitch',
    props: ['checked', 'size'],
    emits: ['update:checked'],
    template: '<button type="button" @click="$emit(\'update:checked\', !checked)">switch</button>'
  },
  Popconfirm: {
    name: 'APopconfirm',
    props: ['cancelText', 'okText', 'title'],
    template: '<span :data-title="title"><slot /></span>'
  },
  Tooltip: {
    name: 'ATooltip',
    props: ['title'],
    template: '<span><slot /></span>'
  },
  message: {
    success: vi.fn()
  }
}))

const cardRecord = {
  businessCardId: 'card_001',
  contactActionConfigs: [
    {
      contactActionType: 'SEND_EMAIL',
      displayOrder: 10,
      enabled: true,
      includeInVCard: true,
      targetRefId: 'asset_email_001',
      targetRefType: 'CONTACT_ASSET',
      visibility: 'PUBLIC'
    },
    {
      contactActionType: 'SAVE_VCARD',
      displayOrder: 20,
      enabled: true,
      includeInVCard: false,
      targetRefId: null,
      targetRefType: 'NONE',
      visibility: 'PUBLIC'
    }
  ],
  employeeId: 'emp_001',
  publicEntryRef: {
    publicEntryId: 'pe_001',
    publicUrl: 'https://go.oes.local/c/ABC1234',
    qrContent: 'https://go.oes.local/c/ABC1234',
    shortCode: 'ABC1234',
    status: 'ACTIVE'
  },
  status: 'DISABLED',
  templateKey: 'TENANT_STANDARD',
  tenantId: 'tenant_001',
  updatedAt: '2026-06-08T00:00:00.000Z',
  visibilityConfig: {
    showCompany: true,
    showDepartment: true,
    showOfficialPhoto: true,
    showTitle: true
  }
} as const

const draftCardRecord = {
  ...cardRecord,
  businessCardId: 'card_draft_001',
  contactActionConfigs: [],
  publicEntryRef: null,
  status: 'DRAFT',
  updatedAt: '2026-06-16T00:00:00.000Z'
} as const

const disabledEntryCardRecord = {
  ...cardRecord,
  publicEntryRef: {
    ...cardRecord.publicEntryRef,
    status: 'DISABLED'
  },
  status: 'ACTIVE'
} as const

const contactAssetCandidates = [
  {
    accountId: 'account_001',
    contactAssetId: 'asset_email_001',
    displayName: '工作邮箱',
    displayValue: 'alex.chen@example.com',
    ownership: 'COMPANY_CONTROLLED',
    provider: 'enterprise-mail',
    status: 'ACTIVE',
    type: 'WORK_EMAIL'
  },
  {
    accountId: 'account_001',
    contactAssetId: 'asset_email_002',
    displayName: '市场邮箱',
    displayValue: 'market.chen@example.com',
    ownership: 'COMPANY_CONTROLLED',
    provider: 'enterprise-mail',
    status: 'ACTIVE',
    type: 'WORK_EMAIL'
  },
  {
    accountId: 'account_001',
    contactAssetId: 'asset_phone_001',
    displayName: '工作电话',
    displayValue: '+86 138 0000 0000',
    ownership: 'COMPANY_CONTROLLED',
    provider: 'mobile',
    status: 'ACTIVE',
    type: 'WORK_PHONE'
  },
  {
    accountId: 'account_001',
    contactAssetId: 'asset_wechat_001',
    displayName: '企业微信',
    displayValue: 'wechat_alex',
    ownership: 'COMPANY_CONTROLLED',
    provider: 'wechat',
    status: 'ACTIVE',
    type: 'WECHAT'
  }
]

describe('admin BusinessCard management page', () => {
  beforeEach(() => {
    bindBusinessCardPublicEntryApi.mockReset()
    disableBusinessCardApi.mockReset()
    enableBusinessCardApi.mockReset()
    ensurePrimaryBusinessCardApi.mockReset()
    getBusinessCardDetailApi.mockReset()
    getBusinessCardVisitSummaryApi.mockReset()
    getManagedTenantByIdApi.mockReset()
    listBusinessCardContactAssetCandidatesApi.mockReset()
    listBusinessCardsApi.mockReset()
    listManagedEmployeesApi.mockReset()
    renderPublicBusinessCardApi.mockReset()
    updateBusinessCardContactActionsApi.mockReset()
    authContextState.sessionContext.tenant = { tenantId: 'tenant_001' }

    listBusinessCardsApi.mockResolvedValue({ items: [cardRecord], page: 1, pageSize: 50, total: 1 })
    listManagedEmployeesApi.mockResolvedValue({
      items: [
        {
          activeEmployment: {
            orgUnit: { name: '销售中心' },
            orgUnitId: 'org_sales'
          },
          employee: {
            displayName: 'Alex Chen',
            employeeCode: 'EMP-001',
            id: 'emp_001',
            lifecycleStatus: 'ACTIVE',
            tenantId: 'tenant_001',
            tenantPartyId: 'party_001'
          }
        }
      ],
      page: 1,
      pageSize: 200,
      total: 1
    })
    getBusinessCardDetailApi.mockResolvedValue({
      businessCard: cardRecord,
      readiness: { ready: true, reasons: [] }
    })
    getBusinessCardVisitSummaryApi.mockResolvedValue({
      byDetectedChannel: [],
      byDeviceType: [],
      byReferrer: [],
      byResultStatus: [],
      lastVisitedAt: '2026-06-20T13:14:15',
      shortLinkId: 'sl_001',
      totalVisits: 12
    })
    getManagedTenantByIdApi.mockResolvedValue({
      tenant: {
        code: 'tenant',
        employeeCodePrefix: 'EMP',
        id: 'tenant_001',
        name: 'OES Manufacturing',
        status: 'ACTIVE',
        websiteUrl: 'https://www.oes.example/'
      }
    })
    bindBusinessCardPublicEntryApi.mockResolvedValue({ publicEntryRef: cardRecord.publicEntryRef })
    disableBusinessCardApi.mockResolvedValue({})
    enableBusinessCardApi.mockResolvedValue({})
    listBusinessCardContactAssetCandidatesApi.mockResolvedValue({ assets: contactAssetCandidates })
    renderPublicBusinessCardApi.mockResolvedValue({ state: 'PUBLIC_CARD_UNAVAILABLE' })
    updateBusinessCardContactActionsApi.mockResolvedValue({ businessCard: cardRecord })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('modifies a card through the edit modal without submitting contact values', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '修改名片')?.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('修改名片')
    expect(listBusinessCardContactAssetCandidatesApi).toHaveBeenCalledWith('tenant_001', 'emp_001')
    expect(wrapper.find('input[placeholder="Contact Asset ID"]').exists()).toBe(false)

    const contactAssetSelectors = wrapper.findAll('select[data-placeholder="选择公开联系方式"]')
    await contactAssetSelectors[0]?.setValue('asset_email_002')
    await wrapper.findAll('button').find((button) => button.text() === '保存修改')?.trigger('click')
    await flushPromises()

    expect(updateBusinessCardContactActionsApi).toHaveBeenCalledWith('tenant_001', 'card_001', {
      contactActionConfigs: [
        {
          contactActionType: 'SEND_EMAIL',
          displayOrder: 10,
          enabled: true,
          includeInVCard: true,
          targetRefId: 'asset_email_002',
          targetRefType: 'CONTACT_ASSET',
          visibility: 'PUBLIC'
        },
        {
          contactActionType: 'SAVE_VCARD',
          displayOrder: 20,
          enabled: true,
          includeInVCard: false,
          targetRefId: null,
          targetRefType: 'NONE',
          visibility: 'PUBLIC'
        }
      ],
      visibilityConfig: cardRecord.visibilityConfig
    })
    const submittedPayload = JSON.stringify(updateBusinessCardContactActionsApi.mock.calls)
    expect(submittedPayload).not.toContain('alex.chen@example.com')
    expect(submittedPayload).not.toContain('market.chen@example.com')
    expect(submittedPayload).not.toContain('+8613800000000')
    expect(submittedPayload).not.toContain('wechat')
    expect(submittedPayload).not.toContain('whatsapp')
  })

  it('keeps the edit modal compact and lets admins add supported contact methods', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '修改名片')?.trigger('click')
    await flushPromises()

    expect(wrapper.find('.business-card-workspace__action-editor').exists()).toBe(true)
    expect(wrapper.find('.business-card-workspace__display-summary').exists()).toBe(true)
    expect(wrapper.find('.business-card-workspace__display-grid').exists()).toBe(true)
    expect(wrapper.find('.business-card-workspace__action-row').classes()).toContain(
      'business-card-workspace__action-row--compact'
    )
    expect(wrapper.text()).toContain('邮箱')
    expect(wrapper.text()).toContain('保存通讯录')
    expect(wrapper.text()).not.toContain('contact-00000000-0000-4000-8000-000000000903')
    expect(wrapper.find('select[data-testid="business-card-action-type-picker"]').exists()).toBe(false)
    expect(wrapper.findAll('button').some((button) => button.text() === '添加动作')).toBe(false)
    expect(wrapper.find('.business-card-workspace__order-input').exists()).toBe(false)

    await wrapper.findAll('button').find((button) =>
      button.text().includes('电话') && button.text().includes('员工公开工作电话')
    )?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('电话')
    await wrapper.findAll('button').find((button) => button.text() === '保存修改')?.trigger('click')
    await flushPromises()

    expect(updateBusinessCardContactActionsApi).toHaveBeenLastCalledWith('tenant_001', 'card_001', {
      contactActionConfigs: [
        expect.objectContaining({ contactActionType: 'SEND_EMAIL', targetRefId: 'asset_email_001' }),
        expect.objectContaining({ contactActionType: 'SAVE_VCARD', targetRefType: 'NONE' }),
        expect.objectContaining({
          contactActionType: 'CALL_PHONE',
          targetRefId: 'asset_phone_001',
          targetRefType: 'CONTACT_ASSET'
        })
      ],
      visibilityConfig: cardRecord.visibilityConfig
    })
  })

  it('shows a bound contact method as read-only when there is no alternative to choose', async () => {
    listBusinessCardContactAssetCandidatesApi.mockResolvedValue({
      assets: [contactAssetCandidates[0]]
    })
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '修改名片')?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('alex.chen@example.com')
    expect(wrapper.findAll('select[data-placeholder="选择公开联系方式"]')).toHaveLength(0)
  })

  it('does not render a configurable value field for system display actions', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '修改名片')?.trigger('click')
    await flushPromises()

    const systemRow = wrapper.findAll('.business-card-workspace__display-item').find((row) =>
      row.text().includes('保存通讯录')
    )
    expect(systemRow?.exists()).toBe(true)
    expect(systemRow?.find('.business-card-workspace__static-target').exists()).toBe(false)
    expect(systemRow?.text()).not.toContain('下载标准 vCard')
  })

  it('presents contact actions as public display items instead of technical action rows', async () => {
    getBusinessCardDetailApi.mockResolvedValue({
      businessCard: {
        ...cardRecord,
        contactActionConfigs: [
          ...cardRecord.contactActionConfigs,
          {
            contactActionType: 'OPEN_COMPANY_WEBSITE',
            displayOrder: 30,
            enabled: true,
            includeInVCard: false,
            targetRefId: null,
            targetRefType: 'TENANT_PUBLIC_PROFILE',
            visibility: 'PUBLIC'
          }
        ]
      },
      readiness: { ready: true, reasons: [] }
    })
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '修改名片')?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('修改名片展示')
    expect(wrapper.text()).toContain('当前展示项')
    expect(wrapper.text()).toContain('添加展示项')
    expect(wrapper.text()).toContain('公开名片预览')
    expect(wrapper.text()).toContain('邮箱')
    expect(wrapper.text()).toContain('alex.chen@example.com')
    expect(wrapper.text()).toContain('来源：员工工作邮箱')
    expect(wrapper.text()).toContain('保存通讯录')
    expect(wrapper.text()).toContain('下载标准 vCard')
    expect(wrapper.text()).toContain('来源：系统自动生成')
    expect(wrapper.text()).toContain('公司官网')
    expect(wrapper.text()).toContain('来源：租户公开资料')
    expect(wrapper.text()).toContain('公司与品牌链接')
    expect(wrapper.text()).toContain('品牌官网')
    expect(wrapper.text()).toContain('未配置品牌官网')
    expect(wrapper.text()).toContain('需配置')
    expect(wrapper.text()).toContain('去配置')
    expect(wrapper.text()).not.toContain('Contact Asset')
    expect(wrapper.text()).not.toContain('当前资产')
    expect(wrapper.text()).not.toContain('asset_email_001')
  })

  it('does not call system tenant management APIs when opening the display editor', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '修改名片')?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('修改名片展示')
    expect(getManagedTenantByIdApi).not.toHaveBeenCalled()
  })

  it('renders visitor-facing values in the public display preview instead of configuration labels', async () => {
    renderPublicBusinessCardApi.mockResolvedValue({
      state: 'AVAILABLE',
      view: {
        businessCardId: 'card_001',
        company: {
          companyDisplayName: 'OES Manufacturing',
          websiteUrl: 'https://www.melongceramics.com/about/'
        },
        contactActions: [
          {
            contactActionType: 'OPEN_COMPANY_WEBSITE',
            displayOrder: 30,
            displayValue: 'www.melongceramics.com/about'
          }
        ],
        person: { displayName: '林晓雯' },
        templateKey: 'TENANT_STANDARD'
      }
    })
    getBusinessCardDetailApi.mockResolvedValue({
      businessCard: {
        ...cardRecord,
        contactActionConfigs: [
          ...cardRecord.contactActionConfigs,
          {
            contactActionType: 'OPEN_COMPANY_WEBSITE',
            displayOrder: 30,
            enabled: true,
            includeInVCard: false,
            targetRefId: null,
            targetRefType: 'TENANT_PUBLIC_PROFILE',
            visibility: 'PUBLIC'
          }
        ]
      },
      readiness: { ready: true, reasons: [] }
    })
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '修改名片')?.trigger('click')
    await flushPromises()

    const preview = wrapper.find('.business-card-workspace__display-preview')
    expect(preview.text()).toContain('alex.chen@example.com')
    expect(preview.text()).toContain('www.melongceramics.com/about')
    expect(preview.text()).not.toContain('已绑定工作邮箱')
    expect(preview.text()).not.toContain('租户公开公司主页')
    expect(getManagedTenantByIdApi).not.toHaveBeenCalled()
    expect(renderPublicBusinessCardApi).toHaveBeenCalledWith('card_001')
  })

  it('uses the public renderer values for preview when management lookup values are unavailable', async () => {
    listBusinessCardContactAssetCandidatesApi.mockResolvedValue({ assets: [] })
    renderPublicBusinessCardApi.mockResolvedValue({
      state: 'AVAILABLE',
      view: {
        businessCardId: 'card_001',
        company: {
          companyDisplayName: 'OES Manufacturing',
          websiteUrl: 'https://www.public.example/about/'
        },
        contactActions: [
          {
            contactActionType: 'SEND_EMAIL',
            displayOrder: 10,
            displayValue: 'lin.xiaowen@melongceramics.com'
          },
          {
            contactActionType: 'OPEN_COMPANY_WEBSITE',
            displayOrder: 30,
            displayValue: 'www.public.example/about'
          }
        ],
        person: { displayName: '林晓雯' },
        templateKey: 'TENANT_STANDARD'
      }
    })
    getBusinessCardDetailApi.mockResolvedValue({
      businessCard: {
        ...cardRecord,
        contactActionConfigs: [
          ...cardRecord.contactActionConfigs,
          {
            contactActionType: 'OPEN_COMPANY_WEBSITE',
            displayOrder: 30,
            enabled: true,
            includeInVCard: false,
            targetRefId: null,
            targetRefType: 'TENANT_PUBLIC_PROFILE',
            visibility: 'PUBLIC'
          }
        ]
      },
      readiness: { ready: true, reasons: [] }
    })
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '修改名片')?.trigger('click')
    await flushPromises()

    const preview = wrapper.find('.business-card-workspace__display-preview')
    expect(preview.text()).toContain('lin.xiaowen@melongceramics.com')
    expect(preview.text()).toContain('www.public.example/about')
    expect(getManagedTenantByIdApi).not.toHaveBeenCalled()
    expect(renderPublicBusinessCardApi).toHaveBeenCalledWith('card_001')
  })

  it('wraps the management table in a horizontal scroll area for narrow screens', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    const tableScroll = wrapper.find('.business-card-workspace__table-scroll')
    expect(tableScroll.exists()).toBe(true)
    expect(tableScroll.find('table').attributes('data-scroll-x')).toBe('830')
  })

  it('keeps card details focused and separates the visit report', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看详情')?.trigger('click')
    await flushPromises()

    const detailPanel = wrapper.find('.business-card-workspace__detail-panel')
    expect(detailPanel.exists()).toBe(true)
    expect(detailPanel.find('.business-card-workspace__detail-identity-card').exists()).toBe(true)
    expect(detailPanel.find('.business-card-workspace__detail-avatar').exists()).toBe(true)
    expect(detailPanel.find('.business-card-workspace__detail-url-shell').exists()).toBe(true)
    expect(detailPanel.find('.business-card-workspace__detail-copy-button').exists()).toBe(true)
    expect(detailPanel.find('.business-card-workspace__detail-primary').exists()).toBe(true)
    expect(detailPanel.find('[data-testid="admin-card-qr"]').exists()).toBe(true)
    expect(detailPanel.find('.business-card-workspace__detail-access-report').exists()).toBe(true)
    expect(detailPanel.findAll('.business-card-workspace__detail-metric')).toHaveLength(3)
    expect(detailPanel.find('.business-card-workspace__detail-actions').exists()).toBe(false)
    expect(detailPanel.text()).toContain('公开入口')
    expect(detailPanel.text()).toContain('访问报告')
    expect(detailPanel.text()).toContain('短码')
    expect(detailPanel.text()).toContain('最近访问')
    expect(detailPanel.text()).toContain('2026-06-20 13:14:15')
    expect(detailPanel.text()).toContain('结果状态')
    expect(detailPanel.text()).not.toContain('名片类型')
    expect(detailPanel.text()).not.toContain('模板')
    expect(detailPanel.text()).not.toContain('最近更新')
    expect(detailPanel.text()).not.toContain('来源')
    expect(detailPanel.text()).not.toContain('短链服务')
    const detailButtonTexts = detailPanel.findAll('button').map((button) => button.text())
    expect(detailButtonTexts).not.toContain('修改名片')
    expect(detailButtonTexts).not.toContain('启用')
    expect(detailButtonTexts).not.toContain('禁用')
    expect(wrapper.text()).not.toContain('预览')
  })

  it('uses tenant-scoped management APIs for detail preview and state transition actions', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(listBusinessCardsApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 50 })
    expect(listManagedEmployeesApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 200 })
    expect(wrapper.text()).not.toContain('总访问: 12')
    expect(wrapper.text()).not.toContain('已绑定入口')
    expect(wrapper.text()).toContain('Alex Chen')
    expect(wrapper.text()).toContain('EMP-001')
    expect(wrapper.text()).toContain('已禁用')
    expect(wrapper.text()).not.toContain('健康检查')
    expect(wrapper.find('.business-card-workspace__entry-cell')?.text()).not.toContain('草稿')
    expect(wrapper.find('.business-card-workspace__entry-cell')?.text()).toContain('待启用')
    expect(wrapper.text()).not.toContain('预览')
    expect(wrapper.findAll('button').some((button) => button.text() === '启用')).toBe(true)
    expect(wrapper.findAll('button').some((button) => button.text() === '禁用')).toBe(false)
    expect(wrapper.text()).not.toContain('刷新公开链接')

    await wrapper.findAll('button').find((button) => button.text() === '查看详情')?.trigger('click')
    await flushPromises()
    expect(getBusinessCardDetailApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(getBusinessCardVisitSummaryApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(wrapper.text()).toContain('名片详情')
    expect(wrapper.text()).toContain('访问报告')
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('https://go.oes.local/c/ABC1234')

    await wrapper.findAll('button').find((button) => button.text() === '启用')?.trigger('click')
    await flushPromises()

    expect(bindBusinessCardPublicEntryApi).not.toHaveBeenCalled()
    expect(enableBusinessCardApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(disableBusinessCardApi).not.toHaveBeenCalled()
  })

  it('does not mark an active card as accessible when its ShortLink entry is disabled', async () => {
    listBusinessCardsApi.mockResolvedValue({ items: [disabledEntryCardRecord], page: 1, pageSize: 50, total: 1 })
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    const entryCellText = wrapper.find('.business-card-workspace__entry-cell').text()
    expect(entryCellText).toContain('入口已禁用')
    expect(entryCellText).not.toContain('可访问')
    expect(wrapper.text()).not.toContain('预览')
  })

  it('uses the shared icon-only action trigger style for card rows', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    const actionTrigger = wrapper.get('button[aria-label="名片操作"]')
    expect(actionTrigger.attributes('data-shape')).toBe('circle')
    expect(actionTrigger.attributes('data-ui-type')).toBe('text')
    expect(actionTrigger.text()).not.toContain('操作')
  })

  it('opens draft card detail without requesting visit stats for a missing public entry', async () => {
    listBusinessCardsApi.mockResolvedValue({ items: [draftCardRecord], page: 1, pageSize: 50, total: 1 })
    getBusinessCardDetailApi.mockResolvedValue({
      businessCard: draftCardRecord,
      readiness: { ready: false, reasons: ['PUBLIC_ENTRY_MISSING'] }
    })
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.text()).toContain('草稿')
    expect(wrapper.text()).toContain('未生成')
    await wrapper.findAll('button').find((button) => button.text() === '查看详情')?.trigger('click')
    await flushPromises()

    expect(getBusinessCardDetailApi).toHaveBeenCalledWith('tenant_001', 'card_draft_001')
    expect(getBusinessCardVisitSummaryApi).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('名片详情')
    expect(wrapper.text()).toContain('未绑定')
    expect(wrapper.text()).toContain('未绑定公开链接')
    expect(wrapper.text()).toContain('访问报告')
    expect(wrapper.text()).toContain('0')
  })

  it('binds a public entry before offering enable for draft cards without a public link', async () => {
    listBusinessCardsApi.mockResolvedValue({ items: [draftCardRecord], page: 1, pageSize: 50, total: 1 })
    bindBusinessCardPublicEntryApi.mockResolvedValue({ publicEntryRef: cardRecord.publicEntryRef })
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    const rowActions = wrapper.find('[data-testid="business-card-row-actions"]')
    expect(rowActions.text()).toContain('生成公开入口')
    expect(rowActions.findAll('button').some((button) => button.text() === '启用')).toBe(false)

    await rowActions.findAll('button').find((button) => button.text() === '生成公开入口')?.trigger('click')
    await flushPromises()

    expect(bindBusinessCardPublicEntryApi).toHaveBeenCalledWith('tenant_001', 'card_draft_001')
    expect(enableBusinessCardApi).not.toHaveBeenCalled()
  })

  it('shows draft detail fallback and releases loading when the modal open state closes during a pending request', async () => {
    listBusinessCardsApi.mockResolvedValue({ items: [draftCardRecord], page: 1, pageSize: 50, total: 1 })
    getBusinessCardDetailApi.mockReturnValue(new Promise(() => {}))
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看详情')?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('名片详情')
    expect(wrapper.find('[data-testid="admin-card-loading"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('草稿')
    expect(wrapper.text()).toContain('未绑定公开链接')

    await wrapper.find('[data-testid="modal-open-update-close"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('名片详情')
  })

  it('creates a card through a stepped flow that configures display items before publishing', async () => {
    ensurePrimaryBusinessCardApi.mockResolvedValue({ businessCard: cardRecord })
    updateBusinessCardContactActionsApi.mockResolvedValue({ businessCard: cardRecord })
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(wrapper.text()).not.toContain('输入员工 ID 创建主名片')
    expect(wrapper.find('input[placeholder="输入员工 ID 创建主名片"]').exists()).toBe(false)
    expect(wrapper.find('select[data-placeholder="选择员工"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="business-card-row-actions"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="调整员工列宽"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Public Entry Governance')
    expect(wrapper.text()).not.toContain('集中检查全租户员工名片')

    await wrapper.findAll('button').find((button) => button.text() === '新增名片')?.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('新增员工名片')
    expect(wrapper.find('section[data-width="860"]').exists()).toBe(true)
    expect(getManagedTenantByIdApi).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="business-card-create-steps"]').text()).toContain('选择员工')
    expect(wrapper.find('[data-testid="business-card-create-steps"]').text()).toContain('展示信息')
    expect(wrapper.find('[data-testid="business-card-create-steps"]').text()).toContain('创建方式')
    expect(wrapper.text()).not.toContain('公开名片预览')

    await wrapper.find('select[data-placeholder="选择员工"]').setValue('emp_001')
    await wrapper.findAll('button').find((button) => button.text() === '下一步')?.trigger('click')
    await flushPromises()

    expect(listBusinessCardContactAssetCandidatesApi).toHaveBeenCalledWith('tenant_001', 'emp_001')
    expect(wrapper.text()).toContain('配置展示信息')
    expect(wrapper.text()).toContain('邮箱')
    expect(wrapper.text()).toContain('保存通讯录')
    expect(wrapper.text()).toContain('公司官网')
    expect(wrapper.text()).not.toContain('Contact Asset')

    await wrapper.find('select[data-placeholder="选择公开联系方式"]').setValue('asset_email_001')
    await wrapper.findAll('button').find((button) => button.text() === '下一步')?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('配置检查')
    expect(wrapper.text()).toContain('保存草稿')
    expect(wrapper.text()).toContain('创建并启用')

    await wrapper.findAll('button').find((button) => button.text() === '保存草稿')?.trigger('click')
    await flushPromises()

    expect(ensurePrimaryBusinessCardApi).toHaveBeenCalledWith('tenant_001', 'emp_001')
    expect(updateBusinessCardContactActionsApi).toHaveBeenCalledWith('tenant_001', 'card_001', {
      contactActionConfigs: [
        expect.objectContaining({
          contactActionType: 'SEND_EMAIL',
          targetRefId: 'asset_email_001',
          targetRefType: 'CONTACT_ASSET'
        }),
        expect.objectContaining({
          contactActionType: 'SAVE_VCARD',
          targetRefType: 'NONE'
        }),
        expect.objectContaining({
          contactActionType: 'OPEN_COMPANY_WEBSITE',
          targetRefType: 'TENANT_PUBLIC_PROFILE'
        })
      ],
      visibilityConfig: cardRecord.visibilityConfig
    })
    expect(bindBusinessCardPublicEntryApi).not.toHaveBeenCalled()
    expect(enableBusinessCardApi).not.toHaveBeenCalled()
  })

  it('shows a tenant-context error instead of calling admin APIs when session tenant is missing', async () => {
    authContextState.sessionContext.tenant = null as never
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(listBusinessCardsApi).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('当前会话缺少租户上下文。')
  })
})
