import { TenantSessionAccessService } from './tenant-session-access.service'

describe('TenantSessionAccessService', () => {
  it('allows tenant-scope access only when tenant-org reports ACTIVE status', async () => {
    const tenantLifecyclePort = {
      getTenantStatus: jest.fn().mockResolvedValue('ACTIVE')
    }
    const service = new TenantSessionAccessService(tenantLifecyclePort as any)

    await expect(
      service.assertAccountCanEstablishSession({
        accountId: 'account-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT'
      })
    ).resolves.toBeUndefined()

    expect(tenantLifecyclePort.getTenantStatus).toHaveBeenCalledWith('tenant-1')
  })

  it('rejects tenant-scope access when tenant-org reports SUSPENDED status', async () => {
    const tenantLifecyclePort = {
      getTenantStatus: jest.fn().mockResolvedValue('SUSPENDED')
    }
    const service = new TenantSessionAccessService(tenantLifecyclePort as any)

    await expect(
      service.assertSessionCanContinue({
        sessionId: 'session-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT'
      })
    ).rejects.toThrow('Tenant is not active for authentication')
  })

  it('fails closed when the tenant lifecycle owner projection is unavailable', async () => {
    const tenantLifecyclePort = {
      getTenantStatus: jest.fn().mockRejectedValue(new Error('tenant-org unavailable'))
    }
    const service = new TenantSessionAccessService(tenantLifecyclePort as any)

    await expect(
      service.assertSessionCanContinue({
        sessionId: 'session-1',
        tenantId: 'tenant-1',
        scopeLevel: 'TENANT'
      })
    ).rejects.toThrow('tenant-org unavailable')
  })

  it('does not ask tenant-org for SYSTEM scope access', async () => {
    const tenantLifecyclePort = {
      getTenantStatus: jest.fn()
    }
    const service = new TenantSessionAccessService(tenantLifecyclePort as any)

    await expect(
      service.assertSessionCanContinue({
        sessionId: 'session-system',
        tenantId: null,
        scopeLevel: 'SYSTEM'
      })
    ).resolves.toBeUndefined()

    expect(tenantLifecyclePort.getTenantStatus).not.toHaveBeenCalled()
  })

  it('filters account candidates by tenant-org ACTIVE status while keeping SYSTEM accounts', async () => {
    const tenantLifecyclePort = {
      getTenantStatus: jest.fn(async (tenantId: string) => {
        return tenantId === 'tenant-active' ? 'ACTIVE' : 'SUSPENDED'
      })
    }
    const service = new TenantSessionAccessService(tenantLifecyclePort as any)

    const result = await service.filterActiveAccountCandidates([
      {
        accountId: 'system-account',
        tenantId: null,
        scopeLevel: 'SYSTEM',
        displayName: 'System Account'
      },
      {
        accountId: 'active-tenant-account',
        tenantId: 'tenant-active',
        scopeLevel: 'TENANT',
        displayName: 'Active Tenant'
      },
      {
        accountId: 'suspended-tenant-account',
        tenantId: 'tenant-suspended',
        scopeLevel: 'TENANT',
        displayName: 'Suspended Tenant'
      }
    ])

    expect(result.map((account) => account.accountId)).toEqual([
      'system-account',
      'active-tenant-account'
    ])
    expect(tenantLifecyclePort.getTenantStatus).toHaveBeenCalledWith('tenant-active')
    expect(tenantLifecyclePort.getTenantStatus).toHaveBeenCalledWith('tenant-suspended')
  })
})
