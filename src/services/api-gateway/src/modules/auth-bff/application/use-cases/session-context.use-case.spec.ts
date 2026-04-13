import { UnauthorizedException } from '@nestjs/common'
import { SessionContextUseCase } from './session-context.use-case'

describe('SessionContextUseCase', () => {
  it('builds the minimal authenticated workbench context from JWT and identity summaries', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-1',
          userId: 'user-1',
          tenantId: 'tenant-1',
          displayName: 'Vic Chen @ Meilong Ceramics',
          scopeLevel: 'TENANT',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn().mockResolvedValue({
        tenant: {
          id: 'tenant-1',
          code: 'meilong',
          name: 'Meilong Ceramics',
          isActive: true
        }
      })
    }

    const useCase = new SessionContextUseCase(identityAdapter as any)
    const result = await useCase.execute({
      user: {
        sub: 'user-1',
        aid: 'account-1',
        tid: 'tenant-1'
      },
      requestId: 'req-1',
      traceId: 'trace-1'
    } as any)

    expect(identityAdapter.getAccountById).toHaveBeenCalledWith(
      'account-1',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(identityAdapter.getTenantById).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(result).toEqual({
      operator: {
        userId: 'user-1',
        displayName: 'Vic Chen @ Meilong Ceramics',
        scopeLevel: 'TENANT'
      },
      account: {
        accountId: 'account-1',
        name: 'Vic Chen @ Meilong Ceramics',
        scopeLevel: 'TENANT'
      },
      tenant: {
        tenantId: 'tenant-1',
        name: 'Meilong Ceramics'
      },
      org: null,
      navigation: {
        defaultEntry: 'workbench.home',
        visibleEntries: ['workbench.home'],
        defaultHomePath: '/workbench/home',
        menus: []
      },
      access: {
        actionCodes: []
      },
      scopeLevel: 'TENANT'
    })
  })

  it('builds a system platform context without tenant lookup', async () => {
    const identityAdapter = {
      getAccountById: jest.fn().mockResolvedValue({
        account: {
          id: 'account-system',
          userId: 'user-1',
          tenantId: '',
          displayName: 'Platform Admin',
          scopeLevel: 'SYSTEM',
          isEnabled: true
        }
      }),
      getTenantById: jest.fn()
    }

    const useCase = new SessionContextUseCase(identityAdapter as any)
    const result = await useCase.execute({
      user: {
        sub: 'user-1',
        aid: 'account-system',
        scopeLevel: 'SYSTEM'
      }
    } as any)

    expect(identityAdapter.getTenantById).not.toHaveBeenCalled()
    expect(result).toEqual(
      expect.objectContaining({
        operator: {
          userId: 'user-1',
          displayName: 'Platform Admin',
          scopeLevel: 'SYSTEM'
        },
        account: {
          accountId: 'account-system',
          name: 'Platform Admin',
          scopeLevel: 'SYSTEM'
        },
        tenant: null,
        navigation: {
          defaultEntry: 'platform.home',
          visibleEntries: ['platform.home'],
          defaultHomePath: '/platform/home',
          menus: []
        },
        scopeLevel: 'SYSTEM'
      })
    )
  })

  it('rejects session-context requests that do not carry a selected account', async () => {
    const useCase = new SessionContextUseCase({} as any)

    await expect(
      useCase.execute({
        user: { sub: 'user-1' }
      } as any)
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
