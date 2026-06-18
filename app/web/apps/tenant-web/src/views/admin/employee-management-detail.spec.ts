/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getManagedEmployeeAccountAccessApi = vi.fn()
const getManagedEmployeeDetailApi = vi.fn()
const uploadEmployeeOfficialPhotoApi = vi.fn()
const getBusinessCardDetailApi = vi.fn()
const getBusinessCardVisitSummaryApi = vi.fn()
const listBusinessCardsApi = vi.fn()
const listBusinessCardContactAssetCandidatesApi = vi.fn()
const bindBusinessCardPublicEntryApi = vi.fn()
const disableBusinessCardApi = vi.fn()
const enableBusinessCardApi = vi.fn()
const ensurePrimaryBusinessCardApi = vi.fn()
const updateBusinessCardContactActionsApi = vi.fn()
const push = vi.fn()
const routeState: any = {
  params: {
    employeeId: 'employee-1'
  }
}
const authContextState: any = {
  sessionContext: {
    tenant: {
      tenantId: 'tenant-1',
      name: 'Alpha Tenant'
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
  getManagedEmployeeAccountAccessApi,
  getManagedEmployeeDetailApi,
  uploadEmployeeOfficialPhotoApi,
  listBusinessCardContactAssetCandidatesApi,
  listBusinessCardsApi,
  updateBusinessCardContactActionsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<div><h1>{{ title }}</h1><slot /></div>'
  }
}))

