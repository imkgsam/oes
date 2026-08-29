import { LoginStatus } from '@oes/common/generated/auth_service'
import { hydrateAuthResponseTenantNames } from './auth-response-tenant-name.hydrator'

describe('hydrateAuthResponseTenantNames', () => {
  it('does not issue a tenant BUSINESS lookup before Gateway verifies a session', async () => {
    const adapter = { getTenantById: jest.fn() }
    const response = {
      status: LoginStatus.LOGIN_STATUS_ACCOUNT_SELECTION_REQUIRED,
      accounts: [{ accountId: 'account-1', tenantId: 'tenant-1' }]
    }

    await expect(
      hydrateAuthResponseTenantNames(response, { requestId: 'request-1' } as any, adapter as any)
    ).resolves.toBe(response)
    expect(adapter.getTenantById).not.toHaveBeenCalled()
  })
})
