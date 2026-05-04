import { UnauthorizedException } from '@nestjs/common'
import { SessionContextsUseCase } from './session-contexts.use-case'

describe('SessionContextsUseCase', () => {
  it('lists authenticated contexts, enriches tenant names, and sorts current context first', async () => {
    const identityAdapter = {
      getAccountsByUserId: jest.fn().mockResolvedValue({
        accounts: [
          {
            accountId: 'account-tenant-b',
            tenantId: 'tenant-b',
            displayName: 'Zeta Operator',
            scopeLevel: 'TENANT'
          },
          {
            accountId: 'account-system',
            displayName: 'Platform Admin',
            scopeLevel: 'SYSTEM'
          },
          {
            accountId: 'account-current',
            tenantId: 'tenant-a',
            displayName: 'Alpha Operator',
            scopeLevel: 'TENANT'
          },
          {
            accountId: 'account-inactive',
            tenantId: 'tenant-c',
            displayName: 'Inactive Operator',
            scopeLevel: 'TENANT'
          }
        ]
      })
    }
    const tenantOrgAdapter = {
      getTenantById: jest
        .fn()
        .mockImplementation(async (tenantId: string) => ({
          tenant: {
            id: tenantId,
            name: tenantId === 'tenant-a' ? 'Alpha Tenant' : 'Zeta Tenant',
            isActive: tenantId !== 'tenant-c'
          }
        }))
    }

    const useCase = new SessionContextsUseCase(identityAdapter as any, tenantOrgAdapter as any)
    const source = {
      user: {
        sub: 'user-1',
        aid: 'account-current',
        tid: 'tenant-a',
        scopeLevel: 'TENANT'
      },
      requestId: 'req-1',
      traceId: 'trace-1'
    }

    await expect(useCase.execute(source as any)).resolves.toEqual({
      items: [
        {
          accountId: 'account-current',
          scopeLevel: 'TENANT',
          displayName: 'Alpha Operator',
          tenantId: 'tenant-a',
          tenantName: 'Alpha Tenant',
          isCurrent: true
        },
        {
          accountId: 'account-system',
          scopeLevel: 'SYSTEM',
          displayName: 'Platform Admin',
          tenantId: null,
          tenantName: null,
          isCurrent: false
        },
        {
          accountId: 'account-tenant-b',
          scopeLevel: 'TENANT',
          displayName: 'Zeta Operator',
          tenantId: 'tenant-b',
          tenantName: 'Zeta Tenant',
          isCurrent: false
        }
      ]
    })

    expect(identityAdapter.getAccountsByUserId).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(tenantOrgAdapter.getTenantById).toHaveBeenCalledTimes(3)
    expect(tenantOrgAdapter.getTenantById).toHaveBeenCalledWith(
      'tenant-a',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(tenantOrgAdapter.getTenantById).toHaveBeenCalledWith(
      'tenant-b',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
    expect(tenantOrgAdapter.getTenantById).toHaveBeenCalledWith(
      'tenant-c',
      expect.objectContaining({ requestId: 'req-1', traceId: 'trace-1' })
    )
  })

  it('rejects unauthenticated requests without a user id', async () => {
    const useCase = new SessionContextsUseCase({} as any, {} as any)

    await expect(
      useCase.execute({
        user: {}
      } as any)
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
