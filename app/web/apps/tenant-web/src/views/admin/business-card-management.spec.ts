/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const bindBusinessCardPublicEntryApi = vi.fn()
const disableBusinessCardApi = vi.fn()
const enableBusinessCardApi = vi.fn()
const ensurePrimaryBusinessCardApi = vi.fn()
const getBusinessCardDetailApi = vi.fn()
const getBusinessCardVisitSummaryApi = vi.fn()
const listBusinessCardsApi = vi.fn()
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
  listBusinessCardsApi,
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

vi.mock('ant-design-vue', () => ({
  Alert: {
    name: 'AAlert',
    props: ['message'],
    template: '<div>{{ message }}</div>'
  },
  Button: {
    name: 'AButton',
    props: ['danger', 'loading', 'size', 'type'],
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot name="icon" /><slot /></button>'
  },
  Descriptions: DescriptionsStub,
  Drawer: {
    name: 'ADrawer',
    props: ['open', 'title', 'width'],
    template: '<section v-if="open"><h3>{{ title }}</h3><slot /><footer><slot name="footer" /></footer></section>'
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
  QRCode: {
    name: 'AQrCode',
    props: ['size', 'value'],
    template: '<div data-testid="admin-card-qr">{{ value }}</div>'
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

describe('admin BusinessCard management page', () => {
  beforeEach(() => {
    bindBusinessCardPublicEntryApi.mockReset()
    disableBusinessCardApi.mockReset()
    enableBusinessCardApi.mockReset()
    ensurePrimaryBusinessCardApi.mockReset()
    getBusinessCardDetailApi.mockReset()
    getBusinessCardVisitSummaryApi.mockReset()
    listBusinessCardsApi.mockReset()
    updateBusinessCardContactActionsApi.mockReset()
    authContextState.sessionContext.tenant = { tenantId: 'tenant_001' }

    listBusinessCardsApi.mockResolvedValue({ items: [cardRecord], page: 1, pageSize: 50, total: 1 })
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
    updateBusinessCardContactActionsApi.mockResolvedValue({ businessCard: cardRecord })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('persists Contact Action refs only and never submits contact values', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === '配置动作')?.trigger('click')
    await flushPromises()
    const contactAssetInputs = wrapper.findAll('input[placeholder="Contact Asset ID"]')
    await contactAssetInputs[0]?.setValue('asset_email_002')
    await wrapper.findAll('button').find((button) => button.text() === '保存')?.trigger('click')
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
    expect(submittedPayload).not.toContain('+8613800000000')
    expect(submittedPayload).not.toContain('wechat')
    expect(submittedPayload).not.toContain('whatsapp')
  })

  it('uses tenant-scoped management APIs for public entry, stats, enable, and disable', async () => {
    const view = await import('./business-card-management.vue')
    const wrapper = mount(view.default, { attachTo: document.body })
    await flushPromises()

    expect(listBusinessCardsApi).toHaveBeenCalledWith('tenant_001', { page: 1, pageSize: 50 })
    expect(getBusinessCardDetailApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(getBusinessCardVisitSummaryApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(wrapper.text()).toContain('总访问: 12')
    expect(wrapper.text()).toContain('https://go.oes.local/c/ABC1234')

    await wrapper.findAll('button').find((button) => button.text() === '绑定/刷新入口')?.trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '启用')?.trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((button) => button.text() === '禁用')?.trigger('click')
    await flushPromises()

    expect(bindBusinessCardPublicEntryApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(enableBusinessCardApi).toHaveBeenCalledWith('tenant_001', 'card_001')
    expect(disableBusinessCardApi).toHaveBeenCalledWith('tenant_001', 'card_001')
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
