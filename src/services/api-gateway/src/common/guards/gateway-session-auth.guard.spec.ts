import { GatewaySessionAuthGuard } from './gateway-session-auth.guard'

/** Exercises the post-verification handoff into Gateway's private source-credential vault. */
describe('GatewaySessionAuthGuard', () => {
  it('admits a HUMAN_SESSION opaque credential only after Auth validates the active session', async () => {
    const vault = { admitHumanSession: jest.fn() }
    const authAdapter = {
      validateAccessToken: jest.fn().mockResolvedValue({
        userId: 'user-1',
        accountId: 'account-1',
        sessionId: 'session-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1'
      })
    }
    const request = {
      headers: { authorization: 'Bearer verified.session.credential' }
    }
    const response = { once: jest.fn(), removeListener: jest.fn() }
    const context = {
      getType: () => 'http',
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    }
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) }

    await expect(
      new (GatewaySessionAuthGuard as any)(reflector, authAdapter, vault).canActivate(context)
    ).resolves.toBe(true)

    expect(vault.admitHumanSession).toHaveBeenCalledWith(request, expect.any(Object), response)
    expect(request).not.toHaveProperty('sourceCredential')
    expect(request).not.toHaveProperty('user.sourceCredential')
  })
})