describe('employee management detail page', () => {
  beforeEach(() => {
    push.mockReset()
    bindBusinessCardPublicEntryApi.mockReset()
    disableBusinessCardApi.mockReset()
    enableBusinessCardApi.mockReset()
    ensurePrimaryBusinessCardApi.mockReset()
    getBusinessCardDetailApi.mockReset()
    getBusinessCardVisitSummaryApi.mockReset()
    getManagedEmployeeAccountAccessApi.mockReset()
    getManagedEmployeeDetailApi.mockReset()
    uploadEmployeeOfficialPhotoApi.mockReset()
    listBusinessCardContactAssetCandidatesApi.mockReset()
    listBusinessCardsApi.mockReset()
    updateBusinessCardContactActionsApi.mockReset()
    listBusinessCardsApi.mockResolvedValue({ items: [], page: 1, pageSize: 50, total: 0 })
    getBusinessCardVisitSummaryApi.mockResolvedValue({
      byDetectedChannel: [],
      byDeviceType: [],
      byReferrer: [],
      byResultStatus: [],
      shortLinkId: 'short-link-1',
      totalVisits: 0
    })
    getManagedEmployeeDetailApi.mockResolvedValue({
      employee: {
        employeeCode: 'EMP-0AF-0001',
        displayName: 'Ada Chen',
        id: 'employee-1',
        lifecycleStatus: 'ACTIVE',
        officialPhotoAssetId: null,
        officialPhotoUrl: null,
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1'
      },
      activeEmployment: {
        effectiveFrom: '2026-04-24T00:00:00.000Z',
        employeeId: 'employee-1',
        id: 'employment-1',
        orgUnitId: 'org-dept-1',
        orgUnit: {
          depth: 1,
          id: 'org-dept-1',
          name: '制造中心',
          parentOrgId: 'org-root-1',
          path: '/org-root-1/org-dept-1',
          sortOrder: 10,
          status: 'ACTIVE',
          tenantId: 'tenant-1',
          type: 'DEPARTMENT'
        },
        status: 'ACTIVE',
        tenantId: 'tenant-1'
      },
      employments: [
        {
          effectiveFrom: '2026-04-24T00:00:00.000Z',
          employeeId: 'employee-1',
          id: 'employment-1',
          orgUnitId: 'org-dept-1',
          orgUnit: {
            depth: 1,
            id: 'org-dept-1',
            name: '制造中心',
            parentOrgId: 'org-root-1',
            path: '/org-root-1/org-dept-1',
            sortOrder: 10,
            status: 'ACTIVE',
            tenantId: 'tenant-1',
            type: 'DEPARTMENT'
          },
          status: 'ACTIVE',
          tenantId: 'tenant-1'
        }
      ]
    })
    getManagedEmployeeAccountAccessApi.mockResolvedValue({
      status: 'ACTIVE',
      canContinue: false,
      loginMethods: [
        {
          enabled: true,
          hasPassword: false,
          maskedIdentifier: 'a***@example.com',
          methodId: 'method-1',
          type: 'EMAIL_OTP',
          verified: true
        }
      ],
      passwordSetupRequired: true,
      roles: [
        {
          code: 'tenant.admin',
          id: 'role-1',
          name: 'Tenant Admin'
        }
      ]
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('loads employee detail and access summary as a dedicated detail page', async () => {
    const view = await import('./employee-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(getManagedEmployeeDetailApi).toHaveBeenCalledWith('tenant-1', 'employee-1')
    expect(getManagedEmployeeAccountAccessApi).toHaveBeenCalledWith('tenant-1', 'employee-1')
    expect(wrapper.text()).toContain('员工详情')
    expect(wrapper.text()).toContain('Ada Chen')
    expect(wrapper.text()).toContain('制造中心')
    expect(wrapper.text()).toContain('员工码二维码')
    expect(wrapper.find('[data-testid="employee-code-qr"]').attributes('data-value')).toBe('EMP-0AF-0001')
    expect(wrapper.text()).toContain('账号与访问')
    expect(wrapper.text()).toContain('名片')
  })

  it('uses the HR official photo as the highlighted employee detail portrait', async () => {
    getManagedEmployeeDetailApi.mockResolvedValueOnce({
      employee: {
        employeeCode: 'EMP-0AF-0002',
        displayName: 'Bea Lin',
        id: 'employee-1',
        lifecycleStatus: 'ACTIVE',
        officialPhotoAssetId: 'asset-official-1',
        officialPhotoUrl: 'https://cdn.example.com/hr/bea-official.webp',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1'
      },
      activeEmployment: {
        effectiveFrom: '2026-04-24T00:00:00.000Z',
        employeeId: 'employee-1',
        id: 'employment-1',
        orgUnitId: 'org-dept-1',
        orgUnit: {
          depth: 1,
          id: 'org-dept-1',
          name: '人力行政部',
          parentOrgId: 'org-root-1',
          path: '/org-root-1/org-dept-1',
          sortOrder: 10,
          status: 'ACTIVE',
          tenantId: 'tenant-1',
          type: 'DEPARTMENT'
        },
        status: 'ACTIVE',
        tenantId: 'tenant-1'
      },
      employments: []
    })
    const view = await import('./employee-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.find('.employee-detail-page__summary-card--hero').exists()).toBe(true)
    expect(wrapper.find('[data-testid="employee-detail-official-photo"]').attributes('src')).toBe(
      'https://cdn.example.com/hr/bea-official.webp'
    )
    expect(wrapper.find('[data-testid="employee-detail-official-photo-placeholder"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('EMP-0AF-0002 · 人力行政部')
  })

  it('renders employee login methods as readable chips instead of raw enum text', async () => {
    getManagedEmployeeAccountAccessApi.mockResolvedValueOnce({
      status: 'ACTIVE',
      canContinue: false,
      loginMethods: [
        {
          enabled: true,
          hasPassword: true,
          maskedIdentifier: 'c***@ml.lc',
          methodId: 'method-email-password',
          type: 'EMAIL_PASSWORD',
          verified: true
        },
        {
          enabled: true,
          hasPassword: false,
          maskedIdentifier: 'c***@ml.lc',
          methodId: 'method-email-otp',
          type: 'EMAIL_OTP',
          verified: true
        },
        {
          enabled: true,
          hasPassword: true,
          maskedIdentifier: '+86****0101',
          methodId: 'method-phone-password',
          type: 'PHONE_PASSWORD',
          verified: true
        }
      ],
      passwordSetupRequired: false,
      roles: []
    })
    const view = await import('./employee-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    const accessTab = wrapper.findAll('.ant-tabs-tab').find((tab) => tab.text().includes('账号与访问'))
    expect(accessTab).toBeTruthy()
    await accessTab?.trigger('click')
    await flushPromises()

    expect(wrapper.find('.employee-detail-page__login-method-list').exists()).toBe(true)
    expect(wrapper.text()).toContain('邮箱密码')
    expect(wrapper.text()).toContain('邮箱验证码')
    expect(wrapper.text()).toContain('手机密码')
    expect(wrapper.text()).toContain('c***@ml.lc')
    expect(wrapper.text()).toContain('+86****0101')
    expect(wrapper.text()).not.toContain('EMAIL_PASSWORD')
    expect(wrapper.text()).not.toContain('EMAIL_OTP')
    expect(wrapper.text()).not.toContain('PHONE_PASSWORD')
    expect(wrapper.find('.employee-detail-page__login-method-list').text()).not.toContain(' / ')
  })

  it('lets admins update the HR official photo from the portrait action', async () => {
    uploadEmployeeOfficialPhotoApi.mockResolvedValue({
      employee: {
        employeeCode: 'EMP-0AF-0001',
        displayName: 'Ada Chen',
        id: 'employee-1',
        lifecycleStatus: 'ACTIVE',
        officialPhotoAssetId: 'asset-official-2',
        officialPhotoUrl: 'https://cdn.example.com/hr/ada-new-official.webp',
        tenantId: 'tenant-1',
        tenantPartyId: 'tenant-party-1'
      }
    })
    const view = await import('./employee-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="employee-detail-official-photo-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="employee-detail-official-photo-action"]').attributes('aria-label')).toBe('修改公开头像')

    const file = new File(['official'], 'ada.webp', { type: 'image/webp' })
    const input = wrapper.find<HTMLInputElement>('[data-testid="employee-detail-official-photo-input"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [file]
    })
    await input.trigger('change')
    await flushPromises()

    expect(uploadEmployeeOfficialPhotoApi).toHaveBeenCalledWith('tenant-1', 'employee-1', file)
    expect(wrapper.find('[data-testid="employee-detail-official-photo"]').attributes('src')).toBe(
      'https://cdn.example.com/hr/ada-new-official.webp'
    )
    expect(wrapper.find('[data-testid="employee-detail-official-photo-placeholder"]').exists()).toBe(false)
  })

  it('renders employee BusinessCards as display-only cards inside employee detail', async () => {
    listBusinessCardsApi.mockResolvedValue({
      items: [
        {
          businessCardId: 'card-1',
          contactActionConfigs: [],
          employeeId: 'employee-1',
          publicEntryRef: {
            publicEntryId: 'entry-1',
            publicUrl: 'https://go.oes.local/c/EMP001',
            qrContent: 'https://go.oes.local/c/EMP001',
            shortCode: 'EMP001',
            status: 'ACTIVE'
          },
          status: 'ACTIVE',
          templateKey: 'TENANT_STANDARD',
          tenantId: 'tenant-1',
          updatedAt: '2026-06-08T00:00:00.000Z',
          visibilityConfig: {
            showCompany: true,
            showDepartment: true,
            showOfficialPhoto: true,
            showTitle: true
          }
        }
      ],
      page: 1,
      pageSize: 50,
      total: 1
    })
    const view = await import('./employee-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    const cardTab = wrapper.findAll('.ant-tabs-tab').find((tab) => tab.text().includes('名片'))
    expect(cardTab).toBeTruthy()
    await cardTab?.trigger('click')
    await flushPromises()

    expect(listBusinessCardsApi).toHaveBeenCalledWith('tenant-1', {
      employeeId: 'employee-1',
      page: 1,
      pageSize: 20
    })
    expect(wrapper.text()).toContain('Ada Chen 的数字名片')
    expect(wrapper.text()).toContain('EMP-0AF-0001')
    expect(wrapper.text()).toContain('已启用')
    expect(wrapper.text()).toContain('https://go.oes.local/c/EMP001')
    expect(wrapper.text()).not.toContain('模板')
    expect(wrapper.text()).not.toContain('TENANT_STANDARD')
    expect(wrapper.text()).not.toContain('最近更新')
    expect(wrapper.text()).not.toContain('2026-06-08')
    expect(wrapper.text()).not.toContain('公开短码')
    expect(wrapper.text()).not.toContain('新增名片')
    expect(wrapper.text()).not.toContain('配置联系方式')
    expect(wrapper.text()).not.toContain('刷新公开链接')
  })

  it('keeps employee detail BusinessCard tab as preview-only without the public avatar setting block', async () => {
    const view = await import('./employee-management-detail.vue')

    const wrapper = mount(view.default, {
      attachTo: document.body,
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await flushPromises()
    const cardTab = wrapper.findAll('.ant-tabs-tab').find((tab) => tab.text().includes('名片'))
    await cardTab?.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="employee-official-photo-placeholder"]').text()).toBe('A')
    expect(wrapper.find('.employee-business-card-display__setting').exists()).toBe(false)
    expect(wrapper.find('[data-testid="employee-official-photo-input"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="employee-official-photo-remove"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('公开展示头像')
    expect(wrapper.text()).not.toContain('该头像将用于员工数字名片和公开展示页面')
    expect(wrapper.text()).not.toContain('上传头像')
    expect(wrapper.text()).not.toContain('移除')
    expect(wrapper.text()).not.toContain('account-avatar.example.com')
  })
})
