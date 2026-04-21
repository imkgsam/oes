import { UnauthorizedException } from '@nestjs/common'
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

    const useCase = new AccountProfileUseCase(
      sessionContextUseCase as any,
      accessSummaryUseCase as any,
      identityAdapter as any,
      identitySummaryPort as any
    )

    await expect(
      useCase.execute(
        {
          avatar: 'https://cdn.example.com/avatar/account-1.png',
          displayName: '陈双鹏',
          bio: '负责美隆陶瓷的外贸协同与重点客户经营。'
        },
        {
          user: { sub: 'user-1', aid: 'account-1', sid: 'session-1' }
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

    expect(identityAdapter.updateAccountProfile).toHaveBeenCalledWith(
      {
        accountId: 'account-1',
        avatarUrl: 'https://cdn.example.com/avatar/account-1.png',
        displayName: '陈双鹏',
        bio: '负责美隆陶瓷的外贸协同与重点客户经营。'
      },
      expect.objectContaining({ user: { sub: 'user-1', aid: 'account-1', sid: 'session-1' } })
    )
  })

  it('rejects mutation when current account id is missing', async () => {
    const useCase = new AccountProfileUseCase(
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { updateAccountProfile: jest.fn() } as any,
      { getPersonalCenterSummary: jest.fn() } as any
    )

    await expect(useCase.execute({}, { user: { sub: 'user-1' } } as any)).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })
})
