import { IdentityAuditService } from '../application/services/identity-audit.service'
import { createApiKeyFixture, createServiceAccountFixture } from '../../test/helpers/machine-fixtures'

describe('identity audit service', () => {
  it('应发出符合统一 envelope 的 API_KEY_AUTHENTICATED 审计事件', () => {
    const eventEmitter = {
      emit: jest.fn()
    } as any
    const service = new IdentityAuditService(eventEmitter)
    const apiKey = createApiKeyFixture()
    const account = createServiceAccountFixture({ id: apiKey.serviceAccountId })

    service.emitApiKeyAuthenticated(apiKey, account)

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      IdentityAuditService.EVENT_NAME,
      expect.objectContaining({
        service: 'identity-service',
        eventType: 'API_KEY_AUTHENTICATED',
        module: 'machine',
        eventId: expect.any(String),
        result: 'SUCCEEDED',
        operator: {
          operatorId: null,
          operatorType: 'SYSTEM'
        },
        scope: {
          tenantId: account.tenantId,
          orgId: null
        },
        trace: expect.objectContaining({
          traceId: null
        }),
        resource: {
          resourceType: 'api_key',
          resourceId: apiKey.id
        },
        details: expect.objectContaining({
          apiKeyId: apiKey.id,
          serviceAccountId: account.id
        })
      })
    )
  })
})
