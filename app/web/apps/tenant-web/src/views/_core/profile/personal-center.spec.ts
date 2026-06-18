/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPersonalCenterApi = vi.fn()
const updateAccountProfileApi = vi.fn()
const setUserInfo = vi.fn()

const authContextStore = {
  accountName: 'alex.chen',
  scopeLabel: '租户账号',
  sessionContext: {
    account: {
      avatar: '',
      name: 'Alex Chen'
    },
    allowedTerminals: ['WEB'],
    operator: {
      displayName: 'Alex Chen',
      userId: 'user_001'
    },
    tenant: {
      tenantId: 'tenant_001'
    }
  },
  tenantName: 'OES Demo'
}

vi.mock('#/api', () => ({
  getPersonalCenterApi,
  updateAccountProfileApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextStore
}))

vi.mock('#/store/test-user-avatar', () => ({
  resolveTestUserAvatar: () => 'https://cdn.example.com/fallback.png'
}))

vi.mock('@vben/preferences', () => ({
  preferences: {
    app: {
      defaultAvatar: 'https://cdn.example.com/default.png'
    }
  }
}))

vi.mock('@vben/stores', () => ({
  useUserStore: () => ({
    setUserInfo,
    userInfo: {
      realName: 'Alex Chen'
    }
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    name: 'Page',
    template: '<main><slot /></main>'
  })
}))

vi.mock('./components/personal-business-card-section.vue', () => ({
  default: defineComponent({
    name: 'PersonalBusinessCardSection',
    template: '<section>我的名片</section>'
  })
}))

vi.mock('./components/personal-user-section.vue', () => ({
  default: defineComponent({
    name: 'PersonalUserSection',
    template: '<section>用户资料</section>'
  })
}))

vi.mock('./components/personal-account-section.vue', () => ({
  default: defineComponent({
    name: 'PersonalAccountSection',
    template: '<section>当前账号上下文</section>'
  })
}))

vi.mock('./components/personal-security-section.vue', () => ({
  default: defineComponent({
    name: 'PersonalSecuritySection',
    template: '<section>安全入口</section>'
  })
}))

vi.mock('ant-design-vue', () => ({
  Button: defineComponent({
    name: 'Button',
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>'
  }),
  Result: defineComponent({
    name: 'Result',
    props: ['subTitle', 'title'],
    template: '<section>{{ title }}{{ subTitle }}<slot name="extra" /></section>'
  }),
  Skeleton: defineComponent({
    name: 'Skeleton',
    template: '<div data-testid="personal-center-loading" />'
  }),
  Tag: defineComponent({
    name: 'Tag',
    template: '<span><slot /></span>'
  }),
  Tooltip: defineComponent({
    name: 'Tooltip',
    template: '<span><slot /></span>'
  }),
  message: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

describe('personal center page', () => {
  beforeEach(() => {
    getPersonalCenterApi.mockReset()
    updateAccountProfileApi.mockReset()
  })

  it('places a nested personal business card entry in the personal center', async () => {
    getPersonalCenterApi.mockResolvedValue({
      accountContext: {
        accountId: 'account_001',
        accountName: 'alex.chen',
        displayName: 'Alex Chen',
        roles: [],
        scopeLevel: 'TENANT',
        tenantId: 'tenant_001',
        tenantName: 'OES Demo'
      },
      securityEntries: [],
      userProfile: {
        userId: 'user_001'
      }
    })
    const view = await import('./personal-center.vue')

    const wrapper = mount(view.default)
    await flushPromises()

    expect(wrapper.text()).toContain('我的名片')
    expect(wrapper.text()).toContain('当前账号上下文')
  })
})
