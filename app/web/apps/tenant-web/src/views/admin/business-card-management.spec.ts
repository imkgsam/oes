/* @vitest-environment happy-dom */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const businessCardWorkspaceSource = readFileSync(
  resolve(process.cwd(), 'apps/tenant-web/src/views/admin/components/business-card-workspace.vue'),
  'utf8'
)

const bindBusinessCardPublicEntryApi = vi.fn()
const disableBusinessCardApi = vi.fn()
const enableBusinessCardApi = vi.fn()
const ensurePrimaryBusinessCardApi = vi.fn()
const getBusinessCardDetailApi = vi.fn()
const getBusinessCardVisitSummaryApi = vi.fn()
const listBusinessCardContactAssetCandidatesApi = vi.fn()
const listBusinessCardsApi = vi.fn()
const listManagedEmployeesApi = vi.fn()
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
  listBusinessCardContactAssetCandidatesApi,
  listBusinessCardsApi,
  listManagedEmployeesApi,
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

vi.mock('ant-design-vue', () => ({
  Alert: {
    name: 'AAlert',
    props: ['message'],
    template: '<div>{{ message }}</div>'
  },
  Button: {
    name: 'AButton',
    props: ['danger', 'href', 'loading', 'size', 'target', 'type'],
    emits: ['click'],
    template: '<a v-if="href" :href="href" :target="target"><slot name="icon" /><slot /></a><button v-else type="button" @click="$emit(\'click\')"><slot name="icon" /><slot /></button>'
  },
  Descriptions: DescriptionsStub,
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
    template: '<section v-if="open" :data-width="width"><h3>{{ title }}</h3><slot /><footer><slot name="footer" /><button type="button" @click="$emit(\'ok\')">确定</button></footer></section>'
  },
  QRCode: {
    name: 'AQrCode',
    props: ['size', 'value'],
    template: '<div data-testid="admin-card-qr">{{ value }}</div>'
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
  Statistic: {
    name: 'AStatistic',
    props: ['title', 'value'],
    template: '<div>{{ title }}: {{ value }}</div>'
  },
  Table: {
    name: 'ATable',
    props: ['columns', 'dataSource', 'loading', 'pagination', 'rowKey'],
    template: `
      <table>
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
    listBusinessCardContactAssetCandidatesApi.mockReset()
    listBusinessCardsApi.mockReset()
    listManagedEmployeesApi.mockReset()
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
      shortLinkId: 'sl_001',
      totalVisits: 12
    })
    bindBusinessCardPublicEntryApi.mockResolvedValue({ publicEntryRef: cardRecord.publicEntryRef })
    disableBusinessCardApi.mockResolvedValue({})
    enableBusinessCardApi.mockResolvedValue({})
    listBusinessCardContactAssetCandidatesApi.mockResolvedValue({ assets: contactAssetCandidates })
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

    const contactAssetSelectors = wrapper.findAll('select[data-placeholder="选择 Contact Asset"]')
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
    expect(wrapper.find('.business-card-workspace__action-toolbar').exists()).toBe(true)
    expect(wrapper.find('.business-card-workspace__action-row').classes()).toContain(
      'business-card-workspace__action-row--compact'
    )
    expect(wrapper.text()).toContain('发送邮件')
    expect(wrapper.text()).toContain('保存通讯录')
    expect(wrapper.text()).not.toContain('contact-00000000-0000-4000-8000-000000000903')
    expect(wrapper.find('select[data-testid="business-card-action-type-picker"]').exists()).toBe(true)

    await wrapper.find('select[data-testid="business-card-action-type-picker"]').setValue('CALL_PHONE')
    await wrapper.findAll('button').find((button) => button.text() === '添加动作')?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('拨打电话')
    const contactAssetSelectors = wrapper.findAll('select[data-placeholder="选择 Contact Asset"]')
    await contactAssetSelectors[contactAssetSelectors.length - 1]?.setValue('asset_phone_001')
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

  it('uses tenant-scoped management APIs for detail preview and state transition actions', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(listBusinessCardsApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 50 })
    expect(listManagedEmployeesApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 200 })
    expect(wrapper.text()).not.toContain('总访问: 12')
    expect(wrapper.text()).toContain('Alex Chen')
    expect(wrapper.text()).toContain('EMP-001')
    expect(wrapper.text()).toContain('已禁用')
    expect(wrapper.text()).toContain('预览')
    expect(wrapper.findAll('button').some((button) => button.text() === '启用')).toBe(true)
    expect(wrapper.findAll('button').some((button) => button.text() === '禁用')).toBe(false)
    expect(wrapper.text()).not.toContain('刷新公开链接')

    await wrapper.findAll('button').find((button) => button.text() === '查看详情')?.trigger('click')
    await flushPromises()
    expect(getBusinessCardDetailApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(getBusinessCardVisitSummaryApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(wrapper.text()).toContain('名片详情')
    expect(wrapper.text()).toContain('总访问: 12')
    expect(wrapper.text()).toContain('https://go.oes.local/c/ABC1234')

    await wrapper.findAll('button').find((button) => button.text() === '启用')?.trigger('click')
    await flushPromises()

    expect(bindBusinessCardPublicEntryApi).not.toHaveBeenCalled()
    expect(enableBusinessCardApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(disableBusinessCardApi).not.toHaveBeenCalled()
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
    expect(wrapper.text()).toContain('需要刷新公开链接')
    await wrapper.findAll('button').find((button) => button.text() === '查看详情')?.trigger('click')
    await flushPromises()

    expect(getBusinessCardDetailApi).toHaveBeenCalledWith('tenant_001', 'card_draft_001')
    expect(getBusinessCardVisitSummaryApi).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('名片详情')
    expect(wrapper.text()).toContain('未绑定')
    expect(wrapper.text()).toContain('未绑定公开链接')
    expect(wrapper.text()).toContain('总访问: 0')
  })

  it('wires draft detail modal close to release pending loading state', async () => {
    listBusinessCardsApi.mockResolvedValue({ items: [draftCardRecord], page: 1, pageSize: 50, total: 1 })
    getBusinessCardDetailApi.mockReturnValue(new Promise(() => {}))
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '查看详情')?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('名片详情')
    expect(wrapper.find('[data-testid="admin-card-loading"]').exists()).toBe(true)
    expect(businessCardWorkspaceSource).toContain('@cancel="closeDetailModal"')
    expect(businessCardWorkspaceSource).toContain('@click="closeDetailModal"')
  })

  it('opens a create modal before choosing the employee for a new card', async () => {
    ensurePrimaryBusinessCardApi.mockResolvedValue({ businessCard: cardRecord })
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
    expect(wrapper.find('section[data-width="440"]').exists()).toBe(true)
    await wrapper.find('select[data-placeholder="选择员工"]').setValue('emp_001')
    await wrapper.findAll('button').find((button) => button.text() === '创建名片')?.trigger('click')
    await flushPromises()

    expect(ensurePrimaryBusinessCardApi).toHaveBeenCalledWith('tenant_001', 'emp_001')
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
