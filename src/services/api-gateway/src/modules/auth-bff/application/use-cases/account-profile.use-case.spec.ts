import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { AccountProfileUseCase } from './account-profile.use-case'

describe('AccountProfileUseCase', () => {
  it('updates only the current account profile and returns refreshed account context', async () => {
    const sessionContextUseCase = {
      execute: jest.fn().mockResolvedValue({
        account: { accountId: 'account-1', name: '陈双鹏 / 美隆陶瓷' },
        tenant: { tenantId: 'tenant-1', name: '潮州市美隆陶瓷实业有限公司' },
        scopeLevel: 'TENANT'
      })
    }
    const accessSummaryUseCase = {
      execute: jest.fn().mockResolvedValue({
        roles: [{ roleId: 'role-1', code: 'tenant.admin', name: '租户管理员' }]
      })
    }
    const identityAdapter = {
      updateOwnAccountProfile: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          avatarAssetId: 'asset-1',
          avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
          displayName: '陈双鹏',
          bio: '负责美隆陶瓷的外贸协同与重点客户经营。'
        }
      }),
      updateAccountProfile: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
          displayName: '陈双鹏',
          bio: '负责美隆陶瓷的外贸协同与重点客户经营。'
        }
      })
    }
    const identitySummaryPort = {
      getPersonalCenterSummary: jest.fn().mockResolvedValue({
        loginMethods: [],
        workEmail: 'sales@meilong-ceramics.com',
        workPhone: '+8613900000001'
      })
    }
    const assetAdapter = {
      bindAccountAvatar: jest.fn().mockResolvedValue({
        activeAsset: {
          assetId: 'asset-1',
          publicUrl: 'https://cdn.example.com/avatar/account-1.png'
        }
      })
    }

    const useCase = new AccountProfileUseCase(
      sessionContextUseCase as any,
      accessSummaryUseCase as any,
      identityAdapter as any,
      assetAdapter as any,
      identitySummaryPort as any
    )

    await expect(
      useCase.execute(
        {
          avatarAssetId: 'asset-1',
          displayName: '陈双鹏',
          bio: '负责美隆陶瓷的外贸协同与重点客户经营。'
        },
        {
          user: { sub: 'user-1', aid: 'account-1', sid: 'session-1', tid: 'tenant-1' }
        } as any
      )
    ).resolves.toEqual({
      accountContext: {
        accountId: 'account-1',
        accountName: '陈双鹏 / 美隆陶瓷',
        avatar: 'https://cdn.example.com/avatar/account-1.png',
        displayName: '陈双鹏',
        bio: '负责美隆陶瓷的外贸协同与重点客户经营。',
        tenantId: 'tenant-1',
        tenantName: '潮州市美隆陶瓷实业有限公司',
        scopeLevel: 'TENANT',
        roles: [{ roleId: 'role-1', code: 'tenant.admin', name: '租户管理员' }],
        workEmail: 'sales@meilong-ceramics.com',
        workPhone: '+8613900000001'
      }
    })

    expect(identityAdapter.updateOwnAccountProfile).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        avatarAssetId: 'asset-1',
        displayName: '陈双鹏',
        bio: '负责美隆陶瓷的外贸协同与重点客户经营。'
      },
      expect.objectContaining({ user: { sub: 'user-1', aid: 'account-1', sid: 'session-1', tid: 'tenant-1' } })
    )
    expect(identityAdapter.updateAccountProfile).not.toHaveBeenCalled()
    expect(assetAdapter.bindAccountAvatar).toHaveBeenCalledWith(
      {
        newAssetId: 'asset-1',
        previousAssetId: undefined
      },
      expect.objectContaining({ user: { sub: 'user-1', aid: 'account-1', sid: 'session-1', tid: 'tenant-1' } })
    )
  })

  it('rejects mutation when current account id is missing', async () => {
    const useCase = new AccountProfileUseCase(
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { updateAccountProfile: jest.fn() } as any,
      { bindAccountAvatar: jest.fn() } as any,
      { getPersonalCenterSummary: jest.fn() } as any
    )

    await expect(useCase.execute({}, { user: { sub: 'user-1' } } as any)).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('binds avatar assets for system-scope current accounts', async () => {
    const assetAdapter = {
      bindAccountAvatar: jest.fn().mockResolvedValue({
        activeAsset: {
          assetId: 'asset-system-1',
          publicUrl: 'https://cdn.example.com/avatar/system-account-1.png'
        }
      })
    }
    const useCase = new AccountProfileUseCase(
      {
        execute: jest.fn().mockResolvedValue({
          account: { accountId: 'account-1', name: 'Platform Admin' },
          tenant: undefined,
          scopeLevel: 'SYSTEM'
        })
      } as any,
      {
        execute: jest.fn().mockResolvedValue({
          roles: [{ roleId: 'role-1', code: 'system.admin', name: '系统管理员' }]
        })
      } as any,
      {
        updateOwnAccountProfile: jest.fn().mockResolvedValue({
          account: {
            id: 'account-1',
            avatarAssetId: 'asset-system-1',
            avatarUrl: 'https://cdn.example.com/avatar/system-account-1.png',
            displayName: 'Platform Admin',
            bio: 'system profile'
          }
        })
      } as any,
      assetAdapter as any,
      {
        getPersonalCenterSummary: jest.fn().mockResolvedValue({
          loginMethods: [],
          workEmail: undefined,
          workPhone: undefined
        })
      } as any
    )

    await expect(
      useCase.execute(
        { avatarAssetId: 'asset-system-1' },
        { user: { sub: 'user-1', aid: 'account-1', scopeLevel: 'SYSTEM' } } as any
      )
    ).resolves.toEqual({
      accountContext: {
        accountId: 'account-1',
        accountName: 'Platform Admin',
        avatar: 'https://cdn.example.com/avatar/system-account-1.png',
        displayName: 'Platform Admin',
        bio: 'system profile',
        tenantId: undefined,
        tenantName: undefined,
        scopeLevel: 'SYSTEM',
        roles: [{ roleId: 'role-1', code: 'system.admin', name: '系统管理员' }],
        workEmail: undefined,
        workPhone: undefined
      }
    })

    expect(assetAdapter.bindAccountAvatar).toHaveBeenCalledWith(
      {
        newAssetId: 'asset-system-1',
        previousAssetId: undefined
      },
      expect.objectContaining({ user: { sub: 'user-1', aid: 'account-1', scopeLevel: 'SYSTEM' } })
    )
  })
})
