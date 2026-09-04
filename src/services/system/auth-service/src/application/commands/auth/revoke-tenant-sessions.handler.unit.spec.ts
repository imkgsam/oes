import { RevokeTenantSessionsCommand } from './revoke-tenant-sessions.command'
import { RevokeTenantSessionsHandler } from './revoke-tenant-sessions.handler'

describe('RevokeTenantSessionsHandler', () => {
  it('revokes only active TENANT scope sessions for the target tenant', async () => {
    const sessionRepository = {
      deleteActiveTenantScopeSessionsByTenantId: jest.fn().mockResolvedValue(2)
    }
    const handler = new RevokeTenantSessionsHandler(sessionRepository as any)

    await expect(
      handler.execute(new RevokeTenantSessionsCommand('tenant-1', 'TENANT_SUSPENDED'))
    ).resolves.toEqual({
      success: true,
      revokedSessionCount: 2
    })

    expect(sessionRepository.deleteActiveTenantScopeSessionsByTenantId).toHaveBeenCalledWith(
      'tenant-1'
    )
  })
})
