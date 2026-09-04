import { PersonalCenterSummaryAdapter } from '../../../../../../../src/modules/auth-bff/infrastructure/downstream/personal-center/personal-center-summary.adapter'

describe('PersonalCenterSummaryAdapter', () => {
  it('aggregates user identity, current-account work contacts, and current-account login methods', async () => {
    const identityAdapter = {
      getUserById: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          username: '陈双鹏',
          personalEmail: 'chen.shuangpeng@meilong-ceramics.com',
          personalPhone: '+8613900000001',
          isActive: true
        }
      }),
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          avatarUrl: 'data:image/svg+xml;base64,avatar',
          avatarAssetId: '',
          displayName: '陈双鹏',
          bio: '外贸与平台协同负责人'
        }
      }),
      listAccountWorkEmailAssets: jest.fn().mockResolvedValue({
        assets: [
          {
            id: 'asset-email-1',
            value: 'sales@meilong-ceramics.com',
            status: 'ACTIVE',
            isPrimary: false
          },
          {
            id: 'asset-email-2',
            value: 'chen.shuangpeng@meilong-ceramics.com',
            status: 'ACTIVE',
            isPrimary: true
          }
        ]
      }),
      listAccountWorkPhoneAssets: jest.fn().mockResolvedValue({
        assets: [
          {
            id: 'asset-phone-1',
            value: '+8613900000099',
            status: 'ACTIVE',
            isPrimary: false
          },
          {
            id: 'asset-phone-2',
            value: '+8613900000001',
            status: 'ACTIVE',
            isPrimary: true
          }
        ]
      })
    }
    const authAdapter = {
      listSessions: jest.fn().mockResolvedValue({
        sessions: [
          {
            sessionId: 'session-current',
            accountId: 'account-1',
            loginMethod: 'EMAIL_PASSWORD',
            isCurrent: true
          },
          {
            sessionId: 'session-other-account',
            accountId: 'account-2',
            loginMethod: 'PHONE_PASSWORD',
            isCurrent: false
          },
          {
            sessionId: 'session-same-account',
            accountId: 'account-1',
            loginMethod: 'PHONE_PASSWORD',
            isCurrent: false
          }
        ]
      })
    }

    const adapter = new PersonalCenterSummaryAdapter(
      identityAdapter as any,
      authAdapter as any,
      { resolveAssetPublicUrl: jest.fn() } as any
    )

    await expect(
      adapter.getPersonalCenterSummary('user-1', 'account-1', {
        user: { sid: 'session-current' }
      } as any)
    ).resolves.toEqual({
      avatar: 'data:image/svg+xml;base64,avatar',
      displayName: '陈双鹏',
      bio: '外贸与平台协同负责人',
      loginEmail: 'chen.shuangpeng@meilong-ceramics.com',
      loginPhone: '+8613900000001',
      loginMethods: [
        {
          type: 'EMAIL_PASSWORD',
          label: '邮箱密码',
          value: 'chen.shuangpeng@meilong-ceramics.com'
        },
        {
          type: 'PHONE_PASSWORD',
          label: '手机密码',
          value: '+8613900000001'
        }
      ],
      workEmail: 'chen.shuangpeng@meilong-ceramics.com',
      workPhone: '+8613900000001'
    })

    expect(identityAdapter.getUserById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ user: { sid: 'session-current' } })
    )
    expect(identityAdapter.getAccountById).toHaveBeenCalledWith(
      'account-1',
      expect.objectContaining({ user: { sid: 'session-current' } })
    )
    expect(identityAdapter.listAccountWorkEmailAssets).toHaveBeenCalledWith(
      'account-1',
      expect.objectContaining({ user: { sid: 'session-current' } })
    )
    expect(identityAdapter.listAccountWorkPhoneAssets).toHaveBeenCalledWith(
      'account-1',
      expect.objectContaining({ user: { sid: 'session-current' } })
    )
    expect(authAdapter.listSessions).toHaveBeenCalledWith(
      'user-1',
      'session-current',
      expect.objectContaining({ user: { sid: 'session-current' } })
    )
  })

  it('resolves current-account avatar from avatarAssetId when the account stores a controlled asset reference', async () => {
    const identityAdapter = {
      getUserById: jest.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          personalEmail: 'platform@example.com',
          personalPhone: ''
        }
      }),
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-system',
          avatarUrl: '',
          avatarAssetId: 'asset-system-1',
          displayName: 'Platform Admin',
          bio: 'system profile'
        }
      }),
      listAccountWorkEmailAssets: jest.fn().mockResolvedValue({ assets: [] }),
      listAccountWorkPhoneAssets: jest.fn().mockResolvedValue({ assets: [] })
    }
    const authAdapter = {
      listSessions: jest.fn().mockResolvedValue({ sessions: [] })
    }
    const assetAdapter = {
      resolveAssetPublicUrl: jest.fn().mockResolvedValue({
        assetId: 'asset-system-1',
        publicUrl: 'http://localhost:9000/oes-assets/avatar/system/account-system/avatar.webp',
        status: 'ACTIVE'
      })
    }

    const adapter = new PersonalCenterSummaryAdapter(
      identityAdapter as any,
      authAdapter as any,
      assetAdapter as any
    )

    await expect(
      adapter.getPersonalCenterSummary('user-1', 'account-system', {
        user: { sid: 'session-current' }
      } as any)
    ).resolves.toEqual(
      expect.objectContaining({
        avatar: 'http://localhost:9000/oes-assets/avatar/system/account-system/avatar.webp'
      })
    )

    expect(assetAdapter.resolveAssetPublicUrl).toHaveBeenCalledWith(
      { assetId: 'asset-system-1' },
      expect.objectContaining({ user: { sid: 'session-current' } })
    )
  })
})
