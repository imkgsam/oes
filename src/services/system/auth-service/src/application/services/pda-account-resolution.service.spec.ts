import { PdaAccountResolutionService } from './pda-account-resolution.service'

describe('PdaAccountResolutionService', () => {
  const tenantAccount = (accountId: string, tenantId = 'tenant-bound') => ({
    accountId,
    tenantId,
    scopeLevel: 'TENANT' as const,
    displayName: accountId
  })

  it('denies when no account candidate belongs to the device-bound tenant', async () => {
    const service = new PdaAccountResolutionService(
      {
        getAvailableAccountsByUserId: jest.fn().mockResolvedValue([tenantAccount('account-1', 'tenant-other')]),
        getAccountById: jest.fn()
      } as any,
      {
        resolveAccountTerminalAccess: jest.fn()
      } as any
    )

    await expect(
      service.resolve({ userId: 'user-1', deviceBoundTenantId: 'tenant-bound' })
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: 'AUTH_TERMINAL_ACCESS_DENIED' })
    })
  })

  it('denies when more than one account candidate is PDA-allowed in the device-bound tenant', async () => {
    const service = new PdaAccountResolutionService(
      {
        getAvailableAccountsByUserId: jest
          .fn()
          .mockResolvedValue([tenantAccount('account-1'), tenantAccount('account-2')]),
        getAccountById: jest.fn()
      } as any,
      {
        resolveAccountTerminalAccess: jest.fn().mockResolvedValue({ allowed: true })
      } as any
    )

    await expect(
      service.resolve({ userId: 'user-1', deviceBoundTenantId: 'tenant-bound' })
    ).rejects.toMatchObject({
      definition: expect.objectContaining({ code: 'AUTH_TERMINAL_ACCESS_DENIED' })
    })
  })

  it('returns the only PDA-allowed account in the device-bound tenant', async () => {
    const identityService = {
      getAvailableAccountsByUserId: jest
        .fn()
        .mockResolvedValue([tenantAccount('account-1'), tenantAccount('account-2')]),
      getAccountById: jest.fn().mockResolvedValue({
        ...tenantAccount('account-2'),
        userId: 'user-1',
        isEnabled: true
      })
    }
    const permissionService = {
      resolveAccountTerminalAccess: jest.fn(async ({ accountId }: { accountId: string }) => ({
        allowed: accountId === 'account-2',
        effectiveAllowedTerminals: ['PDA'],
        reasonCode: '',
        resolutionSource: 'ROLE',
        matchedRoleIds: []
      }))
    }
    const service = new PdaAccountResolutionService(identityService as any, permissionService as any)

    await expect(
      service.resolve({ userId: 'user-1', deviceBoundTenantId: 'tenant-bound' })
    ).resolves.toEqual({
      account: {
        ...tenantAccount('account-2'),
        userId: 'user-1',
        isEnabled: true
      },
      terminalAccess: {
        allowed: true,
        effectiveAllowedTerminals: ['PDA'],
        reasonCode: '',
        resolutionSource: 'ROLE',
        matchedRoleIds: []
      }
    })
    expect(permissionService.resolveAccountTerminalAccess).toHaveBeenCalledWith({
      accountId: 'account-1',
      tenantId: 'tenant-bound',
      scopeLevel: 'TENANT',
      terminal: 'PDA'
    })
    expect(permissionService.resolveAccountTerminalAccess).toHaveBeenCalledWith({
      accountId: 'account-2',
      tenantId: 'tenant-bound',
      scopeLevel: 'TENANT',
      terminal: 'PDA'
    })
  })
})
