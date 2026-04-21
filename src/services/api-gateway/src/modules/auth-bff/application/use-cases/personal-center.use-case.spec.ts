import { PersonalCenterUseCase } from './personal-center.use-case'

describe('PersonalCenterUseCase', () => {
  it('separates user-level profile data from current account context', async () => {
    const sessionContextUseCase = {
      execute: jest.fn().mockResolvedValue({
        operator: { userId: 'user-1', displayName: '陈双鹏', scopeLevel: 'TENANT' },
        account: { accountId: 'account-1', name: '陈双鹏 / 美隆陶瓷', scopeLevel: 'TENANT' },
        tenant: { tenantId: 'tenant-1', name: '潮州市美隆陶瓷实业有限公司' },
        scopeLevel: 'TENANT'
      })
    }
    const accessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-1', code: 'tenant.admin', name: '租户管理员' }],
        actionCodes: []
      })
    }
    const identitySummaryPort = {
      getPersonalCenterSummary: jest.fn().mockResolvedValue({
        avatar: 'data:image/svg+xml;base64,abc',
        displayName: '陈双鹏',
        bio: '外贸与平台协同负责人',
        loginEmail: 'chen.shuangpeng@meilong-ceramics.com',
        loginMethods: [
          {
            type: 'EMAIL_PASSWORD',
            label: '邮箱密码',
            value: 'chen.shuangpeng@meilong-ceramics.com'
          }
        ],
        loginPhone: '+8613900000001',
        workEmail: 'chen.shuangpeng@meilong-ceramics.com',
        workPhone: '+8613900000001'
      })
    }

    const useCase = new PersonalCenterUseCase(
      sessionContextUseCase as any,
      accessSummaryUseCase as any,
      identitySummaryPort as any
    )

    await expect(
      useCase.execute({
        user: { sub: 'user-1', aid: 'account-1', sid: 'session-1' }
      } as any)
    ).resolves.toEqual({
      userProfile: {
        loginEmail: 'chen.shuangpeng@meilong-ceramics.com',
        loginPhone: '+8613900000001',
        loginMethods: [
          {
            type: 'EMAIL_PASSWORD',
            label: '邮箱密码',
            value: 'chen.shuangpeng@meilong-ceramics.com'
          }
        ]
      },
      accountContext: {
        accountId: 'account-1',
        accountName: '陈双鹏 / 美隆陶瓷',
        avatar: 'data:image/svg+xml;base64,abc',
        displayName: '陈双鹏',
        bio: '外贸与平台协同负责人',
        tenantId: 'tenant-1',
        tenantName: '潮州市美隆陶瓷实业有限公司',
        scopeLevel: 'TENANT',
        roles: [{ roleId: 'role-1', code: 'tenant.admin', name: '租户管理员' }],
        workEmail: 'chen.shuangpeng@meilong-ceramics.com',
        workPhone: '+8613900000001'
      },
      securityEntries: [
        { code: 'session-security', label: '会话管理', path: '/account/security' },
        { code: 'mfa-security', label: 'MFA 与恢复码', path: '/account/security' }
      ]
    })
  })
})
